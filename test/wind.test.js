// @ts-check
// The wind's direction (D176): a compass hexflower drifting like the weather's maps.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, deriveSeed } from '../src/rng.js';
import { diceFor } from '../src/dice.js';
import { stepWind, windFrom, windKind, windStart } from '../src/engine/wind.js';
import { deserialize, diceFrom, newGame, SAVE_VERSION } from '../src/engine/state.js';
import { stepTime } from '../src/engine/passage.js';
import { windAcross, windFlow } from '../src/scene/wind.js';
import { WAVE_LEVELS, waveLevel, windOnWater } from '../src/scene/waves.js';
import { content } from '../src/generated/content.js';

const dice = (seed = 1) => diceFor(createRng(deriveSeed(seed, 'wind')));
const character = { name: 'Test', gender: /** @type {'m'} */ ('m'), classId: 'rogue-fisher', stats: { fishingSkill: 0, fishFind: 0, treasureFind: 0 }, luck: 0, xp: 0, perks: {} };

/** @param {number} a @param {number} b  The angle between two bearings, 0 to 180. */
const apart = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180);

test('the centre has no direction, the rings are unsettled and steady', () => {
  assert.equal(windFrom(0), null);
  assert.equal(windKind(0), 'variable');
  assert.equal(windKind(3), 'unsettled');
  assert.equal(windKind(12), 'steady');
  for (let cell = 1; cell < 19; cell++) assert.equal(typeof windFrom(cell), 'number');
});

test('a roll12 over its change number keeps the wind, and 7 on 2d6 stays', () => {
  const steer = (/** @type {number} */ r12, /** @type {number} */ r2d6) => ({ ...dice(), roll12: () => r12, roll2d6: () => r2d6 });
  assert.equal(stepWind(12, 'spring', steer(content.rules.wind.changeOn + 1, 2)), 12);
  assert.equal(stepWind(12, 'spring', steer(1, 7)), 12);
});

test('the wind veers or backs a cell at a time, and never swings round at once', () => {
  const d = dice(5);
  let cell = windStart();
  for (let i = 0; i < 5000; i++) {
    const next = stepWind(cell, 'winter', d);
    const a = windFrom(cell);
    const b = windFrom(next);
    if (a !== null && b !== null) assert.ok(apart(a, b) <= 60, `${cell} -> ${next}: ${a}° to ${b}°`);
    cell = next;
  }
});

for (const season of ['spring', 'summer', 'autumn', 'winter']) {
  test(`over a long run the ${season} wind blows as its rose says (D176)`, () => {
    const d = dice(9);
    let cell = windStart();
    /** @type {number[]} */
    const count = Array(12).fill(0);
    let variable = 0;
    const steps = 300000;
    for (let i = 0; i < steps; i++) {
      cell = stepWind(cell, season, d);
      const from = windFrom(cell);
      if (from === null) variable++;
      else count[from / 30]++;
    }
    const wind = content.rules.wind;
    const total = wind.variable + wind.seasons[season].reduce((/** @type {number} */ a, /** @type {number} */ b) => a + b, 0);
    count.forEach((n, k) => {
      const want = (100 * wind.seasons[season][k]) / total;
      assert.ok(Math.abs((100 * n) / steps - want) < 1.5, `${season} from ${k * 30}°: ${((100 * n) / steps).toFixed(1)}%, the rose says ${want.toFixed(1)}%`);
    });
    assert.ok(Math.abs((100 * variable) / steps - (100 * wind.variable) / total) < 1.5, `variable ${((100 * variable) / steps).toFixed(1)}%`);
  });
}

test('a new game starts at the start cell; each half-hour step takes the wind stream only', () => {
  const g = newGame({ seed: 3, character });
  assert.equal(g.wind, windStart());
  const s = structuredClone(g);
  const { dice: all, commit } = diceFrom(s);
  stepTime(s, all);
  const after = commit();
  assert.notEqual(after.wind, g.streams.wind, 'the wind stream drew');
});

test('an old save gets the wind at its start, with its own stream', () => {
  const g = newGame({ seed: 4, character });
  const { wind: _w, ...old } = g;
  const { wind: _s, ...streams } = g.streams;
  const migrated = deserialize(JSON.stringify({ ...old, version: 24, streams }));
  assert.equal(migrated.version, SAVE_VERSION);
  assert.equal(migrated.wind, windStart());
  assert.equal(migrated.streams.wind, g.streams.wind);
});

test("only the wind's share across the view drifts the scene", () => {
  // Facing east (the reedy shore), south is on the right: a north wind blows left to right, a south wind right to
  // left, a west wind straight away from the player.
  assert.ok(Math.abs(windAcross({ windFrom: 0, windKind: 'steady' }, 90, 0) - 1) < 1e-9);
  assert.ok(Math.abs(windAcross({ windFrom: 180, windKind: 'steady' }, 90, 0) + 1) < 1e-9);
  assert.ok(Math.abs(windAcross({ windFrom: 270, windKind: 'steady' }, 90, 0)) < 1e-9);
  // Without a direction, the scene as first drawn.
  assert.equal(windAcross({}, 90, 0), 1);
  // A variable wind swings only part way.
  for (const now of [0, 20000, 60000, 100000]) assert.ok(Math.abs(windAcross({ windFrom: null, windKind: 'variable' }, 90, now)) <= 0.5);
});

test("the waves take the wind's share along the view: out from the bank at the player's back (D177)", () => {
  // Facing east: a west wind blows straight away from the player, an east wind into their face.
  assert.ok(Math.abs(windFlow({ windFrom: 270, windKind: 'steady' }, 90, 0).along - 1) < 1e-9);
  assert.ok(Math.abs(windFlow({ windFrom: 90, windKind: 'steady' }, 90, 0).along + 1) < 1e-9);
  assert.ok(Math.abs(windFlow({ windFrom: 0, windKind: 'steady' }, 90, 0).along) < 1e-9);
  assert.deepEqual(windFlow({}, 90, 0), { across: 1, along: 0 });
  assert.equal(windFlow({ windFrom: null, windKind: 'variable' }, 90, 0).along, 0);
  // windAcross is windFlow's across.
  for (const windFrom of [0, 30, 150, 300]) {
    assert.equal(windAcross({ windFrom, windKind: 'unsettled' }, 90, 1234), windFlow({ windFrom, windKind: 'unsettled' }, 90, 1234).across);
  }
});

test('the waves grow with the wind, and an offshore wind leaves the water by the bank calmer (D177)', () => {
  for (const table of [WAVE_LEVELS.share, WAVE_LEVELS.length, WAVE_LEVELS.foam, WAVE_LEVELS.drift, WAVE_LEVELS.roll]) {
    for (let w = 1; w <= 5; w++) assert.ok(table[w] >= table[w - 1]);
  }
  for (let w = 1; w <= 5; w++) assert.ok(WAVE_LEVELS.trough[w] <= WAVE_LEVELS.trough[w - 1]);
  assert.equal(waveLevel([0, 10], 0.5), 5);
  assert.equal(waveLevel([0, 10], 9), 10);
  assert.equal(windOnWater(4, -1, 1), 4);
  assert.ok(windOnWater(4, 1, 1) < windOnWater(4, 1, 0));
  assert.equal(windOnWater(4, 1, 0), 4);
});
