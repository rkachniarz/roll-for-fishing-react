// @ts-check
// The light over the course of a day (docs/spec.md, R7.5), as numbers: kept
// apart from sky.js so the tests can check them without PixiJS.

// The sun moves with the seasons (D85, src/engine/time.js): it lightens from
// an hour before sunrise to an hour after, and darkens from an hour before
// sunset to two hours after.

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
