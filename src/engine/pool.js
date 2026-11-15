// @ts-check
// The fish under the surface at a spot (D139). A spot's pool (`state.escaped`,
// R3.6) used to hold only fish that got away or were let go; now it is what
// lives there. The first time a spot's pool is looked at - by the shadows
// under the surface, a cast, the Fighter's dive or the wizard's Look
// Underwater - it is stocked with 2d6 + 3 fish from the spot's own table, and
// kept from then on:
//
//   - a fish drifts in each game day, up to the number first rolled;
//   - a new season rolls the wild fish anew (fish that got away or were let
//     go, the ones the player has met, stay);
//   - a pool down to fewer than two fish is rolled anew at once.
//
// All of it is worked out when the pool is next looked at, never on a clock
// (D7), and drawn from the `pool` stream (D4), each fish's condition from `condition` (D146). A stocked fish is `wild`
// until the player meets it; `looks` counts how many times the wizard has
// looked at it (shape, then colours, then its name).

import { content } from '../generated/content.js';
import { clock } from './time.js';
import { locationTable, pick } from './tables.js';
import { rollFish } from './fish.js';
import { diceFrom } from './state.js';
import { poolKey } from './champions.js';
import { learn } from './knowledge.js';
import { momentOf } from './game.js';

/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {import('./state.js').PoolFish} PoolFish */

const DAY = 24 * 60;

/** @param {GameState} state */
const seasonKey = (state) => {
  const now = clock(state.time);
  return `${now.year}-${now.season}`;
};

/**
 * Is there water here, and so a pool? Not in town (R17.1).
 * @param {{ location: string }} state
 */
export function hasWater(state) {
  return !content.locations[state.location]?.town;
}

/**
 * Does the pool where the player is need tending: stocking, a day's fish, a
 * new season's roll? Cheap, for the page to ask before every redraw.
 * @param {GameState} state
 */
export function poolDue(state) {
  if (!hasWater(state)) return false;
  const key = poolKey(state);
  const meta = state.pools?.[key];
  if (!meta) return locationTable({ location: state.location, spot: state.spot }, 'fish', { moment: momentOf(state) }).length > 0;
  return meta.season !== seasonKey(state) || state.time - meta.at >= DAY || (state.escaped[key] ?? []).length < content.rules.pool.rollBelow;
}

/**
 * Tends the pool where the player is (see the top of the file). Changes
 * `state` in place (a copy the caller owns); draws only from `pool`.
 * @param {GameState} state
 * @returns {boolean}  Whether anything changed.
 */
export function tendPool(state) {
  if (!poolDue(state)) return false;
  const rules = content.rules.pool;
  const key = poolKey(state);
  const season = seasonKey(state);
  // Who lives here is the water's business, not the player's (D153): the bait on the hook draws nobody in,
  // and no perk, gear or buff makes the pool's fish bigger or harder.
  const table = locationTable({ location: state.location, spot: state.spot }, 'fish', { moment: { ...momentOf(state), bait: null } });
  if (!table.length) return false;
  const { dice, commit } = diceFrom(state);
  /** @type {PoolFish[]} */
  let pool = [...(state.escaped[key] ?? [])];
  /** @param {number} n */
  const stock = (n) => {
    for (let i = 0; i < n; i++) {
      const species = pick(table, dice.pool);
      if (!species?.id) continue;
      const fish = rollFish(/** @type {string} */ (species.id), { fishSizeBand: 0, fishDifficulty: 0, fishXp: 0 }, dice.pool, { condition: dice.condition });
      pool.push({ ...fish, wild: true });
    }
  };
  /** A fresh roll: 2d6 + 3 fish, and the pool's number from now on. */
  const fresh = () => {
    const size = dice.pool.roll2d6() + rules.add;
    stock(size);
    return { season, size, at: state.time };
  };
  let meta = state.pools?.[key];
  if (!meta) {
    meta = fresh();
  } else if (meta.season !== season) {
    pool = pool.filter((f) => !f.wild);
    meta = fresh();
  } else {
    const days = Math.floor((state.time - meta.at) / DAY);
    // A full pool takes nobody in: the days still pass.
    stock(Math.min(days * rules.perDay, Math.max(0, meta.size - pool.length)));
    meta = { ...meta, at: meta.at + days * DAY };
  }
  if (pool.length < rules.rollBelow) meta = fresh();
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
  return [{ type: 'looked', fish: pool.map((f) => ({ species: f.species, size: f.size, looks: f.looks })) }];
}
