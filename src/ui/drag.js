// @ts-check
// Dragging items between the bags and the equipment slots (docs/spec.md,
// R8.1, R8.7; D83). A mouse drags as soon as it moves; a finger has to hold
// still for a moment first (a long-press), so a swipe still scrolls the pane.
// A tap that never became a drag stays a tap: it shows the tooltip.
//
// What can be dragged, and where to, is written on the elements:
//   data-drag="bag:3" / "equip:rod"   a source: its icon follows the pointer
//   data-drop="bag:3" / "bag:end" / "equip:rod"   a target
// The page decides what a drop does (onDrop).

import { hideTip } from './tooltip.js';

/** How long a finger holds still before it drags, in ms. */
const LONG_PRESS = 350;
/** How far a pointer may wander before a press counts as a move, in CSS px. */
const SLOP = { mouse: 4, touch: 10 };

/**
 * @typedef {Object} DragOptions
 * @property {(from: string, to: string) => void} onDrop  Called with the two data values.
 * @property {(from: string) => string[]} [targetsFor]  Drop targets to light up while dragging.
 */

/** @type {DragOptions | null} */
let options = null;
/**
 * @type {{ el: HTMLElement, from: string, id: number, x: number, y: number, mouse: boolean,
 *   timer: number | null, ghost: HTMLElement | null, over: HTMLElement | null } | null}
 */
let press = null;
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
  const el = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest?.('[data-drag]'));
  if (!el || e.button !== 0 || !options) return;
  const mouse = e.pointerType === 'mouse';
  press = { el, from: /** @type {string} */ (el.dataset.drag), id: e.pointerId, x: e.clientX, y: e.clientY, mouse, timer: null, ghost: null, over: null };
  if (!mouse) {
    const p = press;
    p.timer = window.setTimeout(() => press === p && begin(p.x, p.y), LONG_PRESS);
  }
});

document.addEventListener('pointermove', (e) => {
  if (!press || e.pointerId !== press.id) return;
  if (press.ghost) {
    move(e.clientX, e.clientY);
    return;
  }
  const far = Math.hypot(e.clientX - press.x, e.clientY - press.y) > (press.mouse ? SLOP.mouse : SLOP.touch);
  if (!far) return;
  // A mouse that moves drags; a finger that moves before the long-press is a scroll.
  if (press.mouse) begin(e.clientX, e.clientY);
  else cancel();
});

document.addEventListener('pointerup', (e) => {
  if (!press || e.pointerId !== press.id) return;
  if (press.ghost) {
    const from = press.from;
    const target = targetAt(e.clientX, e.clientY - lift());
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

// While dragging with a finger, the page mustn't scroll under it.
document.addEventListener(
  'touchmove',
  (e) => {
    if (press?.ghost && e.cancelable) e.preventDefault();
  },
  { passive: false },
);

// The click that ends a drag isn't a tap on whatever is under it.
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
  if (!press.mouse && navigator.vibrate) navigator.vibrate(15);
  move(x, y);
}

/** @param {number} x @param {number} y */
function move(x, y) {
  if (!press?.ghost) return;
  press.ghost.style.left = `${Math.round(x)}px`;
  press.ghost.style.top = `${Math.round(y - lift())}px`;
  const target = targetAt(x, y - lift());
  if (target !== press.over) {
    press.over?.classList.remove('drop-over');
    target?.classList.add('drop-over');
    press.over = target;
  }
}

/** Above a finger, so the finger doesn't hide what it carries. */
const lift = () => (press && !press.mouse ? 36 : 0);

/** @param {number} x @param {number} y */
function targetAt(x, y) {
  const el = document.elementFromPoint(x, y);
  return /** @type {HTMLElement | null} */ (el?.closest('[data-drop]') ?? null);
}

function cancel() {
  if (!press) return;
  if (press.timer !== null) clearTimeout(press.timer);
  press.ghost?.remove();
  press.el.classList.remove('drag-source');
  press.over?.classList.remove('drop-over');
  for (const el of document.querySelectorAll('.drop-ok')) el.classList.remove('drop-ok');
  document.body.classList.remove('is-dragging');
  press = null;
}
