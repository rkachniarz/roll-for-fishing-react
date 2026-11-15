// @ts-check
// The fish under the surface at a spot (D139, D156). A spot's pool
// (`state.escaped`, R3.6) is what lives there:
//
//   - stocked with 2d6 + 3 fish from the spot's own table the first time it is
//     looked at (the shadows, a cast, the dive, Look Underwater), each with a
//     place on the water;
//   - with every new part of the day the pool turns over: a wild fish may
//     leave, the likelier the less the moment suits it, and others come, drawn
//     for the moment, up to the number first rolled. After a day away, the
//     wild fish are all new;
//   - a fish the player has met (it got away, or was let go) stays 1d4 game
//     days, its own roll, then swims off. It has room above the stocked
//     number, 1d4 fish, rolled with the pool; past that room a wild fish
//     leaves to make way, the longest there first;
//   - a school's fish and a big fish (features.js) are in the pool too, marked
//     `of` their feature: they come and go with it, and the turning over and
//     the room leave them alone.
//
// All of it is worked out when the pool is next looked at, never on a clock
// (D7), and drawn from the `pool` stream (D4), each fish's condition from
// `condition` (D146). A stocked fish is `wild` until the player meets it;
// `looks` counts how many times the wizard has looked at it (shape, then
// colours, then its name). Which fish show as shadows from the bank
// (`shadowsOf`) follows from the state alone, with no dice: a cast that lands
// on one brings up that very fish, if a fish bites (`aimedAt`).

import { content } from '../generated/content.js';
import { clock } from './time.js';
import { locationTable, pick, preferencesMet } from './tables.js';
import { spawningIn } from './spawning.js';
import { rollFish } from './fish.js';
import { diceFrom } from './state.js';
import { championsHere, poolKey } from './champions.js';
import { learn } from './knowledge.js';
import { momentOf } from './game.js';
import { waterAt } from './features.js';

/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {import('./state.js').PoolFish} PoolFish */

const DAY = 24 * 60;

/** @param {GameState} state */
const seasonKey = (state) => {
  const now = clock(state.time);
  return `${now.year}-${now.season}`;
};

/** The part of the day it is, told apart from the same part of another day. @param {GameState} state */
const partKey = (state) => {
  const now = clock(state.time);
  return `${now.dayIndex}-${now.partOfDay}`;
};

/** A whole number from a string, the same every time (FNV-1a): for what must not take dice. @param {string} text */
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/**
 * Is there water here, and so a pool? Not in town (R17.1).
 * @param {{ location: string }} state
 */
export function hasWater(state) {
  return !content.locations[state.location]?.town;
}

/**
 * The moment as the water sees it: no bait, which is the player's (D153).
 * @param {GameState} state
 */
const waterMoment = (state) => ({ ...momentOf(state), bait: null });

/**
 * Does the pool where the player is need tending: stocking, a new part of the
 * day's turning over, a fish with no place yet? Cheap, for the page to ask
 * before every redraw.
 * @param {GameState} state
 */
export function poolDue(state) {
  if (!hasWater(state)) return false;
  const key = poolKey(state);
  const meta = state.pools?.[key];
  if (!meta) return locationTable({ location: state.location, spot: state.spot }, 'fish', { moment: waterMoment(state) }).length > 0;
  return meta.part !== partKey(state) || meta.room === undefined || (state.escaped[key] ?? []).some((f) => (f.of === undefined && f.x === undefined) || (!f.wild && f.stays === undefined));
}

/**
 * Tends the pool where the player is (see the top of the file). Changes
 * `state` in place (a copy the caller owns). Call it before taking dice for
 * anything else: it commits its own streams (D53).
 * @param {GameState} state
 * @returns {boolean}  Whether anything changed.
 */
export function tendPool(state) {
  if (!poolDue(state)) return false;
  const rules = content.rules.pool;
  const key = poolKey(state);
  const moment = waterMoment(state);
  const table = locationTable({ location: state.location, spot: state.spot }, 'fish', { moment });
  const water = waterAt(state.location, state.spot);
  const { dice, commit } = diceFrom(state);
  /** A place on the water, clear of its edges. */
  const place = () => ({
    x: dice.pool.getRandomNumber(water.x0 + 16, Math.max(water.x0 + 16, water.x1 - 16)),
    y: dice.pool.getRandomNumber(water.y0 + 6, Math.max(water.y0 + 6, water.y1 - 6)),
  });
  /** @type {PoolFish[]} */
  let pool = [...(state.escaped[key] ?? [])];
  /** The pool's own fish: not a school's, not a big fish. */
  const own = () => pool.filter((f) => f.of === undefined);
  /** @param {number} n */
  const stock = (n) => {
    for (let i = 0; i < n; i++) {
      const species = pick(table, dice.pool);
      if (!species?.id) continue;
      // Who lives here is the water's business (D153): none of the player's values make the pool's fish bigger or harder.
      const fish = rollFish(/** @type {string} */ (species.id), { fishSizeBand: 0, fishDifficulty: 0, fishXp: 0 }, dice.pool, { condition: dice.condition });
      pool.push({ ...fish, wild: true, ...place() });
    }
  };
  let meta = state.pools?.[key];
  if (!meta) {
    if (!table.length) return false;
    const size = dice.pool.roll2d6() + rules.add;
    stock(size);
    meta = { season: seasonKey(state), size, at: state.time, part: partKey(state), room: dice.pool.roll4() };
  } else if (meta.part !== partKey(state)) {
    // A new season: a new number of fish for the spot.
    if (meta.season !== seasonKey(state)) meta = { ...meta, season: seasonKey(state), size: dice.pool.roll2d6() + rules.add };
    const away = state.time - meta.at >= DAY;
    pool = pool.filter((f) => {
      if (f.of !== undefined) return true;
      // Met: it stays its days, then swims off like any other. One whose days aren't rolled yet stays.
      if (!f.wild) return f.stays === undefined || state.time - (f.since ?? state.time) < f.stays * DAY;
      // Wild: after a day away they are all new; else one the moment doesn't suit may leave.
      if (away) return false;
      // The better the moment suits it, the likelier it stays: the chance to leave is halved (the preference
      // factor) for each preference met, the hour, the weather, the season, and once more while it spawns.
      // Not for the plants, which are always there.
      const kind = content.fish[f.species];
      const suits = preferencesMet(kind, moment).length + (spawningIn(kind, moment) ? 1 : 0);
      return dice.pool.roll100() > rules.leave / content.rules['fish-preferences'].factor ** suits;
    });
    // Others the moment suits come, up to the spot's number.
    stock(Math.max(0, meta.size - own().length));
    meta = { ...meta, at: state.time, part: partKey(state) };
  }
  // A pool from an older save has its room rolled now.
  if (meta.room === undefined) meta = { ...meta, room: dice.pool.roll4() };
  // A fish that came without a place (let go, or from an older save) finds one; a met fish's days are rolled, 1d4.
  pool = pool.map((f) => (f.of === undefined && f.x === undefined ? { ...f, ...place() } : f));
  pool = pool.map((f) => (!f.wild && f.stays === undefined ? { ...f, stays: dice.pool.roll4() } : f));
  state.escaped = { ...state.escaped, [key]: pool };
  state.pools = { ...state.pools, [key]: meta };
  state.streams = commit();
  return true;
}

/**
 * The state with its pool tended: the same state if nothing was due.
 * @param {GameState} state
 * @returns {GameState}
 */
export function tended(state) {
  if (!poolDue(state)) return state;
  const next = structuredClone(state);
  return tendPool(next) ? next : state;
}

/**
 * A fish the player has met goes into the pool where they are: one that got
 * away, or was let go. It is no longer wild, and stays its days from now
 * (D156): how many, 1d4, is rolled when the pool is next tended, as this
 * takes no dice. Past the pool's room, a wild fish leaves to make way, the
 * longest there first; with none left, the met fish longest there.
 * Changes `state` in place.
 * @param {GameState} state
 * @param {PoolFish} fish
 * @param {{ x: number, y: number } | null} [at]  Where it went back in: where the bobber was. Without it, the
 *   pool finds it a place when next tended.
 */
export function joinPool(state, fish, at = null) {
  const key = poolKey(state);
  const { wild, x, y, stays, ...met } = fish;
  /** @type {PoolFish} */
  const joined = { ...met, since: state.time, ...(at && fish.of === undefined ? { x: Math.round(at.x), y: Math.round(at.y) } : {}) };
  let pool = [...(state.escaped[key] ?? []), joined];
  const meta = state.pools?.[key];
  const own = pool.filter((f) => f.of === undefined);
  if (meta && joined.of === undefined && own.length > meta.size + (meta.room ?? 0)) {
    const out = own.find((f) => f.wild) ?? own.filter((f) => f !== joined).sort((a, b) => (a.since ?? 0) - (b.since ?? 0))[0];
    pool = pool.filter((f) => f !== out);
  }
  state.escaped = { ...state.escaped, [key]: pool };
}

/**
 * The pool's fish that show as shadows from the bank (D156), each where it
 * is: those that swim near the top, a deeper one now and then, fewer at night
 * and in the rain, and never more than `shadows`. Not a school's fish or a
 * big fish: their feature shows those. No dice: which deeper fish come up
 * changes with the part of the day, from a hash.
 * @param {GameState} state
 * @returns {PoolFish[]}
 */
export function shadowsOf(state) {
  if (!hasWater(state)) return [];
  const rules = content.rules.pool;
  const part = partKey(state);
  const dim = clock(state.time).partOfDay === 'night' || state.weather.precipitation >= 2 ? rules.dim / 100 : 1;
  return (state.escaped[poolKey(state)] ?? [])
    .filter((f) => {
      if (f.of !== undefined || f.x === undefined) return false;
      const chance = (rules.show[content.fish[f.species]?.swims ?? 'lower'] ?? 0) * dim;
      return hash(`${f.species}-${f.size}-${f.x}-${f.y}-${part}`) % 100 < chance;
    })
    .slice(0, rules.shadows);
}

/**
 * The shadow a cast landed on, if any (D156): the nearest shown fish whose
 * patch of water covers the landing.
 * @param {GameState} state
 * @param {{ x: number, y: number } | null} landing
 * @returns {PoolFish | null}
 */
export function aimedAt(state, landing) {
  if (!landing) return null;
  const { x: rx, y: ry } = content.rules.pool.aim;
  let best = null;
  let bestDistance = Infinity;
  for (const f of shadowsOf(state)) {
    const dx = Math.abs((f.x ?? 0) - landing.x);
    const dy = Math.abs((f.y ?? 0) - landing.y);
    if (dx > rx || dy > ry) continue;
    const d = Math.hypot(dx, dy);
    if (d < bestDistance) {
      best = f;
      bestDistance = d;
    }
  }
  return best;
}

/**
 * How a pool fish shows to a look (D139): a shadow the first time, in its
 * colours the second, and from the third the player knows what it is.
 * @param {number} looks
 * @returns {'shadow' | 'colour' | 'named'}
 */
export function lookStage(looks) {
  const rules = content.rules.pool;
  return looks >= rules.nameAt ? 'named' : looks >= rules.colourAt ? 'colour' : 'shadow';
}

/**
 * The wizard's Look Underwater (D139): every fish in the pool here has been
 * looked at once more; one looked at often enough is known to be here (R4.5).
 * Changes `state` in place.
 * @param {GameState} state
 * @returns {import('./game.js').GameEvent[]}  Empty if there's no water to look into.
 */
export function lookUnderwater(state) {
  if (!hasWater(state)) return [];
  tendPool(state);
  const key = poolKey(state);
  const pool = (state.escaped[key] ?? []).map((f) => ({ ...f, looks: (f.looks ?? 0) + 1 }));
  state.escaped = { ...state.escaped, [key]: pool };
  for (const f of pool) if (lookStage(f.looks) === 'named') learn(state, state.location, 'fish', f.species, 'heard');
  // A class fish holding the spot is under there too, and known for what it is (D114, D156).
  const champions = championsHere(state).map((c) => ({ species: c.fish.species, size: c.fish.size, looks: content.rules.pool.nameAt }));
  return [{ type: 'looked', fish: [...pool.map((f) => ({ species: f.species, size: f.size, looks: f.looks })), ...champions] }];
}
