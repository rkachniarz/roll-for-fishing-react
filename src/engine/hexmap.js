// @ts-check
// The weather's hex map layout (PORTING-NOTES §1.1), on its own so that
// tools/content.mjs can check the maps without loading the generated content
// it is about to write.

/** Directions, in changeSet order. */
export const DIRECTIONS = ['n', 'ne', 'se', 's', 'sw', 'nw'];

/** The direction opposite each one, by index. */
export const OPPOSITE = [3, 4, 5, 0, 1, 2];

/**
 * The hex map's layout: each cell's neighbours, wrapping round the map's edge.
 * A season's changeSet matches this everywhere except where an edge line holds
 * the weather (checked by tools/content.mjs).
 */
export const HEX_NEIGHBOURS = [
  [1, 2, 3, 4, 5, 6],
  [8, 9, 2, 0, 6, 7],
  [9, 10, 11, 3, 0, 1],
  [2, 11, 12, 13, 4, 0],
  [0, 3, 13, 14, 15, 5],
  [6, 0, 4, 15, 16, 17],
  [7, 1, 0, 5, 17, 18],
  [15, 8, 1, 6, 18, 11],
  [14, 18, 9, 1, 7, 10],
  [13, 17, 10, 2, 1, 8],
  [12, 16, 8, 11, 2, 9],
  [10, 15, 7, 12, 3, 2],
  [11, 14, 18, 10, 13, 3],
  [3, 12, 17, 9, 14, 4],
  [4, 13, 16, 8, 12, 15],
  [5, 4, 14, 7, 11, 16],
  [17, 5, 15, 18, 10, 14],
  [18, 6, 5, 16, 9, 13],
  [16, 7, 6, 17, 8, 12],
];
