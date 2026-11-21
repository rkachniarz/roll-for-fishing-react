// @ts-check
// Clouds that follow the weather (12.5, D170): a library of cloud types, each
// with two or three patterns drawn as code, and the rules that pick which of
// them show (content/rules/sky.json). Pure numbers and pixel grids, no PixiJS,
// so the tests can paint every pattern; src/scene/sky-layer.js turns the grids
// into sprites, made once and cached, and drifts them in whole pixels.
//
// The shapes come from photographs on Wikimedia Commons (references only,
// never traced or shipped; docs/REVIEW.md lists them): fair-weather heaps with
// flat grey bases and lit, bumpy tops, smaller and flatter towards the horizon;
// towering heaps stacked like cauliflower over a dark base; lumpy grey layers
// (stratocumulus); high wisps and hooked mares' tails (cirrus); flat grey
// sheets (stratus); rain cloud with curtains of rain under a dark base
// (nimbostratus); and the heavy dark rolls of a storm overcast.
//
// A grid holds tones, 0 for nothing and 1 (lightest) to 4 (darkest); the
// season's palette over a pattern's ramp gives the colours. Randomness comes
// from the `rand` given: the scenery stream (D4).

import { content } from '../generated/content.js';

/** The painting's width: the sky spans the strips too (D93). */
export const SKY_W = 320;

/** 4×4 ordered dither. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
/** @param {number} x @param {number} y */
const dither = (x, y) => (BAYER[y & 3][x & 3] + 0.5) / 16;

/**
 * @typedef {{ w: number, h: number, data: Uint8Array }} CloudGrid  Tones row by row: 0 nothing, 1 lightest to 4 darkest.
 * @typedef {'far' | 'mid' | 'near'} Band  How far off a cloud is: far ones sit low over the horizon, small and flat.
 * @typedef {'white' | 'grey' | 'storm'} Ramp
 * @typedef {'heap' | 'tower' | 'layer' | 'wisp' | 'scud' | 'sheet' | 'rain' | 'storm' | 'fog'} Kind
 * @typedef {{ x: number, y: number, r: number, ry?: number }} Puff  A round lump: centre and radius, in units.
 */

/**
 * How much bigger the sky's things are drawn than 12.4 and 12.5 first drew
 * them: the clouds, the sky-wide patterns' lumps and rolls, the sun and the
 * moon (the owner: "everything except the stars appears too small"). Derived
 * from the still water's old summer clouds (about 120 x 35 px over the same
 * 110 rows of sky) and the owner's photo of heaped cloud over distant trees;
 * Claude's reading of both, docs/REVIEW.md.
 */
export const SKY_SIZE = 3;

/** Pixels per unit, by band (each band is its own drawing, never a scaled one: R7.3). */
const SCALE = { far: 0.6 * SKY_SIZE, mid: 1 * SKY_SIZE, near: 1.5 * SKY_SIZE };

/** @param {() => number} rand @param {number} a @param {number} b */
const between = (rand, a, b) => a + rand() * (b - a);

/**
 * Lumps into a grid: each pixel takes the lump it lies deepest in, lit from
 * above and a little from the left, darker towards the bottom; `flat` cuts
 * the bottom off straight, as a heap's base is.
 * @param {Puff[]} puffs  In units; y grows downwards, the base at 0 when flat.
 * @param {number} scale  Pixels per unit.
 * @param {{ flat?: boolean, under?: number, bright?: number, ragged?: number }} [opts]
 *   `under`: how much darker the lower part; `bright`: lifts every tone; `ragged`: frays the outline.
 * @returns {CloudGrid}
 */
export function paintPuffs(puffs, scale, opts = {}) {
  const under = opts.under ?? 0.7;
  const bright = opts.bright ?? 0;
  const px = puffs.map((p) => ({ x: p.x * scale, y: p.y * scale, r: Math.max(0.8, p.r * scale), ry: Math.max(0.6, (p.ry ?? p.r) * scale) }));
  const left = Math.floor(Math.min(...px.map((p) => p.x - p.r)));
  const right = Math.ceil(Math.max(...px.map((p) => p.x + p.r)));
  const top = Math.floor(Math.min(...px.map((p) => p.y - p.ry)));
  const bottom = opts.flat ? 0 : Math.ceil(Math.max(...px.map((p) => p.y + p.ry)));
  const w = Math.max(1, right - left);
  const h = Math.max(1, bottom - top);
  const data = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cx = x + left + 0.5;
      const cy = y + top + 0.5;
      let best = null;
      let bestD = Infinity;
      for (const p of px) {
        const d = Math.hypot((cx - p.x) / p.r, (cy - p.y) / p.ry);
        if (d <= 1 && d < bestD) {
          bestD = d;
          best = p;
        }
      }
      if (!best) continue;
      // Frayed edges: the outermost ring of a lump drops out in a dither.
      if (opts.ragged && bestD > 1 - opts.ragged && dither(x, y) < (bestD - (1 - opts.ragged)) / opts.ragged) continue;
      const nx = (cx - best.x) / best.r;
      const ny = (cy - best.y) / best.ry;
      const lit = -ny * 0.75 - nx * 0.35;
      const depth = h > 1 ? y / (h - 1) : 0.5;
      const s = lit * 0.55 + 0.4 + bright - depth * under + (dither(x, y) - 0.5) * 0.22;
      data[y * w + x] = s > 0.45 ? 1 : s > 0.05 ? 2 : s > -0.35 ? 3 : 4;
    }
  }
  return { w, h, data };
}

/**
 * Thin strands of high cloud: each a line of points, drawn in a dither that
 * thins out towards its ends; `tuft` thickens the last stretch (a hook).
 * @param {{ points: [number, number][], tuft?: number }[]} strands  In units.
 * @param {number} scale
 * @returns {CloudGrid}
 */
export function paintStrands(strands, scale) {
  const all = strands.flatMap((s) => s.points);
  const left = Math.floor(Math.min(...all.map((p) => p[0])) * scale) - 1;
  const right = Math.ceil(Math.max(...all.map((p) => p[0])) * scale) + 2;
  const top = Math.floor(Math.min(...all.map((p) => p[1])) * scale) - 2;
  const bottom = Math.ceil(Math.max(...all.map((p) => p[1])) * scale) + 2;
  const w = right - left;
  const h = bottom - top;
  const data = new Uint8Array(w * h);
  for (const strand of strands) {
    const pts = strand.points.map(([x, y]) => [x * scale - left, y * scale - top]);
    const steps = Math.max(2, Math.ceil(pts.length * 6 * scale));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const at = t * (pts.length - 1);
      const k = Math.min(pts.length - 2, Math.floor(at));
      const f = at - k;
      const x = Math.round(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f);
      const y = Math.round(pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f);
      const density = Math.sin(Math.PI * t) ** 0.6;
      const thick = strand.tuft && t > 1 - strand.tuft ? 2 : 1;
      for (let dy = 0; dy < thick; dy++) {
        const yy = y - dy;
        if (x < 0 || x >= w || yy < 0 || yy >= h) continue;
        if (dither(x, yy) > density * 0.95) continue;
        const tone = density > 0.55 ? 1 : 2;
        const o = yy * w + x;
        if (!data[o] || data[o] > tone) data[o] = tone;
      }
    }
  }
  return { w, h, data };
}

/**
 * A pattern across the full width that wraps seamlessly (whole periods across
 * the 320 pixels), for the sheets, -1 to 1: level bands that bend gently, or
 * (`lumpy`) rows of lumps. Rows are counted in depth, so bands and lumps
 * crowd together towards the horizon as a ceiling of cloud does.
 * @param {() => number} rand @param {number} count @param {[number, number]} across  Periods across the width.
 * @param {[number, number]} down  Radians per row (of depth). @param {number} h  The sky's rows.
 * @param {boolean} [lumpy]
 */
function waves(rand, count, across, down, h, lumpy = false) {
  // Bigger lumps and rolls by SKY_SIZE: fewer periods across, slower down; still whole periods, so it wraps.
  const list = Array.from({ length: count }, () => ({
    n: Math.max(1, Math.round(between(rand, across[0], across[1]) / SKY_SIZE)),
    b: between(rand, down[0], down[1]) / SKY_SIZE,
    phase: rand() * Math.PI * 2,
    phase2: rand() * Math.PI * 2,
    bend: between(rand, 0.6, 1.8),
  }));
  /** @param {number} y */
  const depth = (y) => -0.45 * h * Math.log(1 - (0.9 * Math.min(y, h - 1)) / h);
  /** @param {number} x @param {number} y */
  return (x, y) => {
    const d = depth(y);
    let sum = 0;
    for (const w of list) {
      const ax = (2 * Math.PI * w.n * x) / SKY_W + w.phase;
      sum += lumpy ? Math.sin(ax) * Math.sin(w.b * d + w.phase2) : Math.sin(w.b * d + w.bend * Math.sin(ax) + w.phase2);
    }
    return sum / count;
  };
}

/**
 * A sky-wide grid from a function giving each pixel a lightness (higher is
 * lighter): tones by threshold, dithered at their seams.
 * @param {number} h @param {(x: number, y: number) => number} light
 * @returns {CloudGrid}
 */
function fullSky(h, light) {
  const w = SKY_W;
  const data = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = light(x, y) + (dither(x, y) - 0.5) * 0.18;
      data[y * w + x] = s > 0.62 ? 1 : s > 0.36 ? 2 : s > 0.1 ? 3 : 4;
    }
  }
  return { w, h, data };
}

// ---------- The puffs of each heaped pattern, in units ----------

/** A dome with shoulders: the plain fair-weather heap (Cumulus humilis). @param {() => number} rand @returns {Puff[]} */
function heapDome(rand) {
  const r = between(rand, 5, 6.5);
  const cx = 0;
  const puffs = [{ x: cx, y: -r * 0.5, r }];
  for (const side of [-1, 1]) {
    const r2 = r * between(rand, 0.55, 0.75);
    puffs.push({ x: cx + side * r * between(rand, 0.85, 1.15), y: -r2 * 0.45, r: r2 });
    const r3 = r * between(rand, 0.3, 0.45);
    puffs.push({ x: cx + side * (r + r2 * between(rand, 0.8, 1.1)), y: -r3 * 0.4, r: r3 });
  }
  return puffs;
}

/** A long low heap of even bumps on a flat base. @param {() => number} rand @returns {Puff[]} */
function heapLong(rand) {
  const n = 4 + Math.floor(rand() * 3);
  const puffs = [];
  let x = 0;
  for (let i = 0; i < n; i++) {
    const r = between(rand, 2.4, 3.8) * (i === 0 || i === n - 1 ? 0.75 : 1);
    puffs.push({ x, y: -r * 0.4, r, ry: r * 0.85 });
    x += between(rand, 3.2, 4.6);
  }
  return puffs;
}

/** Two small heaps joined by a low bridge, ragged. @param {() => number} rand @returns {Puff[]} */
function heapPair(rand) {
  const a = between(rand, 3.2, 4.2);
  const b = between(rand, 2.5, 3.4);
  const gap = between(rand, 8, 11);
  return [
    { x: 0, y: -a * 0.5, r: a },
    { x: -a * 0.9, y: -a * 0.3, r: a * 0.55 },
    { x: gap, y: -b * 0.5, r: b },
    { x: gap + b * 0.9, y: -b * 0.3, r: b * 0.5 },
    { x: gap * 0.45, y: -0.5, r: 1.6, ry: 1.1 },
    { x: gap * 0.62, y: -0.6, r: 1.4, ry: 1 },
  ];
}

/** A towering heap: a wide base and a column of lumps, narrowing upwards (Cumulus congestus). @param {() => number} rand @returns {Puff[]} */
function towerTall(rand) {
  const puffs = [];
  for (let i = 0; i < 4; i++) {
    const r = between(rand, 4, 5.2);
    puffs.push({ x: (i - 1.5) * 5.2, y: -r * 0.45, r });
  }
  const levels = 3 + Math.floor(rand() * 2);
  let x = between(rand, -2, 2);
  for (let i = 0; i < levels; i++) {
    const r = 6 - i * 0.7;
    const y = -6 - i * 5.2;
    x += between(rand, -1.5, 1.5);
    puffs.push({ x, y, r });
    puffs.push({ x: x - r * between(rand, 0.7, 1), y: y + r * 0.35, r: r * 0.6 });
    puffs.push({ x: x + r * between(rand, 0.7, 1), y: y + r * 0.3, r: r * 0.55 });
  }
  return puffs;
}

/** A broad towering heap with two turrets of different heights. @param {() => number} rand @returns {Puff[]} */
function towerTwin(rand) {
  const puffs = [];
  for (let i = 0; i < 6; i++) {
    const r = between(rand, 3.6, 4.8);
    puffs.push({ x: (i - 2.5) * 5, y: -r * 0.45, r });
  }
  for (const [x0, levels] of [[-7, 2 + Math.floor(rand() * 2)], [7, 3 + Math.floor(rand() * 2)]]) {
    let x = x0;
    for (let i = 0; i < levels; i++) {
      const r = 5 - i * 0.6;
      x += between(rand, -1.2, 1.2);
      puffs.push({ x, y: -5 - i * 4.6, r });
      puffs.push({ x: x + r * 0.8, y: -3.5 - i * 4.6, r: r * 0.55 });
    }
  }
  return puffs;
}

/** A lumpy grey roll: many flattened lumps in a row, lumpy above and below (stratocumulus). @param {() => number} rand @returns {Puff[]} */
function layerRoll(rand) {
  const n = 10 + Math.floor(rand() * 7);
  const puffs = [];
  let x = 0;
  for (let i = 0; i < n; i++) {
    const r = between(rand, 3.2, 4.8) * (i < 2 || i > n - 3 ? 0.7 : 1);
    puffs.push({ x, y: between(rand, -1, 1), r, ry: r * 0.72 });
    x += between(rand, 3.2, 4.6);
  }
  return puffs;
}

/** Grey cells in a row with gaps of sky between. @param {() => number} rand @returns {Puff[]} */
function layerCells(rand) {
  const cells = 4 + Math.floor(rand() * 3);
  const puffs = [];
  let x = 0;
  for (let c = 0; c < cells; c++) {
    const lumps = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < lumps; i++) {
      const r = between(rand, 2.8, 4.2);
      puffs.push({ x, y: between(rand, -0.8, 0.8), r, ry: r * 0.72 });
      x += between(rand, 2.8, 3.8);
    }
    x += between(rand, 2.5, 4.5);
  }
  return puffs;
}

/** A long thin low roll, dark beneath. @param {() => number} rand @returns {Puff[]} */
function layerLow(rand) {
  const n = 12 + Math.floor(rand() * 9);
  const puffs = [];
  let x = 0;
  for (let i = 0; i < n; i++) {
    const r = between(rand, 2.2, 3.2);
    puffs.push({ x, y: between(rand, -0.5, 0.5), r, ry: r * 0.6 });
    x += between(rand, 2.6, 3.4);
  }
  return puffs;
}

/** A ragged fragment of low dark cloud (scud). @param {() => number} rand @param {number} n @returns {Puff[]} */
function scudBits(rand, n) {
  const puffs = [];
  let x = 0;
  for (let i = 0; i < n; i++) {
    const r = between(rand, 2.4, 4);
    puffs.push({ x, y: between(rand, -0.8, 0.8), r, ry: r * 0.55 });
    x += between(rand, 2.4, 3.6);
  }
  return puffs;
}

// ---------- The strands of each wispy pattern ----------

/** Long thin strands, near parallel (cirrus). @param {() => number} rand */
function wispLong(rand) {
  const n = 3 + Math.floor(rand() * 3);
  const slope = between(rand, -0.08, 0.08);
  return Array.from({ length: n }, (_, i) => {
    const x0 = between(rand, -4, 4);
    const len = between(rand, 30, 50);
    const amp = between(rand, 0.5, 1.6);
    const phase = rand() * 6;
    /** @type {[number, number][]} */
    const points = Array.from({ length: 7 }, (_, k) => {
      const x = x0 + (len * k) / 6;
      return [x, i * between(rand, 1.6, 2.6) + slope * x + amp * Math.sin(x / 7 + phase)];
    });
    return { points };
  });
}

/** Hooked mares' tails: strands that fall away and end in a tuft. @param {() => number} rand */
function wispHooked(rand) {
  const n = 3 + Math.floor(rand() * 3);
  return Array.from({ length: n }, () => {
    const x0 = between(rand, 0, 34);
    const y0 = between(rand, 0, 8);
    const len = between(rand, 14, 24);
    /** @type {[number, number][]} */
    const points = Array.from({ length: 7 }, (_, k) => {
      const t = k / 6;
      return [x0 + len * t, y0 + 3 * t - 5 * t ** 4];
    });
    return { points, tuft: 0.2 };
  });
}

/** A fan of streaks from one place (cirrus fibratus). @param {() => number} rand */
function wispFan(rand) {
  const n = 5 + Math.floor(rand() * 4);
  return Array.from({ length: n }, () => {
    const angle = between(rand, -0.45, 0.15);
    const len = between(rand, 16, 36);
    const start = between(rand, 0, 4);
    /** @type {[number, number][]} */
    const points = Array.from({ length: 5 }, (_, k) => {
      const d = start + (len * k) / 4;
      return [Math.cos(angle) * d, Math.sin(angle) * d + 0.02 * d * d * 0.3];
    });
    return { points };
  });
}

// ---------- The library ----------

/**
 * @typedef {{ kind: Kind, ramp: Ramp, full?: boolean,
 *   paint: (rand: () => number, band: Band, h: number) => CloudGrid }} CloudPattern
 *   `full`: a backdrop over the whole sky, `h` rows tall; the others are single clouds, `h` unused.
 */

/** Every cloud pattern, by id. A new pattern is a new entry, named <kind>-<letter>. @type {Record<string, CloudPattern>} */
export const CLOUD_PATTERNS = {
  // Fair-weather heaps (Cumulus humilis, mediocris).
  'heap-a': { kind: 'heap', ramp: 'white', paint: (rand, band) => paintPuffs(heapDome(rand), SCALE[band], { flat: true, under: 0.75 }) },
  'heap-b': { kind: 'heap', ramp: 'white', paint: (rand, band) => paintPuffs(heapLong(rand), SCALE[band], { flat: true, under: 0.7 }) },
  'heap-c': { kind: 'heap', ramp: 'white', paint: (rand, band) => paintPuffs(heapPair(rand), SCALE[band], { flat: true, under: 0.7, ragged: 0.15 }) },
  // Towering heaps (Cumulus congestus): bright tops, dark flat bases; never drawn near, or they would stand taller than the sky.
  'tower-a': { kind: 'tower', ramp: 'white', paint: (rand, band) => paintPuffs(towerTall(rand), SCALE[band === 'near' ? 'mid' : band] * 0.85, { flat: true, under: 1.05, bright: 0.12 }) },
  'tower-b': { kind: 'tower', ramp: 'white', paint: (rand, band) => paintPuffs(towerTwin(rand), SCALE[band === 'near' ? 'mid' : band] * 0.85, { flat: true, under: 1, bright: 0.1 }) },
  // Lumpy grey layers (stratocumulus).
  'layer-a': { kind: 'layer', ramp: 'grey', paint: (rand, band) => paintPuffs(layerRoll(rand), SCALE[band], { under: 0.65, bright: 0.05 }) },
  'layer-b': { kind: 'layer', ramp: 'grey', paint: (rand, band) => paintPuffs(layerCells(rand), SCALE[band], { under: 0.6, bright: 0.1 }) },
  'layer-c': { kind: 'layer', ramp: 'grey', paint: (rand, band) => paintPuffs(layerLow(rand), SCALE[band], { under: 0.85, ragged: 0.2 }) },
  // High wisps (cirrus).
  'wisp-a': { kind: 'wisp', ramp: 'white', paint: (rand, band) => paintStrands(wispLong(rand), SCALE[band]) },
  'wisp-b': { kind: 'wisp', ramp: 'white', paint: (rand, band) => paintStrands(wispHooked(rand), SCALE[band]) },
  'wisp-c': { kind: 'wisp', ramp: 'white', paint: (rand, band) => paintStrands(wispFan(rand), SCALE[band]) },
  // Ragged low fragments, drifting fast under an overcast (fractus).
  'scud-a': { kind: 'scud', ramp: 'storm', paint: (rand, band) => paintPuffs(scudBits(rand, 4 + Math.floor(rand() * 3)), SCALE[band], { under: 0.4, bright: 0.25, ragged: 0.35 }) },
  'scud-b': { kind: 'scud', ramp: 'grey', paint: (rand, band) => paintPuffs(scudBits(rand, 2 + Math.floor(rand() * 2)), SCALE[band], { under: 0.4, bright: 0.1, ragged: 0.4 }) },
  // Flat grey sheets (stratus): a long faint streaking, lighter towards the horizon.
  'sheet-a': {
    kind: 'sheet',
    ramp: 'grey',
    full: true,
    paint: (rand, _band, h) => {
      const streak = waves(rand, 3, [1, 3], [0.25, 0.6], h);
      return fullSky(h, (x, y) => 0.18 + 0.32 * (y / h) + 0.09 * streak(x, y));
    },
  },
  // A sheet with a lumpy, wavy base, the lumps smaller towards the horizon.
  'sheet-b': {
    kind: 'sheet',
    ramp: 'grey',
    full: true,
    paint: (rand, _band, h) => {
      const big = waves(rand, 3, [4, 7], [0.18, 0.3], h, true);
      const small = waves(rand, 3, [10, 16], [0.4, 0.6], h, true);
      return fullSky(h, (x, y) => {
        const far = y / h;
        return 0.22 + 0.3 * far + (1 - far) * 0.2 * big(x, y) + far * 0.14 * small(x, y);
      });
    },
  },
  // Rain cloud (nimbostratus): a dark base, curtains of rain hanging from it to the horizon.
  'rain-a': {
    kind: 'rain',
    ramp: 'storm',
    full: true,
    paint: (rand, _band, h) => {
      const lumps = waves(rand, 3, [3, 6], [0.15, 0.3], h, true);
      const shafts = Array.from({ length: 3 + Math.floor(rand() * 3) }, () => ({ x: rand() * SKY_W, w: between(rand, 10, 26) * SKY_SIZE, slant: between(rand, -0.12, 0.12) }));
      return fullSky(h, (x, y) => {
        const v = y / h;
        const base = 0.62 + 0.04 * Math.sin((2 * Math.PI * x) / SKY_W);
        let s = 0.5 + 0.18 * lumps(x, y) - 0.38 * Math.exp(-(((v - 0.55) / 0.2) ** 2));
        if (v > base) {
          for (const shaft of shafts) {
            let dx = Math.abs(x - shaft.x - (y - base * h) * shaft.slant);
            dx = Math.min(dx, SKY_W - dx);
            // Streaks of rain: every other column, fading towards the shaft's edges.
            if (dx < shaft.w / 2) s += 0.2 * (1 - dx / (shaft.w / 2)) * (x % 2 === 0 ? 1.3 : 0.5);
          }
        }
        return s;
      });
    },
  },
  // Rain cloud in heavy rolls, ragged underneath, no curtains.
  'rain-b': {
    kind: 'rain',
    ramp: 'storm',
    full: true,
    paint: (rand, _band, h) => {
      const rolls = waves(rand, 3, [2, 5], [0.12, 0.22], h);
      const rag = waves(rand, 2, [12, 20], [0.6, 1], h);
      return fullSky(h, (x, y) => {
        const v = y / h;
        return 0.38 + 0.22 * rolls(x, y) + 0.08 * rag(x, y) * v - 0.12 * v + 0.25 * Math.max(0, v - 0.85) * 4;
      });
    },
  },
  // A storm's dark overcast: heavy rolls with paler rims.
  'storm-a': {
    kind: 'storm',
    ramp: 'storm',
    full: true,
    paint: (rand, _band, h) => {
      const bend = waves(rand, 2, [1, 3], [0, 0.05], h);
      const lumps = waves(rand, 3, [5, 9], [0.2, 0.35], h, true);
      return fullSky(h, (x, y) => {
        const roll = Math.sin((y * 0.2) / SKY_SIZE + 2.2 * bend(x, y));
        return 0.12 + 0.2 * roll + 0.1 * lumps(x, y) + 0.08 * (y / h);
      });
    },
  },
  // A storm's dark overcast with a pale band of light under its edge, low at the horizon.
  'storm-b': {
    kind: 'storm',
    ramp: 'storm',
    full: true,
    paint: (rand, _band, h) => {
      const lumps = waves(rand, 3, [3, 7], [0.15, 0.3], h, true);
      const edge = waves(rand, 2, [2, 5], [0, 0.02], h);
      return fullSky(h, (x, y) => {
        const v = y / h;
        const gap = 0.84 + 0.05 * edge(x, y);
        return v > gap ? 0.5 + (v - gap) * 3 : 0.1 + 0.16 * lumps(x, y) - 0.08 * v;
      });
    },
  },
  // Thick fog: the sky gone to a flat pale grey, palest low down.
  'fog-a': {
    kind: 'fog',
    ramp: 'white',
    full: true,
    paint: (rand, _band, h) => {
      const drift = waves(rand, 2, [1, 3], [0.1, 0.2], h);
      return fullSky(h, (x, y) => 0.32 + 0.3 * (y / h) + 0.05 * drift(x, y));
    },
  },
  // Mist: banks of it in streaks, the sky hidden behind.
  'fog-b': {
    kind: 'fog',
    ramp: 'white',
    full: true,
    paint: (rand, _band, h) => {
      const banks = waves(rand, 3, [1, 4], [0.2, 0.4], h);
      return fullSky(h, (x, y) => 0.42 + 0.3 * (y / h) + 0.16 * banks(x, y));
    },
  },
};

/** The four colours of each ramp, lightest first, from a season's palette. */
export const RAMPS = {
  white: ['light', 'cloud', 'shade', 'dark'],
  grey: ['cloud', 'shade', 'sheet', 'sheetDark'],
  storm: ['sheet', 'sheetDark', 'storm', 'stormDark'],
};

/**
 * Where each kind of single cloud may sit: its base, as a share of the way
 * down to the horizon. Towers stand on the horizon; wisps keep high.
 * @type {Record<string, { top: number, bottom: number, speed: number }>}
 */
const PLACE = {
  heap: { top: 0.12, bottom: 0.95, speed: 1 },
  tower: { top: 0.7, bottom: 1, speed: 0.6 },
  layer: { top: 0.15, bottom: 0.95, speed: 0.9 },
  wisp: { top: 0.08, bottom: 0.5, speed: 1.3 },
  scud: { top: 0.35, bottom: 0.95, speed: 1.6 },
};
/** Slower further off. */
const BAND_SPEED = { far: 0.45, mid: 0.7, near: 1 };
/**
 * How much of the sky a whole sky's cover fills with single clouds, counted as
 * the clouds' own pixels on the painting (overlaps counted twice), and the most
 * clouds laid out (Claude's scale, docs/REVIEW.md).
 */
const FILL_PER_COVER = 0.35;
const MOST_CLOUDS = 40;

/**
 * @typedef {Object} SkySpec  What the sky shows for a weather (the rules in content/rules/sky.json).
 * @property {number} level  The cloud level, 0 to 5.
 * @property {string[]} patterns
 * @property {Record<string, string>} palette
 * @property {number} cover  How much of the sky the clouds fill.
 * @property {number} veil  How much of the sun, the moon and the stars shows.
 * @property {number} glints  How much of the water's glints flick.
 * @property {number} sunHides  How much of the time a cloud is over the sun.
 * @property {number} dusk  How much of the night tint the clouds bring.
 * @property {number} drift  How fast the clouds go, times the wind's.
 * @property {boolean} low  Kept low over the horizon.
 * @property {'fog' | 'description' | 'wet' | 'table'} from  Which rule picked the patterns.
 */

/**
 * The tags of a weather: given with it (the art sheet), or its map cell's (fog, snow).
 * @param {{ season?: string, cell?: number, tags?: string[] }} weather
 * @returns {string[]}
 */
export function weatherTags(weather) {
  if (weather.tags) return weather.tags;
  if (!weather.season || typeof weather.cell !== 'number') return [];
  return content.weather[weather.season]?.weathers[weather.cell]?.tags ?? [];
}

/** @param {{ min?: number, max?: number }} range @param {number} level */
const holds = (range, level) => level >= (range.min ?? 0) && level <= (range.max ?? 5);

/**
 * Which patterns show, and how, for a weather in a season: fog first (it hides
 * the sky whatever the level), then a description that names a sky, then rain
 * cloud, then the season's table.
 * @param {{ clouds: number, precipitation?: number, wind?: number, description?: string, season?: string, cell?: number, tags?: string[] }} weather
 * @param {string} season
 * @returns {SkySpec}
 */
export function skySpec(weather, season) {
  const rules = content.rules.sky;
  const level = Math.max(0, Math.min(5, Math.round(weather.clouds ?? 0)));
  const row = rules.levels[level];
  const seasonRules = rules.seasons[season] ?? rules.seasons.spring;
  const base = {
    level,
    palette: seasonRules.palette,
    cover: row.cover,
    veil: row.veil,
    glints: row.glints,
    sunHides: row.sunHides,
    dusk: row.dusk,
    drift: 1,
    low: false,
  };
  if (weatherTags(weather).includes('fog')) {
    const fog = rules.fog.find((/** @type {{ min?: number, max?: number }} */ f) => holds(f, level));
    if (fog) return { ...base, patterns: fog.patterns, cover: 1, veil: fog.veil, glints: Math.min(row.glints, 0.4), sunHides: 0, from: 'fog' };
  }
  const named = weather.description ? rules.descriptions[weather.description] : undefined;
  if (named && holds(named.levels, level)) {
    return {
      ...base,
      patterns: named.patterns,
      drift: named.drift ?? 1,
      low: named.low ?? false,
      sunHides: named.sunHides ?? row.sunHides,
      from: 'description',
    };
  }
  if (level === rules.wet.level && (weather.precipitation ?? 0) >= rules.wet.precipitation) return { ...base, patterns: rules.wet.patterns, from: 'wet' };
  return { ...base, patterns: seasonRules.levels[level], from: 'table' };
}

/** The dusk a cloud level brings (black's, D160), for the tints. @param {number} clouds */
export function cloudDusk(clouds) {
  return content.rules.sky.levels[Math.max(0, Math.min(5, Math.round(clouds ?? 0)))].dusk;
}

/**
 * @typedef {{ pattern: string, band: Band, variant: number, x: number, y: number, w: number, h: number, speed: number }} PlacedCloud
 *   `x`, `y`: the top left, in the painting's pixels; `speed`: times the wind's drift.
 */

/**
 * Lays a sky out: a backdrop if the patterns have one, and single clouds
 * scattered (more of them, smaller and flatter, towards the horizon), as many
 * as the spec's cover asks; over a backdrop, only a few, for movement.
 * @param {SkySpec} spec
 * @param {() => number} rand  The scenery stream.
 * @param {number} horizon  The painting's horizon row.
 * @param {(pattern: string, band: Band, variant: number) => CloudGrid} gridOf  The painted grid (cached by the caller).
 * @returns {{ backdrop: string | null, clouds: PlacedCloud[] }}
 */
export function layOutSky(spec, rand, horizon, gridOf) {
  const full = spec.patterns.filter((id) => CLOUD_PATTERNS[id]?.full);
  const single = spec.patterns.filter((id) => CLOUD_PATTERNS[id] && !CLOUD_PATTERNS[id].full);
  const backdrop = full.length ? full[Math.floor(rand() * full.length)] : null;
  /** @type {PlacedCloud[]} */
  const clouds = [];
  if (!single.length) return { backdrop, clouds };
  // Over a backdrop a couple, for movement; otherwise clouds until they fill what the cover asks.
  const most = backdrop ? 1 + Math.floor(rand() * 2) : MOST_CLOUDS;
  const fill = spec.cover * FILL_PER_COVER * between(rand, 0.8, 1.2) * SKY_W * horizon;
  let filled = 0;
  for (let i = 0; i < most && (backdrop || filled < fill); i++) {
    const pattern = single[Math.floor(rand() * single.length)];
    const place = PLACE[CLOUD_PATTERNS[pattern].kind];
    let top = place.top;
    let bottom = place.bottom;
    if (spec.low) top = Math.max(top, 0.6);
    // Leaning towards the horizon, so more of them sit far off.
    const f = top + (bottom - top) * rand() ** 0.75;
    /** @type {Band} */
    let band = f > 0.72 ? 'far' : f > 0.42 ? 'mid' : 'near';
    // A towering heap is big even far off: never near, or it would stand taller than the sky.
    if (CLOUD_PATTERNS[pattern].kind === 'tower') band = band === 'far' && rand() < 0.5 ? 'far' : 'mid';
    const variant = Math.floor(rand() * 3);
    const grid = gridOf(pattern, band, variant);
    const baseY = Math.round(f * horizon);
    filled += grid.data.reduce((n, t) => n + (t > 0 ? 1 : 0), 0);
    clouds.push({
      pattern,
      band,
      variant,
      x: Math.floor(rand() * (SKY_W + grid.w)) - grid.w,
      y: baseY - grid.h,
      w: grid.w,
      h: grid.h,
      speed: place.speed * BAND_SPEED[band] * between(rand, 0.85, 1.15),
    });
  }
  // Far ones first, so nearer clouds are drawn over them.
  clouds.sort((a, b) => a.y + a.h - (b.y + b.h));
  return { backdrop, clouds };
}

/**
 * How fast the clouds drift, in pixels a second, before each cloud's own
 * share: a little even in still air, more with each level of wind.
 * @param {number} wind @param {number} drift  The spec's.
 */
export function driftSpeed(wind, drift) {
  return (0.3 + Math.max(0, wind) * 0.55) * drift;
}
