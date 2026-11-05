// @ts-check
// Events (docs/spec.md, R10; D45, D84): pop-ups with slides and choices,
// written as text in content/events/ and read by `npm run content`
// (tools/event-text.mjs has the format and its words).
//
// What starts one:
//   meter   the event meter, a d20 per cast (+5 when the hook comes up empty),
//           fires above 100 and picks from the location's events (R10.2)
//   item    fishing up an item that names the event
//   needs   its requirements being met, checked after every cast: hidden
//           objectives on flags and counters (R10.7, D51)
//
// The open event and its slide are in the state, so a reload comes back to
// the same slide. Choices draw no dice: what a choice does is written on it.

import { content } from '../generated/content.js';
import { pick } from './tables.js';
import { levelFor } from './state.js';
import { clock } from './time.js';

/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {import('./game.js').GameEvent} GameEvent */
/** @typedef {import('../../tools/event-text.mjs').Need} Need */
/** @typedef {import('../../tools/event-text.mjs').Effect} Effect */
/** @typedef {import('../../tools/event-text.mjs').Choice} Choice */
/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */

/** The meter fires above this (the prototype's number, R10.2). */
export const METER_FIRES = 100;
/** Added to the meter when the hook comes up empty. */
export const METER_EMPTY_BONUS = 5;

/**
 * @param {GameState} state
 * @param {Need} need
 */
export function meets(state, need) {
  switch (need.kind) {
    case 'class':
      return state.character.classId === need.id;
    case 'gender':
      return state.character.gender === need.gender;
    case 'level':
      return levelFor(state.character.xp) >= need.at;
    case 'luck':
      return state.character.luck >= need.at;
    case 'item':
      return countInBags(state, need.id) >= need.count;
    case 'flag':
      return Boolean(state.flags[need.name]);
    case 'no-flag':
      return !state.flags[need.name];
    case 'season':
      return state.weather.season === need.id;
    case 'time':
      return clock(state.time).partOfDay === need.part;
    case 'caught':
      return (state.book.fish[need.fish]?.caught ?? 0) >= need.count;
    case 'weather': {
      const now = state.weather[/** @type {'temperature' | 'wind' | 'clouds' | 'precipitation'} */ (need.level)];
      return (need.min === null || now >= need.min) && (need.max === null || now <= need.max);
    }
    default:
      return false;
  }
}

/**
 * @param {GameState} state
 * @param {Need[]} needs
 */
export function meetsAll(state, needs) {
  return needs.every((n) => meets(state, n));
}

/**
 * Can this event start now? Its own needs are met, and an event that happens
 * once hasn't happened yet.
 * @param {GameState} state
 * @param {string} id
 */
export function canStart(state, id) {
  const event = content.events[id];
  if (!event || event.retired) return false;
  if (event.once && state.eventsSeen[id]) return false;
  return meetsAll(state, event.needs);
}

/**
 * Which of a text's parts show now (D88): the string keys to put together, in
 * order. A conditional part shows its text when its needs are met, else its
 * otherwise, if it has one.
 * @param {GameState} state
 * @param {import('../../tools/event-text.mjs').Text} parts
 * @returns {string[]}
 */
export function textNow(state, parts) {
  /** @type {string[]} */
  const keys = [];
  for (const part of parts) {
    if (typeof part === 'string') keys.push(part);
    else if (meetsAll(state, part.needs)) keys.push(part.text);
    else if (part.otherwise !== undefined) keys.push(part.otherwise);
  }
  return keys;
}

/**
 * The open event's slide, and the choices the player can take, each text as
 * the string keys of the parts that show now (textNow). A choice whose
 * requirements aren't met is hidden (the prototype's rule).
 * @param {GameState} state
 * @returns {{ id: string, title: string[], art?: string, text: string[],
 *   choices: { index: number, text: string[] }[] } | null}
 */
export function openSlide(state) {
  if (!state.event) return null;
  const event = content.events[state.event.id];
  const slide = event?.slides[state.event.slide];
  if (!slide) return null;
  return {
    id: event.id,
    title: textNow(state, event.title),
    ...(event.art ? { art: event.art } : {}),
    text: textNow(state, slide.text),
    choices: slide.choices
      .map((/** @type {Choice} */ c, /** @type {number} */ index) => ({ index, text: textNow(state, c.text), ok: meetsAll(state, c.needs) }))
      .filter((/** @type {{ ok: boolean }} */ c) => c.ok)
      .map(({ index, text }) => ({ index, text })),
  };
}

/**
 * Opens an event at its first slide. Changes `state` in place (a copy the
 * caller owns).
 * @param {GameState} state
 * @param {string} id
 * @returns {GameEvent}
 */
function open(state, id) {
  state.event = { id, slide: content.events[id].first };
  state.eventsSeen[id] = (state.eventsSeen[id] ?? 0) + 1;
  return { type: 'event-started', event: id };
}

/**
 * Starts an event straight away, as the ?dev bench does; ignores its needs.
 * @param {GameState} state
 * @param {string} id
 * @returns {GameState}
 */
export function startEvent(state, id) {
  if (!content.events[id]) return state;
  const next = structuredClone(state);
  open(next, id);
  return next;
}

/**
 * After a cast: whatever starts an event, in order: an item fished up, an
 * event whose needs are now met, the event meter. One event at a time; the
 * meter still fills while one is open. Changes `state` in place (a copy the
 * caller owns).
 * @param {GameState} state
 * @param {Dice} dice  The `events` stream.
 * @param {{ found?: string, empty?: boolean }} cast  What the cast brought up.
 * @returns {GameEvent[]}
 */
export function afterCast(state, dice, { found, empty = false }) {
  state.eventMeter += dice.roll20() + (empty ? METER_EMPTY_BONUS : 0);
  const meterFull = state.eventMeter > METER_FIRES;
  if (meterFull) state.eventMeter = 0;
  if (state.event) return [];

  const itemEvent = found ? content.items[found]?.event : null;
  if (itemEvent && canStart(state, itemEvent)) return [open(state, itemEvent)];

  for (const event of Object.values(content.events)) {
    if (event.trigger === 'needs' && canStart(state, event.id)) return [open(state, event.id)];
  }

  if (meterFull) {
    const loc = content.locations[state.location];
    const spot = state.spot ? loc.spots?.find((/** @type {{ id: string }} */ s) => s.id === state.spot) : null;
    const table = [...(loc.events ?? []), ...(spot?.events ?? [])].filter((e) => canStart(state, e.id));
    const chosen = pick(table, dice);
    if (chosen) return [open(state, chosen.id)];
  }
  return [];
}

/**
 * The player picks a choice on the open slide: its effects, then the next
 * slide or the end.
 * @param {GameState} state
 * @param {number} index  The choice's place on the slide (openSlide's `index`).
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function choose(state, index) {
  if (!state.event) return { state, events: [] };
  const event = content.events[state.event.id];
  /** @type {Choice | undefined} */
  const choice = event?.slides[state.event.slide]?.choices[index];
  if (!choice || !meetsAll(state, choice.needs)) return { state, events: [] };

  const next = structuredClone(state);
  const levelBefore = levelFor(next.character.xp);
  /** @type {GameEvent[]} */
  const events = [];
  for (const effect of choice.effects) events.push(...applyEffect(next, effect));
  const levelAfter = levelFor(next.character.xp);
  if (levelAfter > levelBefore) events.push({ type: 'level-up', level: levelAfter });

  next.event = choice.to === 'end' ? null : { id: event.id, slide: choice.to };
  if (!next.event) events.push({ type: 'event-ended', event: event.id });
  return { state: next, events };
}

/**
 * @param {GameState} state  Changed in place.
 * @param {Effect} effect
 * @returns {GameEvent[]}  For the log. Luck is hidden (R6.7), and flags too.
 */
function applyEffect(state, effect) {
  switch (effect.kind) {
    case 'luck':
      state.character.luck += effect.add;
      return [];
    case 'xp':
      state.character.xp += effect.add;
      return [{ type: 'event-xp', xp: effect.add }];
    case 'item': {
      if (effect.add > 0) {
        const stack = state.bags.find((b) => b.id === effect.id);
        if (stack) stack.count += effect.add;
        else state.bags.push({ id: effect.id, count: effect.add });
        state.found[effect.id] = (state.found[effect.id] ?? 0) + effect.add;
        return [{ type: 'event-gained', item: effect.id, count: effect.add }];
      }
      const lost = takeFromBags(state, effect.id, -effect.add);
      return lost > 0 ? [{ type: 'event-lost', item: effect.id, count: lost }] : [];
    }
    case 'flag':
      if (effect.set) state.flags[effect.name] = true;
      else delete state.flags[effect.name];
      return [];
    default:
      return [];
  }
}

/**
 * @param {GameState} state
 * @param {string} id
 */
function countInBags(state, id) {
  return state.bags.filter((b) => b.id === id).reduce((n, b) => n + b.count, 0);
}

/**
 * Takes up to `count` of an item out of the bags. Equipped items aren't in
 * the bags (D83), so they are safe.
 * @param {GameState} state  Changed in place.
 * @param {string} id
 * @param {number} count
 * @returns {number} How many were taken.
 */
function takeFromBags(state, id, count) {
  let left = count;
  for (const stack of state.bags) {
    if (stack.id !== id || left === 0) continue;
    const n = Math.min(stack.count, left);
    stack.count -= n;
    left -= n;
  }
  state.bags = state.bags.filter((b) => b.count > 0);
  return count - left;
}
