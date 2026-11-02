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
  /** A new game starts at 08:00 on the first day of spring. */
  startMinutes: 8 * 60,
};

const DAY = 24 * 60;

/**
 * @typedef {'night' | 'dawn' | 'morning' | 'afternoon' | 'evening'} PartOfDay
 *
 * @typedef {Object} Clock
 * @property {number} year        From 1.
 * @property {string} season      A season id.
 * @property {number} day         Day of the season, from 1.
 * @property {number} hour
 * @property {number} minute
 * @property {PartOfDay} partOfDay  For the day/night palettes (R7.5).
 */

/** @param {number} hour @returns {PartOfDay} */
function partOfDay(hour) {
  if (hour < 5) return 'night';
  if (hour < 7) return 'dawn';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
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
  return {
    year: Math.floor(seasonIndex / order.length) + 1,
    season: order[seasonIndex % order.length].id,
    day: (dayIndex % time.seasonDays) + 1,
    hour,
    minute: inDay % 60,
    partOfDay: partOfDay(hour),
  };
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
