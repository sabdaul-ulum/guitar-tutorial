import test from 'node:test';
import assert from 'node:assert/strict';
import { Exercise } from './exercise.ts';
const play = (e, values) => values.forEach(value => e.record(value));
test('7/8 raises tempo and resets segment', () => {
  const e = new Exercise();
  play(e, [true, true, false, true, true, true, true, true]);
  assert.equal(e.tempo, 70);
  assert.equal(e.count, 0);
});
test('5/8 raises tempo', () => {
  const e = new Exercise();
  play(e, [false, true, false, true, false, true, true, true]);
  assert.equal(e.tempo, 70);
  assert.equal(e.count, 0);
});
test('three consecutive errors lower tempo, never below minimum', () => {
  const e = new Exercise();
  e.tempo = 80;
  play(e, [false, false, false]);
  assert.equal(e.tempo, 70);
  play(e, Array(9).fill(false));
  assert.equal(e.tempo, 60);
});
test('minimum tempo keeps the segment after three misses and can recover to graduation', () => {
  const e = new Exercise();
  play(e, [false, false, false]);
  assert.equal(e.count, 3);
  assert.equal(e.history.length, 0);
  play(e, Array(5).fill(true));
  assert.equal(e.tempo, 70);
  assert.equal(e.history[0].count, 8);
  assert.equal(e.history[0].hits, 5);
  play(e, Array(8).fill(true));
  assert.equal(e.tempo, 80);
  play(e, Array(16).fill(true));
  assert.equal(e.passed, true);
});
test('missed minimum-tempo segment restarts only after all targets', () => {
  const e = new Exercise();
  play(e, Array(7).fill(false));
  assert.equal(e.count, 7);
  assert.equal(e.history.length, 0);
  e.record(false);
  assert.equal(e.count, 0);
  assert.equal(e.tempo, e.min);
  assert.equal(e.history[0].count, 8);
});
test('4/8 lowers tempo without consecutive failure', () => {
  const e = new Exercise();
  e.tempo = 70;
  play(e, [true, false, true, false, true, false, true, false]);
  assert.equal(e.tempo, 60);
});
test('slow correct answers cannot pass; 13/16 at maximum passes', () => {
  const e = new Exercise();
  play(e, Array(16).fill(true));
  assert.equal(e.tempo, 80);
  assert.equal(e.passed, false);
  play(e, [false, true, true, true, false, true, true, true, false, true, true, true, true, true, true, true]);
  assert.equal(e.passed, true);
  assert.equal(e.hits, 13);
});
test('failed proof is discarded after tempo drops', () => {
  const e = new Exercise();
  e.tempo = 80;
  play(e, [true, true, false, false, false]);
  assert.equal(e.tempo, 70);
  assert.equal(e.hits, 0);
  play(e, Array(8).fill(true));
  assert.equal(e.tempo, 80);
  assert.equal(e.hits, 0);
  assert.equal(e.passed, false);
});
test('12/16 repeats proof without accumulating hits', () => {
  const e = new Exercise();
  e.tempo = 80;
  play(e, Array.from({
    length: 16
  }, (_, i) => i % 4 !== 0));
  assert.equal(e.tempo, 80);
  assert.equal(e.hits, 0);
  assert.equal(e.passed, false);
});
test('completed exercise does not change', () => {
  const e = new Exercise();
  e.tempo = 80;
  play(e, Array(16).fill(true));
  e.record(false);
  assert.equal(e.total, 16);
});
test('invalid target results cannot mutate progress', () => {
  const exercise = new Exercise();
  assert.throws(() => exercise.record('true'), TypeError);
  assert.equal(exercise.total, 0);
});
