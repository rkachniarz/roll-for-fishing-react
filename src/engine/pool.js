// @ts-check
// The fish under the surface at a spot (D139, D156, D157). A spot's pool
// (`state.escaped`, R3.6) is what lives there, and it lives whether the
// player is there or not:
//
//   - stocked with 2d6 + 3 fish from the spot's own table the first time it is
//     looked at (the shadows, a cast, the dive, Look Underwater), each with a
//     place on the water;
//   - with every new part of the day every stocked pool takes a turn
//     (`stepPools`, from passage.js), with that moment's weather: a wild fish
//     may leave, the likelier the less the moment suits it; a predator may
//     take a fish under half its length, the likelier the warmer the water;
//     and 1d4 - 1 others come, drawn for the moment, up to the number first
//     rolled. A kind that is spawning comes 1d4 at a time, over that number
//     too, and is slow to leave while it spawns;
//   - a fish the player has met (it got away, or was let go) stays 1d4 game
//     days, its own roll, then swims off. It has room above the stocked
//     number, 1d4 fish, rolled with the pool; past that room a wild fish
//     leaves to make way, the longest there first;
//   - with every cast the fish where the player is drift a little
//     (`driftPool`), and three or more of a shoaling kind draw together into
//     a school;
//   - a big fish (features.js) is in the pool too, marked `of` its feature:
//     it comes and goes with it, and the turns and the room leave it alone.
//
// Drawn from the `pool` stream (D4), each fish's condition from `condition`
// (D146); nothing reads a clock (D7). A stocked fish is `wild` until the
// player meets it; `looks` counts how many times the wizard has looked at it
// (shape, then colours, then its name). Which fish show as shadows from the
// bank (`shadowsOf`) follows from the state alone, with no dice: a cast that
// lands on one brings up that very fish, if a fish bites (`aimedAt`).

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
/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */

const DAY = 24 * 60;

/** @param {GameState} state */
const seasonKey = (state) => {
  const now = clock(state.time);
  return `${now.year}-${now.season}`;
};

/** The part of the day it is, told apart from the same part of another day. @param {GameState} state */
export const partKey = (state) => {
  const now = clock(state.time);
  // The night runs past midnight: its small hours are still last evening's night.
  return `${now.partOfDay === 'night' && now.hour < 12 ? now.dayIndex - 1 : now.dayIndex}-${now.partOfDay}`;
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

/** Where a pool is, from its key (poolKey). @param {string} key */
function whereOf(key) {
  const [location, spot = null] = key.split('/');
  return { location, spot };
}

/** A pool's own fish: not a big fish's, not a school's of the old kind. @param {PoolFish[]} pool */
const ownOf = (pool) => pool.filter((f) => f.of === undefined);

/**
 * The kinds in a pool that swim as a school (D157): a shoaling kind with
 * three or more of its own there.
 * @param {PoolFish[]} pool
 * @returns {Set<string>}
 */
export function shoalsIn(pool) {
  /** @type {Record<string, number>} */
  const count = {};
  for (const f of ownOf(pool)) if (content.fish[f.species]?.shoals) count[f.species] = (count[f.species] ?? 0) + 1;
  return new Set(Object.keys(count).filter((id) => count[id] >= content.rules.pool.shoal));
}

/**
 * What a pool's fish still lack is given them: its room, a place for each of
 * its own fish, a number to tell each apart, a met fish's days.
 * @param {PoolFish[]} pool
 * @param {any} meta
 * @param {{ x0: number, y0: number, x1: number, y1: number }} water
 * @param {Dice} dice  The `pool` stream.
 */
function settle(pool, meta, water, dice) {
  meta = { ...meta };
  if (meta.room === undefined) meta.room = dice.roll4();
  meta.next ??= 0;
  pool = pool.map((f) => {
    let fish = f;
    if (fish.of === undefined && fish.x === undefined) fish = { ...fish, ...placeIn(water, dice) };
    if (fish.of === undefined && fish.n === undefined) fish = { ...fish, n: meta.next++ };
    if (!fish.wild && fish.stays === undefined) fish = { ...fish, stays: dice.roll4() };
    return fish;
  });
  return { pool, meta };
}

/** A place on the water, clear of its edges. @param {{ x0: number, y0: number, x1: number, y1: number }} water @param {Dice} dice */
function placeIn(water, dice) {
  return {
    x: dice.getRandomNumber(water.x0 + 16, Math.max(water.x0 + 16, water.x1 - 16)),
    y: dice.getRandomNumber(water.y0 + 6, Math.max(water.y0 + 6, water.y1 - 6)),
  };
}

/**
 * A fish of a kind, for a pool. Who lives there is the water's business
 * (D153): none of the player's values make the pool's fish bigger or harder.
 * @param {string} species
 * @param {Record<string, Dice>} dice
 * @returns {PoolFish}
 */
const wildFish = (species, dice) => ({ ...rollFish(species, { fishSizeBand: 0, fishDifficulty: 0, fishXp: 0 }, dice.pool, { condition: dice.condition }), wild: true });

/**
 * Does the pool where the player is need tending: stocking, or a fish with
 * no place, number or days yet? Cheap, for the page to ask before every redraw.
 * @param {GameState} state
 */
export function poolDue(state) {
  if (!hasWater(state)) return false;
  const key = poolKey(state);
  const meta = state.pools?.[key];
  if (!meta) return locationTable({ location: state.location, spot: state.spot }, 'fish', { moment: waterMoment(state) }).length > 0;
  return meta.room === undefined || (state.escaped[key] ?? []).some((f) => (f.of === undefined && (f.x === undefined || f.n === undefined)) || (!f.wild && f.stays === undefined));
}

/**
 * Tends the pool where the player is: stocks it the first time, and gives its
 * fish what they lack. Changes `state` in place (a copy the caller owns).
 * Call it before taking dice for anything else: it commits its own streams (D53).
 * @param {GameState} state
 * @returns {boolean}  Whether anything changed.
 */
export function tendPool(state) {
  if (!poolDue(state)) return false;
  const key = poolKey(state);
  const { dice, commit } = diceFrom(state);
  /** @type {PoolFish[]} */
  let pool = [...(state.escaped[key] ?? [])];
  let meta = state.pools?.[key];
  if (!meta) {
    const table = locationTable({ location: state.location, spot: state.spot }, 'fish', { moment: waterMoment(state) });
    if (!table.length) return false;
    const size = dice.pool.roll2d6() + content.rules.pool.add;
    for (let i = 0; i < size; i++) {
      const species = pick(table, dice.pool);
      if (species?.id) pool.push(wildFish(species.id, dice));
    }
    meta = { season: seasonKey(state), size, at: state.time };
  }
  const settled = settle(pool, meta, waterAt(state.location, state.spot), dice.pool);
  state.escaped = { ...state.escaped, [key]: settled.pool };
  state.pools = { ...state.pools, [key]: settled.meta };
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
 * A new part of the day: every stocked pool takes its turn (D157), with the
 * weather and the water as they are now, wherever the player is. Changes
 * `state` in place; draws from the dice it is given, which the caller commits.
 * @param {GameState} state
 * @param {Record<string, Dice>} dice
 * @returns {import('./game.js').GameEvent[]}  What could be seen from the bank where the player is.
 */
export function stepPools(state, dice) {
  /** @type {import('./game.js').GameEvent[]} */
  const events = [];
  for (const key of Object.keys(state.pools ?? {})) events.push(...turn(state, key, dice));
  return events;
}

/**
 * One pool's turn (see the top of the file).
 * @param {GameState} state
 * @param {string} key
 * @param {Record<string, Dice>} dice
 * @returns {import('./game.js').GameEvent[]}
 */
function turn(state, key, dice) {
  const rules = content.rules.pool;
  const where = whereOf(key);
  if (!content.locations[where.location]) return [];
  const here = key === poolKey(state) && hasWater(state);
  const moment = waterMoment(state);
  const table = locationTable(where, 'fish', { moment });
  const water = waterAt(where.location, where.spot);
  /** @type {import('./game.js').GameEvent[]} */
  const events = [];
  let meta = state.pools[key];
  // A new season: a new number of fish for the spot.
  if (meta.season !== seasonKey(state)) meta = { ...meta, season: seasonKey(state), size: dice.pool.roll2d6() + rules.add };
  /** @param {PoolFish} f */
  const spawning = (f) => spawningIn(content.fish[f.species], moment);
  // What shows from the bank now, before anyone goes: a strike is seen only between two shadows.
  const shown = here ? new Set(shadowsOf(state).map((f) => f.n)) : new Set();

  let pool = (state.escaped[key] ?? []).filter((f) => {
    if (f.of !== undefined) return true;
    // Met: it stays its days, then swims off like any other. One whose days aren't rolled yet stays.
    if (!f.wild) return f.stays === undefined || state.time - (f.since ?? state.time) < f.stays * DAY;
    // The better the moment suits it, the likelier it stays: the chance to leave is halved (the preference
    // factor) for each preference met, the hour, the weather, the season, and twice over while it spawns
    // (a spawning spell can last a season: staying for certain, they filled every pool to the brim).
    // Not for the plants, always there.
    const suits = preferencesMet(content.fish[f.species], moment).length + (spawning(f) ? 2 : 0);
    return dice.pool.roll100() > rules.leave / content.rules['fish-preferences'].factor ** suits;
  });

  // Who eats whom (D152, D157): a predator with a wild fish under half its length there may take one, the
  // likelier the warmer the water; dice only when there is prey.
  const chance = Math.round((state.water ?? state.weather.temperature) * rules.eat * 10);
  for (const eater of pool.filter((f) => content.fish[f.species]?.predator)) {
    if (!pool.includes(eater)) continue;
    const prey = pool.filter((f) => f !== eater && f.wild && f.of === undefined && f.size < eater.size * content.rules.tank.preyRatio);
    if (!prey.length || dice.pool.getRandomNumber(1, 1000) > chance) continue;
    const eaten = prey[dice.pool.getRandomNumber(0, prey.length - 1)];
    pool = pool.filter((f) => f !== eaten);
    if (eater.of !== undefined) continue;
    if (shown.has(eater.n) && shown.has(eaten.n)) events.push({ type: 'pool-strike', at: { x: eaten.x, y: eaten.y }, from: { x: eater.x, y: eater.y } });
    // It is where its prey was.
    pool = pool.map((f) => (f === eater ? { ...f, x: eaten.x, y: eaten.y } : f));
  }

  // Others come, drawn for the moment: 1d4 - 1 of them, up to the spot's number. A kind that is spawning comes
  // 1d4 at a time, over that number too (D149, D157).
  /** @param {{ id: string | null } | null} species */
  const arrive = (species) => {
    if (!species?.id) return;
    const group = spawningIn(content.fish[species.id], moment) ? dice.pool.roll4() : 1;
    // Never past the crowd a spawning spell can make of a pool.
    for (let i = 0; i < group && ownOf(pool).length < meta.size * rules.spawnCrowd; i++) pool.push(wildFish(species.id, dice));
  };
  if (table.length) {
    const coming = dice.pool.roll4() - 1;
    for (let i = 0; i < coming && ownOf(pool).length < meta.size; i++) arrive(pick(table, dice.pool));
    // A full pool still draws the spawners, until it is twice its number.
    const spawners = table.filter((e) => e.id && spawningIn(content.fish[e.id], moment));
    if (spawners.length && ownOf(pool).length >= meta.size && ownOf(pool).length < meta.size * rules.spawnCrowd) arrive(pick(spawners, dice.pool));
  }

  const settled = settle(pool, { ...meta, at: state.time }, water, dice.pool);
  state.escaped = { ...state.escaped, [key]: settled.pool };
  state.pools = { ...state.pools, [key]: settled.meta };
  return events;
}

/**
 * With every cast the fish where the player is move a little (D157): each
 * drifts a few pixels, and three or more of a shoaling kind draw together
 * behind the first of them, a school to cast at. Changes `state` in place;
 * draws from the `pool` stream it is given.
 * @param {GameState} state
 * @param {Dice} dice
 */
export function driftPool(state, dice) {
  if (!hasWater(state)) return;
  const key = poolKey(state);
  const pool = state.escaped[key];
  if (!pool?.length) return;
  const rules = content.rules.pool;
  const water = waterAt(state.location, state.spot);
  const clampX = (/** @type {number} */ x) => Math.min(Math.max(water.x0 + 16, water.x1 - 16), Math.max(water.x0 + 16, Math.round(x)));
  const clampY = (/** @type {number} */ y) => Math.min(Math.max(water.y0 + 6, water.y1 - 6), Math.max(water.y0 + 6, Math.round(y)));
  const shoals = shoalsIn(pool);
  /** @type {Record<string, PoolFish>} */
  const leaders = {};
  /** @type {Record<string, number>} */
  const places = {};
  state.escaped = {
    ...state.escaped,
    [key]: pool.map((f) => {
      if (f.of !== undefined || f.x === undefined || f.y === undefined) return f;
      const lead = shoals.has(f.species) ? leaders[f.species] : undefined;
      if (lead) {
        // Its place in the school: beside and behind the first, and halfway there with each cast.
        const i = (places[f.species] = (places[f.species] ?? 0) + 1);
        const tx = (lead.x ?? 0) + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * rules.shoalGap.x;
        const ty = (lead.y ?? 0) + ((i % 3) - 1) * rules.shoalGap.y;
        return { ...f, x: clampX(f.x + (tx - f.x) / 2), y: clampY(f.y + (ty - f.y) / 2) };
      }
      const moved = { ...f, x: clampX(f.x + dice.getRandomNumber(-rules.drift, rules.drift)), y: clampY(f.y + dice.getRandomNumber(-Math.ceil(rules.drift / 2), Math.ceil(rules.drift / 2))) };
      if (shoals.has(f.species)) leaders[f.species] = moved;
      return moved;
    }),
  };
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
  const own = ownOf(pool);
  if (meta && joined.of === undefined && own.length > meta.size + (meta.room ?? 0)) {
    const out = own.find((f) => f.wild) ?? own.filter((f) => f !== joined).sort((a, b) => (a.since ?? 0) - (b.since ?? 0))[0];
    pool = pool.filter((f) => f !== out);
  }
  state.escaped = { ...state.escaped, [key]: pool };
}

/**
 * The pool's fish that show as shadows from the bank (D156), each where it
 * is: those that swim near the top, a deeper one now and then, fewer at night
 * and in the rain, and never more than `shadows`. A school always shows
 * (D157). Not a big fish: its feature shows that. No dice: which deeper fish
 * come up changes with the part of the day, from a hash.
 * @param {GameState} state
 * @returns {PoolFish[]}
 */
export function shadowsOf(state) {
  if (!hasWater(state)) return [];
  const rules = content.rules.pool;
  const part = partKey(state);
  const pool = state.escaped[poolKey(state)] ?? [];
  const shoals = shoalsIn(pool);
  const dim = clock(state.time).partOfDay === 'night' || state.weather.precipitation >= 2 ? rules.dim / 100 : 1;
  return pool
    .filter((f) => {
      if (f.of !== undefined || f.x === undefined || f.n === undefined) return false;
      if (shoals.has(f.species)) return true;
      const chance = (rules.show[content.fish[f.species]?.swims ?? 'lower'] ?? 0) * dim;
      return hash(`${f.n}-${f.species}-${part}`) % 100 < chance;
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
