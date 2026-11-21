// @ts-check
// Time passing: the clock, the season, the weather and the wind moving on by half-hour
// steps (R11.4), and buffs that last game time running out (R19.5). A cast
// that went out and ended takes one step; waiting or sleeping in town takes
// as many as it lasts (R17.2), and nothing else of a cast happens then. The
// stew's buff stands still in town and asleep (D172).

import { advanceTime, clock, TIME } from './time.js';
import { changeSeason, stepWeather } from './weather.js';
import { stepWater } from './spawning.js';
import { stepWind, windStart } from './wind.js';
import { partKey, stepPools } from './pool.js';
import { content } from '../generated/content.js';

/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {import('./game.js').GameEvent} GameEvent */
/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */

/**
 * One half-hour step. Changes `state` in place (a copy the caller owns).
 * @param {GameState} state
 * @param {Record<string, Dice>} dice  The state's dice (diceFrom): the weather from `weather`, its direction from
 *   `wind`, the pools from `pool` and `condition`.
 * @param {{ asleep?: boolean }} [how]  Asleep, buffs that hold (D172) don't run down, wherever the player is.
 * @returns {GameEvent[]}
 */
export function stepTime(state, dice, how = {}) {
  const weatherDice = dice.weather;
  /** @type {GameEvent[]} */
  const events = [];
  const part = partKey(state);
  const time = advanceTime(state.time);
  // In town or asleep, a buff that holds (the stew's) ends as much later as the time that passes (D172).
  if (how.asleep || content.locations[state.location]?.town) {
    const step = time.minutes - state.time;
    state.buffs = state.buffs.map((b) => (b.holds && b.until !== undefined ? { ...b, until: b.until + step } : b));
  }
  state.time = time.minutes;
  if (time.newSeason) {
    state.weather = changeSeason(state.weather, time.newSeason, weatherDice);
    events.push({ type: 'season', season: time.newSeason, weather: state.weather });
  } else {
    // Weather a Shaman called up from another season drifts on this
    // season's map, from the same cell (D114).
    const season = clock(state.time).season;
    const step = stepWeather(state.weather.season === season ? state.weather : { ...state.weather, season }, weatherDice);
    if (step.changed) {
      state.weather = step.weather;
      events.push({ type: 'weather', weather: state.weather });
    }
  }
  // The wind veers and backs on its own flower (D176).
  state.wind = stepWind(state.wind ?? windStart(), clock(state.time).season, dice.wind);
  // The water follows the air, a day behind (D149).
  stepWater(state);
  // A new part of the day: every pool the player has been to lives on (D157).
  if (partKey(state) !== part) events.push(...stepPools(state, dice));
  events.push(...expireBuffs(state));
  return events;
}

/**
 * Waiting or sleeping (R17.2): as many half-hour steps as fit in `minutes`.
 * Only the last weather change is reported, so a night's sleep doesn't fill
 * the log. Changes `state` in place.
 * @param {GameState} state
 * @param {number} minutes
 * @param {Record<string, Dice>} dice  As stepTime's.
 * @param {{ asleep?: boolean }} [how]  As stepTime's.
 * @returns {GameEvent[]}
 */
export function passTime(state, minutes, dice, how = {}) {
  /** @type {GameEvent[]} */
  const events = [];
  /** @type {GameEvent | null} */
  let weather = null;
  for (let left = minutes; left > 0; left -= TIME.castMinutes) {
    for (const e of stepTime(state, dice, how)) {
      if (e.type === 'weather') weather = e;
      else events.push(e);
    }
  }
  if (weather) events.push(weather);
  return events;
}

/**
 * Buffs that last game time (`until`, a game minute) end once it's reached.
 * Changes `state` in place.
 * @param {GameState} state
 * @returns {GameEvent[]}
 */
export function expireBuffs(state) {
  const ended = state.buffs.filter((b) => b.until !== undefined && state.time >= b.until);
  if (!ended.length) return [];
  state.buffs = state.buffs.filter((b) => !ended.includes(b));
  return ended.map((b) => ({ type: 'buff-ended', buff: b.id }));
}
