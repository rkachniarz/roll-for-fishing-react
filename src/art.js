// @ts-check
// The art sheet (art.html, docs/art.md): every piece of the game's art on one
// page, for the owner and Claude to look at together. Trials first (options
// side by side), then the painted spots, then each sprite enlarged with its
// pixel grid, then the palettes. Nothing here is part of the game.
//
// Each section folds away, and builds what it shows only the first time it is
// opened, so the sheet doesn't load everything at once; the sections open
// last time open again (this browser only).
//
//   http://localhost:8001/art.html#seed=2   another layout of the scenery
//   http://localhost:8001/art.html#open=all every section open (the browser checks use this)
//
// The options go after a #, not a ?: the server sends art.html on to /art and
// drops a ? on the way, but the browser keeps the #. A ? still works on /art.

import { Rectangle } from 'pixi.js';
import { SIZE, createScene } from './scene/scene.js';
import { POND, POND_SUMMER, createPondScene, paintPond, pondSeason } from './scene/pond.js';
import { REEDY, REEDY_AUTUMN, REEDY_SPRING, REEDY_WINTER, paintOpen, paintReedy, reedySeason } from './scene/reedy.js';
import { SKY_DAY, SKY_LAYER, SKY_LOW } from './scene/sky-layer.js';
import { MOON, facingOf } from './engine/sky.js';
import { TIME, clock } from './engine/time.js';
import { SWAMP, SWAMP_AUTUMN, SWAMP_H, SWAMP_SUMMER, SWAMP_W, SWAMP_WINTER, swampStill } from './scene/swamp-pixels.js';
import { paintSwamp } from './scene/swamp.js';
import { skySpec } from './scene/clouds.js';
import { SWAMP_UNDER, swampUnderStill } from './scene/swamp-under.js';
import { BOBBER, BOBBER_DIPPED, BOBBER_FAR, PALETTE, SPLASH, WAVES, bobberKeys, paintGrid } from './scene/sprites.js';
import { ICONS, KEYS as ICON_KEYS, OWN_KEYS, paintIcon } from './scene/icons.js';
import { TRIALS } from './art-trials.js';
import { SWIM_FRAMES, fishFrames, paint } from './scene/fish-art.js';
import { content } from './generated/content.js';
import { t } from './strings.js';
import { createRng, deriveSeed } from './rng.js';
import { DEEP_BANDS, paintDeep } from './scene/deep.js';

/** The sheet's options, from after the # or the ? (see above). */
const options = new URLSearchParams(location.hash.slice(1) || location.search);
const seed = Number(options.get('seed') ?? 1);

/** @param {string} tag @param {Record<string, string>} [attrs] @param {(Node | string)[]} [children] */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

/** @param {string} text */
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const sheet = /** @type {HTMLElement} */ (document.getElementById('sheet'));
const OPEN_ALL = options.get('open') === 'all';
const OPEN_KEY = 'roll-for-fishing-art-sheet-open';
/** @type {string[]} The sections open last time. */
let remembered = [];
try {
  remembered = JSON.parse(localStorage.getItem(OPEN_KEY) ?? '[]');
} catch {
  remembered = [];
}
/** Sections build one after another, so the live scenes start in order. */
let building = Promise.resolve();
/**
 * A section that folds away and builds its contents the first time it opens.
 * @param {string} title @param {string} note @param {(body: HTMLElement) => void | Promise<void>} build
 */
function section(title, note, build) {
  const body = el('div', { class: 'body' }, note ? [el('p', { class: 'note' }, [note])] : []);
  const id = slug(title);
  const details = /** @type {HTMLDetailsElement} */ (el('details', { 'data-section': id }, [el('summary', {}, [el('h2', {}, [title])]), body]));
  sheet.append(details);
  let built = false;
  const open = () => {
    if (built) return;
    built = true;
    building = building.then(() => build(body));
  };
  details.addEventListener('toggle', () => {
    if (details.open) open();
    if (OPEN_ALL) return;
    try {
      const now = [...sheet.querySelectorAll('details[open]')].map((d) => /** @type {HTMLElement} */ (d).dataset.section);
      localStorage.setItem(OPEN_KEY, JSON.stringify(now));
    } catch {
      // Not remembered: the sheet works the same.
    }
  });
  if (OPEN_ALL || remembered.includes(id)) {
    details.open = true;
    open();
  }
}

// ---------- Scenes ----------

/** The bobber out on the water, waiting, so it shows. */
const WAITING = /** @type {import('./scene/scene.js').Cast} */ (/** @type {unknown} */ ({ phase: 'waiting', castAt: -1e9 }));
/** A sunrise and sunset for the lights below; the game's follow the year (D85). */
const SUN = { rise: 6, set: 20.5 };
/** @type {{ update: (cast: import('./scene/scene.js').Cast, now: number) => void }[]} */
const scenes = [];

/**
 * One live scene, captioned.
 * @param {HTMLElement} parent
 * @param {string} caption
 * @param {import('./scene/sky.js').World & { sun: { rise: number, set: number } }} world
 * @param {import('./scene/scene.js').SceneLook} look
 * @param {number} maxCss  The most CSS pixels across for the 256-pixel play area.
 * @param {number} [width]  The scene's width, strips included (D93).
 */
async function sceneCard(parent, caption, world, look, maxCss, width = SIZE) {
  const canvas = /** @type {HTMLCanvasElement} */ (el('canvas'));
  const save = /** @type {HTMLButtonElement} */ (el('button', { type: 'button', class: 'save' }, ['Save as PNG']));
  parent.append(el('figure', {}, [canvas, el('figcaption', {}, [caption, ' ', save])]));
  // The same seed for every scene, so they differ only in what's being compared.
  const rand = createRng(deriveSeed(seed, 'scenery'));
  const scene = await createScene(canvas, () => rand.next(), look);
  // No wider than a phone's screen, less the page's margins.
  const fit = Math.min(maxCss, ((document.documentElement.clientWidth - 32) * SIZE) / width);
  scene.fit((fit * width) / SIZE, fit, width);
  scene.aimAt({ x: 150, y: 118 });
  scene.setWorld(world);
  scenes.push(scene);
  save.addEventListener('click', () => saveScene(scene.app, `scene-${slug(caption)}-seed${seed}.png`));
}

/**
 * Saves the scene as it is now, at its real size (256×256 unless widened), for the owner to draw
 * over in Paint (docs/art.md). Read back from the renderer, since a WebGL
 * canvas can't be copied once it has been shown.
 * @param {import('pixi.js').Application} app
 * @param {string} name
 */
async function saveScene(app, name) {
  const frame = /** @type {HTMLCanvasElement} */ (
    app.renderer.extract.canvas({ target: app.stage, frame: new Rectangle(0, 0, app.renderer.width, app.renderer.height), resolution: 1 })
  );
  const blob = await new Promise((resolve) => frame.toBlob(resolve, 'image/png'));
  const link = /** @type {HTMLAnchorElement} */ (el('a', { href: URL.createObjectURL(blob), download: name }));
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

const CLEAR = { temperature: 16, wind: 1, clouds: 0, precipitation: 0 };
const NOON = { hour: 12, minute: 0, season: 'spring', sun: SUN, weather: CLEAR };
const AS_DRAWN = { ...NOON, weather: { ...CLEAR, wind: 2 } };
const SUMMER_DAY = { ...NOON, season: 'summer', hour: 13, weather: { temperature: 22, wind: 2, clouds: 0, precipitation: 0 } };

section(
  `Trials (${TRIALS.length})`,
  TRIALS.length
    ? 'Options to choose between. Tell Claude which one, or what you like about each.'
    : 'Nothing to choose between right now.',
  async (trials) => {
    for (const trial of TRIALS) {
      const row = el('div', { class: 'row' });
      trials.append(el('h3', {}, [trial.question]), row);
      for (const option of trial.options) await sceneCard(row, option.label, NOON, option.look, 512);
      if (trial.sprites) {
        const sprites = el('div', { class: 'row sprites' });
        trials.append(sprites);
        for (const [name, rows] of trial.sprites) spriteCard(sprites, name, paintGrid(rows), PALETTE.waterMid);
      }
    }
  },
);

// ---------- Still pictures ----------

/**
 * A still picture at the painting's own size, shown enlarged, with a button
 * to save it as it is (to draw over in Paint, docs/art.md).
 * @param {HTMLElement} parent @param {string} caption @param {Uint8ClampedArray} pixels @param {string} file
 */
function stillCard(parent, caption, pixels, file) {
  const canvas = /** @type {HTMLCanvasElement} */ (el('canvas', { width: String(SWAMP_W), height: String(SWAMP_H) }));
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const image = ctx.createImageData(SWAMP_W, SWAMP_H);
  image.data.set(pixels);
  ctx.putImageData(image, 0, 0);
  // Twice its size where there is room, in whole steps so the pixels stay square.
  const scale = document.documentElement.clientWidth - 32 >= SWAMP_W * 2 ? 2 : 1;
  canvas.style.width = `${SWAMP_W * scale}px`;
  canvas.style.height = `${SWAMP_H * scale}px`;
  const save = /** @type {HTMLButtonElement} */ (el('button', { type: 'button', class: 'save' }, ['Save as PNG']));
  save.addEventListener('click', () =>
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = /** @type {HTMLAnchorElement} */ (el('a', { href: URL.createObjectURL(blob), download: file }));
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }, 'image/png'),
  );
  parent.append(el('figure', {}, [canvas, el('figcaption', {}, [caption, ' ', save])]));
}

// ---------- Fish that swim (D131) ----------

/** The underwater tank's size, in scene pixels. */
const TANK_W = 192;
const TANK_H = 96;
/**
 * A fish's frames on canvases, facing left and right, with its gulp.
 * @param {string} species
 */
function swimLook(species) {
  const f = /** @type {NonNullable<ReturnType<typeof fishFrames>>} */ (fishFrames(species));
  return {
    left: f.side.map((g) => paint(g)),
    right: f.side.map((g) => paint(g, true)),
    gulpLeft: paint(f.gulp),
    gulpRight: paint(f.gulp, true),
  };
}

/**
 * A live tank: water, weed swaying, bubbles, and fish swimming across and
 * back, each now and then bursting and gliding. A plain 2D canvas, so it
 * doesn't count against WebGL's limit.
 * @param {HTMLElement} parent
 * @param {string} caption
 * @param {string[]} species
 */
function tankCard(parent, caption, species) {
  const zoom = Math.max(2, Math.min(4, Math.floor((document.documentElement.clientWidth - 40) / TANK_W)));
  const canvas = /** @type {HTMLCanvasElement} */ (el('canvas', { style: `width:${TANK_W * zoom}px;height:${TANK_H * zoom}px` }));
  canvas.width = TANK_W;
  canvas.height = TANK_H;
  parent.append(el('figure', { class: 'tank' }, [canvas, el('figcaption', {}, [caption])]));
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const rand = createRng(deriveSeed(seed, 'scenery'));
  const r = () => rand.next();
  const deep = paintDeep(TANK_W, TANK_H, r);
  const weeds = Array.from({ length: 7 }, (_, i) => ({ x: 8 + i * 27 + Math.floor(r() * 10), h: 14 + Math.floor(r() * 16) }));
  const bubbles = Array.from({ length: 5 }, () => ({ x: Math.floor(r() * TANK_W), y: r() * TANK_H, speed: 6 + r() * 8 }));
  const fish = species.map((id, i) => ({
    look: swimLook(id),
    x: 10 + r() * (TANK_W - 70),
    y: 8 + ((i * 23) % (TANK_H - 40)),
    dir: r() < 0.5 ? 1 : -1,
    beat: r() * 8,
    burstUntil: 0,
    nextBurst: 2000 + r() * 6000,
    glideUntil: 0,
    nextGulp: 1500 + r() * 4000,
    gulpUntil: 0,
    phase: r() * 6,
  }));
  let last = performance.now();
  /** @param {number} now */
  function draw(now) {
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
    last = now;
    ctx.drawImage(deep, 0, 0);
    // Weed behind the fish, its top half swaying a pixel.
    const sway = Math.floor(now / 700) % 2;
    for (const wd of weeds) {
      for (let y = 0; y < wd.h; y++) {
        const off = y > wd.h / 2 ? sway : 0;
        ctx.fillStyle = y % 5 === 0 ? '#3f7f46' : '#2f6f3a';
        ctx.fillRect(wd.x + off + (y % 6 < 3 ? 0 : 1), TANK_H - 9 - y, 2, 1);
      }
    }
    for (const f of fish) {
      if (now > f.nextBurst) {
        f.burstUntil = now + 700;
        f.glideUntil = now + 2000;
        f.nextBurst = now + 5000 + r() * 5000;
      }
      if (now > f.nextGulp) {
        f.gulpUntil = now + 260;
        f.nextGulp = now + 2500 + r() * 4000;
      }
      const bursting = now < f.burstUntil;
      const gliding = now < f.glideUntil;
      const w = f.look.left[0].width;
      f.x += f.dir * (bursting ? 28 : gliding ? 8 : 12) * dt;
      if (f.x > TANK_W - w - 4) f.dir = -1;
      if (f.x < 4) f.dir = 1;
      // The beat: quick in a burst, easy cruising, still in a glide.
      if (!gliding || bursting) f.beat += dt * (bursting ? 22 : 8);
      const k = Math.floor(f.beat) % SWIM_FRAMES;
      const gulp = now < f.gulpUntil && k === 0;
      const img = f.dir > 0 ? (gulp ? f.look.gulpRight : f.look.right[k]) : gulp ? f.look.gulpLeft : f.look.left[k];
      ctx.drawImage(img, Math.round(f.x), Math.round(f.y + Math.sin(now / 1300 + f.phase) * 3));
    }
    // Bubbles in front.
    ctx.fillStyle = '#bfeff0';
    for (const b of bubbles) {
      b.y -= b.speed * dt;
      if (b.y < 0) b.y = TANK_H - 10;
      ctx.fillRect(b.x + (Math.floor(b.y / 6) % 2), Math.round(b.y), 1, 1);
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

/**
 * The scene's open water, far band at the top, near at the bottom, its waves
 * shimmering, with class fish below the surface at both distances.
 * @param {HTMLElement} parent
 * @param {[string, string]} species  Far out, close in.
 */
function surfaceCard(parent, species) {
  const W = 256;
  const H = 120;
  const zoom = Math.max(2, Math.min(3, Math.floor((document.documentElement.clientWidth - 40) / W)));
  const canvas = /** @type {HTMLCanvasElement} */ (el('canvas', { style: `width:${W * zoom}px;height:${H * zoom}px` }));
  canvas.width = W;
  canvas.height = H;
  parent.append(el('figure', {}, [canvas, el('figcaption', {}, [`Class fish below the surface, on the scene's water at its own size: a ${species[0]} far out, a ${species[1]} close in`])]));
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const rand = createRng(deriveSeed(seed, 'scenery'));
  const r = () => rand.next();
  const still = /** @type {HTMLCanvasElement} */ (el('canvas'));
  still.width = W;
  still.height = H;
  const sctx = /** @type {CanvasRenderingContext2D} */ (still.getContext('2d'));
  const bands = [PALETTE.waterFar, PALETTE.waterMid, PALETTE.waterNear];
  for (let y = 0; y < H; y++) {
    const i = Math.min(2, Math.floor(y / 40));
    const edge = y % 40 === 39 && i < 2;
    for (let x = 0; x < W; x++) {
      sctx.fillStyle = bands[edge && (x + y) % 2 ? i + 1 : i];
      sctx.fillRect(x, y, 1, 1);
    }
  }
  const waves = [
    ...Array.from({ length: 14 }, () => ({ band: 'far', x: r() * W, y: 4 + r() * 32 })),
    ...Array.from({ length: 8 }, () => ({ band: 'mid', x: r() * W, y: 42 + r() * 34 })),
    ...Array.from({ length: 5 }, () => ({ band: 'near', x: r() * W, y: 82 + r() * 34 })),
  ].map((w) => ({ x: Math.floor(w.x), y: Math.floor(w.y), frames: WAVES[/** @type {'far' | 'mid' | 'near'} */ (w.band)].map((rows) => paintGrid(rows)) }));
  const fish = /** @type {const} */ (['far', 'near']).map((d, i) => {
    const f = /** @type {NonNullable<ReturnType<typeof fishFrames>>} */ (fishFrames(species[i]));
    return { left: f[d].map((g) => paint(g)), right: f[d].map((g) => paint(g, true)), x: i ? 40 : 150, y: i ? 86 : 12, dir: i ? 1 : -1, speed: i ? 9 : 5, beat: i * 3 };
  });
  let last = performance.now();
  /** @param {number} now */
  function draw(now) {
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
    last = now;
    ctx.drawImage(still, 0, 0);
    for (const f of fish) {
      const w = f.left[0].width;
      f.x += f.dir * f.speed * dt;
      if (f.x > W - w - 10) f.dir = -1;
      if (f.x < 10) f.dir = 1;
      f.beat += dt * 6;
      const frames = f.dir > 0 ? f.right : f.left;
      ctx.drawImage(frames[Math.floor(f.beat) % SWIM_FRAMES], Math.round(f.x), Math.round(f.y + Math.sin(now / 1700 + f.speed) * 1.5));
    }
    const flip = Math.floor(now / 600) % 2;
    for (const w of waves) ctx.drawImage(w.frames[(flip + w.x) % w.frames.length], w.x, w.y);
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

section(
  'Fish that swim',
  'Every fish drawn to swim (D131), after the carp trial: its shape from a preset for its kind of body ' +
    '(src/scene/fish-shapes.js), its colours read off its icon. Side on in the tank, the aquarium and the dive; ' +
    'from the bank, darkened, as a class fish or a big fish under the surface. Export one to mark up: ' +
    'npm run sprite export swim-common-carp.',
  async (swim) => {
    const live = el('div', { class: 'row' });
    swim.append(live);
    tankCard(live, 'A carp, a perch, a pike, a roach and a tench', ['common-carp', 'perch', 'northern-pike', 'roach', 'tench']);
    tankCard(live, 'Further afield: an arowana, a discus, a piranha, a bichir and an eel', ['silver-arowana', 'discus', 'red-bellied-piranha', 'ornate-bichir', 'mainland-eel']);
    surfaceCard(live, ['northern-pike', 'common-carp']);
    swim.append(el('h3', {}, ['Every fish, side on and below the surface (near and far), on the dive\'s water']));
    const all = el('div', { class: 'row sprites' });
    swim.append(all);
    // Drawn a few at a time, letting the page show itself between them: on a
    // phone the whole lot at once kept everything below waiting.
    const ids = Object.keys(content.fish).sort();
    for (const [i, id] of ids.entries()) {
      const f = fishFrames(id);
      if (!f) continue;
      spriteCard(all, `swim-${id}`, paint(f.side[0]), DEEP_BANDS[2]);
      if (i % 8 === 7) await new Promise((r) => setTimeout(r));
    }
    swim.append(el('h3', {}, ['Below the surface, from the bank, on the scene\'s water']));
    const below = el('div', { class: 'row sprites' });
    swim.append(below);
    for (const id of ids) {
      const f = fishFrames(id);
      if (!f) continue;
      spriteCard(below, `below-${id}`, paint(f.near[0]), PALETTE.waterNear);
    }
  },
);

// ---------- A trial: a whole scene painted from a photo ----------

/**
 * One live pond scene, captioned, as sceneCard does for the game's.
 * @param {HTMLElement} parent @param {string} caption
 * @param {import('./scene/sky.js').World & { sun: { rise: number, set: number } }} world
 * @param {number} maxCss  The most CSS pixels across for the 256-pixel play area.
 * @param {number} width  How much of the 320-pixel painting shows.
 * @param {string} [season]
 * @param {(rand: () => number, season: any) => import('./scene/pond.js').Pond} [paint]  Which painting: the pond, or another drawn the same way.
 */
async function pondCard(parent, caption, world, maxCss, width, season = 'autumn', paint = paintPond) {
  const canvas = /** @type {HTMLCanvasElement} */ (el('canvas'));
  const save = /** @type {HTMLButtonElement} */ (el('button', { type: 'button', class: 'save' }, ['Save as PNG']));
  parent.append(el('figure', {}, [canvas, el('figcaption', {}, [caption, ' ', save])]));
  const rand = createRng(deriveSeed(seed, 'scenery'));
  const scene = await createPondScene(canvas, () => rand.next(), season, paint);
  const fit = Math.min(maxCss, ((document.documentElement.clientWidth - 32) * SIZE) / width);
  scene.fit((fit * width) / SIZE, fit, width);
  // The spot's own facing, so the sky layer puts the sun and moon where the game would (D166, D169).
  scene.setWorld({ facing: paint === paintPond ? facingOf('lake', 'still-water') : paint === paintReedy ? facingOf('lake', 'reedy-shore') : null, ...world });
  scenes.push(scene);
  save.addEventListener('click', () => saveScene(scene.app, `pond-${slug(caption)}-seed${seed}.png`));
}

section(
  'Still water (the pond)',
  'The whole scene painted as code from a photo of an autumn pond (docs/design/photo-autumn-pond.jpg), instead of from a sketch (D115, D116). Drawn 320 wide; a square screen sees the middle 256. Gusts roll across the reeds, the birch twigs and the beech leaves; the reflection wobbles; rings spread now and then, all over in rain.',
  async (pond) => {
    const pondBig = el('div', { class: 'row' });
    const pondLights = el('div', { class: 'row' });
    const pondSummer = el('div', { class: 'row' });
    pond.append(pondBig, pondLights, el('h3', {}, ['The same spot in summer (docs/design/photo-summer-pond.png)']), pondSummer);
    await pondCard(pondBig, 'Pond, as drawn, breezy', AS_DRAWN, 640, 320);
    await pondCard(pondBig, 'Pond, 256 wide', AS_DRAWN, 384, 256);
    for (const [caption, world] of /** @type {const} */ ([
      ['Pond, drizzle and wind, as in the photo', { ...NOON, season: 'autumn', hour: 14, weather: { temperature: 9, wind: 3, clouds: 4, precipitation: 3 } }],
      ['Pond, sunset', { ...AS_DRAWN, hour: 20, minute: 30 }],
      ['Pond, night', { ...AS_DRAWN, hour: 1 }],
    ])) {
      await pondCard(pondLights, caption, world, 300, 320);
    }
    await pondCard(pondSummer, 'Pond in summer, breezy', SUMMER_DAY, 640, 320, 'summer');
    await pondCard(pondSummer, 'Pond in summer, 256 wide', SUMMER_DAY, 384, 256, 'summer');
  },
);

// The reedy shore (D117, D118), painted the same way from a sketch and photos
// of the reeds, in all four seasons. The sheet keeps at most 16 live scenes
// (docs/art.md).
section(
  'The reedy shore',
  'Painted as code from the owner’s sketch (docs/design/sketch-reedy-shore.png, markup-reedy-shore.png) and photos of the reeds in summer (photo-reeds-dense.jpg) and late November (photo-reedy-shore-november.jpg): open lake to a bare horizon, two banks of reeds close up with a channel between. Winter is the November photo; spring and autumn are worked out from summer and winter.',
  async (reedy) => {
    const reedyRow = el('div', { class: 'row' });
    reedy.append(reedyRow);
    for (const [caption, world, season] of /** @type {const} */ ([
      ['Spring', { ...NOON, season: 'spring', hour: 11, weather: { temperature: 14, wind: 2, clouds: 1, precipitation: 0 } }, 'spring'],
      ['Summer', SUMMER_DAY, 'summer'],
      ['Autumn', { ...NOON, season: 'autumn', hour: 13, weather: { temperature: 10, wind: 2, clouds: 2, precipitation: 0 } }, 'autumn'],
      ['Winter', { ...NOON, season: 'winter', hour: 12, weather: { temperature: 1, wind: 2, clouds: 2, precipitation: 0 } }, 'winter'],
    ])) {
      await pondCard(reedyRow, `Reedy shore in ${caption.toLowerCase()}`, world, 480, 320, season, paintReedy);
    }
  },
);

// The sky as its own layer (12.4, D169): one live scene per painting that
// shows sky, and the moments below as stills taken from it, so the sheet stays
// under its limit of live scenes (docs/art.md).

/** A game minute: the day of the year (0, the first of spring) and the hour. @param {number} day @param {number} hour */
const minuteOf = (day, hour) => day * 1440 + Math.round(hour * 60);
/**
 * The world at a game minute, as the game would give it.
 * @param {number} time @param {{ facing?: number | null, fullMoonAt?: number, weather?: typeof CLEAR }} [extra]
 */
function momentWorld(time, extra = {}) {
  const c = clock(time);
  return { hour: c.hour, minute: c.minute, season: c.season, sun: c.sun, weather: CLEAR, time, ...extra };
}

/**
 * A painting with the sky layer: live at the first moment, and every moment
 * as a still beside it, each with Save as PNG.
 * @param {HTMLElement} parent @param {string} name
 * @param {(rand: () => number, season: any) => import('./scene/pond.js').Pond} paint
 * @param {(season: string) => string} seasonOf  The painting's season for the game's.
 * @param {{ caption: string, world: ReturnType<typeof momentWorld>, paint?: typeof paint, seasonOf?: typeof seasonOf }[]} moments
 *   A moment may show another painting (`paint`, `seasonOf`), repainted into the same live scene.
 */
async function skyCards(parent, name, paint, seasonOf, moments) {
  const live = el('div', { class: 'row' });
  const stills = el('div', { class: 'row' });
  parent.append(live, stills);
  const canvas = /** @type {HTMLCanvasElement} */ (el('canvas'));
  live.append(el('figure', {}, [canvas, el('figcaption', {}, [`${name}: ${moments[0].caption} (live)`])]));
  const rand = createRng(deriveSeed(seed, 'scenery'));
  let painted = seasonOf(moments[0].world.season);
  let painter = paint;
  const scene = await createPondScene(canvas, () => rand.next(), painted, paint);
  const fit = Math.min(640, document.documentElement.clientWidth - 32);
  scene.fit(fit, (fit * SIZE) / 320, 320);
  const zoom = Math.max(1, Math.min(2, Math.floor((document.documentElement.clientWidth - 32) / 320)));
  for (const moment of moments) {
    const { caption, world } = moment;
    const season = (moment.seasonOf ?? seasonOf)(world.season);
    const nextPaint = moment.paint ?? paint;
    if (season !== painted || nextPaint !== painter) scene.repaint((painted = season), (painter = nextPaint));
    scene.setWorld(world);
    const still = scene.still(performance.now());
    still.style.width = `${still.width * zoom}px`;
    still.style.height = `${still.height * zoom}px`;
    const save = /** @type {HTMLButtonElement} */ (el('button', { type: 'button', class: 'save' }, ['Save as PNG']));
    save.addEventListener('click', () =>
      still.toBlob((blob) => {
        if (!blob) return;
        const link = /** @type {HTMLAnchorElement} */ (el('a', { href: URL.createObjectURL(blob), download: `sky-${slug(name)}-${slug(caption)}-seed${seed}.png` }));
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }, 'image/png'),
    );
    stills.append(el('figure', {}, [still, el('figcaption', {}, [caption, ' ', save])]));
    await new Promise((r) => setTimeout(r));
  }
  // Live again at the first moment.
  const first = seasonOf(moments[0].world.season);
  if (first !== painted || painter !== paint) scene.repaint(first, paint);
  scene.setWorld(moments[0].world);
  scenes.push(scene);
}

section(
  'The sky (12.4)',
  'The sky as its own layer (D169), behind the still water and the reedy shore: its colour by the sun’s height, the sun and the moon where the engine puts them (4 px for each degree above the horizon; the 60° view across the middle 256 px, D166), the stars, and a path of glitter on the water under a low sun or moon. The land isn’t relit; the tints do the light. Clear skies here; the clouds are in the next section (12.5). “Turned” cards look another way than the spot faces, to show the scale: no painted spot faces south or west.',
  async (body) => {
    const reedy = facingOf('lake', 'reedy-shore');
    const pond = facingOf('lake', 'still-water');
    body.append(el('h3', {}, [`The reedy shore, facing ${reedy}° (east)`]));
    const spring = minuteOf(6, 0);
    await skyCards(body, 'Reedy shore', paintReedy, reedySeason, [
      { caption: 'spring sunrise, 06:30: the sun low in front, glitter on the water', world: momentWorld(spring + 390, { facing: reedy }) },
      { caption: 'spring, 05:30: before the sun, the glow', world: momentWorld(spring + 330, { facing: reedy }) },
      { caption: 'spring, 07:30: the sun 12° up, the glitter fainter', world: momentWorld(spring + 450, { facing: reedy }) },
      { caption: 'spring, 18:30, turned west: just after sunset', world: momentWorld(spring + 1110, { facing: 270 }) },
      { caption: 'spring, 19:30: the full moon rising, its glitter', world: momentWorld(spring + 1170, { facing: reedy, fullMoonAt: spring + 1170 }) },
      { caption: 'winter, 17:00: a full moon over the winter reeds', world: momentWorld(minuteOf(90, 17), { facing: reedy, fullMoonAt: minuteOf(90, 17) }) },
    ]);
    body.append(el('h3', {}, [`Still water, facing ${pond}° (north-east)`]));
    await skyCards(body, 'Still water', paintPond, pondSeason, [
      { caption: 'summer sunrise, 04:30: the sun still behind the trees, so no glitter (it shows here only on summer mornings)', world: momentWorld(minuteOf(34, 4.5), { facing: pond }) },
      { caption: 'winter noon, turned south: the sun 12° up, low over the trees', world: momentWorld(minuteOf(90, 11.5), { facing: 180 }) },
      { caption: 'summer noon, turned south: the sun 58° up, far over the top', world: momentWorld(minuteOf(34, 12), { facing: 180 }) },
      { caption: 'summer, 00:30, turned south: the full moon 12° up, as low as a summer full moon goes', world: momentWorld(minuteOf(34, 24.5), { facing: 180, fullMoonAt: minuteOf(34, 24.5) }) },
      { caption: 'autumn night, 01:00: stars, a waning crescent not yet up', world: momentWorld(minuteOf(62, 1), { facing: pond, fullMoonAt: minuteOf(62, 1) - 5 * 1440 }) },
    ]);
  },
);

// Clouds that follow the weather (12.5, D170): one live scene, the reedy
// shore, and every cloud level in every season as stills from it; then the
// still water's mirror, painted into the same scene (docs/art.md's limit).
section(
  'Clouds (12.5)',
  'Clouds drawn as code from references on Wikimedia Commons (docs/REVIEW.md names them): fair-weather heaps, towering heaps, lumpy grey layers, high wisps, flat grey sheets, rain cloud and a storm’s dark overcast (src/scene/clouds.js), picked per season and cloud level by content/rules/sky.json, in the season’s palette. A description that names a sky has its own patterns; fog hides the sky; black brings a dusk. The live scene drifts with the wind; a new weather fades in over the old. Noon, facing the spot, unless the caption says otherwise.',
  async (body) => {
    const reedy = facingOf('lake', 'reedy-shore');
    const pond = facingOf('lake', 'still-water');
    const words = content.rules['weather-scales'].clouds.map((/** @type {string} */ k) => t(k));
    const days = { spring: 20, summer: 48, autumn: 76, winter: 104 };
    /** @param {string} season @param {object} weather @param {number} [hour] @param {number | null} [facing] */
    const at = (season, weather, hour = 12, facing = reedy) =>
      momentWorld(minuteOf(days[/** @type {keyof typeof days} */ (season)], hour), { facing, weather: /** @type {any} */ ({ temperature: 10, wind: 2, clouds: 0, precipitation: 0, ...weather }) });
    /** @type {{ caption: string, world: ReturnType<typeof momentWorld>, paint?: any, seasonOf?: any }[]} */
    const moments = [{ caption: 'summer, scattered (2)', world: at('summer', { clouds: 2 }) }];
    for (const season of ['spring', 'summer', 'autumn', 'winter']) {
      for (let level = 1; level <= 5; level++) moments.push({ caption: `${season}, ${words[level].toLowerCase()} (${level})`, world: at(season, { clouds: level }) });
    }
    moments.push(
      { caption: 'autumn, overcast with steady rain: rain cloud', world: at('autumn', { clouds: 4, precipitation: 3 }) },
      { caption: 'black at 16:00 in summer, turned west: the dusk it brings', world: at('summer', { clouds: 5, precipitation: 4 }, 16, 270) },
      { caption: 'thick fog (autumn, clouds 4): the sky hidden', world: at('autumn', { clouds: 4, precipitation: 1, tags: ['fog'] }) },
      { caption: 'cold mist (winter, clouds 1): the sky hidden', world: at('winter', { clouds: 1, precipitation: 1, tags: ['fog'] }) },
      { caption: '“Big, still clouds…” (spring)', world: at('spring', { clouds: 2, description: 'weather.spring.weathers.5.descriptions.1' }) },
      { caption: '“…the sun hides behind the clouds” (summer, 19:00, turned west to the sun)', world: at('summer', { clouds: 2, description: 'weather.summer.weathers.11.descriptions.0' }, 19, 290) },
      { caption: '“A grey blanket of cloud…” (winter, clouds 3)', world: at('winter', { clouds: 3, description: 'weather.winter.weathers.3.descriptions.0' }) },
      { caption: 'still water, summer, broken: the clouds mirrored', world: at('summer', { clouds: 3 }, 12, pond), paint: paintPond, seasonOf: pondSeason },
      { caption: 'still water, autumn, black: no glints', world: at('autumn', { clouds: 5, precipitation: 4 }, 12, pond), paint: paintPond, seasonOf: pondSeason },
      { caption: 'scattered at sunset, turned west', world: at('spring', { clouds: 2 }, 18.5, 270) },
      { caption: 'broken at night under a full moon', world: momentWorld(minuteOf(20, 22), { facing: reedy, fullMoonAt: minuteOf(20, 22), weather: /** @type {any} */ ({ temperature: 8, wind: 2, clouds: 3, precipitation: 0 }) }) },
    );
    await skyCards(body, 'Reedy shore', paintReedy, reedySeason, moments);
  },
);

// The open water (D171): the default scene for every spot without a painting
// of its own, the reedy shore's lake with no reeds. One live scene, turned by
// hand, to try the sky in any facing; the spots' own facings are in the list.
section(
  'The open water (the default scene)',
  'The reedy shore’s water, horizon and sky with no reeds (paintOpen in src/scene/reedy.js, D171): every spot without a painting of its own shows it, facing its own way (look.facing, D166), its tint washed over the water in the game (not here). Pick a spot or turn the view by hand; the day, the hour, the moon, the clouds and the rain move the sky as the game would. Weather picks one of the descriptions that name a sky (content/rules/sky.json), with its own weather’s wind, rain and temperature, and moves to its season; its sky shows only at the cloud levels it suits, so the slider is put on one. “Sky from” says which rule picked the patterns (D170).',
  async (body) => {
    const spots = Object.entries(content.locations).flatMap(([location, l]) =>
      (/** @type {any[]} */ (l.spots ?? []))
        .filter((s) => !l.town && typeof s.look?.facing === 'number')
        .map((s) => ({ label: `${t(s.name)}${s.look.painting ? '' : ' (default scene)'}`, facing: s.look.facing })),
    );
    const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const compass = (/** @type {number} */ deg) => POINTS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
    const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
    const days = TIME.seasonDays * 4;

    const pick = /** @type {HTMLSelectElement} */ (el('select', {}, [el('option', { value: '' }, ['(by hand)']), ...spots.map((s, i) => el('option', { value: String(i) }, [`${s.label}: ${s.facing}°`]))]));
    /** @param {string} name @param {number} min @param {number} max @param {number} step @param {number} value */
    const slider = (name, min, max, step, value) => {
      const input = /** @type {HTMLInputElement} */ (el('input', { type: 'range', min: String(min), max: String(max), step: String(step), value: String(value) }));
      const shown = el('span', { class: 'size' });
      return { input, shown, row: el('label', { class: 'control' }, [el('span', { class: 'name' }, [name]), input, shown]) };
    };
    const facing = slider('Facing', 0, 355, 5, 90);
    const day = slider('Day', 0, days - 1, 1, 6);
    const hour = slider('Hour', 0, 23.75, 0.25, 6.5);
    const moon = slider('Moon', 0, MOON.cycleDays - 1, 1, 0);
    const clouds = slider('Clouds', 0, 5, 1, 0);
    const rainWords = content.rules['weather-scales'].precipitation;
    const rain = slider('Rain', 0, rainWords.length - 1, 1, 0);
    // The descriptions that name a sky, by season, and fog (D170).
    const named = Object.keys(content.rules.sky.descriptions);
    const weatherPick = /** @type {HTMLSelectElement} */ (
      el('select', {}, [
        el('option', { value: '' }, ['(by cloud level)']),
        el('option', { value: 'fog' }, ['Fog (a weather tagged fog)']),
        ...SEASONS.map((season) =>
          el('optgroup', { label: season }, named.filter((k) => k.startsWith(`weather.${season}.`)).map((k) => el('option', { value: k }, [`${t(k.replace(/descriptions\.\d+$/, 'name'))}: “${t(k)}”`]))),
        ),
      ])
    );
    const from = el('span', { class: 'size' });
    const controls = el('div', { class: 'controls' }, [
      el('label', { class: 'control' }, [el('span', { class: 'name' }, ['Spot']), pick]),
      facing.row, day.row, hour.row, moon.row,
      el('label', { class: 'control' }, [el('span', { class: 'name' }, ['Weather']), weatherPick]),
      clouds.row, rain.row,
      el('div', { class: 'control' }, [el('span', { class: 'name' }, ['Sky from']), from]),
    ]);
    /** A weather's value: some are ranges the game rolls in when the weather turns; the testbed takes the middle. @param {number | { min: number, max: number }} v */
    const mid = (v) => (typeof v === 'number' ? v : Math.round((v.min + v.max) / 2));
    /** The weather's own cell, for a picked description: its season, cell and values. @param {string} key */
    const cellOf = (key) => {
      const [, season, , cell] = key.split('.');
      return { season, cell: Number(cell), w: content.weather[season].weathers[Number(cell)] };
    };

    const canvas = /** @type {HTMLCanvasElement} */ (el('canvas'));
    const caption = el('span');
    const save = /** @type {HTMLButtonElement} */ (el('button', { type: 'button', class: 'save' }, ['Save as PNG']));
    body.append(controls, el('div', { class: 'row' }, [el('figure', {}, [canvas, el('figcaption', {}, [caption, ' ', save])])]));
    const rand = createRng(deriveSeed(seed, 'scenery'));
    const seasonAt = () => SEASONS[Math.floor(Number(day.input.value) / TIME.seasonDays) % 4];
    let painted = reedySeason(seasonAt());
    const scene = await createPondScene(canvas, () => rand.next(), painted, paintOpen);
    const fit = Math.min(640, document.documentElement.clientWidth - 32);
    scene.fit(fit, (fit * SIZE) / 320, 320);
    scenes.push(scene);

    const show = () => {
      const f = Number(facing.input.value);
      const d = Number(day.input.value);
      const h = Number(hour.input.value);
      const time = minuteOf(d, h);
      const season = reedySeason(seasonAt());
      if (season !== painted) scene.repaint((painted = season));
      const level = Number(clouds.input.value);
      const key = weatherPick.value;
      /** @type {any} */
      let weather = { ...CLEAR, clouds: level, precipitation: Number(rain.input.value) };
      if (key === 'fog') weather = { ...weather, tags: ['fog'] };
      else if (key) {
        const { season: ws, cell, w } = cellOf(key);
        weather = { ...weather, temperature: mid(w.temperature), wind: mid(w.wind), description: key, season: ws, cell };
      }
      const spec = skySpec(weather, seasonAt());
      from.textContent = `${spec.from}: ${spec.patterns.join(', ') || 'clear'}`;
      scene.setWorld(momentWorld(time, { facing: f, fullMoonAt: time - Number(moon.input.value) * 1440, weather }));
      const c = clock(time);
      facing.shown.textContent = `${f}° ${compass(f)}`;
      day.shown.textContent = `${seasonAt()}, day ${(d % TIME.seasonDays) + 1}`;
      hour.shown.textContent = `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`;
      moon.shown.textContent = Number(moon.input.value) === 0 ? 'full' : `${moon.input.value} days after full`;
      clouds.shown.textContent = t(content.rules['weather-scales'].clouds[level]);
      rain.shown.textContent = t(rainWords[Number(rain.input.value)]);
      caption.textContent = `Open water, facing ${f}° (${compass(f)}), ${seasonAt()} ${hour.shown.textContent}`;
    };
    pick.addEventListener('change', () => {
      if (pick.value !== '') facing.input.value = String(spots[Number(pick.value)].facing);
      show();
    });
    facing.input.addEventListener('input', () => {
      pick.value = '';
      show();
    });
    weatherPick.addEventListener('change', () => {
      const key = weatherPick.value;
      if (key && key !== 'fog') {
        // To the description's season, the same day in it; its weather's rain; a cloud level its sky suits.
        const { season: ws, w } = cellOf(key);
        day.input.value = String(SEASONS.indexOf(ws) * TIME.seasonDays + (Number(day.input.value) % TIME.seasonDays));
        rain.input.value = String(mid(w.precipitation));
        const range = content.rules.sky.descriptions[key].levels ?? {};
        const own = typeof w.clouds === 'number' ? w.clouds : (w.clouds.min ?? 0);
        clouds.input.value = String(Math.min(Math.max(own, range.min ?? 0), range.max ?? 5));
      }
      show();
    });
    for (const s of [day, hour, moon, clouds, rain]) s.input.addEventListener('input', show);
    show();
    save.addEventListener('click', () => saveScene(scene.app, `open-${slug(caption.textContent ?? '')}-seed${seed}.png`));
  },
);

// The swamp (D158), painted the same way from the owner's eight photos: one
// live scene, to see it move, and each season as a still picture, so the
// sheet stays under its limit of live scenes (docs/art.md).
section(
  'The swamp',
  'Painted as code from the owner’s photos (docs/design/swamp/, notes.md there says what each gives): a beech wood standing in dark water, the trees on gnarly roots, moss, a burl, weed and pale floating rafts, tussocks, a grass bed and a little island. The owner chose the third of three trial compositions, with the second’s big mossy tree. The live scene moves: the water shimmers, rings spread now and then (all over, in rain), the mists drift, gusts push the sedge. The seasons below are stills.',
  async (swamp) => {
    const swampLive = el('div', { class: 'row' });
    const swampSeasons = el('div', { class: 'row' });
    swamp.append(swampLive, el('h3', {}, ['The four seasons']), swampSeasons);
    await pondCard(swampLive, 'Swamp in spring, breezy', { ...NOON, weather: { ...CLEAR, wind: 2 } }, 640, 320, 'spring', paintSwamp);
    for (const season of ['spring', 'summer', 'autumn', 'winter']) {
      const rand = createRng(deriveSeed(seed, 'scenery'));
      stillCard(swampSeasons, `Swamp in ${season}`, swampStill(() => rand.next(), season), `swamp-${season}-seed${seed}.png`);
    }
    // Under its water (D159): what Look Underwater and the dive show here.
    const under = el('div', { class: 'row' });
    swamp.append(el('h3', {}, ['Under the water (src/scene/swamp-under.js): the branch from the owner’s photo close up, the beech foot from photo 3 far behind']), under);
    const rand = createRng(deriveSeed(seed, 'scenery'));
    stillCard(under, 'Under the swamp', swampUnderStill(() => rand.next()), `swamp-under-seed${seed}.png`);
  },
);

/** @param {number} now */
function frame(now) {
  for (const s of scenes) s.update(WAITING, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- Sprites, enlarged ----------

/**
 * A sprite at its real size and enlarged with its pixel grid, on a backing
 * colour like the one it's seen on.
 * @param {HTMLElement} parent
 * @param {string} name  As `node tools/sprite-png.mjs list` names it.
 * @param {HTMLCanvasElement} art
 * @param {string} backing
 */
function spriteCard(parent, name, art, backing) {
  const zoom = Math.max(4, Math.min(12, Math.floor(160 / Math.max(art.width, art.height))));
  const big = /** @type {HTMLCanvasElement} */ (el('canvas'));
  big.width = art.width * zoom + 1;
  big.height = art.height * zoom + 1;
  const ctx = /** @type {CanvasRenderingContext2D} */ (big.getContext('2d'));
  ctx.fillStyle = backing;
  ctx.fillRect(0, 0, big.width, big.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, 0, 0, art.width * zoom, art.height * zoom);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  for (let x = 0; x <= art.width; x++) ctx.fillRect(x * zoom, 0, 1, big.height);
  for (let y = 0; y <= art.height; y++) ctx.fillRect(0, y * zoom, big.width, 1);
  const small = /** @type {HTMLCanvasElement} */ (el('canvas', { class: 'actual', style: `background:${backing}` }));
  small.width = art.width;
  small.height = art.height;
  /** @type {CanvasRenderingContext2D} */ (small.getContext('2d')).drawImage(art, 0, 0);
  parent.append(
    el('figure', { class: 'sprite' }, [big, el('figcaption', {}, [small, ` ${name} `, el('span', { class: 'size' }, [`${art.width}×${art.height}`])])]),
  );
}

section(
  'Scene sprites',
  'Enlarged, with the real size beside the name. Export one to draw on: node tools/sprite-png.mjs export <name>.',
  (body) => {
    const sceneSprites = el('div', { class: 'row sprites' });
    body.append(sceneSprites);
    const water = PALETTE.waterMid;
    spriteCard(sceneSprites, 'bobber', paintGrid(BOBBER), water);
    spriteCard(sceneSprites, 'bobber, bitten', paintGrid(BOBBER_DIPPED), water);
    spriteCard(sceneSprites, 'bobber-far', paintGrid(BOBBER_FAR), PALETTE.waterFar);
    SPLASH.forEach((rows, i) => spriteCard(sceneSprites, `splash-${i + 1}`, paintGrid(rows), water));
    for (const [band, frames] of Object.entries(WAVES)) {
      const backing = band === 'far' ? PALETTE.waterFar : band === 'mid' ? PALETTE.waterMid : PALETTE.waterNear;
      frames.forEach((rows, i) => spriteCard(sceneSprites, `wave-${band}-${i + 1}`, paintGrid(rows), backing));
    }
  },
);

section(
  'Icons',
  '32×32, on the page rather than the scene (D98). The first ones were drawn at 16 and show doubled until redrawn. Export one to mark up: npm run sprite export icon-fish-carp.',
  (body) => {
    const icons = el('div', { class: 'row sprites' });
    body.append(icons);
    for (const name of Object.keys(ICONS)) spriteCard(icons, `icon-${name.replace('/', '-')}`, paintIcon(name), '#14232b');
  },
);

// ---------- Palettes ----------

/** @param {string} title @param {Record<string, string>} colours */
function palette(title, colours) {
  const list = el('div', { class: 'swatches' });
  for (const [name, hex] of Object.entries(colours)) {
    list.append(el('div', { class: 'swatch' }, [el('span', { class: 'chip', style: `background:${hex}` }), el('code', {}, [name]), ` ${hex}`]));
  }
  return el('div', {}, [el('h3', {}, [title]), list]);
}
section('Palettes', 'Every colour the art uses. A new colour gets a name here before it is used.', (body) => body.append(
  palette('Scene (PALETTE in src/scene/sprites.js)', PALETTE),
  palette('Scene sprite keys', bobberKeys(null)),
  palette('Still water, the pond (POND in src/scene/pond.js)', POND),
  palette('Still water in summer (POND_SUMMER in src/scene/pond.js)', POND_SUMMER),
  palette('The sky by day, spring (SKY_DAY in src/scene/sky-layer.js)', SKY_DAY.spring),
  palette('The sky by day, summer', SKY_DAY.summer),
  palette('The sky by day, autumn', SKY_DAY.autumn),
  palette('The sky by day, winter', SKY_DAY.winter),
  palette('The sky, golden (SKY_LOW)', SKY_LOW.golden),
  palette('The sky, twilight', SKY_LOW.twilight),
  palette('The sky, night', SKY_LOW.night),
  palette('The sun, the moon, the stars, the glitter (SKY_LAYER)', SKY_LAYER),
  palette('Clouds, spring (content/rules/sky.json, D170)', content.rules.sky.seasons.spring.palette),
  palette('Clouds, summer', content.rules.sky.seasons.summer.palette),
  palette('Clouds, autumn', content.rules.sky.seasons.autumn.palette),
  palette('Clouds, winter', content.rules.sky.seasons.winter.palette),
  palette('The reedy shore in spring (REEDY_SPRING in src/scene/reedy.js)', REEDY_SPRING),
  palette('The reedy shore in summer (REEDY in src/scene/reedy.js)', REEDY),
  palette('The reedy shore in autumn (REEDY_AUTUMN in src/scene/reedy.js)', REEDY_AUTUMN),
  palette('The reedy shore in winter (REEDY_WINTER in src/scene/reedy.js)', REEDY_WINTER),
  palette('The swamp in spring (SWAMP in src/scene/swamp-pixels.js)', SWAMP),
  palette('The swamp in summer (SWAMP_SUMMER)', SWAMP_SUMMER),
  palette('The swamp in autumn (SWAMP_AUTUMN)', SWAMP_AUTUMN),
  palette('The swamp in winter (SWAMP_WINTER)', SWAMP_WINTER),
  palette('Under the swamp (SWAMP_UNDER in src/scene/swamp-under.js)', SWAMP_UNDER),
  palette('Icon keys (src/scene/icons.js)', ICON_KEYS),
  ...Object.entries(OWN_KEYS).map(([name, keys]) => palette(`The ${name} icon's own colours (OWN_KEYS)`, keys)),
));

// Ready once the sections open at load have built.
await building;
document.body.dataset.ready = 'true';
