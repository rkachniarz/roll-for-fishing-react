// @ts-check
// Settings: kept per device, apart from the save slots, since they belong to
// the player at this screen rather than to a game (D81): the theme (dark, or
// light wooden planks), the font (D132: clear or pixel), whether the fight's dice are shown (D99), and how loud
// the sound is (9.2, 9.3).
//
// The theme and the font are also read by a line in index.html's <head>,
// before the page draws, so a light page doesn't flash dark first. That line
// uses the same key.

const KEY = 'roll-for-fishing:settings';

/**
 * `dice` is left out until the player sets it: the dice then follow the
 * device's "reduce motion" (`showDice`). `sound` is 0 (none) to 100. `font` is
 * Alegreya Sans (`clear`) or Pixelify Sans (`pixel`), D132.
 * @typedef {{ theme: 'dark' | 'light', font: 'clear' | 'pixel', dice?: boolean, sound: number }} Settings
 */

/** @type {Settings} */
const DEFAULTS = { theme: 'dark', font: 'clear', sound: 60 };

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
 * Whether the fight's dice are rolled over the scene (D99): the player's
 * choice, or if they haven't made one, not when the device asks for less motion.
 * @param {Settings} settings
 * @param {boolean} reduceMotion
 */
export const showDice = (settings, reduceMotion) => settings.dice ?? !reduceMotion;

/**
 * Shows the page in the settings' theme and font.
 * @param {Settings} settings
 */
export function applySettings(settings) {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.font = settings.font;
}
