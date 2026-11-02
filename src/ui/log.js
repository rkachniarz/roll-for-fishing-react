// @ts-check
// The log, under the scene like WoW's chat frame (docs/spec.md, R16.5): every
// cast's lines, oldest at the top, newest at the bottom. It follows new lines
// unless the player has scrolled up to read.

/** How many lines it keeps; older ones drop off the top. */
const LIMIT = 200;

/**
 * @param {HTMLElement} root  The scrolling box.
 */
export function createLog(root) {
  return {
    /**
     * One line, from text and elements (links) in order.
     * @param {(string | Node)[]} parts
     * @param {'roll' | 'bad'} [tone]  A roll's details are quieter; a problem is red.
     */
    add(parts, tone) {
      const following = root.scrollHeight - root.scrollTop - root.clientHeight < 24;
      const line = document.createElement('p');
      line.className = tone ? `line ${tone}` : 'line';
      line.append(...parts);
      root.append(line);
      while (root.childElementCount > LIMIT) root.firstElementChild?.remove();
      if (following) root.scrollTop = root.scrollHeight;
    },
    clear() {
      root.replaceChildren();
    },
  };
}
