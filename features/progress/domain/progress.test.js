import test from 'node:test';
import assert from 'node:assert/strict';
import { readProgress, serializeProgress, PROGRESS_VERSION } from './progress.ts';
test('progress round-trips known lessons without accepting unknown or duplicate IDs', () => {
  const encoded = serializeProgress(['single-Am', 'unknown', 'single-Am', 'single-Em']);
  assert.equal(JSON.parse(encoded).version, PROGRESS_VERSION);
  assert.deepEqual(readProgress(JSON.parse(encoded)), ['single-Em', 'single-Am']);
});
test('progress rejects malformed storage without throwing', () => {
  for (const value of [null, false, 'invalid', [], {}, {
    version: 1,
    completed: []
  }, {
    version: 2,
    completed: 'single-Am'
  }]) {
    assert.deepEqual(readProgress(value), []);
  }
});
