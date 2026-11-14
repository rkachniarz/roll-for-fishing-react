// @ts-check
// Game values, weighted tables and fish generation (R6.6, R3.2-R3.3, R4.7).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, deriveSeed } from '../src/rng.js';
import { diceFor } from '../src/dice.js';
import { applyValue, deriveValues } from '../src/engine/values.js';
import { locationTable, pick, preferenceFactor, preferencesMet, weatherWords } from '../src/engine/tables.js';
import { fishNameKeys, fishRarity, rollFish, sameFish, sizeBands } from '../src/engine/fish.js';
import { weatherAt } from '../src/engine/weather.js';
import { content } from '../src/generated/content.js';
import { t } from '../src/strings.js';

const dice = (seed = 1, label = 'line') => diceFor(createRng(deriveSeed(seed, label)));
const plain = { fishSizeBand: 0, fishDifficulty: 0, fishXp: 0 };

// ---------- Values ----------

test('a value is its base plus every effect on it, worked out fresh', () => {
  const laser = content.items['fishing-pole-laser-sight'];
  const v = deriveValues({ fishingSkill: 3, fishFind: 5, treasureFind: 2 }, [{ label: laser.id, effects: laser.effects }]);
  assert.equal(v.flat.fishingSkill, 5);
  assert.equal(v.flat.treasureFind, 0);
  assert.equal(v.flat.strikeLimit, 3000, 'untouched values keep their base');
  assert.deepEqual(v.parts.fishingSkill, [{ label: 'stat', value: 3 }, { label: 'fishing-pole-laser-sight', value: 2 }]);
});

test('a die on a value is rolled each time it applies, and shows in the breakdown', () => {
  const v = deriveValues({ fishingSkill: 2, fishFind: 0, treasureFind: 0 }, [{ label: 'charm', effects: [{ value: 'fishingSkill', add: 'd6' }] }]);
  const d = dice(7, 'effects');
  const totals = new Set();
  for (let i = 0; i < 200; i++) {
    const { total, mods } = applyValue(v, 'fishingSkill', d);
    assert.equal(mods[1].label, 'charm (d6)');
    totals.add(total);
  }
  assert.deepEqual([...totals].sort((a, b) => a - b), [3, 4, 5, 6, 7, 8]);
});

// ---------- Tables ----------

test('pick follows the weights', () => {
  const d = dice();
  const counts = { a: 0, b: 0 };
  for (let i = 0; i < 4000; i++) counts[/** @type {'a' | 'b'} */ (pick([{ id: 'a', weight: 1 }, { id: 'b', weight: 3 }], d)?.id)]++;
  assert.ok(counts.b / counts.a > 2.6 && counts.b / counts.a < 3.4, JSON.stringify(counts));
  assert.equal(pick([], d), null);
});

test("the Lake's junk table: its 38 items and the empty hook; the white things have their own (R19.1)", () => {
  const junk = locationTable({ location: 'lake', spot: null }, 'junk');
  assert.equal(junk.length, 38 + 1);
  assert.deepEqual(junk.at(-1), { id: null, weight: 45 });
  const stuff = locationTable({ location: 'lake', spot: null }, 'stuff');
  // The bottle (7.4), two map fragments (8.2), and what every spot has.
  assert.ok(['message-in-a-bottle', 'mage-tower-map-1', 'mage-tower-map-2', 'shiny-pebble'].every((id) => stuff.some((e) => e.id === id)));
  assert.ok(stuff.every((e) => content.items[e.id].category === 'stuff'));
});

test('unique treasure, once found, stops coming up', () => {
  const all = locationTable({ location: 'lake', spot: null }, 'treasure');
  const after = locationTable({ location: 'lake', spot: null }, 'treasure', { found: { 'heavy-bait': 1 } });
  assert.equal(all.length, 23);
  assert.equal(after.length, 22);
  assert.ok(!after.some((e) => e.id === 'heavy-bait'));
});

// ---------- What fish prefer (D101) ----------

test('the weather has words: read off its levels, and its tags for fog and snow', () => {
  const words = (/** @type {string} */ season, /** @type {number} */ cell) => weatherWords(weatherAt(season, cell, dice()));
  assert.deepEqual(words('summer', 4), ['sunny'], 'Hot and dry');
  assert.deepEqual(words('summer', 1), ['cloudy'], 'Cloudy and humid');
  assert.deepEqual(words('summer', 9), ['overcast', 'rain', 'storm', 'windy'], 'Warm storm');
  assert.deepEqual(words('autumn', 3), ['overcast', 'fog'], 'Thick fog soup');
  assert.deepEqual(words('winter', 16), ['overcast', 'storm', 'windy', 'snow'], 'Blizzard: snow, not rain');
});

/**
 * A moment to check preferences against.
 * @param {string} season @param {number} cell @param {any} partOfDay @param {string | null} [bait]
 */
const moment = (season, cell, partOfDay, bait = null) => ({ weather: weatherAt(season, cell, dice()), partOfDay, bait });

test('each preference met doubles the weight; "Any" never counts', () => {
  const zander = content.fish.zander; // sunset or night, overcast or fog, autumn, small fish
  const fog = moment('autumn', 3, 'night', 'small-fish');
  assert.deepEqual(preferencesMet(zander, fog), ['time', 'weather', 'season', 'bait']);
  assert.equal(preferenceFactor(zander, fog), 16);
  assert.equal(preferenceFactor(zander, moment('summer', 4, 'noon')), 1);
  assert.deepEqual(preferencesMet(zander, moment('autumn', 3, 'noon')), ['weather', 'season'], 'no bait, wrong time');
  // The roach has no season: Any.
  assert.deepEqual(preferencesMet(content.fish.roach, moment('summer', 1, 'morning', 'maggot')), ['time', 'weather', 'bait']);
});

test("a spot's table follows the moment", () => {
  const where = { location: 'lake', spot: 'reedy-shore' };
  const weight = (/** @type {ReturnType<typeof moment>} */ m, /** @type {string} */ id) => locationTable(where, 'fish', { moment: m }).find((e) => e.id === id)?.weight;
  const plainTable = locationTable(where, 'fish');
  assert.equal(plainTable.find((e) => e.id === 'muskellunge')?.weight, 2, 'rank 14 of 14');
  // Muskellunge: sunset, overcast, autumn, lure.
  assert.equal(weight(moment('autumn', 15, 'sunset', 'lure'), 'muskellunge'), 2 * 16);
  assert.equal(weight(moment('summer', 4, 'noon'), 'muskellunge'), 2);
});

// ---------- Fish ----------

test('sizes are whole centimetres within the band, and bigger bands are harder', () => {
  const d = dice(3);
  const bands = sizeBands();
  for (let i = 0; i < 500; i++) {
    const f = rollFish('northern-pike', plain, d); // 40-130 cm, difficulty 1
    assert.ok(Number.isInteger(f.size));
    const w = (130 - 40) / bands.length;
    assert.ok(f.size >= Math.round(40 + f.band * w) && f.size <= Math.round(40 + (f.band + 1) * w), `${f.size} in band ${f.band}`);
    assert.equal(f.difficulty, 1 + bands[f.band].difficulty);
  }
});

test('fishSizeBand shifts the band, and the difficulty follows the shifted band', () => {
  const d = dice(4);
  for (let i = 0; i < 300; i++) {
    const f = rollFish('zander', { ...plain, fishSizeBand: 2 }, d); // difficulty 1
    assert.ok(f.band >= 2, 'Tiny shifted twice is Medium at least');
    assert.equal(f.difficulty, 1 + sizeBands()[f.band].difficulty);
  }
});

test('rarity: species shifted by band, never below Poor or above Epic', () => {
  const shift = Object.fromEntries(sizeBands().map((b) => [b.id, b.rarity]));
  assert.equal(fishRarity('common', shift.humongous), 'epic'); // the owner's example: a gargantuan roach
  assert.equal(fishRarity('common', shift.gigantic), 'rare');
  assert.equal(fishRarity('rare', shift.large), 'epic'); // the owner's example: a huge pike
  assert.equal(fishRarity('rare', shift.humongous), 'epic'); // capped
  assert.equal(fishRarity('common', -1), 'poor'); // a Tiny roach
  assert.equal(fishRarity('poor', -1), 'poor');
  assert.equal(fishRarity('legendary', -1), 'legendary');
});

test('XP is the difficulty plus fishXp, never below 1', () => {
  const f = rollFish('roach', { ...plain, fishXp: -50 }, dice());
  assert.equal(f.xp, 1);
});

test('a fish has a name: band, subname, species', () => {
  const f = { species: 'northern-pike', subname: -1, band: 4, size: 120, difficulty: 6, xp: 6, rarity: 'epic' };
  assert.equal(fishNameKeys(f).map(t).join(' '), 'Gigantic Northern pike');
  assert.equal(fishNameKeys({ ...f, band: 2 }).map(t).join(' '), 'Northern pike', 'Medium has no word (D85)');
  assert.equal(fishNameKeys({ ...f, species: 'roach', subname: 2 }).map(t).join(' '), 'Gigantic Roach', "an old save's subname the Roach no longer has (D101)");
  assert.ok(sameFish(f, { ...f }));
  assert.ok(!sameFish(f, { ...f, size: 121 }));
});

test('the same seed rolls the same fish', () => {
  const run = () => Array.from({ length: 50 }, ((d) => () => rollFish('brown-trout', plain, d))(dice(9)));
  assert.deepEqual(run(), run());
});

// ---------- The light of the hour (4.3) ----------

test('night is dark, midday is not, dawn and dusk are warm, all by the sun', async () => {
  const { darkness, warmth, NIGHT } = await import('../src/scene/light.js');
  const sun = { rise: 6, set: 19 };
  assert.equal(darkness(12, sun), 0);
  assert.equal(darkness(23, sun), NIGHT);
  assert.equal(darkness(3, sun), NIGHT);
  assert.ok(darkness(6, sun) > 0 && darkness(6, sun) < NIGHT);
  assert.ok(darkness(19.5, sun) > 0 && darkness(19.5, sun) < NIGHT);
  assert.ok(Math.abs(warmth(6, sun) - 0.2) < 1e-9 && Math.abs(warmth(19, sun) - 0.2) < 1e-9);
  assert.equal(warmth(12, sun), 0);
  // Midsummer in Gdynia: still light at 21:00; midwinter: dark by then, and at 07:00.
  const summer = { rise: 4.2, set: 21.37 };
  const winter = { rise: 7.8, set: 15.47 };
  assert.ok(darkness(21, summer) < NIGHT / 2);
  assert.equal(darkness(21, winter), NIGHT);
  assert.ok(darkness(7, winter) > NIGHT / 2);
});
