// @ts-check
// Character creation (docs/spec.md, R6.1; DEV_PLAN 3.3): a generated name, a
// gender, a class, and stats rolled within the class's ranges, with as many
// rerolls as the player likes (D63). The rolls come from the new game's seed
// (stream `character`), so ?seed=N replays creation too.

import { content } from '../generated/content.js';

/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */

/** The classes in the order character creation lists them. */
export function classes() {
  return Object.values(content.classes)
    .filter((c) => !c.retired)
    .sort((a, b) => a.order - b.order);
}

/**
 * A name from the prototype's generator: a prefix and a suffix.
 * @param {Dice} dice
 */
export function generateName(dice) {
  const { prefixes, suffixes } = content.rules.names;
  return prefixes[dice.getRandomNumber(0, prefixes.length - 1)] + suffixes[dice.getRandomNumber(0, suffixes.length - 1)];
}

/**
 * Each stat within the class's range.
 * @param {string} classId
 * @param {Dice} dice
 * @returns {{ fishingSkill: number, fishFind: number, treasureFind: number }}
 */
export function rollStats(classId, dice) {
  const { stats } = content.classes[classId];
  /** @param {{ min: number, max: number }} r */
  const roll = (r) => dice.getRandomNumber(r.min, r.max);
  return { fishingSkill: roll(stats.fishingSkill), fishFind: roll(stats.fishFind), treasureFind: roll(stats.treasureFind) };
}

/**
 * The class's name for the character's gender, as a string key (D19).
 * @param {string} classId
 * @param {'m' | 'f'} gender
 */
export function className(classId, gender) {
  return content.classes[classId].name[gender];
}
