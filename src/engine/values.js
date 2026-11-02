// @ts-check
// Game values and the effect vocabulary (docs/spec.md, R6.6; D56).
//
// Every number a modifier can change has a name here. Items, rods, bait, buffs
// and events all change them the same way, with effects written in content:
//
//   { "value": "fishingSkill", "add": 2 }      a flat change
//   { "value": "fishingSkill", "add": "d4" }   rolled each time it applies (D48)
//
// `better` says which direction helps the player. The content check uses it to
// find items with an upside and no downside (R8.5), and tooltips will use it to
// colour an effect green or red (R8.6). Adding a value here is code work; using
// one in content isn't (D42).

/** @typedef {'higher' | 'lower'} Better */

/** @type {Record<string, { better: Better }>} */
export const GAME_VALUES = {
  /** Added to the fishing d20 (R6.1). */
  fishingSkill: { better: 'higher' },
  /** Raises the chance that a fish bites rather than anything else (R3.1). */
  fishFind: { better: 'higher' },
  /** Raises the chance of treasure over junk (R3.4). */
  treasureFind: { better: 'higher' },
  /** Above 0: the fishing d20 is rolled with advantage; below 0, disadvantage. */
  playerVantage: { better: 'higher' },
  /** The same for the fish's own d20 (R3.5). */
  fishVantage: { better: 'lower' },
  /** Added to every fish's difficulty. */
  fishDifficulty: { better: 'lower' },
  /** Shifts the size band a fish is rolled in (R3.3). */
  fishSizeBand: { better: 'higher' },
  /** Added to the XP a fish gives. */
  fishXp: { better: 'higher' },
};

/**
 * The dice an effect may name, each mapped onto its named function in
 * src/dice.js (D5). A new die here needs that function first.
 * @type {Record<string, 'roll6' | 'roll2d6' | 'roll20' | 'roll100'>}
 */
export const EFFECT_DICE = {
  d6: 'roll6',
  '2d6': 'roll2d6',
  d20: 'roll20',
  d100: 'roll100',
};

/**
 * Does this change help the player, hurt them, or neither?
 * @param {{ value: string, add: number | string }} effect
 * @returns {1 | -1 | 0}
 */
export function effectSign(effect) {
  const meta = GAME_VALUES[effect.value];
  if (!meta) return 0;
  // A die always adds something positive.
  const amount = typeof effect.add === 'string' ? 1 : Math.sign(effect.add);
  if (amount === 0) return 0;
  return /** @type {1 | -1} */ (meta.better === 'higher' ? amount : -amount);
}
