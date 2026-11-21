// @ts-check
// The light over the course of a day (docs/spec.md, R7.5), as numbers: kept
// apart from sky.js so the tests can check them without PixiJS.

// The sun moves with the seasons (D85, src/engine/time.js): it lightens from
// an hour before sunrise to an hour after, and darkens from an hour before
// sunset to two hours after.

import { moonPosition, sunPosition } from '../engine/sky.js';

/** @typedef {{ rise: number, set: number }} Sun  Sunrise and sunset, in hours. */

/** How dark the night is. */
export const NIGHT = 0.55;

/**
 * How dark it is at this hour, 0 to NIGHT.
 * @param {number} h  Hours since midnight, with fractions.
 * @param {Sun} sun
 */
export function darkness(h, sun) {
  if (h < sun.rise - 1) return NIGHT;
  if (h < sun.rise + 1) return NIGHT * (1 - (h - (sun.rise - 1)) / 2);
  if (h < sun.set - 1) return 0;
  if (h < sun.set + 2) return NIGHT * ((h - (sun.set - 1)) / 3);
  return NIGHT;
}

/**
 * The warm light of dawn and dusk, 0 to 0.2, at its strongest at sunrise and sunset.
 * @param {number} h
 * @param {Sun} sun
 */
export function warmth(h, sun) {
  const peak = (/** @type {number} */ at) => Math.max(0, 1 - Math.abs(h - at) / 1.5);
  return 0.2 * Math.max(peak(sun.rise), peak(sun.set));
}

// ---------- The blood moon (D174) ----------

/**
 * Whether a world shows a blood moon (D174): a weather with `sky: 'blood'`
 * (only the art sheet sets it) and a full moon. Any other phase is a moon
 * like any other.
 * @param {{ time?: number, fullMoonAt?: number, weather: { sky?: string } }} world
 */
export function isBloodMoon(world) {
  if (world.weather.sky !== 'blood' || typeof world.time !== 'number' || typeof world.fullMoonAt !== 'number') return false;
  return moonPosition(world.time, world.fullMoonAt).name === 'full';
}

/**
 * How strong the blood moon's red tint over the whole scene is, 0 to 1: none
 * by day, in as the sun goes down (from 2° under the horizon to 10° under),
 * and only while the moon is up (from 2° under it to 4° over).
 * @param {{ time?: number, fullMoonAt?: number, weather: { sky?: string } }} world
 */
export function bloodLight(world) {
  if (!isBloodMoon(world)) return 0;
  const time = /** @type {number} */ (world.time);
  const moon = moonPosition(time, /** @type {number} */ (world.fullMoonAt));
  const sun = sunPosition(time);
  const clamp01 = (/** @type {number} */ v) => Math.max(0, Math.min(1, v));
  return clamp01((-sun.altitude - 2) / 8) * clamp01((moon.altitude + 2) / 6);
}
