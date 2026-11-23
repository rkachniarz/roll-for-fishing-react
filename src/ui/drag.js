// @ts-check
// Dragging items between the bags and the equipment slots with a mouse
// (docs/spec.md, R8.1, R8.7; D83), and the quick move: a right-click, or a
// long press on a touch screen, which never drags (D163). A finger that moves
// before the long press is a scroll; a tap stays a tap: it shows the tooltip.
//
// What can be dragged, and where to, is written on the elements:
//   data-drag="bag:3" / "equip:rod"   a source: its icon follows the mouse
//   data-drop="bag:3" / "bag:end" / "equip:rod"   a target
// The page decides what a drop does (onDrop), and what the quick move does (onUse).
//
// Trap: A long press or a right-click must fire no click: the click after it is swallowed, and the
// paper doll's slot list (D164) relies on it.
//  This file reads `data-drag` / `data-drop` (`bag:3`, `bag:end`, `bag:pane`, `equip:rod`) off the
//   elements; `src/main.js` decides what a drop and the quick move do (`onDrop`, `onUse` =
//   `quickMove`). Only a mouse drags (D163); a right-click, or a long press on touch, is the quick
//   move: equip, drink, or back to the bags. The long press is a timer and Android's `contextmenu`
//   both, whichever comes first, once per press (iOS may send no `contextmenu`). On a fish in the
//   bucket a long press opens the fish's options menu instead (R21.1). The hint at the foot of a
//   bag item's tooltip goes by `usingTouch()` in `src/ui/tooltip.js`.

import { hideTip } from './tooltip.js';

/**
 * How long a finger holds still for a long press, in ms. Android fires
 * contextmenu about then too; iOS may not, so the timer is the sure way.
 */
const LONG_PRESS = 500;
/** How far a pointer may wander before a press counts as a move, in CSS px. */
const SLOP = { mouse: 4, touch: 10 };

/**
 * @typedef {Object} DragOptions
 * @property {(from: string, to: string) => void} onDrop  Called with the two data values.
 * @property {(from: string) => string[]} [targetsFor]  Drop targets to light up while dragging.
 * @property {(from: string) => void} [onUse]  A right-click, or a long press on touch (D163): once per press.
 */

/** @type {DragOptions | null} */
let options = null;
/**
 * @type {{ el: HTMLElement, from: string, id: number, x: number, y: number, mouse: boolean,
 *   timer: number | null, ghost: HTMLElement | null, over: HTMLElement | null, held: boolean } | null}
 */
let press = null;
/** Whether the last press was a mouse's: a right-click doesn't start a press. */
let lastMouse = true;
/** A drag just ended: the click that follows it isn't a tap. */
let swallowClickUntil = 0;

/** @param {DragOptions} opts */
export function setupDrag(opts) {
  options = opts;
}

/** @returns {boolean} */
export const dragging = () => Boolean(press?.ghost);

document.addEventListener('pointerdown', (e) => {
  // A new press is never the tail of the last drag.
  swallowClickUntil = 0;
  lastMouse = e.pointerType === 'mouse';
  const el = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest?.('[data-drag]'));
  if (!el || e.button !== 0 || !options) return;
  const mouse = e.pointerType === 'mouse';
  press = { el, from: /** @type {string} */ (el.dataset.drag), id: e.pointerId, x: e.clientX, y: e.clientY, mouse, timer: null, ghost: null, over: null, held: false };
  if (!mouse) {
    const p = press;
    p.timer = window.setTimeout(() => press === p && hold(p), LONG_PRESS);
  }
});

// A right-click, or Android's long press: the quick move, never the browser's menu.
document.addEventListener('contextmenu', (e) => {
  const el = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest?.('[data-drag]'));
  if (!el) return;
  e.preventDefault();
  if (press && !press.mouse) hold(press);
  else if (lastMouse) options?.onUse?.(/** @type {string} */ (el.dataset.drag));
});

document.addEventListener('pointermove', (e) => {
  if (!press || e.pointerId !== press.id) return;
  if (press.ghost) {
    move(e.clientX, e.clientY);
    return;
  }
  const far = Math.hypot(e.clientX - press.x, e.clientY - press.y) > (press.mouse ? SLOP.mouse : SLOP.touch);
  if (!far) return;
  // A mouse that moves drags; a finger that moves is a scroll.
  if (press.mouse) begin(e.clientX, e.clientY);
  else cancel();
});

document.addEventListener('pointerup', (e) => {
  if (!press || e.pointerId !== press.id) return;
  if (press.ghost) {
    const from = press.from;
    const target = targetAt(e.clientX, e.clientY);
    cancel();
    swallowClickUntil = performance.now() + 400;
    if (target) options?.onDrop(from, /** @type {string} */ (target.dataset.drop));
    return;
  }
  cancel();
});

document.addEventListener('pointercancel', (e) => {
  if (press && e.pointerId === press.id) cancel();
});

// The click that ends a drag or a long press isn't a tap on whatever is under it.
document.addEventListener(
  'click',
  (e) => {
    if (performance.now() < swallowClickUntil) {
      e.stopPropagation();
      e.preventDefault();
      swallowClickUntil = 0;
    }
  },
  true,
);

/**
 * A finger held still: the quick move, once for the press, whichever of the
 * timer and contextmenu comes first (D163).
 * @param {NonNullable<typeof press>} p
 */
function hold(p) {
  if (p.held) return;
  p.held = true;
  if (p.timer !== null) clearTimeout(p.timer);
  p.timer = null;
  hideTip();
  if (navigator.vibrate) navigator.vibrate(15);
  options?.onUse?.(p.from);
}

/** @param {number} x @param {number} y */
function begin(x, y) {
  if (!press) return;
  hideTip();
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  const icon = press.el.querySelector('canvas');
  if (icon) {
    const copy = document.createElement('canvas');
    copy.width = icon.width;
    copy.height = icon.height;
    copy.getContext('2d')?.drawImage(icon, 0, 0);
    ghost.append(copy);
  }
  document.body.append(ghost);
  press.ghost = ghost;
  press.el.classList.add('drag-source');
  for (const key of options?.targetsFor?.(press.from) ?? []) {
    document.querySelector(`[data-drop="${key}"]`)?.classList.add('drop-ok');
  }
  document.body.classList.add('is-dragging');
  move(x, y);
}

/** @param {number} x @param {number} y */
function move(x, y) {
  if (!press?.ghost) return;
  press.ghost.style.left = `${Math.round(x)}px`;
  press.ghost.style.top = `${Math.round(y)}px`;
  const target = targetAt(x, y);
  if (target !== press.over) {
    press.over?.classList.remove('drop-over');
    target?.classList.add('drop-over');
    press.over = target;
  }
}

/** @param {number} x @param {number} y */
function targetAt(x, y) {
  const el = document.elementFromPoint(x, y);
  return /** @type {HTMLElement | null} */ (el?.closest('[data-drop]') ?? null);
}

function cancel() {
  if (!press) return;
  if (press.timer !== null) clearTimeout(press.timer);
  if (press.held) swallowClickUntil = performance.now() + 400;
  press.ghost?.remove();
  press.el.classList.remove('drag-source');
  press.over?.classList.remove('drop-over');
  for (const el of document.querySelectorAll('.drop-ok')) el.classList.remove('drop-ok');
  document.body.classList.remove('is-dragging');
  press = null;
}
