// @ts-check
// Surface features: schools of fish, a big fish just under the surface,
// curious spots and disturbances (docs/spec.md, R14; D33, D40, D62). They
// appear at random after a cast, drift a little with every cast, and thin out
// as they are fished. A cast that lands inside one gets its effects and
// tables. They are never hidden (D62): one is either on the water or not.
//
// All of this moves with casts, not with real time, so it stays seeded and
// replayable (D4); the scene smooths the drift between casts.

import { content } from '../generated/content.js';
import { spawningNow } from './spawning.js';
import { pick } from './tables.js';
import { maybeChampion, poolKey } from './champions.js';
import { rollFish, sizeBands } from './fish.js';

/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */

/**
 * The open water a cast may land on and a feature may drift over, in scene
 * pixels: clear of the view's edges and 30 pixels above the shore's highest
 * point. The scene draws to the same numbers (src/scene/scene.js).
 */
export const WATER = { x0: 40, y0: 30, x1: 216, y1: 185 };

/**
 * The open water at a spot (4.2): its own, if its data says, else WATER.
 * @param {string} location
 * @param {string | null} spot
 * @returns {{ x0: number, y0: number, x1: number, y1: number }}
 */
export function waterAt(location, spot) {
  return content.locations[location]?.spots?.find((/** @type {{ id: string }} */ s) => s.id === spot)?.water ?? WATER;
}

/**
 * @typedef {Object} Feature  One on the water.
 * @property {string} id         A feature id from content/features/.
 * @property {number} x
 * @property {number} y
 * @property {number} uses       Casts into it left before it's fished out; for a school or a big fish, how many
 *   of its fish are in the pool (D156).
 * @property {number} castsLeft  Casts before it goes anyway.
 * @property {number} born       The cast it appeared after: tells two of the same kind apart.
 * @property {number} [swamOff]  How many times its fish got away and it swam off (D85).
 */

/**
 * A school's fish, or the one big fish, are in the spot's pool (D156), each
 * marked `of` its feature's `born`. These are they.
 * @param {import('./state.js').GameState} state
 * @param {{ born: number }} feature
 * @returns {import('./state.js').PoolFish[]}
 */
export function fishOf(state, feature) {
  return (state.escaped[poolKey(state)] ?? []).filter((f) => f.of === feature.born);
}

/**
 * A feature's fish leave with it (D156): the wild ones go; one the player has
 * met stays in the pool as any met fish does, with a place of its own where
 * the feature was. `born` left out: every feature's, as when the player goes.
 * Changes `state` in place.
 * @param {import('./state.js').GameState} state
 * @param {Feature} [feature]
 */
export function partFish(state, feature) {
  const key = poolKey(state);
  const pool = state.escaped[key];
  if (!pool?.some((f) => f.of !== undefined)) return;
  state.escaped = {
    ...state.escaped,
    [key]: pool.flatMap((f) => {
      if (f.of === undefined || (feature && f.of !== feature.born)) return [f];
      if (f.wild) return [];
      const { of, ...own } = f;
      const from = feature ?? state.features.find((x) => x.born === of);
      return [{ ...own, ...(from ? { x: Math.round(from.x), y: Math.round(from.y) } : {}) }];
    }),
  };
}

/** How far a big fish swims off when it gets away, at the least, in scene pixels (D85). */
export const SWIM_OFF = 60;

/**
 * A fish got away from this feature, and it swims off: far across the water,
 * with its lifetime back; its fish stays in the pool, marked as its own
 * (D156). Changes `feature`.
 * @param {Feature} feature
 * @param {any} def  Its content.
 * @param {Dice} dice  The `features` stream.
 */
export function swimOff(feature, def, dice, water = WATER) {
  let x, y;
  let tries = 0;
  do {
    x = dice.getRandomNumber(water.x0, water.x1);
    y = dice.getRandomNumber(water.y0, water.y1);
    tries++;
  } while (Math.hypot(x - feature.x, y - feature.y) < SWIM_OFF && tries < 50);
  feature.x = x;
  feature.y = y;
  feature.castsLeft = def.lifetime;
  feature.swamOff = (feature.swamOff ?? 0) + 1;
}

/**
 * The feature a cast landed in, if any: the nearest whose radius covers the
 * landing.
 * @param {Feature[]} features
 * @param {{ x: number, y: number } | null} landing
 * @returns {Feature | null}
 */
export function featureAt(features, landing) {
  if (!landing) return null;
  let best = null;
  let bestDistance = Infinity;
  for (const f of features) {
    const d = Math.hypot(f.x - landing.x, f.y - landing.y);
    if (d <= content.features[f.id].radius && d < bestDistance) {
      best = f;
      bestDistance = d;
    }
  }
  return best;
}

/**
 * A feature comes up on the water. A school or a big fish brings its fish
 * into the spot's pool with it (D156): a school's few, or the one big fish,
 * rolled now and marked as its own. Changes `state` in place.
 * @param {import('./state.js').GameState} state
 * @param {string} id  A feature id.
 * @param {{ x: number, y: number }} at
 * @param {Dice} dice  The `features` stream.
 * @param {Dice} [condition]  The `condition` stream (D146).
 * @returns {Feature}
 */
export function bringFeature(state, id, at, dice, condition) {
  const def = content.features[id];
  /** @type {Feature} */
  const feature = { id, x: at.x, y: at.y, uses: def.uses, castsLeft: def.lifetime, born: state.book.casts };
  if (def.fish?.length) {
    const school = content.rules.pool.school;
    const count = def.kind === 'school' ? dice.getRandomNumber(school.min, school.max) : 1;
    const minBand = def.minBand ? sizeBands().findIndex((/** @type {{ id: string }} */ b) => b.id === def.minBand) : 0;
    const key = poolKey(state);
    /** @type {import('./state.js').PoolFish[]} */
    const fish = [];
    for (let i = 0; i < count; i++) {
      const species = pick(def.fish, dice);
      if (!species?.id) continue;
      // As the pool's own (D153): none of the player's values.
      fish.push({ ...rollFish(species.id, { fishSizeBand: 0, fishDifficulty: 0, fishXp: 0 }, dice, { minBand, condition }), wild: true, of: feature.born });
    }
    state.escaped = { ...state.escaped, [key]: [...(state.escaped[key] ?? []), ...fish] };
    feature.uses = fish.length;
  }
  state.features = [...state.features, feature];
  return feature;
}

/**
 * After a resolved cast: features age, drift and go, and a new one may appear.
 * Changes `state` (a copy the caller owns).
 * @param {import('./state.js').GameState} state
 * @param {Dice} dice  The `features` stream.
 * @param {{ appear?: boolean, champions?: Dice, extraChance?: number, condition?: Dice }} [options]  appear: false for a cast pulled out
 *   before a bite, which ages and moves what's there but brings nothing new (D85).
 *   champions: the `champions` stream, for a class fish that may come up in
 *   place of a feature (D114). extraChance: the featureChance game value, added to the location's.
 *   condition: the `condition` stream, for the fish a new school or big fish brings (D146, D156).
 * @returns {import('./game.js').GameEvent[]}
 */
export function updateFeatures(state, dice, { appear = true, champions, extraChance = 0, condition } = {}) {
  const water = waterAt(state.location, state.spot);
  /** @type {import('./game.js').GameEvent[]} */
  const events = [];
  const kept = [];
  for (const f of state.features) {
    const def = content.features[f.id];
    const next = { ...f, castsLeft: f.castsLeft - 1 };
    // A school or a big fish is as many as its fish still in the pool (D156).
    if (def.fish) next.uses = fishOf(state, f).length;
    if (next.uses <= 0 || next.castsLeft <= 0) {
      events.push({ type: 'feature-gone', feature: f.id, fishedOut: next.uses <= 0 });
      partFish(state, f);
      continue;
    }
    if (def.drift > 0) {
      next.x = clamp(next.x + dice.getRandomNumber(-def.drift, def.drift), water.x0, water.x1);
      next.y = clamp(next.y + dice.getRandomNumber(-def.drift, def.drift), water.y0, water.y1);
    }
    kept.push(next);
  }
  state.features = kept;

  if (!appear) return events;
  const loc = content.locations[state.location];
  // The location's features and the spot's own: its schools and big fish (D102).
  const spot = state.spot ? loc.spots?.find((/** @type {{ id: string }} */ s) => s.id === state.spot) : null;
  const list = [...(loc.features ?? []), ...(spot?.features ?? [])];
  if (list.length && state.features.length < (loc.maxFeatures ?? 0) && dice.roll100() <= (loc.featureChance ?? 0) + extraChance) {
    // Now and then a class fish instead (D114).
    const champion = champions ? maybeChampion(state, champions, water) : [];
    if (champion.length) return [...events, ...champion];
    // A spawning fish's school comes up more often (D149).
    const spawning = spawningNow(state);
    const factor = content.rules.spawning.schools;
    const choice = pick(
      list
        .filter((/** @type {{ id: string }} */ e) => !content.features[e.id].retired)
        .map((/** @type {{ id: string, weight: number }} */ e) => {
          const def = content.features[e.id];
          const fish = def.kind === 'school' ? def.fish?.[0]?.id : null;
          return fish && spawning.has(fish) ? { ...e, weight: e.weight * factor } : e;
        }),
      dice,
    );
    if (choice) {
      bringFeature(state, choice.id, { x: dice.getRandomNumber(water.x0, water.x1), y: dice.getRandomNumber(water.y0, water.y1) }, dice, condition);
      events.push({ type: 'feature-appeared', feature: choice.id });
    }
  }
  return events;
}

/** @param {number} v @param {number} lo @param {number} hi */
function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}
