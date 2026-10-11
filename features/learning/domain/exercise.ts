import type { TempoConfig } from './curriculum.ts';
export class Exercise {
  min: number;
  max: number;
  step: number;
  tempo: number;
  total: number;
  correct: number;
  streak: number;
  passed: boolean;
  count = 0;
  hits = 0;
  history: { tempo: number; hits: number; count: number }[];
  constructor({
    min = 60,
    max = 80,
    step = 10
  }: TempoConfig = {}) {
    if (![min, max, step].every(Number.isFinite)) {
      throw new TypeError('Tempo configuration must contain finite numbers.');
    }
    if (min <= 0 || max < min || step <= 0) {
      throw new RangeError('Tempo requires 0 < min <= max and step > 0.');
    }
    this.min = min;
    this.max = max;
    this.step = step;
    this.tempo = min;
    this.total = 0;
    this.correct = 0;
    this.streak = 0;
    this.passed = false;
    this.history = [];
    this.resetSegment();
  }
  resetSegment() {
    this.count = 0;
    this.hits = 0;
    this.streak = 0;
  }
  get proof() {
    return this.tempo === this.max;
  }
  get length() {
    return this.proof ? 16 : 8;
  }
  record(correct: boolean) {
    if (typeof correct !== 'boolean') {
      throw new TypeError('A target result must be a boolean.');
    }
    if (this.passed) {
      return {
        type: 'passed'
      };
    }
    this.total++;
    this.count++;
    this.correct += Number(correct);
    this.hits += Number(correct);
    this.streak = correct ? 0 : this.streak + 1;
    if (this.streak >= 3 && this.tempo > this.min) {
      return this.finish('down');
    }
    if (this.count < this.length) {
      return {
        type: 'target'
      };
    }
    if (this.proof && this.hits >= 13) {
      this.passed = true;
      return {
        type: 'passed'
      };
    }
    if (this.proof) {
      return this.finish(this.hits <= 8 ? 'down' : 'hold');
    }
    return this.finish(this.hits >= 5 ? 'up' : this.hits <= 4 ? 'down' : 'hold');
  }
  finish(type: 'up' | 'down' | 'hold') {
    const previous = this.tempo;
    this.history.push({
      tempo: previous,
      hits: this.hits,
      count: this.count
    });
    this.tempo = Math.max(this.min, Math.min(this.max, previous + (type === 'up' ? this.step : type === 'down' ? -this.step : 0)));
    this.resetSegment();
    return {
      type,
      previous,
      tempo: this.tempo
    };
  }
}
