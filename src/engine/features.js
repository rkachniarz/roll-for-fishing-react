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
import { pick } from './tables.js';

/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */

/**
 * The open water a cast may land on and a feature may drift over, in scene
 * pixels: clear of the view's edges and 30 pixels above the shore's highest
 * point. The scene draws to the same numbers (src/scene/scene.js).
 */
export const WATER = { x0: 40, y0: 30, x1: 216, y1: 185 };

/**
 * @typedef {Object} Feature  One on the water.
 * @property {string} id         A feature id from content/features/.
 * @property {number} x
 * @property {number} y
 * @property {number} uses       Casts into it left before it's fished out.
 * @property {number} castsLeft  Casts before it goes anyway.
 * @property {number} born       The cast it appeared after: tells two of the same kind apart.
 * @property {number} [swamOff]  How many times its fish got away and it swam off (D85).
 * @property {import('./state.js').PoolFish} [fish]  The fish it holds, once one got away from it.
 */

/** How far a big fish swims off when it gets away, at the least, in scene pixels (D85). */
export const SWIM_OFF = 60;

/**
 * A fish got away from this feature, and it swims off: far across the water,
 * with the same fish and its uses and lifetime back. Changes `feature`.
 * @param {Feature} feature
 * @param {any} def  Its content.
 * @param {import('./state.js').PoolFish} fish
 * @param {Dice} dice  The `features` stream.
 */
export function swimOff(feature, def, fish, dice) {
  let x, y;
  let tries = 0;
  do {
    x = dice.getRandomNumber(WATER.x0, WATER.x1);
    y = dice.getRandomNumber(WATER.y0, WATER.y1);
    tries++;
  } while (Math.hypot(x - feature.x, y - feature.y) < SWIM_OFF && tries < 50);
  feature.x = x;
  feature.y = y;
  feature.uses = def.uses;
  feature.castsLeft = def.lifetime;
  feature.swamOff = (feature.swamOff ?? 0) + 1;
  feature.fish = fish;
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
 * After a resolved cast: features age, drift and go, and a new one may appear.
 * Changes `state` (a copy the caller owns).
 * @param {import('./state.js').GameState} state
 * @param {Dice} dice  The `features` stream.
 * @param {{ appear?: boolean }} [options]  appear: false for a cast pulled out
 *   before a bite, which ages and moves what's there but brings nothing new (D85).
 * @returns {import('./game.js').GameEvent[]}
 */
export function updateFeatures(state, dice, { appear = true } = {}) {
  /** @type {import('./game.js').GameEvent[]} */
  const events = [];
  const kept = [];
  for (const f of state.features) {
    const def = content.features[f.id];
    const next = { ...f, castsLeft: f.castsLeft - 1 };
    if (next.uses <= 0 || next.castsLeft <= 0) {
      events.push({ type: 'feature-gone', feature: f.id, fishedOut: next.uses <= 0 });
      continue;
    }
    if (def.drift > 0) {
      next.x = clamp(next.x + dice.getRandomNumber(-def.drift, def.drift), WATER.x0, WATER.x1);
      next.y = clamp(next.y + dice.getRandomNumber(-def.drift, def.drift), WATER.y0, WATER.y1);
    }
    kept.push(next);
  }
  state.features = kept;

  if (!appear) return events;
  const loc = content.locations[state.location];
  // The location's features and the spot's own: its schools and big fish (D102).
  const spot = state.spot ? loc.spots?.find((/** @type {{ id: string }} */ s) => s.id === state.spot) : null;
  const list = [...(loc.features ?? []), ...(spot?.features ?? [])];
  if (list.length && state.features.length < (loc.maxFeatures ?? 0) && dice.roll100() <= (loc.featureChance ?? 0)) {
    const choice = pick(
      list.filter((/** @type {{ id: string }} */ e) => !content.features[e.id].retired),
      dice,
    );
    if (choice) {
      const def = content.features[choice.id];
      const feature = {
        id: choice.id,
        x: dice.getRandomNumber(WATER.x0, WATER.x1),
        y: dice.getRandomNumber(WATER.y0, WATER.y1),
        uses: def.uses,
        castsLeft: def.lifetime,
        born: state.book.casts,
      };
      state.features.push(feature);
      events.push({ type: 'feature-appeared', feature: choice.id });
    }
  }
  return events;
}

/** @param {number} v @param {number} lo @param {number} hi */
function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}
