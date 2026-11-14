// @ts-check
// Time passing: the clock, the season and the weather moving on by half-hour
// steps (R11.4), and buffs that last game time running out (R19.5). A cast
// that went out and ended takes one step; waiting or sleeping in town takes
// as many as it lasts (R17.2), and nothing else of a cast happens then.

import { advanceTime, clock, TIME } from './time.js';
import { changeSeason, stepWeather } from './weather.js';

/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {import('./game.js').GameEvent} GameEvent */
/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */

/**
 * One half-hour step. Changes `state` in place (a copy the caller owns).
 * @param {GameState} state
 * @param {Dice} weatherDice  The `weather` stream.
 * @returns {GameEvent[]}
 */
export function stepTime(state, weatherDice) {
  /** @type {GameEvent[]} */
  const events = [];
  const time = advanceTime(state.time);
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
  events.push(...expireBuffs(state));
  return events;
}

/**
 * Waiting or sleeping (R17.2): as many half-hour steps as fit in `minutes`.
 * Only the last weather change is reported, so a night's sleep doesn't fill
 * the log. Changes `state` in place.
 * @param {GameState} state
 * @param {number} minutes
 * @param {Dice} weatherDice
 * @returns {GameEvent[]}
 */
export function passTime(state, minutes, weatherDice) {
  /** @type {GameEvent[]} */
  const events = [];
  /** @type {GameEvent | null} */
  let weather = null;
  for (let left = minutes; left > 0; left -= TIME.castMinutes) {
    for (const e of stepTime(state, weatherDice)) {
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
