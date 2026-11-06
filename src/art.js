// @ts-check
// The art sheet (art.html, docs/art.md): every piece of the game's art on one
// page, for the owner and Claude to look at together. Trials first (options
// side by side), then the scene in several lights, then each sprite enlarged
// with its pixel grid, then the palettes. Nothing here is part of the game.
//
//   http://localhost:8001/art.html          ?seed=N for another layout of the scenery

import { Rectangle } from 'pixi.js';
import { SIZE, createScene } from './scene/scene.js';
import { BOBBER, BOBBER_DIPPED, BOBBER_FAR, PALETTE, SPLASH, WAVES, bobberKeys, paintGrid } from './scene/sprites.js';
import { ICONS, KEYS as ICON_KEYS, paintIcon } from './scene/icons.js';
import { TRIALS } from './art-trials.js';
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

const widths = el('div', { class: 'row' });
section(
  'The scene on a wider screen',
  'On a phone the scene widens to fill the screen (D93): the 256×256 play area in the middle, strips of water, shore and reeds either side. 256 is a square screen; 314 is a Pixel 9 Pro.',
).append(widths);
for (const width of [256, 288, 314]) await sceneCard(widths, `${width} wide`, NOON, {}, 300, width);

const lights = el('div', { class: 'row' });
section('The scene in different lights', 'The art is drawn for a clear spring noon; the rest is tints and overlays laid over it by code.').append(lights);
for (const [caption, world] of /** @type {const} */ ([
  ['Spring, noon, clear', NOON],
  ['Summer, sunset', { ...NOON, season: 'summer', hour: 20, minute: 30 }],
  ['Autumn, rain', { ...NOON, season: 'autumn', hour: 15, weather: { temperature: 9, wind: 3, clouds: 4, precipitation: 3 } }],
  ['Winter, snow', { ...NOON, season: 'winter', hour: 11, weather: { temperature: -3, wind: 1, clouds: 3, precipitation: 3 } }],
  ['Night', { ...NOON, hour: 1 }],
])) {
  await sceneCard(lights, caption, world, {}, 384);
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
section('Icons', '16×16, on the page rather than the scene.').append(icons);
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
  palette('Icon keys (src/scene/icons.js)', ICON_KEYS),
);

document.body.dataset.ready = 'true';
