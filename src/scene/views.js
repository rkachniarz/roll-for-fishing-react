// @ts-check
// Views that take the scene's place (R17.1, R17.5, R20.3): the town, its
// places drawn as squares and triangles (a placeholder until CR-5); the
// player's room with the aquarium; and under the water, for the Fighter's
// dive. Each covers the whole width, under the dice. Placeholder art (D105).

import { Container, Graphics } from 'pixi.js';
import { createShoal } from './swim.js';

/**
 * @typedef {{ id: string, x: number, w: number, h: number, colour: string, roof: string }} Building
 * @typedef {{ kind: 'town', buildings: Building[], here: string | null, night?: boolean }
 *   | { kind: 'room', tank: { key: string, species: string }[] | null }
 *   | { kind: 'dive', fish: { key: string, species: string }[] }} View
 */

/** The scene's height and the play area's width (scene.js). */
const SIZE = 256;
/** The aquarium's tank in the room, in the play area's pixels. */
export const TANK = { x0: 140, y0: 120, x1: 236, y1: 186 };
/** Where fish swim in the dive. */
export const DEEP = { x0: 20, y0: 40, x1: 236, y1: 210 };
/** The town's ground line. */
const GROUND = 180;

/**
 * A colour at half its brightness, for the town at night.
 * @param {string} hex
 */
function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const half = (/** @type {number} */ v) => Math.round(v * 0.45);
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => half(v).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * @param {Container} parent
 * @param {() => number} rand  Cosmetic only.
 */
export function createViews(parent, rand) {
  const root = new Container();
  root.visible = false;
  parent.addChild(root);
  const back = new Graphics();
  root.addChild(back);
  const play = new Container();
  root.addChild(play);
  const shoal = createShoal(play, rand);
  const front = new Graphics();
  play.addChild(front);
  /** @type {View | null} */
  let view = null;
  let key = '';
  let width = SIZE;
  let offset = 0;
  /** @type {{ x: number, y: number, speed: number }[]} */
  let bubbles = [];
  const bubbleLayer = new Graphics();
  play.addChild(bubbleLayer);

  function paint() {
    back.clear();
    front.clear();
    play.x = offset;
    if (!view) return;
    if (view.kind === 'town') {
      // Sky, hills, the street; darker at night, with the windows lit.
      const night = Boolean(view.night);
      back.rect(0, 0, width, SIZE).fill(night ? '#1d2a44' : '#9cc7d9');
      if (night) for (let i = 0; i < 30; i++) back.rect(Math.floor(rand() * width), Math.floor(rand() * 110), 1, 1).fill('#e8ecf4');
      back.rect(0, 120, width, 60).fill(night ? '#2c3b30' : '#6f8f5a');
      back.rect(0, GROUND, width, SIZE - GROUND).fill(night ? '#4a3f33' : '#a08560');
      back.rect(0, GROUND + 18, width, 6).fill(night ? '#3e352b' : '#8a7050');
      for (const b of view.buildings) {
        const x = offset + b.x;
        const top = GROUND - b.h;
        back.rect(x, top, b.w, b.h).fill(night ? shade(b.colour) : b.colour);
        back.poly([x - 6, top, x + b.w + 6, top, x + b.w / 2, top - Math.round(b.w * 0.45)]).fill(night ? shade(b.roof) : b.roof);
        // A door and two windows.
        back.rect(x + Math.round(b.w / 2) - 5, GROUND - 18, 10, 18).fill('#4a3020');
        back.rect(x + 6, top + 10, 8, 8).fill(night ? '#ffd76a' : '#f4dc8a');
        back.rect(x + b.w - 14, top + 10, 8, 8).fill(night ? '#ffd76a' : '#f4dc8a');
        // Where the player is: a lantern lit by the door.
        if (view.here === b.id) back.rect(x + Math.round(b.w / 2) + 7, GROUND - 22, 3, 5).fill('#ffcf4a');
      }
    } else if (view.kind === 'room') {
      back.rect(0, 0, width, SIZE).fill('#6b4a33');
      back.rect(0, 190, width, SIZE - 190).fill('#4e3424');
      for (let x = 0; x < width; x += 24) back.rect(x, 0, 2, 190).fill('#5d3f2b');
      // The window over the lake, the bed.
      back.rect(offset + 24, 40, 60, 44).fill('#9cc7d9');
      back.rect(offset + 24, 62, 60, 2).fill('#5d3f2b');
      back.rect(offset + 53, 40, 2, 44).fill('#5d3f2b');
      back.rect(offset + 16, 150, 90, 40).fill('#8a3b3b');
      back.rect(offset + 16, 146, 26, 14).fill('#e8e0d0');
      if (view.tank) {
        // The tank: a stand, the water, the glass's edge, weed and gravel.
        back.rect(offset + TANK.x0 - 6, TANK.y1 + 4, TANK.x1 - TANK.x0 + 12, 30).fill('#3a2618');
        back.rect(offset + TANK.x0 - 4, TANK.y0 - 6, TANK.x1 - TANK.x0 + 8, TANK.y1 - TANK.y0 + 12).fill('#c9d6d6');
        back.rect(offset + TANK.x0 - 2, TANK.y0 - 4, TANK.x1 - TANK.x0 + 4, TANK.y1 - TANK.y0 + 8).fill('#2f7d8c');
        back.rect(offset + TANK.x0 - 2, TANK.y1, TANK.x1 - TANK.x0 + 4, 4).fill('#b8a070');
        for (let x = TANK.x0 + 6; x < TANK.x1; x += 22) front.rect(x, TANK.y1 - 18, 2, 18).fill('#3f8f3f');
      }
    } else {
      // Under the water: deep teal fading to dark, light from above, weed.
      const bands = ['#2f8f9f', '#28808f', '#22717f', '#1c626f', '#16535f', '#11444f', '#0c3640'];
      bands.forEach((c, i) => back.rect(0, (i * SIZE) / bands.length, width, SIZE / bands.length + 1).fill(c));
      for (let i = 0; i < 5; i++) {
        const x = offset + 20 + i * 52;
        back.poly([x, 0, x + 14, 0, x + 34, 200, x + 24, 200]).fill({ color: '#bfeff0', alpha: 0.07 });
      }
      back.rect(0, 228, width, SIZE - 228).fill('#3a3a2a');
      for (let x = 8; x < 250; x += 17) front.rect(x, 200 + ((x * 7) % 20), 2, 40).fill('#2f6f3a');
      bubbles = Array.from({ length: 10 }, () => ({ x: 10 + rand() * 236, y: 40 + rand() * 200, speed: 10 + rand() * 20 }));
    }
  }

  return {
    /**
     * What the scene shows instead of the water, or null for the water.
     * @param {View | null} next
     */
    set(next) {
      const k = JSON.stringify(next && { ...next, ...(next.kind !== 'town' ? { fish: undefined, tank: Boolean(/** @type {any} */ (next).tank) } : {}) });
      view = next;
      root.visible = Boolean(view);
      if (k !== key) {
        key = k;
        paint();
      }
      if (view?.kind === 'room' && view.tank) shoal.set(view.tank, TANK);
      else if (view?.kind === 'dive') shoal.set(view.fish, DEEP);
      else shoal.set([], DEEP);
    },
    /** @param {number} w @param {number} o */
    setSize(w, o) {
      width = w;
      offset = o;
      paint();
    },
    /** @param {number} now */
    update(now) {
      if (!view) return;
      shoal.update(now);
      bubbleLayer.clear();
      if (view.kind === 'dive' || (view.kind === 'room' && view.tank)) {
        if (!bubbles.length) bubbles = Array.from({ length: 6 }, () => ({ x: TANK.x0 + rand() * (TANK.x1 - TANK.x0), y: TANK.y1, speed: 8 + rand() * 8 }));
        const top = view.kind === 'dive' ? 0 : TANK.y0;
        for (const b of bubbles) {
          b.y -= b.speed / 60;
          if (b.y < top) b.y = view.kind === 'dive' ? 230 : TANK.y1;
          bubbleLayer.rect(Math.round(b.x), Math.round(b.y), 1, 1).fill({ color: '#e8fbff', alpha: 0.7 });
        }
      }
    },
    /**
     * What's at a point in the play area: a building, or a fish in the dive.
     * @param {{ x: number, y: number }} p
     * @returns {{ kind: 'building', id: string } | { kind: 'fish', index: number } | null}
     */
    hit(p) {
      if (!view) return null;
      if (view.kind === 'town') {
        for (const b of view.buildings) {
          if (p.x >= b.x - 6 && p.x <= b.x + b.w + 6 && p.y >= GROUND - b.h - b.w * 0.45 && p.y <= GROUND) return { kind: 'building', id: b.id };
        }
        return null;
      }
      if (view.kind === 'dive') {
        const i = shoal.hit(p);
        return i >= 0 ? { kind: 'fish', index: i } : null;
      }
      return null;
    },
    /** @param {number} i  Where a swimming fish is now. */
    fishAt: (/** @type {number} */ i) => shoal.at(i),
    active: () => Boolean(view),
  };
}
