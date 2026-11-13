// @ts-check
// The reedy shore (D117), painted as code as the pond is (D115): from the
// owner's sketch of where the reeds stand (docs/design/sketch-reedy-shore.png),
// a photo of dense summer reeds (docs/design/photo-reeds-dense.jpg) and one of
// the same reeds in late November (photo-reedy-shore-november.jpg), which is
// how they look all winter. Four seasons (D118): spring's vivid green with last
// year's stalks still standing, summer, autumn turning, winter's dark brown.
//
// Eye level, looking far out over the open lake: sky, a bare horizon at row
// 110 (no far shore), then water to the bottom of the view. Two banks of
// reeds fill the bottom corners, close up, with a channel of open water
// between them where the line goes out. The reeds are a mix, as in the photo:
// broad cattail leaves standing up, fine sedge arching over in pale sunlit
// sweeps, and a few dead brown stalks; a half-sunk log lies in the right bank.
//
// Moves as the pond does (docs/art.md): the water's ripples shimmer in three
// frames, glints flick, rings spread now and then (often, in rain), and gusts
// roll across the reeds from the left. Everything scattered is placed by the
// `rand` it's given (the scenery stream, D4).

import { Container, Sprite, Texture, TextureStyle } from 'pixi.js';
import { paintGrid, paintRing } from './sprites.js';

/** The painting's size: the play area's 256 plus a strip either side (D93). */
const W = 320;
const H = 256;
/** The horizon: where the still water's painting puts its water, too. */
const HZ = 110;
/** Reed sections, each swaying on its own as a gust passes, and how far a blade may lean past its section. */
const SECTION = 40;
const MARGIN = 34;

/**
 * The top of the reeds at every fourth column, read off the owner's sketch
 * (green against blue; docs/design/sketch-reedy-shore.png) and, from x 24 to
 * 123 and 180 to 268, the line the owner drew over the painting to lower the
 * banks towards the channel (markup-reedy-shore.png). 256 is open water.
 */
const SKETCH_TOP = [
  172, 170, 171, 172, 175, 176, 174, 176, 179, 183, 185, 186, 187, 188, 189, 191, 193, 195, 197, 199, 201, 202, 203,
  204, 205, 206, 209, 212, 215, 216, 217, 236, 240, 245, 250, 255, 256, 256, 256, 256, 256, 256, 256, 250, 248, 223,
  219, 215, 210, 207, 205, 204, 202, 201, 200, 199, 199, 199, 198, 197, 195, 193, 191, 187, 183, 182, 181, 180, 182,
  181, 179, 178, 177, 176, 176, 176, 176, 176, 176, 176,
];
/** The top of the reeds at column x, between the sketch's samples. @param {number} x */
function topAt(x) {
  const i = Math.min(Math.max(x, 0), W - 1) / 4;
  const a = SKETCH_TOP[Math.floor(i)];
  const b = SKETCH_TOP[Math.min(Math.floor(i) + 1, SKETCH_TOP.length - 1)];
  return Math.round(a + (b - a) * (i - Math.floor(i)));
}

/** Every colour, by name (docs/art.md: a small, named palette). Summer, from the photo. */
export const REEDY = {
  skyTop: '#5f95d6',
  sky: '#86b1e3',
  skyLow: '#b5d0ec',
  haze: '#d3e2ef',
  cloudLight: '#f4f7fa',
  cloud: '#dfe7ef',
  cloudShade: '#c3d0de',
  cloudDark: '#a9b8cb',
  waterHaze: '#c2d6e6',
  waterFar: '#9dbbd8',
  waterMid: '#7598c2',
  waterNear: '#5578a6',
  waterDeep: '#3b5c88',
  waterDark: '#253f63',
  waterReed: '#1f3a33',
  waveLight: '#d8e6f2',
  waveDark: '#2f4c74',
  glint: '#ffffff',
  reedDeep: '#122a1a',
  reedDark: '#1f4125',
  reedMid: '#2f5f33',
  reedGreen: '#43803f',
  reedLight: '#64a050',
  reedSilver: '#9fbfa4',
  reedPale: '#cddfd0',
  dead: '#7d6a45',
  deadLight: '#a99268',
  deadDark: '#54462e',
  log: '#6f5f48',
  logLight: '#9c8a6c',
  head: '#4a3423',
  headLight: '#6e5038',
  fluff: '#d8cdbb',
};

/**
 * Spring, worked out from summer and the owner's word: a vivid, yellower
 * green, a clear light sky, and last year's brown stalks still standing
 * among the new growth.
 */
export const REEDY_SPRING = {
  ...REEDY,
  skyTop: '#6aa2dd',
  sky: '#93bde8',
  skyLow: '#c0daf0',
  haze: '#dceaf3',
  waterHaze: '#c8dbe9',
  waterFar: '#a3c0dc',
  waterMid: '#7b9ec6',
  waterNear: '#5b7eab',
  waterDeep: '#41628e',
  reedDeep: '#183a1a',
  reedDark: '#2a5a24',
  reedMid: '#43822f',
  reedGreen: '#62a83a',
  reedLight: '#8fcb4f',
  reedSilver: '#b9dc8e',
  reedPale: '#def0b8',
};

/**
 * Autumn, worked out from the summer photo (docs/art.md: a season can be
 * worked out from another): a grey-blue sky, greyer water, and the reeds
 * turned tan and gold with some green left at the foot.
 */
export const REEDY_AUTUMN = {
  ...REEDY,
  skyTop: '#8a9db4',
  sky: '#a4b4c7',
  skyLow: '#c1cbd6',
  haze: '#d5dae0',
  cloudLight: '#e6e9ed',
  cloud: '#d1d6dd',
  cloudShade: '#b6bec9',
  cloudDark: '#9ba5b3',
  waterHaze: '#c4cbd3',
  waterFar: '#a3afbd',
  waterMid: '#7f8fa3',
  waterNear: '#627489',
  waterDeep: '#48596d',
  waterDark: '#323f50',
  waterReed: '#3a3826',
  waveLight: '#d9dde2',
  waveDark: '#3c4a5c',
  reedDeep: '#2e2818',
  reedDark: '#4d4126',
  reedMid: '#73613a',
  reedGreen: '#958049',
  reedLight: '#bba062',
  reedSilver: '#d3c08f',
  reedPale: '#e6dcb9',
};

/**
 * Winter, from the owner's November photo, a little lighter than it came out
 * under the cloud: the cattails dark brown-grey with their brown heads, some
 * gone to fluff, dry pale grass sweeping between, big grey-white clouds over
 * a cold blue sky, and the water silvery where it mirrors them.
 */
export const REEDY_WINTER = {
  ...REEDY,
  skyTop: '#6f8fb8',
  sky: '#93abc9',
  skyLow: '#bccada',
  haze: '#d9dfe6',
  cloudLight: '#eef0f2',
  cloud: '#d2d7de',
  cloudShade: '#a9b2bf',
  cloudDark: '#858f9e',
  waterHaze: '#c9d2dc',
  waterFar: '#a9b7c7',
  waterMid: '#8496ad',
  waterNear: '#647893',
  waterDeep: '#4a5c76',
  waterDark: '#33425a',
  waterReed: '#2c261f',
  waveLight: '#e2e7ec',
  waveDark: '#3d4b60',
  reedDeep: '#211a14',
  reedDark: '#372c22',
  reedMid: '#4b3d30',
  reedGreen: '#5f4e3d',
  reedLight: '#7a6550',
  reedSilver: '#a8977a',
  reedPale: '#c9bba0',
  dead: '#8a7558',
  deadLight: '#ad9878',
  head: '#3b2a1c',
  headLight: '#5c4430',
};

/** What's left green in winter: the dark clumps at the water's edge in the November photo. */
const WINTER_GREENS = {
  ...REEDY_WINTER,
  reedDeep: '#16261a',
  reedDark: '#22372a',
  reedMid: '#2f4a33',
  reedGreen: '#3e5b3c',
  reedLight: '#4f6c45',
  reedSilver: '#6c8164',
  reedPale: '#8d9c82',
};

/**
 * What changes with the season besides the colours: clouds on the horizon;
 * how many blades are still green, drawn in `greens` rather than the season's
 * own reed colours; how many are dead stalks, and how many cattails show
 * their brown heads; glints on the water.
 * @typedef {{ palette: typeof REEDY, greens: typeof REEDY, clouds: number, green: number, dead: number, heads: number,
 *   glints: number }} ReedySeason  `clouds`: how big the clouds are, 0 for none.
 * @type {Record<'spring' | 'summer' | 'autumn' | 'winter', ReedySeason>}
 */
export const REEDY_SEASONS = {
  spring: { palette: REEDY_SPRING, greens: REEDY_SPRING, clouds: 0.8, green: 1, dead: 0.12, heads: 0.02, glints: 60 },
  summer: { palette: REEDY, greens: REEDY, clouds: 1, green: 1, dead: 0.04, heads: 0.03, glints: 60 },
  autumn: { palette: REEDY_AUTUMN, greens: REEDY, clouds: 0, green: 0.3, dead: 0.06, heads: 0.12, glints: 30 },
  // Winter's clouds are the November photo's: big and heavy, up into the sky.
  winter: { palette: REEDY_WINTER, greens: WINTER_GREENS, clouds: 2.2, green: 0.1, dead: 0.08, heads: 0.25, glints: 25 },
};

/**
 * The reedy shore's season for the game's: it has all four.
 * @param {string} season
 * @returns {keyof typeof REEDY_SEASONS}
 */
export function reedySeason(season) {
  return season in REEDY_SEASONS ? /** @type {keyof typeof REEDY_SEASONS} */ (season) : 'summer';
}

// ---------- Drawing helpers ----------

/** @param {number} w @param {number} h */
function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}
/** @param {HTMLCanvasElement} canvas */
const ctxOf = (canvas) => /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
/** @param {CanvasRenderingContext2D} g @param {number} x @param {number} y @param {string} color */
function dot(g, x, y, color) {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), 1, 1);
}
/** 4×4 ordered dither, for blending one colour into the next in a pixel pattern. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
/**
 * A colour along a ramp at t (0 to 1): flat in the middle of each step, and
 * dithered into the next only near the edge between them, so the steps read
 * as bands blended at their seams rather than as one big pattern.
 * @param {string[]} steps @param {number} t @param {number} x @param {number} y
 */
function ramp(steps, t, x, y) {
  const at = Math.min(Math.max(t, 0), 0.9999) * (steps.length - 1);
  const i = Math.floor(at);
  const f = Math.min(Math.max((at - i - 0.3) / 0.4, 0), 1);
  return f > (BAYER[y % 4][x % 4] + 0.5) / 16 ? steps[Math.min(i + 1, steps.length - 1)] : steps[i];
}

// ---------- Sky and water ----------

/**
 * The sky, and in summer a few heaped clouds sitting low on the horizon:
 * bright on top, greyer and flat underneath, as clouds far off look.
 * @param {typeof REEDY} P @param {ReedySeason} S @param {() => number} rand
 */
function paintSky(P, S, rand) {
  const canvas = makeCanvas(W, HZ);
  const g = ctxOf(canvas);
  const sky = [P.skyTop, P.sky, P.skyLow, P.haze];
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) dot(g, x, y, ramp(sky, (y / HZ) ** 1.3, x, y));
  if (!S.clouds) return canvas;
  const size = S.clouds;
  const shades = [P.cloudLight, P.cloud, P.cloudShade, P.cloudDark];
  let x = -10 + rand() * 30;
  while (x < W) {
    const width = (34 + rand() * 46) * Math.sqrt(size);
    const base = HZ - 3 - Math.floor(rand() * 8 * size);
    const height = (14 + rand() * 14) * size;
    const count = 4 + Math.floor(rand() * 3);
    const puffs = Array.from({ length: count }, (_, i) => {
      const px = x + (width * (i + 0.5)) / count + (rand() - 0.5) * 6;
      const r = height * (0.55 + rand() * 0.5) * (1 - Math.abs(i / (count - 1) - 0.5));
      return { x: px, y: base - r * 0.7, r: Math.max(r, 5) };
    });
    for (let py = Math.floor(base - height * 1.6); py < base; py++) {
      for (let px = Math.floor(x - 6); px < x + width + 6; px++) {
        if (px < 0 || px >= W || py < 0) continue;
        // Shaded by height in the cloud, the edge dithered.
        // Lit from above: shaded by how far down its own puff a pixel is.
        let best = Infinity;
        for (const p of puffs) {
          const d = (px - p.x) ** 2 + ((py - p.y) * 1.2) ** 2;
          if (d < p.r * p.r) best = Math.min(best, (py - (p.y - p.r)) / (2 * p.r));
        }
        if (best === Infinity) continue;
        const flat = (py - (base - 4)) / 4;
        dot(g, px, py, ramp(shades, Math.max(best * 0.75, flat), px, py));
      }
    }
    x += width + (20 + rand() * 50) / size;
  }
  return canvas;
}

/**
 * Three frames of the open water: paler towards the horizon where it mirrors
 * the sky, deep blue near the viewer, darker still in the channel beside the
 * reeds. Its ripples are fixed marks that shift a pixel and change length from
 * frame to frame, so the water shimmers in place.
 * @param {typeof REEDY} P @param {() => number} rand
 */
function paintWater(P, rand) {
  const rows = H - HZ;
  const water = [P.waterHaze, P.waterFar, P.waterMid, P.waterNear, P.waterDeep, P.waterDark];
  const base = makeCanvas(W, rows);
  const g = ctxOf(base);
  for (let d = 0; d < rows; d++) {
    const y = HZ + d;
    for (let x = 0; x < W; x++) {
      let colour = ramp(water, Math.sqrt(d / rows) * 1.02, x, d);
      // Beside the reeds the water mirrors them: a dark green edge.
      let near = 99;
      for (let k = 1; k <= 8 && near === 99; k++) {
        if (topAt(x - k) <= y || topAt(x + k) <= y) near = k;
      }
      if (near < 8 && (near < 4 || BAYER[d % 4][x % 4] < 8)) colour = P.waterReed;
      dot(g, x, d, colour);
    }
  }
  // Ripples: small and pale far out, bigger with a dark trough near the viewer.
  /** @type {{ x: number, d: number, len: number, dir: number }[]} */
  const marks = [];
  for (let i = 0; i < 260; i++) {
    const d = Math.floor(rows * rand() ** 1.4);
    marks.push({ x: Math.floor(rand() * W), d, len: 1 + Math.floor((d / rows) * 6 + rand() * 2), dir: rand() < 0.5 ? -1 : 1 });
  }
  return [0, 1, 2].map((frame) => {
    const canvas = makeCanvas(W, rows);
    const fg = ctxOf(canvas);
    fg.drawImage(base, 0, 0);
    for (const m of marks) {
      const x = m.x + [0, 1, 0][frame] * m.dir;
      const len = Math.max(1, m.len + [0, 1, -1][frame]);
      if (topAt(x) <= HZ + m.d + 1 || topAt(x + len) <= HZ + m.d + 1) continue;
      fg.fillStyle = m.d < 25 ? P.waveLight : P.waterHaze;
      fg.fillRect(x, m.d, len, 1);
      if (m.d > 40) {
        fg.fillStyle = P.waveDark;
        fg.fillRect(x + 1, m.d + 1, Math.max(1, len - 1), 1);
      }
    }
    return canvas;
  });
}

// ---------- The reeds ----------

/**
 * One blade: a curve from its foot to its tip, in screen pixels.
 * `bend` pulls the middle sideways, `droop` lets the tip hang below the curve's
 * top (sedge arching over). `width` is 1 or 2; `edge` lights its left side.
 * @typedef {{ x: number, y: number, tipX: number, tipY: number, bend: number, droop: number, width: number,
 *   color: string, edge: string | null, flex: number, head?: boolean }} Blade
 */

/**
 * The reeds as blades, back to front: short dark ones deep in the bank first,
 * tall bright ones at the front last.
 * @param {typeof REEDY} P @param {ReedySeason} S @param {() => number} rand
 * @returns {Blade[]}
 */
function growBlades(P, S, rand) {
  /** @type {Blade[]} */
  const blades = [];
  for (let i = 0; i < 1500; i++) {
    const x = Math.floor(rand() * W);
    const top = topAt(x);
    if (top >= H - 2) continue;
    // How near the viewer: its foot is lower down.
    const near = rand();
    const y = Math.round(top + 14 + near * (H + 20 - top - 14));
    const outline = rand() < 0.65;
    // Most reach the sketch's line; the rest end inside the bank, for texture.
    let tipY = outline ? top - 7 + rand() * 13 : top + 4 + rand() * (y - top) * 0.6;
    tipY = Math.min(tipY, y - 8);
    const len = y - tipY;
    const green = rand() < S.green;
    const C = green ? S.greens : P;
    const kind = rand();
    const sunlit = Math.sin(x / 23 + y / 31) + 0.6 * Math.sin(x / 9 - y / 17) > 0.5;
    if (outline && kind < S.heads) {
      // A cattail's stem standing straight up with its brown head near the top.
      const lean = (rand() - 0.5) * 3;
      blades.push({ x, y, tipX: x + lean, tipY: tipY - 4, bend: 0, droop: 0, width: 1, color: C.reedMid, edge: null, flex: 0.6, head: true });
    } else if (kind < S.heads + S.dead) {
      // A dead stalk, broken off short and leaning.
      const lean = (rand() - 0.5) * len * 0.8;
      blades.push({ x, y, tipX: x + lean, tipY: y - len * (0.5 + rand() * 0.4), bend: 0, droop: 0, width: 2, color: P.dead, edge: P.deadLight, flex: 0.2 });
    } else if (kind < 0.45) {
      // A cattail leaf: broad, standing up, its tip curling over a little.
      const lean = (rand() - 0.45) * len * 0.25;
      const shade = near < 0.3 ? C.reedDark : near < 0.65 ? C.reedMid : C.reedGreen;
      blades.push({
        x, y, tipX: x + lean, tipY, bend: (rand() - 0.5) * 4, droop: rand() < 0.3 ? 4 + rand() * 6 : 0, width: 2,
        color: shade, edge: near > 0.4 ? (sunlit ? C.reedSilver : C.reedLight) : null, flex: 1,
      });
    } else {
      // Sedge: fine, arching over and hanging at the tip, pale where the sun catches the sweep.
      // Leaning every way, but near the channel back into their own bank, not over the water.
      const byChannel = topAt(x + (x < W / 2 ? 14 : -14)) > top + 12;
      const dir = byChannel ? (x < W / 2 ? -1 : 1) : rand() < 0.55 ? -1 : 1;
      const reach = len * (0.2 + rand() * 0.35);
      const shade = near < 0.35 ? C.reedDark : sunlit && near > 0.45 ? (rand() < 0.15 ? C.reedPale : C.reedSilver) : near < 0.7 ? C.reedMid : C.reedLight;
      blades.push({ x, y, tipX: x + dir * reach, tipY: tipY + len * 0.15, bend: dir * reach * 0.3, droop: len * (0.08 + rand() * 0.18), width: 1, color: shade, edge: null, flex: 1.4 });
    }
  }
  // Back to front: the higher the foot, the further off.
  return blades.sort((a, b) => a.y - b.y);
}

/**
 * Draws a blade into g, moved `dx` and with its tip pushed `sway` pixels by the wind.
 * A cattail's head is a brown cigar two pixels wide a little below its tip,
 * lit down one side, now and then gone to fluff.
 * @param {CanvasRenderingContext2D} g @param {Blade} b @param {number} dx @param {number} sway
 * @param {typeof REEDY} P
 */
function paintBlade(g, b, dx, sway, P) {
  const steps = Math.max(4, Math.ceil(Math.hypot(b.tipX - b.x, b.tipY - b.y)));
  // A quadratic curve: up from the foot, over through the control point, down to the tip by `droop`.
  const cx = (b.x + b.tipX) / 2 + b.bend;
  const cy = Math.min(b.y, b.tipY) - b.droop;
  let lastX = NaN;
  let lastY = NaN;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = Math.round(u * u * b.x + 2 * u * t * cx + t * t * b.tipX + sway * b.flex * t * t + dx);
    const y = Math.round(u * u * b.y + 2 * u * t * cy + t * t * b.tipY);
    if (x === lastX && y === lastY) continue;
    lastX = x;
    lastY = y;
    g.fillStyle = b.color;
    // Broad leaves narrow to one pixel for their last fifth.
    g.fillRect(x, y, b.width === 2 && t < 0.8 ? 2 : 1, 1);
    if (b.edge && t > 0.1 && t < 0.85) {
      g.fillStyle = b.edge;
      g.fillRect(x, y, 1, 1);
    }
  }
  if (b.head) {
    const hx = Math.round(b.tipX + sway * b.flex * 0.85 + dx);
    const hy = Math.round(b.tipY + 3);
    const long = 6 + ((b.x * 7 + b.y) % 3);
    g.fillStyle = P.head;
    g.fillRect(hx, hy, 2, long);
    g.fillStyle = P.headLight;
    g.fillRect(hx, hy + 1, 1, long - 2);
    // Gone to seed: a tuft of fluff bursting from one side.
    if ((b.x + b.y) % 5 === 0) {
      g.fillStyle = P.fluff;
      g.fillRect(hx + 2, hy + 1, 1, 2);
      g.fillRect(hx - 1, hy + 3, 1, 1);
    }
  }
}

/**
 * The bank itself under the blades: dense dark stems, so no water shows
 * through the middle of it, and the half-sunk log in the right bank.
 * @param {typeof REEDY} P @param {ReedySeason} S @param {() => number} rand
 */
function paintBank(P, S, rand) {
  const canvas = makeCanvas(W, H);
  const g = ctxOf(canvas);
  const C = P;
  for (let x = 0; x < W; x++) {
    const top = topAt(x) + 9;
    // A stem's worth of lighter colour now and then, so the dark reads as reeds.
    const stem = rand() < 0.3;
    for (let y = top; y < H; y++) {
      const t = (y - top) / Math.max(1, H - top);
      dot(g, x, y, stem && t < 0.7 ? ramp([C.reedMid, C.reedDark], t, x, y) : ramp([C.reedDark, C.reedDeep, C.reedDeep], t, x, y));
    }
  }
  // The log, lying in the water at the right bank's foot, as in the photo.
  for (let i = 0; i < 46; i++) {
    const x = 242 + i;
    const y = 236 - Math.round(i * 0.18);
    g.fillStyle = P.log;
    g.fillRect(x, y, 1, 5);
    g.fillStyle = P.logLight;
    g.fillRect(x, y, 1, 1);
    g.fillStyle = P.deadDark;
    g.fillRect(x, y + 4, 1, 1);
  }
  return canvas;
}

// ---------- The painting ----------

/**
 * The reedy shore painted, in the same two layers as the pond (Pond in
 * pond.js): `back` (sky, water, ripples) goes under the bobber and the line,
 * `front` (the reed banks) over them.
 * @param {() => number} rand  Uniform [0, 1), the scenery stream.
 * @param {string} [season]  One of the game's seasons.
 * @returns {import('./pond.js').Pond}
 */
export function paintReedy(rand, season = 'summer') {
  TextureStyle.defaultOptions.scaleMode = 'nearest';
  const S = REEDY_SEASONS[reedySeason(season)];
  const P = S.palette;
  const tex = (/** @type {HTMLCanvasElement} */ c) => Texture.from(c);

  const back = new Container();
  back.addChild(new Sprite(tex(paintSky(P, S, rand))));
  const waterFrames = paintWater(P, rand).map(tex);
  const water = new Sprite(waterFrames[0]);
  water.y = HZ;
  back.addChild(water);

  // Glints flicking on the water, more of them far out where the sky is mirrored.
  const glintKeys = { p: P.waveLight, g: P.glint };
  const glintSets = [
    [['pg.'], ['.gp']],
    [['.ppg.', 'g...p'], ['pg.p.', '..g.p']],
  ].map((frames) => frames.map((rows) => tex(paintGrid(rows, glintKeys))));
  /** @type {{ sprite: Sprite, frames: Texture[], frame: number, next: number }[]} */
  const glints = [];
  for (let i = 0; i < S.glints; i++) {
    const d = 2 + Math.floor(70 * rand() ** 1.5);
    const x = Math.floor(rand() * (W - 6));
    if (topAt(x) <= HZ + d + 2 || topAt(x + 5) <= HZ + d + 2) continue;
    const frames = glintSets[d < 30 ? 0 : 1];
    const sprite = new Sprite(frames[0]);
    sprite.position.set(x, HZ + d);
    back.addChild(sprite);
    glints.push({ sprite, frames, frame: 0, next: rand() * 2000 });
  }

  const ripples = new Container();
  back.addChild(ripples);
  /** @type {Map<string, Texture>} */
  const ringCache = new Map();
  const ring = (/** @type {number} */ rx, /** @type {number} */ ry) => {
    const key = `${rx}x${ry}`;
    if (!ringCache.has(key)) ringCache.set(key, tex(paintRing(rx, ry, P.waveLight)));
    return /** @type {Texture} */ (ringCache.get(key));
  };
  /** @type {{ x: number, y: number, born: number, life: number, maxRx: number }[]} */
  let rings = [];
  let nextRing = 0;

  // The reeds: the bank, then the blades in sections, each in three frames of the wind.
  const front = new Container();
  front.addChild(new Sprite(tex(paintBank(P, S, rand))));
  const blades = growBlades(P, S, rand);
  const sections = Math.ceil(W / SECTION);
  const reedFrames = Array.from({ length: sections }, (_, s) => {
    const mine = blades.filter((b) => Math.min(Math.floor(b.x / SECTION), sections - 1) === s);
    return [0, 1, 2].map((frame) => {
      const canvas = makeCanvas(SECTION + 2 * MARGIN, H);
      const g = ctxOf(canvas);
      for (const b of mine) paintBlade(g, b, MARGIN - s * SECTION, frame, P);
      return tex(canvas);
    });
  });
  const reeds = reedFrames.map((frames, s) => {
    const sprite = new Sprite(frames[0]);
    sprite.x = s * SECTION - MARGIN;
    front.addChild(sprite);
    return sprite;
  });

  /**
   * Which of the three frames a gust puts the reeds in at column x: gusts
   * roll across from the left, and only a stiff wind bends them twice as far.
   * @param {number} now @param {number} wind @param {number} x
   */
  function gust(now, wind, x) {
    const t = now * 0.0011 * (1 + wind * 0.5);
    const g = Math.sin(t - x / 70) + 0.6 * Math.sin(t * 0.43 + x / 110);
    const frame = g > 0.9 ? 2 : g > -0.1 ? 1 : 0;
    return Math.min(frame, wind >= 2 ? 2 : 1);
  }

  return {
    back,
    front,
    update(now, wind, crop, raining) {
      for (const [s, sprite] of reeds.entries()) sprite.texture = reedFrames[s][gust(now, wind, s * SECTION + SECTION / 2)];
      water.texture = waterFrames[Math.floor(now / (600 / (1 + wind * 0.4))) % 3];
      for (const glint of glints) {
        if (now < glint.next) continue;
        glint.frame = 1 - glint.frame;
        glint.sprite.texture = glint.frames[glint.frame];
        glint.next = now + (700 + rand() * 1800) / (1 + wind * 0.5);
      }
      // A ring now and then where a fish rose; rain all over the open water.
      if (now >= nextRing) {
        const d = Math.floor(rand() * 70) + 4;
        const x = crop + 10 + Math.floor(rand() * (W - 2 * crop - 20));
        if (topAt(x) > HZ + d + 6) rings.push({ x, y: HZ + d, born: now, life: 900, maxRx: d < 30 ? 4 : 7 });
        nextRing = now + (raining ? 90 + rand() * 120 : 1500 + rand() * 2500);
      }
      rings = rings.filter((r) => now - r.born < r.life);
      ripples.removeChildren();
      for (const r of rings) {
        const age = (now - r.born) / r.life;
        const rx = Math.max(1, Math.round(r.maxRx * age));
        const ry = Math.max(1, Math.round(rx * (r.y - HZ < 30 ? 0.3 : 0.42)));
        const sprite = new Sprite(ring(rx, ry));
        sprite.position.set(r.x - rx, r.y - ry);
        sprite.alpha = age < 0.6 ? 1 : 0.5;
        ripples.addChild(sprite);
      }
    },
  };
}
