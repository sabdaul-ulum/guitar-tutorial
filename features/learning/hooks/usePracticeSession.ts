'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { Lesson } from '../domain/curriculum.ts';
import type { AudioFrame } from '../../audio/lib/microphone.ts';
import { Exercise } from '../domain/exercise.ts';
import { PROOF_STRUMS, TIMING_TOLERANCE_SECONDS, playableStrings, pitchMatches, rhythmTarget } from '../domain/curriculum.ts';
import { RhythmSession } from '../domain/rhythm-session.ts';
import { verifyChord } from '../../audio/lib/chord-analysis.ts';
import { describePitch, resetStringCheckIfInvalid } from '../../audio/lib/audio-levels.ts';
import { useAudio } from '../../audio/components/AudioProvider.tsx';
export function usePracticeSession({
  lesson,
  onComplete
}: { lesson: Lesson; onComplete: (id: string) => void }) {
  const [phase, setPhase] = useState(lesson.kind === 'single' ? 'strings' : 'rhythm');
  const [stringIndex, setStringIndex] = useState(0);
  const [strums, setStrums] = useState(0);
  const [message, setMessage] = useState('Formasikan chord, lalu petik satu senar yang diminta. Tidak ada batas waktu.');
  const {
    audio,
    subscribe
  } = useAudio();
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState<ReturnType<RhythmSession['visual']>['notes']>([]);
  const [revision, setRevision] = useState(0);
  const [demo, setDemo] = useState(false);
  const [offset, setOffset] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const problem = useRef('');
  const [exercise] = useState(() => new Exercise(lesson.tempo));
  const engine = useRef(exercise);
  const runtime = useRef({
    stable: 0,
    quiet: true
  });
  const acceptAfter = useRef(0);
  const [countdown, setCountdown] = useState(0);
  const autoStarted = useRef(false);
  const [rhythmSession] = useState(() => new RhythmSession(lesson));
  const session = useRef(rhythmSession);
  const [beat, setBeat] = useState(-1);
  const [playing, setPlaying] = useState<RhythmSession['current']>();
  const target = session.current.current || rhythmTarget(lesson, targetIndex, engine.current.tempo);
  const chord = target.chord;
  function pauseRhythm() {
    session.current.pause();
    setRunning(false);
    setBeat(-1);
  }
  const tolerance = target.tolerance ?? Math.min(TIMING_TOLERANCE_SECONDS, target.interval * 0.4);
  const strings = playableStrings(chord);
  const targetString = strings[stringIndex];
  function finishTarget(correct: boolean, missed = false) {
    const result = engine.current.record(correct);
    setRevision(value => value + 1);
    if (missed && result.type === 'target') {
      setMessage('Petikan belum terdeteksi dalam zona waktu. Segmen tetap berjalan; ikuti kartu berikutnya.');
    }
    if (result.type === 'passed') {
      pauseRhythm();
      setMessage(demo ? 'Simulasi selesai. Progres tidak disimpan.' : `Lulus pada ${engine.current.max} BPM! Progres latihan tercatat.`);
      if (!demo) {
        onComplete(lesson.id);
      }
    } else if (result.type !== 'target') {
      session.current.index = Math.ceil(session.current.index / (lesson.pattern?.length || 1)) * (lesson.pattern?.length || 1);
      session.current.start(performance.now() / 1000, engine.current.tempo);
      setCountdown(0);
      const segment = engine.current.history.at(-1)!;
      const action = result.type === 'up' ? 'Naik tempo' : result.type === 'down' && engine.current.tempo < segment.tempo ? 'Perlambat' : 'Ulangi segmen';
      setMessage(`${action}: ${engine.current.tempo} BPM. Segmen sebelumnya ${segment.hits}/${segment.count} benar; petikan tidak terdeteksi atau chord tidak cocok dihitung salah.`);
    }
  }
  function acceptStrum(event: { time: number; spectrum?: Float32Array; sampleRate?: number; fftSize?: number }, simulated = false) {
    if (phase === 'strings' || phase === 'done' || !simulated && (demo || document.hidden || audio.status !== 'ready' || audio.clipping || audio.noisy) || event.time < acceptAfter.current) {
      return;
    }
    const scheduled = phase === 'rhythm' ? session.current.match(event.time, offset / 1000) : null;
    if (phase === 'rhythm' && (!running || !scheduled)) {
      return;
    }
    const match = simulated ? {
      accepted: true,
      closest: null
    } : verifyChord(event.spectrum, event.sampleRate ?? 0, event.fftSize ?? 0, scheduled?.chord || chord);
    if (phase === 'strum') {
      if (!match.accepted) {
        setMessage(match.closest ? 'Terdengar lebih mirip ' + match.closest + '. Petik perlahan, bunyikan senar bersih.' : 'Suara belum meyakinkan. Petik perlahan.');
        return;
      }
      const count = strums + 1;
      setStrums(count);
      setMessage(`Strum sesuai: ${count}/${PROOF_STRUMS}. Redam sebelum petikan berikutnya.`);
      if (count >= PROOF_STRUMS) {
        setPhase('done');
        setMessage('Chord dikenali. Lulus perkenalan! Lanjut ke chord berikutnya atau latihan transisi.');
        if (!demo) {
          onComplete(lesson.id);
        }
      }
      return;
    }
    if (!scheduled) return;
    scheduled.result = match.accepted;
    setMessage(match.accepted ? 'Suara dan waktu sesuai!' : 'Waktu sesuai, tetapi chord belum cocok.');
  }
  function receiveFrame(frame: AudioFrame) {
    if (demo) {
      return;
    }
    const invalid = resetStringCheckIfInvalid(runtime.current, frame);
    const issue = frame.clipping ? 'clipping' : frame.noisy ? 'noise' : '';
    if (issue) {
      pauseRhythm();
      if (problem.current !== issue) {
        setMessage(issue === 'clipping' ? 'Input terlalu keras. Kurangi level mikrofon.' : 'Noise tinggi. Kalibrasi ulang di tempat tenang.');
      }
      problem.current = issue;
      return;
    }
    problem.current = '';
    if (phase !== 'strings' || !targetString || invalid) {
      return;
    }
    if (!frame.audible) {
      runtime.current.quiet = true;
      runtime.current.stable = 0;
      return;
    }
    if (!runtime.current.quiet) {
      return;
    }
    if (pitchMatches(frame.frequency, frame.clarity, targetString.midi)) {
      runtime.current.stable++;
    } else {
      runtime.current.stable = 0;
    }
    if (runtime.current.stable >= 5) {
      runtime.current.stable = 0;
      runtime.current.quiet = false;
      if (stringIndex + 1 === strings.length) {
        setPhase('strum');
        setMessage('Semua nada senar sesuai. Sekarang strum chord ini 5 kali, tanpa tempo.');
      } else {
        setStringIndex(stringIndex + 1);
        setMessage('Nada sesuai. Redam senar, lalu petik senar berikutnya.');
      }
    }
  }
  const onFrame = useEffectEvent(receiveFrame);
  const onStrum = useEffectEvent(acceptStrum);
  const onPause = useEffectEvent(pauseRhythm);
  useEffect(() => {
    acceptAfter.current = performance.now() / 1000;
  }, [phase]);
  useEffect(() => subscribe({
    onFrame: frame => onFrame(frame),
    onStrum: event => onStrum(event)
  }), [subscribe]);
  useEffect(() => {
    if (!demo && audio.status !== 'ready') {
      resetStringCheckIfInvalid(runtime.current, { contextState: 'suspended' });
      onPause();
    }
  }, [audio.status, demo]);
  useEffect(() => {
    const pauseHidden = () => {
      if (document.hidden) {
        onPause();
      }
    };
    document.addEventListener('visibilitychange', pauseHidden);
    return () => document.removeEventListener('visibilitychange', pauseHidden);
  }, []);
  const onTick = useEffectEvent(() => {
    const now = performance.now() / 1000;
    const clock = session.current;
    if (!demo && (audio.status !== 'ready' || audio.clipping || audio.noisy)) {
      onPause();
      setMessage('Sinyal tidak cukup untuk dinilai. Cek mikrofon, lalu lanjutkan.');
      return;
    }
    const results = clock.tick(now, engine.current.tempo, offset / 1000);
    if (!clock.active) {
      onPause();
      setMessage('Latihan dijeda karena waktu browser tertunda. Lanjutkan saat siap.');
      return;
    }
    for (const result of results) {
      const tempo = engine.current.tempo;
      finishTarget(result.result === true, result.result === null);
      if (engine.current.passed) {
        return;
      }
      if (engine.current.tempo !== tempo || engine.current.count === 0) {
        break;
      }
    }

    const current = clock.current;
    if (!current) return;
    const visual = clock.visual(now);
    setTargetIndex(current.index);
    setCountdown(visual.countdown);
    setBeat(visual.beat);
    setPlaying(visual.playing);
    setNotes(visual.notes);
  });
  useEffect(() => {
    if (!running) {
      return;
    }
    let frame: number;
    const tick = () => {
      onTick();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
  function startRhythm() {
    if (!demo && audio.status !== 'ready') {
      setMessage('Hubungkan mikrofon dan tunggu kalibrasi selesai.');
      return;
    }
    if (!demo && (audio.clipping || audio.noisy)) {
      setMessage('Perbaiki sinyal sebelum melanjutkan.');
      return;
    }
    const firstStart = !session.current.started;
    session.current.start(performance.now() / 1000, engine.current.tempo);
    setNotes(session.current.visual(performance.now() / 1000).notes);
    setBeat(-1);
    setTargetIndex(session.current.current!.index);
    setCountdown(firstStart ? 4 : 0);
    setRunning(true);
    setMessage(firstStart ? 'Bersiap empat ketukan. Petik saat pusat kartu masuk zona hijau.' : 'Ritme dilanjutkan. Petik saat pusat kartu masuk zona hijau.');
  }
  const onStart = useEffectEvent(startRhythm);
  useEffect(() => {
    if (phase === 'rhythm' && !autoStarted.current && (demo || audio.status === 'ready') && !audio.clipping && !audio.noisy) {
      autoStarted.current = true;
      onStart();
    }
  }, [phase, demo, audio.status, audio.clipping, audio.noisy]);
  const detected = describePitch(audio.frequency);
  const cents = targetString && audio.frequency > 0 ? Math.round(1200 * Math.log2(audio.frequency / (440 * 2 ** ((targetString.midi - 69) / 12)))) : null;
  function enableDemo() {
    pauseRhythm();
    setDemo(true);
    setPhase('rhythm');
    autoStarted.current = false;
    engine.current = new Exercise(lesson.tempo);
    session.current = new RhythmSession(lesson);
    setCountdown(0);
    setBeat(-1);
    setTargetIndex(0);
    setStrums(0);
  }
  return {
    audio,
    phase,
    stringIndex,
    strums,
    message,
    running,
    notes,
    revision,
    demo,
    offset,
    targetIndex,
    countdown,
    beat,
    playing,
    target,
    chord,
    tolerance,
    strings,
    targetString,
    detected,
    cents,
    exercise: engine.current,
    skipStrings: () => setPhase('strum'),
    setOffset,
    startRhythm,
    pauseRhythm,
    enableDemo,
    simulateStrum: () => acceptStrum({
      time: performance.now() / 1000
    }, true)
  };
}
