// @ts-check
// Game values and the effect vocabulary (docs/spec.md, R6.6; D56).
//
// Every number a modifier can change has a name here. Items, rods, bait, buffs
// and events all change them the same way, with effects written in content:
//
//   { "value": "fishingSkill", "add": 2 }      a flat change
//   { "value": "fishingSkill", "add": "d6" }   rolled each time it applies (D48)
//
// A value's total is its base plus every effect on it, always worked out from
// the state (D13): never added and subtracted as items come and go.
//
// `better` says which direction helps the player. The content check uses it to
// find items with an upside and no downside (R8.5), and tooltips will use it to
// colour an effect green or red (R8.6). Adding a value here is code work; using
// one in content isn't (D42).

/** @typedef {'higher' | 'lower' | 'neither'} Better */
/** @typedef {{ value: string, add: number | string }} Effect */

/**
 * `base` is the starting value; the character's stats have none here, since
 * they come from the character (R6.1).
 * @type {Record<string, { better: Better, base?: number }>}
 */
export const GAME_VALUES = {
  // ---- The rolls (fed mostly by the character, D35) ----
  /** Added to the fishing d20 (R6.1). */
  fishingSkill: { better: 'higher' },
  /** Raises the chance that a fish bites rather than anything else (R3.1). */
  fishFind: { better: 'higher' },
  /** Raises the chance of treasure over junk (R3.4). */
  treasureFind: { better: 'higher' },
  /** Above 0: the fishing d20 is rolled with advantage; below 0, disadvantage. */
  playerVantage: { better: 'higher', base: 0 },
  /** The same for the fish's own d20 (R3.5). */
  fishVantage: { better: 'lower', base: 0 },
  /** Added to every fish's difficulty. */
  fishDifficulty: { better: 'lower', base: 0 },
  /** Shifts the size band a fish is rolled in (R3.3). */
  fishSizeBand: { better: 'higher', base: 0 },
  /** Added to the XP a fish gives. */
  fishXp: { better: 'higher', base: 0 },

  // ---- The cast (fed mostly by the rod, D35) ----
  /** How far from the aimed point the bobber may land, in scene pixels (D34). */
  castScatter: { better: 'lower', base: 12 },
  /** The shortest and longest wait from the cast to the bite, in ms (R2.2). */
  biteDelayMin: { better: 'lower', base: 2500 },
  biteDelayMax: { better: 'lower', base: 8000 },
  /** A strike faster than this is 'fast' (+1 to the roll), in ms (R2.3). */
  reactionFast: { better: 'higher', base: 450 },
  /** Faster than this (and not fast) is 'ok' (+0); slower is 'bad' (-1). */
  reactionOk: { better: 'higher', base: 900 },
  /** At or past this after the splash, whatever bit is gone (R2.4). */
  strikeLimit: { better: 'higher', base: 3000 },
  /** After a missed splash, how long nothing happens before the line counts as cast again (D64). */
  missPause: { better: 'lower', base: 5000 },

  // ---- Bait (D39, D61) ----
  /** The chance, in percent, that bait is saved when a fish is caught. */
  baitRecovery: { better: 'higher', base: 10 },
  /** The chance, in percent, that a fish that gets away takes the bait. */
  baitEscapeLoss: { better: 'lower', base: 5 },
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
 * @param {Effect} effect
 * @returns {1 | -1 | 0}
 */
export function effectSign(effect) {
  const meta = GAME_VALUES[effect.value];
  if (!meta || meta.better === 'neither') return 0;
  // A die always adds something positive.
  const amount = typeof effect.add === 'string' ? 1 : Math.sign(effect.add);
  if (amount === 0) return 0;
  return /** @type {1 | -1} */ (meta.better === 'higher' ? amount : -amount);
}

/**
 * @typedef {Object} Source
 * @property {string} label       Where the effects come from, for the roll's breakdown: an item or buff id.
 * @property {Effect[]} effects
 *
 * @typedef {Object} Values
 * @property {Record<string, number>} flat  Base plus every flat effect.
 * @property {Record<string, { label: string, die: string }[]>} dice  Dice still to roll, per value.
 * @property {Record<string, { label: string, value: number }[]>} parts  What makes up each flat total.
 */

/**
 * Every game value's total, from the bases, the character's stats and every
 * source of effects (equipped items, buffs, …).
 * @param {Record<string, number>} stats  The character's stats (R6.1).
 * @param {Source[]} sources
 * @returns {Values}
 */
export function deriveValues(stats, sources) {
  /** @type {Values} */
  const out = { flat: {}, dice: {}, parts: {} };
  for (const [name, meta] of Object.entries(GAME_VALUES)) {
    const base = stats[name] ?? meta.base ?? 0;
    out.flat[name] = base;
    out.dice[name] = [];
    out.parts[name] = [{ label: name in stats ? 'stat' : 'base', value: base }];
  }
  for (const source of sources) {
    for (const effect of source.effects) {
      if (!(effect.value in out.flat)) continue;
      if (typeof effect.add === 'string') out.dice[effect.value].push({ label: source.label, die: effect.add });
      else {
        out.flat[effect.value] += effect.add;
        out.parts[effect.value].push({ label: source.label, value: effect.add });
      }
    }
  }
  return out;
}

/**
 * A value as it applies right now: its flat total, plus any dice on it rolled
 * fresh (D48). The breakdown goes into the roll record (R5.1).
 * @param {Values} values
 * @param {string} name
 * @param {ReturnType<import('../dice.js').diceFor>} dice  The `effects` stream.
 * @returns {{ total: number, mods: { label: string, value: number }[] }}
 */
export function applyValue(values, name, dice) {
  const mods = values.parts[name].filter((p) => p.value !== 0);
  for (const { label, die } of values.dice[name]) mods.push({ label: `${label} (${die})`, value: dice[EFFECT_DICE[die]]() });
  return { total: mods.reduce((sum, m) => sum + m.value, 0), mods };
}
