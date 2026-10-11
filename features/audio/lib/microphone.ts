import { PitchDetector } from 'pitchy';
import Meyda from 'meyda';
import { noiseFloor, signalThreshold, OnsetDetector, toDb } from './audio-levels.ts';
const PITCH_BUFFER_SIZE = 2048;
const SPECTRUM_BUFFER_SIZE = 16384;
const FRAME_MS = 40;
const CALIBRATION_SECONDS = 2;
const STRUM_WINDOW_SECONDS = 0.42;

/**
 * Manages Web Audio resources.
 * Single-note tuner frames use a small 2048 buffer for fast tracking;
 * chord capture reads one continuous native 16384-sample snapshot so low guitar fundamentals
 * (~82 Hz, ~110 Hz, ~146 Hz) resolve to sharp FFT bins.
 */
export type AudioFrame = {
  rms: number; frequency: number; clarity: number;
  contextState?: AudioContextState; calibrating?: boolean; clipping?: boolean;
  audible?: boolean; noisy?: boolean; label?: string; settings?: MediaTrackSettings;
  db?: number; noiseDb?: number; thresholdDb?: number;
};
export type StrumEvent = { time: number; spectrum: Float32Array; sampleRate: number; fftSize: number };
export class Microphone {
  onFrame: (frame: AudioFrame) => void;
  onStrum: (event: StrumEvent) => void;
  onDisconnect: () => void;
  closed: boolean;
  noise: number[];
  onset: OnsetDetector;
  pending: { time: number; due: number } | null;
  chordBuffer: Float32Array<ArrayBuffer>;
  context!: AudioContext;
  stream?: MediaStream;
  source?: MediaStreamAudioSourceNode;
  filter?: BiquadFilterNode;
  analyser!: AnalyserNode;
  chordAnalyser!: AnalyserNode;
  output?: GainNode;
  settings?: MediaTrackSettings;
  label?: string;
  pitchBuffer!: Float32Array<ArrayBuffer>;
  detector!: PitchDetector<Float32Array>;
  calibrationEnd = 0;
  timer?: ReturnType<typeof setInterval>;

  constructor(onFrame: (frame: AudioFrame) => void, onStrum: (event: StrumEvent) => void, onDisconnect: () => void) {
    this.onFrame = onFrame;
    this.onStrum = onStrum;
    this.onDisconnect = onDisconnect;
    this.closed = false;
    this.noise = [];
    this.onset = new OnsetDetector();
    this.pending = null;
    this.chordBuffer = new Float32Array(SPECTRUM_BUFFER_SIZE);
  }
  async start({
    deviceId = '',
    autoGainControl = false
  } = {}) {
    try {
      this.context = new AudioContext();
      await this.context.resume();
      if (this.closed) {
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl,
          ...(deviceId ? {
            deviceId: {
              exact: deviceId
            }
          } : {})
        }
      });
      if (this.closed) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      this.stream = stream;
      this.source = this.context.createMediaStreamSource(stream);
      this.filter = this.context.createBiquadFilter();
      this.filter.type = 'highpass';
      this.filter.frequency.value = 60;
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = PITCH_BUFFER_SIZE;
      this.source.connect(this.filter);
      this.filter.connect(this.analyser);
      this.chordAnalyser = this.context.createAnalyser();
      this.chordAnalyser.fftSize = SPECTRUM_BUFFER_SIZE;
      this.filter.connect(this.chordAnalyser);
      this.context.onstatechange = () => {
        if (!this.closed && this.context.state !== 'running') {
          this.pending = null;
          this.onFrame({
            rms: 0,
            frequency: 0,
            clarity: 0,
            contextState: this.context.state
          });
        }
      };
      this.output = this.context.createGain();
      this.output.gain.value = 0;
      this.analyser.connect(this.output);
      this.output.connect(this.context.destination);
      this.settings = stream.getAudioTracks()[0].getSettings();
      this.label = stream.getAudioTracks()[0].label;
      this.pitchBuffer = new Float32Array(PITCH_BUFFER_SIZE);
      this.detector = PitchDetector.forFloat32Array(PITCH_BUFFER_SIZE);
      Meyda.bufferSize = SPECTRUM_BUFFER_SIZE;
      Meyda.sampleRate = this.context.sampleRate;
      this.calibrationEnd = this.context.currentTime + CALIBRATION_SECONDS;
      for (const track of stream.getTracks()) {
        track.onended = () => {
          this.stop();
          this.onDisconnect();
        };
      }
      this.timer = setInterval(() => this.sample(), FRAME_MS);
    } catch (error) {
      this.stop();
      throw error;
    }
  }
  sample() {
    if (this.closed || this.context.state !== 'running') {
      return;
    }
    this.analyser.getFloatTimeDomainData(this.pitchBuffer);
    let sumSquares = 0;
    for (let i = 0; i < this.pitchBuffer.length; i++) {
      sumSquares += this.pitchBuffer[i] * this.pitchBuffer[i];
    }
    const invalidSamples = this.pitchBuffer.some(value => !Number.isFinite(value));
    const rms = invalidSamples ? 0 : Math.sqrt(sumSquares / this.pitchBuffer.length);
    const now = this.context.currentTime;
    const calibrating = now < this.calibrationEnd;
    if (calibrating && !invalidSamples) {
      this.noise.push(rms);
    }
    const floor = noiseFloor(this.noise);
    const threshold = signalThreshold(floor);
    const clipping = invalidSamples || this.pitchBuffer.some(value => Math.abs(value) >= 0.99);
    const audible = rms > threshold && !clipping && !calibrating;
    const [frequency, clarity] = audible ? this.detector.findPitch(this.pitchBuffer, this.context.sampleRate) : [0, 0];
    this.onFrame({
      rms,
      db: toDb(rms),
      noiseDb: toDb(floor),
      thresholdDb: toDb(threshold),
      frequency,
      clarity,
      calibrating,
      clipping,
      audible,
      noisy: floor > 0.03,
      label: this.label,
      settings: this.settings,
      contextState: this.context.state
    });
    const onset = this.onset.update(rms, threshold, now);
    const validCapture = !calibrating && !clipping && floor <= 0.03;
    if (!validCapture) {
      this.pending = null;
    }
    if (validCapture && audible && onset && !this.pending) {
      this.pending = {
        time: performance.now() / 1000,
        due: now + STRUM_WINDOW_SECONDS
      };
    }
    if (this.pending && now >= this.pending.due) {
      const {
        time
      } = this.pending;
      this.pending = null;
      this.chordAnalyser.getFloatTimeDomainData(this.chordBuffer);
      const snapshot = this.chordBuffer;
      // Reject clipping anywhere in the longer capture, not just the latest tuner frame.
      if (snapshot.some(value => !Number.isFinite(value) || Math.abs(value) >= 0.99)) {
        return;
      }
      Meyda.bufferSize = SPECTRUM_BUFFER_SIZE;
      Meyda.sampleRate = this.context.sampleRate;
      const spectrum = Meyda.extract(['amplitudeSpectrum'], snapshot)?.amplitudeSpectrum;
      if (spectrum) {
        this.onStrum({
          time,
          spectrum: new Float32Array(spectrum),
          sampleRate: this.context.sampleRate,
          fftSize: SPECTRUM_BUFFER_SIZE
        });
      }
    }
  }
  stop() {
    this.closed = true;
    clearInterval(this.timer);
    this.source?.disconnect();
    this.filter?.disconnect();
    this.analyser?.disconnect();
    this.chordAnalyser?.disconnect();
    if (this.context) {
      this.context.onstatechange = null;
    }
    this.output?.disconnect();
    this.stream?.getTracks().forEach(track => {
      track.onended = null;
      track.stop();
    });
    if (this.context && this.context.state !== 'closed') {
      void this.context.close().catch(() => {
        // Tracks and nodes are already released; a closing context needs no retry.
      });
    }
  }
}
