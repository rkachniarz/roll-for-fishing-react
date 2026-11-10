// @ts-check
// Active abilities (R6.3, D96): cooldowns that count only an attempt at a
// catch, "next cast" abilities as buffs, abilities that light up.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content } from '../src/generated/content.js';
import { newGame } from '../src/engine/state.js';
import { castLine, chooseTreasure, poolKey, strikeLine, tick, tickBuffs, useAbility, valuesFor } from '../src/engine/game.js';
import { abilityStatus, activePerks, cooldownFor } from '../src/engine/abilities.js';

/** @typedef {import('../src/engine/state.js').GameState} GameState */
/** @typedef {import('../src/engine/game.js').GameCast} GameCast */

const XP = content.rules.levels.xp;

/**
 * A character of a class at a level, with these perks.
 * @param {string} classId
 * @param {Record<number, string>} perks
 * @param {number} [seed]
 */
function hero(classId, perks, seed = 1) {
  const level = Math.max(...Object.keys(perks).map(Number));
  return newGame({
    seed,
    character: { name: 'Testek', gender: 'f', classId, stats: { fishingSkill: 3, fishFind: 5, treasureFind: 7 }, luck: 0, xp: XP[level], perks },
  });
}

/**
 * One whole cast: strike `ms` after the splash (or, with 'early' or 'miss',
 * pull out before the bite or never strike).
 * @param {GameState} state
 * @param {number | 'early' | 'miss'} [ms]
 */
function play(state, ms = 100) {
  const out = castLine(state, 0);
  const cast = out.cast;
  if (ms === 'early') return { ...strikeLine(out.state, cast, cast.castAt + 1), line: cast.line };
  if (ms === 'miss') {
    const missed = tick(out.state, cast, cast.biteAt + cast.timing.lateMs);
    // Pull out in the pause, so it's one cast.
    const pulled = strikeLine(missed.state, missed.cast, /** @type {any} */ (missed.cast).endedAt + 1);
    return { ...pulled, events: [...missed.events, ...pulled.events], line: cast.line };
  }
  const bitten = tick(out.state, cast, cast.biteAt);
  return { ...strikeLine(bitten.state, bitten.cast, cast.biteAt + ms), line: cast.line };
}

/** @param {{ cast: GameCast }} out */
const resultOf = (out) => (out.cast.phase === 'done' ? out.cast.outcome.result : out.cast.phase);

test('the action bar holds the active perks, in level order', () => {
  const s = hero('fish-fighter', { 1: 'jump-in', 2: 'steady-hands', 3: 'battle-focus' });
  assert.deepEqual(activePerks(s), ['jump-in', 'battle-focus']);
});

test('a "next cast" ability: a buff for the next attempt, then a cooldown that counts only attempts', () => {
  let s = hero('fish-fighter', { 1: 'jump-in', 3: 'battle-focus' });
  const used = useAbility(s, 'battle-focus');
  s = used.state;
  assert.deepEqual(used.events[0], { type: 'ability', perk: 'battle-focus' });
  const buff = s.buffs.find((b) => b.source === 'battle-focus');
  assert.deepEqual(buff?.effects, [{ value: 'fishingSkill', add: 3 }], 'skill + level');
  // 10 casts less level 3.
  assert.deepEqual(s.cooldowns['battle-focus'], { casts: 7 });
  assert.equal(abilityStatus(s, 'battle-focus').usable, false);
  assert.equal(useAbility(s, 'battle-focus').state, s, 'not twice');

  // Pulling out before the bite: not an attempt. The buff stays, the cooldown holds.
  let out = play(s, 'early');
  assert.equal(resultOf(out), 'too-early');
  assert.ok(out.state.buffs.some((b) => b.source === 'battle-focus'));
  assert.deepEqual(out.state.cooldowns['battle-focus'], { casts: 7 });

  // A strike in time is an attempt: the buff is used up, the cooldown counts one.
  out = play(out.state);
  assert.ok(['caught', 'escaped', 'landed'].includes(String(resultOf(out))));
  assert.ok(!out.state.buffs.some((b) => b.source === 'battle-focus'));
  assert.deepEqual(out.state.cooldowns['battle-focus'], { casts: 6 });
  if (out.line.kind === 'fish') assert.ok(out.line.player.mods.some((m) => m.label === 'battle-focus' && m.value === 3));

  // A missed splash isn't an attempt.
  for (let i = 0; i < 50; i++) {
    const missed = play(out.state, 'miss');
    if (resultOf(missed) !== 'missed') continue;
    assert.deepEqual(missed.state.cooldowns['battle-focus'], { casts: 6 });
    break;
  }
});

test('a cooldown runs out, and the ability is usable again', () => {
  let s = hero('fish-fighter', { 1: 'jump-in', 3: 'battle-focus' });
  s = useAbility(s, 'battle-focus').state;
  for (let i = 0; i < 7; i++) s = { ...play(s).state, missStreak: 0, event: null, pendingCatch: null };
  assert.equal(s.cooldowns['battle-focus'], undefined);
  assert.equal(abilityStatus(s, 'battle-focus').usable, true);
});

test('an ability used while the line is out waits for the next cast', () => {
  let s = hero('fish-fighter', { 1: 'jump-in', 3: 'battle-focus' });
  const out = castLine(s, 0);
  const used = useAbility(out.state, 'battle-focus').state;
  const bitten = tick(used, out.cast, out.cast.biteAt);
  const struck = strikeLine(bitten.state, bitten.cast, out.cast.biteAt + 100);
  assert.ok(struck.state.buffs.some((b) => b.source === 'battle-focus'), 'still there after the cast it was used in');
  const next = castLine(struck.state, 0);
  if (next.cast.line.kind === 'fish') assert.ok(next.cast.line.player.mods.some((m) => m.label === 'battle-focus'));
  assert.ok(!next.state.buffs.some((b) => b.pending), 'counts from this cast');
});

test('Summon Fish makes a fish certain; Sleight of Hook rules one out', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const mage = useAbility(hero('fishing-wizard', { 1: 'summon-fish' }, seed), 'summon-fish').state;
    assert.equal(castLine(mage, 0).cast.line.kind, 'fish', `seed ${seed}`);
    const rogue = useAbility(hero('rogue-fisher', { 1: 'gut', 3: 'sleight-of-hook' }, seed), 'sleight-of-hook').state;
    assert.notEqual(castLine(rogue, 0).cast.line.kind, 'fish', `seed ${seed}`);
  }
});

test('Recall brings back a fish that got away', () => {
  let s = hero('fishing-wizard', { 1: 'summon-fish', 3: 'recall' });
  const lost = { species: 'northern-pike', subname: 0, band: 3, size: 60, difficulty: 9, xp: 9, rarity: 'common', tries: 1 };
  s = { ...s, escaped: { [poolKey(s)]: [lost] } };
  s = useAbility(useAbility(s, 'summon-fish').state, 'recall').state;
  const { cast } = castLine(s, 0);
  assert.equal(cast.line.kind === 'fish' && cast.line.fish.species, 'northern-pike');
});

test('Jump In lights up when a fish gets away, catches it, and goes dark with the next cast', () => {
  let s = hero('fish-fighter', { 1: 'jump-in' });
  // Strike late and badly until a fish gets away.
  for (let i = 0; i < 300; i++) {
    const out = play(s, 2500);
    s = { ...out.state, missStreak: 0, event: null, pendingCatch: null };
    if (resultOf(out) !== 'escaped') continue;
    assert.ok(out.events.some((e) => e.type === 'lit' && e.perk === 'jump-in'));
    const fish = s.lit['jump-in'].fish;
    const pool = s.escaped[poolKey(s)].length;
    const bucket = s.bucket.reduce((n, b) => n + b.count, 0);
    const used = useAbility(s, 'jump-in');
    assert.ok(used.events.some((e) => e.type === 'caught' && e.fish.species === fish?.species));
    assert.equal(used.state.escaped[poolKey(s)].length, pool - 1);
    assert.equal(used.state.bucket.reduce((n, b) => n + b.count, 0), bucket + 1);
    assert.deepEqual(used.state.cooldowns['jump-in'], { casts: 10 });
    assert.equal(used.state.lit['jump-in'], undefined);
    // Unused, it goes dark when the next line goes out.
    assert.deepEqual(castLine(s, 0).state.lit, {});
    return;
  }
  assert.fail('no fish ever got away');
});

test('Gut lights up after a catch, and empties the fish into the bags', () => {
  let s = hero('rogue-fisher', { 1: 'gut' });
  for (let i = 0; i < 300; i++) {
    const out = play(s, 100);
    s = { ...out.state, missStreak: 0, event: null };
    if (resultOf(out) !== 'caught' || !s.lit.gut) continue;
    const fish = s.bucket.reduce((n, b) => n + b.count, 0);
    const bags = s.bags.reduce((n, b) => n + b.count, 0);
    const used = useAbility(s, 'gut');
    const gutted = used.events.find((e) => e.type === 'gutted');
    assert.ok(gutted);
    assert.equal(used.state.bucket.reduce((n, b) => n + b.count, 0), fish - 1);
    assert.equal(used.state.bags.reduce((n, b) => n + b.count, 0), bags + (gutted.item ? 1 : 0));
    assert.notEqual(used.state.streams.abilities, s.streams.abilities, 'its own stream');
    assert.equal(used.state.streams.line, s.streams.line, "the line's stream untouched");
    return;
  }
  assert.fail('never caught a fish');
});

test("an ability on cooldown doesn't light up", () => {
  let s = hero('fish-fighter', { 1: 'jump-in' });
  s = { ...s, cooldowns: { 'jump-in': { casts: 3 } } };
  for (let i = 0; i < 300; i++) {
    const out = play(s, 2500);
    s = { ...out.state, missStreak: 0, event: null, pendingCatch: null, cooldowns: { 'jump-in': { casts: 3 } } };
    if (resultOf(out) !== 'escaped') continue;
    assert.ok(!out.events.some((e) => e.type === 'lit'));
    assert.equal(out.state.lit['jump-in'], undefined);
    return;
  }
  assert.fail('no fish ever got away');
});

test('a cooldown can count real time, while the game is open', () => {
  let s = hero('fish-fighter', { 1: 'jump-in' });
  s = { ...s, cooldowns: { 'jump-in': { ms: 1000 } } };
  s = tickBuffs(s, 400).state;
  assert.deepEqual(s.cooldowns['jump-in'], { ms: 600 });
  s = tickBuffs(s, 600).state;
  assert.equal(s.cooldowns['jump-in'], undefined);
});

test('cooldowns that shorten with level never go below one cast', () => {
  const s = hero('fish-fighter', { 1: 'jump-in', 3: 'battle-focus' });
  const high = { ...s, character: { ...s.character, xp: XP[XP.length - 1] } };
  assert.equal(cooldownFor(high, 'battle-focus').casts, 1);
  assert.equal(valuesFor(s).flat.naturalCatch, 20);
});

// ---------- The rest of the level 3 and 5 perks (D106) ----------

const TREASURES = new Set(content.tables['common-treasure'].entries.map((/** @type {{ id: string }} */ e) => e.id));
/**
 * @param {string} value
 * @param {number} add
 */
const boost = (value, add) => ({ label: 'test', effects: [{ value, add }] });
const FISH = boost('biteCertain', 1);
const NO_FISH = boost('biteCertain', -1);

test('Rift Fishing brings fish from the rift table now and then; Bend Reality doubles the chance', () => {
  let alone = 0;
  let doubled = 0;
  for (let seed = 1; seed <= 400; seed++) {
    const rift = castLine(hero('fishing-wizard', { 1: 'summon-fish', 3: 'rift-fishing' }, seed), 0, { extra: [FISH] }).cast.line;
    const both = castLine(hero('fishing-wizard', { 1: 'summon-fish', 3: 'rift-fishing', 5: 'bend-reality' }, seed), 0, { extra: [FISH] }).cast.line;
    const plain = castLine(hero('fishing-wizard', { 1: 'summon-fish', 3: 'recall' }, seed), 0, { extra: [FISH] }).cast.line;
    for (const line of [rift, both, plain]) {
      assert.equal(line.kind, 'fish');
      if (line.kind === 'fish') assert.equal(Boolean(line.rift), Boolean(content.fish[line.fish.species].rift), 'a rift fish only from the rift');
    }
    if (rift.kind === 'fish' && rift.rift) alone++;
    if (both.kind === 'fish' && both.rift) doubled++;
    assert.ok(plain.kind === 'fish' && !plain.rift, 'never without the perk');
  }
  assert.ok(alone > 20 && alone < 70, `about one in ten: ${alone} of 400`);
  assert.ok(doubled > alone * 1.5, `about twice as often: ${doubled} against ${alone}`);
});

test('a Greedy fish brings what was caught on it into the bags', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const s = hero('rogue-fisher', { 1: 'gut', 3: 'greedy-fish' }, seed);
    const out = castLine(s, 0, { extra: [FISH, boost('greedyChance', 100)] });
    const line = out.cast.line;
    assert.equal(line.kind, 'fish');
    // Its catch can be the empty hook: then it isn't Greedy after all.
    if (line.kind !== 'fish' || !line.carried) continue;
    const bitten = tick(out.state, out.cast, out.cast.biteAt);
    const done = strikeLine(bitten.state, bitten.cast, out.cast.biteAt + 100);
    if (resultOf(done) !== 'caught') continue;
    const item = line.kind === 'fish' ? line.carried?.id : undefined;
    const caught = done.events.find((e) => e.type === 'caught');
    assert.equal(caught?.fish.greedy, true, 'named Greedy in the log');
    assert.ok(!done.state.bucket.some((b) => b.fish.greedy), 'but not in the bucket');
    assert.ok(done.events.some((e) => e.type === 'greedy' && e.item === item));
    assert.ok(done.state.bags.some((b) => b.id === item));
    return;
  }
  assert.fail('never caught a Greedy fish');
});

test('Ever-Summoning: a fish for certain every other cast', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const s = hero('fishing-wizard', { 1: 'summon-fish', 3: 'recall', 5: 'ever-summoning' }, seed);
    assert.equal(castLine({ ...s, book: { ...s.book, casts: 1 } }, 0).cast.line.kind, 'fish', `seed ${seed}`);
    assert.equal(castLine({ ...s, book: { ...s.book, casts: 3 } }, 0).cast.line.kind, 'fish', `seed ${seed}`);
  }
});

test('Bend Reality lights up after a catch and makes the fish bigger and rarer', () => {
  let s = hero('fishing-wizard', { 1: 'summon-fish', 3: 'recall', 5: 'bend-reality' });
  const RARITIES = ['poor', 'common', 'uncommon', 'rare', 'epic', 'legendary'];
  for (let i = 0; i < 300; i++) {
    const out = play(s, 100);
    s = { ...out.state, missStreak: 0, event: null };
    if (resultOf(out) !== 'caught' || !s.lit['bend-reality']) continue;
    const fish = /** @type {import('../src/engine/fish.js').FishInstance} */ (s.lit['bend-reality'].fish);
    const used = useAbility(s, 'bend-reality');
    const bent = used.events.find((e) => e.type === 'bent')?.fish;
    assert.ok(bent?.bent);
    assert.equal(bent.band, Math.min(fish.band + 1, content.rules['size-bands'].bands.length - 1));
    assert.ok(bent.size >= fish.size);
    assert.equal(RARITIES.indexOf(bent.rarity), Math.min(RARITIES.indexOf(fish.rarity) + 1, 4));
    assert.ok(used.state.bucket.some((b) => b.fish.bent), 'in the bucket, bent');
    assert.equal(used.state.character.xp - s.character.xp, bent.xp - fish.xp);
    assert.deepEqual(used.state.cooldowns['bend-reality'], { casts: 10 });
    return;
  }
  assert.fail('never caught a fish');
});

test('Fence: two treasures to choose from, no cast until one is kept; Gut ready after 3 casts', () => {
  let s = hero('rogue-fisher', { 1: 'gut', 3: 'greedy-fish', 5: 'fence' });
  assert.deepEqual(cooldownFor(s, 'gut'), { casts: 3 });
  assert.deepEqual(cooldownFor(hero('rogue-fisher', { 1: 'gut' }), 'gut'), { casts: 10 });
  const out = castLine(s, 0, { extra: [NO_FISH, boost('treasureFind', 1000)] });
  const line = out.cast.line;
  if (line.kind !== 'item' || !line.alt) return assert.fail('two treasures');
  assert.notEqual(line.alt, line.id);
  assert.ok(TREASURES.has(line.id) && TREASURES.has(line.alt));
  const bitten = tick(out.state, out.cast, out.cast.biteAt);
  const done = strikeLine(bitten.state, bitten.cast, out.cast.biteAt + 100);
  assert.equal(resultOf(done), 'landed');
  s = { ...done.state, event: null };
  assert.deepEqual(s.pendingTreasure, [line.id, line.alt]);
  assert.deepEqual(castLine(s, 0).events, [{ type: 'treasure-choice' }]);
  const kept = chooseTreasure(s, line.alt);
  assert.equal(kept.state.pendingTreasure, null);
  assert.ok(kept.state.bags.some((b) => b.id === line.alt));
  assert.ok(!kept.state.bags.some((b) => b.id === line.id), 'the other goes back');
  assert.equal(chooseTreasure(kept.state, 'anything').state, kept.state);
});

test('Polish: the next junk is treasure, however many casts away', () => {
  let s = useAbility(hero('rogue-fisher', { 1: 'gut', 3: 'sleight-of-hook', 5: 'polish' }), 'polish').state;
  assert.ok(s.buffs.some((b) => b.source === 'polish'));
  assert.deepEqual(s.cooldowns.polish, { casts: 10 });
  const junkOnly = [NO_FISH, boost('treasureFind', -1000)];
  // Pulled out early: nothing found, Polish waits.
  let out = castLine(s, 0, { extra: junkOnly });
  const early = strikeLine(out.state, out.cast, out.cast.castAt + 1);
  assert.ok(early.state.buffs.some((b) => b.source === 'polish'));
  for (let i = 0; i < 50; i++) {
    out = castLine(s, 0, { extra: junkOnly });
    const line = out.cast.line;
    const bitten = tick(out.state, out.cast, out.cast.biteAt);
    const done = strikeLine(bitten.state, bitten.cast, out.cast.biteAt + 100);
    s = { ...done.state, event: null };
    if (line.kind !== 'item') {
      assert.ok(s.buffs.some((b) => b.source === 'polish'), 'an empty hook is no junk');
      continue;
    }
    assert.ok(line.polished && TREASURES.has(line.id));
    assert.ok(done.events.some((e) => e.type === 'polished'));
    assert.ok(!s.buffs.some((b) => b.source === 'polish'), 'used up');
    return;
  }
  assert.fail('never found junk');
});
