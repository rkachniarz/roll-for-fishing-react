// @ts-check
// Champions: class fish (D114).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deserialize, newGame, SAVE_VERSION } from '../src/engine/state.js';
import { castLine, releaseFish, strikeLine, tick, travel, useAbility, valuesFor } from '../src/engine/game.js';
import { championRules, championsHere, maybeChampion, poolKey } from '../src/engine/champions.js';
import { rollFish, sizeBands } from '../src/engine/fish.js';
import { WATER } from '../src/engine/features.js';
import { createRng } from '../src/rng.js';
import { diceFor } from '../src/dice.js';
import { content } from '../src/generated/content.js';

/** @typedef {import('../src/engine/state.js').GameState} GameState */
/** @typedef {import('../src/engine/game.js').GameCast} GameCast */

const AT = { x: 120, y: 100 };

/** @param {number} skill  The fishing skill: high lands every fish, low none. */
function game(skill = 3, seed = 1) {
  return newGame({ seed, character: { name: 'Testek', gender: 'f', classId: 'rogue-fisher', stats: { fishingSkill: skill, fishFind: 5, treasureFind: 7 }, luck: 0, xp: 0, perks: {} } });
}

/**
 * The state with a champion of `cls` on the water where the player is.
 * @param {GameState} state
 * @param {string} cls
 * @param {Partial<import('../src/engine/champions.js').Champion>} [extra]
 */
function withChampion(state, cls, extra = {}) {
  const minBand = sizeBands().findIndex((/** @type {{ id: string }} */ b) => b.id === championRules().minBand);
  const fish = rollFish('northern-pike', { fishSizeBand: 0, fishDifficulty: 0, fishXp: 0 }, diceFor(createRng(7)), { minBand });
  const champion = { class: cls, fish: { ...fish, xp: fish.xp * 2, champion: cls }, ...AT, born: -1, ...extra };
  const key = poolKey(state);
  return { ...state, champions: { ...state.champions, [key]: [...(state.champions[key] ?? []), champion] } };
}

/** Strikes fast on the splash. */
function strikeOn(/** @type {GameState} */ state, /** @type {GameCast} */ cast) {
  const bitten = tick(state, cast, cast.biteAt);
  return strikeLine(bitten.state, bitten.cast, cast.biteAt + 100);
}

test('a champion comes up in place of a feature: a large fish from the spot, worth twice the XP, never two of a class', () => {
  const rules = championRules();
  const chance = rules.chance;
  rules.chance = 100;
  try {
    const dice = diceFor(createRng(3));
    const state = game();
    for (let i = 0; i < 5; i++) maybeChampion(state, dice, WATER);
    const here = championsHere(state);
    assert.equal(here.length, rules.max, 'no more than the most at once');
    assert.equal(new Set(here.map((c) => c.class)).size, here.length, 'never two of the same class');
    const spot = content.locations.lake.spots.find((/** @type {{ id: string }} */ s) => s.id === state.spot);
    const minBand = sizeBands().findIndex((/** @type {{ id: string }} */ b) => b.id === rules.minBand);
    for (const c of here) {
      assert.ok(spot.fish.some((/** @type {{ id: string }} */ e) => e.id === c.fish.species) || content.locations.lake.fish.some((/** @type {{ id: string }} */ e) => e.id === c.fish.species), 'a fish of the spot');
      assert.ok(c.fish.band >= minBand, 'large or bigger');
      assert.equal(c.fish.champion, c.class);
      assert.equal(c.fish.xp, Math.max(c.fish.difficulty, 1) * rules.xpFactor, 'twice the XP');
    }
  } finally {
    rules.chance = chance;
  }
});

test('a cast by a champion hooks it; caught, it goes into the bucket, off the water, into the book', () => {
  const start = withChampion(game(60), 'cleric');
  const out = castLine(start, 0, { landing: AT });
  assert.ok(out.events.some((e) => e.type === 'champion-hit'));
  assert.equal(out.cast.line.kind, 'fish', 'a fish for certain');
  if (out.cast.line.kind !== 'fish') return;
  assert.equal(out.cast.line.fish.champion, 'cleric');
  const done = strikeOn(out.state, out.cast);
  assert.ok(done.events.some((e) => e.type === 'champion-caught'));
  assert.deepEqual(championsHere(done.state), [], 'gone from the water');
  assert.equal(done.state.bucket[0].fish.champion, 'cleric', 'its class kept in the bucket');
  assert.equal(done.state.book.champions?.cleric, 1, 'marked in the book');
  assert.equal(valuesFor(done.state).flat.fishResistance, 0, 'its effect is gone');
});

test("one that gets away stays where it is, and isn't in the pool", () => {
  const start = withChampion(game(-60), 'knight');
  const out = castLine(start, 0, { landing: AT });
  const done = strikeOn(out.state, out.cast);
  assert.ok(done.events.some((e) => e.type === 'escaped'));
  const [knight] = championsHere(done.state);
  assert.deepEqual({ x: knight.x, y: knight.y }, AT);
  assert.equal(knight.fish.tries, 1);
  assert.deepEqual(done.state.escaped, {});
});

test('let go, a champion is an ordinary fish in the pool', () => {
  let state = withChampion(game(60), 'witch', { spell: 'darkness', spellLeft: 15 });
  state = { ...state, bucket: [], pendingCatch: null };
  const out = castLine(state, 0, { landing: AT });
  const done = strikeOn(out.state, out.cast);
  const full = { ...done.state, pendingCatch: done.state.bucket[0].fish, bucket: [] };
  const released = releaseFish(full, 'new');
  const [pooled] = released.state.escaped[poolKey(released.state)];
  assert.equal(pooled.champion, undefined);
  assert.deepEqual(championsHere(released.state), [], 'not back on the water');
});

test('its effects are on casts at its own spot only', () => {
  const state = withChampion(game(), 'witch', { spell: 'darkness', spellLeft: 15 });
  assert.equal(valuesFor(state).flat.fishFind, valuesFor(game()).flat.fishFind - 10);
  assert.equal(valuesFor(state).flat.treasureFind, valuesFor(game()).flat.treasureFind - 10);
  const away = travel(state, 'lake', 'swamp', { force: true }).state;
  assert.equal(valuesFor(away).flat.fishFind, valuesFor(game()).flat.fishFind, 'not at another spot');
  assert.equal(away.champions['lake/reedy-shore'].length, 1, 'but still there, waiting');
});

test('a witch casts another spell when hers runs out', () => {
  let state = withChampion(game(), 'witch', { spell: 'darkness', spellLeft: 1 });
  const out = castLine(state, 0, { landing: { x: 200, y: 180 } });
  const done = strikeOn(out.state, out.cast);
  assert.ok(done.events.some((e) => e.type === 'champion-spell'));
  const [witch] = championsHere(done.state);
  assert.notEqual(witch.spell, 'darkness');
  assert.ok((witch.spellLeft ?? 0) >= 15 && (witch.spellLeft ?? 0) <= 20);
});

test('Gravitational Chaos sends half the casts way off; Slow doubles cooldowns', () => {
  const chaos = withChampion(game(), 'witch', { spell: 'gravitational-chaos', spellLeft: 15 });
  assert.equal(valuesFor(chaos).flat.wildCast, 50);
  const slow = withChampion({ ...game(), character: { ...game().character, perks: { 1: 'summon-fish' } } }, 'witch', { spell: 'slow', spellLeft: 15 });
  const plain = useAbility({ ...slow, champions: {} }, 'summon-fish').state.cooldowns['summon-fish'];
  const slowed = useAbility(slow, 'summon-fish').state.cooldowns['summon-fish'];
  assert.equal(slowed.casts, (plain.casts ?? 0) * 2);
});

test("a knight gives the fish's roll advantage half the time; a cleric adds to every fish's roll", () => {
  let state = withChampion(withChampion(game(), 'knight', { x: 230, y: 20 }), 'cleric', { x: 230, y: 20 });
  let knighted = 0;
  let fish = 0;
  for (let i = 0; i < 200; i++) {
    const out = castLine(state, 0, { landing: { x: 60, y: 160 } });
    state = { ...out.state, missStreak: 0 };
    const roll = out.cast.rolls.find((r) => r.kind === 'resistance');
    if (!roll || out.cast.line.kind !== 'fish') continue;
    fish++;
    if (roll.dropped) knighted++;
    assert.ok(roll.mods.some((m) => m.label === 'cleric' && m.value === 3));
    assert.equal(out.cast.line.required, roll.result + out.cast.line.fish.difficulty + 3);
  }
  assert.ok(fish > 20);
  assert.ok(knighted > fish * 0.3 && knighted < fish * 0.7, `${knighted} of ${fish}`);
});

test('a rogue steals what comes up and gives it back when caught; it slips away after every cast', () => {
  let state = withChampion(game(60), 'rogue', { stolen: [], x: 230, y: 20 });
  let stolen = null;
  for (let i = 0; i < 500 && !stolen; i++) {
    const out = castLine(state, 0, { landing: { x: 60, y: 160 } });
    const done = strikeOn(out.state, out.cast);
    state = { ...done.state, missStreak: 0, bucket: [], pendingCatch: null, pendingTreasure: null, event: null };
    stolen = done.events.find((e) => e.type === 'champion-stole');
    if (stolen) {
      assert.ok(!done.state.bags.some((b) => b.id === stolen.item), 'not in the bags');
      assert.notEqual(content.items[stolen.item].category, 'junk', 'never junk');
    }
  }
  assert.ok(stolen, 'something was stolen');
  const [rogue] = championsHere(state);
  assert.ok(rogue.stolen?.includes(stolen.item));
  const at = { x: rogue.x, y: rogue.y };
  const out = castLine(state, 0, { landing: at });
  assert.ok(out.cast.line.kind === 'fish' && out.cast.line.fish.champion === 'rogue');
  const resistance = out.cast.rolls.find((r) => r.kind === 'resistance');
  assert.ok(resistance?.mods.some((m) => m.label === 'rogue' && m.value === 3), 'harder to catch');
  const done = strikeOn(out.state, out.cast);
  assert.ok(done.events.some((e) => e.type === 'champion-recovered' && e.item === stolen.item));
  assert.ok(done.state.bags.some((b) => b.id === stolen.item), 'yours again');

  const moving = withChampion(game(), 'rogue', { stolen: [] });
  const cast = castLine(moving, 0, { landing: { x: 60, y: 160 } });
  const after = strikeOn(cast.state, cast.cast);
  const [moved] = championsHere(after.state);
  assert.notDeepEqual({ x: moved.x, y: moved.y }, AT);
});

test('a shaman calls up wild weather from any season, at once and again every few casts', () => {
  const state = withChampion(game(), 'shaman', { weatherLeft: 0 });
  const out = castLine(state, 0, { landing: { x: 60, y: 160 } });
  const done = strikeOn(out.state, out.cast);
  assert.ok(done.events.some((e) => e.type === 'champion-weather'));
  const wild = championRules().classes.find((/** @type {{ id: string }} */ c) => c.id === 'shaman').weathers;
  assert.ok(wild.some((/** @type {{ season: string, cell: number }} */ w) => w.season === done.state.weather.season && w.cell === done.state.weather.cell));
  assert.ok((championsHere(done.state)[0].weatherLeft ?? 0) >= 8);
});

test('a save from version 10 gains champions and their stream', () => {
  const { champions, ...rest } = game(13);
  const v10 = { ...rest, version: 10, book: { casts: 0, catches: 0, fish: {} }, streams: Object.fromEntries(Object.entries(rest.streams).filter(([k]) => k !== 'champions')) };
  const migrated = deserialize(JSON.stringify(v10));
  assert.equal(migrated.version, SAVE_VERSION);
  assert.deepEqual(migrated.champions, {});
  assert.deepEqual(migrated.book.champions, {});
  assert.equal(migrated.streams.champions, game(13).streams.champions);
});
