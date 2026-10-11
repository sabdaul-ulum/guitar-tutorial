
export type ChordName = keyof typeof CHORDS;
export type TempoConfig = {
  min?: number;
  max?: number;
  step?: number;
};
type LessonBase = {
  id: string;
  title: string;
  chords: ChordName[];
  course: number;
  tempo?: TempoConfig;
  tip?: string;
};
export type Lesson = LessonBase & (
  | { kind: 'single' | 'transition'; pattern?: never; directions?: never; source?: never }
  | { kind: 'strumming'; pattern: number[]; directions: string[]; source?: never }
);
export const PROOF_STRUMS = 5;
export const TIMING_TOLERANCE_SECONDS = 0.6;
export const ANALYSIS_GRACE_SECONDS = 0.6;
export type RhythmTarget = {
  chord: ChordName;
  direction: string;
  interval: number;
  tolerance?: number;
  index?: number;
};

export const CHORDS = Object.freeze({
  Em: {
    name: 'E minor',
    frets: [0, 2, 2, 0, 0, 0],
    notes: [4, 7, 11],
    tip: 'Jari tengah di senar A fret 2, jari manis di D fret 2. Mainkan semua senar.'
  },
  Am: {
    name: 'A minor',
    frets: [-1, 0, 2, 2, 1, 0],
    notes: [9, 0, 4],
    tip: 'Telunjuk di B fret 1, tengah di D fret 2, manis di G fret 2. Mulai dari senar A.'
  },
  C: {
    name: 'C major',
    frets: [-1, 3, 2, 0, 1, 0],
    notes: [0, 4, 7],
    tip: 'Manis di A fret 3, tengah di D fret 2, telunjuk di B fret 1. Mulai dari senar A.'
  },
  G: {
    name: 'G major',
    frets: [3, 2, 0, 0, 0, 3],
    notes: [7, 11, 2],
    tip: 'Tengah di E rendah fret 3, telunjuk di A fret 2, manis di e tinggi fret 3.'
  },
  D: {
    name: 'D major',
    frets: [-1, -1, 0, 2, 3, 2],
    notes: [2, 6, 9],
    tip: 'Telunjuk di G fret 2, manis di B fret 3, tengah di e fret 2. Mulai dari senar D.'
  },
  E: {
    name: 'E major',
    frets: [0, 2, 2, 1, 0, 0],
    notes: [4, 8, 11],
    tip: 'Telunjuk di G fret 1, tengah di A fret 2, manis di D fret 2. Mainkan semua senar.'
  },
  A: {
    name: 'A major',
    frets: [-1, 0, 2, 2, 2, 0],
    notes: [9, 1, 4],
    tip: 'Tekan D, G, dan B pada fret 2. Jangan mainkan senar E rendah.'
  },
  Dm: {
    name: 'D minor',
    frets: [-1, -1, 0, 2, 3, 1],
    notes: [2, 5, 9],
    tip: 'Telunjuk di e fret 1, tengah di G fret 2, manis di B fret 3. Mulai dari senar D.'
  },
  F: {
    name: 'F major barre',
    frets: [1, 3, 3, 2, 1, 1],
    notes: [5, 9, 0],
    tip: 'Telunjuk barre fret 1. Manis di A fret 3, kelingking di D fret 3, tengah di G fret 2. Jangan paksa bila nyeri.'
  },
  Bm: {
    name: 'B minor barre',
    frets: [-1, 2, 4, 4, 3, 2],
    notes: [11, 2, 6],
    tip: 'Telunjuk barre senar A sampai e fret 2. Manis di D fret 4, kelingking di G fret 4, tengah di B fret 3.'
  },
  E5: {
    name: 'E power chord',
    frets: [0, 2, 2, -1, -1, -1],
    notes: [4, 11],
    tip: 'Petik hanya E rendah, A fret 2 dan D fret 2. Redam tiga senar tinggi. Power chord tidak punya nada mayor/minor.'
  },
  A5: {
    name: 'A power chord',
    frets: [-1, 0, 2, 2, -1, -1],
    notes: [9, 4],
    tip: 'Petik hanya A, D fret 2 dan G fret 2. Redam E rendah, B dan e tinggi.'
  },
  Dsus2: {
    name: 'D suspended 2', frets: [-1, -1, 0, 2, 3, 0], notes: [2, 4, 9],
    tip: 'Dari D, lepaskan jari pada e tinggi. Mulai dari senar D.'
  },
  Asus2: {
    name: 'A suspended 2', frets: [-1, 0, 2, 2, 0, 0], notes: [9, 11, 4],
    tip: 'Dari A, lepaskan jari pada B. Mulai dari senar A.'
  },
  E7: {
    name: 'E dominant 7', frets: [0, 2, 0, 1, 0, 0], notes: [4, 8, 11, 2],
    tip: 'Dari E, lepaskan jari pada D. Mainkan keenam senar.'
  },
  A7: {
    name: 'A dominant 7', frets: [-1, 0, 2, 0, 2, 0], notes: [9, 1, 4, 7],
    tip: 'Tekan D dan B fret 2; G terbuka. Mulai dari A.'
  },
  D7: {
    name: 'D dominant 7', frets: [-1, -1, 0, 2, 1, 2], notes: [2, 6, 9, 0],
    tip: 'Tekan G fret 2, B fret 1, e fret 2. Mulai dari D.'
  },
  Cmaj7: {
    name: 'C major 7', frets: [-1, 3, 2, 0, 0, 0], notes: [0, 4, 7, 11],
    tip: 'Dari C, lepaskan jari pada B. Mulai dari A.'
  },
  Am7: {
    name: 'A minor 7', frets: [-1, 0, 2, 0, 1, 0], notes: [9, 0, 4, 7],
    tip: 'Dari Am, lepaskan jari pada G. Mulai dari A.'
  },
  Dsus4: {
    name: 'D suspended 4', frets: [-1, -1, 0, 2, 3, 3], notes: [2, 7, 9],
    tip: 'Dari D, tekan e tinggi fret 3 dengan kelingking. Mulai dari senar D.'
  },
  Gm: {
    name: 'G minor barre', frets: [3, 5, 5, 3, 3, 3], notes: [7, 10, 2],
    tip: 'Barre fret 3, manis di A fret 5, kelingking di D fret 5. Rileks; berhenti bila nyeri.'
  },
  B: {
    name: 'B major barre', frets: [-1, 2, 4, 4, 4, 2], notes: [11, 3, 6],
    tip: 'Barre A sampai e fret 2; tekan D, G, B fret 4. Jangan petik E rendah.'
  }
});
export const BASIC_CHORDS = Object.freeze(Object.keys(CHORDS));
export const OPEN_MIDI = Object.freeze([40, 45, 50, 55, 59, 64]);
export const STRING_NAMES = Object.freeze(['E rendah (senar 6)', 'A (senar 5)', 'D (senar 4)', 'G (senar 3)', 'B (senar 2)', 'e tinggi (senar 1)']);
export const COURSES = ['Dasar: A, D & ketukan', 'Dasar: E & transisi', 'Dasar: chord minor', 'Dasar: C, G & konsolidasi', 'Ritme: delapanan & sinkopasi', 'Pengembangan: suspended chord', 'Pengembangan: dominant 7', 'Power chord & ritme', 'Intermediate: barre mayor & minor', 'Intermediate: maj7 & m7'];
export const LESSONS: Lesson[] = [{
  id: 'single-Em',
  title: 'Kenali Em',
  chords: ['Em'],
  kind: 'single',
  course: 0
}, {
  id: 'single-Am',
  title: 'Kenali Am',
  chords: ['Am'],
  kind: 'single',
  course: 0
}, {
  id: 'pair-em-am',
  title: 'Transisi: Em / Am',
  chords: ['Em', 'Am'],
  kind: 'transition',
  course: 0
}, {
  id: 'single-C',
  title: 'Kenali C',
  chords: ['C'],
  kind: 'single',
  course: 1
}, {
  id: 'single-D',
  title: 'Kenali D',
  chords: ['D'],
  kind: 'single',
  course: 1
}, {
  id: 'single-E',
  title: 'Kenali E',
  chords: ['E'],
  kind: 'single',
  course: 1
}, {
  id: 'sequence-c-d-e',
  title: 'Transisi: C / D / E',
  chords: ['C', 'D', 'E'],
  kind: 'transition',
  course: 1
}, {
  id: 'single-G',
  title: 'Kenali G',
  chords: ['G'],
  kind: 'single',
  course: 2
}, {
  id: 'single-A',
  title: 'Kenali A',
  chords: ['A'],
  kind: 'single',
  course: 2
}, {
  id: 'single-Dm',
  title: 'Kenali Dm',
  chords: ['Dm'],
  kind: 'single',
  course: 2
}, {
  id: 'sequence-g-a-dm',
  title: 'Transisi: G / A / Dm',
  chords: ['G', 'A', 'Dm'],
  kind: 'transition',
  course: 2
}, {
  id: 'pair-am-c',
  title: 'Transisi: Am / C',
  chords: ['Am', 'C'],
  kind: 'transition',
  course: 2
}, {
  id: 'pair-g-d',
  title: 'Transisi: G / D',
  chords: ['G', 'D'],
  kind: 'transition',
  course: 2
}, {
  id: 'sequence',
  title: 'Transisi: Em / C / G / D',
  chords: ['Em', 'C', 'G', 'D'],
  kind: 'transition',
  course: 2
}, {
  id: 'strum-basic',
  title: 'Downstroke: 1 2 3 4',
  chords: ['Em', 'Am'],
  kind: 'strumming',
  course: 0,
  pattern: [0, 1, 2, 3],
  directions: ['↓', '↓', '↓', '↓'],
  tip: 'Gerakkan tangan turun pada tiap ketukan. Ganti chord setelah empat petikan.'
}, {
  id: 'strum-eighths',
  title: 'Delapanan: D U D U D U D U',
  chords: ['Em', 'Am'],
  kind: 'strumming',
  course: 3,
  tempo: { min: 40, max: 80, step: 10 },
  pattern: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
  directions: ['↓', '↑', '↓', '↑', '↓', '↑', '↓', '↑'],
  tip: 'Hitung 1 & 2 & 3 & 4 &. Turun pada angka, naik pada &. Gerakkan tangan terus dengan rileks; latih satu chord dahulu bila pergantian belum lancar.'
}, {
  id: 'strum-next',
  tempo: { min: 40, max: 80, step: 10 },
  title: 'Sinkopasi: D D U U D U',
  chords: ['C', 'G'],
  kind: 'strumming',
  course: 4,
  pattern: [0, 1, 1.5, 2.5, 3, 3.5],
  directions: ['↓', '↓', '↑', '↑', '↓', '↑'],
  tip: 'Hitung 1 & 2 & 3 & 4 &. Lewati petikan pada 1 & dan 3; tangan tetap bergerak. Mulai pelan.'
}, {
  id: 'single-F',
  title: 'Kenali F barre',
  chords: ['F'],
  kind: 'single',
  course: 5
}, {
  id: 'single-Bm',
  title: 'Kenali Bm barre',
  chords: ['Bm'],
  kind: 'single',
  course: 5
}, {
  id: 'pair-f-bm',
  title: 'Transisi: F / Bm',
  chords: ['F', 'Bm'],
  kind: 'transition',
  course: 5
}, {
  id: 'single-E5',
  title: 'Kenali E5',
  chords: ['E5'],
  kind: 'single',
  course: 6
}, {
  id: 'single-A5',
  title: 'Kenali A5',
  chords: ['A5'],
  kind: 'single',
  course: 6
}, {
  id: 'pair-e5-a5',
  title: 'Transisi: E5 / A5',
  chords: ['E5', 'A5'],
  kind: 'transition',
  course: 6
}];

// Stable exercise IDs preserve progress; every course uses supported audio practice.
const courseOrder = [
  ['single-A', 'single-D', 'pair-a-d', 'strum-basic'],
  ['single-E', 'sequence-a-d-e'],
  ['single-Em', 'single-Am', 'pair-em-am', 'single-Dm', 'pair-am-dm'],
  ['single-C', 'pair-am-c', 'single-G', 'pair-g-d', 'sequence-c-d-e', 'sequence-g-a-dm', 'sequence'],
  ['strum-eighths', 'strum-next', 'strum-open-mix'],
  ['single-Dsus2', 'single-Dsus4', 'sequence-d-sus', 'single-Asus2', 'pair-a-asus2'],
  ['single-E7', 'single-A7', 'single-D7', 'pair-e-e7', 'pair-a-a7', 'pair-d-d7', 'sequence-sevenths'],
  ['single-E5', 'single-A5', 'pair-e5-a5', 'strum-power'],
  ['single-F', 'pair-c-f', 'single-Bm', 'pair-d-bm', 'pair-f-bm', 'single-Gm', 'single-B', 'pair-b-bm', 'sequence-barre'],
  ['single-Cmaj7', 'single-Am7', 'pair-c-cmaj7', 'pair-am-am7', 'sequence-major-minor7'],
];
LESSONS.find(lesson => lesson.id === 'strum-basic')!.chords = ['A', 'D'];
LESSONS.find(lesson => lesson.id === 'strum-next')!.chords = ['Em', 'Am'];
LESSONS.push(
  { id: 'pair-a-d', title: 'Transisi: A / D', chords: ['A', 'D'], kind: 'transition', course: 0 },
  { id: 'sequence-a-d-e', title: 'Transisi: A / D / E', chords: ['A', 'D', 'E'], kind: 'transition', course: 1 }
);
for (const chord of ['Dsus2', 'Asus2', 'Dsus4', 'E7', 'A7', 'D7', 'Cmaj7', 'Am7', 'Gm', 'B'] as ChordName[]) {
  LESSONS.push({ id: `single-${chord}`, title: `Kenali ${chord}`, chords: [chord], kind: 'single', course: 0 });
}
const transitions: [string, ChordName[]][] = [
  ['pair-am-dm', ['Am', 'Dm']],
  ['sequence-d-sus', ['D', 'Dsus2', 'Dsus4']],
  ['pair-a-asus2', ['A', 'Asus2']],
  ['pair-e-e7', ['E', 'E7']], ['pair-a-a7', ['A', 'A7']], ['pair-d-d7', ['D', 'D7']],
  ['sequence-sevenths', ['E7', 'A7', 'D7']],
  ['pair-c-cmaj7', ['C', 'Cmaj7']], ['pair-am-am7', ['Am', 'Am7']],
  ['sequence-major-minor7', ['Cmaj7', 'Am7', 'Dm', 'G']],
  ['pair-c-f', ['C', 'F']], ['pair-d-bm', ['D', 'Bm']], ['pair-b-bm', ['B', 'Bm']],
  ['sequence-barre', ['F', 'Gm', 'B', 'Bm']],
];
for (const [id, chords] of transitions) {
  LESSONS.push({ id, title: `Transisi: ${chords.join(' / ')}`, chords, kind: 'transition', course: 0 });
}
for (const [id, chords] of [
  ['strum-open-mix', ['C', 'G', 'Am', 'D']],
  ['strum-power', ['E5', 'A5']],
] as [string, ChordName[]][]) {
  LESSONS.push({
    id, title: `Ketukan & transisi: ${chords.join(' / ')}`, chords, kind: 'strumming', course: 0,
    pattern: [0, 1, 2, 3], directions: ['↓', '↓', '↓', '↓'],
    tip: 'Petik pada setiap ketukan. Ganti chord setiap empat ketukan tanpa berhenti.'
  });
}
// ponytail: assess chord notes and timing only; add technique-specific analysis before palm mute, fingerstyle or slash-bass lessons.
const exercises = [...LESSONS];
LESSONS.length = 0;
courseOrder.forEach((ids, course) => {
  for (const id of ids) {
    const lesson = exercises.find(lesson => lesson.id === id)!;
    lesson.course = course;
    LESSONS.push(lesson);
  }
});
export const SINGLE_LESSONS = LESSONS.filter(l => l.kind === 'single');
export const TRANSITION_LESSONS = LESSONS.filter(l => l.kind === 'transition');
export function nextTransitionChord(chords: ChordName[], previous: ChordName, random = Math.random) {
  const choices = chords.filter(chord => chord !== previous);
  return choices.length ? choices[Math.floor(random() * choices.length)] : previous;
}
export function rhythmTarget(lesson: Lesson, index: number, tempo: number): RhythmTarget {
  const pattern = lesson.pattern || [0];
  const slot = index % pattern.length;
  const next = (slot + 1) % pattern.length;
  return {
    chord: lesson.chords[Math.floor(index / pattern.length) % lesson.chords.length],
    direction: lesson.directions?.[slot] || '',
    interval: ((next === 0 ? 4 + pattern[0] : pattern[next]) - pattern[slot]) * 60 / tempo
  };
}
export function isKnownLesson(id: unknown) {
  return LESSONS.some(lesson => lesson.id === id);
}
export function playableStrings(chord: ChordName) {
  return CHORDS[chord].frets.flatMap((fret, index) => fret < 0 ? [] : [{
    index,
    fret,
    name: STRING_NAMES[index],
    midi: OPEN_MIDI[index] + fret
  }]);
}
export function pitchMatches(frequency: number, clarity: number, midi: number | undefined) {
  if (midi === undefined || !Number.isFinite(frequency) || frequency <= 0 || !Number.isFinite(clarity) || clarity < 0.9) {
    return false;
  }
  const cents = 1200 * Math.log2(frequency / (440 * 2 ** ((midi - 69) / 12)));
  return Math.abs(cents) <= 35;
}
