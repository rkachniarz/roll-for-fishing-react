// @ts-check
// Perks (docs/spec.md, R6.3; D96): what each level offers, what the character
// has taken, and what that adds to the game values.
//
// The save keeps only the perks taken, level -> perk id. What is owed is
// worked out from the level, so a character from before perks gets its
// picks straight away. Levels are filled in order: only the lowest owed level
// can be chosen, so the offers for a later level never depend on a choice not
// yet made.

import { content } from '../generated/content.js';
import { createRng, deriveSeed } from '../rng.js';
import { diceFor } from '../dice.js';
import { levelFor } from './state.js';

/** @typedef {import('./state.js').GameState} GameState */

/** How many universal perks a universal level offers. */
const UNIVERSAL_CHOICES = 2;

/** @param {string} id */
export function perk(id) {
  return content.perks[id];
}

/**
 * The perk ids a level offers this character. A class level offers the
 * class's perks for it (one at level 1, a passive and an active later); a
 * universal level, two universal perks drawn from a stream keyed by the
 * level, so a reload offers the same two (D96).
 * @param {GameState} state
 * @param {number} level
 * @returns {string[]}
 */
export function offers(state, level) {
  if (content.rules.levels.universal.includes(level)) {
    const held = new Set(Object.values(state.character.perks));
    const pool = Object.values(content.perks)
      .filter((p) => p.class === 'any' && !p.retired && (p.repeatable || !held.has(p.id)))
      .map((p) => p.id)
      .sort();
    const dice = diceFor(createRng(deriveSeed(state.seed, `perks-${level}`)));
    /** @type {string[]} */
    const picked = [];
    while (picked.length < UNIVERSAL_CHOICES && pool.length > 0) picked.push(pool.splice(dice.getRandomNumber(0, pool.length - 1), 1)[0]);
    return picked;
  }
  return Object.values(content.perks)
    .filter((p) => p.class === state.character.classId && p.level === level && !p.retired)
    .sort((a, b) => (a.kind === b.kind ? a.id.localeCompare(b.id) : a.kind === 'passive' ? -1 : 1))
    .map((p) => p.id);
}

/**
 * The levels reached that offer something and have no perk yet, lowest first.
 * @param {GameState} state
 */
export function owedLevels(state) {
  const level = levelFor(state.character.xp);
  /** @type {number[]} */
  const owed = [];
  for (let l = 1; l <= level; l++) if (!state.character.perks[l] && offers(state, l).length > 0) owed.push(l);
  return owed;
}

/**
 * The player takes a perk for the lowest owed level.
 * @param {GameState} state
 * @param {string} id
 * @returns {GameState}  Unchanged if that perk isn't on offer.
 */
export function takePerk(state, id) {
  const [level] = owedLevels(state);
  if (level === undefined || !offers(state, level).includes(id)) return state;
  return { ...state, character: { ...state.character, perks: { ...state.character.perks, [level]: id } } };
}

/**
 * Takes every owed perk that has no alternative (the class's level-1
 * ability), in order, stopping at the first real choice.
 * @param {GameState} state
 * @returns {{ state: GameState, taken: string[] }}
 */
export function settlePerks(state) {
  /** @type {string[]} */
  const taken = [];
  for (;;) {
    const [level] = owedLevels(state);
    if (level === undefined) break;
    const choice = offers(state, level);
    if (choice.length !== 1) break;
    state = takePerk(state, choice[0]);
    taken.push(choice[0]);
  }
  return { state, taken };
}

/**
 * The passive perks' effects, as sources for the game values.
 * @param {GameState} state
 * @returns {import('./values.js').Source[]}
 */
export function perkSources(state) {
  return Object.values(state.character.perks)
    .map((id) => content.perks[id])
    .filter((p) => p?.effects)
    .map((p) => ({ label: p.id, effects: p.effects }));
}
