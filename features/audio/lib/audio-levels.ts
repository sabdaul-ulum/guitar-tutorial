import type { AudioFrame } from './microphone.ts';

export function resetStringCheckIfInvalid(
  state: { stable: number; quiet: boolean },
  frame: Pick<AudioFrame, 'contextState' | 'calibrating' | 'clipping' | 'noisy'>
) {
  const invalid = frame.contextState !== 'running' || frame.calibrating || frame.clipping || frame.noisy;
  if (invalid) {
    state.stable = 0;
    state.quiet = true;
  }
  return Boolean(invalid);
}

export function toDb(rms: number) {
  return Number.isFinite(rms) && rms > 0 ? Math.max(-100, 20 * Math.log10(rms)) : -100;
}
export function meterLevel(rms: number) {
  return Math.max(0, Math.min(100, (toDb(rms) + 80) / 80 * 100));
}
export function noiseFloor(samples: number[]) {
  const sorted = samples.filter(Number.isFinite).sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
}

// Relative signal-to-noise gating; pitch/chord acceptance remains unchanged.
export function signalThreshold(floor: number) {
  return Math.max(0.0001, floor * 10 ** (10 / 20));
}
export class OnsetDetector {
  baseline: number;
  lastTime: number;
  constructor() {
    this.baseline = -100;
    this.lastTime = -10;
  }
  update(rms: number, threshold: number, time: number) {
    const db = toDb(rms);
    const onset = rms > threshold && db - this.baseline >= 4 && time - this.lastTime > 0.65;
    if (onset) {
      this.lastTime = time;
    }
    this.baseline += (db - this.baseline) * (db > this.baseline ? 0.45 : 0.2);
    return onset;
  }
}
export function describePitch(frequency: number) {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    return null;
  }
  const exact = 69 + 12 * Math.log2(frequency / 440);
  const midi = Math.round(exact);
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  return {
    midi,
    name: `${names[(midi % 12 + 12) % 12]}${Math.floor(midi / 12) - 1}`,
    cents: Math.round((exact - midi) * 100)
  };
}
export function microphoneError(error: unknown) {
  const messages: Record<string, string> = {
    NotAllowedError: 'Izin mikrofon ditolak. Izinkan mikrofon di pengaturan situs browser.',
    NotFoundError: 'Tidak ada perangkat input. Sambungkan mikrofon lalu muat ulang daftar.',
    NotReadableError: 'Mikrofon sedang dipakai atau tidak dapat dibuka. Periksa aplikasi lain.',
    OverconstrainedError: 'Perangkat yang dipilih tidak tersedia. Pilih input lain.'
  };
  return messages[error && typeof error === 'object' && 'name' in error && typeof error.name === 'string' ? error.name : ''] || 'Audio tidak tersedia. Gunakan localhost/HTTPS dan periksa perangkat input.';
}
