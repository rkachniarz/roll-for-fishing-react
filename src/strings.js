// @ts-check
// Every piece of player-facing text is read through t() (docs/decisions.md,
// D46). Content text is written in English in content/ and collected into a
// table by `npm run content`; a translation would be one more table.
//
//   t(fish.name)              -> 'Pike'   (content holds the key, 'fish.pike.name')
//   t('ui.cast')              -> text from UI_STRINGS below

import { strings } from './generated/content.js';

/** The game's own text, outside content. Keys start with `ui.` or `value.`. */
const UI_STRINGS = {
  'value.fishingSkill': 'Fishing Skill',
  'value.fishFind': 'Fish Find',
  'value.treasureFind': 'Treasure Find',
  'value.playerVantage': 'advantage on your roll',
  'value.fishVantage': "advantage on the fish's roll",
  'value.fishDifficulty': 'fish difficulty',
  'value.fishSizeBand': 'fish size',
  'value.fishXp': 'XP per fish',
};

const table = { ...strings.en, ...UI_STRINGS };

/**
 * The text for a key. A missing key comes back as itself, so a gap shows on
 * screen instead of breaking anything.
 * @param {string} key
 */
export function t(key) {
  return table[key] ?? key;
}
