// @ts-check
// Weather: the prototype's engine, ported faithfully (docs/spec.md, R11.3;
// PORTING-NOTES §1.1). Each season is a map of 19 weathers on a hex grid, and
// the weather drifts one cell at a time:
//
//   roll6: 4-6, nothing changes.
//   Otherwise roll2d6 for the direction:  2 NW · 3-4 SW · 5-6 S · 7 SE · 8 NE ·
//   9-10 stay · 11 N · 12 NW. The bias towards S and SE is intended (D26).
//
// The maps live in content/weather/. A cell's `changeSet` lists its neighbour
// in each direction (layout: src/engine/hexmap.js), or the cell itself where an
// edge line holds the weather.

import { content } from '../generated/content.js';

/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */

/**
 * @typedef {Object} Weather
 * @property {string} season       A season id: 'spring'…
 * @property {number} cell         0-18 on that season's map.
 * @property {number} temperature
 * @property {number} wind
 * @property {number} clouds
 * @property {number} precipitation
 * @property {string} description  A string key (D46).
 */

/** The direction for each total of 2d6, by index (0 and 1 can't come up); -1 stays. */
const BY_2D6 = [-1, -1, 5, 4, 4, 3, 3, 2, 1, -1, -1, 0, 5];

/** The seasons in order. */
export function seasons() {
  return Object.values(content.weather).sort((a, b) => a.order - b.order);
}

/**
 * The weather as it turns to a cell: ranged levels and the description are
 * rolled now, so they hold while the weather stays (PORTING-NOTES §1.1).
 * @param {string} season
 * @param {number} cell
 * @param {Dice} dice  The `weather` stream.
 * @returns {Weather}
 */
export function weatherAt(season, cell, dice) {
  const w = content.weather[season].weathers[cell];
  /** @param {number | { min: number, max: number }} level */
  const roll = (level) => (typeof level === 'number' ? level : dice.getRandomNumber(level.min, level.max));
  return {
    season,
    cell,
    temperature: roll(w.temperature),
    wind: roll(w.wind),
    clouds: roll(w.clouds),
    precipitation: roll(w.precipitation),
    description: w.descriptions[dice.getRandomNumber(0, w.descriptions.length - 1)],
  };
}

/**
 * One step of drift, made once per cast (D66).
 * @param {Weather} weather
 * @param {Dice} dice  The `weather` stream.
 * @returns {{ weather: Weather, changed: boolean }}
 */
export function stepWeather(weather, dice) {
  if (dice.roll6() > 3) return { weather, changed: false };
  const direction = BY_2D6[dice.roll2d6()];
  if (direction === -1) return { weather, changed: false };
  const to = content.weather[weather.season].weathers[weather.cell].changeSet[direction];
  if (to === weather.cell) return { weather, changed: false };
  return { weather: weatherAt(weather.season, to, dice), changed: true };
}

/**
 * A new season keeps the cell: every map has the same layout.
 * @param {Weather} weather
 * @param {string} season
 * @param {Dice} dice
 * @returns {Weather}
 */
export function changeSeason(weather, season, dice) {
  return weatherAt(season, weather.cell, dice);
}

/**
 * The words for the weather's levels (from the prototype's LocationInfo), as
 * string keys.
 * @param {Weather} weather
 */
export function weatherWords(weather) {
  const scales = content.rules['weather-scales'];
  return {
    name: content.weather[weather.season].weathers[weather.cell].name,
    temperature: scales.temperature.find((/** @type {{ upTo: number }} */ s) => weather.temperature <= s.upTo).word,
    wind: scales.wind[weather.wind],
    clouds: scales.clouds[weather.clouds],
    precipitation: scales.precipitation[weather.precipitation],
  };
}
