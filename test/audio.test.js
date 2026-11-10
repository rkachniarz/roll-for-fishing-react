// @ts-check
// Sound (9.2): the volume setting and how loud it plays.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gainFor } from '../src/audio.js';
import { loadSettings } from '../src/settings.js';

test('the volume: 0 is silence, 100 the loudest, evenly in between (9.2)', () => {
  assert.equal(gainFor(0), 0);
  assert.equal(gainFor(100), 0.6);
  assert.ok(gainFor(50) > 0 && gainFor(50) < gainFor(60) && gainFor(60) < gainFor(100));
  assert.equal(gainFor(150), 0.6, 'never louder');
  assert.equal(gainFor(-5), 0);
});

test('a device with old settings gets the sound at 60', () => {
  const storage = { getItem: () => JSON.stringify({ theme: 'light', dice: false }) };
  assert.deepEqual(loadSettings(storage), { theme: 'light', dice: false, sound: 60 });
});
