// @ts-check
// Red text near the top of the scene for what the player can't do, as WoW's
// error frame (D29, D83): "Must have a fishing pole equipped." It fades after
// a few seconds; the same message again doesn't stack, it starts over.

const MS = 2500;
const MAX = 3;

/**
 * @param {HTMLElement} box  The frame, in the layer over the scene.
 * @param {string} text
 */
export function showError(box, text) {
  for (const old of box.querySelectorAll('p')) if (old.textContent === text) old.remove();
  const line = document.createElement('p');
  line.textContent = text;
  box.append(line);
  while (box.childElementCount > MAX) box.firstElementChild?.remove();
  const fade = line.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.7 }, { opacity: 0, offset: 1 }], { duration: MS });
  const done = () => line.remove();
  fade.onfinish = done;
  fade.oncancel = done;
}
