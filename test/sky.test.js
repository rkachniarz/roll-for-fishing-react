// @ts-check
// The spots' compass facings and the shared width of view (12.1, D166).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content } from '../src/generated/content.js';
import { VIEW, acrossView, facingOf } from '../src/engine/sky.js';

test('every spot that shows sky has a facing; the swamp and the town have none', () => {
  for (const loc of Object.values(content.locations)) {
    for (const spot of loc.spots ?? []) {
      const where = `${loc.id}/${spot.id}`;
      const facing = facingOf(loc.id, spot.id);
      const noSky = loc.town || spot.look?.painting === 'swamp';
      if (noSky) {
        assert.equal(facing, null, `${where} shows no sky, so has no facing`);
        continue;
      }
      // A painted spot, or one on the map, shows sky.
      if (spot.look?.painting || spot.map) {
        assert.equal(typeof facing, 'number', `${where} shows sky but has no facing`);
        assert.ok(facing >= 0 && facing < 360, `${where}: facing ${facing} out of 0..359`);
      }
    }
  }
});

test('the facings are the owner\'s', () => {
  assert.equal(facingOf('lake', 'reedy-shore'), 90);
  assert.equal(facingOf('lake', 'deep-water'), 210);
  assert.equal(facingOf('river', 'upper-river'), 25);
  assert.equal(facingOf('mage-tower', 'the-first-pool'), 180);
  assert.equal(facingOf('lake', 'nowhere'), null);
});

test('acrossView places a bearing across the picture, and wraps past north', () => {
  assert.equal(VIEW.width, 60);
  assert.equal(acrossView(90, 90), 0);
  assert.equal(acrossView(90, 60), -1);
  assert.equal(acrossView(90, 120), 1);
  assert.equal(acrossView(90, 105), 0.5);
  assert.equal(acrossView(90, 121), null);
  assert.equal(acrossView(90, 270), null);
  assert.equal(acrossView(10, 350), -2 / 3);
  assert.equal(acrossView(335, 5), 1);
  assert.equal(acrossView(335, 365), 1);
  assert.equal(acrossView(null, 90), null);
  assert.equal(acrossView(90, 100, 20), 1);
});
