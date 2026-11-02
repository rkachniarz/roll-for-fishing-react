// @ts-check
// Item and fish icons, 16×16, written as code like the scene's sprites
// (docs/decisions.md, D9). Every kind has a default icon, used by anything
// whose own art doesn't exist yet (docs/spec.md, R15.5). Content names an icon
// with its `icon` field; an unknown name falls back to the default too.

import { content } from '../generated/content.js';

/** The icons' own colours. */
const KEYS = {
  k: '#1b2b34', // outline
  G: '#7fb3c9', // fish
  g: '#d7e8ee', // fish belly
  w: '#ffffff',
  B: '#7a5236', // boot leather
  b: '#4e3322', // boot sole
  W: '#9a6233', // chest wood
  y: '#f2c94c', // gold
  c: '#b58a5a', // cork
  P: '#d05bd6', // potion
  p: '#9b3aa3', // potion, shaded
};

/** @type {Record<string, string[]>} */
export const ICONS = {
  'default/fish': [
    '......kkkk......',
    '....kkGGGGkk..kk',
    '...kGGGGGGGGkkGk',
    '..kGwkGGGGGGGkGk',
    '.kGGkkGGGGGGGGGk',
    '.kGGGGGGGGGGGGk.',
    '..kggggggggggkGk',
    '...kkggggggkk.kk',
    '.....kkkkkk.....',
  ],
  'default/junk': [
    '....kkkkkk......',
    '....kBBBBk......',
    '....kBBBBk......',
    '....kBBBBk......',
    '....kBBBBk......',
    '....kBBBBkkkk...',
    '...kBBBBBBBBBk..',
    '...kBBBBBBBBBBk.',
    '...kbbbbbbbbbbk.',
    '...kkkkkkkkkkkk.',
  ],
  'default/treasure': [
    '...kkkkkkkkkk...',
    '..kWWWWWWWWWWk..',
    '..kWWWWWWWWWWk..',
    '..kkkkkkkkkkkk..',
    '..kWWWWyyWWWWk..',
    '..kWWWWyyWWWWk..',
    '..kWWWWWWWWWWk..',
    '..kWWWWWWWWWWk..',
    '..kkkkkkkkkkkk..',
  ],
  'default/consumable': [
    '......kkkk......',
    '......kcck......',
    '.......kk.......',
    '......kPPk......',
    '.....kPPPPk.....',
    '....kPPPPPPk....',
    '....kPwPPPPk....',
    '....kPwPPPPk....',
    '....kPPPPPPk....',
    '....kppppppk....',
    '.....kkkkkk.....',
  ],
};

/** WoW's rarity colours (D49), for names and icon borders. */
export const RARITY_COLOURS = {
  poor: '#9d9d9d',
  common: '#ffffff',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000',
};

const SIZE = 16;

/**
 * The icon's name for a fish species or an item: its own, if that art exists,
 * otherwise its kind's default (R15.5).
 * @param {{ kind: 'fish', id: string } | { kind: 'item', id: string }} thing
 */
export function iconName(thing) {
  const entity = thing.kind === 'fish' ? content.fish[thing.id] : content.items[thing.id];
  if (entity?.icon && ICONS[entity.icon]) return entity.icon;
  return thing.kind === 'fish' ? 'default/fish' : `default/${entity?.category ?? 'junk'}`;
}

/**
 * A 16×16 canvas with the icon centred on it.
 * @param {string} name
 */
export function paintIcon(name) {
  const rows = ICONS[name] ?? ICONS['default/junk'];
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const top = Math.floor((SIZE - rows.length) / 2);
  rows.forEach((row, y) => {
    const left = Math.floor((SIZE - row.length) / 2);
    [...row].forEach((key, x) => {
      if (key === '.') return;
      ctx.fillStyle = KEYS[/** @type {keyof typeof KEYS} */ (key)];
      ctx.fillRect(left + x, top + y, 1, 1);
    });
  });
  return canvas;
}
