// @ts-check
// Fish drawn to swim (R20.1, CR-17, D131): every fish's own side view and its
// view from the bank below the surface, painted as code from a shape and the
// colours of its icon. The carp trial (D129's successor, the owner's pick) was
// the pattern: a body from its outline, shaded from the back to the belly, a
// pattern on the flank, fins with rays, and a swim in which the rear of the
// body bends, the tail sweeps (foreshortened, seen from the side), the
// pectoral fin paddles and the mouth works.
//
// A fish's shape is a preset (carp, pike, perch, trout, catfish, eel…) with
// its own changes (src/scene/fish-shapes.js): the outline as the back's and
// belly's distance from a centre line along the body, the fins in body
// lengths, the tail's kind, a pattern. Its colours are read off its icon, so
// the two always agree: the icon turned level (as D129 did), its body split
// into five bands from the back down and each band's commonest colour taken,
// and the tail's for the fins. A shape can name colours of its own.
//
// Everything here is plain data until `paint`: grids of colours, so the tests
// can draw every fish without a browser. Hard pixels only, no scaling at
// runtime (R7.3): each distance is its own drawing.

import { content } from '../generated/content.js';
import { ICONS, KEYS, iconKeys, iconName } from './icons.js';
import { SHAPES, PRESETS } from './fish-shapes.js';

/** Frames to one beat of the tail. */
export const SWIM_FRAMES = 8;
/** The icons' outline colour. */
const OUTLINE = KEYS.k;

// ---------- Colours ----------

/** @param {string} hex */
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** @param {number[]} c */
const toHex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
/**
 * Between two colours: 0 is `a`, 1 is `b`.
 * @param {string} a @param {string} b @param {number} t
 */
export function mix(a, b, t) {
  const x = rgb(a);
  const y = rgb(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}
/** @param {string} hex */
const luma = (hex) => {
  const [r, g, b] = rgb(hex);
  return 0.3 * r + 0.59 * g + 0.11 * b;
};

// ---------- The icon turned level (D129) ----------

/**
 * An icon as a grid of colours ('' for none), at 32.
 * @param {string} name
 */
export function iconGrid(name) {
  const rows = ICONS[name] ?? ICONS['default/fish'];
  const keys = iconKeys(name);
  const zoom = rows.length <= 16 ? 2 : 1;
  /** @type {string[][]} */
  const grid = [];
  for (const row of rows) {
    const line = [...row].flatMap((k) => Array(zoom).fill(k === '.' ? '' : keys[k] ?? ''));
    for (let i = 0; i < zoom; i++) grid.push([...line]);
  }
  return grid;
}

/**
 * The angle of a shape's long axis, from its pixels' spread (in radians, y
 * down): about 0.5 for the icons' tilt.
 * @param {string[][]} grid
 */
export function bodyAngle(grid) {
  let n = 0;
  let sx = 0;
  let sy = 0;
  grid.forEach((row, y) => row.forEach((c, x) => c && (n++, (sx += x), (sy += y))));
  if (!n) return 0;
  const mx = sx / n;
  const my = sy / n;
  let xx = 0;
  let yy = 0;
  let xy = 0;
  grid.forEach((row, y) =>
    row.forEach((c, x) => {
      if (!c) return;
      xx += (x - mx) ** 2;
      yy += (y - my) ** 2;
      xy += (x - mx) * (y - my);
    }),
  );
  return 0.5 * Math.atan2(2 * xy, xx - yy);
}

/**
 * A grid turned by `angle` (radians) about its middle, each new pixel the
 * colour most of its sixteen samples land on; cropped to what's there.
 * @param {string[][]} grid
 * @param {number} angle
 */
export function turnGrid(grid, angle) {
  const h = grid.length;
  const w = grid[0].length;
  const out = Math.ceil(Math.hypot(w, h)) + 2;
  const cx = w / 2;
  const cy = h / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  /** @type {string[][]} */
  const turned = [];
  for (let y = 0; y < out; y++) {
    turned.push([]);
    for (let x = 0; x < out; x++) {
      /** @type {Map<string, number>} */
      const votes = new Map();
      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 4; sx++) {
          // Back from the new grid to the icon: turned the other way.
          const px = x + (sx + 0.5) / 4 - out / 2;
          const py = y + (sy + 0.5) / 4 - out / 2;
          const ix = Math.floor(cx + px * cos + py * sin);
          const iy = Math.floor(cy - px * sin + py * cos);
          const c = grid[iy]?.[ix] ?? '';
          votes.set(c, (votes.get(c) ?? 0) + 1);
        }
      }
      let best = '';
      let most = 0;
      for (const [c, v] of votes) if (v > most || (v === most && c)) [best, most] = [c, v];
      turned[y].push(most >= 7 || best === '' ? best : '');
    }
  }
  return crop([turned])[0];
}

/**
 * Grids cropped alike to what any of them has.
 * @param {string[][][]} grids  The same size.
 */
function crop(grids) {
  let x0 = Infinity;
  let x1 = -1;
  let y0 = Infinity;
  let y1 = -1;
  for (const g of grids) {
    g.forEach((row, y) =>
      row.forEach((c, x) => {
        if (!c) return;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }),
    );
  }
  if (x1 < 0) return grids.map(() => [['']]);
  return grids.map((g) => g.slice(y0, y1 + 1).map((row) => row.slice(x0, x1 + 1)));
}

/**
 * The icon's side view, level, head on the left (D129).
 * @param {string} name  An icon's name.
 */
export function levelIcon(name) {
  const grid = iconGrid(name);
  const level = turnGrid(grid, -bodyAngle(grid));
  // The icons' heads are up and left, so after turning the head is the left
  // end; a fish drawn upright, taller than long, is kept as it was.
  return level.length > level[0].length ? crop([grid])[0] : level;
}

/**
 * @typedef {Object} Colours  A fish's colours, from the back down, and its fins'.
 * @property {string} back @property {string} upper @property {string} flank
 * @property {string} lower @property {string} belly @property {string} fin
 */

/**
 * A fish's colours read off its icon: five bands from the back down, each
 * band's commonest colour across the middle of the body, and the tail's
 * commonest for the fins. The outline and anything near black are left out.
 * @param {string} name  An icon's name.
 * @returns {Colours}
 */
export function iconColours(name) {
  const g = levelIcon(name);
  const w = g[0].length;
  const usable = (/** @type {string} */ c) => c && c !== OUTLINE && luma(c) > 28;
  /** @type {Map<string, number>[]} */
  const bands = Array.from({ length: 5 }, () => new Map());
  const fins = new Map();
  for (let x = 0; x < w; x++) {
    const ys = g.map((row, y) => (usable(row[x]) ? y : -1)).filter((y) => y >= 0);
    if (!ys.length) continue;
    if (x >= w * 0.84) {
      for (const y of ys) fins.set(g[y][x], (fins.get(g[y][x]) ?? 0) + 1);
      continue;
    }
    if (x < w * 0.18 || x > w * 0.7) continue;
    const t = Math.min(...ys);
    const b = Math.max(...ys);
    for (const y of ys) {
      const band = Math.min(4, Math.floor(((y - t) / (b - t + 1)) * 5));
      bands[band].set(g[y][x], (bands[band].get(g[y][x]) ?? 0) + 1);
    }
  }
  const mode = (/** @type {Map<string, number>} */ m, /** @type {string} */ or) => {
    let best = or;
    let most = 0;
    for (const [c, n] of m) if (n > most) [best, most] = [c, n];
    return best;
  };
  // An icon drawn the other way up comes out pale on top: its bands turned over.
  if (bands[0].size && bands[4].size && luma(mode(bands[0], '#000000')) > luma(mode(bands[4], '#000000')) + 25) bands.reverse();
  const flank = mode(bands[2], '#8a8f86');
  const back = mode(bands[0], mix(flank, '#000000', 0.3));
  const upper = mode(bands[1], mix(back, flank, 0.5));
  const lower = mode(bands[3], flank);
  const belly = mode(bands[4], mix(lower, '#ffffff', 0.4));
  // The fins: the middle one, by lightness, of the tail's commoner colours (a
  // ray's darker pixels are many too); never much darker than the flank.
  const most = Math.max(0, ...fins.values());
  const common = [...fins].filter(([, n]) => n >= most * 0.5).map(([c]) => c).sort((a, b) => luma(a) - luma(b));
  let fin = common.length ? common[Math.floor(common.length / 2)] : mix(flank, back, 0.5);
  if (luma(fin) < luma(back) * 0.85 || luma(fin) < luma(flank) * 0.7) fin = mix(back, flank, 0.6);
  return { back, upper, flank, lower, belly, fin };
}

// ---------- Shapes ----------

/**
 * @typedef {Object} Fin  On the back (dorsal) or the belly (anal), in body lengths.
 * @property {number} from @property {number} to
 * @property {number} h  Height, in body lengths.
 * @property {'front' | 'round' | 'even' | 'flag' | 'back' | 'tri' | 'spiny' | 'adipose' | 'finlets'} [shape]
 * @property {string} [colour]
 */

/**
 * @typedef {Object} Shape
 * @property {string} [preset]
 * @property {[number, number][]} [top]  The back's height over the centre line, in body lengths, along the body (0 the snout, 1 the tail's root).
 * @property {[number, number][]} [bottom]  The belly's depth under it.
 * @property {number} [deep]  Every height times this.
 * @property {number} [snout]  The snout's tip above (−) or below (+) the centre line, in body lengths.
 * @property {number} [len]  Its length in pixels, tail and all; from its size if not given.
 * @property {number} [tailLen]  The tail fin's length, in body lengths.
 * @property {number} [tailSpread]  Each lobe's reach from the centre line, in body lengths.
 * @property {'fork' | 'shallow' | 'square' | 'round' | 'point' | 'hetero' | 'lunate' | 'diamond' | 'whip'} [tail]
 * @property {string} [tailColour]  The lower lobe's, if not the fins'.
 * @property {Fin[]} [dorsal]
 * @property {Fin[]} [anal]
 * @property {{ at: number, len: number, colour?: string } | null} [pelvic]
 * @property {{ at: number, len: number, colour?: string } | null} [pectoral]
 * @property {number} [gill]  The gill cover's edge, in body lengths.
 * @property {{ at?: number, v?: number, size?: 1 | 2 }} [eye]
 * @property {{ n: number, len: number }} [barbels]  Short ones; `len` over 4 sweeps them back, a catfish's.
 * @property {Pattern[]} [pattern]
 * @property {Partial<Colours>} [colours]
 * @property {'body' | 'eel' | 'stiff'} [swim]
 * @property {number} [wide]  Seen from above: how wide for how deep.
 * @property {boolean} [disc]  A ray: from above, a disc.
 * @property {boolean} [plain]  No band of darker rim along the back.
 */

/**
 * @typedef {Object} Pattern
 * @property {'scales' | 'spots' | 'bars' | 'stripe' | 'blotches' | 'speckle' | 'scutes'} kind
 * @property {string} [colour]  A hex, or a colour's name ('back', 'belly'…); a shade darker if not given.
 * @property {number} [from] @property {number} [to]  Along the body.
 * @property {number} [v0] @property {number} [v1]  From the back (0) to the belly (1).
 * @property {number} [n]  Bars: how many. Spots: how many in a hundred pixels.
 * @property {number} [size]  Spots: 1 or 2 pixels.
 */

const DEFAULTS = /** @type {Required<Pick<Shape, 'tailLen' | 'tailSpread' | 'tail' | 'gill' | 'snout' | 'deep' | 'swim' | 'wide'>>} */ ({
  tailLen: 0.3,
  tailSpread: 0.25,
  tail: 'fork',
  gill: 0.3,
  snout: 0,
  deep: 1,
  swim: 'body',
  wide: 0.6,
});

/**
 * A species' shape, its preset filled in, or null if it has none.
 * @param {string} species
 */
export function shapeOf(species) {
  const icon = iconName({ kind: 'fish', id: species });
  const own = SHAPES[species] ?? (icon !== 'default/fish' ? SHAPES[icon] : undefined);
  if (!own) return null;
  const preset = PRESETS[own.preset ?? 'carp'] ?? {};
  const shape = { ...DEFAULTS, ...preset, ...own };
  const max = content.fish[species]?.size?.max ?? 40;
  const len = own.len ?? Math.round(Math.max(18, Math.min(62, 14 + 9.5 * Math.log2(max / 10))));
  const colours = { ...iconColours(icon), ...(preset.colours ?? {}), ...(own.colours ?? {}) };
  return { ...shape, len, colours, icon };
}

/**
 * A smooth line through points, sampled at u (Catmull-Rom).
 * @param {[number, number][]} pts  By u, increasing.
 * @param {number} u
 */
function curve(pts, u) {
  if (u <= pts[0][0]) return pts[0][1];
  if (u >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  let i = 0;
  while (pts[i + 1][0] < u) i++;
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(pts.length - 1, i + 2)];
  const t = (u - p1[0]) / (p2[0] - p1[0]);
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
}

/** A repeatable hash in 0..1, for patterns. @param {number} x @param {number} y */
function hash(x, y) {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** How tall a fin is along itself, 0 to 1. @param {Fin['shape']} shape @param {number} t @param {number} x */
function finHeight(shape, t, x) {
  switch (shape) {
    case 'round':
      return Math.sin(Math.PI * t) ** 0.6;
    case 'even':
      return t < 0.1 ? t / 0.1 : t > 0.9 ? (1 - t) / 0.1 : 0.9;
    case 'flag':
      return t < 0.08 ? t / 0.08 : t > 0.85 ? (1 - t) / 0.15 : 0.65 + 0.35 * t;
    case 'back':
      return t > 0.8 ? (1 - t) / 0.2 : 0.3 + 0.7 * (t / 0.8);
    case 'tri':
      return t < 0.4 ? t / 0.4 : (1 - t) / 0.6;
    case 'spiny':
      return (t < 0.1 ? t / 0.1 : 1 - 0.35 * t) * (x % 2 ? 0.7 : 1);
    case 'adipose':
      return Math.sin(Math.PI * t) ** 0.5;
    case 'finlets':
      return x % 3 === 0 ? 0.2 : 1 - 0.3 * ((x % 3) - 1);
    default:
      return t < 0.12 ? t / 0.12 : 1 - 0.75 * ((t - 0.12) / 0.88);
  }
}

/**
 * One frame, side on, head on the left, as colours ('' for none), before
 * cropping; with the outline if asked.
 * @param {NonNullable<ReturnType<typeof shapeOf>>} s
 * @param {number} k  The frame.
 * @param {{ gulp?: boolean, outline?: boolean }} [opts]
 */
export function sideGrid(s, k, { gulp = false, outline = true } = {}) {
  const col = s.colours;
  const named = (/** @type {string | undefined} */ c, /** @type {string} */ or) => (!c ? or : c.startsWith('#') ? c : /** @type {any} */ (col)[c] ?? or);
  const T = s.tailLen;
  const Lb = s.len / (1 + T);
  const deep = s.deep;
  const top = (/** @type {number} */ u) => curve(/** @type {[number, number][]} */ (s.top), u) * deep * Lb;
  const bottom = (/** @type {number} */ u) => curve(/** @type {[number, number][]} */ (s.bottom), u) * deep * Lb;
  const fins = [...(s.dorsal ?? []), ...(s.anal ?? [])];
  const finTop = Math.max(0, ...(s.dorsal ?? []).map((f) => f.h)) * Lb;
  const finBottom = Math.max(0, ...(s.anal ?? []).map((f) => f.h), s.pelvic ? 0.08 : 0) * Lb;
  const spread = s.tailSpread * Lb;
  const W = Math.ceil(s.len) + 4;
  const H = Math.ceil(Math.max(top(0.45) + finTop, spread) + Math.max(bottom(0.45) + finBottom, spread)) + 8;
  const c0 = Math.ceil(Math.max(top(0.45) + finTop, spread)) + 4;
  const x0 = 1.5;
  const xr = x0 + Lb;
  const phase = (2 * Math.PI * k) / SWIM_FRAMES;
  const eel = s.swim === 'eel';
  const stiff = s.swim === 'stiff';
  // The wave down the body: the rear part for most, all of it for an eel.
  const wave = (/** @type {number} */ x) => {
    const u = (x - x0) / Lb;
    if (eel) return 1.3 * Math.min(1, u + 0.15) * Math.sin(phase - u * 2 * Math.PI * 1.1);
    const along = Math.max(0, (u - 0.44) / 0.56);
    return (stiff ? 0.5 : 0.9) * (Lb / 36) ** 0.5 * along ** 1.6 * Math.sin(phase - along * 2.2);
  };
  // The centre line: the snout above or below the middle.
  const centre = (/** @type {number} */ u) => c0 + s.snout * Lb * Math.max(0, 1 - u / 0.25) ** 2;
  const spreadNow = eel || s.tail === 'point' || s.tail === 'whip' ? 1 : 0.4 + 0.6 * Math.abs(Math.cos(phase));
  const rootDy = wave(xr);
  const finCol = col.fin;
  const ray = mix(finCol, col.back, 0.45);
  const rim = mix(col.back, '#000000', 0.22);
  const darker = /** @type {Record<string, string>} */ ({ [col.belly]: col.lower, [col.lower]: col.flank, [col.flank]: col.upper, [col.upper]: col.back, [col.back]: rim });
  /** @type {string[][]} */
  const g = Array.from({ length: H }, () => Array(W).fill(''));
  const set = (/** @type {number} */ x, /** @type {number} */ y, /** @type {string} */ c) => {
    if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c;
  };

  for (let x = 0; x < W; x++) {
    const cx = x + 0.5;
    const u = (cx - x0) / Lb;
    for (let y = 0; y < H; y++) {
      const cy = y + 0.5;

      // The tail fin, behind the body, its rays fanning from the root.
      if (cx >= xr - 0.5) {
        const len = T * Lb * spreadNow;
        const t = (cx - xr) / len;
        if (t > 0 && t <= 1) {
          const mid = c0 + rootDy;
          const r0 = (bottom(1) + top(1)) / 2;
          const v = cy - mid;
          let inside = false;
          const S = spread;
          switch (s.tail) {
            case 'round': {
              const h = r0 + (S - r0) * Math.min(1, t * 1.6) ** 0.7;
              inside = Math.abs(v) < h && !(t > 0.65 && ((t - 0.65) / 0.35) ** 2 + (v / h) ** 2 > 1);
              break;
            }
            case 'square':
              inside = Math.abs(v) < r0 + (S - r0) * t ** 0.8;
              break;
            case 'point':
            case 'whip':
              inside = Math.abs(v) < r0 * (1 - t) + 0.5;
              break;
            case 'hetero': {
              // A shark's or a sturgeon's: a long blade swept up, a short lobe under it.
              if (v <= 0) {
                const centreLine = S * 1.05 * t;
                const thick = r0 * (1 - 0.55 * t) + 1;
                inside = Math.abs(-v - centreLine) < thick;
              } else {
                inside = t < 0.55 ? v < r0 + S * 0.6 * Math.sin((t / 0.55) * Math.PI * 0.5) : v < r0 * (1 - t) + 0.3;
              }
              break;
            }
            case 'diamond': {
              const h = r0 + S * Math.sin(Math.PI * Math.min(1, t * 1.25)) * 0.9;
              inside = Math.abs(v) < Math.max(h, t > 0.75 ? 1 : 0);
              break;
            }
            default: {
              const fork = s.tail === 'shallow' ? 0.22 : s.tail === 'lunate' ? 0.7 : 0.46;
              const reach = r0 + (S - r0) * t ** 0.8;
              const notch = t > 0.5 ? (t - 0.5) * 2 * S * fork : -1;
              const edge = 1 - Math.abs(v) / (S + 1);
              const cut = t > 1 - 0.12 * edge && Math.abs(v) < S * 0.8;
              inside = Math.abs(v) < reach && Math.abs(v) > notch && !cut;
            }
          }
          if (inside) {
            const rayOn = Math.round(Math.atan2(v, (cx - xr) / spreadNow + 2) * 9) % 2 === 0;
            const lower = v > 0 && s.tailColour;
            set(x, y, lower && t > 0.4 ? (rayOn ? mix(/** @type {string} */ (named(s.tailColour, finCol)), '#000000', 0.12) : named(s.tailColour, finCol)) : rayOn ? ray : finCol);
          }
        }
        if (cx >= xr + 0.5) continue;
      }
      if (u < -0.02) continue;

      const dy = wave(cx);
      const c = centre(u) + dy;
      const tp = c - top(u);
      const bt = c + bottom(u);

      // Fins on the back and the belly.
      let fin = '';
      for (const f of fins) {
        const above = (s.dorsal ?? []).includes(f);
        if (u < f.from || u > f.to) continue;
        if (above ? cy > tp : cy < bt) continue;
        const t = (u - f.from) / (f.to - f.from);
        const h = finHeight(f.shape, t, x) * f.h * Lb;
        const d = above ? tp - cy : cy - bt;
        if (d < h) {
          const fc = named(f.colour, finCol);
          const raysOn = f.shape !== 'adipose' && Math.floor(cx + d * 0.8) % 3 === 0;
          fin = raysOn || d > h - 1 ? mix(fc, col.back, 0.4) : fc;
        }
      }
      // The pelvic fin, under the belly.
      if (!fin && s.pelvic && u > s.pelvic.at && u < s.pelvic.at + s.pelvic.len && cy >= bt) {
        const a = (u - s.pelvic.at) / s.pelvic.len;
        if (cy < bt + 0.6 + a * s.pelvic.len * Lb * 0.55) fin = named(s.pelvic.colour, finCol);
      }
      if (fin) {
        set(x, y, fin);
        continue;
      }
      if (cy <= tp || cy >= bt) continue;

      // The body, shaded from the back to the belly; the head a touch darker.
      const v = (cy - tp) / (bt - tp);
      let pc;
      if (u < s.gill) pc = v < 0.42 ? col.back : v < 0.66 ? col.upper : v < 0.8 ? col.lower : col.belly;
      else pc = v < 0.09 && !s.plain ? rim : v < 0.32 ? col.back : v < 0.5 ? col.upper : v < 0.66 ? col.flank : v < 0.8 ? col.lower : col.belly;
      // Its pattern.
      const sy = Math.round(cy - dy);
      for (const p of s.pattern ?? []) {
        if (u < (p.from ?? s.gill + 0.02) || u > (p.to ?? 0.96)) continue;
        if (v < (p.v0 ?? 0.12) || v > (p.v1 ?? 0.84)) continue;
        const pcol = named(p.colour, darker[pc] ?? rim);
        let on = false;
        switch (p.kind) {
          case 'scales':
            on = sy % 2 === 0 && (x + (sy % 4 === 0 ? 0 : 2)) % 4 === 0;
            break;
          case 'spots': {
            const size = p.size ?? 1;
            on = hash(Math.floor(x / size), Math.floor(sy / size)) < (p.n ?? 12) / 100 && (size === 1 || (x % 2 === 0) === (sy % 2 === 0) || hash(x, sy) < 0.7);
            break;
          }
          case 'blotches':
            on = hash(Math.floor(x / 3), Math.floor(sy / 3)) < (p.n ?? 30) / 100 && hash(x, sy) < 0.8;
            break;
          case 'speckle':
            on = hash(x, sy) < (p.n ?? 15) / 100;
            break;
          case 'bars': {
            const from = p.from ?? s.gill + 0.02;
            const to = p.to ?? 0.96;
            const n = p.n ?? 6;
            const at = ((u - from) / (to - from)) * n;
            on = at - Math.floor(at) < 0.45;
            break;
          }
          case 'stripe':
            on = true;
            break;
          case 'scutes':
            on = Math.round(u * Lb) % 3 === 0;
            break;
        }
        if (on) pc = pcol;
      }
      // The gill cover's edge, a curve behind the eye.
      const gx = x0 + s.gill * Lb - (0.07 * (36 / Lb)) * (cy - dy - c) ** 2;
      if (Math.abs(cx - gx) < 0.5 && v > 0.08 && v < 0.85 && s.gill > 0.05) pc = mix(col.back, '#000000', 0.2);
      set(x, y, pc);
    }
  }

  // The pectoral fin, low behind the gill cover, paddling.
  if (s.pectoral) {
    const paddle = k % 4 < 2;
    const pu = s.pectoral.at;
    const px = Math.round(x0 + pu * Lb);
    const py = Math.round(centre(pu) + wave(px) + bottom(pu) * 0.45);
    const n = Math.max(2, Math.round(s.pectoral.len * Lb));
    const pc = named(s.pectoral.colour, finCol);
    for (let i = 0; i < n; i++) {
      const drop = paddle ? i * 0.45 : i * 0.7;
      set(px + i, py + Math.round(drop), i === 0 ? mix(pc, col.back, 0.4) : pc);
      if (i > 0 && i < n - 1) set(px + i, py + Math.round(drop) + 1, (px + i) % 2 ? pc : mix(pc, col.back, 0.4));
    }
  }
  // Barbels from the lips: short ones hang, a catfish's long ones trail
  // down and back under the head.
  if (s.barbels) {
    const mx = Math.round(x0 + 0.03 * Lb);
    const my = Math.round(centre(0.03) + bottom(0.03) * 0.5);
    const bc = mix(col.belly, col.back, 0.45);
    const sweep = s.barbels.len > 4;
    for (let b = 0; b < s.barbels.n; b++) {
      for (let i = 0; i < s.barbels.len; i++) {
        const bx = mx + b * 2 + (sweep ? Math.round(i * 0.85) : 0);
        const by = my + 1 + (sweep ? Math.round(i * 0.55 + Math.sin((i + b) / 2)) : i);
        set(bx, by, bc);
      }
    }
  }
  // The eye: dark, a pale ring towards the front.
  const eu = s.eye?.at ?? 0.1;
  const ex = Math.round(x0 + eu * Lb);
  const ec = centre(eu) + wave(ex);
  const ey = Math.round(ec - top(eu) + (top(eu) + bottom(eu)) * (s.eye?.v ?? 0.38));
  const big = (s.eye?.size ?? (Lb > 30 ? 2 : 1)) === 2;
  set(ex - 1, ey, '#e9e6de');
  set(ex, ey - 1, '#e9e6de');
  set(ex, ey, '#141414');
  if (big) {
    set(ex + 1, ey, '#141414');
    set(ex + 1, ey - 1, '#e9e6de');
  }
  // The mouth works.
  if (gulp) {
    const my = Math.round(centre(0));
    set(Math.floor(x0), my, '');
    set(Math.floor(x0) + 1, my + 1, rim);
  }
  return outline ? outlined(g) : g;
}

/**
 * The icons' dark outline: every empty pixel touching the fish.
 * @param {string[][]} g
 */
function outlined(g) {
  return g.map((row, y) =>
    row.map((c, x) => {
      if (c) return c;
      return [g[y - 1]?.[x], g[y + 1]?.[x], row[x - 1], row[x + 1]].some(Boolean) ? OUTLINE : '';
    }),
  );
}

// ---------- Below the surface, from the bank ----------

/** The two distances: scale from the side view, and how the slant squashes. */
export const BELOW = {
  near: { scale: 0.62, across: 0.85, up: 0.5 },
  far: { scale: 0.42, across: 0.75, up: 0.5 },
};

/**
 * The tones below the surface, darkened towards the deep water's colour.
 * @param {Colours} c
 */
export function belowTones(c) {
  return { back: mix(c.back, '#1f4a52', 0.55), body: mix(c.flank, '#2f6870', 0.55), fin: mix(c.fin, '#4a8a94', 0.55) };
}

/**
 * One frame of a fish below the surface, seen from the bank at a slant,
 * head on the left (the carp trial's model, for any shape).
 * @param {NonNullable<ReturnType<typeof shapeOf>>} s
 * @param {number} k
 * @param {'near' | 'far'} distance
 * @param {boolean} [own]  In its own colours at full size: how a ray is seen swimming.
 */
export function belowGrid(s, k, distance, own = false) {
  const view = own ? { scale: 1, across: 0.9, up: 0.2 } : BELOW[distance];
  const tones = own ? { back: s.colours.back, body: s.colours.flank, fin: s.colours.fin } : belowTones(s.colours);
  const T = s.tailLen;
  const Lb = s.len / (1 + T);
  const phase = (2 * Math.PI * k) / SWIM_FRAMES;
  const sc = view.scale;
  const W = Math.ceil(s.len * sc) + 4;
  const H = Math.ceil(s.len * sc * 0.75) + 6;
  /** @type {string[][]} */
  const g = Array.from({ length: H }, () => Array(W).fill(''));
  const eel = s.swim === 'eel';
  const bend = (/** @type {number} */ x) => {
    const u = x / Lb;
    if (eel) return 2.4 * (Lb / 36) * Math.min(1, u + 0.2) * Math.sin(phase - u * 2 * Math.PI);
    const along = Math.max(0, (u - 0.39) / 0.61);
    return 2.6 * (Lb / 36) * along ** 1.7 * Math.sin(phase - along * 2.2);
  };
  const put = (/** @type {number} */ x, /** @type {number} */ z, /** @type {number} */ h, /** @type {string} */ tone) => {
    const px = Math.floor(x * sc) + 2;
    const py = Math.floor((-z * view.across - h * view.up) * sc + H / 2);
    if (px >= 0 && px < W && py >= 0 && py < H) g[py][px] = tone;
  };
  const top = (/** @type {number} */ u) => curve(/** @type {[number, number][]} */ (s.top), u) * s.deep * Lb;
  const bottom = (/** @type {number} */ u) => curve(/** @type {[number, number][]} */ (s.bottom), u) * s.deep * Lb;
  const half = (/** @type {number} */ x) => (top(x / Lb) + bottom(x / Lb)) / 2;
  const mid = (/** @type {number} */ x) => (top(x / Lb) - bottom(x / Lb)) / 2;
  const wideness = s.disc ? 2.2 : s.wide;

  const pectoral = (/** @type {number} */ side) => {
    if (!s.pectoral || s.disc) return;
    const reach = (k % 4 < 2 ? 5 : 3.6) * (Lb / 36);
    const at = s.pectoral.at * Lb;
    for (let a = 0; a <= 1; a += 0.04) {
      for (let b = 0; b <= 1; b += 0.1) {
        const x = at + a * 4 * (Lb / 36) + b * 1.5;
        const out = (wideness * half(x) * 0.8 + a * reach) * (1 - b * 0.5);
        put(x, side * out + bend(x), -half(x) * 0.45, tones.fin);
      }
    }
  };
  pectoral(1);

  // The tail: an upright fan at the root, turned with the swing.
  if (!s.disc) {
    const turn = 0.75 * Math.sin(phase - 2.6);
    const root = bend(Lb);
    const TL = T * Lb;
    const S = s.tailSpread * Lb;
    for (let u = 0; u <= TL; u += 0.15) {
      const t = u / TL;
      const reach = s.tail === 'point' || s.tail === 'whip' ? half(Lb) * (1 - t) + 0.3 : 0.06 * Lb + (S - 0.06 * Lb) * t ** 0.8;
      const notch = s.tail === 'fork' || s.tail === 'lunate' ? (t > 0.5 ? (t - 0.5) * S * 0.9 : -1) : -1;
      for (let v = -reach; v <= reach; v += 0.25) {
        if (Math.abs(v) < notch) continue;
        put(Lb + u * Math.cos(turn), root + u * Math.sin(turn), -v, t < 0.35 && Math.abs(v) < reach * 0.6 ? tones.body : tones.fin);
      }
    }
  } else {
    // A ray's tail: a thin whip.
    for (let u = 0; u <= Lb * 0.9; u += 0.3) put(Lb * 0.95 + u, bend(Lb) * (1 + u / Lb), 0, tones.back);
  }

  // The body: slices along it, each an ellipse as wide as `wide` of its depth,
  // filled at half a pixel apart on the screen (finer only costs time).
  const step = 0.5 / sc;
  for (let x = 0; x <= Lb + 0.5; x += step) {
    const hd = half(x);
    // A ray's disc is as wide as it is long, whatever its depth.
    const wd = s.disc ? 0.45 * Lb * Math.sin(Math.PI * Math.min(1, x / Lb)) ** 0.6 : hd * (x / Lb < 0.15 ? wideness * (0.7 + (2 * x) / Lb) : wideness);
    const hStep = step / Math.max(view.up, 0.2) / 2;
    for (let z = wd; z >= -wd; z -= step / view.across / 2) {
      for (let h = -hd; h <= hd; h += hStep) {
        const r2 = (z / wd) ** 2 + (h / hd) ** 2;
        if (r2 > 1) continue;
        put(x, z + bend(x), mid(x) + h, h > hd * 0.35 || (r2 > 0.36 && z / wd > 0.7) ? tones.back : tones.body);
      }
    }
  }
  // The first dorsal fin, a dark ridge along the back.
  const d = s.dorsal?.[0];
  if (d && d.shape !== 'adipose') {
    for (let x = d.from * Lb; x < d.to * Lb; x += 0.2) {
      const t = (x / Lb - d.from) / (d.to - d.from);
      const fh = finHeight(d.shape, t, Math.round(x)) * d.h * Lb;
      for (let h = 0; h <= fh; h += 0.3) put(x, bend(x), mid(x) + half(x) + h * 0.6, tones.back);
    }
  }
  pectoral(-1);
  return g;
}

// ---------- A ray ----------

/** How a ray is seen: side on in the tank, from above on the bank. */
const RAY_VIEWS = {
  side: { scale: 1, across: 0.16, up: 0.99 },
  near: { scale: BELOW.near.scale, across: 0.85, up: 0.5 },
  far: { scale: BELOW.far.scale, across: 0.75, up: 0.5 },
};

/**
 * One frame of a ray: a flat disc, a rounded diamond from above, its wings
 * rippling front to back, a dome down the middle, eyes on top and a long whip
 * of a tail. Modelled as a sheet and looked at from a camera tilted down, so
 * the tank sees it nearly side on, the far wing lifting into a sail, and the
 * bank sees it from above. Head on the left.
 * @param {NonNullable<ReturnType<typeof shapeOf>>} s
 * @param {number} k
 * @param {'side' | 'near' | 'far'} view
 */
export function rayGrid(s, k, view) {
  const v = RAY_VIEWS[view];
  const sc = v.scale;
  const c = s.colours;
  const below = view !== 'side';
  const dim = (/** @type {string} */ col, /** @type {string} */ deep) => (below ? mix(col, deep, 0.55) : col);
  const top = { lit: dim(mix(c.flank, c.lower, 0.3), '#2f6870'), mid: dim(c.flank, '#1f4a52'), dark: dim(c.back, '#1f4a52') };
  const under = { lit: dim(c.belly, '#4a8a94'), dark: dim(mix(c.belly, c.back, 0.35), '#2f6870') };
  const T = s.tailLen;
  const Lb = s.len / (1 + T);
  const Wm = 0.56 * Lb; // half the span
  const phase = (2 * Math.PI * k) / SWIM_FRAMES;
  const W = Math.ceil(s.len * sc) + 6;
  const H = Math.ceil(s.len * sc) + 6;
  /** @type {string[][]} */
  const g = Array.from({ length: H }, () => Array(W).fill(''));
  /** @type {number[][]} */
  const depth = Array.from({ length: H }, () => Array(W).fill(-Infinity));
  // Toward the camera: x along the ray, z across it (away from us), h up.
  const put = (/** @type {number} */ x, /** @type {number} */ z, /** @type {number} */ h, /** @type {string} */ tone, bias = 0) => {
    const px = Math.floor(x * sc) + 3;
    const py = Math.floor((-z * v.across - h * v.up) * sc + H / 2);
    const d = -z * v.up + h * v.across + bias;
    if (px < 0 || px >= W || py < 0 || py >= H || d < depth[py][px]) return;
    depth[py][px] = d;
    g[py][px] = tone;
  };

  // The outline from above: a soft-cornered diamond, widest at the wing tips.
  const tipAt = 0.4;
  const softmin = (/** @type {number} */ a, /** @type {number} */ b, kk = 0.07) => -kk * Math.log(Math.exp(-a / kk) + Math.exp(-b / kk));
  const span = (/** @type {number} */ u) => {
    if (u < 0 || u > 1.06) return 0;
    const front = 0.08 + 0.92 * Math.min(1, u / tipAt) ** 0.8;
    const back = Math.max(0, (1 - u) / (1 - tipAt)) ** 1.05;
    const disc = Math.max(0, softmin(front, back) + 0.1) * (u < 0.04 ? Math.sqrt(u / 0.04) : 1);
    // The pelvic fins, two small lobes either side of the tail's root.
    const pelvic = u > 0.82 ? 0.16 * Math.sin((Math.PI * (u - 0.82)) / 0.24) : 0;
    return Wm * Math.max(disc, pelvic);
  };
  // The wings ripple: a wave running nose to tail, strongest at the tips.
  const lift = (/** @type {number} */ u, /** @type {number} */ z) => 0.38 * Wm * (Math.abs(z) / Wm) ** 1.6 * Math.sin(phase - 2.2 * u);
  const dome = (/** @type {number} */ u, /** @type {number} */ z, /** @type {number} */ w) => {
    const across = Math.max(0, 1 - (z / Math.max(w, 1e-6)) ** 2);
    return 0.07 * Lb * across ** 1.5 * Math.sin(Math.PI * Math.min(1, Math.max(0, u))) ** 0.7;
  };

  // The tail first, so the disc covers its root: thin, long, waving a little.
  const TL = T * Lb;
  for (let t = 0; t <= TL; t += 0.25 / sc) {
    const a = t / TL;
    const sway = 0.06 * Lb * a ** 1.4 * Math.sin(phase - 3 - 4 * a);
    const tone = a < 0.4 ? top.mid : top.dark;
    put(Lb * 0.92 + t, sway, 0.02 * Lb * Math.sin(phase - 2 - 3 * a), tone);
    if (a < 0.3) put(Lb * 0.92 + t, sway + 0.6 / sc, 0, tone);
  }

  // The disc: its top and its underside, each pixel lit by its slope.
  const step = 0.45 / sc;
  for (let x = 0; x <= Lb * 1.06; x += step) {
    const u = x / Lb;
    const w = span(u);
    if (w <= 0) continue;
    for (let z = -w; z <= w; z += step / Math.max(v.across, 0.3)) {
      const h0 = lift(u, z);
      const hz = (lift(u, z + 0.5) - lift(u, z - 0.5)) / 1;
      const hx = (lift(u + 0.5 / Lb, z) - lift(u - 0.5 / Lb, z)) / 1;
      const edge = Math.abs(z) / w > 0.9;
      const thick = dome(u, z, w);
      // Facing us is the top if its slope tips it toward the camera.
      const facing = hz * v.up + v.across;
      // The top: lit where it tilts toward the light above and in front.
      const shade = -hx * 0.6 + hz * 0.4;
      const topTone = edge ? top.dark : shade > 0.12 ? top.lit : shade < -0.12 ? top.dark : top.mid;
      put(x, z, h0 + thick, facing > 0 ? topTone : under.dark, 0.01);
      put(x, z, h0 - thick * 0.3, facing > 0 ? under.dark : edge ? under.dark : under.lit);
    }
  }
  // The eyes, raised on top behind the snout, with a spiracle behind each.
  for (const side of [-1, 1]) {
    const ex = 0.2 * Lb;
    const ez = side * 0.11 * Lb;
    const eh = lift(0.2, ez) + dome(0.2, ez, span(0.2)) + 0.4;
    put(ex, ez, eh, '#141414', 1);
    if (!below) put(ex + 1 / sc, ez, eh, mix(c.belly, '#ffffff', 0.4), 1);
    put(ex + 2.2 / sc, ez, eh - 0.1, top.dark, 1);
  }
  return g;
}

// ---------- Painted, for the browser ----------

/**
 * A grid of colours on a canvas.
 * @param {string[][]} g
 * @param {boolean} [right]  Facing right: mirrored.
 */
export function paint(g, right = false) {
  const canvas = document.createElement('canvas');
  canvas.width = g[0].length;
  canvas.height = g.length;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  g.forEach((row, y) =>
    row.forEach((c, x) => {
      if (!c) return;
      ctx.fillStyle = c;
      ctx.fillRect(right ? g[0].length - 1 - x : x, y, 1, 1);
    }),
  );
  return canvas;
}

/**
 * A species' frames side on (cropped alike), with a gulp frame, and below
 * the surface near and far; or null if it has no shape yet.
 * @param {string} species
 * @param {{ outline?: boolean }} [opts]
 */
export function fishFrames(species, { outline = true } = {}) {
  const key = `${species}:${outline}`;
  if (!drawnCache.has(key)) drawnCache.set(key, drawFish(species, outline));
  return drawnCache.get(key) ?? null;
}

/** Each fish drawn once and kept: the same every time. */
const drawnCache = new Map();

/**
 * @param {string} species
 * @param {boolean} outline
 */
function drawFish(species, outline) {
  const s = shapeOf(species);
  if (!s) return null;
  // A ray is a sheet, not a body: its own model, side on and from above.
  if (s.disc) {
    const frames = Array.from({ length: SWIM_FRAMES }, (_, k) => rayGrid(s, k, 'side'));
    const side = crop(outline ? frames.map(outlined) : frames);
    return {
      side,
      gulp: side[0],
      near: crop(Array.from({ length: SWIM_FRAMES }, (_, k) => rayGrid(s, k, 'near'))),
      far: crop(Array.from({ length: SWIM_FRAMES }, (_, k) => rayGrid(s, k, 'far'))),
    };
  }
  const side = crop([...Array.from({ length: SWIM_FRAMES }, (_, k) => sideGrid(s, k, { outline })), sideGrid(s, 0, { gulp: true, outline })]);
  return {
    side: side.slice(0, SWIM_FRAMES),
    gulp: side[SWIM_FRAMES],
    near: crop(Array.from({ length: SWIM_FRAMES }, (_, k) => belowGrid(s, k, 'near'))),
    far: crop(Array.from({ length: SWIM_FRAMES }, (_, k) => belowGrid(s, k, 'far'))),
  };
}
