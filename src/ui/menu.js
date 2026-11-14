// @ts-check
// A small drop-down menu at the pointer, as WoW's right-click menus (R21.1):
// a fish's options in the bucket. It closes on a choice, a click elsewhere,
// or Escape.

/** @typedef {{ label: string, onClick: () => void }} MenuOption */

/** @type {HTMLElement | null} */
let open = null;

/** Closes the open menu, if any. */
export function closeMenu() {
  open?.remove();
  open = null;
}

/**
 * Opens a menu at a point on the page.
 * @param {{ x: number, y: number }} at  Client pixels.
 * @param {string} title  What the menu is for: the fish's name.
 * @param {string} colour  The title's colour (its rarity).
 * @param {MenuOption[]} options
 */
export function showMenu(at, title, colour, options) {
  closeMenu();
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.setAttribute('role', 'menu');
  const head = document.createElement('p');
  head.className = 'context-title';
  head.textContent = title;
  head.style.color = colour;
  menu.append(head);
  for (const o of options) {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'menuitem');
    b.textContent = o.label;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenu();
      o.onClick();
    });
    menu.append(b);
  }
  // Nothing under it hears the clicks.
  menu.addEventListener('pointerdown', (e) => e.stopPropagation());
  document.body.append(menu);
  // Kept on the screen.
  const box = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(4, Math.min(at.x, window.innerWidth - box.width - 4))}px`;
  menu.style.top = `${Math.max(4, Math.min(at.y, window.innerHeight - box.height - 4))}px`;
  open = menu;
}

document.addEventListener('pointerdown', () => closeMenu());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && open) {
    e.stopPropagation();
    closeMenu();
  }
}, true);
