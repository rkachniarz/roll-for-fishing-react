// @ts-check
// Under the water, side on: the art sheet's tank (D131) and the title
// screen's background. Deep teal fading down in bands blended through
// dithered rows, sand at the bottom, and shafts of light slanting down from
// the surface, dithered so they stay hard pixels.

/** The dive's water, top to bottom (src/scene/views.js). */
export const DEEP_BANDS = ['#2f8f9f', '#28808f', '#22717f', '#1c626f', '#16535f', '#11444f'];
/** The light in a shaft. */
const SHAFT = '#3f9fab';
/** How far a shaft leans: pixels across per pixel down. */
const LEAN = 0.35;

/**
 * The still water: bands blended through dithered rows, and sand `sand`
 * pixels deep along the bottom, its top in a gentle wave.
 * @param {number} w
 * @param {number} h
 * @param {number} sand
 * @param {() => number} rand  Cosmetic only (D4).
 * @param {boolean} [floor]  The title's deep floor (`paintFloor`) instead of the tank's sand.
 */
export function paintWater(w, h, sand, rand, floor = false) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const band = (h - sand) / DEEP_BANDS.length;
  for (let y = 0; y < h; y++) {
    const i = Math.min(DEEP_BANDS.length - 1, Math.floor(y / band));
    const edge = y - i * band >= band - 1 && i < DEEP_BANDS.length - 1;
    for (let x = 0; x < w; x++) {
      ctx.fillStyle = DEEP_BANDS[edge && (x + y) % 2 ? i + 1 : i];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  if (floor) paintFloor(ctx, w, h, sand, rand);
  else paintSand(ctx, w, h, sand, rand);
  return canvas;
}

/**
 * The bottom: sand with darker grains, its top line lighter.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w @param {number} h @param {number} sand
 * @param {() => number} rand
 */
function paintSand(ctx, w, h, sand, rand) {
  for (let x = 0; x < w; x++) {
    const top = sandTop(x, h, sand);
    for (let y = top; y < h; y++) {
      ctx.fillStyle = y === top ? '#7a6a48' : rand() < 0.12 ? '#4f4430' : '#5f5238';
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

/** The lake bottom seen going away, far to near: hazed by the water, then its own colour. Base, grain. */
const FLOOR = [
  ['#384b43', '#2f4039'],
  ['#4c4e3e', '#3f4232'],
  ['#5f5238', '#4f4430'],
];

/**
 * The title's bottom: a floor going away from the eye, `sand` pixels deep,
 * in three bands blended through dithered rows (D134). The far band is hazed
 * towards the water, its grains few and fine; near ones have more, and the
 * nearest some two pixels wide. A light streak or two lies in the near sand.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w @param {number} h @param {number} sand
 * @param {() => number} rand
 */
export function paintFloor(ctx, w, h, sand, rand) {
  const top = h - sand;
  const band = sand / FLOOR.length;
  for (let x = 0; x < w; x++) {
    for (let y = sandTop(x, h, sand); y < h; y++) {
      const at = Math.max(0, y - top);
      const i = Math.min(FLOOR.length - 1, Math.floor(at / band));
      const edge = at - i * band >= band - 1 && i < FLOOR.length - 1;
      const k = edge && (x + y) % 2 ? i + 1 : i;
      ctx.fillStyle = FLOOR[k][rand() < 0.04 + k * 0.05 ? 1 : 0];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // Bigger grains in the nearest band, and light streaks of sand.
  for (let n = 0; n < w / 6; n++) {
    const x = Math.floor(rand() * w);
    const y = Math.floor(top + 2 * band + rand() * (band - 1));
    ctx.fillStyle = FLOOR[2][1];
    ctx.fillRect(x, y, 2, 1);
  }
  ctx.fillStyle = '#7a6a48';
  for (let n = 0; n < w / 40; n++) {
    const x = Math.floor(rand() * w);
    const y = Math.floor(top + band + rand() * (2 * band - 2));
    const len = 4 + Math.floor(rand() * 6);
    for (let d = 0; d < len; d += 2) ctx.fillRect(x + d, y, 1, 1);
  }
}

/**
 * Where the sand starts at column `x`.
 * @param {number} x @param {number} h @param {number} sand
 */
export function sandTop(x, h, sand) {
  return h - sand + Math.round(Math.sin(x / 11) * 1.5);
}

/**
 * One shaft of light, `len` pixels down: lit pixels on a checkerboard,
 * fewer the deeper, so it fades out towards the bottom. `parity` picks the
 * checkerboard's squares, so two frames of one shaft flicker between them.
 * @param {number} len
 * @param {number} wide
 * @param {() => number} rand
 * @param {0 | 1} parity
 * @param {number} [strength]  1 is the trial's; less is fainter.
 */
export function paintShaft(len, wide, rand, parity, strength = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = wide + Math.ceil(len * LEAN);
  canvas.height = len;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  ctx.fillStyle = SHAFT;
  for (let y = 0; y < len; y++) {
    const from = Math.floor(y * LEAN);
    for (let x = from; x < from + wide; x++) {
      if ((x + y) % 2 === parity && rand() < strength * (1 - y / len)) ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

/**
 * The tank on the art sheet: water, four shafts painted in, and sand.
 * @param {number} w
 * @param {number} h
 * @param {() => number} rand
 */
export function paintDeep(w, h, rand) {
  const canvas = paintWater(w, h, 9, rand);
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  for (let i = 0; i < 4; i++) {
    const x0 = 14 + i * 50 + Math.floor(rand() * 12);
    ctx.drawImage(paintShaft(h - 12, 7, rand, 0), x0, 0);
  }
  // The sand again, over the shafts' feet.
  paintSand(ctx, w, h, 9, rand);
  return canvas;
}
