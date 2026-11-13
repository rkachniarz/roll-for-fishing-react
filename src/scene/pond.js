// @ts-check
// A trial: a whole scene painted from a photo
// (docs/design/photo-autumn-pond.jpg) instead of from a sketch, to see how
// that way of working turns out. On the art sheet (createPondScene), and in
// the game as still water's scene (paintPond, D115, D116), with its own open
// water in content/locations/lake.json.
//
// Eye level, as in the photo: overcast sky, a wooded hill, a bed of reeds,
// then dark still water with the hill mirrored in it, floating leaves, a
// fallen log and a tangle of sticks. A birch leans in on the left and a
// beech spray hangs in from the top right. Common reeds from a second photo
// (docs/design/photo-reeds.png) stand in the front corners, where the owner's
// sketch put them (sketch-pond-reeds.png). Drawn 320 wide, the play area's
// 256 in the middle (D93). The far shore is set further back than in the
// photo, and the reflection toned down so things on the water show.
//
// A summer version of the same spot, from a third photo
// (docs/design/photo-summer-pond.png): its own palette and a few shape changes
// (POND_SEASONS), on the same layout.
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
const WL = 110;
/**
 * How far off the far shore is: everything on it is drawn this much smaller
 * than at first (when the water started at row 122), and lower in the sky.
 */
const FAR = 0.6;
/** Where a row of the first drawing (water at 122) lands now the shore is further off. @param {number} y */
const up = (y) => WL - FAR * (122 - y);
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
  // The water: the photo's soft grey with a touch of mauve, the overcast sky
  // in it, darkest nearest the viewer. The far shore is mirrored in it only
  // faintly, so ripples, glints and the bobber stay easy to see.
  waterDeep: '#4d4c51',
  waterDark: '#5c5b61',
  waterMid: '#6d6c72',
  waterLight: '#7f7e84',
  waterSheen: '#908f96',
  waterSky: '#a19fa6',
  waterPale: '#b6b5bb',
  glint: '#d0cfd4',
  reflectDark: '#4d5143',
  reflectOlive: '#5e614d',
  reflectLight: '#707057',
  reflectGold: '#817d5d',
  reflectLog: '#34353a',
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
  // The common reeds in front (docs/design/photo-reeds.png): grey-green, the
  // lit leaves pale, a few yellowing, thin brown plumes.
  reedLeafShadow: '#26302a',
  reedLeafDark: '#3a4b3c',
  reedLeaf: '#56705a',
  reedLeafLight: '#7f9a80',
  reedLeafPale: '#aebfa5',
  reedLeafYellow: '#a9a866',
  reedPlume: '#5c3f35',
  // The lone reed on the right, lit from behind.
  reedLimeDark: '#5b7a3f',
  reedLime: '#88a656',
  reedLimePale: '#c4d68a',
  // Fair-weather clouds, for summer (unused in autumn's overcast).
  cloudWhite: '#f3f4f6',
  cloudLight: '#dadee5',
  cloudGrey: '#b6bdc8',
  cloudShade: '#939cab',
};

/**
 * The same spot in summer (docs/design/photo-summer-pond.png): blue sky and
 * big white clouds, everything on the shore fresh green, the reed bed green to
 * its tips, the water a dark slate blue broken up by the wind. The names stay
 * autumn's, so a "leafGold" here is a sunlit green.
 */
export const POND_SUMMER = {
  ...POND,
  skyTop: '#5b8bd4',
  sky: '#7aa3de',
  skyLow: '#a7c2e7',
  pineDark: '#1e3120',
  pine: '#2e4a2a',
  forest: '#3d672c',
  olive: '#55802f',
  bush: '#7ca636',
  bushLight: '#a5c84b',
  gold: '#97bf3f',
  ochre: '#6c9832',
  rust: '#477529',
  hillBirch: '#d6d7cb',
  reedBrown: '#4c6a2b',
  reedTan: '#79993a',
  reedDry: '#afc867',
  reedGreen: '#5a882e',
  reedGreenLight: '#8db444',
  cattail: '#33421f',
  waterDeep: '#262a3b',
  waterDark: '#32374c',
  waterMid: '#40465d',
  waterLight: '#515871',
  waterSheen: '#666e8a',
  waterSky: '#7f87a4',
  waterPale: '#a9b1cb',
  glint: '#dce2f0',
  reflectDark: '#2d392f',
  reflectOlive: '#394934',
  reflectLight: '#495b3b',
  reflectGold: '#5a6e43',
  reflectLog: '#1c1f28',
  leafOrange: '#3c5a26',
  leafGold: '#5d8030',
  leafBrown: '#24351c',
  leafPale: '#7e9f40',
  leafGreen: '#4e792a',
  leafLime: '#78a43a',
  leafShade: '#2e481f',
  barkWhite: '#c3c2b7',
  barkLight: '#a4a399',
  moss: '#4e692d',
  reedLeafYellow: '#8ea85f',
};

/**
 * What changes with the season besides the colours.
 * @typedef {{ palette: typeof POND, clouds: boolean, greenReeds: number, floating: number, glints: number, canopy: boolean }} PondSeason
 * @type {Record<'autumn' | 'summer', PondSeason>}
 */
export const POND_SEASONS = {
  autumn: { palette: POND, clouds: false, greenReeds: 0.3, floating: 190, glints: 34, canopy: false },
  // Summer: clouds, a reed bed mostly green, few leaves on the water, the wind
  // catching the light in more places, and the trees in full leaf.
  summer: { palette: POND_SUMMER, clouds: true, greenReeds: 0.85, floating: 24, glints: 70, canopy: true },
};

/**
 * The palette and season being painted. Set by paintPond just before it
 * paints, which it does in one go, so two scenes never mix their colours.
 */
let P = POND;
/** @type {PondSeason} */
let S = POND_SEASONS.autumn;

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

/**
 * Summer's heaped-up clouds, as in the photo: bright where the sun is on
 * their tops, greying underneath, flat-bottomed, heavier on the right. Each
 * is a few round puffs; a pixel is shaded by where it sits in the puff that
 * covers it most, dithered at the edges between shades.
 * @param {CanvasRenderingContext2D} g @param {() => number} rand
 */
function paintClouds(g, rand) {
  /** @type {{ base: number, puffs: { x: number, y: number, r: number }[] }[]} */
  const clouds = [];
  for (let i = 0; i < 8; i++) {
    const cx = -20 + rand() * (W + 40);
    const width = 50 + rand() * 70 + (cx > W / 2 ? 40 : 0);
    const base = 20 + rand() * 46;
    const puffs = [];
    for (let n = 0, count = 5 + Math.floor(width / 10); n < count; n++) {
      const r = 6 + rand() * (8 + width / 10);
      puffs.push({ x: cx + (rand() - 0.5) * width, y: base - r * (0.3 + rand() * 0.6), r });
    }
    clouds.push({ base, puffs });
  }
  // Back to front: the lower clouds are nearer, so they go on top.
  clouds.sort((a, b) => a.base - b.base);
  for (const { base, puffs } of clouds) {
    for (let y = 0; y < Math.min(base, WL); y++) {
      for (let x = 0; x < W; x++) {
        let best = null;
        let depth = 0;
        for (const p of puffs) {
          const d = p.r - Math.hypot(x - p.x, (y - p.y) * 1.25);
          if (d > depth) {
            depth = d;
            best = p;
          }
        }
        if (!best) continue;
        // Lit from above and a little from the left; the bottom rows in shade.
        const light = (y - best.y) / best.r + ((x - best.x) / best.r) * 0.3 + (base - y < 3 ? 0.6 : 0) + (BAYER[y % 4][x % 4] / 16 - 0.5) * 0.3;
        // Heavier, greyer clouds to the right, as in the photo.
        const heavy = light + (x / W) * 0.35;
        dot(g, x, y, heavy < -0.45 ? P.cloudWhite : heavy < 0 ? P.cloudLight : heavy < 0.45 ? P.cloudGrey : P.cloudShade);
      }
    }
  }
}

/** The top of the far trees at column x: low on the left, a hill right of middle. */
const hill = (/** @type {number} */ x) => up(66 - 22 * Math.exp(-(((x - 200) / 75) ** 2)) - 5 * Math.exp(-(((x - 300) / 30) ** 2)) + 2 * Math.sin(x / 9));

/** @param {() => number} rand */
function paintLand(rand) {
  const canvas = makeCanvas(W, WL);
  const g = ctxOf(canvas);

  // Overcast sky in three bands, dithered into each other, lightest at the horizon.
  /** @type {[number, string][]} */
  const bands = [
    [0, P.skyTop],
    [26, P.sky],
    [50, P.skyLow],
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
  if (S.clouds) paintClouds(g, rand);
  // Overcast: long thin streaks of darker cloud, their ends broken up.
  else for (let i = 0; i < 16; i++) {
    const y = 3 + Math.floor(rand() * 56);
    const x = Math.floor(rand() * W);
    const len = 10 + Math.floor(rand() * 40);
    const color = y < 50 ? P.skyTop : P.sky;
    for (let n = 0; n < len; n++) {
      const edge = n < 4 || n > len - 5;
      if (!edge || n % 2 === 0) dot(g, x + n, y, color);
    }
  }

  // The wooded hill: a dark base, pines along the top, broadleaves in autumn
  // colours lower down, a few pale birch trunks showing through.
  for (let x = 0; x < W; x++) {
    for (let y = Math.round(hill(x)) + 2; y < WL; y++) dot(g, x, y, rand() < 0.25 ? P.forest : P.pineDark);
  }
  for (let x = -3; x < W + 3; x += 1 + Math.floor(rand() * 2)) {
    if (rand() < 0.55) {
      const top = Math.round(hill(x)) - Math.floor(rand() * 7 * FAR);
      const tall = Math.round((8 + rand() * 8) * FAR);
      for (let r = 0; r < tall; r++) {
        const half = Math.min(2, Math.floor(r / 2));
        for (let dx = -half; dx <= half; dx++) dot(g, x + dx, top + r, dx === half && r % 2 ? P.pine : rand() < 0.15 ? P.pine : P.pineDark);
      }
    }
  }
  for (let i = 0; i < 420; i++) {
    const x = Math.floor(rand() * W);
    const top = Math.round(hill(x)) + 1 + Math.floor(rand() * 26 * FAR);
    const radius = 1 + Math.floor(rand() * 2.6);
    const color = pick(rand, [P.olive, P.gold, P.ochre, P.forest, P.olive, P.gold, P.rust]);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius + 1) continue;
        dot(g, x + dx, top + dy, rand() < 0.15 ? P.pine : color);
      }
    }
  }
  for (let i = 0; i < 5; i++) {
    const x = 186 + Math.floor(rand() * 60);
    const top = Math.round(hill(x)) + 6;
    line(g, x, top, x, top + Math.round((10 + rand() * 12) * FAR), P.hillBirch);
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
    for (let x = x0 + 2; x < x1 - 2; x += 2 + Math.floor(rand() * 3)) {
      const radius = 1 + Math.floor(rand() * 2.6);
      const cy = Math.round(topAt(x)) + radius - 1;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > radius * radius) continue;
          dot(g, x + dx, cy + dy, rand() < 0.6 ? colours[0] : pick(rand, colours));
        }
      }
    }
  };
  bushes(0, 100, (x) => up(84 + 5 * Math.sin(x / 11) + (x > 60 ? (x - 60) * 0.3 : 0)), [P.olive, P.bush, P.forest, P.gold]);
  bushes(80, 190, (x) => up(98 + 4 * Math.sin(x / 7)), [P.bush, P.bushLight, P.gold, P.olive]);
  bushes(168, W, (x) => up((x >= 255 ? 74 : 74 + (255 - x) * 0.3) + 3 * Math.sin(x / 8)), [P.bush, P.bushLight, P.olive, P.gold]);
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
      const green = rand() < S.greenReeds;
      const tall = 12 + 6 * Math.sin(x / 23) + 3 * Math.sin(x / 7.3) + 2 * Math.sin(x / 3.1) + (x < 90 ? -4 : 0);
      blades.push({
        x,
        base: WL - Math.floor(rand() * 2),
        h: Math.max(3, Math.round((tall + rand() * 10 - 3) * FAR)),
        lean: (rand() - 0.5) * 0.16,
        curve: green && rand() < 0.4 ? (rand() < 0.5 ? -1 : 1) * (0.6 + rand() * 1.2) : 0,
        color: green ? pick(rand, [P.reedGreen, P.reedGreenLight]) : pick(rand, [P.reedBrown, P.reedTan, P.reedTan, P.reedDry]),
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
          const color = i < 2 ? P.cattail : t < 0.35 ? (b.color === P.reedGreenLight ? P.reedGreen : P.reedBrown) : b.color;
          dot(g, x, REED_H - (WL - b.base) - 1 - i, color);
        }
        if (b.cattail) {
          // A dark brown head below the tip, the spike above it.
          const top = b.h - 1;
          const sway = frame;
          const x = left + Math.round(b.lean * top) + sway;
          for (let i = top - 4; i < top - 1; i++) dot(g, x, REED_H - (WL - b.base) - 1 - i, P.cattail);
          dot(g, x + 1, REED_H - (WL - b.base) - 1 - (top - 3), P.cattail);
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
/** The colours the water is rounded to: its greys and the shore's dulled reflection. */
const waterShades = () =>
  [
    P.waterDeep, P.waterDark, P.waterMid, P.waterLight, P.waterSheen, P.waterSky,
    P.reflectDark, P.reflectOlive, P.reflectLight, P.reflectGold,
  ].map(rgb);
/** How much of what's mirrored shows: the rest is the water's own colour. */
const REFLECTION = 0.45;
/** @param {number[]} c @param {number[][]} shades */
const nearestShade = (c, shades) => {
  let best = shades[0];
  let bestD = Infinity;
  for (const s of shades) {
    const d = (s[0] - c[0]) ** 2 + (s[1] - c[1]) ** 2 + (s[2] - c[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
};

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
  const shades = waterShades();
  /** The water's own colour, which the reflection is mixed into. */
  const tint = rgb(P.waterLight);
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
      // Darker towards the viewer, as in the photo.
      const k = 0.95 - (d / rows) * 0.4;
      for (let x = 0; x < W; x++) {
        const sx = Math.min(W - 1, Math.max(0, x + shifts[d >> 1]));
        const at = (sy * W + sx) * 4;
        const jitter = (BAYER[d % 4][x % 4] / 16 - 0.5) * 14;
        const mixed = [0, 1, 2].map((c) => (src[at + c] * REFLECTION + tint[c] * (1 - REFLECTION)) * k + jitter);
        const shade = nearestShade(mixed, shades);
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
      if (d >= 0 && d < rows) dot(g, p.x + shifts[d >> 1], d, P.reflectLog);
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
  for (let i = 0; i < S.floating; i++) {
    const d = Math.floor((H - WL) * Math.sqrt(rand()));
    leaves.push({
      x: Math.floor(rand() * W),
      y: WL + 3 + d,
      color: pick(rand, [P.leafOrange, P.leafGold, P.leafBrown, P.leafPale, P.leafOrange]),
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
          const color = r === 0 ? P.logLight : r >= thick - 2 ? P.logDark : P.log;
          dot(g, x, y - thick + 1 + r, mossy && r > 0 && rand() < 0.25 && x < 70 ? P.moss : color);
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
      line(g, x, y, nx, ny, y < surface ? P.twig : P.logDark);
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
    line(g, x0, y0, x1, y1, P.twig);
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
      color: depth >= 2 ? P.barkBlack : depth === 1 ? P.twig : P.twigFine,
    });
    if (depth > 0 && rand() < 0.8) grow(out, nx, ny, angle + (rand() < 0.5 ? -1 : 1) * (0.5 + rand() * 0.6), len * 0.62, depth - 1, flex + l, leafy, rand);
    if (S.canopy && depth <= 2 && rand() < 0.95) {
      // In full leaf: thick bunches of small leaves on every twig, dark
      // inside, lit where the sun gets through.
      const n = 6 + Math.floor(rand() * 5);
      for (let i = 0; i < n; i++) {
        out.leaves.push({
          x: nx + (rand() - 0.5) * 14, y: ny + (rand() - 0.5) * 10, f: flex + l,
          color: pick(rand, [P.leafBrown, P.leafBrown, P.leafOrange, P.leafOrange, P.leafOrange, P.leafGold, P.ochre]),
          shade: P.leafBrown, angle: rand() * Math.PI * 2, len: 4 + Math.floor(rand() * 2), width: 3,
        });
      }
    } else if (!S.canopy && depth <= 1 && rand() < leafy) {
      const n = 1 + Math.floor(rand() * 3);
      for (let i = 0; i < n; i++) {
        out.leaves.push({
          x: nx + (rand() - 0.5) * 4, y: ny + (rand() - 0.5) * 3, f: flex + l,
          color: pick(rand, [P.leafOrange, P.leafGold, P.leafBrown, P.ochre]),
          shade: P.leafBrown, angle: 0, len: 2, width: 1 + Math.floor(rand() * 2),
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
  // In summer the sprays reach further in, along the top and down the right.
  if (S.canopy) stems.push([212, -2, 1.95, 5], [262, -2, 1.75, 4], [322, 88, 2.85, 4]);
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
      out.segments.push({ x0: x, y0: y, x1: nx, y1: ny, f0: flex, f1: flex + l, thick: 1, color: P.twig });
      flex += l;
      // A leaf either side of each node, hanging and pointing outwards.
      for (const side of [-1, 1]) {
        if (rand() < 0.15) continue;
        const colour = pick(rand, [
          [P.leafGreen, P.leafShade],
          [P.leafLime, P.leafGreen],
          [P.leafGold, P.ochre],
          [P.leafGold, P.leafLime],
          [P.ochre, P.rust],
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
      if (low > dither + 0.5) color = edge === 'left' ? P.barkBlack : rand() < 0.3 ? P.moss : P.barkDark;
      else if (low > dither) color = edge === 'left' ? P.barkDark : rand() < 0.2 ? P.barkDark : P.barkGrey;
      else color = edge === 'left' ? P.barkGrey : edge === 'shade' ? P.barkLight : P.barkWhite;
      pixels.push({ x, y, color });
    }
    // The birch's dark dashes across the bark.
    if (low < 0.6 && rand() < 0.22) {
      const len = 2 + Math.floor(rand() * 3);
      const start = left + 1 + Math.floor(rand() * Math.max(1, right - left - len));
      for (let x = start; x < start + len; x++) pixels.push({ x, y, color: P.barkBlack });
    }
  }
  return (/** @type {CanvasRenderingContext2D} */ g) => {
    for (const p of pixels) dot(g, p.x, p.y, p.color);
  };
}

// ---------- Reeds in front: a clump bottom left, a lone reed bottom right ----------

/**
 * A reed's long leaf: it leaves the stem at `angle`, bends down more and more
 * towards its tip (`droop`, radians in all, + bends clockwise), broadest near
 * the stem and drawn out to a point. `f` is how far along the plant it starts,
 * for the wind; `tone` is [lit edge, body, shaded edge].
 * @typedef {{ x: number, y: number, angle: number, len: number, droop: number, width: number, f: number, tone: string[] }} Ribbon
 * @typedef {{ ribbons: Ribbon[] }} ReedPlant
 */

/** The reed leaves' tones in a palette. @param {typeof POND} p */
const tonesOf = (p) => ({
  shadow: [p.reedLeafDark, p.reedLeafShadow, p.reedLeafShadow],
  mid: [p.reedLeafLight, p.reedLeaf, p.reedLeafDark],
  lit: [p.reedLeafPale, p.reedLeafLight, p.reedLeaf],
  yellow: [p.reedLeafPale, p.reedLeafYellow, p.reedLeaf],
  lime: [p.reedLimePale, p.reedLime, p.reedLimeDark],
  plume: [p.reedPlume, p.reedPlume, p.reedPlume],
});
let TONES = tonesOf(POND);

/**
 * One reed stem and its leaves, added to `out`. The stem is a thin ribbon too;
 * leaves come off it at nodes, longest low down, mostly to one side.
 * @param {ReedPlant} out
 * @param {{ x: number, y: number, angle: number, len: number, bend: number, side: number, reach: number, width: number, gap: number, tone: string[], plume: boolean }} stem
 * @param {() => number} rand
 */
function growStem(out, stem, rand) {
  out.ribbons.push({ x: stem.x, y: stem.y, angle: stem.angle, len: stem.len, droop: stem.bend, width: 1.4, f: 0, tone: stem.tone });
  // Walk the stem as paintRibbon does, to find its nodes.
  let x = stem.x;
  let y = stem.y;
  let angle = stem.angle;
  const step = 0.5;
  let next = 4 + rand() * stem.gap;
  for (let s = 0; s < stem.len; s += step) {
    const t = s / stem.len;
    angle += (stem.bend * 2 * t * step) / stem.len;
    x += Math.cos(angle) * step;
    y += Math.sin(angle) * step;
    if (s < next) continue;
    next += stem.gap * (0.7 + rand() * 0.6);
    const side = rand() < 0.8 ? stem.side : -stem.side;
    const len = stem.reach * (1 - 0.5 * t) * (0.7 + rand() * 0.5) * (side === stem.side ? 1 : 0.6);
    out.ribbons.push({
      x, y,
      angle: angle + side * (0.25 + rand() * 0.45),
      len,
      droop: side * (1.5 + rand() * 1.1),
      width: stem.width + (rand() < 0.4 ? 1 : 0),
      f: s,
      tone: rand() < 0.1 && stem.tone !== TONES.shadow ? TONES.yellow : stem.tone,
    });
  }
  // A thin brown plume hanging off the top, as a few of the photo's reeds have.
  if (stem.plume) {
    out.ribbons.push({ x, y, angle: angle + 0.4, len: 12 + rand() * 6, droop: 1.6, width: 1.4, f: stem.len, tone: TONES.plume });
  }
}

/**
 * The clump in the bottom-left corner (the owner's sketch): common reeds from
 * the photo's left, a dark tangle behind, lit leaves in front, the leaves
 * arching out to the right and hanging down at their tips.
 * @param {() => number} rand
 * @returns {ReedPlant}
 */
function growClump(rand) {
  /** @type {ReedPlant} */
  const out = { ribbons: [] };
  /** @type {[string[], number][]} tone, stems in that layer, back to front */
  const layers = [
    [TONES.shadow, 12],
    [TONES.mid, 9],
    [TONES.lit, 4],
  ];
  for (const [tone, count] of layers) {
    for (let i = 0; i < count; i++) {
      growStem(out, {
        x: -8 + rand() * 38,
        y: H + 2,
        angle: -Math.PI / 2 + 0.12 + rand() * 0.4,
        len: 40 + rand() * 62,
        bend: 0.1 + rand() * 0.25,
        side: 1,
        reach: 38 + rand() * 26,
        width: tone === TONES.shadow ? 3 : 3.4,
        gap: 9,
        tone,
        plume: tone !== TONES.lit && rand() < 0.2,
      }, rand);
    }
  }
  return out;
}

/** The lone reed on the right (the sketch's lime marks): a stem or two, leaves hanging out to the left. @param {() => number} rand */
function growLoneReed(rand) {
  /** @type {ReedPlant} */
  const out = { ribbons: [] };
  const reed = { side: -1, width: 3, gap: 13, tone: TONES.lime, plume: false };
  growStem(out, { ...reed, x: 318, y: H + 2, angle: -Math.PI / 2 - 0.1, len: 34, bend: -0.1, reach: 30 }, rand);
  growStem(out, { ...reed, x: 310, y: H + 2, angle: -Math.PI / 2 - 0.1, len: 60, bend: -0.08, reach: 40 }, rand);
  return out;
}

/**
 * How far a point `f` pixels along a reed moves in a frame: nothing at the
 * root, `reach` pixels per frame at 70 pixels and beyond.
 * @param {number} f @param {number} frame @param {number} reach
 */
const sway = (f, frame, reach) => Math.round(frame * reach * Math.min(1, f / 70));

/**
 * One ribbon, stepped half a pixel at a time along its curve: lit along its
 * upper edge, shaded along its lower, a single pixel where it thins to a point.
 * @param {CanvasRenderingContext2D} g @param {Ribbon} r @param {number} frame @param {number} reach
 */
function paintRibbon(g, r, frame, reach) {
  let x = r.x;
  let y = r.y;
  let angle = r.angle;
  const step = 0.5;
  for (let s = 0; s < r.len; s += step) {
    const t = s / r.len;
    angle += (r.droop * 2 * t * step) / r.len;
    x += Math.cos(angle) * step;
    y += Math.sin(angle) * step;
    const width = r.width * Math.min(1, 0.6 + t * 6) * (1 - t) ** 0.8;
    const dx = sway(r.f + s, frame, reach);
    if (width < 1.3) {
      dot(g, x + dx, y, t > 0.6 ? r.tone[0] : r.tone[1]);
      continue;
    }
    // The normal: which way is "above" the leaf, whichever way it points.
    let nx = Math.sin(angle);
    let ny = -Math.cos(angle);
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    for (let v = -width / 2; v <= width / 2 + 0.01; v += 0.5) {
      const color = v > width / 2 - 0.6 ? r.tone[0] : v < -width / 2 + 0.6 ? r.tone[2] : r.tone[1];
      dot(g, x + dx + nx * v, y + ny * v, color);
    }
  }
}

/** A reed plant in three frames of the wind. @param {ReedPlant} plant @param {number} reach */
function paintReedPlant(plant, reach) {
  return [0, 1, 2].map((frame) => {
    const canvas = makeCanvas(W, H);
    const g = ctxOf(canvas);
    for (const r of plant.ribbons) paintRibbon(g, r, frame, reach);
    return canvas;
  });
}

// ---------- The painting ----------

/**
 * The pond painted, in two layers: `back` (sky, land, water, the reed bed,
 * what floats) goes under the bobber and the line, `front` (the trees and the
 * reeds in the front corners) over them. Both are 320 wide; `update` moves
 * them all, given how much of each side is cropped off.
 * @typedef {{ back: Container, front: Container, update: (now: number, wind: number, crop: number, raining: boolean) => void }} Pond
 */

/**
 * @param {() => number} rand  Uniform [0, 1), the scenery stream.
 * @param {keyof typeof POND_SEASONS} [season]  Autumn as in the first photo, or summer.
 * @returns {Pond}
 */
export function paintPond(rand, season = 'autumn') {
  TextureStyle.defaultOptions.scaleMode = 'nearest';
  const tex = (/** @type {HTMLCanvasElement} */ c) => Texture.from(c);
  // Everything below paints in one go, with no await, in this season's
  // colours and shapes.
  S = POND_SEASONS[season];
  P = S.palette;
  TONES = tonesOf(P);

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
  const clumpFrames = paintReedPlant(growClump(rand), 1).map(tex);
  const loneFrames = paintReedPlant(growLoneReed(rand), 1).map(tex);

  const back = new Container();
  back.addChild(new Sprite(tex(land)));
  const water = new Sprite(waterFrames[0]);
  water.y = WL;
  back.addChild(water);

  // Glints flicking on the water, as the game's waves do.
  const ringColour = P.waterPale;
  const glintKeys = { p: P.waterPale, g: P.glint };
  const glintSets = [
    [['pg.'], ['.gp']],
    [['.ppg.', 'g...p'], ['pg.p.', '..g.p']],
  ].map((frames) => frames.map((rows) => tex(paintGrid(rows, glintKeys))));
  /** @type {{ sprite: Sprite, frames: Texture[], frame: number, next: number }[]} */
  const glints = [];
  for (let i = 0; i < S.glints; i++) {
    const d = 10 + Math.floor(rand() * 95);
    const frames = glintSets[d < 45 ? 0 : 1];
    const sprite = new Sprite(frames[0]);
    sprite.position.set(Math.floor(rand() * (W - 6)), WL + d);
    back.addChild(sprite);
    glints.push({ sprite, frames, frame: 0, next: rand() * 2000 });
  }

  const ripples = new Container();
  back.addChild(ripples);
  /** @type {Map<string, Texture>} */
  const ringCache = new Map();
  const ring = (/** @type {number} */ rx, /** @type {number} */ ry) => {
    const key = `${rx}x${ry}`;
    if (!ringCache.has(key)) ringCache.set(key, tex(paintRing(rx, ry, ringColour)));
    return /** @type {Texture} */ (ringCache.get(key));
  };
  /** @type {{ x: number, y: number, born: number, life: number, maxRx: number }[]} */
  let rings = [];
  let nextRing = 0;

  const reeds = reedFrames.map((frames, s) => {
    const sprite = new Sprite(frames[0]);
    sprite.position.set(s * SECTION - 2, WL - REED_H);
    back.addChild(sprite);
    return sprite;
  });
  back.addChild(new Sprite(tex(debris.canvas)));

  const front = new Container();
  const birch = new Sprite(birchFrames[0]);
  const beech = new Sprite(beechFrames[0]);
  const clump = new Sprite(clumpFrames[0]);
  const lone = new Sprite(loneFrames[0]);
  front.addChild(birch, beech, clump, lone);

  /**
   * Which of the three frames a gust puts things in at column x: gusts roll
   * across from the left, and only a stiff wind bends things twice as far.
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
      birch.texture = birchFrames[gust(now, wind, 60)];
      beech.texture = beechFrames[gust(now, wind, 290)];
      clump.texture = clumpFrames[gust(now, wind, 30)];
      lone.texture = loneFrames[gust(now, wind, 305)];
      water.texture = waterFrames[Math.floor(now / (520 / (1 + wind * 0.3))) % 3];

      for (const glint of glints) {
        if (now < glint.next) continue;
        glint.frame = 1 - glint.frame;
        glint.sprite.texture = glint.frames[glint.frame];
        glint.next = now + (700 + rand() * 1800) / (1 + wind * 0.5);
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
    },
  };
}

/**
 * Which of the pond's seasons shows in the game's: spring looks like summer
 * and winter like autumn until they're painted.
 * @param {string} season
 * @returns {keyof typeof POND_SEASONS}
 */
export function pondSeason(season) {
  return season === 'spring' || season === 'summer' ? 'summer' : 'autumn';
}

// ---------- The scene, for the art sheet ----------

/**
 * @param {HTMLCanvasElement} canvas
 * @param {() => number} rand  Uniform [0, 1), the scenery stream.
 * @param {string} [season]  The painting's season: the pond's autumn or summer, the reedy shore's four.
 * @param {(rand: () => number, season: any) => Pond} [paint]  The pond, or another painting drawn the same way (D117).
 */
export async function createPondScene(canvas, rand, season = 'autumn', paint = paintPond) {
  TextureStyle.defaultOptions.scaleMode = 'nearest';
  const app = new Application();
  await app.init({ canvas, width: W, height: H, resolution: 1, autoDensity: false, antialias: false, background: POND.waterMid });
  const pond = paint(rand, season);

  // The whole painting sits in `view`, moved left to show its middle when the
  // scene is narrower than the painting.
  const view = new Container();
  app.stage.addChild(view);
  view.addChild(pond.back);
  // A bobber out on the water, to show the scale things are drawn at.
  const bobber = new Sprite(Texture.from(paintGrid(BOBBER)));
  view.addChild(bobber, pond.front);

  // Rain and the light of the hour over it all, as in the game; no cloud
  // shadows, since the game's are placed on its own water.
  const skyLayer = new Container();
  app.stage.addChild(skyLayer);
  const sky = createSky(new Container(), skyLayer, H, rand);
  let raining = false;
  let lastFrame = 0;

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
      pond.update(now, sky.wind(), -view.x, raining);
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
