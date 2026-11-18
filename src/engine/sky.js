// @ts-check
// Which way the player looks, and what of the sky the picture shows (12.1,
// D166). Each spot that shows sky has a compass facing (`look.facing`,
// degrees: 0 north, 90 east, clockwise), and every spot sees the same width
// of view, so a bearing (the sun's, the moon's) falls at the same place across
// the picture wherever the player stands. The sun and moon themselves are
// 12.2's; drawing them is 12.4's.

import { content } from '../generated/content.js';

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
