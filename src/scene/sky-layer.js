// @ts-check
// The sky as its own layer (12.4, D169), shared by every painted spot that
// shows sky: the still water and the reedy shore, not the swamp (D160). Back to
// front: the sky's colour by the sun's height, the stars, the sun or the moon
// where the engine puts them (src/engine/sky.js), a place for the clouds
// (12.5), and, on the painting's own open water, a path of glitter under a low
// sun or moon in front of the player.
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

import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { VIEW, acrossView, moonPosition, sunPosition } from '../engine/sky.js';
import { moonlight } from '../engine/moon.js';
import { TIME } from '../engine/time.js';
import { seasons } from '../engine/weather.js';

/** Pixels per degree of height above the horizon (Claude's pick, docs/REVIEW.md): about the width's 256 px per 60°. */
export const SKY_SCALE = 4;
/** The painting's width, and where the play area's middle falls in it (D93). */
const W = 320;
const H = 256;
const MIDDLE = 160;
/** The degrees of compass across the whole painting, strips included: the view's 60 over 256 px, carried on. */
const SPAN = (VIEW.width * W) / 256;
/** Half the sun's and the moon's size: both are 9 px across (their sprites 15, for the ring round them). */
const R = 4;

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
/** The clouds' colours per season, for 12.5 (from the reedy shore's painted clouds). */
export const SKY_CLOUDS = {
  spring: { light: '#f4f7fa', cloud: '#dfe7ef', shade: '#c3d0de', dark: '#a9b8cb' },
  summer: { light: '#f4f7fa', cloud: '#dfe7ef', shade: '#c3d0de', dark: '#a9b8cb' },
  autumn: { light: '#e6e9ed', cloud: '#d1d6dd', shade: '#b6bec9', dark: '#9ba5b3' },
  winter: { light: '#eef0f2', cloud: '#d2d7de', shade: '#a9b2bf', dark: '#858f9e' },
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

/** What the clouds let through of the sun, the moon and the stars, by cloud level: a stand-in until 12.5 (CR-2). */
const COVER = [1, 1, 0.85, 0.5, 0.1, 0];

/**
 * What the sky layer is given: the game minute, the season, the weather, the
 * spot's facing (null: no sky), and the minute of a full moon.
 * @typedef {{ time: number, season: string, weather: { clouds: number, wind: number }, facing: number | null,
 *   fullMoonAt?: number }} SkyWorld
 * @typedef {{ horizon: number, skyline: number[], waterLayer: Container, isWater: (x: number, y: number) => boolean }} SkyPainting
 *   `skyline`: the top of the painting's land in each column, which hides a sun or moon behind it from the water.
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
 * The sun, 9 px across: pale and haloed high up, golden low, orange-red as it
 * sets (Claude's picks, docs/REVIEW.md).
 * @param {'high' | 'low' | 'set'} kind
 */
export function paintSun(kind) {
  const size = 2 * (R + 3) + 1;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const c = R + 3;
  const [core, rim] = kind === 'high' ? [SKY_LAYER.sunCore, SKY_LAYER.sunRim] : kind === 'low' ? [SKY_LAYER.sunLowCore, SKY_LAYER.sunLowRim] : [SKY_LAYER.sunSetCore, SKY_LAYER.sunSetRim];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      let colour = null;
      if (d <= R + 0.3) colour = d > R - 0.8 ? rim : core;
      // High up, a ring of light round it in a checkerboard: hard pixels, no soft edge.
      else if (kind === 'high' && d <= R + 2.4 && (x + y) % 2 === 0) colour = SKY_LAYER.sunHalo;
      if (!colour) continue;
      g.fillStyle = colour;
      g.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

/**
 * The moon, 9 px across, lit as its phase says: a waxing moon (phase under
 * 0.5) lit on the right, as seen from the north. By night the dark part shows
 * faintly against the sky; by day only the lit part shows, pale.
 * @param {number} phase  0 new, 0.5 full.
 * @param {boolean} night
 */
export function paintMoon(phase, night) {
  const size = 2 * (R + 3) + 1;
  const c = R + 3;
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
        if (lit) colour = night ? (d > R - 0.8 ? SKY_LAYER.moonEdge : SKY_LAYER.moonLit) : d > R - 0.8 ? SKY_LAYER.moonDayEdge : SKY_LAYER.moonDay;
        else if (night) colour = SKY_LAYER.moonDark;
      } else if (halo && d <= R + 2.4 && (x + y) % 2 === 0) colour = SKY_LAYER.moonHalo;
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
  back.addChild(colourNew, colourOld, stars, moon, sun, clouds);
  moon.visible = sun.visible = colourOld.visible = false;
  const glitter = new Graphics();

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
  const target = { sunAlt: 0, sunOff: 0, moonAlt: 0, moonOff: 0, cover: 1, sunBearing: 0, phase: 0, light: 0, moonUp: false };
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
  }

  /** Works out where the sun and the moon are for the world given. */
  function aim() {
    if (!world) return;
    const s = sunPosition(world.time);
    target.sunAlt = s.altitude;
    target.sunBearing = s.bearing;
    target.sunOff = world.facing === null ? 999 : wrap180(s.bearing - world.facing);
    target.cover = COVER[Math.max(0, Math.min(COVER.length - 1, world.weather.clouds ?? 0))];
    if (typeof world.fullMoonAt === 'number') {
      const m = moonPosition(world.time, world.fullMoonAt);
      target.moonAlt = m.altitude;
      target.moonOff = world.facing === null ? 999 : wrap180(m.bearing - world.facing);
      target.phase = m.phase;
      target.moonUp = m.lit > 0.03;
      target.light = moonlight(world.time, world.fullMoonAt, world.weather.clouds ?? 0);
    } else {
      target.moonUp = false;
      target.light = 0;
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
    painting = next;
    if (!next) return;
    horizon = next.horizon;
    next.waterLayer.addChild(glitter);
    colourKey = '';
    snapNext = true;
  }

  /** @param {number} now @param {number} dt */
  function update(now, dt) {
    if (!world || !painting) return;
    if (starsFor !== horizon) scatterStars();
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
      sun.texture = cached(`sun:${kind}`, () => paintSun(kind));
      sun.position.set(Math.round(sunX) - R - 3, Math.round(sunY) - R - 3);
      sun.alpha = shown.cover;
    }
    // ---------- The moon ----------
    const night = shown.sunAlt < -4;
    const moonX = MIDDLE + (shown.moonOff / (SPAN / 2)) * (W / 2);
    const moonY = horizon - shown.moonAlt * SKY_SCALE;
    moon.visible = facing !== null && target.moonUp && Math.abs(shown.moonOff) <= half && shown.moonAlt > -2 && shown.cover > 0.05;
    if (moon.visible) {
      const step = Math.round(target.phase * PHASE_STEPS) % PHASE_STEPS;
      moon.texture = cached(`moon:${step}:${night}`, () => paintMoon(step / PHASE_STEPS, night));
      moon.position.set(Math.round(moonX) - R - 3, Math.round(moonY) - R - 3);
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
          strength: clamp01((20 - shown.sunAlt) / 20) * shown.cover,
          bright: SKY_LAYER.glitterSun,
          dim: shown.sunAlt < 6 ? SKY_LAYER.glitterWarm : SKY_LAYER.glitterSun,
          narrow: false,
        };
      } else if (moon.visible && night && shown.moonAlt < 30 && clear(moonX, moonY)) {
        source = {
          x: moonX,
          alt: Math.max(0, shown.moonAlt),
          strength: target.light * clamp01((30 - shown.moonAlt) / 12) * 0.8,
          narrow: true,
          bright: SKY_LAYER.glitterMoon,
          dim: SKY_LAYER.glitterMoonDim,
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
     * What 12.5's clouds need to know: the world, the horizon row, where the
     * sun is (its column on the painting, or null, and its height) and the
     * stand-in cloud cover.
     */
    cloudContext() {
      return { world, horizon, width: W, sun: { x: world ? columnOf(world.facing, target.sunBearing) : null, altitude: target.sunAlt } };
    },
    /** What is drawn, for tools/verify.mjs, which can't read a WebGL canvas back. */
    describe() {
      const at = (/** @type {Sprite} */ s) => (s.visible ? `${s.x + Math.floor(s.width / 2)},${s.y + Math.floor(s.height / 2)}` : null);
      return { sun: at(sun), moon: at(moon), stars: stars.visible, glitter: lastDrawn || null, horizon };
    },
  };
}
