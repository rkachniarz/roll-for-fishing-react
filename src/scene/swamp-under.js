// @ts-check
// Under the swamp's water (D159): what the Look Underwater and the dive show
// at the swamp, in place of the clear teal water the other spots still have.
// Painted as code, like the swamp above it (src/scene/swamp-pixels.js), into
// plain pixel buffers.
//
// Murky green water, lit from a surface half covered by duckweed, thickening
// to near black at the bottom, with silt hanging in it. Far behind, darkened
// by the water, a tree from two of the owner's photos: photo 3's foot, its
// roots down in the mud, and photo 5's burled trunk going up out of sight
// (src/scene/swamp-roots.js). Close
// up, the owner's sunk branch (docs/design/swamp/photo-12-underwater-branch.png):
// a thick limb crusted with growths, branching into twigs that curl, kept low
// and to the sides so the fish have the open water in the middle.

import { SWAMP_ROOTS } from './swamp-roots.js';
import { dot, has, makeBuf, makeNoise, mix, ramp, sift, stream, swampBytes, lay } from './swamp-pixels.js';

/** The painting's size, as the swamp's: the play area's 256 plus a strip either side (D93). */
export const UNDER_W = 320;
export const UNDER_H = 256;
const W = UNDER_W;
const H = UNDER_H;
/** How far the silt drifts either way: its buffer is this much wider each side. */
export const SILT_DRIFT = 24;

/** Every colour, by name (docs/art.md). */
export const SWAMP_UNDER = {
  surfaceLight: '#a9b886',
  surface: '#87a067',
  duckweed: '#2f3c24',
  duckweedLight: '#4f6234',
  water1: '#6c8a52',
  water2: '#587447',
  water3: '#47603c',
  water4: '#374d31',
  water5: '#293b26',
  water6: '#1d2b1e',
  shaft: '#8ba566',
  silt: '#a2ae80',
  siltDark: '#55623f',
  mudFar: '#2f3a28',
  mud: '#3b3d2a',
  mudNear: '#4a4431',
  mudGrain: '#2a271c',
  leaf: '#5e4429',
  barkLight: '#9a9c8f',
  bark: '#7b7e73',
  barkShade: '#5a5e55',
  barkDark: '#3c413b',
  barkDeep: '#262b26',
  moss: '#67862d',
  limb: '#4a4232',
  limbShade: '#2d281f',
  crust: '#7b7154',
  crustLight: '#a39673',
  crustGreen: '#5c6a3b',
};

/** The water at row y: lit near the surface, near black at the bottom. @param {number} y */
const waterAt = (y) => {
  const steps = [SWAMP_UNDER.water1, SWAMP_UNDER.water2, SWAMP_UNDER.water3, SWAMP_UNDER.water4, SWAMP_UNDER.water5, SWAMP_UNDER.water6];
  return steps[Math.min(steps.length - 1, Math.floor((y / H) * steps.length))];
};

/**
 * The mud heaped around the far tree's foot, so the roots go down into it
 * (the owner's markup): its top at columns of the picture, between them straight.
 */
const MOUND = [[168, 207], [180, 202], [192, 204], [206, 200], [220, 204], [236, 202], [252, 199], [264, 195],
  [274, 201], [284, 196], [292, 191], [300, 197], [310, 196], [320, 194], [332, 207]];

/** Where the bottom is at column x: far off, so high up the picture, a little uneven. @param {number} x */
export function underFloor(x) {
  const flat = Math.round(206 + Math.sin(x * 0.05) * 2 + Math.sin(x * 0.17 + 1) * 1.2);
  const k = MOUND.findIndex(([mx]) => mx > x);
  if (k <= 0) return flat;
  const [x0, y0] = MOUND[k - 1];
  const [x1, y1] = MOUND[k];
  return Math.min(flat, Math.round(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)));
}

/**
 * The water: bands blended through dithered rows, thick with silt in
 * patches; the surface's underside at the top, bright, with duckweed lying on
 * it in dark rafts; a few weak shafts of light through the gaps.
 * @param {ReturnType<typeof makeBuf>} b @param {() => number} rand @param {(x: number, y: number) => number} noise
 */
function paintWater(b, rand, noise) {
  const P = SWAMP_UNDER;
  const steps = [P.water1, P.water2, P.water3, P.water4, P.water5, P.water6];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Murkier in patches: the silt the water carries.
      const t = y / H + (noise(x * 0.02, y * 0.03) - 0.5) * 0.12;
      dot(b, x, y, ramp(steps, t, x, y));
    }
  }
  // The surface's underside: a bright wavering band, and duckweed rafts as dark blotches on it.
  for (let x = 0; x < W; x++) {
    const depth = 3 + Math.round(Math.sin(x * 0.11) * 1.5 + noise(x * 0.2, 3) * 2);
    for (let y = 0; y < depth; y++) dot(b, x, y, y < depth - 1 ? P.surfaceLight : sift(0.5, x, y) ? P.surface : P.water1);
    const raft = noise(x * 0.035, 50);
    if (raft > 0.52) {
      const hang = Math.round((raft - 0.52) * 18 + noise(x * 0.5, 9) * 2);
      for (let y = 0; y <= hang; y++) dot(b, x, y, y === hang ? (sift(0.5, x, y) ? P.duckweedLight : P.duckweed) : P.duckweed);
    }
  }
  // Weak shafts of light, down from the gaps between the rafts, slanting and fading.
  for (let i = 0; i < 5; i++) {
    let x0 = Math.floor(rand() * W);
    for (let tries = 0; tries < 10 && noise(x0 * 0.035, 50) > 0.5; tries++) x0 = Math.floor(rand() * W);
    const wide = 5 + Math.floor(rand() * 6);
    const len = 120 + Math.floor(rand() * 70);
    for (let y = 6; y < len; y++) {
      const from = x0 + Math.floor(y * 0.3);
      for (let x = from; x < from + wide; x++) if ((x + y) % 2 === 0 && rand() < 0.55 * (1 - y / len)) dot(b, x, y, P.shaft);
    }
  }
}

/**
 * The far tree, darkened by the water: photo 3's foot with photo 5's trunk
 * on it (baked in src/scene/swamp-roots.js from the picture's top down to the
 * mud), its tones mixed most of the way into the water at each depth.
 * @param {ReturnType<typeof makeBuf>} b
 */
function paintRoots(b) {
  const P = SWAMP_UNDER;
  const left = 156;
  /** @type {Record<string, string>} */
  const tone = { 1: P.barkLight, 2: P.bark, 3: P.barkShade, 4: P.barkDark, 5: P.barkDeep, m: P.moss };
  // Far off and deep: mostly the water's colour, and that a little darker than the water around it.
  const at = (/** @type {string} */ k, /** @type {number} */ y) => mix(tone[k], mix(P.water3, P.water6, Math.min(1, (y + 40) / H)), 0.72);
  SWAMP_ROOTS.forEach((row, y) => {
    [...row].forEach((k, c) => {
      if (k !== '.') dot(b, left + c, y, at(k, y));
    });
  });
}

/**
 * The bottom, far off: mud going away, hazed towards the water, with grains,
 * a few sunk leaves and a stick or two.
 * @param {ReturnType<typeof makeBuf>} b @param {() => number} rand
 */
function paintFloor(b, rand) {
  const P = SWAMP_UNDER;
  for (let x = 0; x < W; x++) {
    const top = underFloor(x);
    for (let y = top; y < H; y++) {
      const t = (y - top) / (H - top);
      dot(b, x, y, rand() < 0.1 ? P.mudGrain : ramp([mix(P.mudFar, P.water5, 0.3), P.mud, P.mudNear], t, x, y));
    }
    dot(b, x, top, mix(P.mudFar, P.water4, 0.4));
  }
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rand() * W);
    const y = underFloor(x) + 3 + Math.floor(rand() * (H - 210));
    dot(b, x, y, P.leaf);
    if (y > 228) dot(b, x + 1, y, P.leaf);
  }
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(rand() * W);
    const y = 220 + Math.floor(rand() * 30);
    const len = 8 + Math.floor(rand() * 16);
    for (let k = 0; k < len; k++) dot(b, x + k, y + Math.round(k * (rand() < 0.5 ? 0.1 : -0.1)), P.limbShade);
  }
}

/**
 * Silt hanging in the water, on a buffer of its own so it can drift.
 * @param {() => number} rand
 */
function paintSilt(rand) {
  const P = SWAMP_UNDER;
  const b = makeBuf(W + 2 * SILT_DRIFT, H);
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(rand() * b.w);
    const y = 8 + Math.floor(rand() * 196);
    dot(b, x, y, rand() < 0.55 ? P.silt : P.siltDark);
  }
  return b;
}

/**
 * A limb: a curve from `from` to `to`, pulled towards `via`, as a chain of
 * discs `w0` to `w1` across, so it is as thick whichever way it runs. Lit
 * from above: crust on top, the wood's own colour in the middle, dark below.
 * @param {ReturnType<typeof makeBuf>} b @param {{ x: number, y: number }} from @param {{ x: number, y: number }} via
 * @param {{ x: number, y: number }} to @param {number} w0 @param {number} w1
 */
function limb(b, from, via, to, w0, w1) {
  const P = SWAMP_UNDER;
  const steps = Math.ceil(Math.hypot(via.x - from.x, via.y - from.y) + Math.hypot(to.x - via.x, to.y - via.y)) * 2 + 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const cx = u * u * from.x + 2 * u * t * via.x + t * t * to.x;
    const cy = u * u * from.y + 2 * u * t * via.y + t * t * to.y;
    const r = (w0 + (w1 - w0) * t) / 2;
    for (let y = Math.floor(cy - r); y <= cy + r; y++) {
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r + 0.25) continue;
        const v = (y - (cy - r)) / Math.max(1, 2 * r);
        dot(b, x, y, v < 0.3 ? P.crust : v > 0.72 ? P.limbShade : P.limb);
      }
    }
  }
}

/**
 * The sunk branch (photo 12), close up: limbs as curves, thick to thin, each
 * crusted with lumpy growths along its top and darker beneath. Painted on its
 * own buffer: it is the front layer, over the fish.
 * @param {() => number} rand
 */
function paintBranch(rand) {
  const P = SWAMP_UNDER;
  const b = makeBuf();
  /** @type {{ from: { x: number, y: number }, via: { x: number, y: number }, to: { x: number, y: number }, w0: number, w1: number }[]} */
  const limbs = [
    // The main limb, from the bottom left rising to the right, then on up as a thinner bough.
    { from: { x: -14, y: 240 }, via: { x: 90, y: 206 }, to: { x: 196, y: 188 }, w0: 17, w1: 11 },
    { from: { x: 196, y: 188 }, via: { x: 262, y: 178 }, to: { x: 332, y: 132 }, w0: 11, w1: 7 },
    // Limbs going down into the mud, as in the photo.
    { from: { x: 58, y: 220 }, via: { x: 48, y: 238 }, to: { x: 54, y: 264 }, w0: 9, w1: 7 },
    { from: { x: 238, y: 182 }, via: { x: 252, y: 212 }, to: { x: 244, y: 264 }, w0: 9, w1: 6 },
    // Boughs reaching up and curling.
    { from: { x: 112, y: 204 }, via: { x: 70, y: 178 }, to: { x: 52, y: 144 }, w0: 8, w1: 4 },
    { from: { x: 160, y: 194 }, via: { x: 176, y: 160 }, to: { x: 206, y: 152 }, w0: 7, w1: 4 },
    { from: { x: 272, y: 168 }, via: { x: 302, y: 150 }, to: { x: 296, y: 114 }, w0: 7, w1: 3 },
    { from: { x: 20, y: 230 }, via: { x: 2, y: 196 }, to: { x: 22, y: 174 }, w0: 7, w1: 3 },
  ];
  // Twigs off every limb, crooked: out and up, a kink, then curling back over at the tip, as the photo's do.
  /** @type {typeof limbs} */
  const twigs = [];
  for (const l of limbs) {
    const n = Math.round(l.w0 / 1.1);
    for (let i = 0; i < n; i++) {
      const s0 = 0.15 + rand() * 0.8;
      const u = 1 - s0;
      const at = { x: u * u * l.from.x + 2 * u * s0 * l.via.x + s0 * s0 * l.to.x, y: u * u * l.from.y + 2 * u * s0 * l.via.y + s0 * s0 * l.to.y };
      const dir = rand() < 0.5 ? -1 : 1;
      const len = 10 + rand() * 22;
      const kink = { x: at.x + dir * len * (0.15 + rand() * 0.3), y: at.y - len * (0.5 + rand() * 0.2) };
      const up = { x: kink.x - dir * len * 0.15, y: kink.y - len * 0.45 };
      const tip = { x: up.x + dir * len * 0.4, y: up.y + len * 0.25 * rand() };
      const w = Math.max(3, Math.round(l.w1 * 0.55));
      twigs.push({ from: at, via: { x: (at.x + kink.x) / 2, y: (at.y + kink.y) / 2 }, to: kink, w0: w, w1: Math.max(2, w - 1) });
      twigs.push({ from: kink, via: up, to: tip, w0: Math.max(2, w - 1), w1: 1 });
    }
  }
  for (const l of [...limbs, ...twigs]) limb(b, l.from, l.via, l.to, l.w0, l.w1);
  // The growths: knobbly lumps all along the top and sides of every limb and
  // twig, pale where the light catches, some green; darker ones beneath.
  // Found first, then painted, so a lump never grows another.
  /** @type {[number, number, 'top' | 'under'][]} */
  const lumps = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 0; x < W; x++) {
      if (!has(b, x, y)) continue;
      if (!has(b, x, y - 1) && rand() < 0.5) lumps.push([x, y, 'top']);
      else if (!has(b, x, y + 1) && rand() < 0.3) lumps.push([x, y, 'under']);
    }
  }
  for (const [x, y, where] of lumps) {
    if (where === 'under') {
      dot(b, x, y + 1, P.limbShade);
      continue;
    }
    const tall = rand() < 0.35 ? 3 : rand() < 0.6 ? 2 : 1;
    for (let k = 1; k <= tall; k++) {
      const c = k === tall ? P.crustLight : rand() < 0.35 ? P.crustGreen : P.crust;
      dot(b, x, y - k, c);
      // A big lump is two pixels wide at its foot.
      if (tall === 3 && k === 1) dot(b, x + 1, y - k, P.crust);
    }
  }
  // Seen through a little water even close up.
  for (let i = 0; i < b.px.length; i++) {
    if (b.px[i] < 0) continue;
    const hex = `#${b.px[i].toString(16).padStart(6, '0')}`;
    b.px[i] = parseInt(mix(hex, P.water4, 0.12).slice(1), 16);
  }
  return b;
}

/**
 * The swamp under its water: `back` (the water, the far roots, the floor),
 * `silt` (SILT_DRIFT wider each side, to drift) and `front` (the branch, over
 * the fish), each a buffer 320×256 like the painting above the water.
 * @param {() => number} rand  The scenery stream.
 */
export function paintSwampUnder(rand) {
  const seed = () => Math.floor(rand() * 2 ** 31);
  const noise = makeNoise(seed());
  const back = makeBuf();
  paintWater(back, stream(seed()), noise);
  paintRoots(back);
  paintFloor(back, stream(seed()));
  return { back, silt: paintSilt(stream(seed())), front: paintBranch(stream(seed())) };
}

/** As one still picture, for the art sheet. @param {() => number} rand @returns {Uint8ClampedArray} */
export function swampUnderStill(rand) {
  const layers = paintSwampUnder(rand);
  const all = makeBuf();
  lay(all, layers.back);
  lay(all, layers.silt, SILT_DRIFT);
  lay(all, layers.front);
  return swampBytes(all);
}
