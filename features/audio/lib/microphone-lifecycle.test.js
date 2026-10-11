import test from 'node:test';
import assert from 'node:assert/strict';
import { Microphone } from './microphone.ts';
import { microphoneError } from './audio-levels.ts';
test('disconnect during context resume never requests microphone permission', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  let resume;
  let closes = 0;
  Object.defineProperty(globalThis, 'AudioContext', {
    configurable: true,
    value: class {
      state = 'running';
      resume() {
        return new Promise(resolve => {
          resume = resolve;
        });
      }
      close() {
        closes++;
        this.state = 'closed';
        return Promise.resolve();
      }
    }
  });
  try {
    const microphone = new Microphone(() => {}, () => {}, () => {});
    const pending = microphone.start();
    microphone.stop();
    resume();
    await pending;
    assert.equal(closes, 1);
    assert.equal(microphone.stream, undefined);
  } finally {
    if (original) {
      Object.defineProperty(globalThis, 'AudioContext', original);
    } else {
      delete globalThis.AudioContext;
    }
  }
});
test('stop releases tracks and handles a rejected context close', async () => {
  let stops = 0;
  const track = {
    onended: () => {},
    stop() {
      stops++;
    }
  };
  const microphone = new Microphone(() => {}, () => {}, () => {});
  microphone.stream = {
    getTracks: () => [track]
  };
  microphone.context = {
    state: 'running',
    close: () => Promise.reject(new Error('Already closing'))
  };
  microphone.stop();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(stops, 1);
  assert.equal(track.onended, null);
  assert.equal(microphone.closed, true);
});
test('microphone errors tolerate absent exceptions', () => {
  assert.match(microphoneError(null), /localhost\/HTTPS/);
  assert.match(microphoneError(undefined), /localhost\/HTTPS/);
});
