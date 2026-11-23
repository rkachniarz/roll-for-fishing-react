// @ts-check
// People (D187, D188): who someone is, from a seed. A person is a look
// (looks.js) with a name: their people, the list their first name comes from
// (male or female), a first name and a surname from the owner's lists
// (content/names/, imported by `npm run names`), and a role for the named
// townsfolk ("the Alchemist").
//
// Named townsfolk (content/people/) roll from their content id, so they look
// the same in every game; anything their file writes out wins over the roll,
// so a person can be handcrafted a part at a time. Strangers roll from the
// game's seed and a label of their own. The player's look is rolled the same
// way from the game's seed, then picked over in the creator, and saved with
// the character.
//
// Trap: The seed never comes from the name (D187).
//  Renaming someone would change their face. Townsfolk use their content id, which is permanent (D44).

import { content } from '../generated/content.js';
import { createRng, deriveSeed } from '../rng.js';
import { t } from '../strings.js';
import { PEOPLES, rollLook } from './looks.js';

/** @typedef {import('./looks.js').Look} Look */
/** @typedef {import('./looks.js').People} People */
/** @typedef {import('./looks.js').Sex} Sex */
/**
 * @typedef {Look & { name: string, surname: string, role?: string }} Person  `name`, `surname` and `role` are string
 *   keys (D46), read with t().
 */

/**
 * Who a stranger in town is likely to be (D188: the town lies in the human kingdom, so mostly human). Claude's
 * guess at the shares, until the world's numbers (docs/ideas.md) say otherwise.
 * @type {[People, number][]}
 */
export const TOWN_PEOPLES = [['human', 8], ['dwarf', 1], ['orc', 1]];

/** @param {[string, number][]} list @param {{ next: () => number }} rng */
function weighted(list, rng) {
  let n = rng.next() * list.reduce((sum, [, w]) => sum + w, 0);
  for (const [id, w] of list) if ((n -= w) < 0) return id;
  return list[list.length - 1][0];
}

/** A seed's own stream for one label. @param {number} seed @param {string} label */
const draw = (seed, label) => createRng(deriveSeed(seed, label));

/**
 * A whole person from a seed: their people (by the town's shares unless given), the list their name comes from,
 * their name and surname, and their look, each on a label of its own (`people`, `sex`, `name`, `surname`,
 * `face.<part>`), so new face parts never reshuffle names (D187).
 * @param {number} seed
 * @param {{ people?: People, sex?: Sex }} [given]
 * @returns {Person}
 */
export function rollPerson(seed, given = {}) {
  const people = given.people ?? /** @type {People} */ (weighted(TOWN_PEOPLES, draw(seed, 'people')));
  const sex = given.sex ?? (draw(seed, 'sex').int(2) ? 'f' : 'm');
  const names = content.names[people];
  const first = sex === 'f' ? names.female : names.male;
  return {
    ...rollLook(seed, people, sex),
    name: first[draw(seed, 'name').int(first.length)],
    surname: names.surnames[draw(seed, 'surname').int(names.surnames.length)],
  };
}

/** A named townsperson's seed: from their content id, the same in every game. @param {string} id */
export const personSeed = (id) => deriveSeed(0, `person/${id}`);

/**
 * A named townsperson (content/people/), rolled from their id, with whatever their file writes out (people, name
 * list, name, surname, any part of the look) winning over the roll (D187).
 * @param {string} id
 * @returns {Person}
 */
export function townsperson(id) {
  const p = content.people[id];
  const rolled = rollPerson(personSeed(id), { people: p.people, sex: p.sex });
  return {
    ...rolled,
    ...(p.look ?? {}),
    ...(p.name ? { name: p.name } : {}),
    ...(p.surname ? { surname: p.surname } : {}),
    ...(p.role ? { role: p.role } : {}),
  };
}

/**
 * A stranger or a patron: rolled from the game's seed and something stable about them (`label`), such as the
 * event that brings them, so they are the same person each time within one game.
 * @param {number} seed  The game's.
 * @param {string} label
 */
export function stranger(seed, label) {
  return rollPerson(deriveSeed(seed, `stranger/${label}`));
}

/**
 * The player's look for a new game, before they pick over it: their people at even odds (it's their pick, not
 * the town's shares), and the rest rolled from the game's seed. Also what an old save gets (state.js).
 * @param {number} seed  The game's.
 * @param {Sex} sex
 * @param {People} [people]
 * @returns {Look}
 */
export function playerLook(seed, sex, people) {
  const own = deriveSeed(seed, 'player');
  return rollLook(own, people ?? PEOPLES[draw(own, 'people').int(PEOPLES.length)], sex);
}

/**
 * A person's name on screen (D188): `Name the Role` for someone with a role, otherwise `Name Surname`.
 * @param {{ name: string, surname?: string, role?: string }} person
 */
export function personName(person) {
  if (person.role) return t('person.withRole', { name: t(person.name), role: t(person.role) });
  return t('person.fullName', { name: t(person.name), surname: person.surname ? t(person.surname) : '' }).trim();
}
