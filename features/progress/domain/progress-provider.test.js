import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { isKnownLesson } from '../../learning/domain/curriculum.ts';
import { syncProgress, serializeProgress, PROGRESS_STORAGE_KEY } from './progress.ts';

// ponytail: exercise the provider's actual completion handler without a DOM; browser lifecycle coverage needs a browser runner.
const source = readFileSync(new URL('../components/ProgressProvider.tsx', import.meta.url), 'utf8');
const body = source.match(/function complete\(id: string\) \{([\s\S]*?)\n  \}\n  return/)[1];

for (const operation of ['getItem', 'setItem']) {
  test(`completion retries persistence after ${operation} failure without duplicate IDs`, () => {
    let failing = true;
    let stored = null;
    let warning = '';
    let completed = [];
    const current = { current: [] };
    const context = {
      ready: true,
      current,
      isKnownLesson,
      syncProgress,
      serializeProgress,
      PROGRESS_STORAGE_KEY,
      setCompleted: value => { completed = value; },
      setWarning: value => { warning = value; },
      localStorage: {
        getItem: key => {
          assert.equal(key, PROGRESS_STORAGE_KEY);
          if (failing && operation === 'getItem') throw new Error('Storage unavailable');
          return stored;
        },
        setItem: (key, value) => {
          assert.equal(key, PROGRESS_STORAGE_KEY);
          if (failing && operation === 'setItem') throw new Error('Storage full');
          stored = value;
        }
      }
    };
    const complete = runInNewContext(`(function complete(id) {${body}\n})`, context);
    complete('single-Em');
    assert.deepEqual(Array.from(completed), ['single-Em']);
    assert.equal(stored, null);
    assert.ok(warning);
    failing = false;
    stored = serializeProgress(['single-Am']);
    complete('single-Em');
    assert.deepEqual(JSON.parse(stored).completed, ['single-Em', 'single-Am']);
    assert.equal(warning, '');
    complete('single-Em');
    assert.deepEqual(JSON.parse(stored).completed, ['single-Em', 'single-Am']);
    const saved = stored;
    complete('unknown');
    context.ready = false;
    complete('single-G');
    assert.equal(stored, saved);
  });
}
