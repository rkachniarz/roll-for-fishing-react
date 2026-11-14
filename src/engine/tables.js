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
 * @typedef {Object} Moment  What a fish's preferences are checked against (D101).
 * @property {import('./weather.js').Weather} weather  Its season too.
 * @property {import('./time.js').PartOfDay} partOfDay
 * @property {string | null} bait  The kind of bait on the hook, if any.
 */

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
 * (R8.10). Fish are likelier when the moment suits them (D101); the junk list
 * gets the empty hook.
 * @param {Object} where
 * @param {string} where.location
 * @param {string | null} where.spot
 * @param {'fish' | 'treasure' | 'stuff' | 'junk' | 'rift'} list  `rift`: the spot's rift fish (D104);
 *   `stuff`: the white things used for something (R19.1).
 * @param {Object} [world]
 * @param {Moment} [world.moment]
 * @param {Record<string, number>} [world.found]  Item id -> how many found so far.
 * @returns {Entry[]}
 */
export function locationTable({ location, spot }, list, { moment, found = {} } = {}) {
  const loc = content.locations[location];
  const spotData = spot ? loc.spots.find((/** @type {{ id: string }} */ s) => s.id === spot) : null;
  const table = listTable([...(loc[list] ?? []), ...(spotData?.[list] ?? [])], list === 'rift' ? 'fish' : list, { moment, found });
  if (list === 'junk' && loc.emptyHook > 0) table.push({ id: null, weight: loc.emptyHook });
  return table;
}

/**
 * A table from any list of entries: a location's, or a surface feature's that
 * replaces it (R14). The same skipping and preferences as locationTable.
 * @param {{ id?: string, table?: string, weight?: number }[]} list
 * @param {'fish' | 'treasure' | 'stuff' | 'junk'} kind
 * @param {Object} [world]
 * @param {Moment} [world.moment]
 * @param {Record<string, number>} [world.found]
 * @returns {Entry[]}
 */
export function listTable(list, kind, { moment, found = {} } = {}) {
  /** @type {Entry[]} */
  const table = [];
  for (const e of expand(list)) {
    const thing = kind === 'fish' ? content.fish[e.id] : content.items[e.id];
    if (thing.retired) continue;
    if (thing.unique && found[e.id]) continue;
    let weight = e.weight;
    if (kind === 'fish' && moment) weight = Math.round(weight * preferenceFactor(thing, moment));
    table.push({ id: e.id, weight });
  }
  return table;
}

/**
 * How much likelier a fish is now (D101): the factor in
 * rules/fish-preferences.json, once for each of its preferences the moment
 * meets. A preference left out ("Any") never counts.
 * @param {{ prefers?: { time?: string[], weather?: string[], season?: string[], bait?: string[] } }} fish
 * @param {Moment} moment
 */
export function preferenceFactor(fish, moment) {
  return content.rules['fish-preferences'].factor ** preferencesMet(fish, moment).length;
}

/**
 * Which of a fish's preferences the moment meets.
 * @param {{ prefers?: { time?: string[], weather?: string[], season?: string[], bait?: string[] } }} fish
 * @param {Moment} moment
 * @returns {('time' | 'weather' | 'season' | 'bait')[]}
 */
export function preferencesMet(fish, moment) {
  const p = fish.prefers ?? {};
  const words = weatherWords(moment.weather);
  /** @type {('time' | 'weather' | 'season' | 'bait')[]} */
  const met = [];
  if (p.time?.includes(moment.partOfDay)) met.push('time');
  if (p.weather?.some((w) => words.includes(w))) met.push('weather');
  if (p.season?.includes(moment.weather.season)) met.push('season');
  if (moment.bait && p.bait?.includes(moment.bait)) met.push('bait');
  return met;
}

/**
 * The words that fit the weather (rules/fish-preferences.json): sunny,
 * overcast, fog… read off its levels, and its cell's tags for what the levels
 * can't tell.
 * @param {import('./weather.js').Weather} weather
 * @returns {string[]}
 */
export function weatherWords(weather) {
  const tags = content.weather[weather.season]?.weathers[weather.cell]?.tags ?? [];
  return content.rules['fish-preferences'].weatherWords
    .filter((/** @type {any} */ w) => {
      if (w.tag && !tags.includes(w.tag)) return false;
      if (w.without && tags.includes(w.without)) return false;
      return ['temperature', 'wind', 'clouds', 'precipitation'].every((level) => {
        const range = w[level];
        if (!range) return true;
        const v = weather[/** @type {'temperature' | 'wind' | 'clouds' | 'precipitation'} */ (level)];
        return (range.min === undefined || v >= range.min) && (range.max === undefined || v <= range.max);
      });
    })
    .map((/** @type {{ id: string }} */ w) => w.id);
}
