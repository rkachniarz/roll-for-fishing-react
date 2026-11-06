// @ts-check
// The weather engine (R11.3, PORTING-NOTES §1.1).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, deriveSeed } from '../src/rng.js';
import { diceFor } from '../src/dice.js';
import { changeSeason, seasons, stepWeather, weatherAt, weatherWords } from '../src/engine/weather.js';
import { content } from '../src/generated/content.js';
import { t } from '../src/strings.js';

const dice = (seed = 1) => diceFor(createRng(deriveSeed(seed, 'weather')));

/**
 * Dice that always roll the given numbers, to steer one step.
 * @param {number} r12
 * @param {number} r2d6
 */
function fixed(r12, r2d6) {
  return { ...dice(), roll12: () => r12, roll2d6: () => r2d6 };
}

test('four seasons in order, 19 weathers each, every one described', () => {
  assert.deepEqual(seasons().map((s) => s.id), ['spring', 'summer', 'autumn', 'winter']);
  for (const s of seasons()) {
    assert.equal(s.weathers.length, 19);
    for (const w of s.weathers) assert.ok(w.descriptions.length > 0 && t(w.descriptions[0]) !== w.descriptions[0]);
  }
});

test('Summer #8 "Torrential rain" holds to the north, under its edge line', () => {
  const cell = content.weather.summer.weathers[8];
  assert.equal(t(cell.name), 'Torrential rain');
  assert.equal(cell.changeSet[0], 8);
});

test('4-12 on the d12: the weather holds (D92)', () => {
  const w = weatherAt('spring', 0, dice());
  for (const r12 of [4, 5, 6, 9, 12]) assert.equal(stepWeather(w, fixed(r12, 7)).changed, false);
});

test('2d6 picks the direction: 2 NW, 3-4 SW, 5-6 S, 7 SE, 8 NE, 9-10 stay, 11 N, 12 NW', () => {
  // From the centre cell, every direction leads somewhere new.
  const w = weatherAt('spring', 0, dice());
  const n = content.weather.spring.weathers[0].changeSet;
  const expect = { 2: n[5], 3: n[4], 4: n[4], 5: n[3], 6: n[3], 7: n[2], 8: n[1], 11: n[0], 12: n[5] };
  for (const [roll, cell] of Object.entries(expect)) {
    assert.equal(stepWeather(w, fixed(1, Number(roll))).weather.cell, cell, `2d6 = ${roll}`);
  }
  for (const roll of [9, 10]) assert.equal(stepWeather(w, fixed(1, roll)).changed, false);
});

test('ranged levels are rolled when the weather turns, within their range', () => {
  // Winter #0 "Cold and humid": wind 0-1.
  const winds = new Set();
  for (let seed = 0; seed < 50; seed++) winds.add(weatherAt('winter', 0, dice(seed)).wind);
  assert.deepEqual([...winds].sort(), [0, 1]);
});

test('the same seed drifts the same way', () => {
  const run = () => {
    const d = dice(42);
    let w = weatherAt('spring', 0, d);
    const cells = [];
    for (let i = 0; i < 200; i++) cells.push((w = stepWeather(w, d).weather).cell);
    return cells;
  };
  assert.deepEqual(run(), run());
});

test('a new season keeps the cell', () => {
  const w = weatherAt('summer', 13, dice());
  const next = changeSeason(w, 'autumn', dice());
  assert.equal(next.season, 'autumn');
  assert.equal(next.cell, 13);
});

test('the levels have words', () => {
  const words = weatherWords(weatherAt('winter', 16, dice()));
  assert.equal(t(words.name), 'Blizzard');
  assert.equal(t(words.temperature), 'Extremely cold');
  assert.equal(t(words.wind), 'Extreme');
});
