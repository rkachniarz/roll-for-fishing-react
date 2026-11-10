// @ts-check
// Active abilities (docs/spec.md, R6.3; D96): what is on the action bar, its
// cooldowns, and which abilities are lit. Using one is in game.js
// (useAbility), since most of them change the cast.
//
// A cooldown counts casts or real time (the latter only while the game is
// open, D32). A cast counts only if the player made an attempt at a catch: a
// strike in time on a splash, an empty hook included. Some abilities only
// work right after something happens, as WoW's Overpower after a dodge: they
// light up then, and stay lit until the next cast goes out (D96).

import { content } from '../generated/content.js';
import { levelFor } from './state.js';

/** @typedef {import('./state.js').GameState} GameState */

/** The abilities that light up, and what lights them. */
export const LIGHTS = /** @type {const} */ ({ 'jump-in': 'got-away', gut: 'caught', 'bend-reality': 'caught' });

/** The abilities that work so far; the rest show on the bar, greyed out (6.3). */
export const WORKING = new Set(['jump-in', 'battle-focus', 'full-force', 'summon-fish', 'recall', 'gut', 'sleight-of-hook', 'bend-reality', 'polish']);

/**
 * The character's active perks, in the order they were taken: the action bar.
 * @param {GameState} state
 * @returns {string[]}
 */
export function activePerks(state) {
  return Object.entries(state.character.perks)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, id]) => id)
    .filter((id) => content.perks[id]?.kind === 'active');
}

/**
 * An ability's full cooldown, as it would start now: some get shorter with
 * the character's level, never below one cast, and a perk taken can replace
 * it (Fence's for Gut, D106).
 * @param {GameState} state
 * @param {string} id
 * @returns {{ casts?: number, ms?: number }}
 */
export function cooldownFor(state, id) {
  const replaced = Object.values(state.character.perks).map((p) => content.perks[p]?.cooldowns?.[id]).find(Boolean);
  const cd = replaced ?? content.perks[id].cooldown ?? {};
  /** @type {{ casts?: number, ms?: number }} */
  const out = {};
  if (cd.casts) out.casts = Math.max(1, cd.casts - (cd.minusLevel ? levelFor(state.character.xp) : 0));
  if (cd.ms) out.ms = cd.ms;
  return out;
}

/**
 * Where an ability stands, for the action bar and for using it.
 * @param {GameState} state
 * @param {string} id
 */
export function abilityStatus(state, id) {
  const cooldown = state.cooldowns[id] ?? null;
  const needsLight = id in LIGHTS;
  const lit = Boolean(state.lit[id]);
  // A "next cast" ability already waiting on the buff bar.
  const armed = state.buffs.some((b) => b.source === id);
  const working = WORKING.has(id);
  return { id, cooldown, needsLight, lit, armed, working, usable: working && !cooldown && (!needsLight || lit) && !armed };
}

/**
 * Starts an ability's cooldown. Changes `state` in place (a copy the caller owns).
 * @param {GameState} state
 * @param {string} id
 */
export function startCooldown(state, id) {
  const cd = cooldownFor(state, id);
  if (cd.casts || cd.ms) state.cooldowns[id] = cd;
}

/**
 * An attempt at a catch: a cast off every cooldown that counts casts. Changes
 * `state` in place.
 * @param {GameState} state
 */
export function spendCooldownCasts(state) {
  for (const [id, cd] of Object.entries(state.cooldowns)) {
    if (cd.casts === undefined) continue;
    const casts = cd.casts - 1;
    if (casts > 0) state.cooldowns[id] = { ...cd, casts };
    else if (cd.ms) state.cooldowns[id] = { ms: cd.ms };
    else delete state.cooldowns[id];
  }
}

/**
 * Real time off every cooldown that counts it (D32).
 * @param {GameState} state
 * @param {number} ms
 * @returns {GameState}  The same state if nothing counts time.
 */
export function tickCooldowns(state, ms) {
  if (!Object.values(state.cooldowns).some((cd) => cd.ms !== undefined)) return state;
  /** @type {GameState['cooldowns']} */
  const cooldowns = {};
  for (const [id, cd] of Object.entries(state.cooldowns)) {
    if (cd.ms === undefined) cooldowns[id] = cd;
    else if (cd.ms - ms > 0) cooldowns[id] = { ...cd, ms: cd.ms - ms };
    else if (cd.casts) cooldowns[id] = { casts: cd.casts };
  }
  return { ...state, cooldowns };
}
