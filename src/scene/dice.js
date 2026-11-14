// @ts-check
// Dice rolled over the scene, as if the scene were a picture on a desk and the
// player threw a d20 across it (D99). Only looks: the engine rolled the die
// when the line went out (D63), and the die comes to rest on that number.
//
// Each frame while dice are out, the dice are drawn pixel by pixel into one
// canvas the size of the scene: faces filled with hard edges, shaded in four
// steps by a light from the top left, numbers in a 3×5 pixel font. A drawn
// die is never scaled (R7.3); it's drawn again, turned a little further.
// The shadow is a checkerboard, and the dice go in an ordered dither.

import { Sprite, Texture } from 'pixi.js';
import { FACES, NUMBERS, NORMALS, VERTS, apply, multiply, restPose, rotation } from './d20.js';

/** The die's corners lie on a circle this many pixels across, less one. */
const RADIUS = 17;
/** From the throw to rest. */
export const ROLL_MS = 700;
/** At rest, the number showing. */
export const HOLD_MS = 550;
/** Dithering away. */
export const FADE_MS = 200;

/** Colours, light to dark faces, then the outline and the numbers' ink. */
export const DICE_COLOURS = {
  light: '#fbf1d3',
  mid: '#e3cfa0',
  shade: '#c2a46e',
  dark: '#8f7146',
  outline: '#2a1a10',
  ink: '#2a1a10',
  /** A natural 20's number. */
  crit: '#c4241b',
  /** The title's die (D134): its 20 in the logo's gold, outlined so it reads on the pale face. */
  gold: '#ffd36b',
  /** The fish's dice (6.8): its own colour, a deep-water teal, with pale numbers. */
  fishLight: '#5fb3c4',
  fishMid: '#31899f',
  fishShade: '#256d80',
  fishDark: '#1a4f5e',
  fishInk: '#eef7f4',
  /** A die that didn't count (advantage, disadvantage): greyed once it lands. */
  dimLight: '#c9c4ba',
  dimMid: '#aca69b',
  dimShade: '#8c867c',
  dimDark: '#6a655d',
  dimInk: '#3b3732',
  shadow: '#140d08',
};

/** @param {string} hex @returns {[number, number, number]} */
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// 3×5 digits, a row a string.
const DIGITS = [
  ['###', '#.#', '#.#', '#.#', '###'],
  ['.#.', '##.', '.#.', '.#.', '###'],
  ['###', '..#', '###', '#..', '###'],
  ['###', '..#', '.##', '..#', '###'],
  ['#.#', '#.#', '###', '..#', '..#'],
  ['###', '#..', '###', '..#', '###'],
  ['###', '#..', '###', '#.#', '###'],
  ['###', '..#', '.#.', '.#.', '.#.'],
  ['###', '#.#', '###', '#.#', '###'],
  ['###', '#.#', '###', '..#', '###'],
];

/** 4×4 ordered dither thresholds, 0-15. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** The light, from the top left and in front. */
const LIGHT = (() => {
  const l = [-0.5, 0.6, 0.8];
  const n = Math.hypot(...l);
  return l.map((v) => v / n);
})();

/**
 * @typedef {Object} DieThrow
 * @property {number} value   The number it lands on.
 * @property {boolean} kept   False for a die that didn't count.
 * @property {boolean} crit   Its number in red: a natural 20.
 * @property {boolean} fish   The fish's die (6.8): teal, thrown from the top right.
 * @property {boolean} gold   The title's die (D134): its number in gold, outlined.
 * @property {{ x: number, y: number }} from  Where it comes in, in the scene's pixels.
 * @property {{ x: number, y: number }} to    Where it stops.
 * @property {number} start   When it's thrown.
 * @property {number} rollMs  How long it rolls.
 * @property {import('./d20.js').Vec} axis  What it rolls about.
 * @property {number} turns   How far it rolls, in radians.
 * @property {number} spin    How far it twists about the upright, in radians.
 * @property {import('./d20.js').Mat} rest
 */

/**
 * The dice layer. `addTo` takes its sprite; call `update(now)` every frame.
 * @param {(sprite: Sprite) => void} addTo
 * @param {() => number} rand  Cosmetic only (D4): the scenery stream.
 */
export function createDice(addTo, rand) {
  let width = 256;
  let height = 256;
  let canvas = Object.assign(document.createElement('canvas'), { width, height });
  let ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  let image = ctx.createImageData(width, height);
  let texture = Texture.from(canvas);
  const sprite = new Sprite(texture);
  sprite.visible = false;
  addTo(sprite);

  /** @type {DieThrow[]} */
  let dice = [];
  let goneAt = -Infinity;
  let settledAt = -Infinity;
  /** Dice that stay (the title's) are drawn once more after they settle, then left. */
  let drawnStill = false;

  /** @param {number} w @param {number} h */
  function setSize(w, h) {
    if (w === width && h === height) return;
    width = w;
    height = h;
    canvas = Object.assign(document.createElement('canvas'), { width: w, height: h });
    ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    image = ctx.createImageData(w, h);
    const old = texture;
    texture = Texture.from(canvas);
    sprite.texture = texture;
    old.destroy(true);
    drawnStill = false;
  }
  /**
   * Throws dice that come to rest side by side: the player's around `at`, the
   * fish's (6.8) around `fishAt`, from the other side of the desk.
   * @param {{ value: number, kept: boolean, crit?: boolean, fish?: boolean, gold?: boolean }[]} values
   * @param {{ x: number, y: number }} at  Where the player's gather, in the layer's pixels.
   * @param {number} now
   * @param {{ x: number, y: number }} [fishAt]  Where the fish's gather.
   * @param {{ stay?: boolean }} [options]  `stay`: the dice stay where they land (the title's, D134).
   * @returns {{ settled: number, gone: number, points: { x: number, y: number }[] }}  In the order given.
   */
  function roll(values, at, now, fishAt = at, { stay = false } = {}) {
    const gap = RADIUS * 2 + 6;
    // The player's thrown from below, from their side of the desk, a little from
    // the right; the fish's from the top right, from across the desk.
    const fromBelow = { x: at.x + 50 + rand() * 50, y: height + RADIUS + 10 + rand() * 20 };
    const fromAbove = { x: fishAt.x + 50 + rand() * 50, y: -RADIUS - 10 - rand() * 20 };
    dice = values.map((v, n) => {
      const group = values.filter((w) => Boolean(w.fish) === Boolean(v.fish));
      const i = group.indexOf(v);
      const centre = v.fish ? fishAt : at;
      const from = v.fish ? fromAbove : fromBelow;
      const to = { x: Math.round(centre.x + (i - (group.length - 1) / 2) * gap + (rand() - 0.5) * 6), y: Math.round(centre.y + (rand() - 0.5) * 8) };
      const start = now + n * 40;
      const f = { x: from.x + (i - (group.length - 1) / 2) * gap * 0.6, y: from.y + (v.fish ? -i : i) * 6 };
      const dx = to.x - f.x, dy = to.y - f.y;
      const distance = Math.hypot(dx, dy);
      return {
        value: v.value,
        kept: v.kept,
        crit: v.crit ?? false,
        fish: v.fish ?? false,
        gold: v.gold ?? false,
        from: f,
        to,
        start,
        rollMs: ROLL_MS - n * 40 + Math.round((rand() - 0.5) * 80),
        // Rolling across a desk seen from above: about the line on the desk at
        // right angles to the way it goes (the die's y is up, the page's down).
        axis: /** @type {import('./d20.js').Vec} */ ([dy / distance, dx / distance, (rand() - 0.5) * 0.6]),
        turns: distance / RADIUS + 2 + rand() * 2,
        spin: (rand() - 0.5) * 3,
        rest: restPose(v.value),
      };
    });
    settledAt = Math.max(...dice.map((d) => d.start + d.rollMs));
    goneAt = stay ? Infinity : settledAt + HOLD_MS + FADE_MS;
    drawnStill = false;
    return { settled: settledAt, gone: goneAt, points: dice.map((d) => d.to) };
  }

  /** Takes the dice away at once. */
  function clear() {
    dice = [];
    goneAt = -Infinity;
    sprite.visible = false;
  }

  /** @param {number} now */
  function update(now) {
    if (!dice.length) return;
    if (now >= goneAt) {
      clear();
      return;
    }
    sprite.visible = true;
    if (now >= settledAt && goneAt === Infinity) {
      if (drawnStill) return;
      drawnStill = true;
    }
    const px = image.data;
    px.fill(0);
    const fade = now <= goneAt - FADE_MS ? 0 : (now - (goneAt - FADE_MS)) / FADE_MS;
    const shown = (/** @type {number} */ x, /** @type {number} */ y) => fade === 0 || BAYER[(y & 3) * 4 + (x & 3)] >= fade * 16;
    /** @param {number} x @param {number} y @param {[number, number, number]} c */
    const put = (x, y, c) => {
      if (x < 0 || y < 0 || x >= width || y >= height || !shown(x, y)) return;
      const o = (y * width + x) * 4;
      px[o] = c[0];
      px[o + 1] = c[1];
      px[o + 2] = c[2];
      px[o + 3] = 255;
    };

    const poses = dice.map((d) => pose(d, now)).filter((p) => p !== null);
    // Shadows first, all of them, so no die's shadow falls on another die.
    const shadow = rgb(DICE_COLOURS.shadow);
    for (const p of poses) {
      const sx = p.x + 2, sy = p.y + 3;
      const r = RADIUS - 2 - Math.min(4, Math.round(p.h / 8));
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        if (x * x + y * y * 1.2 > r * r || ((sx + x + sy + y) & 1)) continue;
        put(sx + x, sy + y, shadow);
      }
    }
    for (const p of poses.sort((a, b) => a.y - b.y)) drawDie(p, put, now >= settledAt);
    ctx.putImageData(image, 0, 0);
    texture.source.update();
  }

  /**
   * Where a die is and how it's turned at `now`; null before it's thrown.
   * @param {DieThrow} d @param {number} now
   */
  function pose(d, now) {
    if (now < d.start) return null;
    const t = Math.min(1, (now - d.start) / d.rollMs);
    // Slowing to a stop.
    const s = 1 - (1 - t) ** 2.4;
    const left = 1 - s;
    // Bounces: one high, two low.
    const hop = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ top) => (t > a && t < b ? 4 * top * ((t - a) / (b - a)) * (1 - (t - a) / (b - a)) : 0);
    const h = hop(0, 0.38, 22) + hop(0.38, 0.62, 7) + hop(0.62, 0.76, 2);
    const turn = multiply(rotation([0, 0, 1], d.spin * left), multiply(rotation(d.axis, -d.turns * left), d.rest));
    return {
      x: Math.round(d.from.x + (d.to.x - d.from.x) * s),
      y: Math.round(d.from.y + (d.to.y - d.from.y) * s),
      h: Math.round(h),
      turn,
      die: d,
    };
  }

  /**
   * @param {{ x: number, y: number, h: number, turn: import('./d20.js').Mat, die: DieThrow }} p
   * @param {(x: number, y: number, c: [number, number, number]) => void} put
   * @param {boolean} landed  Every die is still: grey out the ones that didn't count.
   */
  function drawDie(p, put, landed) {
    const dim = landed && !p.die.kept;
    const C = DICE_COLOURS;
    const fish = p.die.fish;
    const steps = (
      dim ? [C.dimLight, C.dimMid, C.dimShade, C.dimDark] : fish ? [C.fishLight, C.fishMid, C.fishShade, C.fishDark] : [C.light, C.mid, C.shade, C.dark]
    ).map(rgb);
    const outline = rgb(C.outline);
    const ink = rgb(dim ? C.dimInk : p.die.crit && landed ? C.crit : p.die.gold ? C.gold : fish ? C.fishInk : C.ink);
    const cx = p.x, cy = p.y - p.h;

    // The faces that face the viewer, as triangles on the page.
    const corners = VERTS.map((v) => apply(p.turn, v));
    /** @type {{ face: number, pts: number[][], step: number, z: number }[]} */
    const front = [];
    FACES.forEach((f, i) => {
      const n = apply(p.turn, NORMALS[i]);
      if (n[2] <= 0) return;
      const light = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
      const step = light >= 0.62 ? 0 : light >= 0.32 ? 1 : light >= 0.02 ? 2 : 3;
      front.push({ face: i, pts: f.map((v) => [corners[v][0] * RADIUS, corners[v][1] * RADIUS]), step, z: n[2] });
    });

    // Which face each pixel shows, -1 for none.
    const span = RADIUS + 2;
    const side = span * 2 + 1;
    const cell = new Int8Array(side * side).fill(-1);
    for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
      // The pixel's middle, in the die's terms: x right, y up.
      const u = x - span + 0.5, v = span - y - 0.5;
      for (let k = 0; k < front.length; k++) {
        const [a, b, c] = front[k].pts;
        const e1 = (b[0] - a[0]) * (v - a[1]) - (b[1] - a[1]) * (u - a[0]);
        const e2 = (c[0] - b[0]) * (v - b[1]) - (c[1] - b[1]) * (u - b[0]);
        const e3 = (a[0] - c[0]) * (v - c[1]) - (a[1] - c[1]) * (u - c[0]);
        if (e1 >= 0 && e2 >= 0 && e3 >= 0) {
          cell[y * side + x] = k;
          break;
        }
      }
    }
    const at = (/** @type {number} */ x, /** @type {number} */ y) => (x < 0 || y < 0 || x >= side || y >= side ? -1 : cell[y * side + x]);
    for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
      const k = at(x, y);
      const gx = cx + x - span, gy = cy + y - span;
      if (k < 0) {
        if (at(x + 1, y) >= 0 || at(x - 1, y) >= 0 || at(x, y + 1) >= 0 || at(x, y - 1) >= 0) put(gx, gy, outline);
        continue;
      }
      // An edge between two faces is a step darker on the darker side.
      const right = at(x + 1, y), below = at(x, y + 1);
      const edge = (right >= 0 && right !== k && front[right].step <= front[k].step) || (below >= 0 && below !== k && front[below].step <= front[k].step);
      put(gx, gy, steps[Math.min(3, front[k].step + (edge ? 1 : 0))]);
    }
    // Numbers on the faces turned nearly to the viewer, upright on the page.
    for (const f of front) {
      if (f.z < 0.8) continue;
      const mx = (f.pts[0][0] + f.pts[1][0] + f.pts[2][0]) / 3;
      const my = (f.pts[0][1] + f.pts[1][1] + f.pts[2][1]) / 3;
      const text = String(NUMBERS[f.face]);
      const w = text.length * 4 - 1;
      const left = Math.round(cx + mx - w / 2);
      const top = Math.round(cy - my - 2.5);
      // A gold number is outlined first, all round, so it reads on the pale face.
      const lit = (/** @type {number} */ x, /** @type {number} */ y) => {
        const i = Math.floor(x / 4);
        return x >= 0 && y >= 0 && y < 5 && i < text.length && x % 4 < 3 && DIGITS[Number(text[i])][y][x % 4] === '#';
      };
      if (p.die.gold) {
        for (let y = -1; y <= 5; y++) for (let x = -1; x <= w; x++) {
          if (!lit(x, y) && (lit(x - 1, y) || lit(x + 1, y) || lit(x, y - 1) || lit(x, y + 1))) put(left + x, top + y, outline);
        }
      }
      [...text].forEach((ch, i) => {
        DIGITS[Number(ch)].forEach((row, ry) => {
          for (let rx = 0; rx < 3; rx++) if (row[rx] === '#') put(left + i * 4 + rx, top + ry, ink);
        });
      });
    }
  }

  return { roll, update, clear, setSize };
}
