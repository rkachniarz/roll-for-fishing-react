// @ts-check
// The game state, saves and the cast pipeline (R1, R2-R3, R12; DEV_PLAN 2.1,
// 2.6-2.13), ending with a whole headless session from a seed (2.8).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_VERSION, deserialize, levelFor, newGame, serialize } from '../src/engine/state.js';
import { MISS_LIMIT, cancelBuff, castLine, scatter, strikeLine, tick, tickBuffs, valuesFor } from '../src/engine/game.js';
import { createRng } from '../src/rng.js';
import { diceFor } from '../src/dice.js';
import { TIME } from '../src/engine/time.js';

/** @typedef {import('../src/engine/state.js').GameState} GameState */
/** @typedef {import('../src/engine/game.js').GameCast} GameCast */

const character = /** @type {const} */ ({
  name: 'Testek',
  gender: 'f',
  classId: 'rogue',
  stats: { fishingSkill: 3, fishFind: 5, treasureFind: 7 },
});
const game = (seed = 1) => newGame({ seed, character: { ...character, luck: 0, xp: 0 } });

/**
 * Casts until the line holds something of `kind`, so a test can pick its case
 * without steering the dice.
 * @param {GameState} state
 * @param {(cast: GameCast) => boolean} wanted
 */
function castUntil(state, wanted) {
  for (let i = 0; i < 500; i++) {
    const out = castLine(state, 0);
    if (wanted(out.cast)) return out;
    state = { ...out.state, missStreak: 0 };
  }
  throw new Error('never came up');
}

/** Strikes `ms` after the splash. */
function strikeAfter(/** @type {GameState} */ state, /** @type {GameCast} */ cast, ms) {
  const bitten = tick(state, cast, cast.biteAt);
  return strikeLine(bitten.state, bitten.cast, cast.biteAt + ms);
}

// ---------- State and saves (2.1) ----------

test('a new game: the Lake, the stick, spring at 08:00, every stream seeded', () => {
  const s = game();
  assert.equal(s.version, SAVE_VERSION);
  assert.equal(s.location, 'lake');
  assert.deepEqual(s.equipped, { rod: 'stick', bait: null });
  assert.equal(s.time, TIME.startMinutes);
  assert.equal(s.weather.season, 'spring');
  assert.equal(s.character.luck, 0, 'Luck starts at 0 (R6.7)');
  assert.equal(Object.keys(s.streams).length, 8);
  assert.deepEqual(s.features, []);
});

test('a save round-trips, and a save from a newer game is refused', () => {
  const { state } = castLine(game(), 0);
  assert.deepEqual(deserialize(serialize(state)), state);
  assert.throws(() => deserialize(JSON.stringify({ ...state, version: SAVE_VERSION + 1 })), /newer version/);
  assert.throws(() => deserialize('{}'), /Not a saved game/);
});

test('the save holds no content, only ids', () => {
  const text = serialize(game());
  assert.ok(!text.includes('Everyone starts somewhere'), 'no item text in the save');
});

test('levels follow the XP curve', () => {
  assert.deepEqual([0, 9, 10, 24, 25, 4999, 5000, 99999].map(levelFor), [0, 0, 1, 1, 2, 8, 9, 9]);
});

// ---------- The cast (2.6) ----------

test('the same seed casts the same line; so does a reload from the checkpoint (D53, D63)', () => {
  const first = castLine(game(5), 0);
  assert.deepEqual(castLine(game(5), 0).cast, first.cast);
  const reloaded = deserialize(serialize(first.checkpoint));
  assert.deepEqual(castLine(reloaded, 0).cast.line, first.cast.line);
});

test('everything on the line is rolled when it goes out, hidden (D63)', () => {
  const { cast } = castLine(game(), 0);
  assert.ok(cast.line);
  assert.ok(cast.rolls.length > 0);
  assert.ok(cast.rolls.every((r) => r.visible === false));
});

test('a fish: a strike in time rolls the visible d20 against it', () => {
  const { state, cast } = castUntil(game(2), (c) => c.line.kind === 'fish');
  const out = strikeAfter(state, cast, 200);
  const roll = out.cast.phase === 'done' ? out.cast.outcome.rolls[0] : null;
  assert.ok(roll && roll.visible && roll.die === 'd20');
  assert.ok(roll.mods.some((m) => m.label === 'skill' && m.value === 3));
  assert.ok(roll.mods.some((m) => m.label === 'fast reaction'));
  assert.ok(['caught', 'escaped'].includes(out.cast.phase === 'done' ? out.cast.outcome.result : ''));
});

test('a catch goes into the bucket and the book, and gives XP', () => {
  for (let seed = 1; seed < 200; seed++) {
    const { state, cast } = castUntil(game(seed), (c) => c.line.kind === 'fish');
    const out = strikeAfter(state, cast, 200);
    if (!out.events.some((e) => e.type === 'caught')) continue;
    const fish = cast.line.kind === 'fish' ? cast.line.fish : null;
    assert.ok(fish);
    assert.equal(out.state.bucket[0].fish.species, fish.species);
    assert.equal(out.state.book.catches, 1);
    assert.equal(out.state.book.fish[fish.species].largest.size, fish.size);
    assert.equal(out.state.character.xp, fish.xp);
    return;
  }
  assert.fail('no catch in 200 seeds');
});

test('junk and treasure are landed by any strike in time, with no d20 (D64)', () => {
  const { state, cast } = castUntil(game(3), (c) => c.line.kind === 'item');
  const out = strikeAfter(state, cast, 2500);
  assert.equal(out.cast.phase === 'done' && out.cast.outcome.result, 'landed');
  assert.equal(out.cast.phase === 'done' && out.cast.outcome.rolls.length, 0);
  const id = cast.line.kind === 'item' ? cast.line.id : '';
  assert.deepEqual(out.state.bags, [{ id, count: 1 }]);
  assert.equal(out.state.found[id], 1);
});

test('every resolved cast moves time on 30 minutes and may move the weather', () => {
  const { state, cast } = castLine(game(), 0);
  const out = strikeLine(state, cast, 1); // too early
  assert.equal(out.state.time, TIME.startMinutes + 30);
});

// ---------- Missing the splash (D64) and the escaped pool (2.7) ----------

test('a missed fish joins the pool; after the pause the line counts as cast again', () => {
  const { state, cast } = castUntil(game(4), (c) => c.line.kind === 'fish');
  const late = cast.biteAt + cast.timing.lateMs;
  const missed = tick(state, cast, late);
  assert.equal(missed.state.missStreak, 1);
  assert.equal(missed.state.escaped.lake.length, 1);
  assert.equal(missed.state.escaped.lake[0].tries, 1);

  const waiting = tick(missed.state, missed.cast, late + cast.missPause - 1);
  assert.equal(waiting.cast, missed.cast, 'nothing happens during the pause');
  const recast = tick(missed.state, missed.cast, late + cast.missPause);
  assert.equal(recast.cast.phase, 'waiting');
  assert.ok(recast.events.some((e) => e.type === 'recast'));
  assert.equal(recast.state.book.casts, missed.state.book.casts + 1, 'a new cast');
});

test('a second miss in a row reels the line in', () => {
  let { state, cast } = castLine(game(6), 0);
  /** @type {any[]} */
  let events = [];
  for (let miss = 1; miss <= MISS_LIMIT; miss++) {
    ({ state, cast, events } = tick(state, cast, cast.biteAt + cast.timing.lateMs));
    assert.equal(state.missStreak, miss);
    if (miss < MISS_LIMIT) ({ state, cast } = tick(state, cast, cast.endedAt + cast.missPause));
  }
  assert.ok(events.some((e) => e.type === 'reeled-in'));
  const later = tick(state, cast, cast.endedAt + cast.missPause * 10);
  assert.equal(later.cast.phase, 'done', 'no recast');
});

test('a tap during the pause pulls the line out', () => {
  const { state, cast } = castLine(game(7), 0);
  const missed = tick(state, cast, cast.biteAt + cast.timing.lateMs);
  const tapped = strikeLine(missed.state, missed.cast, missed.cast.endedAt + 100);
  assert.ok(tapped.cast.reeledIn);
  const later = tick(tapped.state, tapped.cast, missed.cast.endedAt + cast.missPause);
  assert.equal(later.cast.phase, 'done', 'no recast');
});

test('a fish that got away can come back, marked as seen before (R3.6)', () => {
  let state = game(8);
  state.escaped.lake = Array.from({ length: 100 }, () => ({ species: 'pike', subname: 0, band: 2, size: 80, difficulty: 4, xp: 4, rarity: 'rare', tries: 2 }));
  const { cast } = castUntil(state, (c) => c.line.kind === 'fish');
  assert.ok(cast.line.kind === 'fish' && cast.line.seenBefore && cast.line.fish.tries === 2);
});

// ---------- Buffs (2.9, 2.11) ----------

test('"next n casts" buffs spend a charge when the line goes out, and cover that cast', () => {
  const state = { ...game(), buffs: [{ id: 'stew', source: 'inn', effects: [{ value: 'fishingSkill', add: 4 }], casts: 1 }] };
  const out = castLine(state, 0);
  assert.equal(out.checkpoint.buffs.length, 0, 'the charge is spent, even if the cast is voided');
  assert.deepEqual(out.checkpoint.streams, state.streams, 'and nothing else changed in the checkpoint');
  if (out.cast.line.kind === 'fish') assert.ok(out.cast.line.player.mods.some((m) => m.label === 'stew'));
});

test('timed buffs count down; debuffs can\'t be cancelled', () => {
  const buffs = [
    { id: 'potion', source: 'alchemist', effects: [{ value: 'fishFind', add: 10 }], ms: 60_000 },
    { id: 'curse', source: 'deity', effects: [{ value: 'fishFind', add: -10 }], ms: 120_000, debuff: true },
  ];
  const state = { ...game(), buffs };
  assert.equal(valuesFor(state).flat.fishFind, 5);
  const later = tickBuffs(state, 60_000);
  assert.deepEqual(later.state.buffs.map((b) => b.id), ['curse']);
  assert.deepEqual(later.events, [{ type: 'buff-ended', buff: 'potion' }]);
  assert.deepEqual(cancelBuff(state, 'curse').buffs.length, 2);
  assert.deepEqual(cancelBuff(state, 'potion').buffs.map((b) => b.id), ['curse']);
});

// ---------- Bait (D39, D61) ----------

test('bait is used up on a catch unless saved, and the last one empties the slot', () => {
  for (let seed = 1; seed < 300; seed++) {
    let state = { ...game(seed), bags: [{ id: 'moldy-piece-of-bread', count: 1 }], equipped: { rod: 'stick', bait: 'moldy-piece-of-bread' } };
    const { state: s, cast } = castUntil(state, (c) => c.line.kind === 'fish');
    const out = strikeAfter(s, cast, 200);
    if (!out.events.some((e) => e.type === 'bait-eaten')) continue;
    assert.equal(out.state.equipped.bait, null);
    assert.deepEqual(out.state.bags, []);
    return;
  }
  assert.fail('bait never eaten');
});

// ---------- Scatter (2.13) ----------

test('the bobber lands within the rod\'s scatter of the aim, inside the water', () => {
  const dice = diceFor(createRng(1));
  const bounds = { x0: 10, y0: 40, x1: 245, y1: 200 };
  for (let i = 0; i < 500; i++) {
    const p = scatter({ x: 128, y: 100 }, bounds, 12, dice);
    assert.ok((p.x - 128) ** 2 + (p.y - 100) ** 2 <= 144);
  }
  const edge = scatter({ x: 10, y: 40 }, bounds, 12, dice);
  assert.ok(edge.x >= 10 && edge.y >= 40, 'clamped to the water');
  assert.deepEqual(scatter({ x: 50, y: 50 }, bounds, 0, dice), { x: 50, y: 50 });
});

test('aiming makes the cast land near the aim', () => {
  const { cast } = castLine(game(), 0, { aim: { x: 100, y: 120 }, bounds: { x0: 0, y0: 0, x1: 255, y1: 255 } });
  assert.ok(cast.landing && Math.hypot(cast.landing.x - 100, cast.landing.y - 120) <= 12);
});

// ---------- A whole session, headless (2.8) ----------

/**
 * 1,000 casts with a player who strikes 300 ms after every splash, but misses
 * every fifth one and strikes too early every seventh.
 * @param {number} seed
 */
function session(seed) {
  let state = game(seed);
  let now = 0;
  /** @type {string[]} */
  const log = [];
  for (let n = 0; n < 1000; n++) {
    let out = castLine(state, now);
    let cast = out.cast;
    state = out.state;
    if (n % 7 === 6) {
      out = strikeLine(state, cast, cast.castAt + 1);
    } else if (n % 5 === 4) {
      out = tick(state, cast, cast.biteAt + cast.timing.lateMs);
      state = out.state;
      // Pull the line out during the pause, so each loop is one cast.
      out = strikeLine(state, out.cast, out.cast.phase === 'done' ? out.cast.endedAt + 1 : now);
    } else {
      out = strikeAfter(state, cast, 300);
    }
    state = out.state;
    now = (out.cast.phase === 'done' ? out.cast.endedAt : now) + 1000;
    log.push(out.events.map((e) => e.type).join(','));
  }
  return { state, log };
}

test('a whole session runs headless, and the same seed gives the same session', () => {
  const a = session(2026);
  const b = session(2026);
  assert.deepEqual(a.state, b.state);
  assert.deepEqual(a.log, b.log);
  assert.notDeepEqual(session(2027).state, a.state);

  const s = a.state;
  assert.equal(s.book.casts, 1000);
  assert.equal(s.time, TIME.startMinutes + 1000 * TIME.castMinutes);
  const inBucket = s.bucket.reduce((n, b) => n + b.count, 0);
  assert.equal(inBucket, s.book.catches);
  assert.ok(s.book.catches > 100, `caught ${s.book.catches}`);
  assert.ok(Object.keys(s.found).length > 10, 'found plenty of junk');
  const uniques = Object.entries(s.found).filter(([, n]) => n > 1).map(([id]) => id);
  for (const id of uniques) assert.ok(!['heavy-bait', 'fish-compendium', 'mega-mass-fish-chum'].includes(id), `${id} found twice`);
  assert.ok(a.log.some((l) => l.includes('weather')), 'the weather changed');
  assert.ok(levelFor(s.character.xp) > 0);
  // And the state still saves.
  assert.deepEqual(deserialize(serialize(s)), s);
});

// ---------- The save slot ----------

test('the save slot: save, load, a broken save reported, New game', async () => {
  const { saveGame, loadGame, deleteSave } = await import('../src/save.js');
  /** @type {Record<string, string>} */
  const data = {};
  const storage = {
    getItem: (/** @type {string} */ k) => data[k] ?? null,
    setItem: (/** @type {string} */ k, /** @type {string} */ v) => void (data[k] = v),
    removeItem: (/** @type {string} */ k) => void delete data[k],
  };
  assert.deepEqual(loadGame(storage), { state: null });
  const state = game(11);
  saveGame(storage, state);
  assert.deepEqual(loadGame(storage).state, state);
  storage.setItem('roll-for-fishing:save', '{"version": 99}');
  const broken = loadGame(storage);
  assert.equal(broken.state, null);
  assert.match(broken.error ?? '', /newer version/);
  assert.equal(data['roll-for-fishing:save'], '{"version": 99}', 'left where it is');
  deleteSave(storage);
  assert.deepEqual(loadGame(storage), { state: null });
});

test('once every unique treasure here is found, a treasure roll brings up junk (D75)', async () => {
  const { content } = await import('../src/generated/content.js');
  const found = Object.fromEntries(content.locations.lake.treasure.map((/** @type {{ id: string }} */ e) => [e.id, 1]));
  const { cast } = castUntil({ ...game(12), found }, (c) =>
    c.rolls.some((r) => r.kind === 'treasure' && r.total <= content.locations.lake.treasureThreshold),
  );
  assert.ok(cast.line.kind === 'item' ? content.items[cast.line.id].category === 'junk' : cast.line.kind === 'empty');
});

// ---------- Surface features (4.5) ----------

const water = { x0: 40, y0: 30, x1: 216, y1: 185 };

test('a save from version 1 gains surface features and their stream', () => {
  const { features, ...v1 } = game(13);
  const old = { ...v1, version: 1, streams: Object.fromEntries(Object.entries(v1.streams).filter(([k]) => k !== 'features')) };
  const migrated = deserialize(JSON.stringify(old));
  assert.equal(migrated.version, SAVE_VERSION);
  assert.deepEqual(migrated.features, []);
  assert.equal(migrated.streams.features, game(13).streams.features);
});

test('features appear on the water, drift, and go', () => {
  let state = game(21);
  let seen = 0;
  let gone = 0;
  for (let n = 0; n < 400; n++) {
    const out = castLine(state, 0);
    const done = strikeLine(out.state, out.cast, 1);
    state = done.state;
    seen += done.events.filter((e) => e.type === 'feature-appeared').length;
    gone += done.events.filter((e) => e.type === 'feature-gone').length;
    assert.ok(state.features.length <= 2, 'never more than the location allows');
    for (const f of state.features) assert.ok(f.x >= water.x0 && f.x <= water.x1 && f.y >= water.y0 && f.y <= water.y1);
  }
  assert.ok(seen > 10 && gone > 5, `appeared ${seen}, gone ${gone}`);
});

test('landing in a school brings up its fish, and fishes it out', () => {
  const state = { ...game(22), features: [{ id: 'roach-school', x: 120, y: 100, uses: 1, castsLeft: 10 }] };
  const out = castLine(state, 0, { aim: { x: 120, y: 100 }, bounds: water });
  assert.ok(out.events.some((e) => e.type === 'feature-hit' && e.feature === 'roach-school'));
  assert.equal(out.cast.line.kind, 'fish', 'the school raises the bite chance');
  assert.equal(out.cast.line.kind === 'fish' && out.cast.line.fish.species, 'roach');
  const done = strikeLine(out.state, out.cast, 1);
  assert.equal(done.state.features.length, 0);
  assert.ok(done.events.some((e) => e.type === 'feature-gone' && e.fishedOut));
  assert.equal(out.checkpoint.features[0].uses, 1, 'a voided cast leaves the feature as it was');
});

test('a big fish under the surface is at least Gigantic', () => {
  for (let seed = 30; seed < 60; seed++) {
    const state = { ...game(seed), features: [{ id: 'big-pike', x: 120, y: 100, uses: 1, castsLeft: 10 }] };
    const { cast } = castLine(state, 0, { aim: { x: 120, y: 100 }, bounds: water });
    if (cast.landing && Math.hypot(cast.landing.x - 120, cast.landing.y - 100) > 8) continue;
    assert.ok(cast.line.kind === 'fish' && cast.line.fish.species === 'pike' && cast.line.fish.band >= 4);
  }
});

test('a cast that misses a feature is an ordinary cast', () => {
  const state = { ...game(23), features: [{ id: 'roach-school', x: 60, y: 40, uses: 4, castsLeft: 10 }] };
  const out = castLine(state, 0, { aim: { x: 200, y: 170 }, bounds: water });
  assert.ok(!out.events.some((e) => e.type === 'feature-hit'));
  assert.equal(out.state.features[0].uses, 4);
});
