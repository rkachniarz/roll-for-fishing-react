// @ts-check
// Game values, weighted tables and fish generation (R6.6, R3.2-R3.3, R4.7).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, deriveSeed } from '../src/rng.js';
import { diceFor } from '../src/dice.js';
import { applyValue, deriveValues } from '../src/engine/values.js';
import { locationTable, pick, weatherBonus } from '../src/engine/tables.js';
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

test("the Lake's junk table has its 38 items and the empty hook", () => {
  const junk = locationTable({ location: 'lake', spot: null }, 'junk');
  assert.equal(junk.length, 39);
  assert.deepEqual(junk.at(-1), { id: null, weight: 45 });
});

test('unique treasure, once found, stops coming up', () => {
  const all = locationTable({ location: 'lake', spot: null }, 'treasure');
  const after = locationTable({ location: 'lake', spot: null }, 'treasure', { found: { 'heavy-bait': 1 } });
  assert.equal(all.length, 7);
  assert.equal(after.length, 6);
  assert.ok(!after.some((e) => e.id === 'heavy-bait'));
});

test('the weather moves fish weights, as in the prototype', () => {
  const pike = content.fish.pike; // +8 at temperature 7 or below, +5 with clouds 2 or more
  const blizzard = weatherAt('winter', 16, dice());
  assert.equal(weatherBonus(pike, blizzard), 13);
  const table = locationTable({ location: 'lake', spot: null }, 'fish', { weather: blizzard });
  assert.equal(table.find((e) => e.id === 'pike')?.weight, 10 + 13);
});

// ---------- Fish ----------

test('sizes are whole centimetres within the band, and bigger bands are harder', () => {
  const d = dice(3);
  const bands = sizeBands();
  for (let i = 0; i < 500; i++) {
    const f = rollFish('pike', plain, d);
    assert.ok(Number.isInteger(f.size));
    const w = (150 - 30) / bands.length;
    assert.ok(f.size >= Math.round(30 + f.band * w) && f.size <= Math.round(30 + (f.band + 1) * w), `${f.size} in band ${f.band}`);
    assert.equal(f.difficulty, 2 + bands[f.band].difficulty);
  }
});

test('fishSizeBand shifts the band, and the difficulty follows the shifted band', () => {
  const d = dice(4);
  for (let i = 0; i < 300; i++) {
    const f = rollFish('carp', { ...plain, fishSizeBand: 2 }, d);
    assert.ok(f.band >= 2, 'Tiny shifted twice is Medium at least');
    assert.equal(f.difficulty, sizeBands()[f.band].difficulty);
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
  const f = { species: 'pike', subname: 0, band: 4, size: 120, difficulty: 6, xp: 6, rarity: 'epic' };
  assert.equal(fishNameKeys(f).map(t).join(' '), 'Gigantic Northern Pike');
  assert.equal(fishNameKeys({ ...f, band: 2 }).map(t).join(' '), 'Northern Pike', 'Medium has no word (D85)');
  assert.ok(sameFish(f, { ...f }));
  assert.ok(!sameFish(f, { ...f, size: 121 }));
});

test('the same seed rolls the same fish', () => {
  const run = () => Array.from({ length: 50 }, ((d) => () => rollFish('trout', plain, d))(dice(9)));
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
