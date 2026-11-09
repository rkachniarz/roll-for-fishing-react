// @ts-check
// Item and fish icons, 32×32 (D98; the first ones were drawn at 16 and are
// shown doubled until redrawn), written as code like the scene's sprites
// (docs/decisions.md, D9). Every kind has a default icon, used by anything
// whose own art doesn't exist yet (docs/spec.md, R15.5). Content names an icon
// with its `icon` field; an unknown name falls back to the default too.

import { content } from '../generated/content.js';

/** The icons' own colours. */
export const KEYS = {
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
  // The button row (R16.4), in the owner's sketch's colours.
  V: '#c9b8ea', // book cover
  v: '#9a55b8', // book spine
  M: '#f6ecbf', // map parchment
  m: '#e2c46a', // map edge
  T: '#2f9e4f', // trees
  L: '#8fd3ef', // water
  R: '#e0393b', // map marker
  I: '#b9bec2', // bucket
  i: '#8c9296', // bucket, shaded
  A: '#d9a07e', // bag leather
  a: '#b57a58', // bag leather, shaded
  // Weather: no dark outlines, since these sit on the dark page.
  Y: '#ffe23d', // sun
  O: '#f1edcf', // moon
  C: '#eef3f6', // cloud
  D: '#b3c0c8', // cloud, shaded
  E: '#7b8992', // rain cloud
  r: '#5bb4ff', // rain
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

const CLOUD = [
  '.....CCCC.......',
  '....CCCCCC.CC...',
  '..CCCCCCCCCCCC..',
  '.CCCCCCCCCCCCCC.',
  '.CCCCCCCCCCCCCC.',
  '..DDDDDDDDDDDD..',
];
const RAIN_CLOUD = CLOUD.map((row) => row.replace(/D/g, 'E').replace(/C/g, 'D'));
const PARTLY = [
  '..........Y.....',
  '.......Y..Y..Y..',
  '........YYYYY...',
  '.......YYYYYYY..',
  '....CCCCYYYYYYYY',
  '...CCCCCCYYYYY..',
  '.CCCCCCCCCCYYY..',
  'CCCCCCCCCCCCC...',
  'CCCCCCCCCCCCC...',
  '.DDDDDDDDDDD....',
];

/** The button row and the weather (R16.4). */
Object.assign(ICONS, {
  // A stand-in until portraits exist.
  'ui/portrait': [
    '.....kkkkkk.....',
    '....kkkkkkkk....',
    '....kkkkkkkk....',
    '...kkwkkkkwkk...',
    '...kkkkkkkkkk...',
    '...kkkwkkwkkk...',
    '....kkkwwkkk....',
    '....kkkkkkkk....',
    '.....kkkkkk.....',
    '....kkkkkkkk....',
    '...kkkkkkkkkk...',
    '..kkkkkkkkkkkk..',
    '.kkkkkkkkkkkkkk.',
    'kkkkkkkkkkkkkkkk',
  ],
  'ui/journal': [
    '....kkkkkkkkkk..',
    '...kVVVVVVVVvk..',
    '..kkkkkkkkkkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkk...',
    '..kkkkkkkkkk....',
  ],
  'ui/map': [
    '.mmmmmm..mmmmmm.',
    '.mMMMMMmmMMMMMm.',
    '.mMMMMMMMMTMTMm.',
    '.mMMMMMMMTTTTTm.',
    '.mMMMMMMMMkMkMm.',
    '.mMMMMMMMMMLLMm.',
    '.mMMMMMMMLLLLLm.',
    '.mMMMRMMMLLLLMm.',
    '.mMMRRRMMMLLMMm.',
    '.mMMMkMMMMMMMMm.',
    '.mMMMMMMMMMMMMm.',
    '.mMMMMMMmmMMMMm.',
    '.mmmmmmm..mmmmm.',
  ],
  'ui/bucket': [
    '....kkkkkkkk....',
    '...k........k...',
    '..k..........k..',
    '.kkkkkkkkkkkkkk.',
    '.kLLLLLLLLLLLLk.',
    '.kLLLkkLLLLkLLk.',
    '.kLLkLLkkkkkLLk.',
    '.kLLLkkLLLLkLLk.',
    '..kIIIIIIIIIIk..',
    '..kIIIIIIIIIik..',
    '..kIIIIIIIIIik..',
    '...kIIIIIIIIk...',
    '...kIIIIIIIik...',
    '...kIIIIIIIik...',
    '....kkkkkkkk....',
  ],
  'ui/bag': [
    '......kkkk......',
    '.....k....k.....',
    '....kkkkkkkk....',
    '...kAAAAAAAAk...',
    '..kAAAAAAAAAAk..',
    '..kaaaaaaaaaak..',
    '..kAAAAkkAAAAk..',
    '..kAAAAkykAAAk..',
    '..kAAAAkkkAAAk..',
    '..kAAAAAAAAAAk..',
    '..kAAAAAAAAAAk..',
    '..kaAAAAAAAAak..',
    '...kkkkkkkkkk...',
  ],
  'ui/menu': [
    '..kkkkkkkkkkkk..',
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
    '..kkkkkkkkkkkk..',
  ],
  'weather/clear-day': [
    '.......Y........',
    '..Y....Y....Y...',
    '...Y.......Y....',
    '......YYY.......',
    '.....YYYYY......',
    'YY..YYYYYYY..YY.',
    '.....YYYYY......',
    '......YYY.......',
    '...Y.......Y....',
    '..Y....Y....Y...',
    '.......Y........',
  ],
  'weather/clear-night': [
    '.....OOOO.......',
    '...OOOO.........',
    '..OOOO..........',
    '..OOO...........',
    '.OOOO...........',
    '.OOOO...........',
    '.OOOOO..........',
    '..OOOOO......O..',
    '..OOOOOOOOOOOO..',
    '...OOOOOOOOOO...',
    '.....OOOOOO.....',
  ],
  'weather/partly-day': PARTLY,
  'weather/partly-night': PARTLY.map((row) => row.replace(/Y/g, 'O')),
  'weather/overcast': [
    '.........EEEE...',
    '.......EEEEEEE..',
    '.....DDDDEEEEEE.',
    '....DDDDDDEDDEE.',
    '..DDDDDDDDDDDDE.',
    '.DDDDDDDDDDDDDD.',
    '.DDDDDDDDDDDDDD.',
    '..EEEEEEEEEEEE..',
  ],
  'weather/rain': [...RAIN_CLOUD, '................', '..r...r...r.....', '.r...r...r......', '................', '....r...r...r...', '...r...r...r....'],
  'weather/storm': [...RAIN_CLOUD, '.......YY.......', '.r...rYY..r.r...', 'r...rYYYY.r.r...', '.....r.YY.......', '...r..YY..r.r...', '..r...Y..r.r....'],
  'weather/snow': [...RAIN_CLOUD, '................', '..C....C....C...', '................', '.....C....C.....', '................', '...C....C....C..'],
  'weather/wind': [
    '..........CCC...',
    '.............C..',
    'CCCCCCCCCCCCC...',
    '................',
    'CCCCCCCCCCCCCCC.',
    '................',
    'CCCCCCCCCCC.....',
    '............C...',
    '..........CC....',
  ],
});

/** Every icon above was drawn at 16×16, before D98: shown doubled until redrawn at 32. */
const DRAWN_AT_16 = new Set(Object.keys(ICONS));

/** Icons drawn at 32×32 (D98). Fish are tilted to fill the square. */
Object.assign(ICONS, {
  // The common carp, from a photo (docs/design/photo-carp.jpg, D97).
  'fish/carp': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '....k..kkkkkk...................',
    '.kkkekkOOOOOOkk.................',
    'kLLexOOODOoOODOkkkkk............',
    'kLgoooooDoooooOOFFFfk...........',
    '.kcggooDDoOoOoOODFFFk...........',
    '..kccggDGGooooooOfffk...........',
    '...kccDgGGGGoOoOoOFffk..........',
    '....kDDFggGGGoooooOFFfk.........',
    '.....kcfFFFgGGOoOoOOFFFk........',
    '......kfffFggGGGGoooOFFk........',
    '.......kkcccgGgGoOoOoOffk.......',
    '.........kccgggGGGooooffk.......',
    '..........kcfcgggGGoGoOOkkkkkkk.',
    '...........kRRcccgggGooofffffFFk',
    '............kckkccggGGoGFFFfffk.',
    '.............k..kkrrRGGFfFFFFk..',
    '..................krRkkFrrfkk...',
    '..................kcRk.krrrk....',
    '...................kk...kRRck...',
    '.........................kRRk...',
    '..........................kRk...',
    '...........................k....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
});

/**
 * Colours an icon keeps to itself, over KEYS: in that icon, these letters
 * mean these colours. Lets a detailed icon have its own palette without
 * running the shared one out of letters.
 * @type {Record<string, Record<string, string>>}
 */
export const OWN_KEYS = {
  'fish/carp': {
    D: '#3f4426', // back, scale rims
    O: '#6e7043', // back
    o: '#8c8a55', // flank
    G: '#ae9f5e', // gold flank
    g: '#cbbd80', // lower flank
    c: '#e6dfc0', // belly
    F: '#c4a86e', // fin
    f: '#8c7349', // fin ray
    R: '#cf5427', // red fin
    r: '#e2883c', // red fin, lighter
    L: '#d9a25a', // lips
    e: '#e9e6de', // eye ring
    x: '#141414', // eye
  },
};

/**
 * The palette an icon is drawn with.
 * @param {string} name
 */
export const iconKeys = (name) => ({ ...KEYS, ...(OWN_KEYS[name] ?? {}) });

/** WoW's rarity colours (D49), for names and icon borders. */
export const RARITY_COLOURS = {
  poor: '#9d9d9d',
  common: '#ffffff',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000',
};

/** An icon's side, in pixels (D98). */
const SIZE = 32;

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
 * The weather's icon (R16.4), from its levels: snow or rain first, then
 * cloud, then wind. A clear sky shows the sun, or the moon after dark. Snow
 * falls when it is as cold as the scene's snow (src/scene/sky.js).
 * @param {{ temperature: number, wind: number, clouds: number, precipitation: number }} weather
 * @param {boolean} dark  Night or evening.
 */
export function weatherIcon(weather, dark) {
  if (weather.precipitation >= 2) {
    if (weather.temperature <= 2) return 'weather/snow';
    return weather.precipitation >= 4 ? 'weather/storm' : 'weather/rain';
  }
  if (weather.clouds >= 4) return 'weather/overcast';
  if (weather.clouds >= 2) return dark ? 'weather/partly-night' : 'weather/partly-day';
  if (weather.wind >= 4) return 'weather/wind';
  return dark ? 'weather/clear-night' : 'weather/clear-day';
}

/**
 * A 32×32 canvas with the icon centred on it (D98). An icon drawn at 16 is
 * doubled, each pixel a 2×2 block, so it stays sharp.
 * @param {string} name
 */
export function paintIcon(name) {
  if (!ICONS[name]) name = 'default/junk';
  const rows = ICONS[name];
  const keys = iconKeys(name);
  const zoom = DRAWN_AT_16.has(name) ? 2 : 1;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const top = Math.floor((SIZE / zoom - rows.length) / 2);
  rows.forEach((row, y) => {
    const left = Math.floor((SIZE / zoom - row.length) / 2);
    [...row].forEach((key, x) => {
      if (key === '.') return;
      ctx.fillStyle = keys[key];
      ctx.fillRect((left + x) * zoom, (top + y) * zoom, zoom, zoom);
    });
  });
  return canvas;
}
