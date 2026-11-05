// @ts-check
// Time of day, season and weather on the scene (docs/spec.md, R7.5): tints
// over the whole view, cloud shadows on the water, rain and snow over the
// tints. All drawn as
// code, snapped to whole pixels (R7.3). Purely cosmetic: its randomness comes
// from the scene's `scenery` stream (D4).
//
// The engine moves time on by half an hour a cast; the tints ease towards each
// new value instead of jumping.

import { Graphics } from 'pixi.js';
import { WATER } from '../engine/features.js';
import { darkness, warmth } from './light.js';

/**
 * @typedef {Object} World  What the sky needs to know.
 * @property {number} hour
 * @property {number} minute
 * @property {string} season
 * @property {{ temperature: number, wind: number, clouds: number, precipitation: number }} weather
 */

const NIGHT = 0x0b1a3a;
const WARM = 0xff9a4d;
const OVERCAST = 0x5d6b73;
const SHADOW = 0x1d4a66;
/** A faint cast per season; spring is the palette as drawn. */
const SEASON_TINT = {
  spring: null,
  summer: { color: 0xfff2b0, alpha: 0.05 },
  autumn: { color: 0xd9a85a, alpha: 0.08 },
  winter: { color: 0xdfe8f0, alpha: 0.14 },
};

/**
 * @param {import('pixi.js').Container} below  Where the cloud shadows go: on the water.
 * @param {import('pixi.js').Container} above  Where rain, snow and tints go: over everything.
 * @param {number} size
 * @param {() => number} rand
 */
export function createSky(below, above, size, rand) {
  const shadows = new Graphics();
  below.addChild(shadows);
  const weatherLayer = new Graphics();
  const tint = new Graphics();
  // Rain and snow over the tints: falling flakes catch what light there is.
  above.addChild(tint, weatherLayer);

  /** @type {World | null} */
  let world = null;
  /** Each tint's alpha as shown, easing towards the target. */
  const shown = { night: 0, warm: 0, overcast: 0, season: 0 };

  /** @type {{ x: number, y: number, w: number, h: number }[]} */
  const clouds = [];
  /** @type {{ x: number, y: number, speed: number, sway: number }[]} */
  let drops = [];

  /** @param {World} w */
  function setWorld(w) {
    world = w;
    // One shadow per level of cloud past "a few", up to three.
    const want = Math.max(0, Math.min(3, w.weather.clouds - 1));
    while (clouds.length < want) {
      clouds.push({ x: rand() * size, y: WATER.y0 + rand() * (WATER.y1 - WATER.y0), w: 50 + rand() * 40, h: 10 + rand() * 6 });
    }
    clouds.length = want;
  }

  /** The tints start where they belong, then ease from there. */
  let first = true;

  /**
   * @param {number} now
   * @param {number} dt  Milliseconds since the last frame.
   */
  function update(now, dt) {
    shadows.clear();
    weatherLayer.clear();
    tint.clear();
    if (!world) return;
    const { weather } = world;
    const step = Math.min(dt, 100) / 16.7;

    // ---------- Cloud shadows, carried by the wind ----------
    const drift = (0.03 + weather.wind * 0.05) * step;
    for (const c of clouds) {
      c.x += drift;
      if (c.x - c.w / 2 > size) c.x = -c.w / 2;
      // A flattened blob of rows, narrower at the top and bottom.
      for (let row = 0; row < c.h; row++) {
        const t = (row / (c.h - 1)) * 2 - 1;
        const half = Math.round((c.w / 2) * Math.sqrt(1 - t * t));
        shadows.rect(Math.round(c.x) - half, Math.round(c.y) + row, half * 2, 1).fill({ color: SHADOW, alpha: 0.1 });
      }
    }

    // ---------- Rain and snow ----------
    const snowing = weather.temperature <= 2;
    // Level 1 is only moist air; drops from level 2.
    const want = weather.precipitation >= 2 ? (weather.precipitation - 1) * (snowing ? 50 : 40) : 0;
    while (drops.length < want) drops.push({ x: rand() * size, y: rand() * size, speed: 0.8 + rand() * 0.6, sway: rand() * 6 });
    drops.length = want;
    const slant = weather.wind * (snowing ? 0.25 : 0.4);
    for (const d of drops) {
      if (snowing) {
        d.y += d.speed * 0.6 * step;
        d.x += (slant + Math.sin(now / 700 + d.sway) * 0.2) * step;
      } else {
        d.y += d.speed * 5 * step;
        d.x += slant * step;
      }
      if (d.y > size) {
        d.y -= size;
        d.x = rand() * size;
      }
      if (d.x > size) d.x -= size;
      const x = Math.round(d.x);
      const y = Math.round(d.y);
      if (snowing) weatherLayer.rect(x, y, 1, 1).fill({ color: 0xffffff, alpha: 0.85 });
      else {
        // A short streak, leaning with the wind.
        weatherLayer.rect(x, y, 1, 1).fill({ color: 0xe8f6ff, alpha: 0.7 });
        weatherLayer.rect(x - Math.round(slant), y - 2, 1, 2).fill({ color: 0xe8f6ff, alpha: 0.5 });
      }
    }

    // ---------- Tints: season, overcast, dusk and dawn, night ----------
    const h = world.hour + world.minute / 60;
    const seasonTint = SEASON_TINT[/** @type {keyof typeof SEASON_TINT} */ (world.season)];
    const rate = first ? 1 : Math.min(1, 0.03 * step);
    first = false;
    const ease = (/** @type {keyof typeof shown} */ key, /** @type {number} */ target) => (shown[key] += (target - shown[key]) * rate);
    const season = ease('season', seasonTint?.alpha ?? 0);
    const overcast = ease('overcast', weather.clouds * 0.045 + (weather.precipitation >= 3 ? 0.06 : 0));
    const warm = ease('warm', warmth(h, world.sun));
    const night = ease('night', darkness(h, world.sun));
    if (seasonTint && season > 0.005) tint.rect(0, 0, size, size).fill({ color: seasonTint.color, alpha: season });
    if (overcast > 0.005) tint.rect(0, 0, size, size).fill({ color: OVERCAST, alpha: overcast });
    if (warm > 0.005) tint.rect(0, 0, size, size).fill({ color: WARM, alpha: warm });
    if (night > 0.005) tint.rect(0, 0, size, size).fill({ color: NIGHT, alpha: night });
  }

  return {
    setWorld,
    update,
    /** The wind's level, for the waves. */
    wind: () => world?.weather.wind ?? 0,
  };
}
