// @ts-check
// Fish that swim (R20.1, D129): side-view sprites made from the fish icons,
// and a swimming motion like a fish's: cruising towards somewhere, turning in
// a curve, now and then a burst and a glide, the tail beating faster the
// faster it goes.
//
// The icons lie tilted (D98), head up and to the left. A side view is made
// once per species: the icon's body axis is measured from its pixels, and the
// grid turned level by sampling each new pixel at sixteen points and keeping
// the colour most of them land on, so the outline stays clean. It's a new
// sprite, made once, not one scaled at runtime (R7.3). The tail's beat is a
// few frames in which the columns towards the tail shift up or down a pixel.

import { Container, Sprite, Texture } from 'pixi.js';
import { iconName, paintIcon } from './icons.js';
import { bodyAngle, fishFrames, paint, turnGrid } from './fish-art.js';

/** Frames of the tail's beat. */
const FRAMES = 6;

/** @type {Map<string, { frames: Texture[], shadows: Texture[], small: Texture[], w: number, h: number, drawn: boolean }>} */
const cache = new Map();

/**
 * The icon's pixels as colours ('' for none).
 * @param {HTMLCanvasElement} canvas
 */
function pixelsOf(canvas) {
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  /** @type {string[][]} */
  const grid = [];
  for (let y = 0; y < height; y++) {
    grid.push([]);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      grid[y].push(data[i + 3] > 127 ? `${data[i]},${data[i + 1]},${data[i + 2]}` : '');
    }
  }
  return grid;
}

/**
 * Half the size, for the small shadows under the surface: each new pixel is
 * there if any of its four is.
 * @param {string[][]} grid
 */
function halve(grid) {
  /** @type {string[][]} */
  const out = [];
  for (let y = 0; y < grid.length; y += 2) {
    out.push([]);
    for (let x = 0; x < grid[0].length; x += 2) {
      const c = grid[y][x] || grid[y][x + 1] || grid[y + 1]?.[x] || grid[y + 1]?.[x + 1] || '';
      out[out.length - 1].push(c);
    }
  }
  return out;
}

/**
 * The tail's beat: frame `k`'s columns towards the tail shifted up or down,
 * more the nearer the tail. Head on the left.
 * @param {string[][]} grid
 * @param {number} k
 * @param {string | null} fill  One colour for all of it (a shadow), or null for its own.
 */
function beatFrame(grid, k, fill) {
  const h = grid.length;
  const w = grid[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h + 4;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const phase = (2 * Math.PI * k) / FRAMES;
  for (let x = 0; x < w; x++) {
    const along = x / Math.max(1, w - 1);
    // Only the back half moves, the tail most.
    const bend = along < 0.45 ? 0 : ((along - 0.45) / 0.55) ** 1.5;
    const dy = Math.round(1.6 * bend * Math.sin(phase - along * Math.PI));
    for (let y = 0; y < h; y++) {
      const c = grid[y][x];
      if (!c) continue;
      ctx.fillStyle = fill ?? `rgb(${c})`;
      ctx.fillRect(x, y + 2 + dy, 1, 1);
    }
  }
  return Texture.from(canvas);
}

/**
 * A species' side view, turned level from its icon, head on the left: its
 * pixels as 'r,g,b' ('' for none).
 * @param {string} species
 */
export function sideView(species) {
  const grid = pixelsOf(paintIcon(iconName({ kind: 'fish', id: species })));
  const level = turnGrid(grid, -bodyAngle(grid));
  // The icons' heads are up and left, so after turning the head is the left
  // end; if the shape came out taller than it is long, it's a fish drawn
  // upright, kept as it was.
  return level.length > level[0].length ? grid : level;
}

/**
 * A species' swimming sprite: its frames, the same as shadows, and small
 * shadows; made once and kept.
 * @param {string} species
 */
export function swimSprite(species) {
  const known = cache.get(species);
  if (known) return known;
  // Drawn to swim (D131): its own frames side on, and under the surface its
  // view from the bank, near for a big fish and far for a school's.
  const drawn = fishFrames(species);
  if (drawn) {
    const tex = (/** @type {string[][]} */ g) => Texture.from(paint(g));
    const sprite = {
      frames: drawn.side.map(tex),
      shadows: drawn.near.map(tex),
      small: drawn.far.map(tex),
      w: drawn.side[0][0].length,
      h: drawn.side[0].length,
      drawn: true,
    };
    cache.set(species, sprite);
    return sprite;
  }
  const level = sideView(species);
  const small = halve(level);
  const sprite = {
    frames: Array.from({ length: FRAMES }, (_, k) => beatFrame(level, k, null)),
    shadows: Array.from({ length: FRAMES }, (_, k) => beatFrame(level, k, '#0b2a33')),
    small: Array.from({ length: FRAMES }, (_, k) => beatFrame(small, k, '#0b2a33')),
    w: level[0].length,
    h: level.length + 4,
    drawn: false,
  };
  cache.set(species, sprite);
  return sprite;
}

/**
 * @typedef {Object} Swimmer
 * @property {string} key  Who it is, so a fish keeps swimming when the list is set again.
 * @property {string} species
 * @property {Sprite} sprite
 * @property {number} x @property {number} y @property {number} vx @property {number} vy
 * @property {{ x: number, y: number }} goal
 * @property {number} cruise  Its own easy speed, pixels a second.
 * @property {number} burstUntil
 * @property {number} nextGoal
 * @property {number} beat  Where the tail is in its beat, in frames.
 * @property {boolean} right  Facing right.
 * @property {'own' | 'shadow' | 'small'} look
 * @property {{ x0: number, y0: number, x1: number, y1: number } | null} box  Its own box, if not the shoal's.
 */

/**
 * A shoal: fish swimming in a box.
 * @param {Container} parent
 * @param {() => number} rand  Cosmetic only (D4).
 */
export function createShoal(parent, rand) {
  const layer = new Container();
  parent.addChild(layer);
  /** @type {Swimmer[]} */
  let swimmers = [];
  let box = { x0: 0, y0: 0, x1: 256, y1: 256 };
  let last = 0;

  /** @param {Swimmer} s @param {number} now */
  function newGoal(s, now) {
    const b = s.box ?? box;
    const pad = Math.min(16, (b.x1 - b.x0) / 4);
    s.goal = { x: b.x0 + pad + rand() * Math.max(1, b.x1 - b.x0 - 2 * pad), y: b.y0 + rand() * Math.max(1, b.y1 - b.y0) };
    s.nextGoal = now + 2500 + rand() * 4000;
    // Now and then a burst, as a startled fish does.
    if (rand() < 0.2) s.burstUntil = now + 500 + rand() * 400;
  }

  return {
    layer,
    /**
     * Who swims, and where: fish already swimming keep going.
     * @param {{ key: string, species: string, look?: 'own' | 'shadow' | 'small', x?: number, y?: number,
     *   box?: { x0: number, y0: number, x1: number, y1: number } }[]} list  `box`: where this one swims, if not the shoal's.
     * @param {{ x0: number, y0: number, x1: number, y1: number }} bounds
     */
    set(list, bounds) {
      box = bounds;
      const keep = new Map(swimmers.map((s) => [s.key, s]));
      const now = performance.now();
      swimmers = list.map((f) => {
        const old = keep.get(f.key);
        if (old) {
          keep.delete(f.key);
          old.box = f.box ?? null;
          return old;
        }
        const art = swimSprite(f.species);
        const look = f.look ?? 'own';
        const sprite = new Sprite((look === 'own' ? art.frames : look === 'shadow' ? art.shadows : art.small)[0]);
        sprite.anchor.set(0.5);
        // A drawn fish's view from the bank is already darkened; a turned icon's is a shadow.
        if (look !== 'own') sprite.alpha = art.drawn ? (look === 'small' ? 0.75 : 0.9) : look === 'small' ? 0.3 : 0.45;
        layer.addChild(sprite);
        const s = {
          key: f.key,
          species: f.species,
          sprite,
          x: f.x ?? (f.box ?? box).x0 + rand() * ((f.box ?? box).x1 - (f.box ?? box).x0),
          y: f.y ?? (f.box ?? box).y0 + rand() * ((f.box ?? box).y1 - (f.box ?? box).y0),
          vx: (rand() - 0.5) * 10,
          vy: 0,
          goal: { x: 0, y: 0 },
          cruise: 10 + rand() * 10,
          burstUntil: 0,
          nextGoal: 0,
          beat: rand() * 6,
          right: rand() < 0.5,
          look,
          box: f.box ?? null,
        };
        newGoal(s, now);
        return /** @type {Swimmer} */ (s);
      });
      for (const gone of keep.values()) gone.sprite.destroy();
    },
    /** @param {number} now */
    update(now) {
      const dt = Math.min(0.1, last ? (now - last) / 1000 : 0);
      last = now;
      for (const s of swimmers) {
        if (now > s.nextGoal || Math.hypot(s.goal.x - s.x, s.goal.y - s.y) < 6) newGoal(s, now);
        const bursting = now < s.burstUntil;
        // Under the surface, in a small patch, they mill about slowly.
        const speed = (bursting ? s.cruise * 3.5 : s.cruise) * (s.box ? 0.35 : 1);
        const dx = s.goal.x - s.x;
        const dy = (s.goal.y - s.y) * 0.6; // fish swim mostly level
        const d = Math.hypot(dx, dy) || 1;
        // Turning in a curve: the velocity eases towards where it wants to go.
        const ease = Math.min(1, dt * (bursting ? 4 : 1.2));
        s.vx += ((dx / d) * speed - s.vx) * ease;
        s.vy += ((dy / d) * speed - s.vy) * ease;
        // Kept wholly inside the box: the glass of a tank, the dive's edges.
        // A shadow under the surface only keeps its middle in its patch.
        const b = s.box ?? box;
        const art0 = swimSprite(s.species);
        const halfW = s.box ? 0 : art0.w / 2;
        const halfH = s.box ? 0 : art0.h / 2;
        s.x = Math.min(b.x1 - halfW, Math.max(b.x0 + halfW, s.x + s.vx * dt));
        s.y = Math.min(b.y1 - halfH, Math.max(b.y0 + halfH, s.y + s.vy * dt));
        // The tail beats faster the faster it goes; slow, it glides.
        const v = Math.hypot(s.vx, s.vy);
        const art = swimSprite(s.species);
        s.beat = (s.beat + dt * (v < 4 ? 1.5 : 3 + v * 0.35)) % art.frames.length;
        if (s.vx > 3) s.right = true;
        else if (s.vx < -3) s.right = false;
        const frames = s.look === 'own' ? art.frames : s.look === 'shadow' ? art.shadows : art.small;
        s.sprite.texture = frames[Math.floor(s.beat)];
        // The art faces left: facing right is a mirror, not a scaling (R7.3).
        s.sprite.scale.x = s.right ? -1 : 1;
        s.sprite.position.set(Math.round(s.x), Math.round(s.y));
      }
    },
    /**
     * The swimmer at a point, if any: its place in the list.
     * @param {{ x: number, y: number }} p
     */
    hit(p) {
      for (let i = swimmers.length - 1; i >= 0; i--) {
        const s = swimmers[i];
        const w = s.sprite.texture.width / 2 + 2;
        const h = s.sprite.texture.height / 2 + 2;
        if (Math.abs(p.x - s.x) <= w && Math.abs(p.y - s.y) <= h) return i;
      }
      return -1;
    },
    /** @param {number} i */
    at(i) {
      const s = swimmers[i];
      return s ? { x: Math.round(s.x), y: Math.round(s.y), h: s.sprite.texture.height } : null;
    },
    clear() {
      for (const s of swimmers) s.sprite.destroy();
      swimmers = [];
    },
  };
}
