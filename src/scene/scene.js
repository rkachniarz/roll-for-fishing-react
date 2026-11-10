// @ts-check
// The fishing view (docs/spec.md, R7): pixel art drawn at its native size and
// scaled up by whole device pixels only. The play area is a 256-pixel square;
// on a screen with room to spare, strips of scenery either side widen the
// view to fill it (D93), and everything the engine places stays in the square. It animates whatever
// phase the cast is in and never changes the cast itself - the engine doesn't
// wait for it (docs/decisions.md, D7).

import { Application, Container, Graphics, Sprite, Texture, TextureStyle } from 'pixi.js';
import { createSky } from './sky.js';
import { createDice } from './dice.js';
import {
  BOBBER,
  BOBBER_DIPPED,
  BOBBER_FAR,
  BOBBER_FAR_DIPPED,
  WATERLINE,
  PALETTE,
  SPLASH,
  WAVES,
  bobberKeys,
  paintBackdrop,
  paintGrid,
  paintReeds,
  paintRing,
  shoreY,
} from './sprites.js';

/** The play area's side, and the scene's height, in pixels before scaling (R7.2). */
export const SIZE = 256;
/** The widest the scene gets, strips included (D93). */
export const MAX_WIDTH = 320;

/** How long the bobber is in the air after a cast. */
const FLIGHT_MS = 450;
/** Casts landing above this line use the far-band sprites. */
const FAR_LINE = 95;
/** Where the line comes from: the rod, just below the bottom edge (in the play area, as is everything below). */
const ROD_TIP = { x: SIZE / 2, y: SIZE + 6 };

/**
 * The cast as the scene sees it. `recast`: the line counts as cast again after
 * a missed splash, with the bobber still where it was (D64). `reeledIn`: a
 * missed splash after which the line comes in.
 * @typedef {import('../engine/cast.js').Cast & { recast?: boolean, reeledIn?: boolean }} Cast
 */

/**
 * A surface feature as the scene draws it (R14): where it is, what kind, and
 * how much is left of it.
 * @typedef {{ id: string, kind: string, x: number, y: number, uses: number, born: number }} SceneFeature
 */

/**
 * Knobs on how the scene looks, for trying options side by side on the art
 * sheet (art.html, docs/art.md). The game passes none, so it gets the
 * defaults; a knob whose option the owner picks becomes the default and
 * leaves this list.
 * @typedef {Object} SceneLook
 * (None at the moment.)
 */

/** The open water a cast may land on (the engine's, so features and casts agree). */
export { WATER } from '../engine/features.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {() => number} rand  Uniform [0, 1), for cosmetic variety only.
 * @param {SceneLook} [look]
 */
export async function createScene(canvas, rand, look = {}) {
  // Nearest-neighbour everywhere: a pixel stays a hard-edged square.
  TextureStyle.defaultOptions.scaleMode = 'nearest';
  const app = new Application();
  await app.init({
    canvas,
    width: SIZE,
    height: SIZE,
    resolution: 1,
    autoDensity: false,
    antialias: false,
    background: PALETTE.waterMid,
  });

  /** @param {HTMLCanvasElement} c */
  const tex = (c) => Texture.from(c);

  /** The scene's width, strips included, and where the play area starts in it. */
  let width = SIZE;
  let offset = 0;

  const backdrop = new Sprite();
  app.stage.addChild(backdrop);

  // Waves: many small pale ones far out, a few big ones close in; more of
  // them for the width of the strips.
  const waveLayer = new Container();
  app.stage.addChild(waveLayer);
  /** @type {{ sprite: Sprite, frames: Texture[], next: number, frame: number }[]} */
  let waves = [];
  const waveBands = [
    { frames: WAVES.far.map((rows) => tex(paintGrid(rows))), count: 18, top: 6, bottom: 80 },
    { frames: WAVES.mid.map((rows) => tex(paintGrid(rows))), count: 12, top: 85, bottom: 160 },
    { frames: WAVES.near.map((rows) => tex(paintGrid(rows))), count: 7, top: 165, bottom: shoreY(0, SIZE) - 10 },
  ];

  /** Paints what spans the whole width: the water and sand, and the waves on them. */
  function paintWidth() {
    const old = backdrop.texture;
    backdrop.texture = tex(paintBackdrop(width, SIZE, offset, rand));
    if (old && old !== Texture.EMPTY) old.destroy(true);
    waveLayer.removeChildren();
    waves = [];
    for (const band of waveBands) {
      const count = Math.round((band.count * width) / SIZE);
      for (let i = 0; i < count; i++) {
        const sprite = new Sprite(band.frames[0]);
        sprite.position.set(
          Math.floor(rand() * (width - 24)) + 8,
          Math.floor(band.top + rand() * (band.bottom - band.top)),
        );
        waveLayer.addChild(sprite);
        waves.push({ sprite, frames: band.frames, next: rand() * 2000, frame: 0 });
      }
    }
  }
  paintWidth();

  // Cloud shadows lie on the water, under everything that floats.
  const shadowLayer = new Container();
  app.stage.addChild(shadowLayer);

  // The play area: everything the engine places, and the cast, in its own
  // 256-pixel coordinates, moved right past the left strip.
  const play = new Container();
  app.stage.addChild(play);

  const ripples = new Container();
  play.addChild(ripples);
  /** @type {Map<string, Texture>} */
  const ringCache = new Map();
  /** @param {number} rx @param {number} ry */
  function ring(rx, ry) {
    const key = `${rx}x${ry}`;
    if (!ringCache.has(key)) ringCache.set(key, tex(paintRing(rx, ry, PALETTE.ripple)));
    return /** @type {Texture} */ (ringCache.get(key));
  }

  // Surface features (R14), under the line and the bobber.
  const featureLayer = new Graphics();
  play.addChild(featureLayer);
  /** Where each feature is drawn, gliding towards where the engine says it is. */
  /** @type {Map<string, { x: number, y: number }>} */
  const shownAt = new Map();
  /** @type {SceneFeature[]} */
  let features = [];

  const line = new Graphics();
  play.addChild(line);

  /** @param {import('./sprites.js').BobberLook | null} look */
  const paintBobber = (look) => {
    const keys = bobberKeys(look);
    return {
      near: tex(paintGrid(BOBBER, keys)),
      nearDipped: tex(paintGrid(BOBBER_DIPPED, keys)),
      far: tex(paintGrid(BOBBER_FAR, keys)),
      farDipped: tex(paintGrid(BOBBER_FAR_DIPPED, keys)),
    };
  };
  let bobberTextures = paintBobber(null);
  let bobberLook = 'null';
  const bobber = new Sprite(bobberTextures.near);
  bobber.visible = false;
  play.addChild(bobber);

  const splashFrames = SPLASH.map((rows) => tex(paintGrid(rows)));
  const splash = new Sprite(splashFrames[0]);
  splash.visible = false;
  play.addChild(splash);

  // Reeds in front of everything, framing the view at both edges (of the
  // whole width, not the play area).
  const reedHeight = 110;
  const reedFrames = {
    left: paintReeds(26, reedHeight, 'left', rand).map(tex),
    right: paintReeds(26, reedHeight, 'right', rand).map(tex),
  };
  const reedsLeft = new Sprite(reedFrames.left[0]);
  reedsLeft.position.set(0, SIZE - reedHeight);
  const reedsRight = new Sprite(reedFrames.right[0]);
  reedsRight.position.set(SIZE - 26, SIZE - reedHeight);
  app.stage.addChild(reedsLeft, reedsRight);

  // Rain, snow and the light of the hour, over everything (R7.5).
  const skyLayer = new Container();
  app.stage.addChild(skyLayer);
  const sky = createSky(shadowLayer, skyLayer, SIZE, rand);

  // Dice, over everything: they're on the desk, not in the picture, so the
  // light of the hour doesn't tint them (D99).
  const dice = createDice((s) => app.stage.addChild(s), rand);

  /**
   * Widens the scene to `next` pixels: the play area in the middle, strips
   * of scenery either side.
   * @param {number} next
   */
  function setWidth(next) {
    next = Math.max(SIZE, Math.round(next));
    if (next === width) return;
    width = next;
    offset = Math.floor((width - SIZE) / 2);
    app.renderer.resize(width, SIZE);
    play.position.x = offset;
    reedsRight.position.x = width - 26;
    sky.setWidth(width);
    dice.setSize(width, SIZE);
    paintWidth();
  }
  let lastFrame = 0;

  // ---------- What the scene remembers between frames ----------

  /** Where the current cast lands. */
  let target = { x: SIZE / 2, y: 120 };
  /** @type {{ x: number, y: number, born: number, life: number, maxRx: number }[]} */
  let rippleList = [];
  let splashAt = -Infinity;
  /** @type {Cast['phase'] | null} */
  let lastPhase = null;
  let nextAmbientRipple = 0;
  /** When the current 'done' phase began, for the reel-in. */
  let doneAt = 0;
  /** The cast whose landing has been shown, so each lands with one plop. */
  let landedCastAt = -1;

  /**
   * Chooses where the next cast lands: where the player tapped, if they did,
   * kept within the open water; otherwise somewhere in the middle.
   * @param {{ x: number, y: number } | null} point  In scene pixels.
   */
  function aimAt(point) {
    const p = point ?? { x: 70 + rand() * (SIZE - 140), y: 70 + rand() * 90 };
    target = {
      x: Math.round(Math.min(Math.max(p.x, 40), SIZE - 40)),
      y: Math.round(Math.min(Math.max(p.y, 30), shoreY(p.x, SIZE) - 30)),
    };
  }

  /**
   * The features on the water now.
   * @param {SceneFeature[]} list
   */
  function setFeatures(list) {
    features = list;
  }

  /** @param {number} now */
  function drawFeatures(now) {
    featureLayer.clear();
    const live = new Set();
    features.forEach((f, i) => {
      // Known by when it appeared, so it glides between casts instead of jumping.
      const key = `${f.id}@${f.born}`;
      live.add(key);
      const at = shownAt.get(key) ?? { x: f.x, y: f.y };
      at.x += (f.x - at.x) * 0.04;
      at.y += (f.y - at.y) * 0.04;
      shownAt.set(key, at);
      const cx = Math.round(at.x);
      const cy = Math.round(at.y);
      const far = cy < FAR_LINE;
      const phase = i * 1.7;
      if (f.kind === 'school') {
        // Fish backs milling about; fewer as it is fished out.
        const count = 2 + f.uses * 2;
        for (let n = 0; n < count; n++) {
          const a = phase + n * 2.4 + now / (1400 + n * 90);
          const r = (far ? 4 : 6) + ((n * 3) % (far ? 5 : 8));
          const x = Math.round(cx + Math.cos(a) * r);
          const y = Math.round(cy + Math.sin(a) * r * 0.4);
          featureLayer.rect(x, y, far ? 2 : 3, 1).fill({ color: PALETTE.shadow, alpha: 0.7 });
        }
      } else if (f.kind === 'big-fish') {
        // One long shadow, sliding to and fro just under the surface.
        const x = Math.round(cx + Math.sin(now / 2200 + phase) * 4);
        const w = far ? 11 : 16;
        featureLayer.rect(x - w / 2, cy, w, 2).fill({ color: PALETTE.shadow, alpha: 0.75 });
        featureLayer.rect(x - w / 2 + 2, cy - 1, w - 5, 1).fill({ color: PALETTE.shadow, alpha: 0.6 });
        featureLayer.rect(x + w / 2, cy - 1, 2, 4).fill({ color: PALETTE.shadow, alpha: 0.6 });
      } else if (f.kind === 'curious') {
        // A glint that comes and goes.
        const on = Math.floor(now / 300 + phase) % 4;
        if (on < 2) {
          featureLayer.rect(cx, cy - 1, 1, 3).fill({ color: PALETTE.foam });
          featureLayer.rect(cx - 1, cy, 3, 1).fill({ color: PALETTE.foam });
        } else if (on === 2) featureLayer.rect(cx, cy, 1, 1).fill({ color: PALETTE.foam });
      } else {
        // A disturbance: rings that pulse out of step with the water.
        const r = 3 + (Math.floor(now / 180 + phase) % 6);
        for (let a = 0; a < 16; a++) {
          const t = (a / 16) * Math.PI * 2;
          featureLayer.rect(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r * 0.4), 1, 1).fill({ color: PALETTE.eerie, alpha: 0.8 });
        }
      }
    });
    for (const key of shownAt.keys()) if (!live.has(key)) shownAt.delete(key);
  }

  /** @param {number} x @param {number} y @param {number} now @param {number} maxRx */
  function addRipple(x, y, now, maxRx) {
    rippleList.push({ x, y, born: now, life: 900 + maxRx * 40, maxRx });
  }

  /**
   * Draws one frame for the cast as it stands at `now`.
   * @param {Cast} cast
   * @param {number} now  Same clock as the cast's times (performance.now()).
   */
  function update(cast, now) {
    const far = target.y < FAR_LINE;
    const phaseChanged = cast.phase !== lastPhase;
    lastPhase = cast.phase;

    sky.update(now, lastFrame ? now - lastFrame : 16);
    lastFrame = now;
    dice.update(now);

    // Waves shimmer by flipping frames now and then, faster in the wind; reeds
    // sway together, faster in the wind too.
    const windy = 1 + sky.wind() * 0.5;
    for (const w of waves) {
      if (now >= w.next) {
        w.frame = 1 - w.frame;
        w.sprite.texture = w.frames[w.frame];
        w.next = now + (700 + rand() * 1800) / windy;
      }
    }
    const sway = Math.floor((now * windy) / 900) % 2;
    reedsLeft.texture = reedFrames.left[sway];
    reedsRight.texture = reedFrames.right[sway];

    drawFeatures(now);

    // ---------- The bobber ----------
    let bx = target.x;
    let by = target.y;
    let dipped = false;
    let shown = cast.phase !== 'idle';

    if (cast.phase === 'waiting' || cast.phase === 'bite' || cast.phase === 'done') {
      const flight = cast.recast ? 1 : Math.min((now - cast.castAt) / FLIGHT_MS, 1);
      if (flight < 1) {
        // A thrown arc from the rod to the target.
        bx = ROD_TIP.x + (target.x - ROD_TIP.x) * flight;
        by = ROD_TIP.y + (target.y - ROD_TIP.y) * flight - Math.sin(flight * Math.PI) * 60;
      } else if (cast.phase === 'waiting') {
        if (landedCastAt !== cast.castAt) {
          // Just landed: a plop (not for a recast, which never left the water).
          landedCastAt = cast.castAt;
          if (!cast.recast) addRipple(target.x, target.y, now, far ? 6 : 9);
          nextAmbientRipple = now + 1800;
        }
        by += Math.floor(now / 650) % 2; // a slow one-pixel bob
        if (now >= nextAmbientRipple) {
          addRipple(target.x, target.y, now, far ? 4 : 6);
          nextAmbientRipple = now + 2200 + rand() * 1500;
        }
      }
    }

    if (cast.phase === 'bite') {
      if (phaseChanged) {
        splashAt = now;
        for (let i = 0; i < 3; i++) addRipple(target.x, target.y, now + i * 160, far ? 10 : 15);
      }
      dipped = true;
      by += Math.floor(now / 70) % 2; // tugged about
    }

    if (cast.phase === 'done') {
      if (phaseChanged) doneAt = now;
      const t = Math.min((now - doneAt) / 350, 1);
      const result = cast.outcome.result;
      // Only a missed splash leaves the bobber out: the line goes out again
      // where it lies (D64). Everything else reels in, a fish that got away too.
      if (result !== 'missed' || cast.reeledIn) {
        // Reeled in towards the rod.
        bx = target.x + (ROD_TIP.x - target.x) * t;
        by = target.y + (ROD_TIP.y - target.y) * t;
        shown = t < 1;
      } else {
        // Missed: the bobber pops back up and settles.
        by += Math.floor(now / 650) % 2;
      }
    }

    bobber.visible = shown;
    if (shown) {
      bobber.texture = dipped
        ? far
          ? bobberTextures.farDipped
          : bobberTextures.nearDipped
        : far
          ? bobberTextures.far
          : bobberTextures.near;
      // Anchored at the float's waterline (a dipped bobber's whole sprite is
      // above it), snapped to whole pixels (R7.3).
      const waterline = Math.min(far ? WATERLINE.far : WATERLINE.near, bobber.texture.height);
      bobber.position.set(Math.round(bx - bobber.texture.width / 2), Math.round(by - waterline));
    }

    // ---------- The line, rod tip to bobber ----------
    line.clear();
    if (shown) {
      line
        .moveTo(ROD_TIP.x, ROD_TIP.y)
        .lineTo(Math.round(bx), Math.round(by - (far ? 3 : 4)))
        .stroke({ width: 1, color: PALETTE.line, alpha: 0.55 });
    }

    // ---------- Splash ----------
    const splashFrame = Math.floor((now - splashAt) / 90);
    splash.visible = splashFrame >= 0 && splashFrame < splashFrames.length;
    if (splash.visible) {
      splash.texture = splashFrames[splashFrame];
      splash.position.set(Math.round(target.x - splash.texture.width / 2), Math.round(target.y - 15));
    }

    // ---------- Ripples: rings that spread and fade, flatter further out ----------
    rippleList = rippleList.filter((r) => now - r.born < r.life);
    ripples.removeChildren();
    const squash = far ? 0.3 : 0.42;
    for (const r of rippleList) {
      const age = (now - r.born) / r.life;
      if (age < 0) continue;
      const rx = Math.max(2, Math.round(r.maxRx * age));
      const ry = Math.max(1, Math.round(rx * squash));
      const s = new Sprite(ring(rx, ry));
      s.position.set(Math.round(r.x - rx), Math.round(r.y - ry + 1));
      s.alpha = age < 0.6 ? 1 : 0.5;
      ripples.addChild(s);
    }
  }

  return {
    app,
    aimAt,
    update,
    setFeatures,
    setWorld: sky.setWorld,
    /**
     * Rolls dice across the scene (D99), to rest in the play area's lower
     * middle on the numbers given; the fish's (6.8) in its upper middle.
     * @param {{ value: number, kept: boolean, crit?: boolean, fish?: boolean }[]} values
     * @param {number} now
     * @returns {{ settled: number, gone: number, points: { x: number, y: number }[] }}  Times, and where each die stops in the play area's pixels.
     */
    rollDice(values, now) {
      const out = dice.roll(values, { x: offset + SIZE / 2, y: 196 }, now, { x: offset + SIZE / 2, y: 64 });
      return { ...out, points: out.points.map((p) => ({ x: p.x - offset, y: p.y })) };
    },
    /** Takes any dice away at once. */
    clearDice: dice.clear,
    /**
     * How the bobber looks: the equipped bobber item's colours, or the
     * sketch's red feather (D83). Repainted only when it changes.
     * @param {import('./sprites.js').BobberLook | null} look
     */
    setBobber(look) {
      const key = JSON.stringify(look);
      if (key === bobberLook) return;
      bobberLook = key;
      // For tools/verify.mjs, which can't read a WebGL canvas back.
      canvas.dataset.bobber = key;
      const old = bobberTextures;
      bobberTextures = paintBobber(look);
      bobber.texture = bobberTextures.near;
      for (const t of Object.values(old)) t.destroy(true);
    },
    /**
     * Turns a pointer position on the page into scene pixels.
     * @param {number} clientX @param {number} clientY
     */
    toScene(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * width - offset,
        y: ((clientY - rect.top) / rect.height) * SIZE,
      };
    },
    /**
     * Turns scene pixels into a position on the page.
     * @param {{ x: number, y: number }} point
     */
    toClient(point) {
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + ((point.x + offset) / width) * rect.width, y: rect.top + (point.y / SIZE) * rect.height };
    },
    /** CSS pixels per scene pixel, for drawing page elements at the scene's scale (D71). */
    pixelScale() {
      return canvas.getBoundingClientRect().height / SIZE;
    },
    /** The scene's width in pixels before scaling, strips included. */
    width: () => width,
    /**
     * Sizes the scene to the space given (R7.2, D10, D93): the largest whole
     * number of *device* pixels per scene pixel at which the 256-pixel play
     * area fits, then as wide as the space allows at that scale, up to
     * `widest`. A whole multiple in CSS pixels isn't enough: at a
     * devicePixelRatio of 2.625 it still smears.
     * @param {number} maxCssWidth
     * @param {number} maxCssHeight
     * @param {number} [widest]  Up to MAX_WIDTH; the art sheet picks its own.
     * @returns {number} The scale, in device pixels per scene pixel.
     */
    fit(maxCssWidth, maxCssHeight, widest = MAX_WIDTH) {
      const dpr = window.devicePixelRatio || 1;
      const scale = Math.max(1, Math.floor((Math.min(maxCssWidth, maxCssHeight) * dpr) / SIZE));
      setWidth(Math.min(widest, Math.floor((maxCssWidth * dpr) / scale)));
      canvas.style.width = `${(width * scale) / dpr}px`;
      canvas.style.height = `${(SIZE * scale) / dpr}px`;
      return scale;
    },
  };
}
