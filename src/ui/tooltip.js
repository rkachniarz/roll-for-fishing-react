// @ts-check
// One tooltip at a time, WoW style (D29): the name in its rarity colour, then
// plain lines. A tap on a link or a slot shows it; a tap anywhere else, or a
// second tap on the same thing, closes it. It belongs to the layer over the
// scene (D71), so it never casts.

/**
 * @typedef {Object} Tip
 * @property {string} title
 * @property {string} [colour]  The title's colour; plain text if missing.
 * @property {{ text: string, tone?: 'flavor' | 'good' | 'bad' }[]} lines
 */

/** @type {HTMLElement | null} */
let box = null;
/** @type {HTMLElement | null} */
let anchor = null;

/**
 * @param {HTMLElement} at  What it belongs to: it opens above it, or below if there's no room.
 * @param {Tip} tip
 */
export function showTip(at, tip) {
  if (anchor === at) {
    hideTip();
    return;
  }
  hideTip();
  box = document.createElement('div');
  box.className = 'tip';
  box.setAttribute('role', 'tooltip');
  const title = document.createElement('p');
  title.className = 'tip-title';
  title.textContent = tip.title;
  if (tip.colour) title.style.color = tip.colour;
  box.append(
    title,
    ...tip.lines.map((line) => {
      const p = document.createElement('p');
      p.textContent = line.text;
      if (line.tone) p.className = `tip-${line.tone}`;
      return p;
    }),
  );
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

document.addEventListener(
  'pointerdown',
  (e) => {
    const target = /** @type {Node} */ (e.target);
    if (box && !box.contains(target) && !anchor?.contains(target)) hideTip();
  },
  true,
);
document.addEventListener('keydown', (e) => e.key === 'Escape' && hideTip());
