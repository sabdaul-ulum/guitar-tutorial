import { CHORDS, OPEN_MIDI } from '../../learning/domain/curriculum.ts';

/**
 * Voicing-aware chord verification.
 *
 * Chroma templates discard octave and string information, so chords that share
 * two notes (Em/E, Am/C) are nearly indistinguishable. Here every lesson chord
 * has a known voicing, so we measure energy at the exact expected notes and at
 * the notes that distinguish it from each likely alternative.
 */
export const ANALYSIS_RULES = Object.freeze({
  harmonics: 3,
  // fundamental plus two overtones, weighted 1/h
  toleranceCents: 50,
  // allowed tuning error per note
  minimumEvidenceDb: 1,
  // distinguishing notes must be this much louder than an alternative's
  coverageDb: -36, // harmonic evidence threshold
  fundamentalToleranceCents: 35,
  fundamentalCoverageDb: -18,
  extraToneMarginDb: 12
});

// Strumming every open string is the most common beginner mistake.
const OPEN_STRUM = Object.freeze({
  frets: [0, 0, 0, 0, 0, 0]
});
export function voicing({
  frets
}: { frets: readonly number[] }) {
  return frets.flatMap((fret, string) => fret < 0 ? [] : [OPEN_MIDI[string] + fret]);
}
const pitchClasses = (notes: number[]) => new Set(notes.map(midi => midi % 12));
const frequencyOf = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
function peak(spectrum: ArrayLike<number>, binHz: number, frequency: number) {
  const spread = frequency * (2 ** (ANALYSIS_RULES.toleranceCents / 1200) - 1);
  const center = Math.round(frequency / binHz);
  const from = Math.max(1, Math.min(center, Math.round((frequency - spread) / binHz)));
  const to = Math.min(spectrum.length - 1, Math.max(center, Math.round((frequency + spread) / binHz)));
  let best = 0;
  for (let bin = from; bin <= to; bin++) best = Math.max(best, spectrum[bin]);
  return best;
}

/** Note level in dB using harmonic summation; `spectrum` is linear magnitude for bins 0..fftSize/2. */
export function noteLevelDb(spectrum: ArrayLike<number>, sampleRate: number, fftSize: number, midi: number) {
  const binHz = sampleRate / fftSize;
  let energy = 0;
  for (let harmonic = 1; harmonic <= ANALYSIS_RULES.harmonics; harmonic++) {
    energy += peak(spectrum, binHz, frequencyOf(midi) * harmonic) ** 2 / harmonic;
  }
  return 10 * Math.log10(energy + 1e-12);
}
function alternatives(expected: string): [string, { frets: readonly number[] }][] {
  return [...Object.entries(CHORDS).filter(([name]) => name !== expected), ['open strings', OPEN_STRUM]];
}

/**
 * Returns accepted plus beginner-facing diagnostics. Missing chord tones and the
 * closest competing chord are reported so the UI can explain why it was rejected.
 */
export function verifyChord(spectrum: ArrayLike<number> | undefined, sampleRate: number, fftSize: number, expected: import('../../learning/domain/curriculum.ts').ChordName) {
  if (!CHORDS[expected]) {
    throw new RangeError('Unsupported chord');
  }
  if (!spectrum?.length || !Number.isFinite(sampleRate) || sampleRate <= 0 || !Number.isInteger(fftSize) || fftSize <= 0 || spectrum.length !== fftSize / 2 || Array.from(spectrum).some(value => !Number.isFinite(value) || value < 0)) {
    return {
      accepted: false,
      evidenceDb: 0,
      closest: null,
      missing: []
    };
  }
  const level = new Map<number, number>();
  const levelOf = (midi: number) => {
    if (!level.has(midi)) {
      level.set(midi, noteLevelDb(spectrum, sampleRate, fftSize, midi));
    }
    return level.get(midi)!;
  };
  const target = voicing(CHORDS[expected]);
  const targetClasses = pitchClasses(target);
  const loudest = Math.max(...target.map(levelOf));
  // Harmonic overlap is not proof of a played note; require its fundamental too.
  const fundamentalOf = (midi: number) => {
    const bin = frequencyOf(midi) * fftSize / sampleRate;
    // Keep adjacent semitones out of the fundamental window.
    const from = Math.min(Math.round(bin), Math.ceil(bin * 2 ** (-ANALYSIS_RULES.fundamentalToleranceCents / 1200)));
    const to = Math.max(Math.round(bin), Math.floor(bin * 2 ** (ANALYSIS_RULES.fundamentalToleranceCents / 1200)));
    let magnitude = 0;
    for (let index = Math.max(1, from); index <= Math.min(spectrum.length - 1, to); index++) {
      magnitude = Math.max(magnitude, spectrum[index]);
    }
    return 20 * Math.log10(magnitude + 1e-12);
  };
  const loudestFundamental = Math.max(...target.map(fundamentalOf));
  const missing = [...targetClasses].filter(pitchClass => {
    const notes = target.filter(midi => midi % 12 === pitchClass);
    return Math.max(...notes.map(levelOf)) < loudest + ANALYSIS_RULES.coverageDb
      || Math.max(...notes.map(fundamentalOf)) < loudestFundamental + ANALYSIS_RULES.fundamentalCoverageDb;
  });
  let evidenceDb = Infinity;
  let closest: string | null = null;
  for (const [name, chord] of alternatives(expected)) {
    const notes = voicing(chord);
    const classes = pitchClasses(notes);
    const own = target.filter(midi => !classes.has(midi % 12));
    const foreign = notes.filter(midi => !targetClasses.has(midi % 12));
    if (!foreign.length) {
      continue;
    } // A power chord subset cannot disprove its major/minor chord.
    const evidence = !own.length
      ? loudestFundamental - Math.max(...foreign.map(fundamentalOf)) - ANALYSIS_RULES.extraToneMarginDb
      : mean(own.map(levelOf)) - mean(foreign.map(levelOf));
    if (evidence < evidenceDb) {
      evidenceDb = evidence;
      closest = name;
    }
  }
  return {
    accepted: Number.isFinite(loudest) && Number.isFinite(evidenceDb) && missing.length === 0 && evidenceDb >= ANALYSIS_RULES.minimumEvidenceDb,
    evidenceDb,
    closest,
    missing
  };
}
