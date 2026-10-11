import test from 'node:test';
import assert from 'node:assert/strict';
import { resetStringCheckIfInvalid } from './audio-levels.ts';

test('invalid audio clears accumulated pitch checks before reconnect', () => {
  for (const frame of [
    { contextState: 'suspended' },
    { contextState: 'closed' },
    { contextState: 'running', calibrating: true },
    { contextState: 'running', clipping: true },
    { contextState: 'running', noisy: true }
  ]) {
    const state = { stable: 4, quiet: false };
    assert.equal(resetStringCheckIfInvalid(state, frame), true);
    assert.deepEqual(state, { stable: 0, quiet: true });
    assert.equal(resetStringCheckIfInvalid(state, { contextState: 'running' }), false);
    assert.equal(state.stable, 0);
  }
});

test('valid frames preserve consecutive pitch checks', () => {
  const state = { stable: 4, quiet: true };
  assert.equal(resetStringCheckIfInvalid(state, { contextState: 'running' }), false);
  assert.deepEqual(state, { stable: 4, quiet: true });
});
