// @ts-check
// The swamp's scene (D158): the painting from src/scene/swamp-pixels.js in
// the pond's two layers (src/scene/pond.js), and moving. The water shimmers
// in three slow frames, as still water does; rings spread now and then where
// a fish rose (often, in rain); the two mists drift to and fro; gusts push the
// sedge, the straw and the grass a pixel or two.

import { Container, Sprite, Texture, TextureStyle } from 'pixi.js';
import { paintRing } from './sprites.js';
import { MIST_DRIFT, SWAMP_LAYOUT, SWAMP_SEASONS, SWAMP_W, paintSwampLayers, swampBytes, swampSeason } from './swamp-pixels.js';

export { swampSeason };

/** A painted buffer as a texture. @param {{ w: number, h: number, px: Int32Array }} b */
export function textureOf(b) {
  const canvas = document.createElement('canvas');
  canvas.width = b.w;
  canvas.height = b.h;
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const image = g.createImageData(b.w, b.h);
  image.data.set(swampBytes(b));
  g.putImageData(image, 0, 0);
  return Texture.from(canvas);
}

/**
 * The swamp painted for a season: `back` (the far wood, the water, the mists,
 * and all that stands in the water past the near corners) goes under the
 * bobber and the line, `front` (the big mossy tree, the tussocks and the
 * branch close up) over them.
 * @param {() => number} rand  Uniform [0, 1), the scenery stream.
 * @param {string} [season]  One of the game's seasons.
 * @returns {import('./pond.js').Pond}
 */
export function paintSwamp(rand, season = 'spring') {
  TextureStyle.defaultOptions.scaleMode = 'nearest';
  const key = swampSeason(season);
  const P = SWAMP_SEASONS[key].palette;
  const layers = paintSwampLayers(rand, key);
  const { horizon, water: box } = SWAMP_LAYOUT;

  const back = new Container();
  const waterFrames = layers.water.map(textureOf);
  const water = new Sprite(waterFrames[0]);
  const ripples = new Container();
  const farMist = new Sprite(textureOf(layers.farMist));
  const farFrames = layers.far.map(textureOf);
  const far = new Sprite(farFrames[0]);
  const lowMist = new Sprite(textureOf(layers.lowMist));
  const nearFrames = layers.near.map(textureOf);
  const near = new Sprite(nearFrames[0]);
  // Rings lie on the water, under everything standing in it.
  back.addChild(water, ripples, farMist, far, lowMist, near);

  const front = new Container();
  const frontFrames = layers.front.map(textureOf);
  const close = new Sprite(frontFrames[0]);
  front.addChild(close);

  /** @type {Map<string, Texture>} */
  const ringCache = new Map();
  const ring = (/** @type {number} */ rx, /** @type {number} */ ry) => {
    const k = `${rx}x${ry}`;
    if (!ringCache.has(k)) ringCache.set(k, Texture.from(paintRing(rx, ry, P.mist)));
    return /** @type {Texture} */ (ringCache.get(k));
  };
  /** @type {{ x: number, y: number, born: number, life: number, maxRx: number }[]} */
  let rings = [];
  let nextRing = 0;

  return {
    back,
    front,
    update(now, wind, crop, raining) {
      // Gusts: the same for the whole swamp, which is sheltered; only a stiff wind pushes twice as far.
      const t = now * 0.0009 * (1 + wind * 0.5);
      const g = Math.sin(t) + 0.6 * Math.sin(t * 0.43 + 1.7);
      const sway = Math.min(g > 0.9 ? 2 : g > -0.1 ? 1 : 0, wind >= 2 ? 2 : 1);
      far.texture = farFrames[sway];
      near.texture = nearFrames[sway];
      close.texture = frontFrames[sway];
      water.texture = waterFrames[Math.floor(now / 1100) % 3];
      // The mists drift slowly to and fro, the near one a little faster, further in wind.
      const reach = MIST_DRIFT * (0.6 + Math.min(wind, 2) * 0.2);
      farMist.x = Math.round(-MIST_DRIFT + Math.sin(now / 14000) * reach);
      lowMist.x = Math.round(-MIST_DRIFT + Math.sin(now / 9000 + 2) * reach);
      // A ring now and then where a fish rose, over the open water; rain all over it.
      if (now >= nextRing) {
        const x0 = Math.max(box.x0 - 24, crop + 8);
        const x1 = Math.min(box.x1 + 24, SWAMP_W - crop - 8);
        const x = x0 + Math.floor(rand() * Math.max(1, x1 - x0));
        const y = horizon + 14 + Math.floor(rand() * (box.y1 + 30 - horizon - 14));
        rings.push({ x, y, born: now, life: 1100, maxRx: y - horizon < 45 ? 4 : 7 });
        nextRing = now + (raining ? 90 + rand() * 120 : 1800 + rand() * 3000);
      }
      rings = rings.filter((r) => now - r.born < r.life);
      ripples.removeChildren();
      for (const r of rings) {
        const age = (now - r.born) / r.life;
        const rx = Math.max(1, Math.round(r.maxRx * age));
        const ry = Math.max(1, Math.round(rx * (r.y - horizon < 45 ? 0.3 : 0.42)));
        const sprite = new Sprite(ring(rx, ry));
        sprite.position.set(r.x - rx, r.y - ry);
        sprite.alpha = age < 0.6 ? 1 : 0.5;
        ripples.addChild(sprite);
      }
    },
  };
}
