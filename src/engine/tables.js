// @ts-check
// Weighted tables, built from a location's lists (docs/spec.md, R15.2).
//
// A location lists what can be found there, each with a weight; the spot the
// player is at adds its own lists, and shared lists from content/tables/ are
// expanded in place. The prototype's tables needed a filler entry with
// `chance: 0` exactly once, or the picker returned undefined (PORTING-NOTES
// §4); here every entry has an explicit weight, and an empty hook is an entry
// of its own.

import { content } from '../generated/content.js';

/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */
/** @typedef {{ id: string | null, weight: number }} Entry  id null: an empty hook. */

/**
 * One entry, picked by weight. Null if the table is empty.
 * @template {{ weight: number }} T
 * @param {T[]} entries
 * @param {Dice} dice
 * @returns {T | null}
 */
export function pick(entries, dice) {
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  if (total <= 0) return null;
  let roll = dice.getRandomNumber(1, total);
  for (const e of entries) {
    roll -= e.weight;
    if (roll <= 0) return e;
  }
  return null;
}

/**
 * @param {{ id?: string, table?: string, weight?: number }[] | undefined} list
 * @returns {Entry[]}
 */
function expand(list) {
  return (list ?? []).flatMap((e) => (e.table ? content.tables[e.table].entries : [e]));
}

/**
 * The table for one of a location's lists, with the spot's entries added.
 * Retired content is skipped (D44), and so is unique treasure already found
 * (R8.10). Fish get their weather bonuses (§C.4); the junk list gets the empty
 * hook.
 * @param {Object} where
 * @param {string} where.location
 * @param {string | null} where.spot
 * @param {'fish' | 'treasure' | 'junk'} list
 * @param {Object} [world]
 * @param {import('./weather.js').Weather} [world.weather]
 * @param {Record<string, number>} [world.found]  Item id -> how many found so far.
 * @returns {Entry[]}
 */
export function locationTable({ location, spot }, list, { weather, found = {} } = {}) {
  const loc = content.locations[location];
  const spotData = spot ? loc.spots.find((/** @type {{ id: string }} */ s) => s.id === spot) : null;
  const table = listTable([...(loc[list] ?? []), ...(spotData?.[list] ?? [])], list, { weather, found });
  if (list === 'junk' && loc.emptyHook > 0) table.push({ id: null, weight: loc.emptyHook });
  return table;
}

/**
 * A table from any list of entries: a location's, or a surface feature's that
 * replaces it (R14). The same skipping and weather bonuses as locationTable.
 * @param {{ id?: string, table?: string, weight?: number }[]} list
 * @param {'fish' | 'treasure' | 'junk'} kind
 * @param {Object} [world]
 * @param {import('./weather.js').Weather} [world.weather]
 * @param {Record<string, number>} [world.found]
 * @returns {Entry[]}
 */
export function listTable(list, kind, { weather, found = {} } = {}) {
  /** @type {Entry[]} */
  const table = [];
  for (const e of expand(list)) {
    const thing = kind === 'fish' ? content.fish[e.id] : content.items[e.id];
    if (thing.retired) continue;
    if (thing.unique && found[e.id]) continue;
    let weight = e.weight;
    if (kind === 'fish' && weather) weight = Math.max(1, weight + weatherBonus(thing, weather));
    table.push({ id: e.id, weight });
  }
  return table;
}

/**
 * What the weather adds to a fish's weight: the sum of its matching
 * preferences (the prototype's applyWeatherMods).
 * @param {{ weather?: { param: string, min?: number, max?: number, bonus: number }[] }} fish
 * @param {import('./weather.js').Weather} weather
 */
export function weatherBonus(fish, weather) {
  let bonus = 0;
  for (const c of fish.weather ?? []) {
    const v = weather[/** @type {'temperature' | 'wind' | 'clouds' | 'precipitation'} */ (c.param)];
    if ((c.min === undefined || v >= c.min) && (c.max === undefined || v <= c.max)) bonus += c.bonus;
  }
  return bonus;
}
