import test from 'node:test';
import assert from 'node:assert/strict';
import { RhythmSession } from './rhythm-session.ts';
import { LESSONS } from './curriculum.ts';
test('four-beat preparation ends at the first track crossing for chord and strumming', () => {
  for (const id of ['single-Em', 'strum-basic', 'strum-next']) {
    for (const tempo of [40, 60, 70]) {
      const session = new RhythmSession(LESSONS.find(lesson => lesson.id === id));
      session.start(10, tempo);
      const first = session.current;
      assert.equal(session.startedAt, 10 + 240 / tempo);
      assert.equal(first.due, session.startedAt + 120 / tempo);
      for (const remaining of [4, 3, 2, 1]) {
        const now = session.startedAt - remaining * 60 / tempo + 0.001;
        const preparation = session.visual(now);
        assert.equal(preparation.countdown, remaining);
        assert.equal(preparation.beat, -1);
        assert.deepEqual(preparation.notes, []);
        assert.equal(session.match(now), null);
      }
      const approach = session.visual(session.startedAt);
      assert.equal(approach.countdown, 0);
      assert.equal(approach.beat, -1);
      assert.ok(Math.abs(approach.notes[0].position - 88) < 1e-9);
      assert.equal(session.visual(first.due).countdown, 0);
      session.tick(first.due, tempo);
      const visual = session.visual(first.due);
      assert.equal(visual.beat, 0);
      assert.equal(visual.notes.find(note => note.index === first.index).position, 18);
    }
  }
});
test('variable intervals advance visuals while old analysis waits', () => {
  const session = new RhythmSession(LESSONS.find(lesson => lesson.id === 'strum-next'));
  session.start(0, 40);
  assert.equal(session.startedAt, 6);
  const due = session.current.due;
  session.tick(due + 0.01, 40);
  assert.equal(session.current.index, 1);
  assert.equal(session.current.due, due + 1.5);
  session.tick(due + 1.51, 40);
  assert.equal(session.current.index, 2);
  assert.equal(session.current.due, due + 2.25);
  assert.equal(session.match(due + 1.5).index, 1);
  session.match(due + 1.5).result = true;
  assert.equal(session.tick(due + 1.6, 40)[0].result, true);
});
test('pause/resume discards old onsets and never repeats countdown', () => {
  const session = new RhythmSession(LESSONS.find(lesson => lesson.id === 'strum-basic'));
  session.start(0, 60);
  const old = session.current.due;
  session.pause();
  assert.equal(session.match(old), null);
  session.start(10, 60);
  assert.equal(session.startedAt, 10);
  assert.equal(session.match(old), null);
  assert.equal(session.match(session.current.due).chord, 'A');
  assert.equal(session.match(NaN), null);
});
test('miss deadline includes analysis delay; stalled clock pauses', () => {
  const session = new RhythmSession(LESSONS.find(lesson => lesson.id === 'strum-next'));
  session.start(0, 40);
  const due = session.current.due;
  assert.deepEqual(session.tick(due + 0.7, 40), []);
  assert.equal(session.tick(due + 1.21, 40)[0].result, null);
  session.tick(session.current.due + 3, 40);
  assert.equal(session.active, false);
});
test('tempo restart invalidates pending targets; transitions do not repeat', () => {
  const session = new RhythmSession(LESSONS.find(lesson => lesson.id === 'sequence'), () => 0);
  session.start(0, 60);
  const first = session.current;
  session.tick(first.due + 0.01, 60);
  assert.notEqual(session.current.chord, first.chord);
  session.start(first.due + 0.1, 70);
  assert.equal(session.startedAt, first.due + 0.1);
  assert.equal(session.targets.length, 1);
  assert.equal(session.match(first.due), null);
  assert.equal(session.current.tempo, 70);
});

test('track crossings share beat-guide phase across patterns, resume and tempo changes', () => {
  for (const lesson of LESSONS) {
    const session = new RhythmSession(lesson);
    for (const tempo of [40, 70]) {
      session.start(tempo, tempo);
      for (let step = 0; step < 11; step++) {
        const target = session.current;
        const expectedBeat = (lesson.pattern?.[target.index % lesson.pattern.length] ?? 0) * 2;
        session.tick(target.due, tempo);
        const visual = session.visual(target.due);
        assert.equal(visual.beat, expectedBeat, `${lesson.id}: target ${target.index}`);
        assert.equal(visual.playing.index, target.index);
        assert.equal(visual.playing.direction, lesson.directions?.[lesson.pattern.indexOf(visual.beat / 2)] || '');
        assert.equal(visual.notes.find(note => note.index === target.index).position, 18);
        const later = session.visual(target.due + 0.01);
        assert.ok(later.notes.find(note => note.index === target.index).position < 18);
      }
      session.pause();
    }
  }
});
