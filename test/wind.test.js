// @ts-check
// The wind's direction (D176): a compass hexflower drifting like the weather's maps.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, deriveSeed } from '../src/rng.js';
import { diceFor } from '../src/dice.js';
import { stepWind, windFrom, windKind, windStart } from '../src/engine/wind.js';
import { deserialize, diceFrom, newGame, SAVE_VERSION } from '../src/engine/state.js';
import { stepTime } from '../src/engine/passage.js';
import { windAcross } from '../src/scene/wind.js';
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
  assert.equal(stepWind(12, steer(content.rules.wind.changeOn + 1, 2)), 12);
  assert.equal(stepWind(12, steer(1, 7)), 12);
});

test('the wind veers or backs a cell at a time, and never swings round at once', () => {
  const d = dice(5);
  let cell = windStart();
  for (let i = 0; i < 5000; i++) {
    const next = stepWind(cell, d);
    const a = windFrom(cell);
    const b = windFrom(next);
    if (a !== null && b !== null) assert.ok(apart(a, b) <= 60, `${cell} -> ${next}: ${a}° to ${b}°`);
    cell = next;
  }
});

test("over a long run the wind is mostly westerly, Gdynia's turned for our sea (D176)", () => {
  const d = dice(9);
  let cell = windStart();
  let x = 0;
  let y = 0;
  let west = 0;
  let east = 0;
  const steps = 200000;
  for (let i = 0; i < steps; i++) {
    cell = stepWind(cell, d);
    const from = windFrom(cell);
    if (from === null) continue;
    x += Math.sin((from * Math.PI) / 180);
    y += Math.cos((from * Math.PI) / 180);
    if (from >= 240 && from <= 330) west++;
    if (from >= 60 && from <= 150) east++;
  }
  const mean = ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
  assert.ok(apart(mean, 300) <= 20, `mean wind from ${mean.toFixed(0)}°`);
  assert.ok(west / steps > 0.35 && west / steps < 0.6, `westerly ${((100 * west) / steps).toFixed(0)}%`);
  assert.ok(east / steps > 0.1, `easterlies still come: ${((100 * east) / steps).toFixed(0)}%`);
});

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
