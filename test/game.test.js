// @ts-check
// The game state, saves and the cast pipeline (R1, R2-R3, R12; DEV_PLAN 2.1,
// 2.6-2.13), ending with a whole headless session from a seed (2.8).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_VERSION, deserialize, levelFor, newGame, serialize } from '../src/engine/state.js';
import { MISS_LIMIT, cancelBuff, castLine, fishInBucket, momentOf, releaseFish, scatter, strikeLine, tick, tickBuffs, travel, valuesFor } from '../src/engine/game.js';
import { choose, openSlide } from '../src/engine/events.js';
import { createRng } from '../src/rng.js';
import { diceFor } from '../src/dice.js';
import { TIME, clock } from '../src/engine/time.js';
import { WATER } from '../src/engine/features.js';
import { content } from '../src/generated/content.js';

/** @typedef {import('../src/engine/state.js').GameState} GameState */
/** @typedef {import('../src/engine/game.js').GameCast} GameCast */

const character = /** @type {const} */ ({
  name: 'Testek',
  gender: 'f',
  classId: 'rogue',
  stats: { fishingSkill: 3, fishFind: 5, treasureFind: 7 },
});
const game = (seed = 1) => newGame({ seed, character: { ...character, luck: 0, xp: 0 } });
/** Where a new game starts: its escaped-fish pool (D59, D101). */
const POOL = 'lake/reedy-shore';

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

/**
 * Takes the first choice on every slide until the open event ends, as a
 * player in a hurry would.
 * @param {GameState} state
 */
function endEvent(state) {
  while (state.event) state = choose(state, /** @type {NonNullable<ReturnType<typeof openSlide>>} */ (openSlide(state)).choices[0].index).state;
  return state;
}

/** Strikes `ms` after the splash. */
function strikeAfter(/** @type {GameState} */ state, /** @type {GameCast} */ cast, ms) {
  const bitten = tick(state, cast, cast.biteAt);
  return strikeLine(bitten.state, bitten.cast, cast.biteAt + ms);
}

// ---------- State and saves (2.1) ----------

test('a new game: the Lake, the stick, a morning in year 1, every stream seeded', () => {
  const s = game();
  assert.equal(s.version, SAVE_VERSION);
  assert.equal(s.location, 'lake');
  assert.deepEqual(s.equipped, { rod: { id: 'stick', count: 1 }, line: null, bobber: null, bait: null, hat: null, trinket1: null, trinket2: null });
  const c = clock(s.time);
  assert.equal(c.year, 1);
  assert.equal(c.partOfDay, 'morning');
  assert.equal(s.weather.season, c.season, "the weather is the start's season");
  assert.deepEqual(game(), s, 'the same seed, the same start');
  assert.equal(s.character.luck, 0, 'Luck starts at 0 (R6.7)');
  assert.equal(Object.keys(s.streams).length, 11);
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
  const start = game();
  const { state, cast } = castLine(start, 0);
  const out = tick(state, cast, cast.biteAt + cast.timing.lateMs + 1); // missed
  assert.equal(out.state.time, start.time + 30);
});

test('pulling out before anything bites: no time, no meter, the feature keeps its use but ages (D85)', () => {
  const start = { ...game(), features: [{ id: 'roach-school', x: 120, y: 100, uses: 2, castsLeft: 10, born: 0 }] };
  const { state, cast } = castLine(start, 0, { landing: { x: 120, y: 100 } });
  assert.equal(state.features[0].uses, 1);
  const out = strikeLine(state, cast, 1);
  assert.equal(out.cast.phase === 'done' && out.cast.outcome.result, 'too-early');
  assert.equal(out.state.time, start.time);
  assert.equal(out.state.eventMeter, start.eventMeter);
  assert.equal(out.state.features.length, 1, 'no new feature');
  assert.equal(out.state.features[0].uses, 2, 'its use back');
  assert.equal(out.state.features[0].castsLeft, 9, 'but a cast older, so retrying until it hits costs its lifetime');
  assert.deepEqual(out.state.weather, start.weather);
});

test('one cast in a hundred flies way off target (D85)', () => {
  let wild = 0;
  let state = game(40);
  for (let n = 0; n < 2000; n++) {
    const out = castLine(state, 0, { aim: { x: 60, y: 40 }, bounds: WATER });
    const landing = /** @type {{ x: number, y: number }} */ (out.cast.landing);
    const far = Math.hypot(landing.x - 60, landing.y - 40) > 20;
    const flagged = out.events.some((e) => e.type === 'wild-cast');
    if (!flagged) assert.ok(!far, 'an ordinary cast stays within the scatter');
    if (flagged) wild++;
    state = { ...state, streams: out.state.streams };
  }
  assert.ok(wild > 8 && wild < 40, `${wild} wild casts in 2000`);
});

test('a big fish that gets away swims off with the same fish, then goes for good (D85)', () => {
  const pike = { id: 'big-pike', x: 120, y: 100, uses: 1, castsLeft: 10, born: 0 };
  const first = castLine({ ...game(41), features: [pike] }, 0, { landing: { x: 120, y: 100 } });
  assert.equal(first.cast.line.kind, 'fish');
  const fish = first.cast.line.kind === 'fish' ? first.cast.line.fish : null;
  const missed = tick(first.state, first.cast, first.cast.biteAt + first.cast.timing.lateMs + 1);
  assert.ok(missed.events.some((e) => e.type === 'feature-moved'));
  const moved = missed.state.features.find((f) => f.id === 'big-pike');
  assert.ok(moved);
  assert.ok(Math.hypot(moved.x - 120, moved.y - 100) >= 50, 'far off, not a drift');
  assert.equal(moved.uses, 1);
  assert.deepEqual(missed.state.escaped, {}, 'not in the pool while the feature holds it');

  const again = castLine({ ...missed.state, missStreak: 0 }, 0, { landing: { x: moved.x, y: moved.y } });
  assert.ok(again.cast.line.kind === 'fish');
  assert.equal(again.cast.line.kind === 'fish' && again.cast.line.fish.size, fish?.size, 'the same pike');
  assert.equal(again.cast.line.kind === 'fish' && again.cast.line.seenBefore, true);
  const gone = tick(again.state, again.cast, again.cast.biteAt + again.cast.timing.lateMs + 1);
  assert.ok(!gone.state.features.some((f) => f.id === 'big-pike'), 'the second time it goes');
  assert.equal(Object.values(gone.state.escaped).flat().length, 1, 'and the pike is in the pool');
});

// ---------- Missing the splash (D64) and the escaped pool (2.7) ----------

test('a missed fish joins the pool; after the pause the line counts as cast again', () => {
  const { state, cast } = castUntil(game(4), (c) => c.line.kind === 'fish');
  const late = cast.biteAt + cast.timing.lateMs;
  const missed = tick(state, cast, late);
  assert.equal(missed.state.missStreak, 1);
  assert.equal(missed.state.escaped[POOL].length, 1);
  assert.equal(missed.state.escaped[POOL][0].tries, 1);

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
  state.escaped[POOL] = Array.from({ length: 100 }, () => ({ species: 'northern-pike', subname: 0, band: 2, size: 80, difficulty: 4, xp: 4, rarity: 'rare', tries: 2 }));
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
    const start = game(seed);
    const state = { ...start, equipped: { ...start.equipped, bait: { id: 'bread-crumbs', count: 1 } } };
    const { state: s, cast } = castUntil(state, (c) => c.line.kind === 'fish');
    const out = strikeAfter(s, cast, 200);
    if (!out.events.some((e) => e.type === 'bait-eaten')) continue;
    assert.equal(out.state.equipped.bait, null);
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
    // A full bucket: let the one just caught go (D59).
    if (state.pendingCatch) state = releaseFish(state, 'new').state;
    state = endEvent(state);
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
  const tooEarly = a.log.filter((l) => l.includes('too-early')).length;
  assert.ok(tooEarly > 100);
  assert.equal(s.time, game(2026).time + (1000 - tooEarly) * TIME.castMinutes, 'every cast but the too-early ones');
  assert.equal(fishInBucket(s), 16, 'the bucket filled up, and never past 16');
  assert.ok(s.book.catches > 100, `caught ${s.book.catches}`);
  assert.ok(Object.keys(s.found).length > 10, 'found plenty of junk');
  const uniques = Object.entries(s.found).filter(([, n]) => n > 1).map(([id]) => id);
  for (const id of uniques) assert.ok(!['heavy-bait', 'fish-compendium', 'mega-mass-fish-chum'].includes(id), `${id} found twice`);
  assert.ok(a.log.some((l) => l.includes('weather')), 'the weather changed');
  assert.equal(s.eventsSeen.frog, 1, 'the event meter brought the frog, once');
  assert.ok(levelFor(s.character.xp) > 0);
  // And the state still saves.
  assert.deepEqual(deserialize(serialize(s)), s);
});

// ---------- The save slots ----------

/** A stand-in for localStorage, and what's in it. */
function memoryStorage() {
  /** @type {Record<string, string>} */
  const data = {};
  return {
    data,
    getItem: (/** @type {string} */ k) => data[k] ?? null,
    setItem: (/** @type {string} */ k, /** @type {string} */ v) => void (data[k] = v),
    removeItem: (/** @type {string} */ k) => void delete data[k],
  };
}

test('the save slots: save, load, a broken save reported, New game', async () => {
  const { saveGame, loadGame, deleteSave, listSlots, lastSlot } = await import('../src/save.js');
  const storage = memoryStorage();
  assert.deepEqual(loadGame(storage, 1), { state: null });
  assert.equal(lastSlot(storage), null);
  const state = game(11);
  saveGame(storage, 2, state);
  assert.equal(lastSlot(storage), 2, 'Continue picks the slot saved to last');
  assert.deepEqual(loadGame(storage, 2).state, state);
  assert.deepEqual(
    listSlots(storage).map((s) => s.state !== null),
    [false, true, false],
    'each slot on its own',
  );
  storage.setItem('roll-for-fishing:save:3', '{"version": 99}');
  const broken = loadGame(storage, 3);
  assert.equal(broken.state, null);
  assert.match(broken.error ?? '', /newer version/);
  assert.equal(storage.data['roll-for-fishing:save:3'], '{"version": 99}', 'left where it is');
  deleteSave(storage, 2);
  assert.deepEqual(loadGame(storage, 2), { state: null });
});

test('the save slots: a save from before them becomes slot 1', async () => {
  const { loadGame } = await import('../src/save.js');
  const storage = memoryStorage();
  const state = game(12);
  storage.setItem('roll-for-fishing:save', JSON.stringify(state));
  assert.deepEqual(loadGame(storage, 1).state, state);
  assert.equal(storage.data['roll-for-fishing:save'], undefined, 'moved, not copied');
});

test('once every unique treasure here is found, a treasure roll brings up junk (D75)', async () => {
  const { content } = await import('../src/generated/content.js');
  const found = Object.fromEntries(content.tables['common-treasure'].entries.map((/** @type {{ id: string }} */ e) => [e.id, 1]));
  const { cast } = castUntil({ ...game(12), found }, (c) =>
    c.rolls.some((r) => r.kind === 'treasure' && r.total <= content.locations.lake.treasureThreshold),
  );
  assert.ok(cast.line.kind === 'item' ? content.items[cast.line.id].category === 'junk' : cast.line.kind === 'empty');
});

// ---------- Surface features (4.5) ----------

const water = { x0: 40, y0: 30, x1: 216, y1: 185 };

test('a save from version 1 gains surface features and their stream', () => {
  const { features, ...v1 } = game(13);
  const old = {
    ...v1,
    version: 1,
    equipped: { rod: 'stick', bait: null },
    streams: Object.fromEntries(Object.entries(v1.streams).filter(([k]) => k !== 'features')),
  };
  const migrated = deserialize(JSON.stringify(old));
  assert.equal(migrated.version, SAVE_VERSION);
  assert.deepEqual(migrated.features, []);
  assert.equal(migrated.streams.features, game(13).streams.features);
});

test('a save from version 2 gets the seven slots; equipped bait moves out of the bags', () => {
  const v2 = { ...game(14), version: 2, equipped: { rod: 'stick', bait: 'bread-crumbs' }, bags: [{ id: 'bent-fork', count: 1 }, { id: 'bread-crumbs', count: 4 }] };
  const migrated = deserialize(JSON.stringify(v2));
  assert.deepEqual(migrated.equipped, { rod: { id: 'stick', count: 1 }, line: null, bobber: null, bait: { id: 'bread-crumbs', count: 4 }, hat: null, trinket1: null, trinket2: null });
  assert.deepEqual(migrated.bags, [{ id: 'bent-fork', count: 1 }]);
});

test('a save from version 5 loses the deleted fish and spots (D101)', () => {
  const fish = (/** @type {string} */ species) => ({ species, subname: 0, band: 2, size: 30, difficulty: 2, xp: 2, rarity: 'common' });
  const record = { size: 30, location: 'lake', spot: null, time: 0, weather: { season: 'spring', cell: 0 } };
  const v5 = {
    ...game(17),
    version: 5,
    spot: 'crossroads',
    features: [{ id: 'roach-school', x: 120, y: 100, uses: 2, castsLeft: 10, born: 0 }],
    bucket: [{ fish: fish('pike'), count: 1 }, { fish: fish('roach'), count: 2 }],
    escaped: { lake: [{ ...fish('cod'), tries: 1 }, { ...fish('roach'), tries: 1 }] },
    pendingCatch: fish('sturgeon'),
    book: { casts: 9, catches: 4, fish: { pike: { caught: 2, totalSize: 60, smallest: record, largest: record, mostTries: 0 }, roach: { caught: 2, totalSize: 60, smallest: record, largest: record, mostTries: 0 } } },
  };
  const migrated = deserialize(JSON.stringify(v5));
  assert.equal(migrated.version, SAVE_VERSION);
  assert.deepEqual([migrated.location, migrated.spot], ['lake', 'reedy-shore'], 'off the deleted spot');
  assert.deepEqual(migrated.features, [], 'the old water is left behind');
  assert.deepEqual(migrated.bucket.map((b) => b.fish.species), ['roach'], 'the Roach kept its id');
  assert.deepEqual(migrated.escaped.lake.map((f) => f.species), ['roach']);
  assert.equal(migrated.pendingCatch, null);
  assert.deepEqual(Object.keys(migrated.book.fish), ['roach']);
  assert.equal(migrated.book.catches, 4, 'the totals stay');
});

test('a new game starts at the reedy shore; travel moves between spots, between casts (D101)', () => {
  const start = game(18);
  assert.deepEqual([start.location, start.spot], ['lake', 'reedy-shore']);
  // The river mouth is a spot found later (R11.8): known here, as if noticed.
  const withFeature = { ...start, known: { 'river:spot:river-mouth': 'heard' }, features: [{ id: 'roach-school', x: 120, y: 100, uses: 2, castsLeft: 10, born: 0 }] };
  const { state } = travel(withFeature, 'river', 'river-mouth');
  assert.deepEqual([state.location, state.spot], ['river', 'river-mouth']);
  assert.deepEqual(state.features, [], 'features stay with their water');
  assert.equal(withFeature.spot, 'reedy-shore', 'the old state is untouched');
  assert.equal(travel(start, 'lake', 'reedy-shore').state, start, 'staying put changes nothing');
  // The river mouth's fish, never the reedy shore's.
  const mouth = new Set(content.locations.river.spots[2].fish.map((/** @type {{ id: string }} */ f) => f.id));
  let s = state;
  for (let i = 0; i < 40; i++) {
    const out = castLine(s, 0);
    if (out.cast.line.kind === 'fish') assert.ok(mouth.has(out.cast.line.fish.species), out.cast.line.fish.species);
    s = endEvent({ ...tick(out.state, out.cast, out.cast.biteAt + out.cast.timing.lateMs + 1).state, missStreak: 0, escaped: {} });
  }
});

test("the bait on the hook is part of the moment fish prefer (D101)", () => {
  const start = game(19);
  assert.equal(momentOf(start).bait, null, 'no bait');
  const baited = { ...start, equipped: { ...start.equipped, bait: { id: 'worms', count: 5 } } };
  assert.equal(momentOf(baited).bait, 'worm');
  assert.equal(momentOf(baited).partOfDay, clock(start.time).partOfDay);
});

test('no rod, no cast; the line and the bobber are optional (D83)', () => {
  const state = { ...game(15), equipped: { ...game(15).equipped, rod: null } };
  const out = castLine(state, 0);
  assert.equal(out.cast.phase, 'idle');
  assert.equal(out.state, state);
  assert.deepEqual(out.events, [{ type: 'no-rod' }]);
  assert.equal(castLine(game(15), 0).cast.phase, 'waiting', 'the stick alone is enough');
});

test('equipped items apply their effects, in every slot; items in the bags do not', () => {
  const start = game(16);
  const base = valuesFor(start).flat;
  const bagged = valuesFor({ ...start, bags: [{ id: 'straw-hat', count: 1 }, { id: 'fishing-pole-laser-sight', count: 1 }] }).flat;
  assert.deepEqual(bagged, base);
  const worn = valuesFor({
    ...start,
    equipped: {
      ...start.equipped,
      hat: { id: 'straw-hat', count: 1 },
      trinket2: { id: 'fishing-pole-laser-sight', count: 1 },
      rod: { id: 'willow-rod', count: 1 },
    },
  }).flat;
  assert.equal(worn.fishingSkill, base.fishingSkill - 1 + 2);
  assert.equal(worn.treasureFind, base.treasureFind + 2 - 2);
  assert.equal(worn.castScatter, base.castScatter - 6);
});

test('features appear on the water, drift, and go', () => {
  let state = game(21);
  let seen = 0;
  let gone = 0;
  for (let n = 0; n < 400; n++) {
    const out = castLine(state, 0);
    const done = tick(out.state, out.cast, out.cast.biteAt + out.cast.timing.lateMs + 1);
    state = endEvent({ ...done.state, missStreak: 0 });
    seen += done.events.filter((e) => e.type === 'feature-appeared').length;
    gone += done.events.filter((e) => e.type === 'feature-gone').length;
    assert.ok(state.features.length <= 2, 'never more than the location allows');
    for (const f of state.features) assert.ok(f.x >= water.x0 && f.x <= water.x1 && f.y >= water.y0 && f.y <= water.y1);
  }
  assert.ok(seen > 10 && gone > 5, `appeared ${seen}, gone ${gone}`);
});

test("a spot's own schools and big fish come up there, and the location's glint (D102)", () => {
  const upper = content.locations.river.spots[0];
  const allowed = new Set([...upper.features, ...content.locations.river.features].map((/** @type {{ id: string }} */ f) => f.id));
  let state = travel(game(24), 'river', 'upper-river').state;
  const seen = new Set();
  for (let n = 0; n < 400; n++) {
    const out = castLine(state, 0);
    const done = tick(out.state, out.cast, out.cast.biteAt + out.cast.timing.lateMs + 1);
    state = endEvent({ ...done.state, missStreak: 0 });
    for (const e of done.events) if (e.type === 'feature-appeared') seen.add(e.feature);
  }
  assert.ok(seen.size >= 3, [...seen].join(', '));
  for (const id of seen) assert.ok(allowed.has(id), id);
});

test('landing in a school brings up its fish, and fishes it out', () => {
  const state = { ...game(22), features: [{ id: 'roach-school', x: 120, y: 100, uses: 1, castsLeft: 10 }] };
  const out = castLine(state, 0, { aim: { x: 120, y: 100 }, bounds: water });
  assert.ok(out.events.some((e) => e.type === 'feature-hit' && e.feature === 'roach-school'));
  assert.equal(out.cast.line.kind, 'fish', 'the school raises the bite chance');
  assert.equal(out.cast.line.kind === 'fish' && out.cast.line.fish.species, 'roach');
  const done = strikeAfter(out.state, out.cast, 300);
  assert.equal(done.state.features.length, 0);
  assert.ok(done.events.some((e) => e.type === 'feature-gone' && e.fishedOut));
  assert.equal(out.checkpoint.features[0].uses, 1, 'a voided cast leaves the feature as it was');
});

test('a big fish under the surface is at least Gigantic', () => {
  for (let seed = 30; seed < 60; seed++) {
    const state = { ...game(seed), features: [{ id: 'big-pike', x: 120, y: 100, uses: 1, castsLeft: 10 }] };
    const { cast } = castLine(state, 0, { aim: { x: 120, y: 100 }, bounds: water });
    if (cast.landing && Math.hypot(cast.landing.x - 120, cast.landing.y - 100) > 8) continue;
    assert.ok(cast.line.kind === 'fish' && cast.line.fish.species === 'northern-pike' && cast.line.fish.band >= 4);
  }
});

test('a cast that misses a feature is an ordinary cast', () => {
  const state = { ...game(23), features: [{ id: 'roach-school', x: 60, y: 40, uses: 4, castsLeft: 10 }] };
  const out = castLine(state, 0, { aim: { x: 200, y: 170 }, bounds: water });
  assert.ok(!out.events.some((e) => e.type === 'feature-hit'));
  assert.equal(out.state.features[0].uses, 4);
});

// ---------- A full bucket (5.5, D57, D59) ----------

/**
 * A game with a full bucket and a fish on the line, struck in time.
 * @param {number} seed
 */
function fullBucketCatch(seed) {
  const full = Array.from({ length: 16 }, (_, i) => ({ fish: { species: 'roach', subname: 0, band: 2, size: 15 + i, difficulty: 1, xp: 1, rarity: 'common' }, count: 1 }));
  for (let s = seed; s < seed + 300; s++) {
    const { state, cast } = castUntil({ ...game(s), bucket: structuredClone(full) }, (c) => c.line.kind === 'fish');
    const out = strikeAfter(state, cast, 200);
    if (out.events.some((e) => e.type === 'caught')) return out;
  }
  throw new Error('no catch');
}

test('a catch with a full bucket waits for a fish to be let go, and nothing is cast meanwhile', () => {
  const out = fullBucketCatch(40);
  assert.ok(out.events.some((e) => e.type === 'bucket-full'));
  assert.ok(out.state.pendingCatch);
  assert.equal(fishInBucket(out.state), 16);
  assert.equal(out.state.book.catches, 1, 'it still counts as caught');
  const blocked = castLine(out.state, 0);
  assert.equal(blocked.cast.phase, 'idle');
  assert.ok(blocked.events.some((e) => e.type === 'bucket-full'));
});

test('letting the new fish go puts it back in the water here', () => {
  const out = fullBucketCatch(40);
  const fish = out.state.pendingCatch;
  const { state, events } = releaseFish(out.state, 'new');
  assert.equal(state.pendingCatch, null);
  assert.equal(fishInBucket(state), 16);
  assert.deepEqual(state.escaped[POOL].at(-1), { ...fish, tries: 0 });
  assert.equal(events[0].type, 'released');
});

test('letting a bucket fish go makes room for the new one', () => {
  const out = fullBucketCatch(40);
  const fish = out.state.pendingCatch;
  const { state } = releaseFish(out.state, 0);
  assert.equal(fishInBucket(state), 16);
  assert.ok(state.bucket.some((b) => b.fish.size === fish?.size && b.fish.species === fish?.species));
  assert.ok(!state.bucket.some((b) => b.fish.size === 15 && b.fish.species === 'roach'), 'the first roach is gone');
  assert.equal(state.escaped[POOL].at(-1).size, 15);
});

test('a game saved to a file reads back, migrated; anything else is refused (9.3)', async () => {
  const { exportGame, importGame } = await import('../src/save.js');
  const state = game(12);
  const file = exportGame({ ...state, character: { ...state.character, name: 'Øla the Bold' } }, new Date('2026-11-10T12:00:00Z'));
  assert.equal(file.name, 'roll-for-fishing-la-the-bold-2026-11-10.json');
  assert.equal(importGame(file.text).state?.character.name, 'Øla the Bold');
  assert.deepEqual(importGame(exportGame(state, new Date()).text).state, state);
  assert.match(importGame('not json').error ?? '', /JSON|Unexpected/);
  assert.match(importGame('{"version": 99}').error ?? '', /newer version/);
  assert.equal(importGame('{"version": 8}').error, 'Not a saved game');
});

test('spots are noticed by fishing there; a spot not known of is out of reach (R11.8, 8.1)', async () => {
  const { spotKnown, completion, locationList } = await import('../src/engine/knowledge.js');
  let s = game(20);
  assert.ok(spotKnown(s, 'lake', 'reedy-shore') && spotKnown(s, 'river', 'upper-river'), 'the first spots');
  assert.ok(!spotKnown(s, 'lake', 'swamp'));
  assert.equal(travel(s, 'lake', 'swamp').error, 'unknownSpot');
  assert.equal(travel(s, 'lake', 'swamp', { force: true }).state.spot, 'swamp', 'the bench goes anywhere');
  const learnAfter = content.locations.lake.spots.find((/** @type {{ id: string }} */ x) => x.id === 'swamp').learnAfter;
  /** @type {any[]} */
  let noticed = [];
  for (let i = 0; i < learnAfter; i++) {
    const out = castLine(s, 0);
    const done = tick(out.state, out.cast, out.cast.biteAt + out.cast.timing.lateMs + 1);
    noticed = noticed.concat(done.events.filter((e) => e.type === 'spot-learned'));
    s = endEvent({ ...done.state, missStreak: 0 });
  }
  assert.deepEqual(noticed, [{ type: 'spot-learned', location: 'lake', spot: 'swamp' }]);
  assert.ok(spotKnown(s, 'lake', 'swamp'));
  assert.equal(s.castsAt.lake, learnAfter);
  // Completion counts the location's list: fish from every spot, its items.
  const list = locationList('lake');
  assert.ok(list.fish.includes('roach') && list.items.includes('bent-fork'));
  assert.ok(!list.fish.some((id) => content.fish[id].rift), "rift fish are a perk's, not the lake's");
  assert.deepEqual(completion(s, 'lake'), { found: 0, total: list.fish.length + list.items.length });
});

test('a catch is found where it was caught; a version 8 save keeps its spots and records (8.5)', () => {
  let s = game(21);
  for (let i = 0; i < 200 && !Object.keys(s.book.fish).length; i++) {
    const out = castLine(s, 0, { extra: [{ label: 'x', effects: [{ value: 'fishFind', add: 100 }, { value: 'fishingSkill', add: 30 }] }] });
    const bite = tick(out.state, out.cast, out.cast.biteAt);
    s = endEvent({ ...strikeLine(bite.state, bite.cast, out.cast.biteAt + 100).state, missStreak: 0, pendingCatch: null });
  }
  const species = Object.keys(s.book.fish)[0];
  assert.equal(s.known[`lake:fish:${species}`], 'found');
  const { known, castsAt, ...v8 } = s;
  const migrated = deserialize(JSON.stringify({ ...v8, version: 8 }));
  assert.equal(migrated.known['lake:spot:deep-water'], 'heard', 'every spot an old game could go to');
  assert.equal(migrated.known[`lake:fish:${species}`], 'found');
  assert.equal(migrated.castsAt.lake, s.book.casts);
});

test('a hidden place opens once its map fragments are found, and a quest can close it (8.2, 8.4)', async () => {
  const { placeOpen } = await import('../src/engine/knowledge.js');
  const { startEvent } = await import('../src/engine/events.js');
  let s = game(22);
  assert.ok(placeOpen(s, 'lake') && placeOpen(s, 'river'));
  assert.ok(!placeOpen(s, 'mage-tower'), 'hidden at first');
  assert.equal(travel(s, 'mage-tower', 'the-first-pool').error, 'unknownPlace');
  // Two pieces found: not yet. The third comes up with the next cast's end.
  s = { ...s, found: { 'mage-tower-map-1': 1, 'mage-tower-map-2': 1 } };
  let out = castLine(s, 0);
  let done = tick(out.state, out.cast, out.cast.biteAt + out.cast.timing.lateMs + 1);
  assert.ok(!done.events.some((e) => e.type === 'place-opened'));
  s = endEvent({ ...done.state, missStreak: 0, found: { ...done.state.found, 'mage-tower-map-3': 1 } });
  out = castLine(s, 0);
  done = tick(out.state, out.cast, out.cast.biteAt + out.cast.timing.lateMs + 1);
  assert.deepEqual(done.events.find((e) => e.type === 'place-opened'), { type: 'place-opened', location: 'mage-tower', by: 'fragments' });
  s = endEvent({ ...done.state, missStreak: 0 });
  s = travel(s, 'mage-tower', 'the-first-pool').state;
  assert.equal(s.location, 'mage-tower');
  // A quest closes it with the player there: back to the start.
  content.events['test-close'] = { id: 'test-close', title: ['x'], once: false, trigger: 'meter', needs: [], first: 'a',
    slides: { a: { text: ['x'], choices: [{ text: ['x'], to: 'end', needs: [], effects: [{ kind: 'place', location: 'mage-tower', open: false }] }] } } };
  try {
    const closed = choose(startEvent(s, 'test-close'), 0);
    assert.ok(!placeOpen(closed.state, 'mage-tower'));
    assert.deepEqual([closed.state.location, closed.state.spot], ['lake', 'reedy-shore']);
  } finally {
    delete content.events['test-close'];
  }
});
