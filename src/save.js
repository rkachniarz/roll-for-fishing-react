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
 * Emptied when a new game starts in it (R1.4); the page asks first.
 * @param {Storage} storage
 * @param {number} slot
 */
export function deleteSave(storage, slot) {
  storage.removeItem(key(slot));
}
