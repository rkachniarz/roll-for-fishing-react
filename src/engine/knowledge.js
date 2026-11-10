// @ts-check
// What the player knows of each location (docs/spec.md, R4.4, R4.5, R5.3,
// R11.8; D23, D58; DEV_PLAN 8.1, 8.5): its spots, and what can be found there.
//
// A location's list is finite: every fish its spots hold and every item its
// treasure and junk lists hold (rift fish and bench-only items aside), so its
// completion is a percentage. Nothing on the list shows until the player knows
// of it: by finding it there, by a fish getting away there, or by an event
// telling them (`learn:`). Spots are known from the start unless the location
// says otherwise: a spot with `learnAfter` is noticed after that many casts at
// its location, and an event can point one out.
//
// The state keeps `known`: "lake:fish:roach" -> 'found' or 'heard', and
// "lake:spot:swamp" -> 'heard'; and `castsAt`, casts gone out per location.

import { content } from '../generated/content.js';
import { levelFor } from './state.js';

/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {'fish' | 'item' | 'spot'} KnownKind */

/** @param {string} location @param {KnownKind} kind @param {string} id */
export const knownKey = (location, kind, id) => `${location}:${kind}:${id}`;

/**
 * Everything that can be found at a location (R4.4): fish from every spot,
 * items from its treasure and junk lists and its spots'. Retired content and
 * rift fish (a perk's, D104) don't count, nor do bench-only items.
 * @param {string} location
 * @returns {{ fish: string[], items: string[] }}
 */
export function locationList(location) {
  const loc = content.locations[location];
  /** @type {Set<string>} */
  const fish = new Set();
  /** @type {Set<string>} */
  const items = new Set();
  /** @param {{ id?: string, table?: string }[] | undefined} list @param {Set<string>} into */
  const add = (list, into) => {
    for (const e of list ?? []) {
      const ids = e.table ? content.tables[e.table].entries.map((/** @type {{ id: string }} */ x) => x.id) : [e.id];
      for (const id of ids) into.add(id);
    }
  };
  for (const part of [loc, ...(loc.spots ?? [])]) {
    add(part.fish, fish);
    add(part.treasure, items);
    add(part.junk, items);
  }
  return {
    fish: [...fish].filter((id) => !content.fish[id].retired && !content.fish[id].rift),
    items: [...items].filter((id) => !content.items[id].retired && !content.items[id].devOnly),
  };
}

/**
 * Is this location on the map (R11.2, 8.2)? Open unless it's hidden until
 * opened, or a quest closed it.
 * @param {GameState} state
 * @param {string} location
 */
export function placeOpen(state, location) {
  const data = content.locations[location];
  if (!data || data.retired) return false;
  const now = state.places?.[location];
  return now === 'open' || (!data.hidden && now !== 'closed');
}

/**
 * Hidden locations whose map fragments have all been found open (8.2).
 * Changes `state` in place.
 * @param {GameState} state
 * @returns {import('./game.js').GameEvent[]}
 */
export function openByFragments(state) {
  /** @type {import('./game.js').GameEvent[]} */
  const events = [];
  for (const loc of Object.values(content.locations)) {
    if (!loc.fragments || placeOpen(state, loc.id) || state.places?.[loc.id] === 'closed') continue;
    const pieces = Object.values(content.items).filter((i) => i.fragmentOf === loc.id && state.found[i.id]).length;
    if (pieces < loc.fragments) continue;
    state.places = { ...state.places, [loc.id]: 'open' };
    events.push({ type: 'place-opened', location: loc.id, by: 'fragments' });
  }
  return events;
}

/**
 * Is this spot one the player knows of (R11.8, D58)?
 * @param {GameState} state
 * @param {string} location
 * @param {string} spot
 */
export function spotKnown(state, location, spot) {
  const data = content.locations[location]?.spots?.find((/** @type {{ id: string }} */ s) => s.id === spot);
  if (!data) return false;
  return data.learnAfter === undefined || Boolean(state.known[knownKey(location, 'spot', spot)]);
}

/**
 * The player learns of something at a location. Found outranks heard of.
 * Changes `state` in place.
 * @param {GameState} state
 * @param {string} location
 * @param {KnownKind} kind
 * @param {string} id
 * @param {'found' | 'heard'} how
 * @returns {boolean}  Whether it was news.
 */
export function learn(state, location, kind, id, how) {
  const key = knownKey(location, kind, id);
  const was = state.known[key];
  if (was === 'found' || was === how) return false;
  state.known[key] = how;
  return was === undefined || how === 'found';
}

/**
 * A cast gone out at the player's location: counted, and any spot it's now
 * time to notice is learned (R11.8). Changes `state` in place.
 * @param {GameState} state
 * @returns {import('./game.js').GameEvent[]}
 */
export function noticeSpots(state) {
  const loc = content.locations[state.location];
  const casts = (state.castsAt[state.location] ?? 0) + 1;
  state.castsAt[state.location] = casts;
  /** @type {import('./game.js').GameEvent[]} */
  const events = [];
  for (const spot of loc.spots ?? []) {
    if (spot.learnAfter === undefined || casts < spot.learnAfter) continue;
    if (learn(state, state.location, 'spot', spot.id, 'heard')) events.push({ type: 'spot-learned', location: state.location, spot: spot.id });
  }
  return events;
}

/**
 * How much of a location's list has been found (R4.4); retired content left out
 * (R4.6).
 * @param {GameState} state
 * @param {string} location
 */
export function completion(state, location) {
  const list = locationList(location);
  const ids = [...list.fish.map((id) => knownKey(location, 'fish', id)), ...list.items.map((id) => knownKey(location, 'item', id))];
  const found = ids.filter((k) => state.known[k] === 'found').length;
  return { found, total: ids.length };
}

/**
 * Does the player see a location's completion (R5.3)? From a level in
 * rules/levels.json (`reveal.completion`), or a perk or item with
 * `revealCompletion` (D107).
 * @param {GameState} state
 * @param {import('./values.js').Values} values
 */
export function completionShown(state, values) {
  const from = content.rules.levels.reveal?.completion;
  return (from !== undefined && levelFor(state.character.xp) >= from) || (values.flat.revealCompletion ?? 0) > 0;
}
