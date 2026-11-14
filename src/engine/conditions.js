// @ts-check
// Conditions the world puts on the player (R19.2, R19.3, D126): the cold,
// worked out from the temperature, the part of the day, the season and the
// player's warmth, in three levels each a debuff; and night fishing's reward.
// Like a class fish's effects (D114) they're never stored: they follow from
// the state every time (D13). Indoors, in town, there's no cold and no night
// on the water.

import { content } from '../generated/content.js';
import { clock } from './time.js';

/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {import('./values.js').Source} Source */

/**
 * Is the player indoors, away from the weather (R17.1)?
 * @param {GameState} state
 */
export function indoors(state) {
  return Boolean(content.locations[state.location]?.town);
}

/**
 * How cold it is out, before warmth: points from the temperature, the part of
 * the day and the season (content/rules/cold.json).
 * @param {GameState} state
 */
export function coldPoints(state) {
  const rules = content.rules.cold;
  if (!rules || indoors(state)) return 0;
  const temp = rules.temperature.find((/** @type {{ max: number }} */ b) => state.weather.temperature <= b.max);
  const now = clock(state.time);
  return (temp?.points ?? 0) + (rules.times[now.partOfDay] ?? 0) + (rules.seasons?.[now.season] ?? 0);
}

/**
 * The level of cold the player feels: 0 (fine) up to the number of levels.
 * @param {GameState} state
 * @param {number} warmth  The warmth game value.
 */
export function coldLevel(state, warmth) {
  const levels = content.rules.cold?.coldLevels ?? [];
  return Math.max(0, Math.min(levels.length, coldPoints(state) - warmth));
}

/**
 * The effects of the cold and the night as sources for the game values,
 * each labelled by its id.
 * @param {GameState} state
 * @param {number} warmth
 * @returns {Source[]}
 */
export function conditionSources(state, warmth) {
  return conditionBuffs(state, warmth).map((b) => ({ label: b.id, effects: b.effects }));
}

/**
 * The cold and the night as buffs for the bar (R12.3): a debuff for the cold
 * at its level, a buff at night on the water. They have no duration.
 * @param {GameState} state
 * @param {number} warmth
 * @returns {(import('./state.js').Buff & { label: string[] })[]}
 */
export function conditionBuffs(state, warmth) {
  const rules = content.rules.cold;
  if (!rules || indoors(state)) return [];
  /** @type {(import('./state.js').Buff & { label: string[] })[]} */
  const out = [];
  const level = coldLevel(state, warmth);
  if (level > 0) {
    const def = rules.coldLevels[level - 1];
    out.push({ id: `cold-${def.id}`, source: 'cold', debuff: true, effects: def.effects, label: [def.name] });
  }
  if (rules.night.times.includes(clock(state.time).partOfDay)) {
    out.push({ id: 'night-fishing', source: 'night', effects: rules.night.effects, label: [rules.night.name] });
  }
  return out;
}
