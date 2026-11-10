// @ts-check
// One fish, as it is rolled when the line goes out (docs/spec.md, R3.2-R3.3;
// PORTING-NOTES §1.3). The prototype's algorithm, with its defects fixed:
//
//   species (weighted, weather-adjusted) -> subname -> size band (shifted by
//   fishSizeBand, clamped) -> size in whole cm within the band's slice of the
//   species' range -> difficulty -> XP and rarity.
//
// Fixed on port: difficulty uses the band after the shift, so a bigger fish is
// harder; Medium has a name; plain relative weights replace the rescaling.

import { content } from '../generated/content.js';
import { pick } from './tables.js';

/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */

/** WoW's tiers, lowest first (D49). */
export const RARITIES = ['poor', 'common', 'uncommon', 'rare', 'epic', 'legendary'];
const EPIC = RARITIES.indexOf('epic');

/**
 * @typedef {Object} FishInstance
 * @property {string} species   A fish id.
 * @property {number} subname   Index into the species' subnames.
 * @property {number} band      Index into the size bands.
 * @property {number} size      In whole centimetres.
 * @property {number} difficulty
 * @property {number} xp
 * @property {string} rarity
 * @property {boolean} [bent]  Made bigger and rarer by Bend Reality (D106); never stacks with a plain twin.
 * @property {boolean} [greedy]  Only on the fish in a log line: it had something caught on it (D106).
 */

/** The size bands, smallest first. */
export function sizeBands() {
  return content.rules['size-bands'].bands;
}

/**
 * Rolls a fish of a species.
 * @param {string} species
 * @param {{ fishSizeBand: number, fishDifficulty: number, fishXp: number }} values
 *   The game values as they apply to this fish (already totalled).
 * @param {Dice} dice  The `line` stream.
 * @param {{ minBand?: number }} [options]  A size band it is at least (a big
 *   fish under the surface, R14).
 * @returns {FishInstance}
 */
export function rollFish(species, values, dice, { minBand = 0 } = {}) {
  const s = content.fish[species];
  const bands = sizeBands();
  const subname = s.subnames?.length ? dice.getRandomNumber(0, s.subnames.length - 1) : -1;

  const rolled = bands.indexOf(pick(bands, dice));
  const band = Math.min(Math.max(rolled + values.fishSizeBand, minBand, 0), bands.length - 1);

  const size = sizeIn(species, band, dice);

  const difficulty = s.difficulty + bands[band].difficulty + values.fishDifficulty;
  return {
    species,
    subname,
    band,
    size,
    difficulty,
    xp: Math.max(difficulty + values.fishXp, 1),
    rarity: fishRarity(s.rarity, bands[band].rarity),
  };
}

/**
 * A size in whole centimetres within a band: the species' range in equal
 * slices, one per band, neighbouring slices not sharing their edge.
 * @param {string} species
 * @param {number} band
 * @param {Dice} dice
 */
function sizeIn(species, band, dice) {
  const s = content.fish[species];
  const bands = sizeBands();
  const width = (s.size.max - s.size.min) / bands.length;
  const lo = Math.round(s.size.min + band * width);
  const top = band === bands.length - 1 ? s.size.max : Math.round(s.size.min + (band + 1) * width) - 1;
  return dice.getRandomNumber(lo, Math.max(lo, top));
}

/**
 * Bend Reality (D106): the fish one size band up, a new size in it, harder and
 * worth more for the band, and one rarity up (Epic at most, D49). A fish in
 * the top band keeps its size.
 * @param {FishInstance} fish
 * @param {Dice} dice  The `abilities` stream.
 * @returns {FishInstance}
 */
export function bendFish(fish, dice) {
  const bands = sizeBands();
  const band = Math.min(fish.band + 1, bands.length - 1);
  const size = band === fish.band ? fish.size : sizeIn(fish.species, band, dice);
  const harder = bands[band].difficulty - bands[fish.band].difficulty;
  const i = RARITIES.indexOf(fish.rarity);
  const rarity = RARITIES[Math.max(i, Math.min(i + 1, EPIC))];
  return { ...fish, band, size, difficulty: fish.difficulty + harder, xp: Math.max(fish.xp + harder, 1), rarity, bent: true };
}

/**
 * The species' rarity shifted by the band: never below Poor, never above Epic,
 * since Legendary is for named fish (D49, D63). A Legendary species stays so.
 * @param {string} species  The species' rarity.
 * @param {number} shift
 */
export function fishRarity(species, shift) {
  const i = RARITIES.indexOf(species);
  if (RARITIES[i] === 'legendary') return 'legendary';
  return RARITIES[Math.min(Math.max(i + shift, 0), Math.max(EPIC, i))];
}

/**
 * The string keys that make up the fish's name: band, subname, species
 * ("Gigantic" "Northern pike"). A plain band, Medium, has no word (D85). A
 * subname the species no longer has is left out: a roach from an old save
 * (D101).
 * @param {FishInstance} fish
 */
export function fishNameKeys(fish) {
  const s = content.fish[fish.species];
  const band = sizeBands()[fish.band];
  const subname = s.subnames?.[fish.subname];
  return [
    ...(fish.greedy ? ['fish.greedy'] : []),
    ...(fish.bent ? ['fish.bent'] : []),
    ...(band.plain ? [] : [band.name]),
    ...(subname ? [subname] : []),
    s.name,
  ];
}

/**
 * Two fish stack in the bucket only if they are identical twins (D50).
 * @param {FishInstance} a
 * @param {FishInstance} b
 */
export function sameFish(a, b) {
  return a.species === b.species && a.subname === b.subname && a.size === b.size && a.band === b.band && Boolean(a.bent) === Boolean(b.bent);
}
