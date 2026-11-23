// @ts-check
// The moon and the fish (12.3, D168), in four ways, all worked out from the
// clock and never stored (D7, D13):
//
//   - its phase, as a preference like the weather's: a fish can prefer the
//     full or the new moon (`prefers.moon`), day or night;
//   - the moonlight at night: the part of the disc lit, times how high the
//     moon stands, under the clouds, and only once the sun is well down. A fish
//     can prefer a moonlit night or a dark one, and a bright moon shows more of
//     the pool's shadows at night (`shadowsOf` in pool.js);
//   - the anglers' moon tables (solunar periods): a major period while the
//     moon stands due south or due north under the earth, a minor one around
//     moonrise and moonset. Outdoors each is a buff on the bar
//     (conditions.js), and the pools feel it (pool.js);
//   - the pools' turns (D157) through all of the above: the moon words are in
//     the moment, so who stays and who comes follows them too.
//
// A state without a moon (`fullMoonAt`, as test fixtures built by hand have
// it) has none of this: no words, no period, no light.
//
// The words are in content/rules/fish-preferences.json (`moonWords`), the
// amounts in content/rules/moon.json.
//
// Trap: A state without `fullMoonAt` (a fixture built by hand) has no moon at all; a test that
// compares values or counts shadows at night can drop it to leave the moon out.
//  `moonNow(state)` works out the moon's words (into the moment, for `prefers.moon`), the moonlight
//   and the anglers' period (a buff from `conditionBuffs`) from the clock and `state.fullMoonAt`.

import { content } from '../generated/content.js';
import { moonHourAngle, moonPosition, sunPosition } from './sky.js';

/**
 * @typedef {Object} MoonNow
 * @property {number} phase  0 new, 0.5 full.
 * @property {number} lit  The part of the disc lit, 0 to 1.
 * @property {import('./sky.js').MoonPhaseName} name
 * @property {number} altitude  The moon's height, degrees.
 * @property {boolean} night  The sun is down far enough for the moonlight to count.
 * @property {number} light  The moonlight on the water, 0 to 1.
 * @property {'major' | 'minor' | null} period  The anglers' moon tables.
 * @property {string[]} words  The moon words that fit (rules/fish-preferences.json).
 */

/** @param {number} x */
const clamp01 = (x) => Math.max(0, Math.min(1, x));

/**
 * The period of the anglers' moon tables at a game minute, if any: `major`
 * while the moon is within its hours of due south or due north (overhead,
 * underfoot), `minor` while moonrise or moonset is within its hours. A major
 * period wins.
 * @param {number} minutes
 * @param {number} fullMoonAt
 * @returns {'major' | 'minor' | null}
 */
export function solunarPeriod(minutes, fullMoonAt) {
  const periods = content.rules.moon?.periods ?? [];
  const major = periods.find((/** @type {{ id: string }} */ p) => p.id === 'major');
  if (major) {
    const angle = Math.abs(moonHourAngle(minutes, fullMoonAt));
    const reach = 15 * major.hours;
    if (angle < reach || angle > 180 - reach) return 'major';
  }
  const minor = periods.find((/** @type {{ id: string }} */ p) => p.id === 'minor');
  if (minor) {
    // The moon crosses the horizon within its hours: up at one end, down at the other.
    const before = moonPosition(minutes - minor.hours * 60, fullMoonAt).altitude > 0;
    const after = moonPosition(minutes + minor.hours * 60, fullMoonAt).altitude > 0;
    if (before !== after) return 'minor';
  }
  return null;
}

/**
 * The moonlight on the water at a game minute: 0 by day and in the twilight
 * (the sun above `dark`), else the part lit, times how high the moon stands
 * (whole from `fullLightAt`), times what the clouds let through.
 * @param {number} minutes
 * @param {number} fullMoonAt
 * @param {number} clouds  The weather's cloud level.
 */
export function moonlight(minutes, fullMoonAt, clouds) {
  const rules = content.rules.moon;
  if (!rules) return 0;
  if (sunPosition(minutes).altitude >= rules.dark) return 0;
  const moon = moonPosition(minutes, fullMoonAt);
  const cover = rules.cloudCover[Math.min(rules.cloudCover.length - 1, Math.max(0, clouds))] ?? 1;
  return moon.lit * clamp01(moon.altitude / rules.fullLightAt) * cover;
}

/**
 * The moon words that fit (rules/fish-preferences.json, `moonWords`).
 * @param {{ lit: number, light: number, night: boolean }} moon
 * @returns {string[]}
 */
export function moonWords(moon) {
  /** @param {{ min?: number, max?: number } | undefined} range @param {number} v */
  const within = (range, v) => !range || ((range.min === undefined || v >= range.min) && (range.max === undefined || v <= range.max));
  return (content.rules['fish-preferences'].moonWords ?? [])
    .filter((/** @type {any} */ w) => (!w.night || moon.night) && within(w.lit, moon.lit) && within(w.light, moon.light))
    .map((/** @type {{ id: string }} */ w) => w.id);
}

/**
 * Everything the moon means for the fish now, or null for a state without a
 * moon (D168).
 * @param {{ time: number, fullMoonAt?: number, weather: { clouds: number } }} state
 * @returns {MoonNow | null}
 */
export function moonNow(state) {
  if (typeof state.fullMoonAt !== 'number' || !content.rules.moon) return null;
  const moon = moonPosition(state.time, state.fullMoonAt);
  const night = sunPosition(state.time).altitude < content.rules.moon.dark;
  const light = moonlight(state.time, state.fullMoonAt, state.weather?.clouds ?? 0);
  const now = { phase: moon.phase, lit: moon.lit, name: moon.name, altitude: moon.altitude, night, light, period: solunarPeriod(state.time, state.fullMoonAt) };
  return { ...now, words: moonWords(now) };
}

/**
 * The rule for a period of the moon tables (rules/moon.json), or null.
 * @param {'major' | 'minor' | null | undefined} period
 * @returns {{ id: string, name: string, hours: number, effects: any[], eat: number, arrive: number } | null}
 */
export function periodRule(period) {
  if (!period) return null;
  return content.rules.moon?.periods?.find((/** @type {{ id: string }} */ p) => p.id === period) ?? null;
}
