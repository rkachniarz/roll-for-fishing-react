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
//   arrive  the player arriving somewhere, a new game included (D89)
//
// The open event and its slide are in the state, so a reload comes back to
// the same slide. Choices draw no dice, what a choice does being written on
// it, except a trade's reward (7.9), from the `events` stream.

import { content } from '../generated/content.js';
import { pick } from './tables.js';
import { diceFrom, levelFor } from './state.js';
import { clock } from './time.js';
import { RARITIES } from './fish.js';

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
    case 'location':
      return state.location === need.id;
    case 'spot':
      return state.spot === need.id;
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
    case 'count': {
      const now = counter(state, need.name);
      return (need.min === null || now >= need.min) && (need.max === null || now <= need.max);
    }
    case 'fish':
      return state.bucket.filter((b) => !need.species || b.fish.species === need.species).reduce((n, b) => n + b.count, 0) >= need.count;
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
 * A counter an event keeps (7.7): a number among the flags, 0 if never set.
 * @param {GameState} state
 * @param {string} name
 */
export function counter(state, name) {
  return Number(state.flags[name]) || 0;
}

/** Game minutes in a day (time.js: 48 casts of 30 minutes). */
const DAY = 24 * 60;

/**
 * Can this event start now? Its own needs are met, an event that happens
 * once hasn't happened yet, and a visitor who comes back (`again`, 7.10)
 * has been away long enough.
 * @param {GameState} state
 * @param {string} id
 */
export function canStart(state, id) {
  const event = content.events[id];
  if (!event || event.retired) return false;
  if (event.once && state.eventsSeen[id]) return false;
  const last = state.eventsLast?.[id];
  if (event.again && last) {
    if (event.again.casts && state.book.casts - last.cast < event.again.casts) return false;
    if (event.again.days && state.time - last.time < event.again.days * DAY) return false;
  }
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
  // When, for a visitor who comes back (7.10).
  state.eventsLast = { ...(state.eventsLast ?? {}), [id]: { cast: state.book.casts, time: state.time } };
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
 * The player has arrived where `state` says: at the start of a new game, or
 * on moving to another location or spot. The first `trigger: arrive` event
 * that can start, starts (D89). Changes `state` in place (a copy the caller
 * owns).
 * @param {GameState} state
 * @returns {GameEvent[]}
 */
export function arrive(state) {
  if (state.event) return [];
  for (const event of Object.values(content.events)) {
    if (event.trigger === 'arrive' && canStart(state, event.id)) return [open(state, event.id)];
  }
  return [];
}

/**
 * After a cast: whatever starts an event, in order: an item fished up, an
 * event whose needs are now met, the event meter. One event at a time; the
 * meter still fills while one is open. Changes `state` in place (a copy the
 * caller owns).
 * @param {GameState} state
 * @param {Dice} dice  The `events` stream.
 * @param {{ found?: string, empty?: boolean, fill?: number }} cast  What the cast brought up,
 *   and how fast the meter fills, in percent (the eventMeterFill game value).
 * @returns {GameEvent[]}
 */
export function afterCast(state, dice, { found, empty = false, fill = 100 }) {
  state.eventMeter += Math.round(((dice.roll20() + (empty ? METER_EMPTY_BONUS : 0)) * fill) / 100);
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
  const { dice, commit } = diceFrom(next);
  for (const effect of choice.effects) events.push(...applyEffect(next, effect, dice.events));
  next.streams = commit();
  const levelAfter = levelFor(next.character.xp);
  if (levelAfter > levelBefore) events.push({ type: 'level-up', level: levelAfter });

  next.event = choice.to === 'end' ? null : { id: event.id, slide: choice.to };
  if (!next.event) events.push({ type: 'event-ended', event: event.id });
  return { state: next, events };
}

/**
 * @param {GameState} state  Changed in place.
 * @param {Effect} effect
 * @param {Dice} dice  The `events` stream, for a trade's reward (7.9).
 * @returns {GameEvent[]}  For the log. Luck is hidden (R6.7), and flags and counters too.
 */
function applyEffect(state, effect, dice) {
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
    case 'count':
      state.flags[effect.name] = counter(state, effect.name) + effect.add;
      return [];
    case 'fish':
      return takeFish(state, effect).map(({ fish, count }) => ({ type: 'event-lost-fish', fish, count }));
    case 'go': {
      // Moved by an event (7.6): the surface features stay behind, as with travel.
      const loc = content.locations[effect.location];
      state.location = effect.location;
      state.spot = effect.spot ?? loc.spots?.[0]?.id ?? null;
      state.features = [];
      return [{ type: 'moved', location: state.location, spot: state.spot }];
    }
    case 'lock':
      // Held where they are until an event unlocks them (R10.8, D51).
      state.locked = effect.set ? state.location : null;
      return [];
    case 'trade':
      return tradeJunk(state, effect.table, dice);
    default:
      return [];
  }
}

/**
 * Takes fish out of the bucket for an event (7.8): the least valuable first
 * (lowest rarity, then smallest), the smallest of a species, or the rarest
 * (highest rarity, then largest). As many as there are, up to the count.
 * @param {GameState} state  Changed in place.
 * @param {{ which: 'any' | 'species' | 'rarest', species: string | null, count: number }} what
 * @returns {{ fish: import('./fish.js').FishInstance, count: number }[]}  What went, a line per kind of fish.
 */
function takeFish(state, what) {
  const rank = (/** @type {import('./fish.js').FishInstance} */ f) => RARITIES.indexOf(f.rarity) * 10000 + f.size;
  /** @type {{ fish: import('./fish.js').FishInstance, count: number }[]} */
  const taken = [];
  for (let i = 0; i < what.count; i++) {
    const stacks = state.bucket.filter((b) => what.which !== 'species' || b.fish.species === what.species);
    if (!stacks.length) break;
    const stack = stacks.reduce((a, b) => ((what.which === 'rarest' ? rank(b.fish) > rank(a.fish) : rank(b.fish) < rank(a.fish)) ? b : a));
    stack.count--;
    const line = taken.find((t) => t.fish === stack.fish);
    if (line) line.count++;
    else taken.push({ fish: stack.fish, count: 1 });
    state.bucket = state.bucket.filter((b) => b.count > 0);
  }
  return taken;
}

/**
 * Is this junk useless (7.9)? Junk with a use is kept: one that starts an
 * event, can be equipped or does something, or is marked `useful`.
 * @param {string} id
 */
export function uselessJunk(id) {
  const item = content.items[id];
  return item?.category === 'junk' && !item.useful && !item.event && !item.slot && !item.effects;
}

/**
 * Every useless junk item in the bags goes (equipped items are safe, D83);
 * their values are added up, and the reward is picked from the table's
 * richest tier the total reaches (7.9). A unique reward already found is
 * left out (R8.10).
 * @param {GameState} state  Changed in place.
 * @param {string} tableId
 * @param {Dice} dice
 * @returns {GameEvent[]}
 */
function tradeJunk(state, tableId, dice) {
  const given = state.bags.filter((b) => uselessJunk(b.id));
  if (!given.length) return [];
  const total = given.reduce((sum, b) => sum + (content.items[b.id].value ?? 0) * b.count, 0);
  state.bags = state.bags.filter((b) => !given.includes(b));
  /** @type {GameEvent[]} */
  const events = given.map((b) => ({ type: 'event-lost', item: b.id, count: b.count }));
  /** @type {{ id: string, weight: number, min: number, count?: number }[]} */
  const rewards = (content.tables[tableId]?.rewards ?? []).filter((/** @type {{ id: string }} */ r) => !(content.items[r.id]?.unique && state.found[r.id]));
  const tier = Math.max(-1, ...rewards.filter((r) => r.min <= total).map((r) => r.min));
  const reward = pick(rewards.filter((r) => r.min === tier), dice);
  if (reward) {
    const count = reward.count ?? 1;
    const stack = state.bags.find((b) => b.id === reward.id);
    if (stack) stack.count += count;
    else state.bags.push({ id: reward.id, count });
    state.found[reward.id] = (state.found[reward.id] ?? 0) + count;
    events.push({ type: 'event-gained', item: reward.id, count });
  }
  return events;
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
