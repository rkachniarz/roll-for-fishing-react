// @ts-check
// The sky as its own layer (12.4, D169), shared by every painted spot that
// shows sky: the still water and the reedy shore, not the swamp (D160). Back to
// front: the sky's colour by the sun's height, the stars, the sun or the moon
// where the engine puts them (src/engine/sky.js), the clouds of the weather
// (12.5, D170: src/scene/clouds.js), and, on the painting's own open water, a
// path of glitter under a low sun or moon in front of the player. A sky-wide
// backdrop of cloud (an overcast, fog) goes under the sun and the moon, which
// show through it as much as its veil lets them; single clouds go over them.
// Still water mirrors the sky and its clouds (`mirrorSky`).
//
// A painting that shows sky paints nothing above its horizon (`Pond` in
// src/scene/pond.js: `horizon`, `waterLayer`, `isWater`). The land isn't relit:
// it is painted for a clear noon (docs/art.md) and the tints over the whole
// scene (src/scene/sky.js) do the light; this layer only draws what is behind
// the land and the glitter on the water.
//
// Everything is in the painting's coordinates: 320 wide, the play area's 256
// in the middle (D93), so the sky spans the strips too. Sprites are drawn as
// code once and cached, never scaled (R7.3); positions are whole pixels.
// Cosmetic randomness (the stars, the glitter) comes from the `rand` given,
// the scenery stream (D4).
//
// Trap: Take the glitter and the mirror off a painting (`attach(null)`) before destroying it: they
// hang on the painting's water.
//  A painting that shows sky paints nothing above its `horizon` (row 110 for the still water and
//   the reedy shore) and gives `horizon`, `skyline` (the top of its land per column, which hides
//   the sun and its glitter), `waterLayer` (a container in `back` just over the water, where the
//   glitter hangs) and `isWater`. The still water's water still mirrors its photo's sky
//   (`paintMirrorSky`), never shown itself; with `mirrorSky` this layer lays the live sky over it
//   faintly (D170). The scene needs `World.time` and `World.fullMoonAt`.

import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { VIEW, acrossView, moonPosition, sunPosition } from '../engine/sky.js';
import { moonlight } from '../engine/moon.js';
import { TIME } from '../engine/time.js';
import { seasons } from '../engine/weather.js';
import { isBloodMoon, isGreenSun } from './light.js';
import { CLOUD_PATTERNS, FILM, SKY_SIZE, SKY_W, driftSpeed, layOutSky, rampColours, skySpec } from './clouds.js';
import { windAcross } from './wind.js';

/** Pixels per degree of height above the horizon (Claude's pick): about the width's 256 px per 60°, so the sky isn't stretched; the picture's top is then 27° up (docs/sources.md). */
export const SKY_SCALE = 4;
/** The painting's width, and where the play area's middle falls in it (D93). */
const W = 320;
const H = 256;
const MIDDLE = 160;
/** The degrees of compass across the whole painting, strips included: the view's 60 over 256 px, carried on. */
const SPAN = (VIEW.width * W) / 256;
/** Half the sun's and the moon's size: 9 px across at first, SKY_SIZE times that now. */
const R = 4 * SKY_SIZE;
/** The ring of light round a high sun or a bright moon, beyond its rim; the rim's own width. */
const HALO = 2.4 * SKY_SIZE;
const RIM = 0.8 * Math.max(1, SKY_SIZE / 2);
/** The sprites' margin round the disc, room for the ring. */
const PAD = Math.ceil(HALO) + 1;

/**
 * The day sky per season, top to horizon (the reedy shore's skies, moved here
 * from src/scene/reedy.js); the cloud colours are kept for 12.5's clouds.
 */
export const SKY_DAY = {
  spring: { top: '#6aa2dd', mid: '#93bde8', low: '#c0daf0', haze: '#dceaf3' },
  summer: { top: '#5f95d6', mid: '#86b1e3', low: '#b5d0ec', haze: '#d3e2ef' },
  autumn: { top: '#8a9db4', mid: '#a4b4c7', low: '#c1cbd6', haze: '#d5dae0' },
  winter: { top: '#6f8fb8', mid: '#93abc9', low: '#bccada', haze: '#d9dfe6' },
};
/** The sky past the day's, by the sun's height: golden (a low sun), twilight (just set), night. */
export const SKY_LOW = {
  golden: { top: '#6e93c8', mid: '#a3b4cf', low: '#e3bf9c', haze: '#f6d6a2' },
  twilight: { top: '#24356a', mid: '#4a5689', low: '#9b6a82', haze: '#e08a60' },
  night: { top: '#081026', mid: '#0e1a3a', low: '#16254b', haze: '#1f3058' },
};
/** Every other colour the layer draws. */
export const SKY_LAYER = {
  glowGold: '#ffd28c',
  glowRed: '#f2804a',
  sunCore: '#fffbea',
  sunRim: '#ffeeb4',
  sunHalo: '#fff6d6',
  sunLowCore: '#ffe397',
  sunLowRim: '#ffb552',
  sunSetCore: '#ffb466',
  sunSetRim: '#ef7438',
  moonLit: '#f3f0dd',
  moonEdge: '#d6d2bc',
  moonDark: '#27314d',
  moonDay: '#e9eef5',
  moonDayEdge: '#cfd9e6',
  moonHalo: '#5d6c96',
  starBright: '#f4f6ff',
  starDim: '#9caed6',
  glitterSun: '#fff4cc',
  glitterWarm: '#ffc46c',
  // The blood moon (D174): blood red in the middle, a coppery red towards the rim.
  bloodCore: '#4e0207',
  bloodInner: '#6e050b',
  bloodMid: '#8f0c10',
  bloodOuter: '#ad2116',
  bloodRim: '#c4401f',
  bloodHalo: '#4a0d16',
  // The green sun (D175): a deep green in the middle, a bright yellow-green towards the rim.
  greenCore: '#0a3a12',
  greenInner: '#0f5419',
  greenMid: '#197322',
  greenOuter: '#33942b',
  greenRim: '#6abd3a',
  greenHalo: '#3c8a34',
  glitterGreen: '#9ae66a',
  glitterGreenDim: '#3f9a34',
  glitterBlood: '#b8281a',
  glitterBloodDim: '#6e1014',
  glitterMoon: '#e2e8f4',
  glitterMoonDim: '#a3b0ca',
};

/** 4×4 ordered dither. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** @param {string} hex @returns {[number, number, number]} */
const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
/** @param {number[]} a @param {number[]} b @param {number} t */
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
/** @param {number} x */
const clamp01 = (x) => Math.max(0, Math.min(1, x));
/** @param {number} deg */
const wrap180 = (deg) => ((((deg % 360) + 540) % 360) - 180);

/** How long a new sky takes to fade in over the old one. */
const SKY_FADE_MS = 5000;
/** How much of the sky the still water mirrors over its own colour. */
const MIRROR_ALPHA = 0.4;
/** How much the light dims while a cloud is over the sun, as a share of the overcast tint (Claude's guess). */
const SUN_SHADE = 0.12;
/** The clouds' tint by the sun's height: day, low sun, twilight; the night's goes from dark to moonlit. */
const CLOUD_TINT = { day: [255, 255, 255], low: [242, 214, 190], twilight: [140, 127, 153], night: [44, 53, 80], moonlit: [106, 117, 144] };

/**
 * The tint over the clouds for a sun that high and the moonlight: white by
 * day, warm low down, purple-grey at twilight, dark at night, lifted by a
 * bright moon.
 * @param {number} altitude @param {number} light  The moonlight, 0 to 1.
 */
export function cloudTint(altitude, light) {
  const night = mix(CLOUD_TINT.night, CLOUD_TINT.moonlit, clamp01(light));
  let c;
  if (altitude >= 6) c = CLOUD_TINT.day;
  else if (altitude >= 0) c = mix(CLOUD_TINT.day, CLOUD_TINT.low, 1 - altitude / 6);
  else if (altitude >= -6) c = mix(CLOUD_TINT.low, CLOUD_TINT.twilight, -altitude / 6);
  else c = mix(CLOUD_TINT.twilight, night, clamp01((-altitude - 6) / 8));
  return (c[0] << 16) | (c[1] << 8) | c[2];
}

/**
 * What the sky layer is given: the game minute, the season, the weather, the
 * spot's facing (null: no sky), and the minute of a full moon.
 * @typedef {{ time: number, season: string, weather: { clouds: number, wind: number, precipitation?: number, description?: string,
 *   season?: string, cell?: number, tags?: string[], sky?: 'special' | 'blood' | 'green' } & import('./wind.js').WindLook, facing: number | null, fullMoonAt?: number }} SkyWorld
 *   The weather as the engine keeps it (src/engine/weather.js): its description and cell pick the clouds
 *   (src/scene/clouds.js, `skySpec`); the art sheet may give `tags` instead of a cell.
 * @typedef {{ horizon: number, skyline: number[], waterLayer: Container, isWater: (x: number, y: number) => boolean, mirrorSky?: boolean, front?: Container }} SkyPainting
 *   `skyline`: the top of the painting's land in each column, which hides a sun or moon behind it from the water;
 *   `front`: the painting's front layer (its trees), whose sprites the special sky is cut around, frame by frame;
 *   `mirrorSky`: still water, which mirrors the sky and the clouds where it doesn't mirror the land.
 */

/**
 * The game minute of a world that gives only the hour and the season (the art
 * sheet's): the middle of that season of the first year.
 * @param {{ time?: number, hour: number, minute: number, season: string }} world
 */
export function minutesOf(world) {
  if (typeof world.time === 'number') return world.time;
  const index = Math.max(0, seasons().findIndex((s) => s.id === world.season));
  return (index * TIME.seasonDays + Math.floor(TIME.seasonDays / 2)) * 1440 + world.hour * 60 + world.minute;
}

/**
 * Where a compass bearing falls across the painting (0 to 320), or null when it
 * is off the painting. The play area's 60° spans its 256 px (D166); the strips
 * carry the same scale on.
 * @param {number | null} facing @param {number} bearing
 */
export function columnOf(facing, bearing) {
  const v = acrossView(facing, bearing, SPAN);
  return v === null ? null : MIDDLE + v * (W / 2);
}

/**
 * The sky's four colours (top, middle, low, at the horizon) for a sun that
 * high, in a season: the day's above 8°, golden down to the horizon, twilight
 * to 6° under it, night from 14° under.
 * @param {number} altitude @param {string} season
 * @returns {number[][]}
 */
export function skyStops(altitude, season) {
  const day = SKY_DAY[/** @type {keyof typeof SKY_DAY} */ (season)] ?? SKY_DAY.spring;
  /** @param {{ top: string, mid: string, low: string, haze: string }} p */
  const stops = (p) => [p.top, p.mid, p.low, p.haze].map(rgb);
  /** @param {number[][]} a @param {number[][]} b @param {number} t */
  const blend = (a, b, t) => a.map((c, i) => mix(c, b[i], clamp01(t)));
  if (altitude >= 8) return stops(day);
  if (altitude >= 0) return blend(stops(day), stops(SKY_LOW.golden), 1 - altitude / 8);
  if (altitude >= -6) return blend(stops(SKY_LOW.golden), stops(SKY_LOW.twilight), -altitude / 6);
  return blend(stops(SKY_LOW.twilight), stops(SKY_LOW.night), (-altitude - 6) / 8);
}

/** @param {number[]} c */
const css = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

/**
 * The sky's colour, painted for a moment: four bands down to the horizon,
 * dithered at their seams (as the reedy shore's sky was), and a glow on the
 * horizon round a sun near it, dithered in too.
 * @param {number} horizon
 * @param {{ altitude: number, bearing: number }} sun
 * @param {number | null} facing
 * @param {string} season
 */
export function paintSkyColour(horizon, sun, facing, season) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = horizon;
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const img = g.createImageData(W, horizon);
  const steps = skyStops(sun.altitude, season);
  // The glow: strongest with the sun's centre a degree under the horizon, gone 10° either way.
  const glow = clamp01(1 - Math.abs(sun.altitude + 1) / 11);
  const glowColour = rgb(sun.altitude > 1 ? SKY_LAYER.glowGold : SKY_LAYER.glowRed);
  for (let y = 0; y < horizon; y++) {
    const t = (y / horizon) ** 1.3;
    const at = Math.min(t, 0.9999) * (steps.length - 1);
    const i = Math.floor(at);
    const f = clamp01((at - i - 0.3) / 0.4);
    for (let x = 0; x < W; x++) {
      const dither = (BAYER[y % 4][x % 4] + 0.5) / 16;
      let c = f > dither ? steps[Math.min(i + 1, steps.length - 1)] : steps[i];
      if (glow > 0 && facing !== null) {
        const bearing = facing + ((x - MIDDLE) / W) * SPAN;
        const off = wrap180(bearing - sun.bearing);
        const strength = glow * Math.exp(-((off / 32) ** 2)) * ((y / horizon) ** 3) * 0.95;
        if (strength > dither) c = glowColour;
      }
      const o = (y * W + x) * 4;
      img.data[o] = c[0];
      img.data[o + 1] = c[1];
      img.data[o + 2] = c[2];
      img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return canvas;
}

/**
 * The sun, 2R + 1 px across: pale and haloed high up, golden low, orange-red as it
 * sets (Claude's picks).
 * @param {'high' | 'low' | 'set'} kind
 */
export function paintSun(kind) {
  const size = 2 * (R + PAD) + 1;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const c = R + PAD;
  const [core, rim] = kind === 'high' ? [SKY_LAYER.sunCore, SKY_LAYER.sunRim] : kind === 'low' ? [SKY_LAYER.sunLowCore, SKY_LAYER.sunLowRim] : [SKY_LAYER.sunSetCore, SKY_LAYER.sunSetRim];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      let colour = null;
      if (d <= R + 0.3) colour = d > R - RIM ? rim : core;
      // High up, a ring of light round it in a checkerboard: hard pixels, no soft edge.
      else if (kind === 'high' && d <= R + HALO && (x + y) % 2 === 0) colour = SKY_LAYER.sunHalo;
      if (!colour) continue;
      g.fillStyle = colour;
      g.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

/** The blood moon's colours from the middle out (D174), by how far out, 0 to 1. */
const BLOOD_BANDS = /** @type {const} */ ([
  [0.3, 'bloodCore'],
  [0.55, 'bloodInner'],
  [0.76, 'bloodMid'],
  [0.92, 'bloodOuter'],
  [Infinity, 'bloodRim'],
]);

/** The green sun's colours from the middle out (D175), as the blood moon's. */
const GREEN_BANDS = /** @type {const} */ ([
  [0.3, 'greenCore'],
  [0.55, 'greenInner'],
  [0.76, 'greenMid'],
  [0.92, 'greenOuter'],
  [Infinity, 'greenRim'],
]);

/**
 * A blood moon (D174), always full: the whole disc very red, blood red in the
 * middle and lighter, coppery, towards the rim, in bands with a checkerboard
 * where they meet; a dark red ring round it by night.
 * @param {boolean} night
 */
export function paintBloodMoon(night) {
  return paintBandedDisc(BLOOD_BANDS, night ? 'bloodHalo' : null);
}

/**
 * A green sun (D175), painted as the blood moon is, in greens: deep green in
 * the middle, a bright yellow-green at the rim, and its ring of light always.
 */
export function paintGreenSun() {
  return paintBandedDisc(GREEN_BANDS, 'greenHalo');
}

/**
 * A disc in bands of colour from the middle out, with a checkerboard where
 * they meet, the darkest a little off-centre (low, to the left), and a
 * checkered ring round it if `halo` names its colour.
 * @param {typeof BLOOD_BANDS | typeof GREEN_BANDS} bands
 * @param {'bloodHalo' | 'greenHalo' | null} halo
 */
function paintBandedDisc(bands, halo) {
  const size = 2 * (R + PAD) + 1;
  const c = R + PAD;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      /** @type {string | null} */
      let colour = null;
      if (d <= R + 0.3) {
        // A little off-centre, low and to the left, as the earth's shadow lies over a blood moon.
        const r = Math.hypot(x - c + R * 0.12, y - c - R * 0.1) / (R + 0.5) + ((x + y) % 2 === 0 ? 0.04 : -0.04);
        const band = /** @type {readonly [number, keyof typeof SKY_LAYER]} */ (bands.find(([edge]) => r < edge) ?? bands[bands.length - 1]);
        colour = SKY_LAYER[band[1]];
      } else if (halo && d <= R + HALO && (x + y) % 2 === 0) colour = SKY_LAYER[halo];
      if (!colour) continue;
      g.fillStyle = colour;
      g.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

/**
 * The moon, 2R + 1 px across, lit as its phase says: a waxing moon (phase under
 * 0.5) lit on the right, as seen from the north. By night the dark part shows
 * faintly against the sky; by day only the lit part shows, pale.
 * @param {number} phase  0 new, 0.5 full.
 * @param {boolean} night
 */
export function paintMoon(phase, night) {
  const size = 2 * (R + PAD) + 1;
  const c = R + PAD;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const k = Math.cos(2 * Math.PI * phase);
  const waxing = phase < 0.5;
  // A moon past half lights a ring of the night sky round it, in a checkerboard.
  const halo = night && (1 - k) / 2 > 0.5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      let colour = null;
      if (d <= R + 0.3) {
        const u = (x - c) / (R + 0.5);
        const v = (y - c) / (R + 0.5);
        const edge = k * Math.sqrt(Math.max(0, 1 - v * v));
        const lit = waxing ? u > edge : u < -edge;
        if (lit) colour = night ? (d > R - RIM ? SKY_LAYER.moonEdge : SKY_LAYER.moonLit) : d > R - RIM ? SKY_LAYER.moonDayEdge : SKY_LAYER.moonDay;
        else if (night) colour = SKY_LAYER.moonDark;
      } else if (halo && d <= R + HALO && (x + y) % 2 === 0) colour = SKY_LAYER.moonHalo;
      if (!colour) continue;
      g.fillStyle = colour;
      g.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

/** How many steps the moon's phase is drawn in. */
const PHASE_STEPS = 28;

/**
 * The sky layer. `back` goes under a painting's back layer; `glitter` goes into
 * the painting's `waterLayer` (`attach`). 12.5's clouds go in `clouds`, over
 * the sun and the moon and under nothing else; `cloudContext()` tells them the
 * moment, the season, the weather, the horizon and where the sun is.
 * @param {() => number} rand  The scenery stream (D4).
 */
export function createSkyLayer(rand) {
  /** @type {Map<string, Texture>} */
  const cache = new Map();
  /** @param {string} key @param {() => HTMLCanvasElement} paint */
  const cached = (key, paint) => {
    let t = cache.get(key);
    if (!t) {
      t = Texture.from(paint());
      cache.set(key, t);
    }
    return t;
  };

  const back = new Container();
  back.label = 'sky';
  const colourNew = new Sprite();
  const colourOld = new Sprite();
  const stars = new Graphics();
  const moon = new Sprite();
  const sun = new Sprite();
  const clouds = new Container();
  clouds.label = 'clouds';
  // A sky-wide backdrop of cloud (overcast, fog) under the sun and the moon, single clouds over them.
  const backdrops = new Container();
  back.addChild(colourNew, colourOld, stars, backdrops, moon, sun, clouds);
  // The special sky (D173): the magic has its own light, so it hangs over the
  // light of the hour (the scene puts `over` above it), cut to the sky above
  // the painting's land and round its front layer's trees, as they sway, so it
  // never covers them.
  const over = new Container();
  over.label = 'sky-glow';
  const glows = new Container();
  const overMask = new Sprite();
  over.addChild(glows, overMask);
  over.mask = overMask;
  /** The cut, per set of front frames showing: painted when first needed. @type {Map<string, Texture>} */
  const masks = new Map();
  let maskKey = '';
  moon.visible = sun.visible = colourOld.visible = false;
  const glitter = new Graphics();

  // Still water's mirror of the sky (D170): the sky's colour and the clouds,
  // turned over at the horizon, faint, and only where the water mirrors sky
  // rather than land.
  const mirror = new Container();
  mirror.label = 'sky-mirror';
  mirror.alpha = MIRROR_ALPHA;
  const mirrorColour = new Sprite();
  mirrorColour.scale.y = -1;
  const mirrorClouds = new Container();
  const mirrorGlows = new Container();
  const mirrorMask = new Graphics();
  mirror.addChild(mirrorColour, mirrorClouds, mirrorGlows, mirrorMask);
  mirror.mask = mirrorMask;

  // ---------- The clouds (12.5, D170) ----------

  /** Painted grids, by pattern, band and variant (the full-sky ones by horizon): drawn once from the scenery stream. @type {Map<string, import('./clouds.js').CloudGrid>} */
  const grids = new Map();
  /** @param {string} pattern @param {import('./clouds.js').Band} band @param {number} variant */
  const gridKey = (pattern, band, variant) => (CLOUD_PATTERNS[pattern].full ? `${pattern}@${horizon}` : `${pattern}:${band}:${variant}`);
  /** @param {string} pattern @param {import('./clouds.js').Band} band @param {number} variant */
  function gridOf(pattern, band, variant) {
    const key = gridKey(pattern, band, variant);
    let g = grids.get(key);
    if (!g) {
      g = CLOUD_PATTERNS[pattern].paint(rand, band, horizon);
      grids.set(key, g);
    }
    return g;
  }
  /**
   * A cloud's sprite texture in a season's palette, cached.
   * @param {string} pattern @param {import('./clouds.js').Band} band @param {number} variant
   * @param {Record<string, string>} palette @param {string} season
   */
  function cloudTexture(pattern, band, variant, palette, season) {
    return cached(`cloud:${gridKey(pattern, band, variant)}:${season}`, () => {
      const g = gridOf(pattern, band, variant);
      // A glowing pattern has its own colours, see-through (FILM); the others their ramp's in the season's palette.
      const colours = CLOUD_PATTERNS[pattern].glow ? FILM : rampColours(CLOUD_PATTERNS[pattern].ramp, palette);
      const canvas = document.createElement('canvas');
      canvas.width = g.w;
      canvas.height = g.h;
      const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
      const img = ctx.createImageData(g.w, g.h);
      for (let i = 0; i < g.data.length; i++) {
        const t = g.data[i];
        if (!t) continue;
        const c = colours[t - 1];
        img.data[i * 4] = c[0];
        img.data[i * 4 + 1] = c[1];
        img.data[i * 4 + 2] = c[2];
        img.data[i * 4 + 3] = c[3] ?? 255;
      }
      ctx.putImageData(img, 0, 0);
      return canvas;
    });
  }

  /**
   * One sky of clouds: what shows for a weather, fading in over the last.
   * @typedef {{ sprite: Sprite, twin: Sprite, x: number, y: number, w: number, h: number, speed: number, grid: import('./clouds.js').CloudGrid }} Drifting
   * @typedef {{ key: string, spec: import('./clouds.js').SkySpec, parts: Container[],
   *   backdrop: { a: Sprite, b: Sprite, ta: Sprite, tb: Sprite, x: number, grid: import('./clouds.js').CloudGrid } | null,
   *   items: Drifting[], born: number, fade: boolean, backdropId: string | null, open: boolean }} CloudSky
   *   `open`: the backdrop lets the sky through (a deck), so it goes over the sun and the moon and covers only where drawn.
   */
  /** @type {CloudSky | null} */
  let sky = null;
  /** @type {CloudSky | null} */
  let oldSky = null;
  /** @type {import('./clouds.js').SkySpec | null} */
  let spec = null;
  let specKey = '';
  /** A cloud over the sun: shown light 1 in the sun, 0 in shade, eased. */
  let sunLight = 1;
  let sunHidden = false;
  let spellUntil = 0;

  /** @param {CloudSky} s */
  function dropSky(s) {
    for (const part of s.parts) part.destroy({ children: true });
  }

  /** Lays out and puts up the sky for the current spec. @param {number} now @param {boolean} fade */
  function buildSky(now, fade) {
    if (!spec || !world) return null;
    const season = world.season;
    const layout = layOutSky(spec, rand, horizon, gridOf);
    const base = new Container();
    const front = new Container();
    const mirrorBase = new Container();
    const mirrorFront = new Container();
    const glow = Boolean(layout.backdrop && CLOUD_PATTERNS[layout.backdrop].glow);
    backdrops.addChild(base);
    (glow ? glows : clouds).addChild(front);
    mirrorClouds.addChild(mirrorBase);
    (glow ? mirrorGlows : mirrorClouds).addChild(mirrorFront);
    /** @type {CloudSky} */
    const open = Boolean(layout.backdrop && CLOUD_PATTERNS[layout.backdrop].open);
    const s = { key: specKey, spec, parts: [base, front, mirrorBase, mirrorFront], backdrop: null, backdropId: layout.backdrop, items: [], born: now, fade, open };
    /** @param {Sprite} t @param {number} y */
    const turn = (t, y) => {
      t.scale.y = -1;
      t.y = 2 * horizon - y;
    };
    if (layout.backdrop) {
      const tex = cloudTexture(layout.backdrop, 'mid', 0, spec.palette, season);
      const [a, b, ta, tb] = [0, 1, 2, 3].map(() => new Sprite(tex));
      // A deck goes over the sun and the moon, which show only in its holes.
      (open ? front : base).addChild(a, b);
      (open ? mirrorFront : mirrorBase).addChild(ta, tb);
      turn(ta, 0);
      turn(tb, 0);
      s.backdrop = { a, b, ta, tb, x: Math.floor(rand() * SKY_W), grid: gridOf(layout.backdrop, 'mid', 0) };
    }
    for (const c of layout.clouds) {
      const tex = cloudTexture(c.pattern, c.band, c.variant, spec.palette, season);
      const sprite = new Sprite(tex);
      const twin = new Sprite(tex);
      sprite.y = c.y;
      turn(twin, c.y);
      front.addChild(sprite);
      mirrorFront.addChild(twin);
      s.items.push({ sprite, twin, x: c.x, y: c.y, w: c.w, h: c.h, speed: c.speed, grid: gridOf(c.pattern, c.band, c.variant) });
    }
    placeSky(s, 0);
    return s;
  }

  /** Drifts a sky on by `dx` pixels, wrapping across the whole painting, strips included (D93). @param {CloudSky} s @param {number} dx */
  function placeSky(s, dx) {
    if (s.backdrop) {
      const b = s.backdrop;
      b.x = (((b.x + dx * 0.35) % SKY_W) + SKY_W) % SKY_W;
      const x = Math.round(b.x);
      b.a.x = b.ta.x = x - SKY_W;
      b.b.x = b.tb.x = x;
    }
    for (const c of s.items) {
      c.x += dx * c.speed;
      if (c.x > SKY_W) c.x -= SKY_W + c.w;
      else if (c.x < -c.w) c.x += SKY_W + c.w;
      c.sprite.x = c.twin.x = Math.round(c.x);
    }
  }

  /** @param {CloudSky} s @param {number} alpha */
  const fadeSky = (s, alpha) => {
    for (const part of s.parts) part.alpha = alpha;
  };

  /** Whether a cloud drawn now covers the point (in the painting's pixels). @param {number} x @param {number} y */
  function cloudAt(x, y) {
    if (!sky) return false;
    if (sky.backdrop && !sky.open) return true;
    const px = Math.round(x);
    const py = Math.round(y);
    if (sky.backdrop) {
      const g = sky.backdrop.grid;
      const lx = (((px - Math.round(sky.backdrop.x)) % SKY_W) + SKY_W) % SKY_W;
      if (py >= 0 && py < g.h && g.data[py * g.w + lx]) return true;
    }
    for (const c of sky.items) {
      const lx = px - Math.round(c.x);
      const ly = py - c.y;
      if (lx >= 0 && ly >= 0 && lx < c.w && ly < c.h && c.grid.data[ly * c.w + lx]) return true;
    }
    return false;
  }

  /** Builds the mirror's mask: the water that mirrors sky, under where the land is mirrored. */
  function maskMirror() {
    mirrorMask.clear();
    if (!painting) return;
    for (let x = 0; x < W; x++) {
      const top = Math.max(horizon + 1, 2 * horizon - 1 - (painting.skyline[x] ?? horizon));
      let y = top;
      while (y < H && !painting.isWater(x, y)) y++;
      if (y < H) mirrorMask.rect(x, y, 1, H - y);
    }
    mirrorMask.fill(0xffffff);
  }

  /** @type {SkyPainting | null} */
  let painting = null;
  /** @type {SkyWorld | null} */
  let world = null;
  let horizon = 110;
  let colourKey = '';
  /** When the old colour started fading out. */
  let fadeFrom = -Infinity;
  const FADE_MS = 1600;

  /** Where the sun and the moon are, eased towards where the engine puts them: height and offset from the facing, in degrees. */
  const shown = { sunAlt: 0, sunOff: 0, moonAlt: 0, moonOff: 0, cover: 1 };
  const target = { sunAlt: 0, sunOff: 0, moonAlt: 0, moonOff: 0, cover: 1, sunBearing: 0, phase: 0, light: 0, moonUp: false, blood: false, green: false };
  let snapNext = true;

  /** @type {{ x: number, y: number, bright: boolean }[]} */
  let starList = [];
  let starsFor = -1;
  let nextTwinkle = 0;
  let nextGlitter = 0;
  let lastDrawn = '';

  /** The stars: scattered once per horizon, thicker towards the top. */
  function scatterStars() {
    starsFor = horizon;
    starList = Array.from({ length: 80 }, () => ({
      x: Math.floor(rand() * W),
      y: Math.floor((horizon - 6) * rand() ** 1.5),
      bright: rand() < 0.2,
    }));
  }

  /** The colour now, and the one fading out over it. @type {Texture | null} */
  let texNew = null;
  /** @type {Texture | null} */
  let texOld = null;
  function dropOld() {
    texOld?.destroy(true);
    texOld = null;
    colourOld.texture = Texture.EMPTY;
    colourOld.visible = false;
  }

  /** Repaints the sky's colour if the moment's look changed, fading the old one out. @param {number} now */
  function repaintColour(now) {
    if (!world) return;
    const alt = Math.round(target.sunAlt * 2) / 2;
    const key = `${world.season}:${alt}:${Math.round(target.sunBearing)}:${world.facing}:${horizon}`;
    if (key === colourKey) return;
    const first = colourKey === '' || snapNext;
    colourKey = key;
    dropOld();
    if (!first && texNew) {
      // The current colour becomes the old one, fading out over the new.
      texOld = texNew;
      colourOld.texture = texOld;
      colourOld.visible = true;
      colourOld.alpha = 1;
      fadeFrom = now;
    } else texNew?.destroy(true);
    texNew = Texture.from(paintSkyColour(horizon, { altitude: target.sunAlt, bearing: target.sunBearing }, world.facing, world.season));
    colourNew.texture = texNew;
    mirrorColour.texture = texNew;
    mirrorColour.y = 2 * horizon;
  }

  /** Works out where the sun and the moon are for the world given. */
  function aim() {
    if (!world) return;
    const s = sunPosition(world.time);
    target.sunAlt = s.altitude;
    target.sunBearing = s.bearing;
    target.sunOff = world.facing === null ? 999 : wrap180(s.bearing - world.facing);
    // What shows of the sun, the moon and the stars between and through the clouds (D170).
    spec = skySpec(world.weather, world.season);
    specKey = JSON.stringify([world.season, spec.level, spec.patterns, spec.drift, spec.low, horizon]);
    target.cover = spec.veil;
    target.green = isGreenSun(world);
    if (typeof world.fullMoonAt === 'number') {
      const m = moonPosition(world.time, world.fullMoonAt);
      target.moonAlt = m.altitude;
      target.moonOff = world.facing === null ? 999 : wrap180(m.bearing - world.facing);
      target.phase = m.phase;
      target.moonUp = m.lit > 0.03;
      target.light = moonlight(world.time, world.fullMoonAt, world.weather.clouds ?? 0);
      target.blood = isBloodMoon(world);
    } else {
      target.moonUp = false;
      target.light = 0;
      target.blood = false;
    }
  }

  /**
   * The world changed (a half hour went by, the weather, the spot): aim the
   * sun and the moon anew; they and the sky's colour ease there.
   * @param {SkyWorld} next
   */
  function setWorld(next) {
    const jump = !world || world.facing !== next.facing || Math.abs(next.time - world.time) > 90;
    world = next;
    if (jump) snapNext = true;
    aim();
  }

  /**
   * Hangs the glitter on a painting's water and takes its horizon.
   * @param {SkyPainting | null} next
   */
  function attach(next) {
    glitter.removeFromParent();
    mirror.removeFromParent();
    painting = next;
    dropMasks();
    if (!next) return;
    horizon = next.horizon;
    cutGlow();
    if (next.mirrorSky) {
      next.waterLayer.addChild(mirror);
      maskMirror();
    }
    next.waterLayer.addChild(glitter);
    colourKey = '';
    snapNext = true;
    // The clouds again for this horizon.
    if (world) aim();
  }

  function dropMasks() {
    overMask.texture = Texture.EMPTY;
    for (const t of masks.values()) t.destroy(true);
    masks.clear();
    maskKey = '';
  }

  /** The front layer's sprites showing, with where they are in the painting. */
  function frontSprites() {
    /** @type {{ sprite: Sprite, x: number, y: number }[]} */
    const out = [];
    const walk = (/** @type {Container} */ c, /** @type {number} */ x, /** @type {number} */ y) => {
      for (const child of c.children) {
        if (!child.visible) continue;
        if (child instanceof Sprite) out.push({ sprite: child, x: x + child.x, y: y + child.y });
        else walk(child, x + child.x, y + child.y);
      }
    };
    if (painting?.front) walk(painting.front, 0, 0);
    return out;
  }

  /** Cuts the special sky to the sky above the land and round the front's trees, as they show now. */
  function cutGlow() {
    if (!painting) return;
    const sprites = frontSprites();
    const key = sprites.map(({ sprite, x, y }) => `${sprite.texture.uid}@${x},${y}`).join('|');
    if (key === maskKey && overMask.texture !== Texture.EMPTY) return;
    let tex = masks.get(key);
    if (!tex) {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = Math.max(1, horizon);
      const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
      g.fillStyle = '#fff';
      for (let x = 0; x < W; x++) g.fillRect(x, 0, 1, Math.min(horizon, painting.skyline[x] ?? horizon));
      g.globalCompositeOperation = 'destination-out';
      for (const { sprite, x, y } of sprites) {
        const t = sprite.texture;
        const source = /** @type {CanvasImageSource} */ (t.source.resource);
        if (!source) continue;
        const f = t.frame;
        g.drawImage(source, f.x, f.y, f.width, f.height, Math.round(x - sprite.anchor.x * f.width), Math.round(y - sprite.anchor.y * f.height), f.width, f.height);
      }
      // Few sets of frames show, but a cap keeps a windy painting from piling them up.
      if (masks.size >= 32) dropMasks();
      tex = Texture.from(canvas);
      masks.set(key, tex);
    }
    overMask.texture = tex;
    maskKey = key;
  }

  /** @param {number} now @param {number} dt */
  function update(now, dt) {
    if (!world || !painting) return;
    if (over.visible && glows.children.length) cutGlow();
    if (starsFor !== horizon) scatterStars();
    const snapping = snapNext;
    const rate = snapNext ? 1 : Math.min(1, 0.03 * (Math.min(dt, 100) / 16.7));
    repaintColour(now);
    snapNext = false;
    for (const key of /** @type {const} */ (['sunAlt', 'sunOff', 'moonAlt', 'moonOff', 'cover'])) {
      // The offsets wrap: ease the short way round.
      const diff = key.endsWith('Off') ? wrap180(target[key] - shown[key]) : target[key] - shown[key];
      shown[key] += diff * rate;
      if (key.endsWith('Off')) shown[key] = wrap180(shown[key]);
    }
    if (texOld) {
      const t = (now - fadeFrom) / FADE_MS;
      if (t >= 1) dropOld();
      else colourOld.alpha = 1 - t;
    }

    const facing = world.facing;
    const half = SPAN / 2 + 3;
    // ---------- The sun ----------
    const sunX = MIDDLE + (shown.sunOff / (SPAN / 2)) * (W / 2);
    const sunY = horizon - shown.sunAlt * SKY_SCALE;
    sun.visible = facing !== null && Math.abs(shown.sunOff) <= half && shown.sunAlt > -2 && shown.cover > 0.05;
    if (sun.visible) {
      const kind = shown.sunAlt > 10 ? 'high' : shown.sunAlt > 2 ? 'low' : 'set';
      sun.texture = target.green ? cached('sun:green', paintGreenSun) : cached(`sun:${kind}`, () => paintSun(kind));
      sun.position.set(Math.round(sunX) - R - PAD, Math.round(sunY) - R - PAD);
      sun.alpha = shown.cover;
    }
    // ---------- The moon ----------
    const night = shown.sunAlt < -4;
    const moonX = MIDDLE + (shown.moonOff / (SPAN / 2)) * (W / 2);
    const moonY = horizon - shown.moonAlt * SKY_SCALE;
    moon.visible = facing !== null && target.moonUp && Math.abs(shown.moonOff) <= half && shown.moonAlt > -2 && shown.cover > 0.05;
    if (moon.visible) {
      const step = Math.round(target.phase * PHASE_STEPS) % PHASE_STEPS;
      moon.texture = target.blood
        ? cached(`blood:${night}`, () => paintBloodMoon(night))
        : cached(`moon:${step}:${night}`, () => paintMoon(step / PHASE_STEPS, night));
      moon.position.set(Math.round(moonX) - R - PAD, Math.round(moonY) - R - PAD);
      // By day the moon is faint, a pale shape on the blue.
      moon.alpha = shown.cover * (night ? 1 : 0.7);
    }
    // ---------- The stars: from the sun 7° under, gone under cloud ----------
    const starAlpha = clamp01((-shown.sunAlt - 7) / 5) * (shown.cover > 0.6 ? shown.cover : 0);
    stars.visible = starAlpha > 0.02;
    if (stars.visible) {
      stars.alpha = starAlpha;
      if (now >= nextTwinkle) {
        nextTwinkle = now + 500;
        stars.clear();
        for (const s of starList) {
          // A few flicker out for a moment.
          if (rand() < 0.04) continue;
          stars.rect(s.x, s.y, 1, 1).fill(s.bright ? SKY_LAYER.starBright : SKY_LAYER.starDim);
        }
      }
    }

    // ---------- The clouds: a new weather's fade in over the old; all drift with the wind ----------
    if (spec && (!sky || sky.key !== specKey)) {
      if (oldSky) dropSky(oldSky);
      oldSky = null;
      if (sky && !snapping) {
        oldSky = sky;
        oldSky.born = now;
      } else if (sky) dropSky(sky);
      sky = buildSky(now, Boolean(oldSky));
    }
    if (snapping && oldSky) {
      dropSky(oldSky);
      oldSky = null;
    }
    // Only the wind's share across the view drifts them sideways (D176).
    const dx = (driftSpeed(world.weather.wind ?? 0, spec?.drift ?? 1) * windAcross(world.weather, world.facing, now) * Math.min(dt, 100)) / 1000;
    if (sky) {
      placeSky(sky, dx);
      fadeSky(sky, sky.fade && !snapping ? clamp01((now - sky.born) / SKY_FADE_MS) : 1);
      if (snapping) sky.fade = false;
    }
    if (oldSky) {
      placeSky(oldSky, dx);
      const left = 1 - (now - oldSky.born) / SKY_FADE_MS;
      if (left <= 0) {
        dropSky(oldSky);
        oldSky = null;
      } else fadeSky(oldSky, left);
    }
    const tint = cloudTint(shown.sunAlt, target.light);
    backdrops.tint = clouds.tint = mirrorClouds.tint = tint;

    // A cloud over the sun: the clouds drawn decide while the sun is on the
    // picture; off it, spells of shade come and go as often as the sky says.
    const sunOnPicture = facing !== null && Math.abs(shown.sunOff) <= half && shown.sunAlt > -2;
    if (!spec || !sky || (sky.backdrop && !sky.open) || shown.sunAlt <= 0) sunHidden = false;
    else if (sunOnPicture) sunHidden = cloudAt(sunX, sunY);
    else if (now >= spellUntil || snapping) {
      sunHidden = rand() < spec.sunHides;
      spellUntil = now + (sunHidden ? 4000 + rand() * 8000 : 6000 + rand() * 14000);
    }
    sunLight = snapping ? (sunHidden ? 0 : 1) : sunLight + ((sunHidden ? 0 : 1) - sunLight) * Math.min(1, 0.05 * (Math.min(dt, 100) / 16.7));

    // ---------- The glitter: a low sun, or a moon bright enough, in front ----------
    if (now >= nextGlitter) {
      nextGlitter = now + 170;
      /** @type {{ x: number, alt: number, strength: number, bright: string, dim: string, narrow: boolean } | null} */
      let source = null;
      /** Over the land at its column, so the water can see it. @param {number} x @param {number} y */
      const clear = (x, y) => y < (painting.skyline[Math.round(x)] ?? horizon);
      if (sun.visible && shown.sunAlt < 20 && shown.sunAlt > -1 && clear(sunX, sunY)) {
        source = {
          x: sunX,
          alt: Math.max(0, shown.sunAlt),
          strength: clamp01((20 - shown.sunAlt) / 20) * shown.cover * sunLight,
          bright: target.green ? SKY_LAYER.glitterGreen : SKY_LAYER.glitterSun,
          dim: target.green ? SKY_LAYER.glitterGreenDim : shown.sunAlt < 6 ? SKY_LAYER.glitterWarm : SKY_LAYER.glitterSun,
          narrow: false,
        };
      } else if (moon.visible && night && shown.moonAlt < 30 && clear(moonX, moonY)) {
        source = {
          x: moonX,
          alt: Math.max(0, shown.moonAlt),
          strength: target.light * clamp01((30 - shown.moonAlt) / 12) * 0.8,
          narrow: true,
          bright: target.blood ? SKY_LAYER.glitterBlood : SKY_LAYER.glitterMoon,
          dim: target.blood ? SKY_LAYER.glitterBloodDim : SKY_LAYER.glitterMoonDim,
        };
      }
      drawGlitter(source, world.weather.wind ?? 0);
    }
  }

  /**
   * The path of glitter under a low sun or moon: short dashes on the open
   * water, gathered round where the water mirrors it (as far under the
   * horizon as it stands over it) and spreading towards the viewer, wider
   * nearer, more of them the lower and brighter it is.
   * @param {{ x: number, alt: number, strength: number, bright: string, dim: string, narrow: boolean } | null} source
   * @param {number} wind
   */
  function drawGlitter(source, wind) {
    glitter.clear();
    if (!source || source.strength < 0.04 || !painting) {
      lastDrawn = '';
      return;
    }
    const rows = H - horizon;
    // The moon's path is narrower and tighter than the sun's, so its few, dimmer dashes still read as a path.
    const count = Math.round(source.strength * (source.narrow ? 110 : 90));
    const centre = 2 + source.alt * SKY_SCALE;
    const spread = source.narrow ? 12 + wind * 5 : 22 + wind * 8;
    let drawn = 0;
    for (let i = 0; i < count; i++) {
      // Folded at the horizon, so the near end trails off towards the viewer.
      const d = Math.round(Math.abs(centre + (rand() + rand() + rand() - 1.5) * spread * 1.6 - 1) + 1);
      if (d >= rows) continue;
      const halfWidth = source.narrow ? 1 + d * 0.05 + wind * 0.4 : 1.5 + d * 0.09 + wind * 0.6;
      const off = (rand() + rand() - 1) * halfWidth * 1.4;
      const x = Math.round(source.x + off);
      const y = horizon + d;
      const len = d < 18 ? 1 : d < 60 ? 1 + Math.floor(rand() * 2) : 2 + Math.floor(rand() * 2);
      if (x < 0 || x + len > W || !painting.isWater(x, y) || !painting.isWater(x + len - 1, y)) continue;
      glitter.rect(x, y, len, 1).fill(Math.abs(off) < halfWidth * 0.5 ? source.bright : source.dim);
      drawn++;
    }
    lastDrawn = drawn ? `${Math.round(source.x)}:${drawn}` : '';
  }

  return {
    back,
    /** The special sky's glow (D173): the scene puts it over the light of the hour, at the same place as `back`. */
    over,
    clouds,
    glitter,
    setWorld,
    attach,
    update,
    /** Jumps to where things belong, with no easing (the art sheet's stills). */
    snap() {
      snapNext = true;
      nextGlitter = 0;
      nextTwinkle = 0;
    },
    /**
     * The world, the horizon row, where the sun is (its column on the
     * painting, or null, and its height), and what the clouds are (their spec).
     */
    cloudContext() {
      return { world, horizon, width: W, sun: { x: world ? columnOf(world.facing, target.sunBearing) : null, altitude: target.sunAlt }, spec };
    },
    /** How much the light dims for a cloud over the sun, for the tints (src/scene/sky.js): it comes and goes. */
    shade() {
      return sky && (!sky.backdrop || sky.open) && shown.sunAlt > 0 ? (1 - sunLight) * SUN_SHADE : 0;
    },
    /** How many of the water's glints still flick: fewer under an overcast, and in a cloud's shade (D170). */
    glints() {
      return spec ? spec.glints * (0.55 + 0.45 * sunLight) : 1;
    },
    /** What is drawn, for tools/verify.mjs, which can't read a WebGL canvas back. */
    describe() {
      const at = (/** @type {Sprite} */ s) => (s.visible ? `${s.x + Math.floor(s.width / 2)},${s.y + Math.floor(s.height / 2)}` : null);
      const clouds = sky ? { from: sky.spec.from, level: sky.spec.level, backdrop: sky.backdropId, count: sky.items.length } : null;
      return { sun: at(sun), moon: at(moon), stars: stars.visible, glitter: lastDrawn || null, horizon, clouds, mirror: Boolean(mirror.parent) };
    },
  };
}
