import test from 'node:test';
import assert from 'node:assert/strict';
import { Microphone } from './microphone.ts';
for (const sampleRate of [44100, 48000, 96000]) {
  test(`chord capture reads one continuous native snapshot at ${sampleRate} Hz`, () => {
    let reads = 0;
    let event;
    const microphone = new Microphone(() => {}, value => {
      event = value;
    }, () => {});
    microphone.context = {
      state: 'running',
      currentTime: 1,
      sampleRate
    };
    microphone.calibrationEnd = 0;
    microphone.pitchBuffer = new Float32Array(2048);
    microphone.analyser = {
      getFloatTimeDomainData(buffer) {
        buffer.fill(0);
      }
    };
    microphone.chordAnalyser = {
      getFloatTimeDomainData(buffer) {
        reads++;
        assert.equal(buffer.length, 16384);
        for (let index = 0; index < buffer.length; index++) {
          buffer[index] = 0.1 * Math.sin(2 * Math.PI * 110 * index / sampleRate);
        }
      }
    };
    microphone.pending = {
      time: 0.5,
      due: 0.9
    };
    microphone.sample();
    assert.equal(reads, 1);
    assert.equal(event.time, 0.5);
    assert.equal(event.sampleRate, sampleRate);
    assert.equal(event.fftSize, 16384);
    const peak = event.spectrum.indexOf(Math.max(...event.spectrum));
    assert.ok(Math.abs(peak * sampleRate / 16384 - 110) < sampleRate / 16384);
  });
}
