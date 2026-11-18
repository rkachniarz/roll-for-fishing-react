// @ts-check
// The moon and the fish (12.3, D168): its phase as a preference, the anglers'
// moon tables, the moonlight at night, and the pools.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content } from '../src/generated/content.js';
import { moonHourAngle, moonPosition, sunPosition } from '../src/engine/sky.js';
import { moonNow, moonWords, moonlight, solunarPeriod } from '../src/engine/moon.js';
import { preferencesMet } from '../src/engine/tables.js';
import { momentOf, valuesFor } from '../src/engine/game.js';
import { conditionBuffs } from '../src/engine/conditions.js';
import { diceFrom, newGame } from '../src/engine/state.js';
import { shadowsOf, stepPools, tended } from '../src/engine/pool.js';

const DAY = 24 * 60;
const STEP = 30;

/** A game whose welcome is behind it, at a game minute, its moon full at `fullMoonAt`. */
function game({ time = 10 * 60, seed = 1, fullMoonAt = 0, clouds = 0 } = {}) {
  const s = newGame({ seed, character: { name: 'Testek', gender: 'f', classId: 'fish-fighter', stats: { fishingSkill: 3, fishFind: 5, treasureFind: 0 }, luck: 0, xp: 0 } });
  return { ...s, time, fullMoonAt, weather: { ...s.weather, clouds }, eventsSeen: { welcome: 1 } };
}

/** A minute within a half hour of the one given where `when` holds, searching a day either way. @param {number} from @param {(m: number) => boolean} when */
function find(from, when) {
  for (let m = from; m < from + 2 * DAY; m += STEP) if (when(m)) return m;
  throw new Error('not found');
}

test('the moon tables: major with the moon due south or due north, minor around its rising and setting', () => {
  const full = 50 * DAY;
  let major = 0;
  let minor = 0;
  let steps = 0;
  for (let m = full; m < full + 14 * DAY; m += STEP) {
    const period = solunarPeriod(m, full);
    const angle = Math.abs(moonHourAngle(m, full));
    if (period === 'major') {
      major++;
      assert.ok(angle < 15 || angle > 165, `major at hour angle ${angle}`);
    } else {
      assert.ok(angle >= 15 && angle <= 165, `hour angle ${angle} should be major`);
    }
    if (period === 'minor') {
      minor++;
      const up = (/** @type {number} */ t) => moonPosition(t, full).altitude > 0;
      assert.notEqual(up(m - 30), up(m + 30), 'the moon crosses the horizon within the half hour');
    }
    steps++;
  }
  // Two hours twice a day are major (8 of the 48 half hours); the minor ones about one hour twice, less where they meet a major one.
  assert.ok(major / steps > 0.12 && major / steps < 0.22, `major ${major} of ${steps}`);
  assert.ok(minor / steps > 0.03 && minor / steps < 0.12, `minor ${minor} of ${steps}`);
});

test('moonlight: none by day, most from a high full moon in a clear sky, none under black cloud', () => {
  // Midwinter: the full moon rides high at midnight.
  const full = 98 * DAY; // a winter midnight (the seasons are 28 days, winter the fourth)
  const midnight = find(full - 3 * 60, (m) => solunarPeriod(m, full) === 'major' && moonPosition(m, full).altitude > 0);
  assert.ok(moonPosition(midnight, full).altitude > 30, 'the winter full moon rides high');
  assert.ok(moonlight(midnight, full, 0) > 0.9, String(moonlight(midnight, full, 0)));
  assert.ok(moonlight(midnight, full, 3) < moonlight(midnight, full, 0), 'clouds dim it');
  assert.equal(moonlight(midnight, full, 5), 0, 'black cloud hides it');
  const noon = find(full, (m) => sunPosition(m).altitude > 5);
  assert.equal(moonlight(noon, full, 0), 0, 'no moonlight by day');
  // At new moon there is next to none.
  const dark = full + 7 * DAY;
  assert.ok(moonlight(dark, full, 0) < 0.05);
});

test('the moon words: full and new day and night, a moonlit night, a dark night', () => {
  assert.deepEqual(moonWords({ lit: 1, light: 0, night: false }), ['full']);
  assert.deepEqual(moonWords({ lit: 0, light: 0, night: false }), ['new']);
  assert.deepEqual(moonWords({ lit: 0, light: 0, night: true }), ['new', 'dark']);
  assert.deepEqual(moonWords({ lit: 0.95, light: 0.8, night: true }), ['full', 'moonlit']);
  assert.deepEqual(moonWords({ lit: 0.5, light: 0.2, night: true }), []);
  for (const fish of Object.values(content.fish)) {
    for (const word of fish.prefers?.moon ?? []) assert.ok(content.rules['fish-preferences'].moonWords.some((/** @type {{ id: string }} */ w) => w.id === word), `${fish.id}: ${word}`);
  }
});

test('a state without a moon has none of it: no words, no period, no buff', () => {
  const { fullMoonAt, ...s } = game();
  assert.equal(moonNow(/** @type {any} */ (s)), null);
  assert.equal(momentOf(/** @type {any} */ (s)).moon, undefined);
  assert.ok(!conditionBuffs(/** @type {any} */ (s), 0).some((b) => b.source === 'moon'));
});

test('the moon counts as a preference: the eel on a dark new-moon night, the pike at full moon', () => {
  const full = 98 * DAY;
  const newMoonNight = game({ time: full + 7 * DAY + 60, fullMoonAt: full });
  const moment = momentOf(newMoonNight);
  assert.ok(moment.moon?.includes('new') && moment.moon.includes('dark'), String(moment.moon));
  assert.ok(preferencesMet(content.fish['mainland-eel'], moment).includes('moon'));
  assert.ok(!preferencesMet(content.fish['northern-pike'], moment).includes('moon'));
  const fullDay = momentOf(game({ time: full + 12 * 60, fullMoonAt: full }));
  assert.ok(preferencesMet(content.fish['northern-pike'], fullDay).includes('moon'), 'the full moon counts by day too');
});

test('a period of the moon tables is a buff outdoors that adds Fish Find, and none in town', () => {
  const full = 98 * DAY;
  const major = find(full, (m) => solunarPeriod(m, full) === 'major');
  const none = find(full, (m) => solunarPeriod(m, full) === null);
  const outdoors = game({ time: major, fullMoonAt: full });
  const buff = conditionBuffs(outdoors, 99).find((b) => b.source === 'moon');
  assert.equal(buff?.id, 'moon-major');
  const rule = content.rules.moon.periods.find((/** @type {{ id: string }} */ p) => p.id === 'major');
  const add = rule.effects.find((/** @type {{ value: string }} */ e) => e.value === 'fishFind').add;
  // Against the same moment without the moon, so the cold and the night stay the same (D126).
  const { fullMoonAt, ...moonless } = outdoors;
  assert.equal(valuesFor(outdoors).flat.fishFind - valuesFor(/** @type {any} */ (moonless)).flat.fishFind, add);
  assert.ok(!conditionBuffs(game({ time: none, fullMoonAt: full }), 99).some((b) => b.source === 'moon'));
  const town = { ...outdoors, location: 'town', spot: content.locations.town.spots[0].id };
  assert.ok(!conditionBuffs(town, 99).some((b) => b.source === 'moon'), 'not indoors');
});

test('a bright moon shows more shadows at night than no moon', () => {
  const full = 98 * DAY;
  const midnight = find(full - 3 * 60, (m) => solunarPeriod(m, full) === 'major' && moonPosition(m, full).altitude > 0);
  let lit = 0;
  let dark = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const s = tended(game({ seed, time: midnight, fullMoonAt: full }));
    const { fullMoonAt, ...moonless } = s;
    lit += shadowsOf(s).length;
    dark += shadowsOf(/** @type {any} */ (moonless)).length;
  }
  assert.ok(lit > dark, `${lit} shadows by moonlight, ${dark} without`);
});

test('the pools feel the moon tables: more come in a major period (D157)', () => {
  const full = 98 * DAY;
  const major = find(full + 3 * DAY, (m) => solunarPeriod(m, full) === 'major');
  const key = 'lake/reedy-shore';
  /** @param {boolean} moon */
  const count = (moon) => {
    let total = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const base = tended(game({ seed, time: major, fullMoonAt: full }));
      // An empty pool with room, so every arrival counts.
      const s = structuredClone({ ...base, escaped: { [key]: [] }, pools: { [key]: { ...base.pools[key], size: 30 } } });
      if (!moon) delete (/** @type {any} */ (s)).fullMoonAt;
      const { dice } = diceFrom(s);
      stepPools(s, dice);
      total += s.escaped[key].length;
    }
    return total;
  };
  assert.ok(count(true) > count(false), 'one more on the move');
});
