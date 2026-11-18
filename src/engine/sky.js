// @ts-check
// Which way the player looks, and what of the sky the picture shows (12.1,
// D166). Each spot that shows sky has a compass facing (`look.facing`,
// degrees: 0 north, 90 east, clockwise), and every spot sees the same width
// of view, so a bearing (the sun's, the moon's) falls at the same place across
// the picture wherever the player stands.
//
// The sun and the moon (12.2, D167): where each stands in the sky at any game
// minute, worked out from the clock and never stored. The only thing stored is
// the game minute of the first full moon (`state.fullMoonAt`), rolled once at a
// new game. Drawing them is 12.4's.

import { content } from '../generated/content.js';
import { TIME, sunAt } from './time.js';

/**
 * The view every spot shares: `width` degrees of compass across the picture,
 * centred on the spot's facing (Claude's pick, docs/REVIEW.md).
 */
export const VIEW = {
  width: 60,
};

/**
 * A spot's facing, or null for a spot with none (the swamp, which has no sky,
 * and the town's places).
 * @param {string} location
 * @param {string} spot
 * @returns {number | null}
 */
export function facingOf(location, spot) {
  const loc = content.locations[location];
  const data = loc?.spots?.find((/** @type {{ id: string }} */ s) => s.id === spot);
  const facing = data?.look?.facing;
  return typeof facing === 'number' ? facing : null;
}

/**
 * Where a compass bearing falls across the view of a spot facing `facing`:
 * -1 at the picture's left edge, 0 straight ahead, 1 at its right edge, or null
 * when the bearing is outside the view (or there is no facing). Bearings wrap,
 * so 350 seen from a facing of 10 is -20 degrees, left of centre.
 * @param {number | null} facing
 * @param {number} bearing
 * @param {number} [width]
 * @returns {number | null}
 */
export function acrossView(facing, bearing, width = VIEW.width) {
  if (facing === null || facing === undefined) return null;
  const off = ((((bearing - facing) % 360) + 540) % 360) - 180; // -180..180
  const half = width / 2;
  if (Math.abs(off) > half) return null;
  return off / half;
}

// ---------- The sun and the moon (12.2, D167) ----------

const DAY = 24 * 60;
const RAD = Math.PI / 180;

/**
 * Where the sky is seen from (D85): Gdynia's latitude. Its longitude is in
 * `SUN`'s times already (the sun is due south midway between sunrise and
 * sunset), so it isn't used.
 */
export const GDYNIA = { latitude: 54.52, longitude: 18.53 };

/** The tilt of the earth: the sun's height swings this far either side of the equinoxes'. */
const TILT = 23.44;

/** How far below the horizon the sun's centre is at sunrise and sunset (the disc, and the air bending its light). */
export const HORIZON = -0.833;

/** The moon's cycle, in game days (Q-41, the owner's answer): two full moons a season. */
export const MOON = { cycleDays: 14 };

/**
 * @typedef {{ altitude: number, bearing: number }} SkyPlace  Degrees: `altitude` above the horizon (negative
 *   below it), `bearing` on the compass, 0 north, 90 east, clockwise, as `acrossView` takes it.
 * @typedef {'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous'
 *   | 'last-quarter' | 'waning-crescent'} MoonPhaseName
 * @typedef {SkyPlace & { phase: number, lit: number, name: MoonPhaseName }} MoonPlace  `phase` 0 at new
 *   moon, 0.5 at full, back to 1; `lit` the part of the disc lit, 0 to 1.
 */

/** @param {number} x */
const clamp1 = (x) => Math.max(-1, Math.min(1, x));
/** @param {number} deg  Wrapped to -180..180. */
const wrap180 = (deg) => ((((deg % 360) + 540) % 360) - 180);

/**
 * The day's year fraction, as `clock` works it out (the middle of the day),
 * and the hour.
 * @param {number} minutes
 * @param {typeof TIME} time
 */
function dayOf(minutes, time) {
  const dayIndex = Math.floor(minutes / DAY);
  const yearDays = 4 * time.seasonDays;
  const inYear = ((dayIndex % yearDays) + yearDays) % yearDays;
  return { yearFraction: (inYear + 0.5) / yearDays, hour: (minutes - dayIndex * DAY) / 60 };
}

/**
 * Height and bearing from a declination and an hour angle (degrees; the hour
 * angle is 0 due south and grows westward).
 * @param {number} declination
 * @param {number} hourAngle
 * @returns {SkyPlace}
 */
function placeOf(declination, hourAngle) {
  const lat = GDYNIA.latitude * RAD;
  const d = declination * RAD;
  const h = hourAngle * RAD;
  const altitude = Math.asin(clamp1(Math.sin(lat) * Math.sin(d) + Math.cos(lat) * Math.cos(d) * Math.cos(h))) / RAD;
  const fromSouth = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(lat) - Math.tan(d) * Math.cos(lat)) / RAD;
  return { altitude, bearing: (fromSouth + 540) % 360 };
}

/**
 * The sun's height over the year (its declination), on the same cosine `SUN`
 * follows: highest on the longest day.
 * @param {number} yearFraction
 */
function sunDeclination(yearFraction) {
  return TILT * Math.cos(2 * Math.PI * (yearFraction - 0.307));
}

/**
 * Degrees the sky has turned since the sun stood due south, by the clock:
 * noon is midway between `SUN`'s sunrise and sunset.
 * @param {number} hour
 * @param {{ rise: number, set: number }} sun
 */
function solarHour(hour, sun) {
  return wrap180(15 * (hour - (sun.rise + sun.set) / 2));
}

/**
 * Where the sun is at a game minute (D167), seen from Gdynia. Its centre
 * crosses `HORIZON` at exactly `SUN`'s sunrise and sunset: the hours of the day
 * and of the night are each stretched a little to fit them, since `SUN`'s
 * winter days run a little longer than the sky's at that latitude. Due south
 * midway between the two, at its true height for the day.
 * @param {number} minutes  Game minutes (time.js).
 * @param {typeof TIME} [time]
 * @returns {SkyPlace}
 */
export function sunPosition(minutes, time = TIME) {
  const { yearFraction, hour } = dayOf(minutes, time);
  const sun = sunAt(yearFraction);
  const declination = sunDeclination(yearFraction);
  const lat = GDYNIA.latitude * RAD;
  const d = declination * RAD;
  // The sky's hour angle at sunrise and sunset, then the clock's hours mapped onto it.
  const h0 = Math.acos(clamp1((Math.sin(HORIZON * RAD) - Math.sin(lat) * Math.sin(d)) / (Math.cos(lat) * Math.cos(d)))) / RAD;
  const halfDay = (sun.set - sun.rise) / 2;
  const t = solarHour(hour, sun) / 15; // hours from noon, -12..12
  const a = Math.abs(t);
  const angle = a <= halfDay ? (h0 * a) / halfDay : h0 + ((180 - h0) * (a - halfDay)) / (12 - halfDay);
  return placeOf(declination, Math.sign(t) * angle);
}

/**
 * The moon's phase at a game minute: 0 at new moon, 0.5 at full, counted from a
 * full moon (`state.fullMoonAt`) over a cycle of `MOON.cycleDays`.
 * @param {number} minutes
 * @param {number} fullMoonAt  A game minute the moon is full.
 */
export function moonPhase(minutes, fullMoonAt) {
  const x = (minutes - fullMoonAt) / (MOON.cycleDays * DAY) + 0.5;
  return x - Math.floor(x);
}

/** The eight names, each an eighth of the cycle centred on its moment. */
const PHASE_NAMES = /** @type {MoonPhaseName[]} */ (['new', 'waxing-crescent', 'first-quarter', 'waxing-gibbous', 'full', 'waning-gibbous', 'last-quarter', 'waning-crescent']);

/**
 * The name for a phase (0..1).
 * @param {number} phase
 * @returns {MoonPhaseName}
 */
export function moonPhaseName(phase) {
  return PHASE_NAMES[Math.floor(phase * 8 + 0.5) % 8];
}

/**
 * Where the moon is at a game minute, and how much of it is lit (D167). A
 * simple model: the moon goes round the sky the sun's way, `phase` of a turn
 * behind it (beside the sun at new moon, opposite it at full), so it rises
 * about 24/14 hours later each game day; and it keeps to the sun's path, so
 * its height is the sun's at the time of year it stands against: the full
 * moon rides high in winter and low in summer. The moon's own tilt and wobbles
 * are left out, and its hours aren't stretched as the sun's are.
 * @param {number} minutes
 * @param {number} fullMoonAt  A game minute the moon is full (`state.fullMoonAt`).
 * @param {typeof TIME} [time]
 * @returns {MoonPlace}
 */
export function moonPosition(minutes, fullMoonAt, time = TIME) {
  const phase = moonPhase(minutes, fullMoonAt);
  const { yearFraction, hour } = dayOf(minutes, time);
  const sun = sunAt(yearFraction);
  const behind = 360 * phase; // degrees east of the sun along its path
  const declination = TILT * Math.cos(2 * Math.PI * (yearFraction - 0.307) + behind * RAD);
  const place = placeOf(declination, wrap180(solarHour(hour, sun) - behind));
  return { ...place, phase, lit: (1 - Math.cos(2 * Math.PI * phase)) / 2, name: moonPhaseName(phase) };
}

/**
 * The sun for a game state.
 * @param {{ time: number }} state
 */
export function sunOf(state) {
  return sunPosition(state.time);
}

/**
 * The moon for a game state.
 * @param {{ time: number, fullMoonAt: number }} state
 */
export function moonOf(state) {
  return moonPosition(state.time, state.fullMoonAt);
}

/**
 * The first full moon of a game (D167): on the night of a rolled day (1d14),
 * the game's first day being day 1, so it drifts against the seasons' starts.
 * The moon is full at the midnight that ends that day.
 * @param {number} startMinutes  When the game starts (or, for an old save, now).
 * @param {ReturnType<import('../dice.js').diceFor>} dice
 * @returns {number}  A game minute.
 */
export function firstFullMoon(startMinutes, dice) {
  return (Math.floor(startMinutes / DAY) + dice.roll14()) * DAY;
}
