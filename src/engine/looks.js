// @ts-check
// How a person looks (D187, D188): the parts a face is built from, the options
// for each part per people, and the colours. A look is plain data, an
// "appearance recipe": the portrait (src/scene/faces.js) draws it, and later
// the town figures (8.14) will too. Nothing here reads content, so the content
// checks (tools/content.mjs) can use the same lists to check a recipe written
// out in content/people/.
//
// Trap: Each part is rolled on its own label of the person's seed (`face.<part>`, D187), never
// one stream for the whole face.
//  So a new part, or a new option at the end of a list, never changes the parts already rolled,
//   and the name (people.js) never moves when the face does.
//
// Trap: An option's id is what a save and a content recipe store: rename one and every look that
// named it falls back to a roll.
//  Add new options at the end of a list; the faces already rolled keep their place.

import { createRng, deriveSeed } from '../rng.js';

/** The three peoples (D188). */
export const PEOPLES = /** @type {const} */ (['human', 'dwarf', 'orc']);
/** @typedef {typeof PEOPLES[number]} People */
/** @typedef {'m' | 'f'} Sex  The list a first name comes from, male or female, as the game's genders (D19). */

/**
 * Skin colours (D188): humans the range of real human skin; orcs greens, greys and the colours real bricks come
 * in; dwarves every human and orc colour but the greens. Base colours only: the portrait works out the shade.
 * The human range is a light-to-deep ramp in ten even steps, Claude's pick, so the creator's arrows walk it in
 * order; the bricks are D188's list as Claude read it, one colour each.
 */
export const SKIN = {
  porcelain: '#f4d9c6',
  fair: '#ecc3a2',
  light: '#deab84',
  beige: '#d09a6e',
  olive: '#b98656',
  tan: '#a8724a',
  golden: '#8f6039',
  brown: '#744a2c',
  umber: '#583622',
  deep: '#3c2418',
  // Orc greens.
  moss: '#6f8f3a',
  sage: '#8ca472',
  'olive-green': '#5f7236',
  swamp: '#456a44',
  // Greys.
  ash: '#9c9b93',
  slate: '#6b7276',
  stone: '#837d76',
  // Brick colours.
  'brick-red': '#9e3f2b',
  'orange-red': '#bf5a32',
  ochre: '#c28b38',
  sandy: '#d4b074',
  clay: '#8a5b3d',
  'purple-brown': '#583236',
  'near-black': '#2f2725',
};
const HUMAN_SKIN = ['porcelain', 'fair', 'light', 'beige', 'olive', 'tan', 'golden', 'brown', 'umber', 'deep'];
const GREENS = ['moss', 'sage', 'olive-green', 'swamp'];
const GREYS = ['ash', 'slate', 'stone'];
const BRICKS = ['brick-red', 'orange-red', 'ochre', 'sandy', 'clay', 'purple-brown', 'near-black'];

/** Hair, and a dwarf's beard, which is the hair's colour. Claude's ten: the usual natural range, with grey and white for age. */
export const HAIR = {
  black: '#1f1a18',
  'dark-brown': '#3b2618',
  brown: '#6a4428',
  chestnut: '#83452a',
  auburn: '#983b22',
  ginger: '#c8662c',
  blond: '#dab65c',
  'ash-blond': '#bfae86',
  grey: '#8e8c88',
  white: '#e6e2da',
};

/** Eyes: a pixel or two at 64×64, so few and strong. Orcs' are the beast colours of fantasy. */
export const EYES = {
  brown: '#5a3a1e',
  dark: '#231a14',
  blue: '#3a6dab',
  green: '#4d7f37',
  grey: '#75838a',
  amber: '#b9832a',
  red: '#b0302a',
  yellow: '#cfb52e',
};

/** Clothing, and a hood or a hat, in strong colours so the silhouette reads (D187). */
export const CLOTHES = {
  red: '#a83232',
  blue: '#38589a',
  green: '#3d783a',
  mustard: '#c49a24',
  purple: '#6c3e8e',
  brown: '#7a5232',
  grey: '#6a6e70',
  teal: '#2c7c77',
  orange: '#c06a2a',
  black: '#2a2a2e',
  undyed: '#d6cdb4',
};

/**
 * @typedef {string | [string, number] | [string, number, number]} Option  An option's id, or [id, weight] (weight
 *   1 if left out), or [id, weight for men, weight for women]. A weight of 0 never rolls but can still be picked.
 */

/** Every option of a part, the same for each people. @param {Option[]} list */
const every = (list) => ({ human: list, dwarf: list, orc: list });

/**
 * Each part and its options per people, in the order the creator shows them. The ids are what the portrait draws
 * (src/scene/faces.js has a drawing for each) and what a recipe stores. The weights are Claude's: mostly even, so
 * the thirty-faces test bed shows every shape and twins are as rare as the lists allow.
 * @type {Record<string, Record<People, Option[]>>}
 */
export const PARTS = {
  head: {
    human: ['oval', 'round', 'long', 'square', 'heart'],
    dwarf: ['round', 'wide', 'square', 'oval'],
    orc: ['square', 'wide', 'heavy', 'long'],
  },
  skin: { human: HUMAN_SKIN, dwarf: [...HUMAN_SKIN, ...GREYS, ...BRICKS], orc: [...GREENS, ...GREYS, ...BRICKS] },
  ears: { human: ['small', 'round', 'big'], dwarf: ['small', 'round', 'big'], orc: ['pointed', 'long', 'notched'] },
  eyes: every(['dots', 'wide', 'close', 'big', 'narrow', 'sleepy']),
  eyeColour: {
    human: ['brown', 'dark', 'blue', 'green', 'grey', 'amber'],
    dwarf: ['brown', 'dark', 'blue', 'green', 'grey', 'amber'],
    orc: ['amber', 'red', 'yellow', 'dark'],
  },
  brows: every(['none', 'thin', 'thick', 'angry', 'raised', 'unibrow']),
  nose: {
    human: ['small', 'long', 'broad', 'hooked', 'button'],
    dwarf: ['big', 'broad', 'round', 'hooked', 'long'],
    orc: ['flat', 'broad', 'snout', 'small'],
  },
  mouth: every(['line', 'smile', 'frown', 'open', 'wide', 'small']),
  // Facial hair is the dwarves' alone, women's too (D188).
  beard: { human: ['none'], dwarf: ['short', 'full', 'long', 'forked', 'braids', 'wide'], orc: ['none'] },
  // Orcs have tusks (D188).
  tusks: { human: ['none'], dwarf: ['none'], orc: ['small', 'big', 'one', 'upturned'] },
  // Bald men only, unless picked: Claude's call, as baldness is mostly men's.
  hair: every([['bald', 1, 0], 'short', 'crop', 'long', 'bun', 'mohawk', 'side', 'curly', 'braids', 'tail']),
  hairColour: {
    human: Object.keys(HAIR),
    dwarf: Object.keys(HAIR),
    orc: ['black', 'dark-brown', 'brown', 'auburn', 'grey', 'white'],
  },
  // Most people bareheaded, so hair does its share of the silhouette: none weighs as the rest together.
  hat: every([['none', 6], 'cap', 'hood', 'brimmed', 'pointed', 'scarf', 'helm']),
  clothes: every(Object.keys(CLOTHES)),
};

/** The parts, in the order they are rolled and listed. */
export const PART_NAMES = Object.keys(PARTS);

/** The colour each colour part names, by part. */
export const PART_COLOURS = /** @type {Record<string, Record<string, string>>} */ ({ skin: SKIN, eyeColour: EYES, hairColour: HAIR, clothes: CLOTHES });

/**
 * @typedef {{ people: People, sex: Sex, head: string, skin: string, ears: string, eyes: string, eyeColour: string,
 *   brows: string, nose: string, mouth: string, beard: string, tusks: string, hair: string, hairColour: string,
 *   hat: string, clothes: string }} Look
 */

/**
 * A part's options for a people and a sex, with their weights.
 * @param {string} part
 * @param {People} people
 * @param {Sex} sex
 * @returns {{ id: string, weight: number }[]}
 */
export function optionsFor(part, people, sex) {
  return PARTS[part][people].map((o) => {
    if (typeof o === 'string') return { id: o, weight: 1 };
    const [id, m, f = m] = o;
    return { id, weight: sex === 'f' ? f : m };
  });
}

/**
 * One option drawn by weight.
 * @param {string} part @param {People} people @param {Sex} sex
 * @param {{ next: () => number }} rng
 */
export function rollPart(part, people, sex, rng) {
  const options = optionsFor(part, people, sex);
  const total = options.reduce((sum, o) => sum + o.weight, 0);
  let n = rng.next() * total;
  for (const o of options) {
    n -= o.weight;
    if (n < 0 && o.weight > 0) return o.id;
  }
  return /** @type {{ id: string }} */ (options.findLast((o) => o.weight > 0)).id;
}

/**
 * A whole look from a seed: each part on its own label (`face.<part>`), so the same seed always gives the same
 * face, and a part added later leaves the others as they were (D187).
 * @param {number} seed
 * @param {People} people
 * @param {Sex} sex
 * @returns {Look}
 */
export function rollLook(seed, people, sex) {
  /** @type {Record<string, string>} */
  const parts = {};
  for (const part of PART_NAMES) parts[part] = rollPart(part, people, sex, createRng(deriveSeed(seed, `face.${part}`)));
  return /** @type {Look} */ ({ people, sex, ...parts });
}

/**
 * Whether a part's option is one this people has (a beard on a human isn't).
 * @param {string} part @param {People} people @param {string} id
 */
export function fits(part, people, id) {
  return PARTS[part]?.[people]?.some((o) => (typeof o === 'string' ? o : o[0]) === id) ?? false;
}

/**
 * A look made to fit another people or sex, as the creator needs when the player picks one: each part that
 * still fits stays, the rest are rolled again from `seed`, as rollLook would.
 * @param {Look} look
 * @param {People} people
 * @param {Sex} sex
 * @param {number} seed
 * @returns {Look}
 */
export function refit(look, people, sex, seed) {
  const fresh = rollLook(seed, people, sex);
  /** @type {Record<string, string>} */
  const parts = {};
  for (const part of PART_NAMES) {
    const own = /** @type {Record<string, string>} */ (/** @type {unknown} */ (look))[part];
    parts[part] = fits(part, people, own) ? own : /** @type {Record<string, string>} */ (/** @type {unknown} */ (fresh))[part];
  }
  return /** @type {Look} */ ({ people, sex, ...parts });
}

/**
 * The next or the previous option of a part, round the list: the creator's arrows (D29).
 * @param {Look} look @param {string} part @param {1 | -1} step
 */
export function stepPart(look, part, step) {
  const ids = PARTS[part][look.people].map((o) => (typeof o === 'string' ? o : o[0]));
  const at = ids.indexOf(/** @type {Record<string, string>} */ (/** @type {unknown} */ (look))[part]);
  return { ...look, [part]: ids[(at + step + ids.length) % ids.length] };
}
