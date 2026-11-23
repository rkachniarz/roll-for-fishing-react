// @ts-check
// Clouds that follow the weather (12.5, D170): a library of cloud types, each
// with two or three patterns drawn as code, and the rules that pick which of
// them show (content/rules/sky.json). Pure numbers and pixel grids, no PixiJS,
// so the tests can paint every pattern; src/scene/sky-layer.js turns the grids
// into sprites, made once and cached, and drifts them in whole pixels.
//
// The shapes come from photographs on Wikimedia Commons (references only,
// never traced or shipped; docs/sources.md lists them): fair-weather heaps with
// flat grey bases and lit, bumpy tops, smaller and flatter towards the horizon;
// towering heaps stacked like cauliflower over a dark base; lumpy grey layers
// (stratocumulus); high wisps and hooked mares' tails (cirrus); flat grey
// sheets (stratus); rain cloud with curtains of rain under a dark base
// (nimbostratus); and the heavy dark rolls of a storm overcast. The owner's
// photos give the overcast of a dry spring or summer day: a deck of soft
// grey or bright white cells, smaller towards the horizon, with blue here and
// there between them.
//
// A grid holds tones, 0 for nothing and 1 (lightest) to 4 (darkest); the
// season's palette over a pattern's ramp gives the colours. Randomness comes
// from the `rand` given: the scenery stream (D4).
//
// Trap: Cloud pattern ids are named in `content/rules/sky.json`: never rename one without changing
// both. A description that mentions cloud or sky needs its own case there (a test checks).
//  `skySpec` picks fog first (a weather tagged `fog` hides the sky), then a description that names
//   a sky (keyed by its string key), then rain cloud, then the season's table; it reads the
//   weather's `description` and `cell` as the engine keeps them, the art sheet passes `tags`
//   instead. A sky-wide pattern goes under the sun and the moon (they show through as much as
//   `veil` says), single clouds over them. Cloud grids depend only on the scenery stream and are
//   cached per session. Black (clouds 5) brings `dusk` through the night tint (`cloudDusk` in
//   `src/scene/sky.js`). The special sky (D173) shows only for `sky: 'special'`, the blood moon
//   (D174) for `sky: 'blood'` at a full moon (`isBloodMoon`), the green sun (D175) for `sky:
//   'green'` in summer with clouds and rain at 0 (`isGreenSun`): only the art sheet sets them.

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
 * @typedef {'white' | 'grey' | 'ceiling' | 'storm'} Ramp
 * @typedef {'heap' | 'tower' | 'mass' | 'layer' | 'wisp' | 'scud' | 'sheet' | 'deck' | 'rain' | 'storm' | 'fog' | 'special'} Kind
 * @typedef {{ x: number, y: number, r: number, ry?: number }} Puff  A round lump: centre and radius, in units.
 */

/**
 * How much bigger the sky's things are drawn than 12.4 and 12.5 first drew
 * them: the clouds, the sky-wide patterns' lumps and rolls, the sun and the
 * moon (the owner: "everything except the stars appears too small"). Derived
 * from the still water's old summer clouds (about 120 x 35 px over the same
 * 110 rows of sky) and the owner's photo of heaped cloud over distant trees,
 * which both say 3 to 5; 3 is the low end, so it errs small (docs/sources.md).
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
 * A sky-wide grid from a function giving each pixel a lightness (higher is
 * lighter): tones by threshold, dithered at their seams by `seam` (0: clean
 * edges, no scattered pixels at all).
 * @param {number} h @param {(x: number, y: number) => number} light @param {number} [seam]
 * @returns {CloudGrid}
 */
function fullSky(h, light, seam = 0.18) {
  const w = SKY_W;
  const data = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = light(x, y) + (dither(x, y) - 0.5) * seam;
      data[y * w + x] = s > 0.62 ? 1 : s > 0.36 ? 2 : s > 0.1 ? 3 : 4;
    }
  }
  return { w, h, data };
}

/**
 * Smooth value noise across the sky's full width that wraps seamlessly at its
 * edges, -1 to 1: `across` cells over the 320 pixels, `cy` pixels a cell down.
 * @param {() => number} rand @param {number} across @param {number} cy @param {number} h  Rows it must cover.
 * @returns {(x: number, y: number) => number}
 */
function wrapNoise(rand, across, cy, h) {
  const gw = across;
  const gh = Math.ceil(h / cy) + 2;
  const g = Float32Array.from({ length: gw * gh }, () => rand() * 2 - 1);
  const cx = SKY_W / across;
  /** @param {number} t */
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = (((x / cx) % gw) + gw) % gw;
    const fy = Math.max(0, Math.min(gh - 1.001, y / cy));
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = smooth(fx - ix);
    const ty = smooth(fy - iy);
    const jx = (ix + 1) % gw;
    const at = (/** @type {number} */ i, /** @type {number} */ j) => g[j * gw + i];
    const top = at(ix, iy) + (at(jx, iy) - at(ix, iy)) * tx;
    const bottom = at(ix, iy + 1) + (at(jx, iy + 1) - at(ix, iy + 1)) * tx;
    return top + (bottom - top) * ty;
  };
}

/**
 * Layers of wrapping noise, each twice as fine and half as strong, -1 to 1
 * (about): soft, irregular, with nothing that repeats across the sky.
 * @param {() => number} rand @param {number} across  The coarsest layer's cells over the width.
 * @param {number} cy  Its cells' height. @param {number} h @param {number} octaves
 * @returns {(x: number, y: number) => number}
 */
function fbm(rand, across, cy, h, octaves) {
  const layers = Array.from({ length: octaves }, (_, i) => wrapNoise(rand, across * 2 ** i, cy / 2 ** i, h));
  const total = layers.reduce((sum, _, i) => sum + 0.5 ** i, 0);
  return (x, y) => layers.reduce((sum, n, i) => sum + n(x, y) * 0.5 ** i, 0) / total;
}

/** How far the sky-wide patterns dither where two tones meet: a little, never a spray (the owner). */
const SEAM = 0.06;

/**
 * The noise under every sky-wide pattern (the owner's photo of an overcast
 * sky): soft blotches and the pale ridges between them, warped so no wave
 * shows, wrapping across the 320 pixels. Rows are counted in depth, a gentle
 * perspective (up to twice as squashed at the horizon). Each gives -1 to 1
 * (`blotch`) and 0 to 1 (`ridge`).
 * @param {() => number} rand @param {number} h @param {number} cells  The coarsest cells across.
 * @param {number} [stretch]  How much wider than tall the cells are: more for long rolls.
 * @returns {(x: number, y: number) => { blotch: number, ridge: number }}
 */
function skyNoise(rand, h, cells, stretch = 2.2) {
  const deep = 1.5 * h;
  /** @param {number} y */
  const depth = (y) => y + (0.5 * y * y) / h;
  const cy = SKY_W / cells / stretch;
  const warpX = fbm(rand, 3, deep / 2, deep, 2);
  const warpY = fbm(rand, 4, deep / 3, deep, 2);
  const blotch = fbm(rand, cells, cy, deep, 2);
  const vein = fbm(rand, cells + 1, cy * 0.8, deep, 2);
  const slant = between(rand, -0.6, 0.6);
  return (x, y) => {
    const d = depth(y);
    const wx = x + 14 * warpX(x, d) + slant * d;
    const wy = d + 5 * warpY(x, d);
    return { blotch: blotch(wx, wy), ridge: Math.max(0, 1 - Math.abs(vein(wx, wy)) * 2.5) };
  };
}

/**
 * A grey ceiling of cloud (the owner's photo of an overcast sky): broad soft
 * blotches of darker and paler grey, pale veins wandering through them on a
 * slant, darker low down.
 * @param {() => number} rand @param {number} h @param {{ veins: number, blotch: number, cells: number }} o
 *   `veins`: how strong the pale veins are; `blotch`: the dark blotches; `cells`: the coarsest cells across.
 * @returns {CloudGrid}
 */
function overcast(rand, h, o) {
  const noise = skyNoise(rand, h, o.cells);
  return fullSky(
    h,
    (x, y) => {
      const n = noise(x, y);
      return 0.4 + o.veins * n.ridge + o.blotch * n.blotch - 0.2 * (y / h) ** 1.5;
    },
    SEAM,
  );
}

/**
 * A deck of cloud cells over the whole sky, blue showing through here and
 * there (the owner's photos of a dry overcast in spring and summer): rows of
 * soft cells, each lit from above and a little from the left, smaller and
 * flatter row by row towards the horizon; between them the deck's shaded
 * underside, or, where a broad noise thins the deck, the sky. Rows wrap
 * across the 320 pixels, each a whole number of cells.
 * @param {() => number} rand @param {number} h
 * @param {{ top: number, bottom: number, aspect: number, holes: number, solid: number, contrast: number, bright: number, gap: number, cells: number, broad: number }} o
 *   `top`, `bottom`: a row's height at the top of the sky and at the horizon, in pixels; `aspect`: a cell's width over
 *   its row's height; `holes`: how much of the deck opens to the sky (-1 none, 1 all); `solid`: how far into a cell a
 *   hole can eat (less is further); `contrast`: how much the light shapes a cell; `bright`: lifts every tone;
 *   `gap`: the shaded underside's lightness; `cells`: the hole noise's coarsest cells across; `broad`: how much broad
 *   paler and darker stretches show across the deck.
 * @returns {CloudGrid}
 */
function deck(rand, h, o) {
  /** @type {{ y: number, rh: number, puffs: { x: number, y: number, rx: number, ry: number }[] }[]} */
  const rows = [];
  for (let y = -o.top * 0.4; y < h + o.bottom; ) {
    const v = Math.max(0, y / h);
    const rh = o.bottom + (o.top - o.bottom) * (1 - v) ** 1.6;
    const n = Math.max(3, Math.round(SKY_W / (rh * o.aspect)));
    const cw = SKY_W / n;
    const shift = rand() * cw;
    const puffs = Array.from({ length: n }, (_, i) => ({
      x: shift + i * cw + (rand() - 0.5) * cw * 0.5,
      y: y + rh / 2 + (rand() - 0.5) * rh * 0.35,
      rx: cw * between(rand, 0.5, 0.72),
      ry: rh * between(rand, 0.55, 0.8),
    }));
    rows.push({ y: y + rh / 2, rh, puffs });
    y += rh * between(rand, 0.75, 0.95);
  }
  const thin = skyNoise(rand, h, o.cells, 1.6);
  const broad = skyNoise(rand, h, 3, 2);
  const grain = wrapNoise(rand, 40, 3, h);
  const w = SKY_W;
  const data = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const near = rows.filter((r) => Math.abs(r.y - y) < r.rh * 1.3);
    // Low down the deck closes up and its cells go too small for grain.
    const v = y / h;
    const close = 0.6 * v * v;
    const fine = 0.12 * (1 - v);
    for (let x = 0; x < w; x++) {
      let best = null;
      let bestD = Infinity;
      for (const row of near) {
        for (const p of row.puffs) {
          let dx = (((x + 0.5 - p.x) % w) + w) % w;
          if (dx > w / 2) dx -= w;
          const d = Math.hypot(dx / p.rx, (y + 0.5 - p.y) / p.ry);
          if (d < bestD) {
            bestD = d;
            best = { nx: dx / p.rx, ny: (y + 0.5 - p.y) / p.ry };
          }
        }
      }
      const inCell = best && bestD < 1;
      const open = thin(x, y).blotch + close + (inCell ? (1 - bestD) * o.solid : 0) + (dither(x, y) - 0.5) * 0.05;
      if (open < o.holes) continue;
      const tone = o.broad * broad(x, y).blotch + fine * grain(x, y);
      let s;
      if (inCell && best) {
        const lit = -best.ny * 0.75 - best.nx * 0.35;
        s = 0.55 + o.bright + lit * o.contrast - bestD * bestD * 0.25 + tone;
      } else s = o.gap + 0.35 * v + tone;
      // Over the horizon the cells run together into a pale haze.
      const haze = Math.max(0, (v - 0.8) / 0.2);
      s = s + (0.3 - s) * haze * haze + (dither(x, y) - 0.5) * SEAM * 2;
      data[y * w + x] = s > 0.45 ? 1 : s > 0.05 ? 2 : s > -0.35 ? 3 : 4;
    }
  }
  return { w, h, data };
}

/**
 * The special sky's colours, [r, g, b, alpha], by tone (tone 1 first): three
 * greys of thin film, faint to a bright sheen, then the colours of a thin
 * film thickening (Newton's series), first order to third, paler as they go.
 * Partly see-through, so the sky and the stars show behind; drawn untinted,
 * as the magic has its own light.
 */
export const FILM = [
  [150, 160, 186, 60],
  [186, 194, 214, 110],
  [226, 232, 244, 175],
  // First order: straw, orange, red, magenta.
  [206, 178, 112, 200],
  [224, 130, 60, 210],
  [198, 64, 70, 215],
  [168, 54, 132, 215],
  // Second order: violet, blue, sky blue, green, yellow, orange, rose.
  [110, 64, 176, 215],
  [60, 102, 208, 215],
  [64, 170, 200, 210],
  [98, 192, 112, 205],
  [214, 206, 98, 200],
  [228, 140, 84, 200],
  [200, 84, 154, 205],
  // Third order, paler: purple, teal, green, pink.
  [136, 96, 190, 190],
  [86, 170, 178, 185],
  [126, 200, 150, 180],
  [222, 144, 180, 180],
];
/** Where the film's colour starts: a tone of FILM past the three greys. */
const FILM_HUES = 3;
/** How much thicker the film gets from one colour to the next. */
const FILM_STEP = 0.07;

/**
 * The magic of the land in the sky (the special sky, D173): a film like
 * isopropyl alcohol drying on a guitar's black finish (the owner's photo).
 * Long smears brushed across the sky on a slant, the slant bending slowly;
 * hairline streaks along them in a grey sheen; and where the film pools,
 * bands of colour ring on ring as it thickens, striped along the smears.
 * In `mottle`'s patches the film has dried in spots, a speckle of colour.
 * Wraps across the 320 pixels: every noise wraps, and the slant only shears.
 * @param {() => number} rand @param {number} h
 * @param {{ pools: number, size: [number, number], cover: number, mottle: number, thick: number }} o
 *   `pools`: how many places the film pools; `size`: their length along the smear and width across it, in pixels;
 *   `cover`: how much of the sky the film covers (about, -1 to 1); `mottle`: how many speckled patches;
 *   `thick`: how far into the colours the pools go.
 * @returns {CloudGrid}
 */
function film(rand, h, o) {
  const side = rand() < 0.5 ? -1 : 1;
  const k0 = side * between(rand, 1.1, 1.8);
  const bend = fbm(rand, 2, h, h, 2);
  /** The smear's shear at a pixel: x + shear * y is constant along a smear. @param {number} x @param {number} y */
  const shear = (x, y) => k0 + 0.7 * bend(x, y);
  const streak = fbm(rand, 44, h * 0.9, h, 2);
  const hair = wrapNoise(rand, 120, h * 0.6, h);
  const broad = fbm(rand, 3, h * 0.7, h, 2);
  const speck = wrapNoise(rand, 70, 4, h);
  const speckFine = wrapNoise(rand, 150, 2, h);
  // Along a smear, and across it: unit vectors.
  const len = Math.hypot(k0, 1);
  const along = [-k0 / len, 1 / len];
  const across = [1 / len, k0 / len];
  /** @param {number} n */
  const blobs = (n) =>
    Array.from({ length: n }, () => ({
      x: rand() * SKY_W,
      y: between(rand, 0.1, 0.75) * h,
      a: between(rand, o.size[0] * 0.6, o.size[0]),
      b: between(rand, o.size[1] * 0.6, o.size[1]),
      peak: between(rand, 0.75, 1.1),
    }));
  const pools = blobs(o.pools);
  const spots = blobs(o.mottle).map((s) => ({ ...s, a: s.a * 0.6, b: Math.max(14, s.b * 1.6) }));
  /** How far into a list of blobs a pixel lies, 0 to about 1. @param {ReturnType<typeof blobs>} list @param {number} x @param {number} y */
  const inside = (list, x, y) => {
    let most = 0;
    for (const p of list) {
      let dx = (((x - p.x) % SKY_W) + SKY_W) % SKY_W;
      if (dx > SKY_W / 2) dx -= SKY_W;
      const dy = y - p.y;
      const u = (dx * along[0] + dy * along[1]) / p.a;
      const v = (dx * across[0] + dy * across[1]) / p.b;
      most = Math.max(most, p.peak * Math.exp(-(u * u + v * v)));
    }
    return most;
  };
  const w = SKY_W;
  const data = new Uint8Array(w * h);
  const hues = FILM.length - FILM_HUES;
  for (let y = 0; y < h; y++) {
    const v = y / h;
    // The film thins out over the horizon, so it never sits flat on the land.
    const low = Math.max(0, (v - 0.78) / 0.22);
    for (let x = 0; x < w; x++) {
      const sx = x + shear(x, y) * y;
      const s = streak(sx, y);
      const ridge = Math.max(0, 1 - Math.abs(s) * 3.2);
      const fine = Math.max(0, 1 - Math.abs(hair(sx, y)) * 4);
      const pool = inside(pools, x, y) * (0.8 + 0.3 * ridge + 0.08 * s);
      const there = o.cover + 0.55 * broad(x + 0.4 * shear(x, y) * y, y) + 0.35 * s + 0.6 * pool - 1.2 * low * low;
      if (there <= 0) continue;
      const spot = inside(spots, x, y);
      let t = o.thick * pool + 0.08 * ridge;
      if (spot > 0.12) t += Math.min(1, spot * 1.4) * (0.45 * speck(x, y) + 0.25 * speckFine(x, y) + 0.3);
      t += (dither(x, y) - 0.5) * 0.02;
      let tone;
      if (t < 0.3) {
        const sheen = 0.6 * ridge + 0.45 * fine + 0.4 * Math.min(1, there * 2);
        tone = sheen > 0.95 ? 3 : sheen > 0.6 ? 2 : 1;
      } else {
        // Past the first two orders the colours come round again, the third order's.
        let i = Math.floor((t - 0.3) / FILM_STEP);
        if (i >= hues) i = hues - 4 + ((i - hues) % 4);
        tone = FILM_HUES + 1 + i;
      }
      data[y * w + x] = tone;
    }
  }
  return { w, h, data };
}

/**
 * Smooth value noise, -1 to 1, over a lattice `cx` by `cy` pixels a cell
 * (stretch one to streak it), from `rand`. For x and y from -room to w + room
 * and h + room; past that it holds its last value.
 * @param {() => number} rand @param {number} w @param {number} h @param {number} cx @param {number} cy
 * @param {number} [room]  Pixels it reaches past each edge, for a cloud painted with room round it (paintDensity).
 * @returns {(x: number, y: number) => number}
 */
function valueNoise(rand, w, h, cx, cy, room = 0) {
  const gw = Math.ceil((w + 2 * room) / cx) + 2;
  const gh = Math.ceil((h + 2 * room) / cy) + 2;
  const g = Float32Array.from({ length: gw * gh }, () => rand() * 2 - 1);
  /** @param {number} t */
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = Math.max(0, (x + room) / cx);
    const fy = Math.max(0, (y + room) / cy);
    const ix = Math.min(gw - 2, Math.floor(fx));
    const iy = Math.min(gh - 2, Math.floor(fy));
    const tx = smooth(Math.min(1, fx - ix));
    const ty = smooth(Math.min(1, fy - iy));
    const at = (/** @type {number} */ i, /** @type {number} */ j) => g[j * gw + i];
    const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * tx;
    const bottom = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * tx;
    return top + (bottom - top) * ty;
  };
}

/** How far towards the light a cloud's shade is looked for (in light steps), and how much each counts. */
const REACH = [
  [1, 0.4],
  [2, 0.3],
  [4, 0.2],
  [7, 0.1],
];

/**
 * How much room, in units, a cloud from a density is painted with past the
 * box it is shaped in. Its own shape thins it out there, and a fade spread
 * over the room catches what is left, so no outline runs along an edge of the
 * box: a broken mass whose noise ran thick to the edge was cut off straight.
 */
const ROOM = 10;

/**
 * A cloud from a density, cloud wherever it is above 0: lit where the density
 * falls away towards the light (above and a little to the left), so tops and
 * upper rims shine and the undersides of thick parts go grey; darker towards
 * the bottom; frayed in a dither where the density is thin. Holes of sky open
 * wherever the density dips, as in a broken mass of cloud.
 * @param {number} bw @param {number} bh  The box it is shaped in, in pixels; it may spread ROOM past it.
 * @param {(x: number, y: number) => number} given  The density, in the box's pixels; asked for up to ROOM past its edges.
 * @param {number} scale  Pixels per unit, for the light's reach and the room.
 * @param {{ under?: number, bright?: number, rag?: number, contrast?: number, openBottom?: boolean }} [opts]
 *   `openBottom`: the base runs to the box's bottom edge (a bank on the horizon); every other edge has room.
 * @returns {CloudGrid}
 */
function paintDensity(bw, bh, given, scale, opts = {}) {
  const room = Math.ceil(ROOM * scale);
  const w = bw + 2 * room;
  const h = bh + (opts.openBottom ? room : 2 * room);
  /** @param {number} x @param {number} y */
  const density = (x, y) => {
    // 0 a room's width in from the edge, rising to 3 at it: gentle at first, so the outline keeps the density's shape.
    const edge = Math.min(x, w - x, y, opts.openBottom ? Infinity : h - y);
    const t = Math.max(0, 1 - edge / room);
    return given(x - room, y - room) - t * t * 3;
  };
  const under = opts.under ?? 0.6;
  const bright = opts.bright ?? 0;
  const rag = opts.rag ?? 0.12;
  const contrast = opts.contrast ?? 0.6;
  const lx = -0.5 * scale;
  const ly = -1.2 * scale;
  const data = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = density(x + 0.5, y + 0.5);
      if (d <= 0) continue;
      if (d < rag && dither(x, y) > d / rag) continue;
      // Shadowed by the cloud between it and the light: tops shine, bellies go grey.
      let shade = 0;
      for (const [k, wgt] of REACH) shade += wgt * Math.max(0, Math.min(1, density(x + 0.5 + lx * k, y + 0.5 + ly * k) * 3));
      const depth = bh > 1 ? Math.max(0, Math.min(1, (y - room) / (bh - 1))) : 0.5;
      const s = 0.62 + bright - shade * contrast - depth * under + (dither(x, y) - 0.5) * 0.22;
      data[y * w + x] = s > 0.45 ? 1 : s > 0.05 ? 2 : s > -0.35 ? 3 : 4;
    }
  }
  // Trim empty rows and columns, so the cloud's size is what shows.
  let left = w;
  let right = -1;
  let top = h;
  let bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!data[y * w + x]) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < 0) return { w: 1, h: 1, data: new Uint8Array([2]) };
  const tw = right - left + 1;
  const th = bottom - top + 1;
  const out = new Uint8Array(tw * th);
  for (let y = 0; y < th; y++) out.set(data.subarray((y + top) * w + left, (y + top) * w + left + tw), y * tw);
  return { w: tw, h: th, data: out };
}

/**
 * Grows lumps on lumps, upwards, as a heap boils up: each new one sits on the
 * upper side of one already there, chosen among the highest near the
 * column's core, a little smaller. Lopsided by nature: the core sits off
 * centre and leans, and no two growths are alike.
 * @param {() => number} rand @param {Puff[]} puffs  The base, grown in place; y up is negative, the base at 0.
 * @param {{ count: number, core: number, lean: number, shrink: [number, number], tallest: number, spread?: number, least?: number }} o
 *   `core`: x where the column rises; `lean`: how far it drifts sideways per unit up;
 *   `tallest`: no lump reaches higher; `spread`: how wide the angles of growth; `least`: the smallest radius.
 */
function growLumps(rand, puffs, o) {
  const spread = o.spread ?? 0.9;
  for (let k = 0, tries = 0; k < o.count && tries < o.count * 6; tries++) {
    // Two candidates; the higher near the (leaning) column wins, with chance enough that lumps fill out the sides too.
    let parent = puffs[Math.floor(rand() * puffs.length)];
    let best = Infinity;
    for (let c = 0; c < 2; c++) {
      const p = puffs[Math.floor(rand() * puffs.length)];
      const off = Math.abs(p.x - (o.core - o.lean * p.y));
      const score = p.y - p.r + off * 0.9 + rand() * 5;
      if (score < best) {
        best = score;
        parent = p;
      }
    }
    const angle = -Math.PI / 2 + Math.atan(o.lean) + between(rand, -spread, spread);
    const r = Math.max(o.least ?? 1.6, parent.r * between(rand, o.shrink[0], o.shrink[1]));
    const dist = parent.r * between(rand, 0.5, 0.85);
    const child = { x: parent.x + Math.cos(angle) * dist, y: Math.min(-r * 0.5, parent.y + Math.sin(angle) * dist), r };
    if (child.y - child.r < -o.tallest) continue;
    puffs.push(child);
    k++;
  }
  return puffs;
}

/** A row of uneven lumps on a flat base, `n` of them from x 0. @param {() => number} rand @param {number} n @param {[number, number]} size @param {[number, number]} step */
function baseRow(rand, n, size, step) {
  const puffs = [];
  let x = 0;
  for (let i = 0; i < n; i++) {
    const r = between(rand, size[0], size[1]) * (i === 0 || i === n - 1 ? 0.75 : 1);
    puffs.push({ x, y: -r * 0.45, r });
    x += between(rand, step[0], step[1]);
  }
  return puffs;
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

/** A broad heap on a flat base, its top boiled up into uneven bumps, higher on one side. @param {() => number} rand @returns {Puff[]} */
function heapLong(rand) {
  const n = 4 + Math.floor(rand() * 3);
  const puffs = baseRow(rand, n, [2.6, 4], [3.2, 4.4]);
  const width = puffs[puffs.length - 1].x;
  return growLumps(rand, puffs, {
    count: 4 + Math.floor(rand() * 5),
    core: width * between(rand, 0.2, 0.8),
    lean: between(rand, -0.3, 0.3),
    shrink: [0.75, 1],
    tallest: between(rand, 8, 12),
    spread: 1.2,
  });
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

/**
 * A towering heap (Cumulus congestus): an uneven base and one column boiled
 * up off centre, leaning, cauliflower lumps on lumps. @param {() => number} rand @returns {Puff[]}
 */
function towerTall(rand) {
  const puffs = baseRow(rand, 3 + Math.floor(rand() * 3), [4, 6], [4, 6]);
  const width = puffs[puffs.length - 1].x;
  return growLumps(rand, puffs, {
    count: 22 + Math.floor(rand() * 14),
    core: width * between(rand, 0.25, 0.75),
    lean: between(rand, -0.35, 0.35),
    shrink: [0.82, 1.02],
    tallest: between(rand, 19, 25),
    spread: 0.85,
    least: 2.6,
  });
}

/** A broad towering heap with two turrets of different heights, each leaning its own way. @param {() => number} rand @returns {Puff[]} */
function towerTwin(rand) {
  const puffs = baseRow(rand, 5 + Math.floor(rand() * 3), [3.6, 5.2], [3.8, 5.4]);
  const width = puffs[puffs.length - 1].x;
  const first = between(rand, 0.1, 0.4);
  for (const [at, tallest, count] of [
    [first, between(rand, 11, 17), 10 + Math.floor(rand() * 6)],
    [first + between(rand, 0.35, 0.55), between(rand, 16, 23), 14 + Math.floor(rand() * 8)],
  ]) {
    growLumps(rand, puffs, { count, core: width * at, lean: between(rand, -0.35, 0.35), shrink: [0.82, 1.02], tallest, spread: 0.8, least: 2.4 });
  }
  return puffs;
}

/**
 * A lopsided towering heap: a short base, the column sheared over to one side
 * by the wind higher up, a shoulder of smaller lumps on the other. @param {() => number} rand @returns {Puff[]}
 */
function towerSheared(rand) {
  const side = rand() < 0.5 ? -1 : 1;
  const puffs = baseRow(rand, 3 + Math.floor(rand() * 2), [3.2, 4.8], [3.4, 5]);
  const width = puffs[puffs.length - 1].x;
  growLumps(rand, puffs, { count: 5 + Math.floor(rand() * 4), core: side < 0 ? width : 0, lean: 0, shrink: [0.7, 0.9], tallest: between(rand, 7, 10), spread: 1.1, least: 2 });
  return growLumps(rand, puffs, {
    count: 18 + Math.floor(rand() * 10),
    core: width * (side < 0 ? 0.65 : 0.35),
    lean: side * between(rand, 0.5, 0.8),
    shrink: [0.84, 1.02],
    tallest: between(rand, 16, 22),
    spread: 0.7,
    least: 2.6,
  });
}

// ---------- The broken masses, as densities (the owner's photo of a mostly cloudy sky) ----------

/**
 * A broad broken mass of heaped cloud, ragged all round, with holes of sky
 * through it and lumps breaking off its edges: the mostly cloudy sky's main
 * cloud. @param {() => number} rand @param {number} scale @returns {CloudGrid}
 */
function massBroken(rand, scale) {
  const W = between(rand, 34, 56) * scale;
  const H = between(rand, 15, 22) * scale;
  const w = Math.ceil(W);
  const h = Math.ceil(H);
  const big = valueNoise(rand, w, h, 8 * scale, 6 * scale, ROOM * scale);
  const small = valueNoise(rand, w, h, 3.2 * scale, 2.6 * scale, ROOM * scale);
  const fine = valueNoise(rand, w, h, 1.5 * scale, 1.3 * scale, ROOM * scale);
  // The mass sits heavier on one side and its top rises and falls.
  const heavy = between(rand, 0.3, 0.7);
  const tilt = between(rand, -0.25, 0.25);
  return paintDensity(
    w,
    h,
    (x, y) => {
      const u = (x / W - heavy) / (x / W < heavy ? heavy : 1 - heavy);
      const v = (y / H - 0.55 - tilt * (x / W - 0.5)) / 0.5;
      const envelope = 1 - u * u - v * v;
      return 0.6 * envelope + 0.45 * big(x, y) + 0.24 * small(x, y) + 0.1 * fine(x, y) - 0.14;
    },
    scale,
    { under: 0.45, bright: 0.12 },
  );
}

/**
 * A low grey bank, tall and dark, its top lumpy and lit, its base fraying
 * into the haze over the horizon (the photo's lower right). @param {() => number} rand @param {number} scale @returns {CloudGrid}
 */
function massBank(rand, scale) {
  const W = between(rand, 36, 56) * scale;
  const H = between(rand, 12, 18) * scale;
  const w = Math.ceil(W);
  const h = Math.ceil(H);
  const big = valueNoise(rand, w, h, 7 * scale, 5 * scale, ROOM * scale);
  const small = valueNoise(rand, w, h, 3 * scale, 2.4 * scale, ROOM * scale);
  const peak = between(rand, 0.25, 0.75);
  return paintDensity(
    w,
    h,
    (x, y) => {
      const u = (x / W - peak) / (x / W < peak ? peak : 1 - peak);
      const v = 1 - y / H;
      // A dome on the horizon: full at the base, its top falling off to the sides.
      const envelope = 1 - u * u * 0.9 - v * v * 1.5;
      return 0.75 * envelope + 0.35 * big(x, y) + 0.12 * small(x, y) - 0.05;
    },
    scale,
    { under: 0.2, bright: 0.05, contrast: 0.75, openBottom: true },
  );
}

/**
 * Wind-torn streaks: low heaps pulled out long and thin on a slant, fraying
 * at both ends (the photo's lower left). @param {() => number} rand @param {number} scale @returns {CloudGrid}
 */
function massShred(rand, scale) {
  const W = between(rand, 34, 56) * scale;
  const slope = between(rand, -0.22, 0.06);
  const H = (between(rand, 6, 9) + Math.abs(slope) * 50) * scale;
  const w = Math.ceil(W);
  const h = Math.ceil(H);
  const streak = valueNoise(rand, w, h, 9 * scale, 1.3 * scale, ROOM * scale);
  const lump = valueNoise(rand, w, h, 3 * scale, 1.6 * scale, ROOM * scale);
  const y0 = slope < 0 ? H * 0.75 : H * 0.3;
  const bands = 1 + Math.floor(rand() * 2);
  const gap = between(rand, 2.2, 3.4) * scale;
  return paintDensity(
    w,
    h,
    (x, y) => {
      const u = (x / W - 0.5) * 2;
      let near = Infinity;
      for (let b = 0; b < bands; b++) near = Math.min(near, Math.abs(y - (y0 + slope * x - b * gap)));
      const across = 1 - (near / (2.2 * scale)) ** 2;
      return 0.5 * across + 0.4 * streak(x, y) + 0.25 * lump(x, y) - 0.25 * u * u - 0.05;
    },
    scale,
    { under: 0.3, bright: 0.15, rag: 0.18 },
  );
}

/** A lumpy grey roll: flattened lumps in a row, piled up two or three deep in places (stratocumulus). @param {() => number} rand @returns {Puff[]} */
function layerRoll(rand) {
  const n = 7 + Math.floor(rand() * 5);
  const puffs = [];
  let x = 0;
  for (let i = 0; i < n; i++) {
    const r = between(rand, 3.2, 4.8) * (i < 2 || i > n - 3 ? 0.7 : 1);
    puffs.push({ x, y: between(rand, -1, 1), r, ry: r * 0.72 });
    x += between(rand, 3.2, 4.6);
  }
  return growLumps(rand, puffs, { count: n, core: x * between(rand, 0.3, 0.7), lean: between(rand, -0.3, 0.3), shrink: [0.8, 1.05], tallest: between(rand, 9, 13), spread: 1.3, least: 2.4 });
}

/** Grey cells in a row with gaps of sky between, each a little heap of its own height. @param {() => number} rand @returns {Puff[]} */
function layerCells(rand) {
  const cells = 3 + Math.floor(rand() * 3);
  const puffs = [];
  let x = 0;
  for (let c = 0; c < cells; c++) {
    const lumps = 2 + Math.floor(rand() * 2);
    const cell = [];
    for (let i = 0; i < lumps; i++) {
      const r = between(rand, 2.8, 4.2);
      cell.push({ x, y: between(rand, -0.8, 0.8), r, ry: r * 0.8 });
      x += between(rand, 2.8, 3.8);
    }
    const left = cell[0].x;
    growLumps(rand, cell, { count: 1 + Math.floor(rand() * 4), core: between(rand, left, x), lean: 0, shrink: [0.7, 0.95], tallest: between(rand, 5, 10), spread: 1.2, least: 2 });
    puffs.push(...cell);
    x += between(rand, 2.5, 4.5);
  }
  return puffs;
}

/** A low roll, dark beneath, thicker in the middle than at its ends. @param {() => number} rand @returns {Puff[]} */
function layerLow(rand) {
  const n = 9 + Math.floor(rand() * 7);
  const puffs = [];
  let x = 0;
  for (let i = 0; i < n; i++) {
    const r = between(rand, 2.2, 3.4) * (0.7 + 0.5 * Math.sin((Math.PI * (i + 0.5)) / n));
    puffs.push({ x, y: between(rand, -0.5, 0.5), r, ry: r * 0.7 });
    x += between(rand, 2.6, 3.4);
  }
  return growLumps(rand, puffs, { count: Math.floor(n / 2), core: x / 2, lean: between(rand, -0.2, 0.2), shrink: [0.75, 1], tallest: between(rand, 6, 9), spread: 1.4, least: 1.8 });
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
 * @typedef {{ kind: Kind, ramp: Ramp, full?: boolean, open?: boolean, glow?: boolean, place?: { top: number, bottom: number, speed: number },
 *   paint: (rand: () => number, band: Band, h: number) => CloudGrid }} CloudPattern
 *   `full`: a backdrop over the whole sky, `h` rows tall; the others are single clouds, `h` unused.
 *   `open`: a backdrop with sky showing through it, drawn over the sun and the moon like a single cloud.
 *   `glow`: its own light: drawn in FILM's colours by tone (not its ramp's), see-through, never tinted by the hour.
 *   `place`: where it sits, if not where its kind does (PLACE).
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
  'tower-c': { kind: 'tower', ramp: 'white', paint: (rand, band) => paintPuffs(towerSheared(rand), SCALE[band === 'near' ? 'mid' : band] * 0.85, { flat: true, under: 1.05, bright: 0.12 }) },
  // Broken masses: the mostly cloudy sky (the owner's photo), drawn from noise so no two outlines match.
  // Near ones at the mid size, or they would fill the sky alone.
  'mass-a': { kind: 'mass', ramp: 'white', paint: (rand, band) => massBroken(rand, SCALE[band === 'near' ? 'mid' : band] * (band === 'near' ? 1.25 : 1)) },
  // Its base is cut flat, so it stands on the horizon, never over it, or the cut would show in the sky.
  'mass-b': { kind: 'mass', ramp: 'grey', place: { top: 1, bottom: 1, speed: 0.6 }, paint: (rand, band) => massBank(rand, SCALE[band === 'near' ? 'mid' : band]) },
  'mass-c': { kind: 'mass', ramp: 'white', paint: (rand, band) => massShred(rand, SCALE[band]) },
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
  // Flat grey sheets (stratus), the owner's photo of an overcast sky: broad soft blotches, pale streaks, darker low down.
  'sheet-a': {
    kind: 'sheet',
    ramp: 'ceiling',
    full: true,
    paint: (rand, _band, h) => overcast(rand, h, { veins: 0.22, blotch: 0.4, cells: 4 }),
  },
  // The same ceiling in smaller, busier blotches, with fewer pale streaks.
  'sheet-b': {
    kind: 'sheet',
    ramp: 'ceiling',
    full: true,
    paint: (rand, _band, h) => overcast(rand, h, { veins: 0.15, blotch: 0.45, cells: 5 }),
  },
  // A dry overcast, blue here and there (the owner's photos, spring and summer). Soft grey cells, large and
  // low in contrast, the deck thinning to blue-grey holes in a few places.
  'deck-a': {
    kind: 'deck',
    ramp: 'grey',
    full: true,
    open: true,
    paint: (rand, _band, h) => deck(rand, h, { top: 13 * SKY_SIZE, bottom: 2.5, aspect: 2.4, holes: -0.42, solid: 0.7, contrast: 0.25, bright: -0.05, gap: 0.05, cells: 3, broad: 0.45 }),
  },
  // Bright white cells in rows (altocumulus), shaded grey between, tiny towards the horizon, more blue between them.
  'deck-b': {
    kind: 'deck',
    ramp: 'white',
    full: true,
    open: true,
    paint: (rand, _band, h) => deck(rand, h, { top: 7 * SKY_SIZE, bottom: 1.6, aspect: 1.9, holes: -0.22, solid: 0.9, contrast: 0.7, bright: 0, gap: -0.3, cells: 6, broad: 0.2 }),
  },
  // Rain cloud (nimbostratus): a dark base, curtains of rain hanging from it to the horizon.
  'rain-a': {
    kind: 'rain',
    ramp: 'storm',
    full: true,
    paint: (rand, _band, h) => {
      const noise = skyNoise(rand, h, 4, 3);
      const edge = wrapNoise(rand, 5, 1, 1);
      const shafts = Array.from({ length: 3 + Math.floor(rand() * 3) }, () => ({ x: rand() * SKY_W, w: between(rand, 10, 26) * SKY_SIZE, slant: between(rand, -0.12, 0.12) }));
      return fullSky(h, (x, y) => {
        const v = y / h;
        const n = noise(x, y);
        const base = 0.62 + 0.04 * edge(x, 0);
        let s = 0.5 + 0.2 * n.blotch + 0.06 * n.ridge - 0.38 * Math.exp(-(((v - 0.55) / 0.2) ** 2));
        if (v > base) {
          for (const shaft of shafts) {
            let dx = Math.abs(x - shaft.x - (y - base * h) * shaft.slant);
            dx = Math.min(dx, SKY_W - dx);
            // Streaks of rain: every other column, fading towards the shaft's edges.
            if (dx < shaft.w / 2) s += 0.2 * (1 - dx / (shaft.w / 2)) * (x % 2 === 0 ? 1.3 : 0.5);
          }
        }
        return s;
      }, SEAM);
    },
  },
  // Rain cloud in heavy rolls, ragged underneath, no curtains.
  'rain-b': {
    kind: 'rain',
    ramp: 'storm',
    full: true,
    paint: (rand, _band, h) => {
      const rolls = skyNoise(rand, h, 3, 3.5);
      return fullSky(h, (x, y) => {
        const v = y / h;
        const n = rolls(x, y);
        return 0.38 + 0.24 * n.blotch + 0.1 * n.ridge * v - 0.12 * v + 0.25 * Math.max(0, v - 0.85) * 4;
      }, SEAM);
    },
  },
  // A storm's dark overcast: heavy rolls with paler rims.
  'storm-a': {
    kind: 'storm',
    ramp: 'storm',
    full: true,
    paint: (rand, _band, h) => {
      // Long rolls: cells far wider than tall, their ridges the paler rims.
      const rolls = skyNoise(rand, h, 3, 3.5);
      return fullSky(h, (x, y) => {
        const n = rolls(x, y);
        return 0.08 + 0.12 * n.ridge + 0.3 * n.blotch + 0.08 * (y / h);
      }, SEAM);
    },
  },
  // A storm's dark overcast with a pale band of light under its edge, low at the horizon.
  'storm-b': {
    kind: 'storm',
    ramp: 'storm',
    full: true,
    paint: (rand, _band, h) => {
      const lumps = skyNoise(rand, h, 5);
      const edge = wrapNoise(rand, 4, 1, 1);
      return fullSky(h, (x, y) => {
        const v = y / h;
        const gap = 0.84 + 0.05 * edge(x, 0);
        return v > gap ? 0.5 + (v - gap) * 3 : 0.1 + 0.2 * lumps(x, y).blotch - 0.08 * v;
      }, SEAM);
    },
  },
  // The magic of the land in the sky (D173, the owner's photo of alcohol drying on a guitar): a film of smears
  // with a sheen, bands of colour where it pools. Its own colours (FILM), see-through and untinted.
  // One broad pool and a smaller one, the smears wide apart.
  'special-a': {
    kind: 'special',
    ramp: 'white',
    full: true,
    open: true,
    glow: true,
    paint: (rand, _band, h) => film(rand, h, { pools: 2 + Math.floor(rand() * 2), size: [70, 18], cover: -0.05, mottle: 0, thick: 0.95 }),
  },
  // Thin ribbons of colour along many smears, and patches dried in a speckle.
  'special-b': {
    kind: 'special',
    ramp: 'white',
    full: true,
    open: true,
    glow: true,
    paint: (rand, _band, h) => film(rand, h, { pools: 5 + Math.floor(rand() * 3), size: [55, 7], cover: 0.05, mottle: 2, thick: 0.8 }),
  },
  // Thick fog: the sky gone to a flat pale grey, palest low down.
  'fog-a': {
    kind: 'fog',
    ramp: 'white',
    full: true,
    paint: (rand, _band, h) => {
      const drift = skyNoise(rand, h, 3, 3);
      return fullSky(h, (x, y) => 0.32 + 0.3 * (y / h) + 0.07 * drift(x, y).blotch, SEAM);
    },
  },
  // Mist: banks of it in streaks, the sky hidden behind.
  'fog-b': {
    kind: 'fog',
    ramp: 'white',
    full: true,
    paint: (rand, _band, h) => {
      const banks = skyNoise(rand, h, 3, 4);
      return fullSky(h, (x, y) => 0.42 + 0.3 * (y / h) + 0.18 * banks(x, y).blotch, SEAM);
    },
  },
};

/**
 * The four colours of each ramp, lightest first, from a season's palette;
 * `a/b` is halfway between two of its colours. The overcast's ceiling steps
 * half as far as the grey clouds, so its greys differ only subtly.
 */
export const RAMPS = {
  white: ['light', 'cloud', 'shade', 'dark'],
  grey: ['cloud', 'shade', 'sheet', 'sheetDark'],
  ceiling: ['shade', 'shade/sheet', 'sheet', 'sheet/sheetDark'],
  storm: ['sheet', 'sheetDark', 'storm', 'stormDark'],
};

/**
 * A ramp's colours as [r, g, b], lightest first, in a season's palette.
 * @param {Ramp} ramp @param {Record<string, string>} palette
 * @returns {number[][]}
 */
export function rampColours(ramp, palette) {
  /** @param {string} hex */
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return RAMPS[ramp].map((key) => {
    const [a, b] = key.split('/').map((k) => rgb(palette[k]));
    return b ? a.map((v, i) => Math.round((v + b[i]) / 2)) : a;
  });
}

/**
 * Where each kind of single cloud may sit: its base, as a share of the way
 * down to the horizon. Towers stand on the horizon; wisps keep high.
 * @type {Record<string, { top: number, bottom: number, speed: number }>}
 */
const PLACE = {
  heap: { top: 0.12, bottom: 0.95, speed: 1 },
  mass: { top: 0.2, bottom: 1, speed: 0.9 },
  tower: { top: 0.7, bottom: 1, speed: 0.6 },
  layer: { top: 0.15, bottom: 0.95, speed: 0.9 },
  wisp: { top: 0.08, bottom: 0.5, speed: 1.3 },
  scud: { top: 0.35, bottom: 0.95, speed: 1.6 },
};
/** Slower further off. */
const BAND_SPEED = { far: 0.45, mid: 0.7, near: 1 };
/** The most single clouds laid out in one sky. */
const MOST_CLOUDS = 40;
/** How many shapes of each pattern, per band, a session draws: more is less repetition. */
const VARIANTS = 5;

/**
 * @typedef {Object} SkySpec  What the sky shows for a weather (the rules in content/rules/sky.json).
 * @property {number} level  The cloud level, 0 to 5.
 * @property {string[]} patterns
 * @property {Record<string, string>} palette
 * @property {number} cover  How much of the sky the clouds hide.
 * @property {number} fill  How many single clouds to lay out: their own pixels, overlaps counted twice, as a share of the sky.
 * @property {number} veil  How much of the sun, the moon and the stars shows.
 * @property {number} glints  How much of the water's glints flick.
 * @property {number} sunHides  How much of the time a cloud is over the sun.
 * @property {number} dusk  How much of the night tint the clouds bring.
 * @property {number} drift  How fast the clouds go, times the wind's.
 * @property {boolean} low  Kept low over the horizon.
 * @property {'special' | 'fog' | 'description' | 'wet' | 'rainy' | 'table'} from  Which rule picked the patterns.
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
 * Which patterns show, and how, for a weather in a season: the special sky if
 * the weather asks for it (D173: only the art sheet does yet), fog (it hides
 * the sky whatever the level), then a description that names a sky, then rain
 * cloud, then the grey ceiling of a rainy overcast, then the season's table.
 * @param {{ clouds: number, precipitation?: number, wind?: number, description?: string, season?: string, cell?: number, tags?: string[], sky?: 'special' | 'blood' | 'green' }} weather
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
    fill: row.fill,
    veil: row.veil,
    glints: row.glints,
    sunHides: row.sunHides,
    dusk: row.dusk,
    drift: 1,
    low: false,
  };
  if (weather.sky === 'special') {
    const m = rules.special;
    return { ...base, patterns: m.patterns, cover: 0, veil: m.veil, glints: m.glints, sunHides: m.sunHides, dusk: 0, drift: m.drift, from: 'special' };
  }
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
  const rain = weather.precipitation ?? 0;
  if (level === rules.wet.level && rain >= rules.wet.precipitation) return { ...base, patterns: rules.wet.patterns, from: 'wet' };
  if (level === rules.rainy.level && rain >= rules.rainy.precipitation) return { ...base, patterns: rules.rainy.patterns, from: 'rainy' };
  return openSky({ ...base, patterns: seasonRules.levels[level], from: 'table' });
}

/**
 * A sky whose backdrops all let the sky through (a dry overcast's deck): the
 * sun, the moon and the stars show in its holes and hide behind its cloud,
 * as behind single clouds, so they aren't veiled as well.
 * @param {SkySpec} spec @returns {SkySpec}
 */
function openSky(spec) {
  const full = spec.patterns.filter((id) => CLOUD_PATTERNS[id]?.full);
  if (!full.length || !full.every((id) => CLOUD_PATTERNS[id].open)) return spec;
  const o = content.rules.sky.open;
  return { ...spec, veil: o.veil, sunHides: o.sunHides, glints: o.glints };
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
  const fill = spec.fill * between(rand, 0.8, 1.2) * SKY_W * horizon;
  let filled = 0;
  for (let i = 0; i < most && (backdrop || filled < fill); i++) {
    const pattern = single[Math.floor(rand() * single.length)];
    const place = CLOUD_PATTERNS[pattern].place ?? PLACE[CLOUD_PATTERNS[pattern].kind];
    let top = place.top;
    let bottom = place.bottom;
    if (spec.low) top = Math.max(top, 0.6);
    // Leaning towards the horizon, so more of them sit far off.
    const f = top + (bottom - top) * rand() ** 0.75;
    /** @type {Band} */
    let band = f > 0.72 ? 'far' : f > 0.42 ? 'mid' : 'near';
    // A towering heap is big even far off: never near, or it would stand taller than the sky.
    if (CLOUD_PATTERNS[pattern].kind === 'tower') band = band === 'far' && rand() < 0.5 ? 'far' : 'mid';
    const variant = Math.floor(rand() * VARIANTS);
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
