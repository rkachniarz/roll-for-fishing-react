// @ts-check
// Spawning (D149): a fish spawns when the water is at its temperature and
// going its way (warming for spring and summer spawners, cooling for autumn
// and winter ones). Spawning fish gather: they are likelier at the spots they
// live in, and their schools come up on the water more often. The player is
// never told (the owner's call); a perk or an item may later show it.
//
// The water's temperature follows the air's (the weather's own scale, 0 to
// 15 and up) with a lag of about a day, and never freezes: it is magical.
// Kept in the state (`water`), moved each half-hour step (passage.js), with a
// slower average of itself (`waterSlow`) that says whether it is warming.

import { content } from '../generated/content.js';

/** @typedef {import('./state.js').GameState} GameState */

/**
 * The water a half-hour on: a share of the way to the air's temperature,
 * never below the lowest it can be. Changes `state` in place.
 * @param {GameState} state
 */
export function stepWater(state) {
  const rules = content.rules.spawning;
  const water = state.water ?? state.weather.temperature;
  const next = water + (state.weather.temperature - water) / rules.lag;
  state.water = Math.max(rules.minWater, Math.round(next * 100) / 100);
  // Its slow average, a week or so behind: what the water is measured against to say which way it is going.
  const slow = state.waterSlow ?? water;
  state.waterSlow = Math.round((slow + (state.water - slow) / rules.trendLag) * 10000) / 10000;
}

/**
 * Is a species spawning, with the water as it is and going the way it goes?
 * @param {{ spawn?: { min: number, max: number, trend: 'warming' | 'cooling' } }} fish  Its content.
 * @param {{ water?: number, warming?: boolean }} moment
 */
export function spawningIn(fish, moment) {
  const s = fish.spawn;
  if (!s || moment.water === undefined) return false;
  const water = Math.round(moment.water);
  if (water < s.min || water > s.max) return false;
  return s.trend === 'warming' ? moment.warming === true : moment.warming === false;
}

/**
 * The water now, and whether it is warming: warmer than its own slow average
 * (`waterSlow`), so over days, not hours. The air against the water flips a
 * few times a day, with every change of weather (Review 3). With nothing to
 * tell yet, a new game, the air decides.
 * @param {GameState} state
 */
export function waterNow(state) {
  const water = state.water ?? state.weather.temperature;
  const slow = state.waterSlow ?? water;
  return { water, warming: water !== slow ? water > slow : state.weather.temperature > water };
}

/**
 * The species spawning now.
 * @param {GameState} state
 * @returns {Set<string>}
 */
export function spawningNow(state) {
  const moment = waterNow(state);
  return new Set(Object.values(content.fish).filter((f) => !f.retired && spawningIn(f, moment)).map((f) => f.id));
}
