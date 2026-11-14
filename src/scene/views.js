// @ts-check
// Views that take the scene's place (R17.1, R17.5, R20.3): the town, its
// places drawn as squares and triangles (a placeholder until CR-5); the
// player's room with the aquarium; and under the water, for the Fighter's
// dive; and the title screen's water, after the art sheet's tank. Each covers
// the whole width, under the dice. Placeholder art (D105), all but the title's.

import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { createShoal } from './swim.js';
import { paintShaft, paintWater, sandTop } from './deep.js';
import { iconName, paintIcon } from './icons.js';
import { createDice } from './dice.js';
import { paintLogo } from './logo.js';

/**
 * @typedef {{ id: string, x: number, w: number, h: number, colour: string, roof: string }} Building
 * @typedef {{ kind: 'town', buildings: Building[], here: string | null, night?: boolean }
 *   | { kind: 'room', tank: { key: string, species: string }[] | null }
 *   | { kind: 'dive', fish: { key: string, species: string }[] }
 *   | { kind: 'title', fish: { key: string, species: string }[] }} View
 */

/** The scene's height and the play area's width (scene.js). */
const SIZE = 256;
/** The aquarium's tank in the room, in the play area's pixels. */
export const TANK = { x0: 140, y0: 120, x1: 236, y1: 186 };
/** Where fish swim in the dive. */
export const DEEP = { x0: 20, y0: 40, x1: 236, y1: 210 };
/** The town's ground line. */
const GROUND = 180;
/** The title's lake bottom, going away from the eye: deep enough to plant weed at varied depths. */
const SAND = 44;
/** The title's die in place of ROLL's O, pixels across (src/scene/dice.js draws it). */
const LOGO_DIE = 37;
/** The water's colour that hazes far plants (a band of src/scene/deep.js). */
const HAZE = [0x16, 0x53, 0x5f];
/** Where fish swim on the title screen: under the surface, down among the weed. */
const TITLE_WATER = { x0: 12, y0: 24, x1: 244, y1: 224 };
/** The plants that can be found in the water (content/items), growing on the title's sand. */
const PLANTS = ['canadian-waterweed', 'hornwort', 'quillwort', 'water-lobelia', 'marimo', 'floating-water-plantain', 'lace-plant', 'waterwheel-plant'];

/**
 * A plant's two frames, swaying: its icon, and its icon with the top half a
 * pixel over. Scene sprites have no outline, so the icon's (`k`) becomes the
 * deep water's darkest band. `foot`: its lowest row, to plant in the sand.
 * Far ones are hazed towards the water by `haze` (0 to 1): depth by paleness,
 * since sprites are never scaled (R7.3).
 * @param {string} id
 * @param {number} haze
 */
function plantFrames(id, haze) {
  const icon = paintIcon(iconName({ kind: 'item', id }));
  const w = icon.width;
  const h = icon.height;
  const data = /** @type {CanvasRenderingContext2D} */ (icon.getContext('2d')).getImageData(0, 0, w, h);
  let foot = 0;
  for (let i = 0; i < data.data.length; i += 4) {
    if (data.data[i + 3] < 128) continue;
    foot = Math.max(foot, Math.floor(i / 4 / w));
    if (data.data[i] === 0x1b && data.data[i + 1] === 0x2b && data.data[i + 2] === 0x34) {
      data.data[i] = 0x11;
      data.data[i + 1] = 0x44;
      data.data[i + 2] = 0x4f;
    }
    for (let c = 0; c < 3; c++) data.data[i + c] = Math.round(data.data[i + c] + (HAZE[c] - data.data[i + c]) * haze);
  }
  const half = Math.floor(h / 2);
  const frames = [0, 1].map((shift) => {
    const c = document.createElement('canvas');
    c.width = w + 1;
    c.height = h;
    const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    ctx.putImageData(data, 0, 0);
    if (shift) {
      const top = ctx.getImageData(0, 0, w, half);
      ctx.clearRect(0, 0, w + 1, half);
      ctx.putImageData(top, 1, 0);
    }
    return Texture.from(c);
  });
  return { frames, foot };
}

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
  // The title's water, its shafts of light and its weed, behind the fish.
  const title = new Container();
  root.addChild(title);
  /** @type {{ sprite: Sprite, frames: Texture[], next: number, x: number, phase: number, drift: number }[]} */
  let shafts = [];
  /** @type {{ sprite: Sprite, frames: Texture[], next: number }[]} */
  let weed = [];
  // The game's name over the water, and the d20 that rolls into its O,
  // behind the fish (D134).
  const logo = new Container();
  root.addChild(logo);
  const logoDie = createDice((s) => root.addChild(s), rand);
  /** The die has rolled since the title opened: a resize puts it straight back. */
  let logoRolled = false;
  /** Which painting a logo still on its way (it waits for the font) belongs to. */
  let logoFor = 0;
  const play = new Container();
  root.addChild(play);
  // The title's nearest weed, in front of the fish.
  const titleFront = new Container();
  root.addChild(titleFront);
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
    for (const layer of [title, titleFront, logo]) {
      for (const child of layer.removeChildren()) child.destroy({ texture: true, textureSource: true });
    }
    shafts = [];
    weed = [];
    play.x = offset;
    logoFor++;
    if (view?.kind !== 'title') {
      logoDie.clear();
      logoRolled = false;
    }
    if (!view) return;
    if (view.kind === 'title') {
      paintTitle();
      return;
    }
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

  /**
   * The title's water across the whole width: the bands and sand; a shaft of
   * light every fifty pixels or so, with three frames of its dither to flicker
   * between; and plants that can be found, planted at varied depths on the
   * lake bottom, the far ones hazed, the near ones in front of the fish.
   */
  function paintTitle() {
    title.addChild(new Sprite(Texture.from(paintWater(width, SIZE, SAND, rand, true))));
    const len = SIZE - SAND - 2;
    const count = Math.max(3, Math.round(width / 50));
    for (let i = 0; i < count; i++) {
      const wide = 6 + Math.floor(rand() * 5);
      const strength = 0.7 + rand() * 0.3;
      const frames = /** @type {const} */ ([0, 1, 0]).map((parity) => Texture.from(paintShaft(len, wide, rand, parity, strength)));
      const sprite = new Sprite(frames[0]);
      const x = Math.round((i * width) / count - 24 + rand() * 24);
      sprite.position.set(x, 0);
      title.addChild(sprite);
      shafts.push({ sprite, frames, next: 0, x, phase: rand() * 6, drift: 4000 + rand() * 4000 });
    }
    // A plant every twenty pixels or so across, each at its own depth: its
    // foot further up the bottom the further away, drawn far to near. The
    // nearest third stand in front of the fish.
    const top = SIZE - SAND;
    /** @type {{ x: number, depth: number, id: string }[]} */
    const planted = [];
    for (let x = Math.floor(rand() * 10) - 8; x < width - 8; x += 12 + Math.floor(rand() * 16)) {
      planted.push({ x, depth: rand(), id: PLANTS[Math.floor(rand() * PLANTS.length)] });
    }
    planted.sort((a, b) => a.depth - b.depth);
    for (const p of planted) {
      const { frames, foot } = plantFrames(p.id, p.depth < 1 / 3 ? 0.45 : p.depth < 2 / 3 ? 0.2 : 0);
      const sprite = new Sprite(frames[0]);
      const ground = Math.max(sandTop(p.x + 16, SIZE, SAND) + 2, top + 3 + Math.round(p.depth * (SAND - 8)));
      sprite.position.set(p.x, ground - foot);
      (p.depth < 2 / 3 ? title : titleFront).addChild(sprite);
      weed.push({ sprite, frames, next: rand() * 1400 });
    }
    bubbles = Array.from({ length: 8 }, () => ({ x: 10 + rand() * 236, y: rand() * SIZE, speed: 6 + rand() * 10 }));
    // The name, in the middle of the water once its font is in; the die
    // rolls in from below and lands on 20 in the O.
    const mine = logoFor;
    paintLogo(LOGO_DIE).then(({ canvas, dieAt }) => {
      if (mine !== logoFor) return;
      const x = Math.round((width - canvas.width) / 2);
      const y = Math.round((SIZE - SAND - canvas.height) / 2);
      const sprite = new Sprite(Texture.from(canvas));
      sprite.position.set(x, y);
      logo.addChild(sprite);
      const now = performance.now();
      logoDie.roll([{ value: 20, kept: true, gold: true }], { x: x + dieAt.x, y: y + dieAt.y }, logoRolled ? now - 1e5 : now, undefined, { stay: true });
      logoRolled = true;
    });
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
      else if (view?.kind === 'title') shoal.set(view.fish, TITLE_WATER);
      else shoal.set([], DEEP);
    },
    /** @param {number} w @param {number} o */
    setSize(w, o) {
      width = w;
      offset = o;
      logoDie.setSize(w, SIZE);
      paint();
    },
    /** @param {number} now */
    update(now) {
      if (!view) return;
      shoal.update(now);
      bubbleLayer.clear();
      if (view.kind === 'title') {
        logoDie.update(now);
        // The light flickers as the surface moves over it and drifts a pixel
        // or two; the weed sways a pixel now and then, each to its own time.
        for (const s of shafts) {
          if (now >= s.next) {
            s.sprite.texture = s.frames[Math.floor(rand() * s.frames.length)];
            s.next = now + 250 + rand() * 650;
          }
          s.sprite.x = s.x + Math.round(Math.sin(now / s.drift + s.phase) * 2);
        }
        for (const w of weed) {
          if (now >= w.next) {
            w.sprite.texture = w.sprite.texture === w.frames[0] ? w.frames[1] : w.frames[0];
            w.next = now + 600 + rand() * 900;
          }
        }
      }
      if (view.kind === 'dive' || view.kind === 'title' || (view.kind === 'room' && view.tank)) {
        if (!bubbles.length) bubbles = Array.from({ length: 6 }, () => ({ x: TANK.x0 + rand() * (TANK.x1 - TANK.x0), y: TANK.y1, speed: 8 + rand() * 8 }));
        const top = view.kind === 'room' ? TANK.y0 : 0;
        for (const b of bubbles) {
          b.y -= b.speed / 60;
          if (b.y < top) b.y = view.kind === 'dive' ? 230 : view.kind === 'title' ? SIZE - SAND : TANK.y1;
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
