import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeProgress, syncProgress, syncStorageProgress, serializeProgress } from './progress.ts';

test('concurrent tabs converge without losing unsaved session progress', () => {
  const first = ['single-Em'];
  const second = ['single-Am'];
  const merged = syncProgress(first, serializeProgress(second));
  assert.deepEqual(merged, ['single-Em', 'single-Am']);
  assert.deepEqual(syncProgress(second, serializeProgress(merged)), merged);
  assert.deepEqual(mergeProgress(merged, merged), merged);
  assert.deepEqual(syncProgress(first, null), first);
});

test('explicit storage removal resets progress; malformed updates cannot mutate session', () => {
  const current = ['single-Em'];
  assert.deepEqual(syncProgress(current, null, true), []);
  assert.deepEqual(syncProgress(current, '{'), current);
  assert.deepEqual(current, ['single-Em']);
  assert.deepEqual(syncProgress(current, '{"version":1,"completed":[]}'), current);
});

test('latest storage removal wins over queued update events', () => {
  const current = ['single-Em'];
  const stale = serializeProgress(['single-Am']);
  assert.deepEqual(syncStorageProgress(current, null, stale), []);
  assert.deepEqual(syncStorageProgress(current, null, null), []);
  // A queued removal must not erase a newer completion already in storage.
  assert.deepEqual(syncStorageProgress([], stale, null), ['single-Am']);
});

test('storage event merges both concurrent completions', () => {
  const stored = serializeProgress(['single-Am']);
  const incoming = serializeProgress(['single-Em']);
  assert.deepEqual(syncStorageProgress([], stored, incoming), ['single-Em', 'single-Am']);
});

test('malformed storage can be replaced with valid session progress', () => {
  const current = ['single-Em'];
  let stored = '{';
  stored = serializeProgress(syncProgress(current, stored));
  assert.deepEqual(syncProgress([], stored), current);
});
