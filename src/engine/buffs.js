// @ts-check
// Buffs that content gives (R12, R19.5): a potion, a meal, a night's rest,
// each a file in content/buffs/. Given again, a buff starts over rather than
// stacking.

import { content } from '../generated/content.js';

/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {import('./state.js').Buff} Buff */

/**
 * A buff as the state keeps it, from its definition: `duration` becomes
 * casts, attempts, an end in game minutes (`until`) or real milliseconds.
 * @param {GameState} state
 * @param {{ id: string, debuff?: boolean, effects: import('./values.js').Effect[],
 *   duration: { casts?: number, attempts?: number, minutes?: number, ms?: number } }} def
 * @param {{ source?: string, label?: string[] }} [extra]
 * @returns {Buff}
 */
export function buffFrom(state, def, extra = {}) {
  const d = def.duration;
  return {
    id: def.id,
    source: extra.source ?? def.id,
    effects: def.effects,
    ...(def.debuff ? { debuff: true } : {}),
    ...(d.casts !== undefined ? { casts: d.casts } : {}),
    ...(d.attempts !== undefined ? { attempts: d.attempts } : {}),
    ...(d.minutes !== undefined ? { until: state.time + d.minutes } : {}),
    ...(d.ms !== undefined ? { ms: d.ms } : {}),
    ...(extra.label ? { label: extra.label } : {}),
  };
}

/**
 * Gives a buff, replacing one with the same id. Changes `state` in place.
 * @param {GameState} state
 * @param {Buff} buff
 */
export function addBuff(state, buff) {
  state.buffs = [...state.buffs.filter((b) => b.id !== buff.id), buff];
}

/**
 * Gives a buff from content/buffs/. Changes `state` in place.
 * @param {GameState} state
 * @param {string} id
 * @returns {import('./game.js').GameEvent[]}
 */
export function giveBuff(state, id) {
  const def = content.buffs?.[id];
  if (!def) return [];
  addBuff(state, buffFrom(state, def, { label: [def.name] }));
  return [{ type: 'buff-gained', buff: id }];
}

/**
 * Uses an item from the bags (R18.8): a potion is drunk, one used up, and
 * its buff given. Not while a line is out (the page checks).
 * @param {GameState} state
 * @param {string} id
 * @returns {{ state: GameState, events: import('./game.js').GameEvent[] }}  The same state if it can't be used.
 */
export function useItem(state, id) {
  const use = content.items[id]?.use;
  const stack = state.bags.find((b) => b.id === id);
  if (!use || !stack) return { state, events: [] };
  const next = structuredClone(state);
  const mine = /** @type {{ id: string, count: number }} */ (next.bags.find((b) => b.id === id));
  mine.count--;
  next.bags = next.bags.filter((b) => b.count > 0);
  return { state: next, events: [{ type: 'used', item: id }, ...giveBuff(next, use.buff)] };
}
