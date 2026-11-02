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

  // The species' range in equal slices, one per band; whole centimetres, and
  // neighbouring slices don't share their edge.
  const width = (s.size.max - s.size.min) / bands.length;
  const lo = Math.round(s.size.min + band * width);
  const top = band === bands.length - 1 ? s.size.max : Math.round(s.size.min + (band + 1) * width) - 1;
  const size = dice.getRandomNumber(lo, Math.max(lo, top));

  const difficulty = s.difficulty + bands[band].difficulty + values.fishDifficulty;
  return {
    species,
    subname,
    band,
    size,
    difficulty,
    xp: Math.max(difficulty + values.fishXp, 0),
    rarity: fishRarity(s.rarity, bands[band].rarity),
  };
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
 * ("Gigantic" "Northern" "Pike").
 * @param {FishInstance} fish
 */
export function fishNameKeys(fish) {
  const s = content.fish[fish.species];
  return [sizeBands()[fish.band].name, ...(fish.subname >= 0 ? [s.subnames[fish.subname]] : []), s.name];
}

/**
 * Two fish stack in the bucket only if they are identical twins (D50).
 * @param {FishInstance} a
 * @param {FishInstance} b
 */
export function sameFish(a, b) {
  return a.species === b.species && a.subname === b.subname && a.size === b.size && a.band === b.band;
}
