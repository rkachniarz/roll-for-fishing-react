// @ts-check
// A trial, for the art sheet only: a whole scene painted from a photo
// (docs/design/photo-autumn-pond.jpg) instead of from a sketch, to see how
// that way of working turns out. Not part of the game: the engine's open
// water (WATER) assumes the game's own view, and nothing here changes it.
//
// Eye level, as in the photo: overcast sky, a wooded hill, a bed of reeds,
// then dark still water with the hill mirrored in it, floating leaves, a
// fallen log and a tangle of sticks. A birch leans in on the left and a
// beech spray hangs in from the top right. Drawn 320 wide, the play area's
// 256 in the middle (D93). The sky is squeezed compared with the photo, so the
// water gets more of the height.
//
// Moves in whole pixels and a few frames (docs/art.md): the reflection wobbles,
// glints flick on the water, rings spread now and then (often, in rain), and
// gusts roll across the reeds, the birch's twigs and the beech leaves. Every
// scattered thing is placed by the `rand` it's given (the scenery stream, D4).

import { Application, Container, Sprite, Texture, TextureStyle } from 'pixi.js';
import { createSky } from './sky.js';
import { BOBBER, WATERLINE, paintGrid, paintRing } from './sprites.js';

/** The painting's size: the play area's 256 plus a strip either side (D93). */
const W = 320;
const H = 256;
/** Where the reeds stand in the water: everything below is water. */
const WL = 122;
/** Reed bed sections, each swaying on its own as a gust passes. */
const SECTION = 40;
const REED_H = 34;
/** Where the bobber sits, waiting (scene pixels). */
const BOBBER_AT = { x: 150, y: 172 };

/** Every colour the pond uses, by name (docs/art.md: a small, named palette). */
export const POND = {
  skyTop: '#bcc3c8',
  sky: '#cdd2d5',
  skyLow: '#dadfe1',
  pineDark: '#2c3a2a',
  pine: '#3e5034',
  forest: '#55653b',
  olive: '#6f7236',
  bush: '#8e8a3c',
  bushLight: '#aaa34a',
  gold: '#c9a83e',
  ochre: '#b78a33',
  rust: '#94552a',
  hillBirch: '#d8d4c4',
  reedBrown: '#6b5638',
  reedTan: '#97814f',
  reedDry: '#b49d68',
  reedGreen: '#5a6b36',
  reedGreenLight: '#7d8c42',
  cattail: '#45301f',
  waterDeep: '#262c30',
  waterDark: '#343b40',
  waterMid: '#454d53',
  waterLight: '#5b646a',
  waterPale: '#788187',
  glint: '#98a0a5',
  reflectDark: '#2b2f22',
  reflectOlive: '#3c4229',
  reflectLight: '#545a33',
  reflectGold: '#6e6a35',
  reflectLog: '#1f2427',
  leafOrange: '#c8772a',
  leafGold: '#d8b23a',
  leafBrown: '#7a4a22',
  leafPale: '#c9a66b',
  leafGreen: '#8c9a3c',
  leafLime: '#a8ae3e',
  leafShade: '#6b6a2a',
  barkWhite: '#d6d3c8',
  barkLight: '#b9b6ac',
  barkGrey: '#8e8b83',
  barkDark: '#4f4d48',
  barkBlack: '#2b2a27',
  moss: '#4c5530',
  logLight: '#9c988e',
  log: '#77746c',
  logDark: '#3d3b37',
  twig: '#4a443d',
  twigFine: '#6f6a62',
};

/** @param {number} w @param {number} h */
function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}
/** @param {HTMLCanvasElement} canvas */
const ctxOf = (canvas) => /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { willReadFrequently: true }));

/** @param {CanvasRenderingContext2D} g @param {number} x @param {number} y @param {string} color */
function dot(g, x, y, color) {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), 1, 1);
}

/** A one-pixel line, stepped (Bresenham). @param {CanvasRenderingContext2D} g @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1 @param {string} color */
function line(g, x0, y0, x1, y1, color) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  g.fillStyle = color;
  for (;;) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) return;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/** @param {() => number} rand @param {T[]} list @template T */
const pick = (rand, list) => list[Math.floor(rand() * list.length)];

// ---------- The land: sky, wooded hill, bushes ----------

/** The top of the far trees at column x: low on the left, a hill right of middle. */
const hill = (/** @type {number} */ x) => 66 - 22 * Math.exp(-(((x - 200) / 75) ** 2)) - 5 * Math.exp(-(((x - 300) / 30) ** 2)) + 2 * Math.sin(x / 9);

/** @param {() => number} rand */
function paintLand(rand) {
  const canvas = makeCanvas(W, WL);
  const g = ctxOf(canvas);

  // Overcast sky in three bands, dithered into each other, lightest at the horizon.
  /** @type {[number, string][]} */
  const bands = [
    [0, POND.skyTop],
    [22, POND.sky],
    [44, POND.skyLow],
  ];
  bands.forEach(([top, color], i) => {
    g.fillStyle = color;
    g.fillRect(0, top, W, WL - top);
    if (i === 0) return;
    for (let x = 0; x < W; x++) {
      if ((x + top) % 2 === 0) g.fillRect(x, top - 1, 1, 1);
      if ((x + top) % 4 === 0) g.fillRect(x, top - 3, 1, 1);
    }
  });
  // Long thin streaks of darker cloud, their ends broken up.
  for (let i = 0; i < 16; i++) {
    const y = 3 + Math.floor(rand() * 46);
    const x = Math.floor(rand() * W);
    const len = 10 + Math.floor(rand() * 40);
    const color = y < 22 ? POND.skyTop : y < 44 ? POND.skyTop : POND.sky;
    for (let n = 0; n < len; n++) {
      const edge = n < 4 || n > len - 5;
      if (!edge || n % 2 === 0) dot(g, x + n, y, color);
    }
  }

  // The wooded hill: a dark base, pines along the top, broadleaves in autumn
  // colours lower down, a few pale birch trunks showing through.
  for (let x = 0; x < W; x++) {
    for (let y = Math.round(hill(x)) + 4; y < WL; y++) dot(g, x, y, rand() < 0.25 ? POND.forest : POND.pineDark);
  }
  for (let x = -3; x < W + 3; x += 1 + Math.floor(rand() * 3)) {
    if (rand() < 0.55) {
      const top = Math.round(hill(x)) - Math.floor(rand() * 7);
      const tall = 8 + Math.floor(rand() * 8);
      for (let r = 0; r < tall; r++) {
        const half = Math.min(3, Math.floor(r / 2.2));
        for (let dx = -half; dx <= half; dx++) dot(g, x + dx, top + r, dx === half && r % 2 ? POND.pine : rand() < 0.15 ? POND.pine : POND.pineDark);
      }
    }
  }
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(rand() * W);
    const top = Math.round(hill(x)) + 2 + Math.floor(rand() * 26);
    const radius = 2 + Math.floor(rand() * 3);
    const color = pick(rand, [POND.olive, POND.gold, POND.ochre, POND.forest, POND.olive, POND.gold, POND.rust]);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius + 1) continue;
        dot(g, x + dx, top + dy, rand() < 0.15 ? POND.pine : color);
      }
    }
  }
  for (let i = 0; i < 5; i++) {
    const x = 186 + Math.floor(rand() * 60);
    const top = Math.round(hill(x)) + 10;
    line(g, x, top, x, top + 10 + Math.floor(rand() * 12), POND.hillBirch);
  }

  // Bushes in front of the hill: a low bank on the left, scrub in the middle,
  // a big rounded mound on the right.
  /**
   * @param {number} x0 @param {number} x1
   * @param {(x: number) => number} topAt
   * @param {string[]} colours  Base first, then the speckles.
   */
  const bushes = (x0, x1, topAt, colours) => {
    for (let x = x0; x < x1; x++) {
      const top = Math.round(topAt(x));
      for (let y = top; y < WL; y++) {
        const r = rand();
        const color = r < 0.55 ? colours[0] : colours[1 + Math.floor((r - 0.55) / (0.45 / (colours.length - 1)))];
        g.fillStyle = color;
        g.fillRect(x, y, r < 0.8 ? 1 : 2, 1);
      }
    }
    // Rounded clumps along the top, so the edge reads as leaves, not a line.
    for (let x = x0 + 2; x < x1 - 2; x += 3 + Math.floor(rand() * 4)) {
      const radius = 2 + Math.floor(rand() * 3);
      const cy = Math.round(topAt(x)) + radius - 1;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > radius * radius) continue;
          dot(g, x + dx, cy + dy, rand() < 0.6 ? colours[0] : pick(rand, colours));
        }
      }
    }
  };
  bushes(0, 100, (x) => 84 + 5 * Math.sin(x / 11) + (x > 60 ? (x - 60) * 0.3 : 0), [POND.olive, POND.bush, POND.forest, POND.gold]);
  bushes(80, 190, (x) => 98 + 4 * Math.sin(x / 7), [POND.bush, POND.bushLight, POND.gold, POND.olive]);
  bushes(168, W, (x) => (x >= 255 ? 74 : 74 + (255 - x) * 0.3) + 3 * Math.sin(x / 8), [POND.bush, POND.bushLight, POND.olive, POND.gold]);
  return canvas;
}

// ---------- Reeds ----------

/**
 * @typedef {{ x: number, base: number, h: number, lean: number, curve: number, color: string, cattail: boolean }} Blade
 */

/** @param {() => number} rand @returns {Blade[]} */
function growReeds(rand) {
  /** @type {Blade[]} */
  const blades = [];
  for (let x = 52; x < W + 2; x++) {
    // Sparse where the bed starts on the left, thick from there on.
    const density = x < 66 ? 0.6 : x < 90 ? 1.6 : 3;
    const count = Math.floor(density) + (rand() < density % 1 ? 1 : 0);
    for (let n = 0; n < count; n++) {
      const green = rand() < 0.3;
      const tall = 12 + 6 * Math.sin(x / 23) + 3 * Math.sin(x / 7.3) + 2 * Math.sin(x / 3.1) + (x < 90 ? -4 : 0);
      blades.push({
        x,
        base: WL - Math.floor(rand() * 3),
        h: Math.max(5, Math.round(tall + rand() * 10 - 3)),
        lean: (rand() - 0.5) * 0.16,
        curve: green && rand() < 0.4 ? (rand() < 0.5 ? -1 : 1) * (0.6 + rand() * 1.2) : 0,
        color: green ? pick(rand, [POND.reedGreen, POND.reedGreenLight]) : pick(rand, [POND.reedBrown, POND.reedTan, POND.reedTan, POND.reedDry]),
        cattail: !green && rand() < 0.15,
      });
    }
  }
  return blades;
}

/**
 * The reed bed in sections, each in three frames: still, and leaning one
 * and two pixels at the tips with the wind.
 * @param {Blade[]} blades
 * @returns {HTMLCanvasElement[][]}  [section][frame]
 */
function paintReeds(blades) {
  const sections = Math.ceil(W / SECTION);
  return Array.from({ length: sections }, (_, s) =>
    [0, 1, 2].map((frame) => {
      const canvas = makeCanvas(SECTION + 6, REED_H);
      const g = ctxOf(canvas);
      for (const b of blades) {
        if (Math.floor(b.x / SECTION) !== s) continue;
        const left = b.x - s * SECTION + 2;
        for (let i = 0; i < b.h; i++) {
          const t = i / b.h;
          const sway = t > 0.5 ? Math.round((frame * (t - 0.5)) / 0.5) : 0;
          const x = left + Math.round(b.lean * i + (b.curve * i * i) / (b.h * b.h)) + sway;
          // Darker low down, where the bed shades itself.
          const color = i < 2 ? POND.cattail : t < 0.35 ? (b.color === POND.reedGreenLight ? POND.reedGreen : POND.reedBrown) : b.color;
          dot(g, x, REED_H - (WL - b.base) - 1 - i, color);
        }
        if (b.cattail) {
          // A dark brown head below the tip, the spike above it.
          const top = b.h - 1;
          const sway = frame;
          const x = left + Math.round(b.lean * top) + sway;
          for (let i = top - 5; i < top - 1; i++) dot(g, x, REED_H - (WL - b.base) - 1 - i, POND.cattail);
          dot(g, x + 1, REED_H - (WL - b.base) - 1 - (top - 3), POND.cattail);
        }
      }
      return canvas;
    }),
  );
}

// ---------- The water ----------

/** 4×4 ordered dither, so the reflection's shades blend in a pixel pattern. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
/** @param {string} hex */
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const GREYS = [POND.waterDeep, POND.waterDark, POND.waterMid, POND.waterLight, POND.waterPale, POND.glint].map(rgb);
const OLIVES = [POND.reflectDark, POND.reflectOlive, POND.reflectLight, POND.reflectGold].map(rgb);

/**
 * The things lying on the water that cast a reflection: logs and sticks,
 * as filled spans (x, from y, to y), drawn above the water and mirrored in it.
 * @typedef {{ x: number, y: number, len: number }} Span
 */

/**
 * Three frames of the water: the land mirrored, darker towards the viewer,
 * its rows nudged sideways a pixel or two differently in each frame.
 * @param {HTMLCanvasElement} above  The land and reeds, to mirror.
 * @param {{ x: number, y: number, color: string, w: number }[]} leaves
 * @param {{ x: number, y: number }[]} mirrored  Pixels of logs and sticks, mirrored about where they touch the water.
 * @param {() => number} rand
 */
function paintWater(above, leaves, mirrored, rand) {
  const src = ctxOf(above).getImageData(0, 0, W, WL).data;
  const rows = H - WL;
  return [0, 1, 2].map(() => {
    // Shifts in pairs of rows, bigger nearer the viewer.
    const shifts = Array.from({ length: Math.ceil(rows / 2) }, (_, i) => {
      const reach = i * 2 < 30 ? 1 : 2;
      return Math.floor(rand() * (reach * 2 + 1)) - reach;
    });
    const canvas = makeCanvas(W, rows);
    const g = ctxOf(canvas);
    const img = g.createImageData(W, rows);
    for (let d = 0; d < rows; d++) {
      const sy = Math.max(0, WL - 1 - d);
      const k = 0.5 - d * 0.0016;
      for (let x = 0; x < W; x++) {
        const sx = Math.min(W - 1, Math.max(0, x + shifts[d >> 1]));
        const at = (sy * W + sx) * 4;
        const [r, gr, b] = [src[at], src[at + 1], src[at + 2]];
        const lum = ((0.3 * r + 0.59 * gr + 0.11 * b) / 255) * k + (BAYER[d % 4][x % 4] / 16 - 0.5) * 0.06;
        const green = gr > b + 30;
        const shade = green
          ? OLIVES[lum < 0.17 ? 0 : lum < 0.23 ? 1 : lum < 0.29 ? 2 : 3]
          : GREYS[lum < 0.17 ? 0 : lum < 0.24 ? 1 : lum < 0.31 ? 2 : lum < 0.38 ? 3 : lum < 0.46 ? 4 : 5];
        const o = (d * W + x) * 4;
        img.data[o] = shade[0];
        img.data[o + 1] = shade[1];
        img.data[o + 2] = shade[2];
        img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    for (const p of mirrored) {
      const d = p.y - WL;
      if (d >= 0 && d < rows) dot(g, p.x + shifts[d >> 1], d, POND.reflectLog);
    }
    for (const leaf of leaves) {
      g.fillStyle = leaf.color;
      g.fillRect(leaf.x, leaf.y - WL, leaf.w, 1);
    }
    return canvas;
  });
}

/** Leaves floating on the water: more, and bigger, nearer the viewer. @param {() => number} rand */
function scatterLeaves(rand) {
  /** @type {{ x: number, y: number, color: string, w: number }[]} */
  const leaves = [];
  for (let i = 0; i < 190; i++) {
    const d = Math.floor((H - WL) * Math.sqrt(rand()));
    leaves.push({
      x: Math.floor(rand() * W),
      y: WL + 3 + d,
      color: pick(rand, [POND.leafOrange, POND.leafGold, POND.leafBrown, POND.leafPale, POND.leafOrange]),
      w: d < 30 ? 1 : d < 80 ? 1 + Math.floor(rand() * 2) : 2 + Math.floor(rand() * 2),
    });
  }
  return leaves;
}

// ---------- Logs and sticks in the water ----------

/**
 * The fallen logs, the tangle of sticks and a stick out in the water, drawn
 * above the water; returns the pixels to mirror in it as well.
 * @param {() => number} rand
 */
function paintDebris(rand) {
  const canvas = makeCanvas(W, H);
  const g = ctxOf(canvas);
  /** @type {{ x: number, y: number }[]} */
  const mirrored = [];

  /**
   * A log along a path, thickest at the start: lit on top, dark underneath.
   * @param {[number, number][]} path @param {number} thick0 @param {number} thick1 @param {boolean} mossy
   */
  const log = (path, thick0, thick1, mossy) => {
    let total = 0;
    for (let i = 1; i < path.length; i++) total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    let run = 0;
    for (let i = 1; i < path.length; i++) {
      const [x0, y0] = path[i - 1];
      const [x1, y1] = path[i];
      const len = Math.hypot(x1 - x0, y1 - y0);
      for (let s = 0; s <= len; s += 0.5) {
        const t = s / len;
        const x = Math.round(x0 + (x1 - x0) * t);
        const y = Math.round(y0 + (y1 - y0) * t);
        const thick = Math.round(thick0 + (thick1 - thick0) * ((run + s) / total));
        for (let r = 0; r < thick; r++) {
          const color = r === 0 ? POND.logLight : r >= thick - 2 ? POND.logDark : POND.log;
          dot(g, x, y - thick + 1 + r, mossy && r > 0 && rand() < 0.25 && x < 70 ? POND.moss : color);
        }
        // Lying in the water: mirrored below its underside.
        for (let r = 0; r < thick - 1; r++) mirrored.push({ x, y: y + 1 + r });
      }
      run += len;
    }
  };
  log([[14, 238], [60, 232], [96, 225], [126, 214], [148, 211], [168, 223], [180, 232]], 7, 3, true);
  log([[36, 258], [80, 247], [118, 240], [168, 233]], 6, 4, false);
  log([[96, 225], [104, 216], [110, 212]], 3, 2, false);

  // The tangle: sticks curling about where they float.
  const surface = 236;
  for (let i = 0; i < 14; i++) {
    let x = 200 + rand() * 46;
    let y = 214 + rand() * 30;
    let a = rand() * Math.PI * 2;
    const steps = 12 + Math.floor(rand() * 22);
    for (let n = 0; n < steps; n++) {
      a += (rand() - 0.5) * 0.9;
      const nx = x + Math.cos(a) * 1.6;
      const ny = y + Math.sin(a) * 1.6;
      line(g, x, y, nx, ny, y < surface ? POND.twig : POND.logDark);
      if (y < surface) mirrored.push({ x: Math.round(x), y: Math.round(2 * surface - y) });
      x = nx;
      y = ny;
    }
  }
  // Thin sticks standing up out of it, and one alone further out.
  /** @type {[number, number, number, number][]} */
  const sticks = [
    [242, 256, 234, 206],
    [208, 256, 205, 216],
    [192, 154, 190, 146],
  ];
  for (const [x0, y0, x1, y1] of sticks) {
    line(g, x0, y0, x1, y1, POND.twig);
    // Mirrored about where it meets the water: its foot, or the tangle's surface.
    const foot = Math.min(y0, surface);
    for (let y = y1; y <= foot; y++) mirrored.push({ x: Math.round(x1 + ((x0 - x1) * (y - y1)) / (y0 - y1)), y: 2 * foot - y });
  }
  return { canvas, mirrored };
}

// ---------- The birch and the beech, in three frames of the wind ----------

/**
 * A branch as a list of segments: each end knows how far it is along the
 * branch from where it's fixed (`flex`), which is how far it moves.
 * @typedef {{ x0: number, y0: number, x1: number, y1: number, f0: number, f1: number, thick: number, color: string }} Segment
 * @typedef {{ x: number, y: number, f: number, color: string, shade: string, angle: number, len: number, width: number }} Leaf
 */

/**
 * @param {{ segments: Segment[], leaves: Leaf[] }} out
 * @param {number} x @param {number} y @param {number} angle  Radians; 0 is right, y grows down.
 * @param {number} len @param {number} depth @param {number} flex
 * @param {number} leafy  How likely a twig's end is to keep its leaves.
 * @param {() => number} rand
 */
function grow(out, x, y, angle, len, depth, flex, leafy, rand) {
  const steps = 2 + Math.floor(rand() * 2);
  for (let s = 0; s < steps; s++) {
    angle += (rand() - 0.5) * 0.5;
    const l = len * (0.7 + rand() * 0.5);
    const nx = x + Math.cos(angle) * l;
    const ny = y + Math.sin(angle) * l;
    out.segments.push({
      x0: x, y0: y, x1: nx, y1: ny, f0: flex, f1: flex + l,
      thick: depth >= 3 && s === 0 ? 2 : 1,
      color: depth >= 2 ? POND.barkBlack : depth === 1 ? POND.twig : POND.twigFine,
    });
    if (depth > 0 && rand() < 0.8) grow(out, nx, ny, angle + (rand() < 0.5 ? -1 : 1) * (0.5 + rand() * 0.6), len * 0.62, depth - 1, flex + l, leafy, rand);
    if (depth <= 1 && rand() < leafy) {
      const n = 1 + Math.floor(rand() * 3);
      for (let i = 0; i < n; i++) {
        out.leaves.push({
          x: nx + (rand() - 0.5) * 4, y: ny + (rand() - 0.5) * 3, f: flex + l,
          color: pick(rand, [POND.leafOrange, POND.leafGold, POND.leafBrown, POND.ochre]),
          shade: POND.leafBrown, angle: 0, len: 2, width: 1 + Math.floor(rand() * 2),
        });
      }
    }
    x = nx;
    y = ny;
    flex += l;
  }
}

/** The birch's trunk: its middle and width at each row. */
const trunkX = (/** @type {number} */ y) => 80 - 44 * (y / 232) - 4 * Math.sin((y / 232) * Math.PI);
const trunkW = (/** @type {number} */ y) => (y > 214 ? 13 + (y - 214) * 0.35 : 11 + (y / 214) * 2);

/** @param {() => number} rand */
function growBirch(rand) {
  /** @type {{ segments: Segment[], leaves: Leaf[] }} */
  const out = { segments: [], leaves: [] };
  /** @type {[number, number, number, number, number][]} y on the trunk, angle, length, depth, leafy */
  const boughs = [
    [12, -0.7, 13, 3, 0.25],
    [26, -2.5, 15, 3, 0.85],
    [44, -0.35, 16, 3, 0.2],
    [60, -2.75, 14, 3, 0.85],
    [76, -0.2, 15, 3, 0.15],
    [96, -2.9, 12, 2, 0.9],
    [112, -0.15, 12, 2, 0.2],
  ];
  for (const [y, angle, len, depth, leafy] of boughs) {
    const side = Math.cos(angle) > 0 ? 1 : -1;
    grow(out, trunkX(y) + (side * trunkW(y)) / 2, y, angle, len, depth, 0, leafy, rand);
  }
  // Branches reaching in from a tree off the left edge, thick with leaves.
  grow(out, -2, 74, -0.5, 16, 3, 12, 1, rand);
  grow(out, -2, 30, -0.2, 14, 3, 12, 1, rand);
  grow(out, -2, 158, 0.25, 11, 2, 12, 1, rand);
  grow(out, -2, 172, 0.05, 9, 2, 12, 1, rand);
  // A few leaves dangling from above, top middle, as in the photo.
  for (const x of [128, 136, 141]) {
    grow(out, x, -2, 1.45, 5, 0, 8, 1, rand);
  }
  return out;
}

/** @param {() => number} rand */
function growBeech(rand) {
  /** @type {{ segments: Segment[], leaves: Leaf[] }} */
  const out = { segments: [], leaves: [] };
  /** @type {[number, number, number, number][]} x, y, angle, nodes */
  const stems = [
    [322, -2, 2.15, 6],
    [322, 34, 2.55, 4],
    [298, -2, 1.85, 4],
  ];
  for (const [sx, sy, a0, nodes] of stems) {
    let x = sx;
    let y = sy;
    let angle = a0;
    let flex = 6;
    for (let n = 0; n < nodes; n++) {
      angle += (rand() - 0.5) * 0.3;
      const l = 9 + rand() * 4;
      const nx = x + Math.cos(angle) * l;
      const ny = y + Math.sin(angle) * l;
      out.segments.push({ x0: x, y0: y, x1: nx, y1: ny, f0: flex, f1: flex + l, thick: 1, color: POND.twig });
      flex += l;
      // A leaf either side of each node, hanging and pointing outwards.
      for (const side of [-1, 1]) {
        if (rand() < 0.15) continue;
        const colour = pick(rand, [
          [POND.leafGreen, POND.leafShade],
          [POND.leafLime, POND.leafGreen],
          [POND.leafGold, POND.ochre],
          [POND.leafGold, POND.leafLime],
          [POND.ochre, POND.rust],
        ]);
        out.leaves.push({
          x: nx, y: ny, f: flex,
          color: colour[0], shade: colour[1],
          angle: angle + side * (0.9 + rand() * 0.5),
          len: 8 + Math.floor(rand() * 5),
          width: 5 + Math.floor(rand() * 2),
        });
      }
      x = nx;
      y = ny;
    }
  }
  return out;
}

/**
 * How far a point that far along its branch moves in a frame: nothing at the
 * fixed end, up to `reach` pixels with the wind at the tips.
 * @param {number} flex @param {number} frame @param {number} reach
 */
const bend = (flex, frame, reach) => Math.round(Math.min(frame * reach, (frame * flex) / 22));

/**
 * One leaf: a pointed oval along its angle, the far half a shade darker and a
 * midrib down the middle of the big ones. Small ones are a pixel or two.
 * @param {CanvasRenderingContext2D} g @param {Leaf} leaf @param {number} dx
 */
function paintLeaf(g, leaf, dx) {
  const x = Math.round(leaf.x) + dx;
  const y = Math.round(leaf.y);
  if (leaf.len <= 2) {
    g.fillStyle = leaf.color;
    g.fillRect(x, y, leaf.width, 1);
    return;
  }
  const cos = Math.cos(leaf.angle);
  const sin = Math.sin(leaf.angle);
  const reach = leaf.len + 1;
  for (let py = -reach; py <= reach; py++) {
    for (let px = -reach; px <= reach; px++) {
      const u = px * cos + py * sin;
      const v = -px * sin + py * cos;
      if (u < 0 || u > leaf.len) continue;
      const half = (leaf.width / 2) * Math.sin((Math.PI * u) / leaf.len) ** 0.7;
      if (Math.abs(v) > half) continue;
      const color = Math.abs(v) < 0.5 && u > 1 && u < leaf.len - 1 ? leaf.shade : v > 0 ? leaf.shade : leaf.color;
      dot(g, x + px, y + py, color);
    }
  }
}

/**
 * Branches and leaves in three frames of the wind, the birch's trunk under
 * them if it's the birch.
 * @param {{ segments: Segment[], leaves: Leaf[] }} plant
 * @param {number} reach  The most a tip moves, per frame.
 * @param {((g: CanvasRenderingContext2D) => void) | null} trunk
 */
function paintPlant(plant, reach, trunk) {
  return [0, 1, 2].map((frame) => {
    const canvas = makeCanvas(W, H);
    const g = ctxOf(canvas);
    for (const s of plant.segments) {
      const a = bend(s.f0, frame, reach);
      const b = bend(s.f1, frame, reach);
      line(g, s.x0 + a, s.y0, s.x1 + b, s.y1, s.color);
      if (s.thick > 1) line(g, s.x0 + a, s.y0 + 1, s.x1 + b, s.y1 + 1, s.color);
    }
    trunk?.(g);
    for (const leaf of plant.leaves) paintLeaf(g, leaf, bend(leaf.f, frame, reach));
    return canvas;
  });
}

/**
 * The birch's trunk, leaning in from the bottom left: white with dark marks
 * higher up, darker and mossy towards the water, as birches are.
 * @param {() => number} rand
 */
function trunkPainter(rand) {
  /** @type {{ x: number, y: number, color: string }[]} */
  const pixels = [];
  for (let y = 0; y < 240; y++) {
    const w = trunkW(y);
    const left = Math.round(trunkX(y) - w / 2);
    const right = Math.round(trunkX(y) + w / 2);
    // How dark the bark is: white above 80, almost black at the water.
    const low = Math.min(1, Math.max(0, (y - 80) / 110));
    for (let x = left; x <= right; x++) {
      const edge = x === left ? 'left' : x === right ? 'right' : x === left + 1 ? 'shade' : '';
      const dither = BAYER[y % 4][x % 4] / 16;
      let color;
      if (low > dither + 0.5) color = edge === 'left' ? POND.barkBlack : rand() < 0.3 ? POND.moss : POND.barkDark;
      else if (low > dither) color = edge === 'left' ? POND.barkDark : rand() < 0.2 ? POND.barkDark : POND.barkGrey;
      else color = edge === 'left' ? POND.barkGrey : edge === 'shade' ? POND.barkLight : POND.barkWhite;
      pixels.push({ x, y, color });
    }
    // The birch's dark dashes across the bark.
    if (low < 0.6 && rand() < 0.22) {
      const len = 2 + Math.floor(rand() * 3);
      const start = left + 1 + Math.floor(rand() * Math.max(1, right - left - len));
      for (let x = start; x < start + len; x++) pixels.push({ x, y, color: POND.barkBlack });
    }
  }
  return (/** @type {CanvasRenderingContext2D} */ g) => {
    for (const p of pixels) dot(g, p.x, p.y, p.color);
  };
}

// ---------- The scene ----------

/**
 * @param {HTMLCanvasElement} canvas
 * @param {() => number} rand  Uniform [0, 1), the scenery stream.
 */
export async function createPondScene(canvas, rand) {
  TextureStyle.defaultOptions.scaleMode = 'nearest';
  const app = new Application();
  await app.init({ canvas, width: W, height: H, resolution: 1, autoDensity: false, antialias: false, background: POND.waterMid });
  const tex = (/** @type {HTMLCanvasElement} */ c) => Texture.from(c);

  // Painted once: the land, the reeds, the water, what floats on it, the trees.
  const land = paintLand(rand);
  const blades = growReeds(rand);
  const reedFrames = paintReeds(blades).map((frames) => frames.map(tex));
  const above = makeCanvas(W, WL);
  const ag = ctxOf(above);
  ag.drawImage(land, 0, 0);
  for (const [s, frames] of paintReeds(blades).entries()) ag.drawImage(frames[0], s * SECTION - 2, WL - REED_H);
  const debris = paintDebris(rand);
  const waterFrames = paintWater(above, scatterLeaves(rand), debris.mirrored, rand).map(tex);
  const birchFrames = paintPlant(growBirch(rand), 2, trunkPainter(rand)).map(tex);
  const beechFrames = paintPlant(growBeech(rand), 3, null).map(tex);

  // The whole painting sits in `view`, moved left to show its middle when the
  // scene is narrower than the painting.
  const view = new Container();
  app.stage.addChild(view);
  view.addChild(new Sprite(tex(land)));
  const water = new Sprite(waterFrames[0]);
  water.y = WL;
  view.addChild(water);

  // Glints flicking on the water, as the game's waves do.
  const glintKeys = { p: POND.waterPale, g: POND.glint };
  const glintSets = [
    [['pg.'], ['.gp']],
    [['.ppg.', 'g...p'], ['pg.p.', '..g.p']],
  ].map((frames) => frames.map((rows) => tex(paintGrid(rows, glintKeys))));
  /** @type {{ sprite: Sprite, frames: Texture[], frame: number, next: number }[]} */
  const glints = [];
  for (let i = 0; i < 34; i++) {
    const d = 10 + Math.floor(rand() * 95);
    const frames = glintSets[d < 45 ? 0 : 1];
    const sprite = new Sprite(frames[0]);
    sprite.position.set(Math.floor(rand() * (W - 6)), WL + d);
    view.addChild(sprite);
    glints.push({ sprite, frames, frame: 0, next: rand() * 2000 });
  }

  const ripples = new Container();
  view.addChild(ripples);
  /** @type {Map<string, Texture>} */
  const ringCache = new Map();
  const ring = (/** @type {number} */ rx, /** @type {number} */ ry) => {
    const key = `${rx}x${ry}`;
    if (!ringCache.has(key)) ringCache.set(key, tex(paintRing(rx, ry, POND.waterPale)));
    return /** @type {Texture} */ (ringCache.get(key));
  };
  /** @type {{ x: number, y: number, born: number, life: number, maxRx: number }[]} */
  let rings = [];
  let nextRing = 0;

  // A bobber out on the water, to show the scale things are drawn at.
  const bobber = new Sprite(tex(paintGrid(BOBBER)));
  view.addChild(bobber);

  const reeds = reedFrames.map((frames, s) => {
    const sprite = new Sprite(frames[0]);
    sprite.position.set(s * SECTION - 2, WL - REED_H);
    view.addChild(sprite);
    return sprite;
  });
  view.addChild(new Sprite(tex(debris.canvas)));
  const birch = new Sprite(birchFrames[0]);
  const beech = new Sprite(beechFrames[0]);
  view.addChild(birch, beech);

  // Rain and the light of the hour over it all, as in the game; no cloud
  // shadows, since the game's are placed on its own water.
  const skyLayer = new Container();
  app.stage.addChild(skyLayer);
  const sky = createSky(new Container(), skyLayer, H, rand);
  let raining = false;
  let lastFrame = 0;

  /**
   * Which of the three frames a gust puts things in at column x: gusts roll
   * across from the left, and only a stiff wind bends things twice as far.
   * @param {number} now @param {number} x
   */
  function gust(now, x) {
    const wind = sky.wind();
    const t = now * 0.0011 * (1 + wind * 0.5);
    const g = Math.sin(t - x / 70) + 0.6 * Math.sin(t * 0.43 + x / 110);
    const frame = g > 0.9 ? 2 : g > -0.1 ? 1 : 0;
    return Math.min(frame, wind >= 2 ? 2 : 1);
  }

  return {
    app,
    /** @param {import('./sky.js').World} world */
    setWorld(world) {
      raining = world.weather.precipitation >= 2 && world.weather.temperature > 2;
      sky.setWorld(world);
    },
    /** @param {unknown} _cast  Ignored: the bobber just waits. @param {number} now */
    update(_cast, now) {
      sky.update(now, lastFrame ? now - lastFrame : 16);
      lastFrame = now;
      const crop = -view.x;

      for (const [s, sprite] of reeds.entries()) sprite.texture = reedFrames[s][gust(now, s * SECTION + SECTION / 2)];
      birch.texture = birchFrames[gust(now, 60)];
      beech.texture = beechFrames[gust(now, 290)];
      water.texture = waterFrames[Math.floor(now / (520 / (1 + sky.wind() * 0.3))) % 3];

      for (const glint of glints) {
        if (now < glint.next) continue;
        glint.frame = 1 - glint.frame;
        glint.sprite.texture = glint.frames[glint.frame];
        glint.next = now + (700 + rand() * 1800) / (1 + sky.wind() * 0.5);
      }

      // A ring now and then where something touched the water; rain all over.
      if (now >= nextRing) {
        const d = Math.floor(rand() * 90) + 6;
        rings.push({ x: crop + 10 + Math.floor(rand() * (W - 2 * crop - 20)), y: WL + d, born: now, life: 900, maxRx: d < 40 ? 4 : 7 });
        nextRing = now + (raining ? 90 + rand() * 120 : 1500 + rand() * 2500);
      }
      rings = rings.filter((r) => now - r.born < r.life);
      ripples.removeChildren();
      for (const r of rings) {
        const age = (now - r.born) / r.life;
        const rx = Math.max(1, Math.round(r.maxRx * age));
        const ry = Math.max(1, Math.round(rx * (r.y - WL < 40 ? 0.3 : 0.42)));
        const sprite = new Sprite(ring(rx, ry));
        sprite.position.set(r.x - rx, r.y - ry);
        sprite.alpha = age < 0.6 ? 1 : 0.5;
        ripples.addChild(sprite);
      }

      const bob = Math.floor(now / 650) % 2;
      bobber.position.set(Math.round(BOBBER_AT.x - bobber.width / 2), BOBBER_AT.y - WATERLINE.near + bob);
    },
    /**
     * Sizes the canvas as the game's scene does (D10, D93): whole device
     * pixels per scene pixel, showing the middle `width` pixels of the painting.
     * @param {number} maxCssWidth @param {number} maxCssHeight @param {number} width
     */
    fit(maxCssWidth, maxCssHeight, width) {
      width = Math.min(W, Math.max(256, Math.round(width)));
      const dpr = window.devicePixelRatio || 1;
      const scale = Math.max(1, Math.floor(Math.min((maxCssWidth * dpr) / width, (maxCssHeight * dpr) / H)));
      app.renderer.resize(width, H);
      view.x = -Math.floor((W - width) / 2);
      sky.setWidth(width);
      canvas.style.width = `${(width * scale) / dpr}px`;
      canvas.style.height = `${(H * scale) / dpr}px`;
      return scale;
    },
  };
}
