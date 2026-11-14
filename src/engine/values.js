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
/** @typedef {'ms' | '%'} Unit  How a tooltip shows an amount (R8.6): ms as seconds, % as a percentage. */
/** @typedef {{ value: string, add: number | string }} Effect */

/**
 * `base` is the starting value; the character's stats have none here, since
 * they come from the character (R6.1). `unit` is for tooltips.
 * @type {Record<string, { better: Better, base?: number, unit?: Unit }>}
 */
export const GAME_VALUES = {
  // ---- The rolls (fed mostly by the character, D35) ----
  /** Added to the fishing d20 (R6.1). */
  fishingSkill: { better: 'higher' },
  /** Raises the chance that a fish bites rather than anything else (R3.1). */
  fishFind: { better: 'higher' },
  /** Raises the chance of treasure over junk (R3.4). */
  treasureFind: { better: 'higher' },
  /** Raises the chance of stuff, the white things used for something, over junk (R19.1, D125). */
  stuffFind: { better: 'higher', base: 0 },
  /** Fish Find for bottom fish only (a fish's `swims`, D137): the bite roll checked again for them. */
  bottomFishFind: { better: 'higher', base: 0 },
  /** Fish Find for every fish that doesn't keep to the bottom (D137). */
  otherFishFind: { better: 'higher', base: 0 },
  /** Keeps the cold off: each point takes one off the cold (R19.2, D126). */
  warmth: { better: 'higher', base: 0 },
  /** The chance, in percent, that a fish caught comes with an identical twin (a stew buff, R19.4). */
  twinChance: { better: 'higher', base: 0, unit: '%' },
  /** The chance, in percent, that a cast takes no time at all (a strange fish's stew buff, R19.4). */
  timeSlip: { better: 'higher', base: 0, unit: '%' },
  /** Above 0: the fishing d20 is rolled with advantage; below 0, disadvantage. */
  playerVantage: { better: 'higher', base: 0 },
  /** Above 0: every source of advantage adds a die, the best one kept, rather than all of them counting as one (D96). */
  vantageStacks: { better: 'higher', base: 0 },
  /** The lowest natural d20 that lands the fish whatever the total, unless the fish's own d20 is a 20 too (D96). */
  naturalCatch: { better: 'lower', base: 20 },
  /** Above 0: a fish bites for certain; below 0: never a fish (abilities, D96). */
  biteCertain: { better: 'neither', base: 0 },
  /** Above 0: a fish that bites is one that got away here before, if there is one (D96). */
  fromPool: { better: 'neither', base: 0 },
  /** The chance, in percent, that a fish comes from the spot's rift table instead (Rift Fishing, D104). */
  riftChance: { better: 'higher', base: 0, unit: '%' },
  /** Above 0: the rift chance is doubled (Bend Reality with Rift Fishing, D106). */
  riftDoubled: { better: 'higher', base: 0 },
  /** The chance, in percent, that a fish is Greedy: something caught on it, junk or treasure (Greedy Fish, D106). */
  greedyChance: { better: 'higher', base: 0, unit: '%' },
  /** Above 0: treasure comes up two at a time, and the player keeps one (Fence, D106). */
  treasureChoice: { better: 'higher', base: 0 },
  /** Above 0: junk that comes up is treasure instead (Polish, D106). */
  junkToTreasure: { better: 'higher', base: 0 },
  /** Above 0: the fish's own roll shows, so the log can say the number it needed (R5.2, D107). */
  revealResistance: { better: 'higher', base: 0 },
  /** Above 0: the bite roll shows (R5.2, D107). */
  revealBite: { better: 'higher', base: 0 },
  /** Above 0: the treasure roll shows (R5.2, D107). */
  revealTreasure: { better: 'higher', base: 0 },
  /** Above 0: each location's completion shows (R5.3, 8.5). */
  revealCompletion: { better: 'higher', base: 0 },
  /** The same for the fish's own d20 (R3.5). */
  fishVantage: { better: 'lower', base: 0 },
  /** The chance, in percent, that the fish's own d20 has advantage as well (a Knight champion, D114). */
  fishAdvantageChance: { better: 'lower', base: 0, unit: '%' },
  /** Added to every fish's roll, whatever fish it is, one from the pool included (a Cleric champion, D114). */
  fishResistance: { better: 'lower', base: 0 },
  /** The chance, in percent, that a find other than junk is stolen as it comes up (a Rogue champion, D114). */
  stealChance: { better: 'lower', base: 0, unit: '%' },
  /** Added to every fish's difficulty. */
  fishDifficulty: { better: 'lower', base: 0 },
  /** Shifts the size band a fish is rolled in (R3.3). */
  fishSizeBand: { better: 'higher', base: 0 },
  /** Added to the XP a fish gives. */
  fishXp: { better: 'higher', base: 0 },

  // ---- The cast (fed mostly by the rod, D35) ----
  /** How far from the aimed point the bobber may land, in scene pixels (D34). */
  castScatter: { better: 'lower', base: 20 },
  /** The chance, in percent, that a cast flies off somewhere else entirely, wherever it was aimed (D85, D114). */
  wildCast: { better: 'lower', base: 1, unit: '%' },
  /** Ability cooldowns started now are this many times as long (Slow, D114). */
  cooldownFactor: { better: 'lower', base: 1 },
  /** The shortest and longest wait from the cast to the bite, in ms (R2.2). */
  biteDelayMin: { better: 'lower', base: 2500, unit: 'ms' },
  biteDelayMax: { better: 'lower', base: 8000, unit: 'ms' },
  /** A strike faster than this is 'fast' (+1 to the roll), in ms (R2.3). */
  reactionFast: { better: 'higher', base: 450, unit: 'ms' },
  /** Faster than this (and not fast) is 'ok' (+0); slower is 'bad' (-1). */
  reactionOk: { better: 'higher', base: 900, unit: 'ms' },
  /** At or past this after the splash, whatever bit is gone (R2.4). */
  strikeLimit: { better: 'higher', base: 3000, unit: 'ms' },
  /** After a missed splash, how long nothing happens before the line counts as cast again (D64). */
  missPause: { better: 'lower', base: 5000, unit: 'ms' },

  // ---- Surface features (R14) ----
  /** Added to the location's chance, in percent, that a new surface feature appears after a cast. */
  featureChance: { better: 'higher', base: 0, unit: '%' },

  // ---- The dive (R20.3) ----
  /** How long the Fighter can stay under the water, in seconds. */
  diveSeconds: { better: 'higher', base: 10 },
  /** How many fish swim by in a dive. */
  diveFish: { better: 'higher', base: 4 },

  // ---- The bucket (D57) ----
  /** How many fish the bucket holds; a full one sends the player to town. */
  bucketSize: { better: 'higher', base: 16 },

  // ---- Events (D84) ----
  /** How fast the event meter fills, in percent of the usual. */
  eventMeterFill: { better: 'neither', base: 100, unit: '%' },

  // ---- Bait (D39, D61) ----
  /** The chance, in percent, that bait is saved when a fish is caught. */
  baitRecovery: { better: 'higher', base: 10, unit: '%' },
  /** The chance, in percent, that a fish that gets away takes the bait. */
  baitEscapeLoss: { better: 'lower', base: 5, unit: '%' },
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
