// @ts-check
// Rings on the water: where a fish rose, where rain fell, where the bobber
// landed. One texture per size of ring, painted once, and one sprite per ring
// on show, kept from frame to frame and reused. A sprite made anew every frame
// costs more than it looks: Pixi tracks every sprite it has drawn until it has
// sat unused for a while, so thousands pile up a minute.

import { Container, Sprite, Texture } from 'pixi.js';
import { paintRing } from './sprites.js';

/**
 * A layer of rings in one colour.
 * @param {string} colour
 */
export function createRings(colour) {
  const layer = new Container();
  /** @type {Map<string, Texture>} */
  const cache = new Map();
  /** @param {number} rx @param {number} ry */
  function texture(rx, ry) {
    const key = `${rx}x${ry}`;
    let t = cache.get(key);
    if (!t) cache.set(key, (t = Texture.from(paintRing(rx, ry, colour))));
    return t;
  }
  return {
    layer,
    /**
     * The rings to show this frame, each by its top-left corner, in whole pixels, and its radii.
     * @param {{ x: number, y: number, rx: number, ry: number, alpha: number }[]} list
     */
    show(list) {
      const sprites = /** @type {Sprite[]} */ (layer.children);
      list.forEach((r, i) => {
        const s = sprites[i] ?? layer.addChild(new Sprite());
        s.texture = texture(r.rx, r.ry);
        s.position.set(r.x, r.y);
        s.alpha = r.alpha;
        s.visible = true;
      });
      for (let i = list.length; i < sprites.length; i++) sprites[i].visible = false;
    },
    /** Frees the sprites and every ring's texture. */
    destroy() {
      layer.destroy({ children: true });
      for (const t of cache.values()) t.destroy(true);
      cache.clear();
    },
  };
}
