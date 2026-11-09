// @ts-check
// A catch is shown by its icon: it appears at the bobber, flies to the bucket
// and bags button and disappears (docs/spec.md, R16.2; D70). There is no
// reeling-in animation (D69), and the game never waits for this one (R7.6).
//
// The icon is a page element in the layer over the scene (D71), drawn at the
// scene's pixel scale so it looks part of the pixel art. It only moves, never
// scales (R7.3).

import { paintIcon } from '../scene/icons.js';
import { rarityColour } from './links.js';

const POP_MS = 250;
const FLIGHT_MS = 650;

/**
 * @param {Object} options
 * @param {string} options.icon      An icon name (icons.js).
 * @param {string} options.rarity
 * @param {{ x: number, y: number }} options.from  Page coordinates of the bobber.
 * @param {HTMLElement} options.to   Where it flies.
 * @param {number} options.scale     CSS pixels per scene pixel.
 */
export function flyIcon({ icon, rarity, from, to, scale }) {
  const canvas = paintIcon(icon);
  canvas.className = 'flying-icon';
  // About the size it flew at as a 16-pixel icon (D98): half the scene's
  // scale, rounded to whole device pixels so the 32-pixel icon stays sharp.
  const dpr = window.devicePixelRatio || 1;
  const size = (32 * Math.max(1, Math.round((scale * dpr) / 2))) / dpr;
  Object.assign(canvas.style, {
    width: `${size}px`,
    height: `${size}px`,
    left: `${Math.round(from.x - size / 2)}px`,
    top: `${Math.round(from.y - size)}px`,
    outline: `${Math.max(1, Math.round(scale))}px solid ${rarityColour(rarity)}`,
  });
  document.body.append(canvas);

  const target = to.getBoundingClientRect();
  const dx = Math.round(target.left + target.width / 2 - from.x);
  const dy = Math.round(target.top + target.height / 2 - (from.y - size / 2));
  const lift = Math.round(6 * scale);
  const animation = canvas.animate(
    [
      { transform: 'translate(0, 0)', opacity: 1, offset: 0 },
      { transform: `translate(0, ${-lift}px)`, opacity: 1, offset: POP_MS / (POP_MS + FLIGHT_MS) },
      { transform: `translate(${dx}px, ${dy}px)`, opacity: 0.2, offset: 1 },
    ],
    { duration: POP_MS + FLIGHT_MS, easing: 'ease-in' },
  );
  const done = () => canvas.remove();
  animation.onfinish = done;
  animation.oncancel = done;
}
