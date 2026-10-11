import type { Lesson } from './curriculum.ts';
import { ANALYSIS_GRACE_SECONDS, TIMING_TOLERANCE_SECONDS, rhythmTarget, nextTransitionChord } from './curriculum.ts';

// ponytail: visual clock remains main-thread; use AudioWorklet if device tests show unacceptable jitter.
type ScheduledTarget = ReturnType<typeof rhythmTarget> & { due: number; tempo: number; index: number; tolerance: number; result: boolean | null };
export class RhythmSession {
  lesson: Lesson;
  random: () => number;
  index: number;
  started: boolean;
  active: boolean;
  targets: ScheduledTarget[];
  current?: ScheduledTarget;
  previous?: ScheduledTarget;
  startedAt = 0;
  origin = 0;
  constructor(lesson: Lesson, random = Math.random) {
    this.lesson = lesson;
    this.random = random;
    this.index = 0;
    this.started = false;
    this.active = false;
    this.targets = [];
  }
  start(now: number, tempo: number) {
    const firstStart = !this.started;
    this.startedAt = now + (firstStart ? 240 / tempo : 0);
    this.started = true;
    this.active = true;
    this.targets = [];
    this.previous = undefined;
    this.enqueue(this.startedAt + (firstStart ? 120 / tempo : this.lesson.pattern ? 60 / tempo : 240 / tempo), tempo);
    const patternBeat = this.lesson.pattern?.[this.current!.index % this.lesson.pattern.length] ?? 0;
    this.origin = this.current!.due - patternBeat * 60 / tempo;
  }
  pause() {
    this.active = false;
    this.targets = [];
  }
  enqueue(due: number, tempo: number) {
    const target = rhythmTarget(this.lesson, this.index, tempo);
    const previous = this.current?.chord;
    if (this.lesson.kind === 'transition') {
      target.chord = previous ? nextTransitionChord(this.lesson.chords, previous, this.random) : this.lesson.chords[0];
    }
    // Incoming and outgoing spacing both constrain timing windows.
    const prior = rhythmTarget(this.lesson, Math.max(0, this.index - 1), tempo).interval;
    this.current = {
      ...target,
      due,
      tempo,
      index: this.index++,
      tolerance: Math.min(TIMING_TOLERANCE_SECONDS, prior * 0.4, target.interval * 0.4),
      result: null
    };
    this.targets.push(this.current);
  }
  visual(now: number) {
    const current = this.current;
    const beatSeconds = 60 / (current?.tempo || 60);
    const subdivision = Math.floor((now - this.origin + 1e-9) / (beatSeconds / 2));
    const countdown = Math.max(0, Math.ceil((this.startedAt - now) / beatSeconds));
    const beat = countdown > 0 || !this.previous && current && now < current.due ? -1 : (subdivision % 8 + 8) % 8;
    const playing = this.previous && now >= this.previous.due ? this.previous : current;
    return {
      countdown,
      beat,
      playing,
      notes: (countdown > 0 ? [] : [this.previous, current]).filter((target): target is ScheduledTarget => !!target).map(target => ({
        ...target,
        position: 18 + (target.due - now) / beatSeconds * 35
      })).filter(target => target.position >= -10 && target.position <= 110)
    };
  }
  tick(now: number, tempo: number, offset = 0) {
    if (!this.active || !this.current) {
      return [];
    }
    if (now - this.current.due > 2) {
      this.pause();
      return [];
    }
    while (now >= this.current.due) {
      this.previous = this.current;
      this.enqueue(this.current.due + this.current.interval, tempo);
    }
    const ready = [];
    while (this.targets.length > 1) {
      const target = this.targets[0];
      if (target.result === null && now <= target.due + target.tolerance + ANALYSIS_GRACE_SECONDS + offset) {
        break;
      }
      ready.push(this.targets.shift()!);
    }
    return ready;
  }
  match(time: number, offset = 0) {
    if (!this.active || !Number.isFinite(time) || time < this.startedAt) {
      return null;
    }
    return this.targets.find(target => target.result === null && Math.abs(time - offset - target.due) <= target.tolerance) || null;
  }
}
