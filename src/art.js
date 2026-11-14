// @ts-check
// The art sheet (art.html, docs/art.md): every piece of the game's art on one
// page, for the owner and Claude to look at together. Trials first (options
// side by side), then the painted spots, then each sprite enlarged with its
// pixel grid, then the palettes. Nothing here is part of the game.
//
//   http://localhost:8001/art.html          ?seed=N for another layout of the scenery

import { Rectangle } from 'pixi.js';
import { SIZE, createScene } from './scene/scene.js';
import { POND, POND_SUMMER, createPondScene, paintPond } from './scene/pond.js';
import { REEDY, REEDY_AUTUMN, REEDY_SPRING, REEDY_WINTER, paintReedy } from './scene/reedy.js';
import { BOBBER, BOBBER_DIPPED, BOBBER_FAR, PALETTE, SPLASH, WAVES, bobberKeys, paintGrid } from './scene/sprites.js';
import { ICONS, KEYS as ICON_KEYS, OWN_KEYS, paintIcon } from './scene/icons.js';
import { TRIALS } from './art-trials.js';
import { SWIM_FRAMES, fishFrames, paint } from './scene/fish-art.js';
import { content } from './generated/content.js';
import { createRng, deriveSeed } from './rng.js';

const seed = Number(new URLSearchParams(location.search).get('seed') ?? 1);

/** @param {string} tag @param {Record<string, string>} [attrs] @param {(Node | string)[]} [children] */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

const sheet = /** @type {HTMLElement} */ (document.getElementById('sheet'));
/** @param {string} title @param {string} [note] */
function section(title, note) {
  const s = el('section', {}, [el('h2', {}, [title]), ...(note ? [el('p', { class: 'note' }, [note])] : [])]);
  sheet.append(s);
  return s;
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

/** @param {string} text */
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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

const trials = section(
  'Trials',
  TRIALS.length
    ? 'Options to choose between. Tell Claude which one, or what you like about each.'
    : 'Nothing to choose between right now.',
);
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

// ---------- Fish that swim (D131) ----------

/** The underwater tank's size, in scene pixels. */
const TANK_W = 192;
const TANK_H = 96;
/** The dive's water, top to bottom (src/scene/views.js). */
const DEEP_BANDS = ['#2f8f9f', '#28808f', '#22717f', '#1c626f', '#16535f', '#11444f'];

/**
 * The still part of the water: bands blended through dithered rows, light
 * from above, sand. Painted once.
 * @param {() => number} rand
 */
function paintDeep(rand) {
  const canvas = /** @type {HTMLCanvasElement} */ (el('canvas'));
  canvas.width = TANK_W;
  canvas.height = TANK_H;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const band = TANK_H / DEEP_BANDS.length;
  for (let y = 0; y < TANK_H; y++) {
    const i = Math.min(DEEP_BANDS.length - 1, Math.floor(y / band));
    const edge = y - i * band >= band - 1 && i < DEEP_BANDS.length - 1;
    for (let x = 0; x < TANK_W; x++) {
      ctx.fillStyle = DEEP_BANDS[edge && (x + y) % 2 ? i + 1 : i];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // Shafts of light, slanting down, dithered so they stay hard pixels.
  for (let i = 0; i < 4; i++) {
    const x0 = 14 + i * 50 + Math.floor(rand() * 12);
    for (let y = 0; y < TANK_H - 12; y++) {
      const from = x0 + Math.floor(y * 0.35);
      for (let x = from; x < from + 7; x++) {
        if ((x + y) % 2 === 0 && rand() > y / TANK_H) {
          ctx.fillStyle = '#3f9fab';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }
  // The bottom: sand with darker grains.
  for (let x = 0; x < TANK_W; x++) {
    const top = TANK_H - 9 + Math.round(Math.sin(x / 11) * 1.5);
    for (let y = top; y < TANK_H; y++) {
      ctx.fillStyle = y === top ? '#7a6a48' : rand() < 0.12 ? '#4f4430' : '#5f5238';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

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
  const deep = paintDeep(r);
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

{
  const swim = section(
    'Fish that swim',
    'Every fish drawn to swim (D131), after the carp trial: its shape from a preset for its kind of body ' +
      '(src/scene/fish-shapes.js), its colours read off its icon. Side on in the tank, the aquarium and the dive; ' +
      'from the bank, darkened, as a class fish or a big fish under the surface. Export one to mark up: ' +
      'npm run sprite export swim-common-carp.',
  );
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
}

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
  scene.setWorld(world);
  scenes.push(scene);
  save.addEventListener('click', () => saveScene(scene.app, `pond-${slug(caption)}-seed${seed}.png`));
}

const AS_DRAWN = { ...NOON, weather: { ...CLEAR, wind: 2 } };
const pond = section(
  'Trial: a scene from a photo',
  'The whole scene painted as code from a photo of an autumn pond (docs/design/photo-autumn-pond.jpg), instead of from a sketch. Art sheet only: the game is unchanged. Drawn 320 wide; a square screen sees the middle 256. Gusts roll across the reeds, the birch twigs and the beech leaves; the reflection wobbles; rings spread now and then, all over in rain.',
);
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
const SUMMER_DAY = { ...NOON, season: 'summer', hour: 13, weather: { temperature: 22, wind: 2, clouds: 0, precipitation: 0 } };
await pondCard(pondSummer, 'Pond in summer, breezy', SUMMER_DAY, 640, 320, 'summer');
await pondCard(pondSummer, 'Pond in summer, 256 wide', SUMMER_DAY, 384, 256, 'summer');

// The reedy shore (D117, D118), painted the same way from a sketch and photos
// of the reeds, in all four seasons. The sheet keeps at most 16 live scenes
// (docs/art.md).
const reedy = section(
  'The reedy shore',
  'Painted as code from the owner’s sketch (docs/design/sketch-reedy-shore.png, markup-reedy-shore.png) and photos of the reeds in summer (photo-reeds-dense.jpg) and late November (photo-reedy-shore-november.jpg): open lake to a bare horizon, two banks of reeds close up with a channel between. Winter is the November photo; spring and autumn are worked out from summer and winter.',
);
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

const sceneSprites = el('div', { class: 'row sprites' });
section(
  'Scene sprites',
  'Enlarged, with the real size beside the name. Export one to draw on: node tools/sprite-png.mjs export <name>.',
).append(sceneSprites);
const water = PALETTE.waterMid;
spriteCard(sceneSprites, 'bobber', paintGrid(BOBBER), water);
spriteCard(sceneSprites, 'bobber, bitten', paintGrid(BOBBER_DIPPED), water);
spriteCard(sceneSprites, 'bobber-far', paintGrid(BOBBER_FAR), PALETTE.waterFar);
SPLASH.forEach((rows, i) => spriteCard(sceneSprites, `splash-${i + 1}`, paintGrid(rows), water));
for (const [band, frames] of Object.entries(WAVES)) {
  const backing = band === 'far' ? PALETTE.waterFar : band === 'mid' ? PALETTE.waterMid : PALETTE.waterNear;
  frames.forEach((rows, i) => spriteCard(sceneSprites, `wave-${band}-${i + 1}`, paintGrid(rows), backing));
}

const icons = el('div', { class: 'row sprites' });
section('Icons', '32×32, on the page rather than the scene (D98). The first ones were drawn at 16 and show doubled until redrawn. Export one to mark up: npm run sprite export icon-fish-carp.').append(icons);
for (const name of Object.keys(ICONS)) spriteCard(icons, `icon-${name.replace('/', '-')}`, paintIcon(name), '#14232b');

// ---------- Palettes ----------

/** @param {string} title @param {Record<string, string>} colours */
function palette(title, colours) {
  const list = el('div', { class: 'swatches' });
  for (const [name, hex] of Object.entries(colours)) {
    list.append(el('div', { class: 'swatch' }, [el('span', { class: 'chip', style: `background:${hex}` }), el('code', {}, [name]), ` ${hex}`]));
  }
  return el('div', {}, [el('h3', {}, [title]), list]);
}
section('Palettes', 'Every colour the art uses. A new colour gets a name here before it is used.').append(
  palette('Scene (PALETTE in src/scene/sprites.js)', PALETTE),
  palette('Scene sprite keys', bobberKeys(null)),
  palette('Trial: the pond from a photo (POND in src/scene/pond.js)', POND),
  palette('Trial: the pond in summer (POND_SUMMER in src/scene/pond.js)', POND_SUMMER),
  palette('The reedy shore in spring (REEDY_SPRING in src/scene/reedy.js)', REEDY_SPRING),
  palette('The reedy shore in summer (REEDY in src/scene/reedy.js)', REEDY),
  palette('The reedy shore in autumn (REEDY_AUTUMN in src/scene/reedy.js)', REEDY_AUTUMN),
  palette('The reedy shore in winter (REEDY_WINTER in src/scene/reedy.js)', REEDY_WINTER),
  palette('Icon keys (src/scene/icons.js)', ICON_KEYS),
  ...Object.entries(OWN_KEYS).map(([name, keys]) => palette(`The ${name} icon's own colours (OWN_KEYS)`, keys)),
);

document.body.dataset.ready = 'true';
