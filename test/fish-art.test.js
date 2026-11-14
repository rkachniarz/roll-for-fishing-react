// @ts-check
// Fish drawn to swim (R20.1, D131): every fish has a shape, its frames agree
// in size, its colours are its icon's, and it's drawn the same every time.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content } from '../src/generated/content.js';
import { SWIM_FRAMES, fishFrames, iconColours, shapeOf } from '../src/scene/fish-art.js';
import { iconKeys } from '../src/scene/icons.js';

test('every fish has a shape to swim with', () => {
  const missing = Object.keys(content.fish).filter((id) => !shapeOf(id));
  assert.deepEqual(missing, []);
});

test('a fish\'s frames are all one size, side on and below the surface', () => {
  for (const id of ['common-carp', 'northern-pike', 'mainland-eel', 'giant-freshwater-stingray', 'bull-shark', 'discus']) {
    const f = /** @type {NonNullable<ReturnType<typeof fishFrames>>} */ (fishFrames(id));
    assert.equal(f.side.length, SWIM_FRAMES, id);
    for (const set of [f.side, f.near, f.far]) {
      const [w, h] = [set[0][0].length, set[0].length];
      assert.ok(set.every((g) => g.length === h && g.every((row) => row.length === w)), `${id}: frames differ in size`);
    }
    assert.equal(f.gulp.length, f.side[0].length, `${id}: the gulp frame`);
    // Hard pixels: every pixel a colour or nothing.
    assert.ok(f.side[0].flat().every((c) => c === '' || /^#[0-9a-f]{6}$/.test(c)), id);
    // The far view is the smaller drawing.
    assert.ok(f.far[0][0].length < f.near[0][0].length, `${id}: far is smaller`);
  }
});

test('its colours come from its icon', () => {
  const keys = Object.values(iconKeys('fish/carp'));
  const c = iconColours('fish/carp');
  for (const role of /** @type {const} */ (['back', 'flank', 'belly'])) assert.ok(keys.includes(c[role]), role);
});

test('the same fish is drawn the same every time', () => {
  assert.deepEqual(fishFrames('perch'), fishFrames('perch'));
});
