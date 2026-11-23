// @ts-check
// Portraits layered from parts (D187): a look (src/engine/looks.js) drawn into
// the 64×64 round portrait of the event dialog (D142), and at 32 for the
// character's button. Every part is a placeholder of plain shapes, ellipses,
// boxes and triangles, until the owner's drawings (CR-19).
//
// The shapes are laid out on the 64 grid and sampled at each pixel's centre,
// so the same drawing makes a 64 portrait and a 32 icon, each in whole pixels
// and neither scaled (R7.3). A feature one unit thin shows at 32 only if it
// sits on an odd row or column, which is why the thin ones do.
//
// Colours are palette swaps: a part is drawn in keys (`skin`, `hair`…) and
// the look's colours fill them, so one drawing serves every colour.
//
// Trap: Draw inside the circle (D142): what lies in the square's corners is cut off.
//  The head sits a little high, so the shoulders fill the bottom of the circle.

import { CLOTHES, EYES, HAIR, SKIN } from '../engine/looks.js';

/** @typedef {import('../engine/looks.js').Look} Look */
/** @typedef {(x: number, y: number) => boolean} Shape  On the 64 grid. */
/** @typedef {{ outline?: boolean, shapes: [Shape, string][] }} Layer  Shapes in their keys, outlined as one. */

// ---------- Shapes ----------

/** @param {number} cx @param {number} cy @param {number} rx @param {number} ry @returns {Shape} */
const ellipse = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
/** @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1 @returns {Shape} */
const box = (x0, y0, x1, y1) => (x, y) => x >= x0 && x < x1 && y >= y0 && y < y1;
/** @param {[number, number][]} pts @returns {Shape} */
const poly = (pts) => (x, y) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
/** @param {...Shape} shapes @returns {Shape} */
const any = (...shapes) => (x, y) => shapes.some((s) => s(x, y));
/** Only the part of a shape between two rows. @param {Shape} s @param {number} y0 @param {number} y1 @returns {Shape} */
const rows = (s, y0, y1) => (x, y) => y >= y0 && y < y1 && s(x, y);
/** A shape and its mirror image across the middle: both eyes from one. @param {Shape} s @returns {Shape} */
const pair = (s) => (x, y) => s(x, y) || s(64 - x, y);
/** @param {Shape} s @param {Shape} not @returns {Shape} */
const minus = (s, not) => (x, y) => s(x, y) && !not(x, y);

// ---------- The head, which the other parts fit ----------

/**
 * Each head's shape and where the other parts go on it: `top` and `chin` rows, `half` its half width at the eyes.
 * @type {Record<string, { shape: Shape, top: number, chin: number, half: number }>}
 */
const HEADS = {
  oval: { shape: ellipse(32, 31, 12, 15), top: 16, chin: 46, half: 12 },
  round: { shape: ellipse(32, 32, 13.5, 13.5), top: 18.5, chin: 45.5, half: 13.5 },
  long: { shape: ellipse(32, 31, 11, 17), top: 14, chin: 48, half: 11 },
  square: { shape: any(box(21, 17, 43, 46), box(20, 19, 44, 44)), top: 17, chin: 46, half: 12 },
  heart: { shape: any(ellipse(32, 28, 13, 11), poly([[19, 28], [45, 28], [36, 46], [28, 46]])), top: 17, chin: 46, half: 13 },
  wide: { shape: ellipse(32, 32, 16, 13.5), top: 18.5, chin: 45.5, half: 16 },
  heavy: { shape: any(ellipse(32, 28, 13, 12), box(19, 30, 45, 46), box(18, 32, 46, 44)), top: 16, chin: 46, half: 14 },
};
/** The rows every face shares. */
const EYE = 31;
const BROW = 27;

/** @typedef {{ top: number, chin: number, half: number, mouth: number }} Fit */

// ---------- The parts, each a function of the head it sits on ----------

/** @type {Record<string, (f: Fit) => Shape>} */
const EARS = {
  small: (f) => pair(ellipse(32 - f.half, 32, 2.5, 3.5)),
  round: (f) => pair(ellipse(32 - f.half, 32, 3.5, 4.5)),
  big: (f) => pair(ellipse(32 - f.half - 1, 32, 5, 6)),
  pointed: (f) => pair(poly([[33 - f.half, 28], [33 - f.half, 37], [24 - f.half, 22]])),
  long: (f) => pair(poly([[33 - f.half, 29], [33 - f.half, 36], [20 - f.half, 24]])),
  notched: (f) => pair(minus(poly([[33 - f.half, 27], [33 - f.half, 38], [23 - f.half, 31]]), box(26 - f.half, 29, 28 - f.half, 31))),
};

/** Eyes: the whites, then the iris. @type {Record<string, { white?: Shape, iris: Shape, lid?: Shape }>} */
const EYES_DRAWN = {
  dots: { iris: pair(box(26, 30, 28, 32)) },
  wide: { white: pair(box(23, 30, 27, 32)), iris: pair(box(24, 30, 26, 32)) },
  close: { white: pair(box(27, 30, 30, 32)), iris: pair(box(28, 30, 30, 32)) },
  big: { white: pair(box(24, 29, 29, 33)), iris: pair(box(26, 30, 28, 32)) },
  narrow: { white: pair(box(25, 31, 29, 32)), iris: pair(box(26, 31, 28, 32)), lid: pair(box(24, 30, 30, 31)) },
  sleepy: { white: pair(box(25, 30, 29, 32)), iris: pair(box(26, 31, 28, 32)), lid: pair(box(25, 29, 29, 31)) },
};

/** @type {Record<string, Shape | null>} */
const BROWS = {
  none: null,
  thin: pair(box(24, BROW, 29, BROW + 1)),
  thick: pair(box(23, BROW - 1, 29, BROW + 1)),
  angry: pair(poly([[23, BROW - 2], [30, BROW], [30, BROW + 2], [23, BROW]])),
  raised: pair(any(box(25, BROW - 3, 28, BROW - 2), box(23, BROW - 2, 25, BROW - 1), box(28, BROW - 2, 30, BROW - 1))),
  unibrow: box(23, BROW - 1, 41, BROW + 1),
};

/** Noses, in the skin's shade, with dark nostrils where they show. @type {Record<string, { shape: Shape, holes?: Shape }>} */
const NOSES = {
  small: { shape: box(31, 34, 33, 37) },
  long: { shape: any(box(31, 31, 33, 39), box(30, 37, 34, 39)) },
  broad: { shape: box(29, 35, 35, 38) },
  hooked: { shape: poly([[30, 31], [33, 31], [35, 37], [33, 39], [29, 38]]) },
  button: { shape: ellipse(32, 36, 2, 1.6) },
  big: { shape: ellipse(32, 35.5, 3.6, 3.2) },
  round: { shape: ellipse(32, 36, 2.7, 2.5) },
  flat: { shape: box(28, 36, 36, 38), holes: pair(box(29, 37, 31, 38)) },
  snout: { shape: ellipse(32, 36, 4.2, 3), holes: pair(box(29, 36, 31, 38)) },
};

/** Mouths, from their row (`m`, a few rows above the chin). @type {Record<string, (m: number) => Shape>} */
const MOUTHS = {
  line: (m) => box(29, m, 35, m + 1),
  smile: (m) => any(box(29, m, 35, m + 1), pair(box(27, m - 1, 29, m))),
  frown: (m) => any(box(29, m - 1, 35, m), pair(box(27, m, 29, m + 1))),
  open: (m) => box(29, m - 1, 35, m + 2),
  wide: (m) => box(26, m, 38, m + 1),
  small: (m) => box(31, m, 33, m + 1),
};

/** Beards (dwarves only, D188), in the hair's colour; a moustache comes with each. @type {Record<string, ((f: Fit) => Shape) | null>} */
const BEARDS = {
  none: null,
  short: (f) => any(rows(ellipse(32, f.chin - 4, f.half, 9), f.mouth - 3, 64), box(32 - f.half + 1, f.mouth - 3, 32 + f.half - 1, f.chin)),
  full: (f) => poly([[32 - f.half, 35], [32 + f.half, 35], [32 + f.half - 1, f.chin + 4], [32, f.chin + 10], [32 - f.half + 1, f.chin + 4]]),
  long: (f) => poly([[32 - f.half, 35], [32 + f.half, 35], [32 + f.half - 2, 56], [32, 63], [32 - f.half + 2, 56]]),
  forked: (f) => any(
    poly([[32 - f.half, 35], [32 + f.half, 35], [32 + f.half - 1, f.chin + 4], [32 - f.half + 1, f.chin + 4]]),
    pair(poly([[24, f.chin], [32, f.chin], [30, 61], [25, 60]])),
  ),
  braids: (f) => any(
    rows(ellipse(32, f.chin - 4, f.half, 9), f.mouth - 3, 64),
    box(32 - f.half + 1, f.mouth - 3, 32 + f.half - 1, f.chin),
    pair(box(27, f.chin, 30, 60)),
  ),
  wide: (f) => any(ellipse(32, f.chin - 1, f.half + 4, 9), box(32 - f.half, f.mouth - 3, 32 + f.half, f.chin)),
};
/** The moustache over a beard. @param {number} m */
const MOUSTACHE = (m) => any(box(27, m - 3, 37, m - 1), pair(box(26, m - 2, 28, m + 1)));

/** Tusks (orcs only, D188), up from the lower lip. @type {Record<string, ((m: number) => Shape) | null>} */
const TUSKS = {
  none: null,
  small: (m) => pair(box(27, m - 2, 29, m + 2)),
  big: (m) => pair(poly([[26, m + 2], [29, m + 2], [28, m - 5]])),
  one: (m) => poly([[35, m + 2], [38, m + 2], [37, m - 5]]),
  upturned: (m) => pair(poly([[27, m + 2], [30, m + 2], [24, m - 6]])),
};

/**
 * Hair: what lies behind the head and shoulders, and what lies over the head. Short hair is a cap over the
 * crown, down to the brows' height at the sides.
 * @type {Record<string, { back?: (f: Fit) => Shape, front?: (f: Fit) => Shape }>}
 */
const short = (/** @type {Fit} */ f) => any(rows(ellipse(32, f.top + 8, f.half + 1.5, 10), 0, f.top + 7), pair(box(31 - f.half, f.top + 4, 34 - f.half, BROW + 2)));
const HAIRS = {
  bald: {},
  short: { front: short },
  crop: { front: (f) => rows(ellipse(32, f.top + 6, f.half + 0.5, 7), 0, f.top + 5) },
  long: { back: (f) => any(box(31 - f.half, f.top + 4, 33 + f.half, 56), ellipse(32, f.top + 8, f.half + 3, 10)), front: short },
  bun: { front: (f) => any(short(f), ellipse(32, f.top - 2, 5, 4)) },
  mohawk: { front: (f) => box(29, f.top - 6, 35, f.top + 9) },
  side: { front: (f) => any(short(f), poly([[32 - f.half, f.top + 4], [32 + f.half + 1, f.top + 4], [32 + f.half + 1, f.top + 11], [27, f.top + 12]])) },
  curly: {
    back: (f) => any(...[-1, -0.6, -0.2, 0.2, 0.6, 1].map((s) => ellipse(32 + s * (f.half + 2), f.top + 9 - (1 - Math.abs(s)) * 6, 5, 5))),
    front: (f) => any(short(f), ...[-0.7, -0.25, 0.25, 0.7].map((s) => ellipse(32 + s * f.half, f.top + 3, 4.5, 4.5))),
  },
  braids: { front: (f) => any(short(f), pair(box(28 - f.half, 30, 32 - f.half, 59))) },
  tail: { back: (f) => ellipse(34 + f.half, f.top + 16, 3.5, 10), front: short },
};

/**
 * Hats and hoods, in the clothes' colour, or iron for a helm. A hood or a scarf hides the hair.
 * @type {Record<string, { back?: (f: Fit) => Shape, front?: (f: Fit) => Shape, hides?: boolean, metal?: boolean }>}
 */
const HATS = {
  none: {},
  cap: { front: (f) => any(rows(ellipse(32, f.top + 6, f.half + 1.5, 8), 0, f.top + 6), box(32 - f.half - 1, f.top + 4, 32 + f.half + 7, f.top + 7)) },
  hood: {
    back: (f) => any(ellipse(32, f.top + 14, f.half + 6, 18), box(32 - f.half - 6, f.top + 14, 32 + f.half + 6, 56)),
    front: (f) => minus(ellipse(32, f.top + 13, f.half + 5, 17), ellipse(32, f.top + 16, f.half - 2, 14)),
    hides: true,
  },
  brimmed: { front: (f) => any(box(32 - f.half + 3, f.top - 7, 32 + f.half - 3, f.top + 4), box(32 - f.half - 6, f.top + 2, 32 + f.half + 6, f.top + 5)) },
  pointed: { front: (f) => any(poly([[32 - f.half - 2, f.top + 5], [32 + f.half + 2, f.top + 5], [38, f.top - 16]]), box(32 - f.half - 3, f.top + 3, 32 + f.half + 3, f.top + 6)) },
  scarf: {
    back: (f) => ellipse(32, f.top + 12, f.half + 3, 13),
    front: (f) => any(rows(ellipse(32, f.top + 9, f.half + 2.5, 11), 0, f.top + 10), pair(box(30 - f.half, f.top + 6, 33 - f.half, 40)), box(30 + f.half, 40, 36 + f.half, 46)),
    hides: true,
  },
  helm: {
    front: (f) => any(rows(ellipse(32, f.top + 8, f.half + 2.5, 10), 0, f.top + 8), box(32 - f.half - 3, f.top + 6, 32 + f.half + 3, f.top + 9), box(31, f.top + 8, 33, EYE + 4)),
    metal: true,
  },
};

/** Every drawing by part, for the check that each option of each part has one (test/people.test.js). */
export const DRAWN = { head: HEADS, ears: EARS, eyes: EYES_DRAWN, brows: BROWS, nose: NOSES, mouth: MOUTHS, beard: BEARDS, tusks: TUSKS, hair: HAIRS, hat: HATS };

// ---------- Colours ----------

/** @param {string} hex @param {number} f  Below 1 darker, above 1 lighter. */
function tone(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
/** @param {string} hex */
const lightness = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

/**
 * The keys a look's parts are drawn in, and their colours: the palette swap. The shades are worked out, so a
 * new skin or hair colour is one entry in looks.js. A mouth is a darker skin on light skin and a lighter one on
 * dark, so it shows on both.
 * @param {Look} look
 * @returns {Record<string, string>}
 */
export function faceColours(look) {
  const skin = SKIN[/** @type {keyof typeof SKIN} */ (look.skin)] ?? SKIN.beige;
  const hair = HAIR[/** @type {keyof typeof HAIR} */ (look.hairColour)] ?? HAIR.brown;
  const clothes = CLOTHES[/** @type {keyof typeof CLOTHES} */ (look.clothes)] ?? CLOTHES.brown;
  const light = lightness(skin) > 0.33;
  return {
    k: '#1b2b34',
    skin,
    skinShade: tone(skin, 0.84),
    mouth: light ? tone(skin, 0.5) : tone(skin, 1.45),
    hair,
    hairShade: tone(hair, lightness(hair) > 0.25 ? 0.72 : 1.5),
    eye: EYES[/** @type {keyof typeof EYES} */ (look.eyeColour)] ?? EYES.brown,
    white: '#f2eee4',
    clothes,
    clothesShade: tone(clothes, 0.75),
    metal: '#8f979c',
    metalShade: '#666d72',
    tusk: '#efe6c6',
  };
}

// ---------- Putting a face together ----------

/**
 * The look as layers, back to front: hair and hood behind, shoulders, ears, head, beard, the features, tusks,
 * hair over the head, the hat. Each outlined layer gets the icons' dark outline round all its shapes (docs/art.md).
 * @param {Look} look
 * @returns {Layer[]}
 */
export function faceLayers(look) {
  const head = HEADS[look.head] ?? HEADS.oval;
  /** @type {Fit} */
  const fit = { top: head.top, chin: head.chin, half: head.half, mouth: Math.round(head.chin) - 6 + (Math.round(head.chin) % 2 === 0 ? 1 : 0) };
  const hat = HATS[look.hat] ?? HATS.none;
  const hair = hat.hides ? {} : (HAIRS[look.hair] ?? {});
  const hatKey = hat.metal ? 'metal' : 'clothes';
  /** @type {Layer[]} */
  const layers = [];
  const add = (/** @type {boolean} */ outline, /** @type {[Shape | null | undefined, string][]} */ shapes) => {
    const kept = /** @type {[Shape, string][]} */ (shapes.filter(([s]) => s));
    if (kept.length) layers.push({ outline, shapes: kept });
  };
  add(true, [[hat.back?.(fit), hatKey]]);
  add(true, [[hair.back?.(fit), 'hair']]);
  // The shoulders and the neck.
  add(true, [
    [poly([[6, 64], [13, 52], [51, 52], [58, 64]]), 'clothes'],
    [box(27, head.chin - 3, 37, 54), 'skinShade'],
    [poly([[26, 52], [38, 52], [32, 58]]), 'clothesShade'],
  ]);
  add(true, [[EARS[look.ears]?.(fit), 'skin']]);
  add(true, [[head.shape, 'skin']]);
  const beard = BEARDS[look.beard]?.(fit);
  if (beard) add(true, [[beard, 'hair'], [MOUSTACHE(fit.mouth), 'hairShade']]);
  const nose = NOSES[look.nose] ?? NOSES.small;
  const eyes = EYES_DRAWN[look.eyes] ?? EYES_DRAWN.dots;
  add(false, [
    [eyes.white, 'white'],
    [eyes.iris, 'eye'],
    [eyes.lid, 'skinShade'],
    [BROWS[look.brows], 'hairShade'],
    [nose.shape, 'skinShade'],
    [nose.holes, 'mouth'],
    [MOUTHS[look.mouth]?.(fit.mouth), 'mouth'],
  ]);
  add(true, [[TUSKS[look.tusks]?.(fit.mouth), 'tusk']]);
  add(true, [[hair.front?.(fit), 'hair']]);
  add(true, [[hat.front?.(fit), hatKey]]);
  return layers;
}

/**
 * The face as pixels: `size` rows of `size` colours, null where nothing is, cut to the round portrait (D142).
 * @param {Look} look
 * @param {number} [size]  64 for the portrait, 32 for an icon.
 * @returns {(string | null)[][]}
 */
export function faceGrid(look, size = 64) {
  const unit = 64 / size;
  const colours = faceColours(look);
  /** @type {(string | null)[][]} */
  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  const at = (/** @type {number} */ i) => (i + 0.5) * unit;
  for (const layer of faceLayers(look)) {
    /** @type {(string | null)[]} The layer's own pixels. */
    const own = Array(size * size).fill(null);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        for (const [shape, key] of layer.shapes) if (shape(at(x), at(y))) own[y * size + x] = colours[key];
      }
    }
    if (layer.outline) {
      // One whole pixel round the layer's outside, under its shapes.
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (own[y * size + x]) continue;
          const touches = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            return nx >= 0 && ny >= 0 && nx < size && ny < size && own[ny * size + nx] && own[ny * size + nx] !== colours.k;
          });
          if (touches) grid[y][x] = colours.k;
        }
      }
    }
    for (let i = 0; i < own.length; i++) if (own[i]) grid[Math.floor(i / size)][i % size] = own[i];
  }
  // The round frame: the square's corners are cut off.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) if ((at(x) - 32) ** 2 + (at(y) - 32) ** 2 > 32 * 32) grid[y][x] = null;
  }
  return grid;
}

/**
 * A face on a canvas of its own size, for the portrait or a button; the page sizes it in whole device pixels.
 * @param {Look} look
 * @param {number} [size]
 */
export function paintFace(look, size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  faceGrid(look, size).forEach((row, y) =>
    row.forEach((colour, x) => {
      if (!colour) return;
      ctx.fillStyle = colour;
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  canvas.dataset.face = `${look.people}`;
  return canvas;
}
