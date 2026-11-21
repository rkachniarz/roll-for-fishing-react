// @ts-check
// How the wind's direction (D176) shows: only its share across the view moves
// things sideways on the screen. A wind from the left of the view blows to the
// right; one at the player's back or in their face hardly moves the clouds
// across at all, which is how such a wind looks. Nothing moves in depth: the
// cloud sprites are drawn per depth band and never scaled (R7.3).

/**
 * The wind's direction as the scene is given it, beside the weather's own fields.
 * @typedef {{ windFrom?: number | null, windKind?: 'steady' | 'unsettled' | 'variable' }} WindLook
 *   `windFrom`: the bearing it blows from, null for no set direction; left out (the art sheet's old
 *   trials), the wind blows from the left of the view, as the scene was first drawn.
 */

/** How far a variable wind swings either way, as a share of a full cross wind (Claude's pick, docs/REVIEW.md). */
const VARIABLE_SWING = 0.5;
/** A variable wind's slow swing from one side to the other, in ms a radian. */
const VARIABLE_MS = 40000;
/** How much an unsettled wind's gusts speed it up and slow it down (Claude's pick, docs/REVIEW.md). */
const GUSTS = 0.4;

/**
 * The wind's share across the view, from -1 (blowing right to left) to 1 (left
 * to right), times its gusts.
 * @param {WindLook} weather
 * @param {number | null | undefined} facing  The spot's compass facing; without one, north.
 * @param {number} now  Milliseconds, for the gusts and a variable wind's swing.
 */
export function windAcross(weather, facing, now) {
  if (weather.windFrom === undefined) return 1;
  if (weather.windFrom === null) return VARIABLE_SWING * Math.sin(now / VARIABLE_MS);
  const across = Math.sin(((weather.windFrom + 180 - (facing ?? 0)) * Math.PI) / 180);
  const gust = weather.windKind === 'unsettled' ? 1 + GUSTS * Math.sin(now / 1700) * Math.sin(now / 4100) : 1;
  return across * gust;
}
