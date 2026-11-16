// @ts-check
// The swamp's pixels (D158), painted as code from the owner's photos
// (docs/design/swamp/, notes.md there says what each gives): a beech wood
// standing in dark water. Where the trees stand comes from photo 1; their
// feet from photos 2 and 3 (legs with hollows between them, wide fins); the
// moss coat and the burl from 4 and 5; the water, its weed, its pale floating
// rafts and mossed logs, the sedge tussocks, the grass bed and the island
// from 6, 7 and 8.
//
// This file paints into plain pixel buffers and touches neither the page nor
// PixiJS, so it can be drawn anywhere; src/scene/swamp.js makes the game's
// moving scene of it. Four seasons: the moss stays green all year and only
// changes in brightness, the sedge goes to straw, leaves lie on the water in
// autumn, snow lies on everything but the water in winter (it never
// freezes, D149).
//
// Painted with the game in mind: the layout names the water the line can
// land on (`water`, in the painting's own 320 columns) and keeps it open,
// lighter than the black water under the trees so the fish below the surface
// still show, and clear of the `front` layer, which is drawn over the bobber
// and the line.

/** The painting's size: the play area's 256 plus a strip either side (D93). */
export const SWAMP_W = 320;
export const SWAMP_H = 256;
const W = SWAMP_W;
const H = SWAMP_H;

/** Every colour, by name (docs/art.md: a small, named palette). Spring, as in the water's photos. */
export const SWAMP = {
  canopy: '#394436',
  fogDeep: '#5b6858',
  fog: '#7c8a79',
  fogLight: '#98a491',
  mist: '#a6b09e',
  fenceFar: '#6c7968',
  fenceMid: '#586453',
  fenceNear: '#465142',
  farBank: '#2c3728',
  farBush: '#3b4833',
  barkLight: '#9a9c8f',
  bark: '#7b7e73',
  barkShade: '#5a5e55',
  barkDark: '#3c413b',
  hollow: '#171c18',
  lichen: '#bcc0ae',
  oakLight: '#75654f',
  oak: '#57493b',
  oakShade: '#3d342b',
  oakDark: '#27211c',
  mossBright: '#89a238',
  moss: '#67862d',
  mossMid: '#496829',
  mossDark: '#2f4a23',
  mossDeep: '#1c2f1b',
  waterFog: '#7a8672',
  waterFar: '#647059',
  waterMid: '#505b47',
  waterNear: '#3f4939',
  waterDeep: '#2f382d',
  waterDark: '#202721',
  waterBlack: '#121714',
  reflect: '#273028',
  rootUnder: '#3d4a33',
  weedDark: '#3f4b27',
  weed: '#55642f',
  weedLight: '#74853c',
  raft: '#a3b47c',
  raftLight: '#c9d5a6',
  fleck: '#bcc5ad',
  sunkLeaf: '#6b5433',
  sedgeDeep: '#18261a',
  sedgeDark: '#2a4526',
  sedge: '#456b2f',
  sedgeLight: '#6f953f',
  strawDark: '#5c5440',
  straw: '#8f8468',
  strawLight: '#b8ad8c',
  grassDark: '#376530',
  grass: '#548c40',
  grassLight: '#7db35a',
  earth: '#2e2a20',
  fern: '#3e6a2e',
  fernLight: '#6c9c44',
  leaf: '#a9d260',
  log: '#4a4032',
  logDark: '#2b261f',
  leafRust: '#8a4f26',
  leafOrange: '#b0672c',
  leafGold: '#d08a35',
  snowLight: '#f1f4f3',
  snow: '#e3e9e6',
  snowShade: '#b9c4c1',
  snowBlue: '#8e9db2',
};

/** @typedef {typeof SWAMP} Palette */


/** Summer: the crowns closed overhead, so darker and greener; the weed and the rafts at their thickest. */
export const SWAMP_SUMMER = {
  ...SWAMP,
  canopy: '#2b3829',
  fogDeep: '#4d5e4c',
  fog: '#6d806b',
  fogLight: '#899983',
  mist: '#99a892',
  fenceFar: '#5e6f5b',
  fenceMid: '#4c5b49',
  fenceNear: '#3c483a',
  waterFog: '#6f7f68',
  waterFar: '#5b6a52',
  waterMid: '#495642',
  waterNear: '#3a4535',
  mossBright: '#7c9a34',
  moss: '#5a7a2a',
  mossMid: '#415f27',
  sedge: '#3e6a2c',
  sedgeLight: '#62903a',
  grassDark: '#2f6030',
  grass: '#437e38',
  grassLight: '#62a04a',
  leaf: '#7fb648',
};

/** Autumn: a warmer, greyer fog, beech leaves on the water, the moss dull, the sedge and grass yellowed. */
export const SWAMP_AUTUMN = {
  ...SWAMP,
  canopy: '#403f2e',
  fogDeep: '#67654f',
  fog: '#8b886f',
  fogLight: '#a8a387',
  mist: '#b5b098',
  fenceFar: '#77745e',
  fenceMid: '#615e4b',
  fenceNear: '#4d4a3b',
  farBank: '#33301f',
  farBush: '#5a4a2c',
  waterFog: '#868368',
  waterFar: '#6d6b54',
  waterMid: '#565542',
  waterNear: '#434334',
  mossBright: '#7f8f3a',
  moss: '#647530',
  mossMid: '#4a5b2a',
  sedge: '#5d6b30',
  sedgeLight: '#8a8f42',
  grassDark: '#8a8440',
  grass: '#a89c50',
  grassLight: '#c6b866',
  fern: '#6a6a30',
  fernLight: '#9a8a3c',
  leaf: '#d29a3a',
};

/** Winter: cold pale fog, the moss dark olive, everything that grew gone to straw, snow on what stands out of the water. */
export const SWAMP_WINTER = {
  ...SWAMP,
  canopy: '#4a524e',
  fogDeep: '#75807c',
  fog: '#98a3a0',
  fogLight: '#b6c0bd',
  mist: '#c6cfcc',
  fenceFar: '#869290',
  fenceMid: '#6f7b79',
  fenceNear: '#596462',
  farBank: '#343c39',
  farBush: '#4a5350',
  waterFog: '#929d9a',
  waterFar: '#74807d',
  waterMid: '#59645f',
  waterNear: '#434c48',
  waterDeep: '#303835',
  waterDark: '#202624',
  mossBright: '#5f7436',
  moss: '#4a602c',
  mossMid: '#3a4c28',
  mossDark: '#2a3a22',
  weedDark: '#34392a',
  weed: '#454c30',
  weedLight: '#5a6238',
  sedge: '#4a5a34',
  sedgeLight: '#66744a',
  straw: '#9a8f74',
  strawLight: '#c4baa0',
  grassDark: '#6e6648',
  grass: '#8f866a',
  grassLight: '#aea588',
  fern: '#4f4a36',
  fernLight: '#6b6248',
};

/**
 * What changes with the season besides the colours. `rafts`: how big the
 * floating rafts are, 0 for none; `weed`: added to the weed's threshold, so
 * less of it above 0; `leaves`: beech leaves lying on the water; `green`: the
 * share of a tussock's blades still alive; `twigs`: how leafy the island's
 * saplings are; `mist`: how much of it; `flecks`: specks on the water.
 * @typedef {{ palette: Palette, rafts: number, weed: number, leaves: number, green: number, twigs: number,
 *   snow: boolean, mist: number, flecks: number, litter: number }} SwampSeason  `litter`: fallen leaves lying
 *   on what stands out of the water, and caught in the tussocks and the grass (photo 11).
 * @type {Record<'spring' | 'summer' | 'autumn' | 'winter', SwampSeason>}
 */
export const SWAMP_SEASONS = {
  spring: { palette: SWAMP, rafts: 1, weed: 0, leaves: 0, green: 1, twigs: 1, snow: false, mist: 1, flecks: 150, litter: 0 },
  summer: { palette: SWAMP_SUMMER, rafts: 1.35, weed: -0.05, leaves: 0, green: 1.2, twigs: 1.6, snow: false, mist: 0.5, flecks: 110, litter: 0 },
  autumn: { palette: SWAMP_AUTUMN, rafts: 0.55, weed: 0.02, leaves: 300, green: 0.4, twigs: 0.7, snow: false, mist: 1.3, flecks: 60, litter: 1 },
  winter: { palette: SWAMP_WINTER, rafts: 0, weed: 0.07, leaves: 0, green: 0.12, twigs: 0, snow: true, mist: 1.1, flecks: 50, litter: 0 },
};

/**
 * The swamp's season for the game's: it has all four.
 * @param {string} season
 * @returns {keyof typeof SWAMP_SEASONS}
 */
export function swampSeason(season) {
  return season in SWAMP_SEASONS ? /** @type {keyof typeof SWAMP_SEASONS} */ (season) : 'spring';
}

// ---------- Pixels ----------

/** A picture as colours, row by row; -1 is nothing there. @typedef {{ w: number, h: number, px: Int32Array }} Buf */

/** @param {number} [w] @param {number} [h] @returns {Buf} */
export function makeBuf(w = W, h = H) {
  return { w, h, px: new Int32Array(w * h).fill(-1) };
}
/** @type {Map<string, number>} */
const INTS = new Map();
/** @param {string} hex */
function int(hex) {
  let n = INTS.get(hex);
  if (n === undefined) {
    n = parseInt(hex.slice(1), 16);
    INTS.set(hex, n);
  }
  return n;
}
/** @param {Buf} b @param {number} x @param {number} y @param {string} colour */
export function dot(b, x, y, colour) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= b.w || y >= b.h) return;
  b.px[y * b.w + x] = int(colour);
}
/** @param {Buf} b @param {number} x @param {number} y */
export function has(b, x, y) {
  return x >= 0 && y >= 0 && x < b.w && y < b.h && b.px[y * b.w + x] >= 0;
}
/** One buffer's pixels laid over another's, `dx` columns of it skipped. @param {Buf} under @param {Buf} over @param {number} [dx] */
export function lay(under, over, dx = 0) {
  for (let y = 0; y < under.h; y++) {
    for (let x = 0; x < under.w; x++) {
      const c = over.px[y * over.w + x + dx];
      if (c >= 0) under.px[y * under.w + x] = c;
    }
  }
}
/** A stream of numbers in [0, 1) from a seed: the same seed, the same picture, whichever frame is painted. @param {number} seed */
export function stream(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A colour part of the way to another, for trees further off in the fog. @param {string} a @param {string} b @param {number} t */
export function mix(a, b, t) {
  const x = int(a);
  const y = int(b);
  const ch = (/** @type {number} */ s) => Math.round(((x >> s) & 255) + (((y >> s) & 255) - ((x >> s) & 255)) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}
/** The palette as seen through fog: nearer `t` 0, further off towards 1. @param {Palette} P @param {number} t @returns {Palette} */
function fogged(P, t) {
  if (!t) return P;
  return /** @type {Palette} */ (Object.fromEntries(Object.entries(P).map(([k, v]) => [k, mix(v, P.fog, t)])));
}

/** 4×4 ordered dither, for blending one colour into the next in a pixel pattern. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
/** Whether the dither lets a share `k` (0 to 1) of pixels through here. @param {number} k @param {number} x @param {number} y */
export function sift(k, x, y) {
  return k > (BAYER[y & 3][x & 3] + 0.5) / 16;
}
/**
 * A colour along a ramp at t (0 to 1): flat in the middle of each step, and
 * dithered into the next only near the edge between them (as in reedy.js).
 * @param {string[]} steps @param {number} t @param {number} x @param {number} y
 */
export function ramp(steps, t, x, y) {
  const at = Math.min(Math.max(t, 0), 0.9999) * (steps.length - 1);
  const i = Math.floor(at);
  const f = Math.min(Math.max((at - i - 0.3) / 0.4, 0), 1);
  return sift(f, x, y) ? steps[Math.min(i + 1, steps.length - 1)] : steps[i];
}

/**
 * Smooth noise over the picture, 0 to 1: the same for the same `seed`.
 * @param {number} seed @returns {(x: number, y: number) => number}
 */
export function makeNoise(seed) {
  const at = (/** @type {number} */ x, /** @type {number} */ y) => {
    let n = Math.imul((x * 374761393 + y * 668265263) ^ seed, 1274126177);
    n ^= n >>> 13;
    n = Math.imul(n, 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const top = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx;
    const bottom = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx;
    return top + (bottom - top) * sy;
  };
}

/**
 * A curve from a to b, pulled towards c, `width` pixels across at its start
 * and `endWidth` at its end; `colour` is asked for every pixel (u: 0 at the
 * left of the stroke to 1 at the right; t: along it).
 * @param {Buf} b @param {{ x: number, y: number }} from @param {{ x: number, y: number }} via @param {{ x: number, y: number }} to
 * @param {number} width @param {number} endWidth @param {(x: number, y: number, u: number, t: number) => string | null} colour
 */
export function stroke(b, from, via, to, width, endWidth, colour) {
  const steps = Math.ceil((Math.hypot(via.x - from.x, via.y - from.y) + Math.hypot(to.x - via.x, to.y - via.y)) * 1.5) + 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const cx = u * u * from.x + 2 * u * t * via.x + t * t * to.x;
    const cy = u * u * from.y + 2 * u * t * via.y + t * t * to.y;
    const w = Math.max(1, Math.round(width + (endWidth - width) * t));
    const x0 = Math.round(cx - w / 2);
    for (let k = 0; k < w; k++) {
      const c = colour(x0 + k, Math.round(cy), w === 1 ? 0.5 : k / (w - 1), t);
      if (c) dot(b, x0 + k, cy, c);
    }
  }
}

// ---------- What stands where ----------

/**
 * One tree. `x`: its middle at the water; `foot`: the row of the water at its
 * foot; `w`: the trunk's width; `lean`: pixels it leans to the right per 100
 * rows up; `tier`: 0 close, 1 in the middle distance, 2 far (paler in the
 * fog). `moss`: none, the foot only (photo 1), or the whole coat (photo 4);
 * `mossSide`: -1 the left shoulder, 1 the right. `roots`: 'stilt' is photo 2's
 * legs, 'tall' the same raised high on four long ones, 'buttress' photo 3's fins, 'plain' a
 * smaller flare. `burl`: the
 * row of photo 5's growth, on the trunk. `front`: drawn over the bobber.
 * @typedef {{ x: number, foot: number, w: number, lean?: number, tier?: number, bark?: 'beech' | 'oak',
 *   moss?: 'none' | 'foot' | 'full', mossSide?: number, roots?: 'stilt' | 'tall' | 'buttress' | 'plain', burl?: number,
 *   front?: boolean }} Tree
 */

/**
 * What stands where, and how the game uses it. `horizon`: the row of the far
 * bank's waterline. `gap`: columns where the far trunks thin out. `channel`:
 * the open water's middle column and half-width at the bottom, which the
 * black water under the trees stays out of. `water`: where the line can land,
 * in the painting's columns (32 more than the play area's, which
 * content/locations/lake.json holds); `farLine`: above it the far bobber is
 * used (PAINTINGS in src/scene/scene.js).
 * @typedef {{ horizon: number, gap?: [number, number], channel: { x: number, half: number }, trees: Tree[],
 *   tussocks: { x: number, y: number, r: number, front?: boolean }[],
 *   logs: { x: number, y: number, len: number, slope: number }[],
 *   rafts: { x: number, y: number, rx: number, ry: number }[],
 *   grass: { x0: number, x1: number, y: number, h: number }[],
 *   island: { x: number, y: number, w: number },
 *   branch: { x: number, y: number, len: number },
 *   hummocks: { x: number, y: number, r: number }[],
 *   water: { x0: number, y0: number, x1: number, y1: number }, farLine: number }} Layout
 */

/**
 * The owner's pick of three (D158): seen from a little above, so there is
 * plenty of water and the trees stand out in it at every distance; photo 8's
 * island and grass bed in the middle distance, photo 6's tussocks and fallen
 * branch close up, and from the second of the three its big tree in photo
 * 4's moss coat on photo 2's legs, close up on the left.
 * @type {Layout}
 */
export const SWAMP_LAYOUT = {
  horizon: 76,
  channel: { x: 160, half: 100 },
  trees: [
    { x: 54, foot: 82, w: 4, tier: 2 },
    { x: 88, foot: 84, w: 5, tier: 2, lean: -3 },
    { x: 136, foot: 81, w: 4, tier: 2 },
    { x: 176, foot: 85, w: 5, tier: 2, moss: 'foot' },
    { x: 244, foot: 83, w: 4, tier: 2, lean: 4 },
    { x: 288, foot: 96, w: 6, tier: 2 },
    { x: 108, foot: 100, w: 7, tier: 1, moss: 'foot', mossSide: -1 },
    { x: 224, foot: 106, w: 8, tier: 1, bark: 'oak', burl: 58, roots: 'plain' },
    { x: 66, foot: 122, w: 11, tier: 1, moss: 'foot', mossSide: 1, roots: 'buttress' },
    { x: 262, foot: 117, w: 13, tier: 0, moss: 'foot', mossSide: -1, roots: 'tall' },
    { x: 304, foot: 178, w: 17, tier: 0, lean: -3, bark: 'oak', roots: 'buttress' },
    { x: 26, foot: 230, w: 27, lean: 3, tier: 0, moss: 'full', roots: 'stilt', front: true },
  ],
  island: { x: 170, y: 112, w: 46 },
  grass: [{ x0: 0, x1: 44, y: 96, h: 8 }],
  tussocks: [
    { x: 46, y: 160, r: 12 },
    { x: 284, y: 150, r: 10 },
    { x: 300, y: 252, r: 22, front: true },
    { x: 84, y: 262, r: 15, front: true },
  ],
  logs: [
    { x: 70, y: 214, len: 36, slope: -0.12 },
    { x: 236, y: 220, len: 30, slope: 0.16 },
  ],
  branch: { x: 196, y: 246, len: 84 },
  // Heaps of dead grass the snow turns white in winter (photo 10), outside the water the line lands on.
  hummocks: [
    { x: 50, y: 134, r: 7 },
    { x: 26, y: 190, r: 9 },
    { x: 288, y: 204, r: 10 },
    { x: 262, y: 160, r: 6 },
    { x: 112, y: 238, r: 9 },
  ],
  rafts: [
    { x: 70, y: 130, rx: 16, ry: 3 },
    { x: 260, y: 142, rx: 16, ry: 4 },
    { x: 62, y: 186, rx: 16, ry: 5 },
    { x: 290, y: 200, rx: 18, ry: 5 },
    { x: 124, y: 234, rx: 20, ry: 6 },
  ],
  water: { x0: 72, y0: 128, x1: 248, y1: 204 },
  farLine: 150,
};

// ---------- Trees ----------

/** The shape of a tree's trunk: its middle and half-width at every row. @param {Tree} t */
function trunkOf(t) {
  const roots = t.roots ?? 'plain';
  // A stilt foot's trunk ends at the crotch, where the legs begin.
  const legs = roots === 'stilt' ? Math.round(t.w * 1.15) : roots === 'tall' ? Math.round(t.w * 1.15) : 0;
  const base = t.foot - legs;
  const flare = roots === 'stilt' || roots === 'tall' ? 0.3 : roots === 'buttress' ? 0.45 : 0.35;
  const middle = (/** @type {number} */ y) => t.x + ((t.lean ?? 0) * (t.foot - y)) / 100;
  const half = (/** @type {number} */ y) => {
    const up = Math.max(0, base - y);
    return (t.w / 2) * (0.9 + 0.1 * (y / Math.max(1, base))) * (1 + flare * Math.exp(-up / (t.w * 1.1)));
  };
  return { roots, legs, base, middle, half };
}

/**
 * The bark, the moss on it and the burl, for one pixel of a tree. `u`: 0 at
 * the lit left edge to 1 at the shaded right.
 * @param {Tree} t @param {Palette} P @param {(x: number, y: number) => number} noise @param {number[]} scars
 * `m`: the same across the whole foot, for which shoulder the moss keeps to.
 * @returns {(x: number, y: number, u: number, base: number, m?: number) => string}
 */
function barkOf(t, P, noise, scars) {
  const oak = t.bark === 'oak';
  const mossy = t.moss ?? 'none';
  const side = t.mossSide ?? -1;
  const mosses = [P.mossBright, P.moss, P.mossMid, P.mossDark, P.mossDeep];
  return (x, y, u, base, m = u) => {
    // Moss first: the foot's sheet thins upwards and keeps to one shoulder; the coat is all over, with slits of bark.
    let amount = 0;
    const up = base - y;
    if (mossy === 'foot') amount = (up >= 0 ? 1 - up / (t.w * 2.4) : 1 + up / (t.w * 0.8)) * 0.85 + 0.5 * (side > 0 ? m : 1 - m) - 0.3;
    else if (mossy === 'full') amount = 0.86 + 0.2 * Math.min(1, y / base);
    if (amount > noise(x * 0.55 + t.x, y * 0.13 + 31) * 0.95 + 0.04) {
      const shade = u * 0.55 + noise(x * 0.8 + 9, y * 0.3) * 0.55 - 0.08;
      return ramp(mosses, shade, x, y);
    }
    if (oak) {
      // Ridged bark: long dark furrows with a lit edge beside each.
      const ridge = noise(x * 1.7 + t.x * 3, y * 0.05 + 7);
      return ramp([P.oakLight, P.oak, P.oakShade, P.oakDark], u * 0.62 + (ridge > 0.56 ? 0.3 : ridge < 0.3 ? -0.12 : 0.08), x, y);
    }
    // Smooth grey beech: long faint streaks, ring scars across it, a speck of lichen in the light.
    const grain = noise(x * 0.9 + t.x, y * 0.07);
    let v = u * 0.95 + (grain - 0.5) * 0.3;
    for (const s of scars) if (Math.round(s + (u - 0.5) * (u - 0.5) * 6) === y) v += 0.3;
    if (u < 0.6 && t.w > 8 && noise(x * 3.1, y * 2.3) > 0.9) return P.lichen;
    return ramp([P.barkLight, P.bark, P.barkShade, P.barkDark], v, x, y);
  };
}

/**
 * Paints a tree: the trunk from the top of the picture down, the burl, the
 * foot, and what of the roots shows under the water, on a buffer of its own.
 * @param {Tree} t @param {Palette} base @param {() => number} rand @param {(x: number, y: number) => number} noise
 */
function paintTree(t, base, rand, noise) {
  const b = makeBuf();
  const P = fogged(base, [0, 0.3, 0.55][t.tier ?? 0]);
  const shape = trunkOf(t);
  const scars = Array.from({ length: Math.round(t.foot / 30) }, () => Math.floor(rand() * shape.base));
  const bark = barkOf(t, P, noise, scars);
  const ragged = t.moss === 'full';

  // The trunk.
  for (let y = 0; y <= shape.base; y++) {
    const cx = shape.middle(y);
    const hw = shape.half(y);
    // A moss coat hangs past the trunk's edge here and there.
    const out = ragged && noise(t.x + 5, y * 0.35) > 0.62 ? 1 : 0;
    const x0 = Math.round(cx - hw) - out;
    const x1 = Math.round(cx + hw) + (ragged && noise(t.x + 50, y * 0.35) > 0.62 ? 1 : 0);
    for (let x = x0; x <= x1; x++) dot(b, x, y, bark(x, y, (x - x0) / Math.max(1, x1 - x0), shape.base));
  }

  // The burl: a dark cracked swelling the bark bends round, a tuft of moss on top.
  if (t.burl) {
    const cy = t.burl;
    const cx = shape.middle(cy) + t.w * 0.12;
    const rx = t.w * 0.42;
    const ry = t.w * 0.5;
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) {
      for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (d > 1.25) continue;
        if (d > 1) {
          // The rim, lit above and to the left, dark beneath.
          dot(b, x, y, y < cy && x < cx + rx * 0.3 ? P.oakLight : P.oakDark);
          continue;
        }
        const crack = noise(x * 1.9 + 3, y * 1.9);
        const tuft = y < cy - ry * 0.45 && crack > 0.35;
        dot(b, x, y, tuft ? ramp([P.moss, P.mossMid, P.mossDark], crack, x, y) : d < 0.16 ? P.hollow : ramp([P.oakShade, P.oakDark, P.hollow], crack * 0.7 + d * 0.3, x, y));
      }
    }
  }

  // Where a trunk meets the water (photo 9): the bark bulges out over the
  // surface in rounded lumps, black in the crease right under each, and the
  // mirror image hangs straight below. Never a straight line.
  /**
   * A leg's or a lump's mirror image below its waterline `wy`, `len` rows,
   * fading; `lean` is how far it shifts sideways a row.
   * @param {number} x0 @param {number} x1 @param {number} wy @param {number} len @param {number} [lean]
   */
  const mirror = (x0, x1, wy, len, lean = 0) => {
    for (let k = 1; k <= len; k++) {
      const s = Math.round(lean * k);
      for (let x = Math.round(x0) + s; x <= x1 + s; x++) if (sift(0.9 - (k / len) * 0.75, x, wy + k)) dot(b, x, wy + k, k === 1 ? P.waterBlack : P.reflect);
    }
  };
  const mossAt = (/** @type {number} */ x) => Math.min(1, Math.max(0, (x - t.x + t.w) / (2 * t.w)));

  if (shape.roots === 'stilt' || shape.roots === 'tall') {
    const tall = shape.roots === 'tall';
    const top = shape.base;
    const cx = shape.middle(top);
    const hw = shape.half(top);
    const L = shape.legs;
    const lw = Math.max(2, Math.round(t.w * (tall ? 0.3 : 0.22)));
    /**
     * Each leg: where it leaves the trunk, its knee, its foot, how thick it
     * starts and ends, and its own waterline: the legs nearest the viewer meet
     * the water lowest, so the foot's bottom edge curves. A leg with a `knee`
     * is drawn in two curves, bent sharply there (`via` is then the lower
     * curve's pull).
     * @type {{ from: { x: number, y: number }, via: { x: number, y: number }, to: { x: number, y: number }, w0: number, w1: number,
     *   knee?: { x: number, y: number } }[]}
     */
    const legs = [];
    const jig = () => Math.round((rand() - 0.5) * 2);
    if (tall) {
      // The owner's drawing (markup-2.png): spider legs. From under the trunk
      // each root humps up and out to a rounded knee, each at its own height,
      // the outer ones highest and furthest, then curves down into the water.
      for (const [f, kneeX, kneeY, near] of [
        [-0.7, -1.6, -4, -3],
        [-0.4, -0.95, -1, 0],
        [-0.1, -0.3, 3, 2],
        [0.25, 0.35, 1, 3],
        [0.55, 1.0, -3, 1],
        [0.8, 1.6, -4, -2],
      ]) {
        const dir = Math.sign(kneeX);
        const from = { x: cx + f * hw, y: top - 1 };
        const knee = { x: cx + kneeX * t.w, y: top + kneeY };
        const wy = t.foot + near + jig();
        const to = { x: knee.x + dir * t.w * 0.35, y: wy };
        // Level at the knee, so it bends round: the lower curve leaves it heading on outwards.
        legs.push({ from, knee, via: { x: knee.x + dir * t.w * 0.5, y: knee.y + 2 }, to, w0: lw + 2, w1: Math.max(2, lw - 1) });
      }
    } else {
      // Photo 2: the trunk set down on its fingertips. Thick legs bowing out at
      // the knee and coming back in, the middle ones nearest the viewer; a long
      // root arching out low on the left; the bent elbow of a leg on the right.
      const count = 5;
      for (let i = 0; i < count; i++) {
        const f = i / (count - 1) - 0.5;
        const from = { x: cx + f * hw * 1.6, y: top - 2 };
        const wy = t.foot + Math.round((1 - Math.abs(f) * 2.4) * t.w * 0.16) + jig();
        const to = { x: cx + f * t.w * 2 + (rand() - 0.5) * t.w * 0.2, y: wy };
        const via = { x: from.x + (to.x - from.x) * 1.5 + (rand() - 0.5) * t.w * 0.2, y: top + L * (0.45 + rand() * 0.2) };
        legs.push({ from, via, to, w0: lw + 2 - (i % 2), w1: lw });
      }
      const out = t.w * 2.0;
      legs.unshift({ from: { x: cx - hw + 1, y: top + L * 0.2 }, via: { x: cx - out * 1.05, y: top - L * 0.1 }, to: { x: cx - out, y: t.foot - 3 }, w0: lw, w1: lw - 1 });
      // The bent leg on the right: a shallow S down to the water (the owner's markup-2.png), not an arch.
      legs.push({ from: { x: cx + hw - 1, y: top }, via: { x: cx + out * 0.7, y: top + L * 0.4 }, to: { x: cx + out * 0.95, y: t.foot + 1 }, w0: lw + 1, w1: lw });
    }

    /**
     * A leg's curves: `[from, pull, to, width at from, width at to]`.
     * @param {(typeof legs)[number]} leg
     * @returns {[{ x: number, y: number }, { x: number, y: number }, { x: number, y: number }, number, number][]}
     */
    const curves = (leg) => {
      if (!leg.knee) return [[leg.from, leg.via, leg.to, leg.w0, leg.w1]];
      const mid = (leg.w0 + leg.w1) / 2;
      // Up and out to the knee, arriving level, then round and down.
      const pull = { x: (leg.from.x + leg.knee.x) / 2, y: leg.knee.y };
      return [
        [leg.from, pull, leg.knee, leg.w0, mid],
        [leg.knee, leg.via, leg.to, mid, leg.w1],
      ];
    };
    // Under the crotch, a shadow; below it the gaps between the legs are left
    // open, so the water behind shows through them.
    /** @type {Map<number, [number, number]>} */
    const span = new Map();
    for (const [p0, p1, p2] of legs.flatMap(curves)) {
      for (let i = 0; i <= 60; i++) {
        const s = i / 60;
        const u = 1 - s;
        const x = u * u * p0.x + 2 * u * s * p1.x + s * s * p2.x;
        const y = Math.round(u * u * p0.y + 2 * u * s * p1.y + s * s * p2.y);
        const [a, z] = span.get(y) ?? [Infinity, -Infinity];
        span.set(y, [Math.min(a, x), Math.max(z, x)]);
      }
    }
    const lowest = Math.min(...legs.map((l) => l.to.y));
    const shade = tall ? 3 : Math.round(L * 0.3);
    for (let y = top; y < lowest; y++) {
      const row = span.get(y);
      if (!row) continue;
      // Under a tree on spider legs, only under the trunk itself, not out along the legs.
      const x0 = tall ? Math.max(Math.round(row[0]) + 1, Math.round(cx - hw)) : Math.round(row[0]) + 1;
      const x1 = tall ? Math.min(row[1], cx + hw) : row[1];
      for (let x = x0; x < x1; x++) {
        const k = y - top;
        if (k < shade && sift(1.2 - k / shade, x, y)) dot(b, x, y, k < shade / 2 ? P.hollow : P.barkDark);
      }
    }
    for (const leg of legs) {
      const wy = leg.to.y;
      const colour = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ u) => (y >= wy ? null : y === wy - 1 && u > 0.5 ? P.barkDark : bark(x, y, u, shape.base, mossAt(x)));
      for (const [p0, p1, p2, w0, w1] of curves(leg)) stroke(b, p0, p1, p2, w0, w1, colour);
      // Its foot: a rounded knob on the water, black in the crease beneath, then its mirror image.
      const x0 = Math.round(leg.to.x - leg.w1 / 2) - 1;
      const x1 = x0 + leg.w1 + 1;
      for (let x = x0; x <= x1; x++) dot(b, x, wy - 1, x === x0 || x === x1 ? P.barkDark : bark(x, wy - 1, (x - x0) / (x1 - x0), shape.base, mossAt(x)));
      for (let x = x0 + 1; x < x1; x++) dot(b, x, wy, P.hollow);
      const lean = (leg.via.x - leg.to.x) / Math.max(1, leg.to.y - leg.via.y);
      mirror(x0, x1, wy, Math.min(9, Math.round(L * 0.45)), lean * 0.6);
    }
  } else {
    // Photo 3's fins, or a plainer flare: roots running out from the trunk on
    // both sides, each falling to a rounded knuckle that bulges out over the
    // water. Painted the high ones first, so a lower root in front draws its
    // edge across them like a crease.
    const fins = shape.roots === 'buttress';
    const cxF = shape.middle(t.foot);
    const hwF = shape.half(t.foot);
    const per = t.w < 6 ? 1 : 2;
    /** @type {{ side: number, reach: number, rise: number, knob: number, drop: number, hump: number }[]} */
    const lobes = [];
    for (const side of [-1, 1]) {
      for (let i = 0; i < per; i++) {
        lobes.push({
          side,
          reach: t.w * (fins ? 0.25 + i * 0.38 : 0.15 + i * 0.3) * (0.8 + rand() * 0.4) * (side > 0 ? 0.85 : 1),
          rise: t.w * (fins ? 1.3 - i * 0.45 : 0.7 - i * 0.25) * (0.75 + rand() * 0.5),
          knob: Math.max(2, t.w * (fins ? 0.3 + rand() * 0.15 : 0.2 + rand() * 0.1)),
          drop: 1 + Math.round(t.w * (0.08 + rand() * 0.14)),
          hump: rand() * 0.25,
        });
      }
    }
    lobes.sort((a, c2) => c2.rise - a.rise);
    // The trunk's own foot: two rounded toes coming towards the viewer (photo 3), bulging out over the water.
    const coreDrop = Math.max(1, Math.round(t.w * 0.2));
    const toe = (/** @type {number} */ x, /** @type {number} */ at) => Math.sqrt(Math.max(0, 1 - ((x - at) / (hwF * 0.55)) ** 2));
    for (let x = Math.round(cxF - hwF); x <= cxF + hwF; x++) {
      const bottom = t.foot + Math.round(coreDrop * Math.max(toe(x, cxF - hwF * 0.45), toe(x, cxF + hwF * 0.45) * 0.8));
      for (let y = t.foot - 1; y < bottom; y++) dot(b, x, y, y === bottom - 1 ? P.barkDark : bark(x, y, (x - cxF + hwF) / (2 * hwF), shape.base, mossAt(x)));
      dot(b, x, bottom, P.hollow);
      mirror(x, x, bottom, Math.round(t.w * 0.5));
    }
    const widest = Math.max(...lobes.map((l) => l.reach + l.knob * 1.3)) + hwF;
    for (const lobe of lobes) {
      const edge = cxF + lobe.side * hwF * 0.7;
      const kr = lobe.knob * 1.3;
      for (let d = -hwF * 0.7; d <= lobe.reach + kr; d++) {
        const x = Math.round(edge + lobe.side * d);
        // Its top: a fin falling away from the trunk, then the knuckle's round back, a little uneven.
        // A swelling partway along it, so its back is not one straight slope.
        const s0 = Math.max(0, d / lobe.reach);
        const fall = d <= 0 ? lobe.rise : lobe.rise * (Math.max(0, 1 - s0) ** 1.7 + lobe.hump * Math.max(0, 1 - ((s0 - 0.45) / 0.25) ** 2));
        const dk = d - lobe.reach;
        const knuckle = Math.abs(dk) < kr ? lobe.knob * Math.sqrt(1 - (dk / kr) ** 2) : 0;
        const h = Math.max(fall, knuckle) + (noise(x * 0.45, t.x + lobe.rise) - 0.5) * 2.4;
        if (h < 0.6) continue;
        const topY = Math.round(t.foot - h);
        // Its bottom: round where the knuckle bulges out over the water.
        const bulge = Math.round(Math.max(Math.abs(dk) < kr * 1.3 ? lobe.drop * Math.sqrt(1 - (dk / (kr * 1.3)) ** 2) : 0, d > 0 && d < lobe.reach ? lobe.drop * 0.5 * Math.sin((Math.PI * d) / lobe.reach) : 0));
        const bottom = t.foot + bulge;
        const u = (x - (cxF - widest)) / (2 * widest);
        // A crease where it passes in front of a higher root already painted.
        if (has(b, x, topY - 1) && topY < t.foot - 1) dot(b, x, topY - 1, P.barkDark);
        for (let y = topY; y < bottom; y++) {
          const lit = y === topY && lobe.side < 0;
          const end = d > lobe.reach + kr - 1.5;
          dot(b, x, y, y >= bottom - 1 || end ? P.barkDark : lit ? (t.bark === 'oak' ? P.oakLight : P.barkLight) : bark(x, y, u, shape.base, mossAt(x)));
        }
        dot(b, x, bottom, P.hollow);
        mirror(x, x, bottom, Math.max(2, Math.round((bottom - topY) * 0.7)));
      }
    }
    if (fins) {
      // Photo 3's two toes in the middle, with the dark slot between them.
      for (let y = t.foot - Math.round(t.w * 0.7); y < t.foot + coreDrop; y++) {
        const x = Math.round(shape.middle(y));
        dot(b, x, y, P.hollow);
        if (t.w >= 12 && y > t.foot - t.w * 0.45) dot(b, x + 1, y, P.hollow);
      }
    }
  }
  return b;
}

// ---------- The far wood, the water ----------

/**
 * The fog between the trees, the far trunks standing in it like a fence, and
 * the far bank.
 * @param {Buf} b @param {Layout} c @param {Palette} P @param {SwampSeason} S @param {() => number} rand
 * @param {(x: number, y: number) => number} noise
 */
function paintFarWood(b, c, P, S, rand, noise) {
  const hz = c.horizon;
  for (let y = 0; y < hz + 2; y++) {
    for (let x = 0; x < W; x++) {
      // Brightest low down between the trunks, darker up under the crowns.
      const t = (y / hz) ** 0.8 * 0.85 + noise(x * 0.02, y * 0.05) * 0.2;
      dot(b, x, y, ramp([P.canopy, P.fogDeep, P.fog, P.fogLight], t, x, y));
    }
  }
  const inGap = (/** @type {number} */ x) => Boolean(c.gap && x > c.gap[0] && x < c.gap[1]);
  // Three rows of trunks, the furthest thin, pale and many.
  for (const [count, colour, light, wide, lift] of /** @type {const} */ ([
    [58, P.fenceFar, P.fog, 2, 5],
    [34, P.fenceMid, P.fenceFar, 3, 3],
    [18, P.fenceNear, P.fenceMid, 4, 1],
  ])) {
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rand() * W);
      const w = 1 + Math.floor(rand() * wide);
      const lean = (rand() - 0.5) * 0.14;
      if (inGap(x) && rand() < 0.85) continue;
      const foot = hz - lift - Math.floor(rand() * 3);
      for (let y = 0; y <= foot; y++) {
        const cx = Math.round(x + lean * (foot - y));
        for (let k = 0; k < w; k++) dot(b, cx + k, y, k === 0 && w > 2 ? light : colour);
      }
    }
  }
  // The far bank: a low dark line of undergrowth.
  for (let x = 0; x < W; x++) {
    const bump = Math.round(noise(x * 0.09, 3) * 5 + noise(x * 0.4, 9) * 2);
    const top = hz - 3 - bump + (inGap(x) ? 3 : 0);
    for (let y = top; y <= hz; y++) dot(b, x, y, y - top < 2 && sift(0.5, x, y) ? P.farBush : P.farBank);
    if (S.snow) {
      if (noise(x * 0.2, 60) > 0.3) dot(b, x, top - 1, P.snow);
      dot(b, x, top, P.snowShade);
    }
  }
}

/** How far a column is from the open water's middle, 1 at its edge. @param {Layout} c @param {number} x @param {number} y */
function aside(c, x, y) {
  // The lane narrows towards the far bank.
  const d = (y - c.horizon) / (H - c.horizon);
  return Math.abs(x - c.channel.x) / (c.channel.half * (0.55 + 0.45 * d));
}

/**
 * The water: pale where it mirrors the fog down the middle, black under the
 * trees; every tree's reflection hanging broken below its foot; weed just
 * under the surface towards the sides; pale rafts of floating plants; flecks;
 * autumn's leaves. `frame` (0 to 2) wobbles the reflections and shifts a few
 * flecks, so the water shimmers in place.
 * @param {Buf} b @param {Layout} c @param {Palette} P @param {SwampSeason} S @param {number} seed
 * @param {(x: number, y: number) => number} noise @param {number} frame
 */
function paintWater(b, c, P, S, seed, noise, frame) {
  const rand = stream(seed);
  /** A number in [0, 1) fixed for each pixel. @param {number} x @param {number} y */
  const leafAt = (x, y) => {
    let n = Math.imul(x * 73856093 ^ y * 19349663 ^ seed, 2654435761);
    n ^= n >>> 15;
    return (n >>> 0) / 4294967296;
  };
  const hz = c.horizon;
  const steps = [P.waterFog, P.waterFar, P.waterMid, P.waterNear, P.waterDeep, P.waterDark, P.waterBlack];
  for (let y = hz + 1; y < H; y++) {
    const d = (y - hz) / (H - hz);
    for (let x = 0; x < W; x++) {
      const side = Math.max(0, aside(c, x, y) - 0.75);
      const t = d ** 0.75 * 0.5 + side * 0.55 + (noise(x * 0.03, y * 0.12) - 0.5) * 0.1;
      dot(b, x, y, ramp(steps, t, x, y));
    }
  }
  // The far bank and its trunks, mirrored as a dark ragged band.
  for (let x = 0; x < W; x++) {
    const inGap = c.gap && x > c.gap[0] && x < c.gap[1];
    const len = (inGap ? 2 : 3) + Math.round(noise(x * 0.5, 40) * (inGap ? 2 : 6));
    for (let k = 1; k <= len; k++) if (k < 2 || sift(0.9 - k / len, x, hz + k)) dot(b, x, hz + k, k < 2 ? P.farBank : P.waterDeep);
  }
  // Each tree's reflection: its trunk upside down, darker than the water, broken by the surface.
  for (const t of c.trees) {
    const shape = trunkOf(t);
    const tier = t.tier ?? 0;
    const len = Math.min(H - t.foot, [150, 80, 34][tier]);
    const colour = tier === 0 ? P.reflect : P.waterDeep;
    for (let k = 1; k < len; k++) {
      const y = t.foot + k;
      const from = t.foot - k;
      if (from < 0 || y >= H) break;
      // More and more of it lost with distance from the foot.
      if (noise(t.x * 0.7, y * 0.9) < (k / len) * 0.75) continue;
      const wobble = Math.round(Math.sin(k * 0.55 + t.x + frame * 1.3) * Math.min(2, k / 14));
      const cx = shape.middle(Math.max(from, 0)) + wobble;
      // A tree on legs: its legs mirror themselves (paintTree), the trunk's image starts below theirs.
      if (k < shape.legs) continue;
      const hw = shape.half(Math.min(from, shape.base));
      for (let x = Math.round(cx - hw); x <= cx + hw; x++) {
        if (sift(0.8 - (k / len) * 0.65, x, y)) dot(b, x, y, k === 1 && tier < 2 ? P.waterDark : colour);
      }
    }
  }
  // Weed just under the surface, in soft blotches, thickest away from the open water and close to the viewer.
  for (let y = hz + 8; y < H; y++) {
    const d = (y - hz) / (H - hz);
    for (let x = 0; x < W; x++) {
      const n = noise(x * 0.045 + 20, y * 0.1 + 20) * 0.7 + noise(x * 0.16, y * 0.34) * 0.3;
      const want = n + Math.min(0.28, Math.max(0, aside(c, x, y) - 0.7) * 0.5) + d * 0.06;
      const over = want - 0.74 - S.weed;
      if (over <= 0) continue;
      dot(b, x, y, over > 0.12 ? (sift(0.5, x, y) ? P.weedLight : P.weed) : sift(over * 8, x, y) ? P.weed : P.weedDark);
      // Autumn (photo 11): leaves lie thick on the weed at the sides, where it reads as the swamp's ground.
      if (S.litter && aside(c, x, y) > 0.8 && leafAt(x, y) < 0.08 * S.litter) {
        const pick = leafAt(y, x);
        const colour = pick < 0.45 ? P.sunkLeaf : pick < 0.7 ? P.leafRust : pick < 0.9 ? P.leafOrange : P.leafGold;
        dot(b, x, y, colour);
        if (d > 0.3) dot(b, x + 1, y, colour);
      }
    }
  }
  // Rafts of tiny pale floating plants: thick in the middle, thinning to single stars at the rim.
  for (const at of S.rafts ? c.rafts : []) {
    const r = { ...at, rx: at.rx * S.rafts, ry: at.ry * Math.sqrt(S.rafts) };
    for (let y = Math.floor(r.y - r.ry * 1.8); y <= r.y + r.ry * 1.8; y++) {
      for (let x = Math.floor(r.x - r.rx * 1.6); x <= r.x + r.rx * 1.6; x++) {
        if (y <= hz + 1) continue;
        const d = Math.sqrt(((x - r.x) / r.rx) ** 2 + ((y - r.y) / r.ry) ** 2) + (noise(x * 0.3, y * 0.6 + 70) - 0.5) * 0.7;
        if (d < 0.55) dot(b, x, y, sift(0.4, x, y) ? P.raftLight : P.raft);
        else if (d < 1) dot(b, x, y, sift(0.8, x, y) ? P.raft : P.weed);
        else if (d < 1.5 && noise(x * 2.3, y * 2.3) > 0.8) dot(b, x, y, P.raft);
      }
    }
  }
  // Flecks on the still water, and a few leaves lying sunk near the viewer.
  for (let i = 0; i < S.flecks; i++) {
    const x = Math.floor(rand() * W) + ((i + frame) % 3 === 0 ? 1 : 0);
    const y = hz + 6 + Math.floor((H - hz - 6) * rand() ** 0.8);
    const near = (y - hz) / (H - hz) > 0.5;
    dot(b, x, y, P.fleck);
    if (near && rand() < 0.6) dot(b, x + 1, y, P.fleck);
  }
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rand() * W);
    const y = H - 4 - Math.floor(60 * rand() ** 2);
    dot(b, x, y, P.sunkLeaf);
    dot(b, x + 1, y, P.sunkLeaf);
  }
  // Autumn: beech leaves lying on the water, small far off, most of them towards the sides where they gather.
  for (let i = 0; i < S.leaves; i++) {
    const x = Math.floor(rand() * W);
    const y = hz + 5 + Math.floor((H - hz - 5) * rand() ** 0.7);
    const pick = rand();
    if (aside(c, x, y) < 0.8 && rand() < 0.55) continue;
    const colour = pick < 0.3 ? P.leafRust : pick < 0.75 ? P.leafOrange : P.leafGold;
    dot(b, x, y, colour);
    if ((y - hz) / (H - hz) > 0.35) dot(b, x + 1, y, colour);
  }
}

/**
 * Mist as wisps: thin level streaks, most of them near `peak`, on a buffer of
 * their own so they can drift.
 * @param {Buf} b @param {number} peak @param {number} span @param {number} count @param {Palette} P @param {() => number} rand
 */
function paintWisps(b, peak, span, count, P, rand) {
  for (let i = 0; i < count; i++) {
    const y = Math.round(peak + (rand() + rand() - 1) * span);
    const len = 8 + Math.floor(rand() * 46);
    const x = Math.floor(rand() * (b.w + len)) - len;
    const thick = Math.abs(y - peak) < span * 0.4 && rand() < 0.35 ? 2 : 1;
    const colour = rand() < 0.5 ? P.mist : P.fogLight;
    for (let k = 0; k < len; k++) {
      // Each streak frays out at its ends.
      const end = Math.min(k, len - 1 - k);
      if (end < 4 && (x + k) % 2) continue;
      dot(b, x + k, y, colour);
      if (thick === 2 && end > 5) dot(b, x + k, y + 1, colour);
    }
  }
}

/**
 * Autumn's fallen leaves on a thing painted on its own (photo 11): lying on
 * whatever has nothing above it, and with `caught` above 0 also tangled in
 * among its blades. Brown beech leaves mostly, some orange, a few yellow; two
 * pixels across where they lie flat, one where they hang. Only above the
 * waterline `to`, from row `from` down.
 * @param {Buf} b @param {number} amount  Leaves per pixel of top surface. @param {number} caught  The same, among its blades.
 * @param {Palette} P @param {() => number} rand @param {number} [from] @param {number} [to]
 */
function litterOn(b, amount, caught, P, rand, from = 0, to = b.h) {
  /** @type {[number, number][]} */
  const tops = [];
  /** @type {[number, number][]} */
  const within = [];
  for (let y = Math.max(1, from); y < Math.min(to, b.h); y++) {
    for (let x = 0; x < b.w; x++) {
      if (b.px[y * b.w + x] < 0) continue;
      if (b.px[(y - 1) * b.w + x] < 0) tops.push([x, y]);
      else within.push([x, y]);
    }
  }
  const colour = () => {
    const pick = rand();
    return pick < 0.45 ? P.sunkLeaf : pick < 0.7 ? P.leafRust : pick < 0.9 ? P.leafOrange : P.leafGold;
  };
  for (let i = 0; i < tops.length * amount; i++) {
    const [x, y] = tops[Math.floor(rand() * tops.length)];
    const c = colour();
    dot(b, x, y - 1, c);
    if (rand() < 0.6) dot(b, x + (rand() < 0.5 ? -1 : 1), y - 1, c);
  }
  for (let i = 0; i < within.length * caught; i++) {
    const [x, y] = within[Math.floor(rand() * within.length)];
    const c = colour();
    dot(b, x, y, c);
    if (rand() < 0.4) dot(b, x + 1, y, c);
  }
  return b;
}

/**
 * Snow lying on a thing painted on its own (photo 10): thick rounded pillows
 * on whatever is roughly level on top, not a dusting. Thin blades and twigs
 * stick out of it; sides too steep to hold snow (a trunk, a leg going down)
 * stay bare. Each pillow is bright on top, overhangs a pixel at its ends, and
 * goes blue-grey on its shaded right end and underneath. Lies from row `from`
 * down to the waterline `to`; nothing below the water.
 * @param {Buf} b @param {number} thick  How deep, in rows, at its deepest. @param {Palette} P
 * @param {number} [from] @param {number} [to]
 */
function snowCap(b, thick, P, from = 0, to = b.h) {
  const filled = (/** @type {number} */ x, /** @type {number} */ y) => x >= 0 && y >= 0 && x < b.w && y < b.h && b.px[y * b.w + x] >= 0;
  // Where each column's solid top is: the first pixel with most of its neighbours filled, so a lone blade doesn't count.
  const top = new Int32Array(b.w).fill(-1);
  for (let x = 0; x < b.w; x++) {
    for (let y = 1; y < to; y++) {
      if (!filled(x, y)) continue;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (filled(x + dx, y + dy)) n++;
      if (n < 5) continue;
      if (y >= from) top[x] = y;
      break;
    }
  }
  const at = (/** @type {number} */ x) => (x >= 0 && x < b.w ? top[x] : -1);
  // Too steep to hold snow where the top jumps on both sides; elsewhere rounded, the mean of its neighbours' tops.
  const level = new Int32Array(b.w).fill(-1);
  for (let x = 0; x < b.w; x++) {
    if (top[x] < 0) continue;
    const l = at(x - 1);
    const r = at(x + 1);
    if (l >= 0 && Math.abs(l - top[x]) > 3 && r >= 0 && Math.abs(r - top[x]) > 3) continue;
    const near = [at(x - 2), l, top[x], r, at(x + 2)].filter((v) => v >= 0 && Math.abs(v - top[x]) <= 3);
    level[x] = Math.round(near.reduce((sum, v) => sum + v, 0) / near.length);
  }
  // Runs of level columns, each a pillow.
  for (let x = 0; x < b.w; x++) {
    if (level[x] < 0 || (x > 0 && level[x - 1] >= 0)) continue;
    let end = x;
    while (end + 1 < b.w && level[end + 1] >= 0) end++;
    const len = end - x + 1;
    if (len < 2) continue;
    for (let k = x; k <= end; k++) {
      // Deepest in the middle of the run, tapering to its ends.
      const e = Math.min(k - x, end - k);
      const deep = Math.max(1, Math.min(Math.round(thick * (0.75 + 0.25 * Math.sin(k * 0.9 + x))), e + 2, Math.ceil(len / 2)));
      const y0 = level[k] - deep + 1;
      for (let y = y0; y <= level[k]; y++) {
        const shaded = k >= end - 1 || y === level[k];
        dot(b, k, y, y === y0 && !shaded ? P.snowLight : shaded ? (y === level[k] && k >= end - 1 ? P.snowBlue : P.snowShade) : P.snow);
      }
      // Its blue shadow on whatever is under it.
      if (filled(k, level[k] + 1) && level[k] + 1 < to) dot(b, k, level[k] + 1, P.snowBlue);
    }
    // Overhanging a pixel at each end, drooping.
    for (const [k, dir] of [[x - 1, -1], [end + 1, 1]]) {
      const y = level[k - dir];
      if (y + 1 < to) {
        dot(b, k, y, dir < 0 ? P.snow : P.snowShade);
        dot(b, k, y + 1, P.snowBlue);
      }
    }
  }
  return b;
}

/**
 * A pillow of snow (photo 10): the top of an ellipse, lit at its upper left,
 * shaded blue-grey to its lower right, a blue shadow along its bottom edge,
 * which is a little uneven where it hangs over what it lies on.
 * @param {Buf} b @param {number} cx @param {number} cy  Its middle. @param {number} rx @param {number} ry @param {Palette} P
 */
function pillow(b, cx, cy, rx, ry, P) {
  const bottom = (/** @type {number} */ x) => Math.round(cy + ry * 0.35 + Math.sin(x * 1.3 + cx) * 0.8);
  for (let x = Math.round(cx - rx); x <= cx + rx; x++) {
    const u = (x - cx) / rx;
    const top = Math.round(cy - ry * Math.sqrt(Math.max(0, 1 - u * u)));
    const end = bottom(x);
    for (let y = top; y <= end; y++) {
      const v = (y - top) / Math.max(1, end - top);
      const light = u * 0.6 + v * 0.7;
      dot(b, x, y, y === end ? P.snowBlue : y === top && u < 0.3 ? P.snowLight : light > 0.85 ? P.snowShade : P.snow);
    }
  }
}

/**
 * A low heap of dead grass in the water (photo 10), which the snow turns into
 * a little white island. Winter only: the rest of the year it lies under the
 * surface with the weed.
 * @param {Buf} b @param {{ x: number, y: number, r: number }} h @param {Palette} P @param {() => number} rand
 */
function paintHummock(b, h, P, rand) {
  for (let y = Math.round(h.y - h.r * 0.45); y <= h.y; y++) {
    const hw = h.r * Math.sqrt(Math.max(0, 1 - ((h.y - y) / (h.r * 0.5)) ** 2));
    for (let x = Math.round(h.x - hw); x <= h.x + hw; x++) dot(b, x, y, sift(0.4, x, y) ? P.strawDark : P.sedgeDeep);
  }
  for (let x = Math.round(h.x - h.r); x <= h.x + h.r; x++) if (sift(0.6, x, h.y + 1)) dot(b, x, h.y + 1, P.waterBlack);
  pillow(b, h.x, h.y - h.r * 0.3, h.r * 1.0, h.r * 0.5, P);
  // A few stalks of dead grass sticking out of it.
  for (let i = 0; i < 3; i++) {
    const x = h.x + (rand() - 0.5) * h.r * 1.6;
    const len = 2 + rand() * h.r * 0.3;
    const lean = (rand() - 0.5) * 3;
    const colour = rand() < 0.5 ? P.straw : P.strawDark;
    const foot = h.y - h.r * 0.5;
    stroke(b, { x, y: foot }, { x: x + lean * 0.4, y: foot - len * 0.6 }, { x: x + lean, y: foot - len }, 1, 1, () => colour);
  }
}

// ---------- What grows and lies in the water ----------

/**
 * A sedge tussock (photos 6 and 7): green spikes standing out of the top, last
 * year's straw hanging in a skirt round it, its dark foot in the water. The
 * wind pushes its tips `sway` pixels.
 * @param {Buf} b @param {{ x: number, y: number, r: number }} t @param {Palette} P @param {SwampSeason} S
 * @param {() => number} rand @param {number} sway
 */
function paintTussock(b, t, P, S, rand, sway) {
  // Its shadow on the water, then the dark heart of it.
  for (let y = t.y; y < t.y + t.r * 0.5; y++) {
    for (let x = Math.round(t.x - t.r); x <= t.x + t.r; x++) {
      const d = ((x - t.x) / t.r) ** 2 + ((y - t.y) / (t.r * 0.5)) ** 2;
      if (d < 1 && sift(1.1 - d, x, y)) dot(b, x, y, P.waterBlack);
    }
  }
  for (let y = Math.round(t.y - t.r * 0.55); y <= t.y; y++) {
    const hw = t.r * 0.7 * Math.sqrt(Math.max(0, 1 - ((t.y - y) / (t.r * 0.6)) ** 2));
    for (let x = Math.round(t.x - hw); x <= t.x + hw; x++) dot(b, x, y, sift(0.3, x, y) ? P.sedgeDark : P.sedgeDeep);
  }
  /** @param {boolean} dead */
  const blade = (dead) => {
    const from = { x: t.x + (rand() - 0.5) * t.r * 1.1, y: t.y - rand() * t.r * 0.35 };
    const dir = (from.x - t.x) / (t.r * 0.55) + (rand() - 0.5) * 0.9;
    const len = t.r * (0.7 + rand() * 0.9);
    // Straw arches right over and hangs to the water; the green stands up and only nods.
    const reach = dead ? len * (0.7 + rand() * 0.6) : len * 0.45;
    const push = sway * (dead ? 0.5 : 1);
    const to = { x: from.x + dir * reach + push, y: dead ? from.y + rand() * t.r * 0.35 : from.y - len * (0.75 + rand() * 0.3) };
    const via = { x: from.x + dir * reach * 0.45 + push * 0.4, y: from.y - len * (dead ? 0.75 : 0.7) };
    const pick = rand();
    const colour = dead ? (pick < 0.3 ? P.strawDark : pick < 0.8 ? P.straw : P.strawLight) : pick < 0.35 ? P.sedgeDark : pick < 0.8 ? P.sedge : P.sedgeLight;
    stroke(b, from, via, to, 1, 1, () => colour);
  };
  const live = Math.round(t.r * 4.5 * S.green);
  const dead = Math.round(t.r * 5 * (1.5 - 0.5 * Math.min(1, S.green)));
  for (let i = 0; i < dead; i++) blade(true);
  if (S.snow) {
    // Winter (photo 10): snow lies on it in a dome, the straw hanging out beneath, a few stalks through the top.
    pillow(b, t.x, t.y - t.r * 0.45, t.r * 1.05, t.r * 0.6, P);
    for (let i = 0; i < t.r * 0.5; i++) blade(false);
    return;
  }
  for (let i = 0; i < live; i++) blade(false);
}

/**
 * A bed of grass standing in the shallows (photo 8), its tips pushed `sway` pixels by the wind.
 * @param {Buf} b @param {{ x0: number, x1: number, y: number, h: number }} bed @param {Palette} P @param {() => number} rand
 * @param {number} sway
 */
function paintGrass(b, bed, P, rand, sway) {
  for (let x = bed.x0; x <= bed.x1; x++) {
    // Its edge on the water is ragged.
    const foot = bed.y + Math.round(Math.sin(x * 0.21) * 1.5 + rand() * 2);
    for (let i = 0; i < 2; i++) {
      const h = bed.h * (0.6 + rand() * 0.7);
      const lean = (rand() - 0.5) * 4 + sway * 0.6;
      const pick = rand();
      const colour = pick < 0.3 ? P.grassDark : pick < 0.8 ? P.grass : P.grassLight;
      stroke(b, { x, y: foot }, { x: x + lean * 0.3, y: foot - h * 0.6 }, { x: x + lean, y: foot - h }, 1, 1, () => colour);
    }
    dot(b, x, foot + 1, P.waterBlack);
  }
}

/**
 * The island (photo 8): an old stump's mound grown over with fern, thin
 * saplings standing out of it, in leaf from spring to autumn.
 * @param {Buf} b @param {{ x: number, y: number, w: number }} isle @param {Palette} P @param {SwampSeason} S
 * @param {() => number} rand @param {(x: number, y: number) => number} noise
 */
function paintIsland(b, isle, P, S, rand, noise) {
  const hw = isle.w / 2;
  const tall = isle.w * 0.36;
  for (let x = Math.round(isle.x - hw); x <= isle.x + hw; x++) {
    const u = (x - isle.x) / hw;
    const top = Math.round(isle.y - tall * Math.sqrt(Math.max(0, 1 - u * u)) * (0.8 + 0.3 * noise(x * 0.3, 5)));
    for (let y = top; y <= isle.y; y++) {
      const n = noise(x * 0.9, y * 0.9 + 12);
      const lit = (y - top) / Math.max(1, isle.y - top);
      dot(b, x, y, lit > 0.75 ? P.earth : n > 0.62 ? P.fernLight : n > 0.3 ? P.fern : P.mossDark);
    }
    // Its reflection.
    for (let k = 1; k < tall * 0.7; k++) if (sift(1 - k / (tall * 0.7), x, isle.y + k)) dot(b, x, isle.y + k, k < 2 ? P.waterBlack : P.waterDark);
  }
  const stems = Math.max(2, Math.round(isle.w / 12));
  for (let i = 0; i < stems; i++) {
    const x = isle.x + (i / (stems - 1) - 0.5) * hw * 0.8 - hw * 0.1;
    const h = isle.w * (0.9 + rand() * 0.7);
    const lean = (rand() - 0.5) * isle.w * 0.3;
    const from = { x, y: isle.y - tall * 0.8 };
    const to = { x: x + lean, y: from.y - h };
    stroke(b, from, { x: x + lean * 0.2, y: from.y - h * 0.5 }, to, isle.w > 36 ? 2 : 1, 1, (px, py, u) => (u > 0.5 ? P.barkShade : P.bark));
    // Leaves out on the twigs.
    for (let k = 0; k < isle.w * 0.5 * S.twigs; k++) {
      const at = 0.35 + rand() * 0.65;
      const lx = from.x + (to.x - from.x) * at + (rand() - 0.5) * isle.w * 0.45;
      const ly = from.y - h * at + (rand() - 0.5) * 5;
      dot(b, lx, ly, rand() < 0.4 ? P.leaf : P.fernLight);
      if (rand() < 0.5) dot(b, lx + 1, ly, P.fernLight);
    }
  }
}

/**
 * A half-sunk log (photos 6 and 7): a strip of moss along its top, dark
 * below, lying at a slant, both ends going under.
 * @param {Buf} b @param {{ x: number, y: number, len: number, slope: number }} log @param {Palette} P
 */
function paintLog(b, log, P) {
  for (let i = 0; i < log.len; i++) {
    const x = log.x + i;
    const end = Math.min(i, log.len - 1 - i);
    // The ends dip under the surface.
    const y = Math.round(log.y + i * log.slope) + (end < 3 ? 1 : 0);
    const thick = end < 4 ? 1 : 3;
    if (thick === 3) {
      dot(b, x, y, sift(0.5, x, y) ? P.mossBright : P.moss);
      dot(b, x, y + 1, sift(0.4, x, y) ? P.mossMid : P.mossDark);
      dot(b, x, y + 2, P.logDark);
    } else dot(b, x, y + 1, P.log);
    if (sift(0.7, x, y)) dot(b, x, y + 3, P.waterBlack);
  }
}

/**
 * A fallen branch lying across the near water (photo 6), crooked, one twig off it.
 * @param {Buf} b @param {{ x: number, y: number, len: number }} br @param {Palette} P
 */
function paintBranch(b, br, P) {
  const colour = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ u) => (u < 0.5 ? P.oakLight : P.oakShade);
  const mid = { x: br.x + br.len * 0.45, y: br.y - 4 };
  stroke(b, { x: br.x, y: br.y }, { x: br.x + br.len * 0.2, y: br.y - 5 }, mid, 2, 2, colour);
  stroke(b, mid, { x: br.x + br.len * 0.7, y: br.y - 2 }, { x: br.x + br.len, y: br.y + 3 }, 2, 1, colour);
  stroke(b, mid, { x: mid.x + 8, y: mid.y + 5 }, { x: mid.x + 16, y: mid.y + 9 }, 1, 1, () => P.oakShade);
}

// ---------- The painting ----------

/** How far the mist drifts either way, in pixels: its buffers are this much wider each side. */
export const MIST_DRIFT = 24;

/**
 * The swamp painted for a season, as the layers the scene stacks, bottom to
 * top: `water` (the far wood and the water, three frames of its shimmer),
 * `farMist` (wisps along the far bank), `far` (what stands beyond the low
 * mist), `lowMist`, `near` (what stands this side of it), and `front` (the
 * big tree and the tussocks close up, drawn over the bobber and the line).
 * `far`, `near` and `front` have three frames each: the sedge and the grass
 * as the wind pushes them. The mists are MIST_DRIFT wider each side.
 * @param {() => number} rand  Uniform [0, 1), the scenery stream.
 * @param {string} [season]  One of the game's seasons.
 * @returns {{ water: Buf[], farMist: Buf, far: Buf[], lowMist: Buf, near: Buf[], front: Buf[] }}
 */
export function paintSwampLayers(rand, season = 'spring') {
  const S = SWAMP_SEASONS[swampSeason(season)];
  const P = S.palette;
  const c = SWAMP_LAYOUT;
  const seed = () => Math.floor(rand() * 2 ** 31);
  const noise = makeNoise(seed());
  const woodSeed = seed();
  const waterSeed = seed();
  const water = [0, 1, 2].map((frame) => {
    const b = makeBuf();
    paintFarWood(b, c, P, S, stream(woodSeed), noise);
    paintWater(b, c, P, S, waterSeed, noise, frame);
    return b;
  });
  // Mist along the far bank, so the far trunks stand in it, and a thinner one low over the middle water.
  const low = Math.round(c.horizon + (H - c.horizon) * 0.2);
  const farMist = makeBuf(W + 2 * MIST_DRIFT);
  paintWisps(farMist, c.horizon - 1, 9, Math.round(80 * S.mist), P, stream(seed()));
  const lowMist = makeBuf(W + 2 * MIST_DRIFT);
  paintWisps(lowMist, low, 6, Math.round(30 * S.mist), P, stream(seed()));

  // Everything standing in the water, each on a buffer of its own: one frame, or three where the wind moves it.
  /** @type {{ y: number, front: boolean, frames: Buf[] }[]} */
  const things = [];
  /**
   * @param {number} y @param {boolean} front @param {number} snow  How deep the snow lies on it, in rows.
   * @param {(b: Buf, rand: () => number, sway: number) => void} paint @param {boolean} sways
   * @param {number} [to]  Its waterline, below which no snow lies.
   * @param {number} [leaves]  In autumn, leaves per pixel of its top. @param {number} [caught]  And among its blades.
   */
  const add = (y, front, snow, paint, sways, to = y, leaves = 0.15, caught = 0) => {
    const mine = seed();
    const frames = (sways ? [0, 1, 2] : [0]).map((sway) => {
      const b = makeBuf();
      paint(b, stream(mine), sway);
      if (S.litter) litterOn(b, leaves * S.litter, caught * S.litter, P, stream(mine + 7), 0, to);
      return S.snow && snow ? snowCap(b, snow, P, 0, to) : b;
    });
    things.push({ y, front, frames });
  };
  for (const t of c.trees) {
    const tree = paintTree(t, P, stream(seed()), noise);
    // Snow lies on the roots, the knees and the foot, not up the trunk.
    const deep = [3, 2, 1][t.tier ?? 0];
    // Leaves on the roots, the knees and the lobes at its foot, as on snow.
    if (S.litter) litterOn(tree, 0.35 * S.litter, 0, P, stream(seed()), t.foot - Math.round(t.w * 1.8), t.foot);
    things.push({ y: t.foot, front: Boolean(t.front), frames: [S.snow ? snowCap(tree, deep, P, t.foot - Math.round(t.w * 1.8), t.foot) : tree] });
  }
  for (const t of c.tussocks) add(t.y, Boolean(t.front), 0, (b, r, sway) => paintTussock(b, t, P, S, r, sway), true, t.y, 0.4, 0.1);
  for (const g of c.grass) add(g.y, false, 2, (b, r, sway) => paintGrass(b, g, P, r, sway), true, g.y + 3, 0.4, 0.15);
  for (const l of c.logs) add(l.y, false, 3, (b) => paintLog(b, l, P), false, H, 0.4);
  add(c.island.y, false, 4, (b, r) => paintIsland(b, c.island, P, S, r, noise), false, c.island.y, 0.3, 0.03);
  add(H, true, 2, (b) => paintBranch(b, c.branch, P), false, H, 0.3);
  if (S.snow) for (const h of c.hummocks) add(h.y, false, 0, (b, r) => paintHummock(b, h, P, r), false);
  things.sort((a, b) => a.y - b.y);
  /** @param {(t: { y: number, front: boolean }) => boolean} which */
  const group = (which) =>
    [0, 1, 2].map((frame) => {
      const b = makeBuf();
      for (const thing of things) if (which(thing)) lay(b, thing.frames[Math.min(frame, thing.frames.length - 1)]);
      return b;
    });
  return {
    water,
    farMist,
    far: group((t) => !t.front && t.y <= low + 2),
    lowMist,
    near: group((t) => !t.front && t.y > low + 2),
    front: group((t) => t.front),
  };
}

/**
 * A buffer as a picture's bytes, four a pixel; nothing there is clear.
 * @param {Buf} b @returns {Uint8ClampedArray}
 */
export function swampBytes(b) {
  const out = new Uint8ClampedArray(b.w * b.h * 4);
  for (let i = 0; i < b.px.length; i++) {
    const c = b.px[i];
    if (c < 0) continue;
    out[i * 4] = c >> 16;
    out[i * 4 + 1] = (c >> 8) & 255;
    out[i * 4 + 2] = c & 255;
    out[i * 4 + 3] = 255;
  }
  return out;
}

/**
 * The swamp as one still picture, 320×256: the art sheet's seasons.
 * @param {() => number} rand @param {string} [season] @returns {Uint8ClampedArray}
 */
export function swampStill(rand, season = 'spring') {
  const layers = paintSwampLayers(rand, season);
  const all = makeBuf();
  lay(all, layers.water[0]);
  lay(all, layers.farMist, MIST_DRIFT);
  lay(all, layers.far[0]);
  lay(all, layers.lowMist, MIST_DRIFT);
  lay(all, layers.near[0]);
  lay(all, layers.front[0]);
  return swampBytes(all);
}
