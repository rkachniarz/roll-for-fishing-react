// @ts-check
// The light over the course of a day (docs/spec.md, R7.5), as numbers: kept
// apart from sky.js so the tests can check them without PixiJS.

/**
 * How dark the night is at this hour, 0 to 0.55.
 * @param {number} h  Hours since midnight, with fractions.
 */
export function darkness(h) {
  if (h >= 21 || h < 5) return 0.55;
  if (h < 7) return 0.55 * (1 - (h - 5) / 2);
  if (h < 18) return 0;
  return 0.55 * ((h - 18) / 3);
}

/**
 * The warm light of dawn and dusk, 0 to 0.2, at its strongest at 06:00 and 19:00.
 * @param {number} h
 */
export function warmth(h) {
  const peak = (/** @type {number} */ at) => Math.max(0, 1 - Math.abs(h - at) / 1.5);
  return 0.2 * Math.max(peak(6), peak(19));
}
