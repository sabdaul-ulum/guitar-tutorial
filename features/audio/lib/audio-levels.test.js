import test from 'node:test';
import assert from 'node:assert/strict';
import { toDb, meterLevel, noiseFloor, signalThreshold, OnsetDetector, describePitch, microphoneError } from './audio-levels.ts';
test('dB meter displays quiet guitar without claiming chord accuracy', () => {
  assert.equal(toDb(0), -100);
  assert.equal(toDb(0.01), -40);
  assert.equal(meterLevel(0.01), 50);
  assert.equal(meterLevel(0), 0);
  assert.equal(meterLevel(2), 100);
});
test('median calibration resists isolated loud transients', () => {
  assert.equal(noiseFloor([0.001, 0.001, 0.8, 0.001, 0.002]), 0.001);
  assert.equal(noiseFloor([]), 0);
  assert.ok(signalThreshold(0.001) > 0.003);
  assert.ok(signalThreshold(0.0001) < 0.001);
});
test('onset detects low-level gradual attacks but not steady noise or sustain', () => {
  const detector = new OnsetDetector();
  const threshold = signalThreshold(0.0002);
  for (let i = 0; i < 40; i++) assert.equal(detector.update(0.0002, threshold, i * 0.05), false);
  let attacks = 0;
  for (const [index, rms] of [0.0003, 0.0005, 0.001, 0.002, 0.003, 0.003, 0.003].entries()) {
    if (detector.update(rms, threshold, 2 + index * 0.05)) {
      attacks++;
    }
  }
  assert.equal(attacks, 1);
  for (let i = 0; i < 30; i++) assert.equal(detector.update(0.003, threshold, 2.4 + i * 0.05), false);
  for (let i = 0; i < 30; i++) detector.update(0.0002, threshold, 4 + i * 0.05);
  assert.equal(detector.update(0.003, threshold, 6), true);
});
test('tuner describes notes and cents safely', () => {
  assert.deepEqual(describePitch(440), {
    midi: 69,
    name: 'A4',
    cents: 0
  });
  assert.equal(describePitch(82.4069).name, 'E2');
  assert.equal(describePitch(440 * 2 ** (20 / 1200)).cents, 20);
  assert.equal(describePitch(NaN), null);
  assert.match(microphoneError({
    name: 'NotAllowedError'
  }), /Izin/);
});
