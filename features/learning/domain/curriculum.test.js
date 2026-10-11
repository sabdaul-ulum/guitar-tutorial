import test from 'node:test';
import assert from 'node:assert/strict';
import { PitchDetector } from 'pitchy';
import Meyda from 'meyda';
import { LESSONS, SINGLE_LESSONS, TRANSITION_LESSONS, isKnownLesson, playableStrings, pitchMatches, CHORDS, COURSES, rhythmTarget, nextTransitionChord } from './curriculum.ts';
import { readProgress } from '../../progress/domain/progress.ts';
import { Exercise } from './exercise.ts';
import { verifyChord, voicing } from '../../audio/lib/chord-analysis.ts';
test('downstroke starts at 60 and syncopation at 40 BPM, advancing to 80 in steps of 10', () => {
  for (const [id, min] of [['strum-basic', 60], ['strum-next', 40]]) {
    const lesson = LESSONS.find(lesson => lesson.id === id);
    const exercise = new Exercise(lesson.tempo);
    assert.equal(exercise.tempo, min);
    assert.equal(exercise.max, 80);
    assert.equal(exercise.step, 10);
    for (let tempo = min + 10; tempo <= 80; tempo += 10) {
      for (let i = 0; i < 8; i++) exercise.record(true);
      assert.equal(exercise.tempo, tempo);
    }
  }
});
test('practical curriculum introduces chords before transitions and rhythm complexity', () => {
  const position = id => LESSONS.findIndex(lesson => lesson.id === id);
  assert.equal(COURSES.length, 10);
  assert.equal(new Set(LESSONS.map(l => l.id)).size, LESSONS.length);
  for (const chord of Object.keys(CHORDS)) {
    assert.ok(SINGLE_LESSONS.some(l => l.chords.includes(chord)), chord);
    assert.deepEqual([...new Set(voicing(CHORDS[chord]).map(midi => midi % 12))].sort(), [...CHORDS[chord].notes].sort(), chord);
  }
  assert.ok(LESSONS.every(l => ['single', 'transition', 'strumming'].includes(l.kind) && l.chords.length > 0));
  assert.ok(COURSES.every((_, course) => LESSONS.some(l => l.course === course)));
  assert.ok(position('single-A') < position('single-Em'));
  assert.ok(position('strum-basic') < position('single-C'));
  assert.ok(position('strum-eighths') < position('strum-next'));
  assert.ok(position('pair-e5-a5') < position('single-F'));
  assert.equal(isKnownLesson('song-frere-c'), false);
  assert.equal(isKnownLesson('guide-1-0'), false);
  for (let i = 1; i < LESSONS.length; i++) {
    assert.ok(LESSONS[i - 1].course <= LESSONS[i].course);
  }
  const eighths = LESSONS.find(lesson => lesson.id === 'strum-eighths');
  assert.deepEqual(eighths.directions, ['↓', '↑', '↓', '↑', '↓', '↑', '↓', '↑']);
  for (let i = 0; i < 8; i++) assert.equal(rhythmTarget(eighths, i, 40).interval, 0.75);
});
test('transition choices vary without repeating current chord', () => {
  assert.equal(nextTransitionChord(['C', 'D', 'E'], 'C', () => 0), 'D');
  assert.equal(nextTransitionChord(['C', 'D', 'E'], 'C', () => 0.99), 'E');
  assert.equal(nextTransitionChord(['Em', 'Am'], 'Em'), 'Am');
  assert.equal(nextTransitionChord(['Em'], 'Em'), 'Em');
});
test('all known lessons open without prerequisites; unknown IDs stay rejected', () => {
  assert.deepEqual(SINGLE_LESSONS[0].chords, ['A']);
  assert.equal(isKnownLesson('unknown'), false);
  for (const lesson of LESSONS) assert.equal(isKnownLesson(lesson.id), true);
});
test('removed songs are excluded from progress without resetting retained exercises', () => {
  assert.deepEqual(readProgress({ version: 2, completed: ['song-frere-c', 'single-Am'] }), ['single-Am']);
  const introduced = new Set();
  for (const lesson of LESSONS) {
    if (lesson.kind === 'single') lesson.chords.forEach(chord => introduced.add(chord));
    if (lesson.kind === 'strumming' || lesson.kind === 'transition') {
      assert.ok(lesson.chords.every(chord => introduced.has(chord)), lesson.id);
    }
  }
});
test('progress validates schemas and preserves out-of-order completion', () => {
  assert.deepEqual(readProgress({
    version: 1,
    completed: ['single-Em']
  }), []);
  assert.deepEqual(readProgress({
    version: 2,
    completed: ['single-Am', 'unknown', 'single-Am']
  }), ['single-Am']);
  assert.equal(isKnownLesson('pair-em-am'), true);
  assert.deepEqual(readProgress({
    version: 2,
    completed: ['single-Em', 'single-Am']
  }), ['single-Em', 'single-Am']);
});
test('courses contain playable lessons and strumming targets wrap at bar boundaries', () => {
  assert.equal(new Set(LESSONS.map(lesson => lesson.id)).size, LESSONS.length);
  for (const [index] of COURSES.entries()) assert.ok(LESSONS.some(lesson => lesson.course === index));
  for (const lesson of LESSONS) for (const chord of lesson.chords) assert.ok(CHORDS[chord]);
  const basic = LESSONS.find(lesson => lesson.id === 'strum-basic');
  assert.equal(rhythmTarget(basic, 3, 60).chord, 'A');
  assert.equal(rhythmTarget(basic, 4, 60).chord, 'D');
  assert.equal(rhythmTarget(basic, 3, 60).interval, 1);
  const next = LESSONS.find(lesson => lesson.id === 'strum-next');
  assert.equal(rhythmTarget(next, 5, 30).interval, 1);
  assert.equal(rhythmTarget(next, 6, 30).chord, 'Am');
  assert.equal(rhythmTarget(TRANSITION_LESSONS[0], 1, 60).interval, 4);
});
test('Am excludes low E and includes correct fretted notes', () => {
  assert.deepEqual(playableStrings('Am').map(string => string.midi), [45, 52, 57, 60, 64]);
});
test('Pitchy detects synthetic low E and pitch validation rejects wrong octave', () => {
  const signal = Float32Array.from({
    length: 4096
  }, (_, i) => .2 * Math.sin(2 * Math.PI * 82.4069 * i / 48000));
  const [frequency, clarity] = PitchDetector.forFloat32Array(signal.length).findPitch(signal, 48000);
  assert.equal(pitchMatches(frequency, clarity, 40), true);
  assert.equal(pitchMatches(frequency * 2, clarity, 40), false);
  assert.equal(pitchMatches(frequency, .2, 40), false);
});
test('synthetic spectrum accepts target chord and rejects competing chords', () => {
  const sampleRate = 48000;
  const fftSize = 16384;
  const binHz = sampleRate / fftSize;
  const spectrum = new Float32Array(fftSize / 2);
  for (const midi of voicing(CHORDS.Em)) {
    const f0 = 440 * 2 ** ((midi - 69) / 12);
    for (let h = 1; h <= 3; h++) {
      const bin = Math.round(f0 * h / binHz);
      if (bin < spectrum.length) {
        spectrum[bin] += 1 / Math.sqrt(h);
      }
    }
  }
  const emResult = verifyChord(spectrum, sampleRate, fftSize, 'Em');
  assert.equal(emResult.accepted, true);
  assert.ok(emResult.evidenceDb > 3);
  for (const comp of ['Am', 'E', 'G', 'C']) {
    assert.equal(verifyChord(spectrum, sampleRate, fftSize, comp).accepted, false);
  }
});
test('verifyChord rejects silence, flat noise, and invalid configurations', () => {
  const silence = new Float32Array(8192);
  assert.equal(verifyChord(silence, 48000, 16384, 'Em').accepted, false);
  const flat = new Float32Array(8192).fill(0.1);
  assert.equal(verifyChord(flat, 48000, 16384, 'Em').accepted, false);
  assert.throws(() => verifyChord(silence, 48000, 16384, 'Unsupported'), RangeError);
  assert.equal(verifyChord(null, 48000, 16384, 'Em').accepted, false);
});
test('verifyChord rejects invalid magnitudes and mismatched spectrum lengths', () => {
  for (const value of [NaN, Infinity, -Infinity, -1, Number.MAX_VALUE]) {
    assert.equal(verifyChord(new Float64Array(8192).fill(value), 48000, 16384, 'Em').accepted, false, String(value));
  }
  for (const length of [1, 8191, 8193]) {
    assert.equal(verifyChord(new Float32Array(length), 48000, 16384, 'Em').accepted, false);
  }
});

test('Meyda distinguishes sevenths, sus2 and simpler chords in both directions at ±20 cents', () => {
  const sampleRate = 44100;
  const fftSize = 16384;
  Meyda.bufferSize = fftSize;
  Meyda.sampleRate = sampleRate;
  for (const chord of Object.keys(CHORDS)) {
    for (const cents of [-20, 0, 20]) {
      const notes = playableStrings(chord).map(({
        midi
      }) => 440 * 2 ** ((midi - 69) / 12 + cents / 1200));
      const signal = Float32Array.from({
        length: fftSize
      }, (_, index) => {
        let v = 0;
        for (const f0 of notes) {
          v += 0.05 * Math.sin(2 * Math.PI * f0 * index / sampleRate);
          v += 0.03 * Math.sin(2 * Math.PI * f0 * 2 * index / sampleRate);
          v += 0.015 * Math.sin(2 * Math.PI * f0 * 3 * index / sampleRate);
        }
        return v;
      });
      const spectrum = Meyda.extract('amplitudeSpectrum', signal);
      assert.ok(spectrum, 'Spectrum was extracted');
      const result = verifyChord(spectrum, sampleRate, fftSize, chord);
      assert.equal(result.accepted, true, `${chord} at ${cents} cents`);
      for (const other of Object.keys(CHORDS).filter(name => name !== chord)) {
        assert.equal(verifyChord(spectrum, sampleRate, fftSize, other).accepted, false, `${chord} mistaken for ${other}`);
      }
    }
  }
});
