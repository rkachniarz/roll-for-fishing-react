// @ts-check
// Game time: its own clock, moved on only by resolved casts (docs/spec.md,
// R11.4). It never depends on the weather, as the prototype's did
// (PORTING-NOTES §1.1). Real time while the game is open is a separate thing,
// used only by timed buffs (D32).
//
// Time is kept as whole game minutes since the first midnight of the first
// spring. Everything else (day, season, hour) is worked out from that.

import { seasons } from './weather.js';

/**
 * The baseline from D66, as game values the ?dev bench can change: a cast is
 * 30 minutes, so a day is 48 casts; a season is 28 days.
 */
export const TIME = {
  castMinutes: 30,
  seasonDays: 28,
};

const DAY = 24 * 60;

/**
 * Sunrise and sunset through the year, as in Gdynia, Poland (54.5° N), on the
 * local clock (D85). The game's year starts on the first day of spring,
 * taken as 1 March; the longest day, 21 June, falls 0.307 of the way through.
 * Sunrise runs from 04:12 at midsummer to 07:48 at midwinter, sunset from
 * 21:22 to 15:28.
 */
export const SUN = {
  midsummer: 0.307,
  sunrise: { mean: 6.0, swing: -1.8 },
  sunset: { mean: 18.42, swing: 2.95 },
};

/**
 * @param {number} yearFraction  0 at the start of spring, up to 1.
 * @returns {{ rise: number, set: number }}  In hours, with fractions.
 */
export function sunAt(yearFraction) {
  const c = Math.cos(2 * Math.PI * (yearFraction - SUN.midsummer));
  return { rise: SUN.sunrise.mean + SUN.sunrise.swing * c, set: SUN.sunset.mean + SUN.sunset.swing * c };
}

/**
 * @typedef {'night' | 'dawn' | 'morning' | 'noon' | 'afternoon' | 'sunset' | 'evening'} PartOfDay
 *
 * @typedef {Object} Clock
 * @property {number} year        From 1.
 * @property {string} season      A season id.
 * @property {number} day         Day of the season, from 1.
 * @property {number} hour
 * @property {number} minute
 * @property {{ rise: number, set: number }} sun  Today's sunrise and sunset, in hours.
 * @property {PartOfDay} partOfDay  Shown instead of the clock (R16.4).
 */

/**
 * The words the player sees for the time (R16.4), following the sun (D85)
 * and lined up with the scene's light (src/scene/light.js): dawn is the hour
 * either side of sunrise, sunset the hour either side of sunset, and evening
 * the two hours after, until midnight at the latest. Noon is 11 to 13.
 * @param {number} h  Hours, with fractions.
 * @param {{ rise: number, set: number }} sun
 * @returns {PartOfDay}
 */
export function partOfDay(h, sun) {
  if (h < sun.rise - 1) return 'night';
  if (h < sun.rise + 1) return 'dawn';
  if (h < 11) return 'morning';
  if (h < 13) return 'noon';
  if (h < sun.set - 1) return 'afternoon';
  if (h < sun.set + 1) return 'sunset';
  if (h < sun.set + 3) return 'evening';
  return 'night';
}

/**
 * @param {number} minutes  Game minutes since the start.
 * @param {typeof TIME} [time]
 * @returns {Clock}
 */
export function clock(minutes, time = TIME) {
  const order = seasons();
  const dayIndex = Math.floor(minutes / DAY);
  const seasonIndex = Math.floor(dayIndex / time.seasonDays);
  const inDay = minutes - dayIndex * DAY;
  const hour = Math.floor(inDay / 60);
  const yearDays = order.length * time.seasonDays;
  const sun = sunAt(((dayIndex % yearDays) + 0.5) / yearDays);
  return {
    year: Math.floor(seasonIndex / order.length) + 1,
    season: order[seasonIndex % order.length].id,
    day: (dayIndex % time.seasonDays) + 1,
    hour,
    minute: inDay % 60,
    sun,
    partOfDay: partOfDay(inDay / 60, sun),
  };
}

/**
 * The season outside, in the northern hemisphere, by the month (0 for
 * January): spring is March to May, as the game's year (D85).
 * @param {number} month
 */
export function seasonOfMonth(month) {
  return seasons()[Math.floor(((month + 10) % 12) / 3)].id;
}

/**
 * When a new game starts (D85): a random day of the year, with even odds of
 * the season given (the one outside) or one of the other three; always in the
 * middle of the morning, on the half hour.
 * @param {string} season
 * @param {ReturnType<import('../dice.js').diceFor>} dice
 * @param {typeof TIME} [time]
 * @returns {number} Game minutes.
 */
export function startTime(season, dice, time = TIME) {
  const order = seasons().map((s) => s.id);
  const others = order.filter((id) => id !== season);
  const chosen = dice.roll100() <= 50 || others.length === order.length ? season : others[dice.getRandomNumber(0, others.length - 1)];
  const index = Math.max(0, order.indexOf(chosen));
  const dayIndex = index * time.seasonDays + dice.getRandomNumber(0, time.seasonDays - 1);
  const { sun } = clock(dayIndex * DAY, time);
  const morning = (sun.rise + 1 + 11) / 2;
  return dayIndex * DAY + Math.round(morning * 2) * 30;
}

/**
 * One resolved cast's worth of time.
 * @param {number} minutes
 * @param {typeof TIME} [time]
 * @returns {{ minutes: number, newDay: boolean, newSeason: string | null }}
 *   newSeason: the season just begun, if one did.
 */
export function advanceTime(minutes, time = TIME) {
  const before = clock(minutes, time);
  const after = minutes + time.castMinutes;
  const now = clock(after, time);
  return {
    minutes: after,
    newDay: now.day !== before.day || now.season !== before.season,
    newSeason: now.season !== before.season ? now.season : null,
  };
}
