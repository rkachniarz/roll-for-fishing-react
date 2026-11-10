// @ts-check
// The save slots in the browser's storage (docs/spec.md, R1; D13, D44, D53,
// D80). Three slots, each written whole: after every resolved cast, and at the
// line going out (the checkpoint from castLine, so a reload mid-cast voids the
// cast but keeps the spent charges, D22).
//
// Storage is passed in, so tests can use a plain object instead of
// localStorage.

import { deserialize, serialize } from './engine/state.js';

/** The slots, numbered from 1 as the title screen shows them. */
export const SLOTS = [1, 2, 3];

/** Where the one save lived before there were slots: it becomes slot 1. */
const OLD_KEY = 'roll-for-fishing:save';
/** @param {number} slot */
const key = (slot) => `roll-for-fishing:save:${slot}`;
/** The slot saved to last, for Continue on the title screen. */
const LAST_KEY = 'roll-for-fishing:last-slot';

/**
 * @typedef {{ getItem(key: string): string | null, setItem(key: string, value: string): void,
 *   removeItem(key: string): void }} Storage
 *
 * @typedef {{ state: import('./engine/state.js').GameState | null, error?: string }} Loaded
 */

/**
 * Moves a save from before the slots into slot 1, if slot 1 is free.
 * @param {Storage} storage
 */
function moveOldSave(storage) {
  const old = storage.getItem(OLD_KEY);
  if (old === null || storage.getItem(key(1)) !== null) return;
  storage.setItem(key(1), old);
  storage.removeItem(OLD_KEY);
}

/**
 * @param {Storage} storage
 * @param {number} slot
 * @param {import('./engine/state.js').GameState} state
 */
export function saveGame(storage, slot, state) {
  storage.setItem(key(slot), serialize(state));
  storage.setItem(LAST_KEY, String(slot));
}

/**
 * The slot played last, or null.
 * @param {Storage} storage
 */
export function lastSlot(storage) {
  const slot = Number(storage.getItem(LAST_KEY));
  return SLOTS.includes(slot) ? slot : null;
}

/**
 * The game in a slot, migrated to the current version, or null if the slot is
 * empty. A save that can't be read is left where it is and reported, never
 * overwritten silently.
 * @param {Storage} storage
 * @param {number} slot
 * @returns {Loaded}
 */
export function loadGame(storage, slot) {
  moveOldSave(storage);
  const text = storage.getItem(key(slot));
  if (text === null) return { state: null };
  try {
    return { state: deserialize(text) };
  } catch (e) {
    return { state: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Every slot, for the title screen.
 * @param {Storage} storage
 * @returns {(Loaded & { slot: number })[]}
 */
export function listSlots(storage) {
  return SLOTS.map((slot) => ({ slot, ...loadGame(storage, slot) }));
}

/**
 * A game as a file to keep (9.3): its name from the character and the day,
 * and the save's own text, the same as in a slot.
 * @param {import('./engine/state.js').GameState} state
 * @param {Date} today  From the page (the engine never reads a clock, D7).
 */
export function exportGame(state, today) {
  const who = state.character.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'game';
  const day = today.toISOString().slice(0, 10);
  return { name: `roll-for-fishing-${who}-${day}.json`, text: serialize(state) };
}

/**
 * A game from a file (9.3), migrated to the current version, or why it can't
 * be read.
 * @param {string} text
 * @returns {Loaded}
 */
export function importGame(text) {
  try {
    const state = deserialize(text);
    if (!state?.character?.name || !state.streams) return { state: null, error: 'Not a saved game' };
    return { state };
  } catch (e) {
    return { state: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Emptied when a new game starts in it (R1.4); the page asks first.
 * @param {Storage} storage
 * @param {number} slot
 */
export function deleteSave(storage, slot) {
  storage.removeItem(key(slot));
}
