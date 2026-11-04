// @ts-check
// Settings: kept per device, apart from the save slots, since they belong to
// the player at this screen rather than to a game (D81). For now only the
// theme: dark, or light wooden planks.
//
// The theme is also read by a line in index.html's <head>, before the page
// draws, so a light page doesn't flash dark first. That line uses the same key.

const KEY = 'roll-for-fishing:settings';

/** @typedef {{ theme: 'dark' | 'light' }} Settings */

/** @type {Settings} */
const DEFAULTS = { theme: 'dark' };

/**
 * @param {Pick<Storage, 'getItem'>} storage
 * @returns {Settings}
 */
export function loadSettings(storage) {
  try {
    return { ...DEFAULTS, ...JSON.parse(storage.getItem(KEY) ?? '{}') };
  } catch {
    // Settings that can't be read aren't worth reporting: the defaults do.
    return { ...DEFAULTS };
  }
}

/**
 * @param {Pick<Storage, 'setItem'>} storage
 * @param {Settings} settings
 */
export function saveSettings(storage, settings) {
  storage.setItem(KEY, JSON.stringify(settings));
}

/**
 * Shows the page in the settings' theme.
 * @param {Settings} settings
 */
export function applySettings(settings) {
  document.documentElement.dataset.theme = settings.theme;
}
