// @ts-check
// The save slot in the browser's storage (docs/spec.md, R1; D13, D44, D53).
// One slot, written whole: after every resolved cast, and at the line going
// out (the checkpoint from castLine, so a reload mid-cast voids the cast but
// keeps the spent charges, D22).
//
// Storage is passed in, so tests can use a plain object instead of
// localStorage.

import { deserialize, serialize } from './engine/state.js';

const KEY = 'roll-for-fishing:save';

/**
 * @typedef {{ getItem(key: string): string | null, setItem(key: string, value: string): void,
 *   removeItem(key: string): void }} Storage
 */

/**
 * @param {Storage} storage
 * @param {import('./engine/state.js').GameState} state
 */
export function saveGame(storage, state) {
  storage.setItem(KEY, serialize(state));
}

/**
 * The saved game, migrated to the current version, or null if there is none.
 * A save that can't be read is left where it is and reported, never
 * overwritten silently.
 * @param {Storage} storage
 * @returns {{ state: import('./engine/state.js').GameState | null, error?: string }}
 */
export function loadGame(storage) {
  const text = storage.getItem(KEY);
  if (text === null) return { state: null };
  try {
    return { state: deserialize(text) };
  } catch (e) {
    return { state: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * New game (R1.4): the page asks for confirmation first.
 * @param {Storage} storage
 */
export function deleteSave(storage) {
  storage.removeItem(KEY);
}
