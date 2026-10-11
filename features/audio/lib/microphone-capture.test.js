import test from 'node:test';
import assert from 'node:assert/strict';
import { Microphone } from './microphone.ts';

function capture() {
  let events = 0;
  let level = 0.1;
  let snapshotLevel = 0.1;
  const microphone = new Microphone(() => {}, () => events++, () => {});
  microphone.context = { state: 'running', currentTime: 1, sampleRate: 48000 };
  microphone.pitchBuffer = new Float32Array(2048);
  microphone.detector = { findPitch: () => [110, 1] };
  microphone.analyser = { getFloatTimeDomainData: buffer => buffer.fill(level) };
  microphone.chordAnalyser = { getFloatTimeDomainData: buffer => buffer.fill(snapshotLevel) };
  microphone.sample();
  assert.ok(microphone.pending, 'valid onset schedules capture');
  return {
    microphone,
    setLevel: value => { level = value; },
    setSnapshotLevel: value => { snapshotLevel = value; },
    events: () => events
  };
}

for (const issue of ['clipping', 'calibrating', 'noise']) {
  test(`${issue} cancels pending capture before its deadline`, () => {
    const fixture = capture();
    const { microphone } = fixture;
    if (issue === 'clipping') fixture.setLevel(1);
    if (issue === 'calibrating') microphone.calibrationEnd = 2;
    if (issue === 'noise') microphone.noise = [0.04];
    microphone.context.currentTime = 1.1;
    microphone.sample();
    assert.equal(microphone.pending, null);
    fixture.setLevel(0);
    microphone.context.currentTime = 1.5;
    microphone.sample();
    assert.equal(fixture.events(), 0);
  });
}

for (const level of [NaN, Infinity, -Infinity]) {
  test(`non-finite tuner samples (${level}) cancel capture and allow recovery`, () => {
    const fixture = capture();
    const { microphone } = fixture;
    const frames = [];
    microphone.onFrame = frame => frames.push(frame);
    fixture.setLevel(level);
    microphone.context.currentTime = 1.1;
    microphone.sample();
    assert.equal(microphone.pending, null);
    assert.equal(frames[0].clipping, true);
    assert.equal(frames[0].audible, false);
    assert.equal(frames[0].rms, 0);
    fixture.setLevel(0);
    microphone.context.currentTime = 1.5;
    microphone.sample();
    assert.equal(fixture.events(), 0);
    fixture.setLevel(0.1);
    microphone.context.currentTime = 2;
    microphone.sample();
    assert.ok(microphone.pending, 'a clean onset can schedule capture again');
    microphone.calibrationEnd = 3;
    fixture.setLevel(level);
    microphone.sample();
    assert.deepEqual(microphone.noise, [], 'invalid samples cannot bias calibration');
  });
}

for (const level of [1, NaN, Infinity, -Infinity]) {
  test(`invalid snapshot (${level}) cannot emit a strum despite a clean tuner frame`, () => {
    const fixture = capture();
    fixture.setSnapshotLevel(level);
    fixture.microphone.context.currentTime = 1.5;
    fixture.microphone.sample();
    assert.equal(fixture.microphone.pending, null);
    assert.equal(fixture.events(), 0);
  });
}
