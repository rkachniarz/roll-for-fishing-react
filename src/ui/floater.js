// @ts-check
// A word that floats up from the bobber when the player strikes, and fades:
// "Fast strike!", "Too early!" (D82), like WoW's combat text. The log keeps
// the roll; this only says how the strike went.
//
// A page element in the layer over the scene (D71), like the catch's flight.
// The game never waits for it (R7.6).

const MS = 1100;

/**
 * @param {Object} options
 * @param {string} options.text
 * @param {'fast' | 'ok' | 'bad' | 'early'} options.tone  Sets its colour.
 * @param {{ x: number, y: number }} options.at  Page coordinates of the bobber.
 * @param {number} options.scale  CSS pixels per scene pixel.
 */
export function floatText({ text, tone, at, scale }) {
  const el = document.createElement('div');
  el.className = `floater ${tone}`;
  el.textContent = text;
  // Big enough to read at a glance, in step with the scene's pixels.
  el.style.fontSize = `${Math.round(9 * scale)}px`;
  document.body.append(el);
  const { width, height } = el.getBoundingClientRect();
  el.style.left = `${Math.round(at.x - width / 2)}px`;
  // Above where the catch's icon pops up (flight.js), so the two don't overlap.
  el.style.top = `${Math.round(at.y - height - 24 * scale)}px`;
  const rise = Math.round(14 * scale);
  const animation = el.animate(
    [
      { transform: 'translate(0, 0)', opacity: 1, offset: 0 },
      { transform: `translate(0, ${-rise / 2}px)`, opacity: 1, offset: 0.6 },
      { transform: `translate(0, ${-rise}px)`, opacity: 0, offset: 1 },
    ],
    { duration: MS, easing: 'ease-out' },
  );
  const done = () => el.remove();
  animation.onfinish = done;
  animation.oncancel = done;
}
