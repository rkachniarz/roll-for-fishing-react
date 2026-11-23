// @ts-check
// The reedy shore (D117), painted as code as the pond is (D115): from the
// owner's sketch of where the reeds stand (docs/design/sketch-reedy-shore.png),
// a photo of dense summer reeds (docs/design/photo-reeds-dense.jpg) and one of
// the same reeds in late November (photo-reedy-shore-november.jpg), which is
// how they look all winter. Four seasons (D118): spring's vivid green with last
// year's stalks still standing, summer, autumn turning, winter's dark brown.
//
// Eye level, looking far out over the open lake: a bare horizon at row
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
//
// No sky of its own (12.4, D169): above the horizon the painting is empty, and
// the shared sky layer (src/scene/sky-layer.js) shows through.

import { Container, Sprite, Texture, TextureStyle } from 'pixi.js';
import { paintGrid } from './sprites.js';
import { createRings } from './rings.js';
import { WAVE_LEVELS, looksRandom, waveLevel, windOnWater } from './waves.js';

/** The painting's size: the play area's 256 plus a strip either side (D93). */
const W = 320;
const H = 256;
/** The horizon (D169): the sky layer fills everything above it; the still water's painting puts its water here too. */
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
 * What changes with the season besides the colours: how many blades are still green, drawn in `greens` rather than the season's
 * own reed colours; how many are dead stalks, and how many cattails show
 * their brown heads; glints on the water.
 * @typedef {{ palette: typeof REEDY, greens: typeof REEDY, green: number, dead: number, heads: number,
 *   glints: number }} ReedySeason
 * @type {Record<'spring' | 'summer' | 'autumn' | 'winter', ReedySeason>}
 */
export const REEDY_SEASONS = {
  spring: { palette: REEDY_SPRING, greens: REEDY_SPRING, green: 1, dead: 0.12, heads: 0.02, glints: 60 },
  summer: { palette: REEDY, greens: REEDY, green: 1, dead: 0.04, heads: 0.03, glints: 60 },
  autumn: { palette: REEDY_AUTUMN, greens: REEDY, green: 0.3, dead: 0.06, heads: 0.12, glints: 30 },
  winter: { palette: REEDY_WINTER, greens: WINTER_GREENS, green: 0.1, dead: 0.08, heads: 0.25, glints: 25 },
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

// ---------- The water ----------

/**
 * The open water under its ripples: paler towards the horizon where it mirrors
 * the sky, deep blue near the viewer, darker still in the channel beside the
 * reeds. The ripples are drawn over it as they move (`paintRipples`).
 * @param {typeof REEDY} P
 * @param {(x: number) => number} top  The top of the reeds at a column (`topAt`), or none.
 */
function paintWater(P, top) {
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
        if (top(x - k) <= y || top(x + k) <= y) near = k;
      }
      if (near < 8 && (near < 4 || BAYER[d % 4][x % 4] < 8)) colour = P.waterReed;
      dot(g, x, d, colour);
    }
  }
  return base;
}

/**
 * A ripple mark: `x` across (moving with the wind), `u` its depth, 0 at the
 * horizon to 1 at the bottom (its row is `u ** 1.4` of the way down, so they
 * crowd far out and move slower there, as seen from the bank). `rank` says
 * from which wind on it shows, `foam` whether it whitens in a strong one.
 * @typedef {{ x: number, u: number, len: number, dir: number, phase: number, rank: number, foam: number }} Ripple
 */

/**
 * The ripples (D177): the 260 first drawn from the scenery stream as they
 * always were, and as many again from their own generator, so the reeds and
 * glints painted after them stay where they were.
 * @param {() => number} rand
 * @returns {Ripple[]}
 */
function scatterRipples(rand) {
  const rows = H - HZ;
  /** @type {Ripple[]} */
  const marks = [];
  for (let i = 0; i < 260; i++) {
    const d = Math.floor(rows * rand() ** 1.4);
    const x = Math.floor(rand() * W);
    const len = rand();
    marks.push({ x, u: (d / rows) ** (1 / 1.4), len, dir: rand() < 0.5 ? -1 : 1, phase: 0, rank: 0, foam: 0 });
  }
  const own = looksRandom(marks[0].x * 1000 + marks[1].x);
  for (let i = 0; i < 300; i++) {
    marks.push({ x: Math.floor(own() * W), u: own(), len: own(), dir: own() < 0.5 ? -1 : 1, phase: 0, rank: 0, foam: 0 });
  }
  // Which show from which wind on: in a shuffled order, so a light wind's few are spread all over.
  const order = marks.map((_, i) => ({ i, key: own() })).sort((a, b) => a.key - b.key);
  for (const [k, { i }] of order.entries()) {
    marks[i].rank = (k + 0.5) / marks.length;
    marks[i].phase = Math.floor(own() * 3);
    marks[i].foam = own();
  }
  return marks;
}

/**
 * Draws the ripples as the wind has them now: more, longer and with darker
 * troughs the stronger it blows, white-topped near the viewer in a strong one,
 * long crests when it blows straight in or out and shorter across. Small and
 * pale far out, bigger near the viewer.
 * @param {CanvasRenderingContext2D} g @param {Ripple[]} marks @param {typeof REEDY} P
 * @param {(x: number) => number} top
 * @param {number} now @param {number} wind @param {{ across: number, along: number }} flow
 */
function paintRipples(g, marks, P, top, now, wind, flow) {
  const rows = H - HZ;
  g.clearRect(0, 0, W, rows);
  const tick = Math.floor(now / (600 / (1 + wind * 0.4)));
  const crest = 0.8 + 0.4 * Math.min(1, Math.abs(flow.along));
  for (const m of marks) {
    const d = Math.floor(rows * m.u ** 1.4);
    const near = d / rows;
    const strength = windOnWater(wind, flow.along, near);
    if (m.rank >= waveLevel(WAVE_LEVELS.share, strength)) continue;
    const frame = (tick + m.phase) % 3;
    const x = Math.round(m.x) + [0, 1, 0][frame] * m.dir;
    const long = (1 + Math.floor(near * 6 + m.len * 2)) * waveLevel(WAVE_LEVELS.length, strength) * crest;
    const len = Math.max(1, Math.round(long) + [0, 1, -1][frame]);
    if (top(x) <= HZ + d + 1 || top(x + len) <= HZ + d + 1) continue;
    g.fillStyle = d < 25 ? P.waveLight : P.waterHaze;
    g.fillRect(x, d, len, 1);
    if (near > 0.3 && len >= 3 && m.foam < waveLevel(WAVE_LEVELS.foam, strength)) {
      g.fillStyle = P.glint;
      g.fillRect(x + Math.floor(len / 3), d, Math.max(1, Math.round(len / 3)), 1);
    }
    if (d > waveLevel(WAVE_LEVELS.trough, strength)) {
      g.fillStyle = P.waveDark;
      g.fillRect(x + 1, d + 1, Math.max(1, len - 1), 1);
    }
  }
}

/**
 * Moves the ripples on with the wind: across the view by its share across, and
 * in towards the bank or out towards the horizon by its share along. Both wrap.
 * @param {Ripple[]} marks @param {number} dt  Milliseconds. @param {number} wind
 * @param {{ across: number, along: number }} flow
 */
function moveRipples(marks, dt, wind, flow) {
  const s = Math.min(dt, 100) / 1000;
  const drift = waveLevel(WAVE_LEVELS.drift, wind) * flow.across * s;
  const roll = waveLevel(WAVE_LEVELS.roll, wind) * flow.along * s;
  for (const m of marks) {
    // Slower far out, as seen from the bank.
    m.x = (((m.x + drift * (0.2 + 0.8 * m.u ** 1.4)) % W) + W) % W;
    m.u = (((m.u - roll) % 1) + 1) % 1;
  }
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
 * pond.js): `back` (water, ripples) goes under the bobber and the line,
 * `front` (the reed banks) over them; the sky layer goes under `back`, its
 * glitter in `waterLayer`.
 * @param {() => number} rand  Uniform [0, 1), the scenery stream.
 * @param {string} [season]  One of the game's seasons.
 * @param {{ reeds?: boolean }} [options]  `reeds: false` paints the open water alone (`paintOpen`).
 * @returns {import('./pond.js').Pond}
 */
export function paintReedy(rand, season = 'summer', { reeds: withReeds = true } = {}) {
  TextureStyle.defaultOptions.scaleMode = 'nearest';
  const S = REEDY_SEASONS[reedySeason(season)];
  const P = S.palette;
  /** Every texture this painting makes, for `destroy`. @type {Texture[]} */
  const made = [];
  const tex = (/** @type {HTMLCanvasElement} */ c) => {
    const t = Texture.from(c);
    made.push(t);
    return t;
  };
  // The top of the reeds at a column; below the picture where there are none.
  const top = withReeds ? topAt : () => H + 20;

  const back = new Container();
  const water = new Sprite(tex(paintWater(P, top)));
  water.y = HZ;
  back.addChild(water);
  // The ripples over it, drawn afresh as the wind moves them (D177).
  const ripplesMarks = scatterRipples(rand);
  const rippleCanvas = makeCanvas(W, H - HZ);
  const rippleTexture = tex(rippleCanvas);
  const rippleSprite = new Sprite(rippleTexture);
  rippleSprite.y = HZ;
  back.addChild(rippleSprite);
  let lastNow = -1;
  let lastDrawn = -Infinity;
  // The sky layer's glitter goes here, on the water and under what floats (D169).
  const waterLayer = new Container();
  back.addChild(waterLayer);

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
    if (top(x) <= HZ + d + 2 || top(x + 5) <= HZ + d + 2) continue;
    const frames = glintSets[d < 30 ? 0 : 1];
    const sprite = new Sprite(frames[0]);
    sprite.position.set(x, HZ + d);
    back.addChild(sprite);
    glints.push({ sprite, frames, frame: 0, next: rand() * 2000 });
  }

  const ripples = createRings(P.waveLight);
  back.addChild(ripples.layer);
  /** @type {{ x: number, y: number, born: number, life: number, maxRx: number }[]} */
  let rings = [];
  let nextRing = 0;

  // The reeds: the bank, then the blades in sections, each in three frames of the wind.
  const front = new Container();
  if (withReeds) front.addChild(new Sprite(tex(paintBank(P, S, rand))));
  const blades = withReeds ? growBlades(P, S, rand) : [];
  const sections = withReeds ? Math.ceil(W / SECTION) : 0;
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
    horizon: HZ,
    // Nothing stands on the horizon: open lake to the sky.
    skyline: Array.from({ length: W }, () => HZ),
    waterLayer,
    // Open water: below the horizon and clear of the reed banks.
    isWater: (x, y) => y > HZ && top(x) > y + 1,
    update(now, wind, crop, raining, light = 1, flow = { across: 1, along: 0 }) {
      for (const [s, sprite] of reeds.entries()) sprite.texture = reedFrames[s][gust(now, wind, s * SECTION + SECTION / 2)];
      moveRipples(ripplesMarks, lastNow < 0 ? 0 : now - lastNow, wind, flow);
      lastNow = now;
      // Redrawn a dozen times a second at most: they move a pixel at a time.
      if (now - lastDrawn >= 80 || now < lastDrawn) {
        paintRipples(ctxOf(rippleCanvas), ripplesMarks, P, top, now, wind, flow);
        rippleTexture.source.update();
        lastDrawn = now;
      }
      for (const [i, glint] of glints.entries()) {
        // Fewer flick under cloud (D170): the rest lie flat.
        glint.sprite.visible = i < Math.round(glints.length * light);
        if (now < glint.next) continue;
        glint.frame = 1 - glint.frame;
        glint.sprite.texture = glint.frames[glint.frame];
        glint.next = now + (700 + rand() * 1800) / (1 + wind * 0.5);
      }
      // A ring now and then where a fish rose; rain all over the open water.
      if (now >= nextRing) {
        const d = Math.floor(rand() * 70) + 4;
        const x = crop + 10 + Math.floor(rand() * (W - 2 * crop - 20));
        if (top(x) > HZ + d + 6) rings.push({ x, y: HZ + d, born: now, life: 900, maxRx: d < 30 ? 4 : 7 });
        nextRing = now + (raining ? 90 + rand() * 120 : 1500 + rand() * 2500);
      }
      rings = rings.filter((r) => now - r.born < r.life);
      ripples.show(rings.map((r) => {
        const age = (now - r.born) / r.life;
        const rx = Math.max(1, Math.round(r.maxRx * age));
        const ry = Math.max(1, Math.round(rx * (r.y - HZ < 30 ? 0.3 : 0.42)));
        return { x: r.x - rx, y: r.y - ry, rx, ry, alpha: age < 0.6 ? 1 : 0.5 };
      }));
    },
    destroy() {
      ripples.destroy();
      back.destroy({ children: true });
      front.destroy({ children: true });
      for (const t of made) t.destroy(true);
    },
  };
}

/**
 * The open water (the default scene for a spot with no painting of its own):
 * the reedy shore's lake, horizon and sky with no reeds, so nothing stands
 * between the player and the sky in the way the spot faces (D166, D169). Its
 * four seasons are the reedy shore's water. A placeholder until each spot is
 * painted (CR-1).
 * @param {() => number} rand  Uniform [0, 1), the scenery stream.
 * @param {string} [season]  One of the game's seasons.
 * @returns {import('./pond.js').Pond}
 */
export function paintOpen(rand, season = 'summer') {
  return paintReedy(rand, season, { reeds: false });
}
