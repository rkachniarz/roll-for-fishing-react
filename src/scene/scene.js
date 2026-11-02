// @ts-check
// The fishing view (docs/spec.md, R7): a square of pixel art, drawn at its
// native size and scaled up by whole device pixels only. It animates whatever
// phase the cast is in and never changes the cast itself - the engine doesn't
// wait for it (docs/decisions.md, D7).

import { Application, Container, Graphics, Sprite, Texture, TextureStyle } from 'pixi.js';
import {
  BOBBER,
  BOBBER_DIPPED,
  BOBBER_FAR,
  BOBBER_FAR_DIPPED,
  PALETTE,
  SPLASH,
  WATERLINE,
  WAVES,
  paintBackdrop,
  paintGrid,
  paintReeds,
  paintRing,
  shoreY,
} from './sprites.js';

/** The scene's side in pixels before scaling (R7.2). */
export const SIZE = 256;

/** How long the bobber is in the air after a cast. */
const FLIGHT_MS = 450;
/** Casts landing above this line use the far-band sprites. */
const FAR_LINE = 95;
/** Where the line comes from: the rod, just below the bottom edge. */
const ROD_TIP = { x: SIZE / 2, y: SIZE + 6 };

/**
 * The cast as the scene sees it. `recast`: the line counts as cast again after
 * a missed splash, with the bobber still where it was (D64). `reeledIn`: a
 * missed splash after which the line comes in.
 * @typedef {import('../engine/cast.js').Cast & { recast?: boolean, reeledIn?: boolean }} Cast
 */

/** The open water a cast may land on, in scene pixels: clear of the edges and the shore. */
export const WATER = { x0: 40, y0: 30, x1: SIZE - 40, y1: 0 };
WATER.y1 = Math.min(...Array.from({ length: WATER.x1 - WATER.x0 + 1 }, (_, i) => shoreY(WATER.x0 + i, SIZE))) - 30;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {() => number} rand  Uniform [0, 1), for cosmetic variety only.
 */
export async function createScene(canvas, rand) {
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

  const backdrop = new Sprite(tex(paintBackdrop(SIZE, rand)));
  app.stage.addChild(backdrop);

  // Waves: many small pale ones far out, a few big ones close in.
  const waveLayer = new Container();
  app.stage.addChild(waveLayer);
  /** @type {{ sprite: Sprite, frames: Texture[], next: number, frame: number }[]} */
  const waves = [];
  const waveBands = [
    { frames: WAVES.far, count: 18, top: 6, bottom: 80 },
    { frames: WAVES.mid, count: 12, top: 85, bottom: 160 },
    { frames: WAVES.near, count: 7, top: 165, bottom: shoreY(0, SIZE) - 10 },
  ];
  for (const band of waveBands) {
    const frames = band.frames.map((rows) => tex(paintGrid(rows)));
    for (let i = 0; i < band.count; i++) {
      const sprite = new Sprite(frames[0]);
      sprite.position.set(
        Math.floor(rand() * (SIZE - 24)) + 8,
        Math.floor(band.top + rand() * (band.bottom - band.top)),
      );
      waveLayer.addChild(sprite);
      waves.push({ sprite, frames, next: rand() * 2000, frame: 0 });
    }
  }

  const ripples = new Container();
  app.stage.addChild(ripples);
  /** @type {Map<string, Texture>} */
  const ringCache = new Map();
  /** @param {number} rx @param {number} ry */
  function ring(rx, ry) {
    const key = `${rx}x${ry}`;
    if (!ringCache.has(key)) ringCache.set(key, tex(paintRing(rx, ry, PALETTE.ripple)));
    return /** @type {Texture} */ (ringCache.get(key));
  }

  const line = new Graphics();
  app.stage.addChild(line);

  const bobberTextures = {
    near: tex(paintGrid(BOBBER)),
    nearDipped: tex(paintGrid(BOBBER_DIPPED)),
    far: tex(paintGrid(BOBBER_FAR)),
    farDipped: tex(paintGrid(BOBBER_FAR_DIPPED)),
  };
  const bobber = new Sprite(bobberTextures.near);
  bobber.visible = false;
  app.stage.addChild(bobber);

  const splashFrames = SPLASH.map((rows) => tex(paintGrid(rows)));
  const splash = new Sprite(splashFrames[0]);
  splash.visible = false;
  app.stage.addChild(splash);

  // Reeds in front of everything, framing the view at both edges.
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

    // Waves shimmer by flipping frames now and then; reeds sway together.
    for (const w of waves) {
      if (now >= w.next) {
        w.frame = 1 - w.frame;
        w.sprite.texture = w.frames[w.frame];
        w.next = now + 700 + rand() * 1800;
      }
    }
    const sway = Math.floor(now / 900) % 2;
    reedsLeft.texture = reedFrames.left[sway];
    reedsRight.texture = reedFrames.right[sway];

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
      if (result === 'caught' || result === 'landed' || result === 'too-early' || cast.reeledIn) {
        // Reeled in towards the rod.
        bx = target.x + (ROD_TIP.x - target.x) * t;
        by = target.y + (ROD_TIP.y - target.y) * t;
        shown = t < 1;
      } else {
        // The fish let go: the bobber pops back up and settles.
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
    /**
     * Turns a pointer position on the page into scene pixels.
     * @param {number} clientX @param {number} clientY
     */
    toScene(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * SIZE,
        y: ((clientY - rect.top) / rect.height) * SIZE,
      };
    },
  };
}

/**
 * Sizes the canvas on the page to the largest whole multiple of SIZE, counted
 * in device pixels, that fits the space given (R7.2). A whole multiple in CSS
 * pixels isn't enough: at a devicePixelRatio of 2.625 it still smears.
 * @param {HTMLCanvasElement} canvas
 * @param {number} maxCssWidth
 * @param {number} maxCssHeight
 * @returns {number} The scale, in device pixels per scene pixel.
 */
export function fitCanvas(canvas, maxCssWidth, maxCssHeight) {
  const dpr = window.devicePixelRatio || 1;
  const scale = Math.max(1, Math.floor((Math.min(maxCssWidth, maxCssHeight) * dpr) / SIZE));
  const css = `${(SIZE * scale) / dpr}px`;
  canvas.style.width = css;
  canvas.style.height = css;
  return scale;
}
