// @ts-check
// One tooltip at a time, WoW style (D29): the name in its rarity colour, then
// plain lines. With a mouse it shows while the pointer is over the thing
// (D119); on a touch screen a tap shows it, and a tap anywhere else, or a
// second tap on the same thing, closes it. It belongs to the layer over the
// scene (D71), so it never casts.

import { paintIcon } from '../scene/icons.js';

/**
 * @typedef {Object} Tip
 * @property {string} title
 * @property {string} [colour]  The title's colour; plain text if missing.
 * @property {string} [icon]  An icon to show beside the words, twice its size in a slot (D119).
 * @property {{ text: string, tone?: 'flavor' | 'good' | 'bad' | 'page' }[]} lines
 */

/** @type {HTMLElement | null} */
let box = null;
/** @type {HTMLElement | null} */
let anchor = null;
/** What the last press was made with: a click doesn't say in every browser. */
let lastPointer = '';

/**
 * @param {HTMLElement} at  What it belongs to: it opens above it, or below if there's no room.
 * @param {Tip} tip
 */
export function showTip(at, tip) {
  if (anchor === at) {
    hideTip();
    return;
  }
  openTip(at, tip);
}

/**
 * Shows the tip, replacing any other; unlike `showTip`, never closes it.
 * @param {HTMLElement} at
 * @param {Tip} tip
 */
function openTip(at, tip) {
  hideTip();
  box = document.createElement('div');
  box.className = 'tip';
  box.setAttribute('role', 'tooltip');
  const title = document.createElement('p');
  title.className = 'tip-title';
  title.textContent = tip.title;
  if (tip.colour) title.style.color = tip.colour;
  const words = [
    title,
    ...tip.lines.map((line) => {
      const p = document.createElement('p');
      p.textContent = line.text;
      if (line.tone) p.className = `tip-${line.tone}`;
      return p;
    }),
  ];
  if (tip.icon) {
    const art = paintIcon(tip.icon);
    art.className = 'tip-icon';
    const text = document.createElement('div');
    text.className = 'tip-words';
    text.append(...words);
    box.classList.add('with-icon');
    box.append(art, text);
  } else {
    box.append(...words);
  }
  document.body.append(box);
  const r = at.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  const left = Math.min(Math.max(8, r.left), window.innerWidth - b.width - 8);
  const top = r.top - b.height - 6 >= 8 ? r.top - b.height - 6 : r.bottom + 6;
  box.style.left = `${Math.round(left)}px`;
  box.style.top = `${Math.round(top)}px`;
  anchor = at;
}

export function hideTip() {
  box?.remove();
  box = null;
  anchor = null;
}

/**
 * Gives an element its tooltip: on hover with a mouse, on a tap otherwise
 * (D119). A mouse click leaves it open, so a click on a slot doesn't hide
 * what the hover just showed.
 * @param {HTMLElement} el
 * @param {Tip | (() => Tip | null)} tip  A function is asked each time, for a tip that changes.
 */
export function bindTip(el, tip) {
  const get = typeof tip === 'function' ? tip : () => tip;
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || document.body.classList.contains('is-dragging')) return;
    const t = get();
    if (t) openTip(el, t);
  });
  el.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && anchor === el) hideTip();
  });
  el.addEventListener('click', (e) => {
    if (e.detail > 0 && lastPointer === 'mouse') {
      // Opened by the hover already, unless the pointer never moved onto it.
      if (anchor !== el) {
        const t = get();
        if (t) openTip(el, t);
      }
      return;
    }
    const t = get();
    if (t) showTip(el, t);
  });
}

document.addEventListener(
  'pointerdown',
  (e) => {
    lastPointer = e.pointerType;
    const target = /** @type {Node} */ (e.target);
    if (box && !box.contains(target) && !anchor?.contains(target)) hideTip();
  },
  true,
);
// A pane redrawn under the pointer takes the hovered slot with it, and no
// pointerleave comes: the tip would be left behind.
document.addEventListener('pointermove', () => {
  if (anchor && !anchor.isConnected) hideTip();
});
document.addEventListener('keydown', (e) => e.key === 'Escape' && hideTip());
