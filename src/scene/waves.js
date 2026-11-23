// @ts-check
// How the wind works the water (D177): the open water's ripples and the still
// water's broken mirror, by the wind's strength (the weather's 0 to 5) and its
// direction (`windFlow`, src/scene/wind.js). The swamp is left alone: its water
// is sheltered under the trees. Every number here is Claude's pick, tuned by
// eye: Moderate looks as the water did before D177, Extreme shows every mark
// (lower its row if it reads too rough). A lake's waves never get big, but none
// against a strong wind should read as two different days.

/**
 * Per wind level, 0 (none) to 5 (extreme); a level between two is mixed from both.
 * `share`: how many of the open water's ripple marks show; `length`: how long they are against
 * the moderate wind's; `trough`: how far below the horizon, in pixels, a ripple first has a dark
 * trough under it; `foam`: the share of near ripples with a white top; `drift`: how fast the
 * ripples near the viewer move across, in pixels a second; `roll`: how fast they come in or go
 * out, as a share of the water's depth a second; `mirror`: how far the still water's rows are
 * pushed sideways, [far, near], in pixels.
 */
export const WAVE_LEVELS = {
  share: [0.12, 0.3, 0.5, 0.68, 0.85, 1],
  length: [0.5, 0.8, 1, 1.2, 1.45, 1.7],
  trough: [999, 60, 40, 28, 18, 10],
  foam: [0, 0, 0, 0.05, 0.15, 0.3],
  drift: [0, 1.5, 3, 4.5, 6, 8],
  roll: [0, 0.004, 0.008, 0.012, 0.016, 0.02],
  mirror: [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
    [2, 2],
    [2, 3],
  ],
};

/**
 * A table's value at a wind level, mixed between the two whole levels either side.
 * @param {number[]} table @param {number} wind
 */
export function waveLevel(table, wind) {
  const w = Math.min(Math.max(wind, 0), table.length - 1);
  const i = Math.floor(w);
  const j = Math.min(i + 1, table.length - 1);
  return table[i] + (table[j] - table[i]) * (w - i);
}

/**
 * How strong the wind is on the water at a depth: a wind at the player's back,
 * blowing out from the bank, has had no water to build waves on yet near the
 * bank, so they grow towards the horizon; a wind in the player's face brings
 * them in full.
 * @param {number} wind  The weather's level.
 * @param {number} along  `windFlow`'s along share: 1 blowing away from the player.
 * @param {number} near  0 at the horizon, 1 at the bottom of the view.
 */
export function windOnWater(wind, along, near) {
  return wind * (1 - Math.max(0, along) * 0.7 * near);
}

/**
 * A small seeded generator for looks only, so a painting can have more of
 * something without drawing more from the scenery stream it was given (which
 * would move everything painted after it).
 * @param {number} seed
 */
export function looksRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
