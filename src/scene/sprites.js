// @ts-check
// Placeholder pixel art, written as code (docs/decisions.md, D9). Each sprite
// is a grid of palette keys, one character per pixel, '.' for transparent.
// Larger things (water, sand, reeds) are drawn by small functions instead.
// Everything here becomes a texture once, at load; nothing is scaled at
// runtime, because scaling ruins pixel art (docs/spec.md, R7.3).

/** One colour per key. Kept small on purpose: a tight palette reads as pixel art. */
export const PALETTE = {
  waterFar: '#b4e6f2',
  waterMid: '#9fdbec',
  waterNear: '#8bd0e6',
  waveFar: '#6cbfe4',
  wave: '#3d9fd8',
  ripple: '#3f4fc4',
  foam: '#ffffff',
  spray: '#d8f3fb',
  sand: '#efe3b0',
  sandShade: '#e0cd8a',
  shore: '#3d9fd8',
  reedDark: '#1d7f37',
  reed: '#2fa84a',
  reedLight: '#5cc463',
  line: '#f4f4f4',
  shadow: '#2c5f80',
  eerie: '#8a4fd0',
};

/** @type {Record<string, string>} */
const KEYS = {
  r: '#d9343f', // feather
  R: '#ff8f8f', // feather highlight
  b: '#8a4f2c', // float rim
  Y: '#ecd9a0', // float body
  w: PALETTE.foam,
  l: PALETTE.spray,
  '#': PALETTE.wave,
  f: PALETTE.waveFar,
};

// The bobber from the sketch: a red feather on a tan float. Two sizes, one per
// depth band - a cast that lands further out uses the small one.
export const BOBBER = [
  '.....r...',
  '....rR...',
  '....rR...',
  '...rRr...',
  '...rRr...',
  '...rRr...',
  '....rr...',
  '....r....',
  '....r....',
  'bbbbbbbbb',
  '.bYYYYYb.',
  '.bYYYYYb.',
  '..bYYYb..',
  '...bbb...',
];
export const BOBBER_FAR = [
  '....r..',
  '...rR..',
  '..rRr..',
  '..rRr..',
  '...rr..',
  '...r...',
  '...r...',
  'bbbbbbb',
  '.bYYYb.',
  '.bYYYb.',
  '..bbb..',
];
// Pulled under by a bite: only the feather shows above the water.
export const BOBBER_DIPPED = BOBBER.slice(0, 9);
export const BOBBER_FAR_DIPPED = BOBBER_FAR.slice(0, 6);
/** Rows from the sprite's top to where the float meets the water. */
export const WATERLINE = { near: 11, far: 8 };

// The splash when a fish bites: three frames, up and falling back.
export const SPLASH = [
  ['...............', '...............', '......w.w......', '....l.wlw.l....', '...w.l...l.w...'],
  ['......w.w......', '...w..l.l..w...', '..l.w.....w.l..', '.w.l.......l.w.', 'w..l.......l..w'],
  ['...............', '..w.........w..', '.l..l.....l..l.', 'l....l...l....l', '...............'],
];

// Wave strokes, as in the sketch's little blue squiggles. Smaller and paler
// further out: that, and how many there are, is the perspective (R7.4).
export const WAVES = {
  far: [
    ['.ff..', 'f..ff'],
    ['..ff.', 'ff..f'],
  ],
  mid: [
    ['..###...', '##...###'],
    ['...###..', '###...##'],
  ],
  near: [
    ['....####....', '..##....##..', '##........##'],
    ['.....####...', '...##....##.', '.##........#'],
  ],
};

/**
 * A bobber's colours in place of the sketch's (D83): an equipped bobber item's
 * `bobber` field. Any it leaves out stay as they are.
 * @typedef {{ feather?: string, featherLight?: string, rim?: string, float?: string }} BobberLook
 */

/**
 * The palette keys for a bobber with this look.
 * @param {BobberLook | null} look
 * @returns {Record<string, string>}
 */
export function bobberKeys(look) {
  if (!look) return KEYS;
  return {
    ...KEYS,
    ...(look.feather ? { r: look.feather } : {}),
    ...(look.featherLight ? { R: look.featherLight } : {}),
    ...(look.rim ? { b: look.rim } : {}),
    ...(look.float ? { Y: look.float } : {}),
  };
}

/**
 * A canvas with the grid painted on it, one pixel per character.
 * @param {string[]} rows
 * @param {Record<string, string>} [keys]  The palette, if not the usual one.
 */
export function paintGrid(rows, keys = KEYS) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(...rows.map((r) => r.length));
  canvas.height = rows.length;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  rows.forEach((row, y) => {
    [...row].forEach((key, x) => {
      if (key === '.') return;
      ctx.fillStyle = keys[key];
      ctx.fillRect(x, y, 1, 1);
    });
  });
  return canvas;
}

/**
 * A flattened ring, for ripples: an ellipse one pixel thick, so it lies on the
 * water in perspective rather than standing up like a circle.
 * @param {number} rx  Horizontal radius in pixels.
 * @param {number} ry  Vertical radius in pixels.
 * @param {string} color
 */
export function paintRing(rx, ry, color) {
  const canvas = document.createElement('canvas');
  canvas.width = rx * 2 + 1;
  canvas.height = ry * 2 + 1;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  ctx.fillStyle = color;
  // Plot by angle, finely enough that neighbouring points always touch.
  const steps = Math.max(16, Math.ceil(Math.PI * 2 * Math.max(rx, ry) * 2));
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ctx.fillRect(Math.round(rx + Math.cos(a) * rx), Math.round(ry + Math.sin(a) * ry), 1, 1);
  }
  return canvas;
}

/**
 * The still part of the view: water in bands that pale towards the far side,
 * the sandy shore along the bottom with its wavy edge. The view from the shore
 * in docs/design/sketch-fishing-spot.png.
 * @param {number} size  The scene's side, in pixels.
 * @param {() => number} rand  Uniform [0, 1), for the sand's texture.
 */
export function paintBackdrop(size, rand) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

  const bands = [PALETTE.waterFar, PALETTE.waterMid, PALETTE.waterNear];
  bands.forEach((color, i) => {
    const top = Math.floor((i * size) / 3.4);
    ctx.fillStyle = color;
    ctx.fillRect(0, top, size, size);
    // Dither the edge into the band above, so the bands blend instead of
    // reading as horizon lines: a checkerboard, then every fourth pixel.
    if (i === 0) return;
    for (let x = 0; x < size; x++) {
      if ((x + top) % 2 === 0) ctx.fillRect(x, top - 1, 1, 1);
      if ((x + top) % 4 === 0) ctx.fillRect(x, top - 3, 1, 1);
    }
  });

  for (let x = 0; x < size; x++) {
    const top = shoreY(x, size);
    ctx.fillStyle = PALETTE.shore;
    ctx.fillRect(x, top - 1, 1, 2);
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(x, top + 1, 1, size - top);
  }
  // Short streaks in the sand, as in the sketch.
  ctx.fillStyle = PALETTE.sandShade;
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rand() * size);
    const y = shoreY(x, size) + 4 + Math.floor(rand() * (size - shoreY(x, size) - 6));
    ctx.fillRect(x, y, 2 + Math.floor(rand() * 5), 1);
  }
  return canvas;
}

/**
 * Where the water meets the sand, at column x: a gently wavy line near the
 * bottom of the view.
 * @param {number} x
 * @param {number} size
 */
export function shoreY(x, size) {
  return Math.round(size * 0.86 + 3 * Math.sin(x / 15) + 2 * Math.sin(x / 5.5 + 1));
}

/**
 * Reeds for one side of the view, as two frames of a sway.
 * @param {number} width
 * @param {number} height
 * @param {'left' | 'right'} side  Which edge they grow from: they lean inward.
 * @param {() => number} rand
 * @param {number} [count]  How many blades.
 */
export function paintReeds(width, height, side, rand, count = 9) {
  const blades = Array.from({ length: count }, () => ({
    x: Math.floor(rand() * (width - 4)) + 2,
    h: Math.floor(height * (0.45 + rand() * 0.55)),
    lean: (side === 'left' ? 1 : -1) * (0.05 + rand() * 0.2),
    color: [PALETTE.reedDark, PALETTE.reed, PALETTE.reedLight][Math.floor(rand() * 3)],
  }));
  return [0, 1].map((frame) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    for (const blade of blades) {
      ctx.fillStyle = blade.color;
      for (let i = 0; i < blade.h; i++) {
        // The top third sways a pixel between frames; the base stays put.
        const sway = frame === 1 && i > (blade.h * 2) / 3 ? Math.sign(blade.lean) : 0;
        const x = Math.round(blade.x + blade.lean * i) + sway;
        ctx.fillRect(x, height - 1 - i, 1, 1);
      }
    }
    return canvas;
  });
}
