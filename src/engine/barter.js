// @ts-check
// Barter (R18, D86, D123): a vendor's offers, each with fixed costs in items
// and fish, traded in the barter window; the perpetual stew, which takes fish
// and gives a bowl (R18.7, R19.4); and what else a fish in the bucket can be
// used for (R21): let go, eaten raw, put in the aquarium.
//
// Trades are counted among the flags, as counters events can read (R18.4):
// `trades-alchemist`, and per offer `trades-alchemist-potion-of-breath`.

import { content } from '../generated/content.js';
import { RARITIES, sameFish } from './fish.js';
import { meetsAll } from './events.js';
import { vendorStatus } from './schedule.js';
import { addBuff, buffFrom, giveBuff } from './buffs.js';
import { hasPerk } from './perks.js';
import { poolKey } from './champions.js';
import { levelFor } from './state.js';
import { levelUp } from './perks.js';

/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {import('./fish.js').FishInstance} FishInstance */
/** @typedef {import('./game.js').GameEvent} GameEvent */
/** @typedef {{ item?: string, fish?: string, rarity?: string, count: number }} Cost */
/** @typedef {{ id: string, gives: { item?: string, count?: number, buff?: string }, costs: Cost[],
 *   needs?: import('../../tools/event-text.mjs').Need[] }} Offer */

/**
 * The offers a vendor shows the player now (R18.3).
 * @param {GameState} state
 * @param {string} vendorId
 * @returns {Offer[]}
 */
export function offersFor(state, vendorId) {
  const vendor = content.vendors?.[vendorId];
  return (vendor?.offers ?? []).filter((/** @type {Offer} */ o) => meetsAll(state, o.needs ?? []));
}

/**
 * Does a fish pay for a fish cost?
 * @param {FishInstance} fish
 * @param {Cost} cost
 */
function qualifies(fish, cost) {
  if (cost.fish && cost.fish !== 'any' && fish.species !== cost.fish) return false;
  if (cost.rarity && RARITIES.indexOf(fish.rarity) < RARITIES.indexOf(cost.rarity)) return false;
  return true;
}

/**
 * How many the player has towards a cost, and how many it needs (R18.2).
 * Equipped items don't count (D83).
 * @param {GameState} state
 * @param {Cost} cost
 */
export function costStatus(state, cost) {
  const have = cost.item
    ? state.bags.filter((b) => b.id === cost.item).reduce((n, b) => n + b.count, 0)
    : state.bucket.filter((b) => qualifies(b.fish, cost)).reduce((n, b) => n + b.count, 0);
  return { have, need: cost.count, met: have >= cost.count };
}

/**
 * Can the player make this trade now: the vendor in, the offer shown, every cost met?
 * @param {GameState} state
 * @param {string} vendorId
 * @param {string} offerId
 */
export function canTrade(state, vendorId, offerId) {
  if (vendorStatus(state, vendorId) !== 'open') return false;
  const offer = offersFor(state, vendorId).find((o) => o.id === offerId);
  return Boolean(offer && offer.costs.every((c) => costStatus(state, c).met));
}

/**
 * Makes a trade (R18): the costs go, the least valuable fish that qualify
 * first (R18.5), and what the offer gives comes. Counted for events (R18.4).
 * @param {GameState} state
 * @param {string} vendorId
 * @param {string} offerId
 * @returns {{ state: GameState, events: GameEvent[] }}  The same state if it can't be made.
 */
export function trade(state, vendorId, offerId) {
  if (!canTrade(state, vendorId, offerId)) return { state, events: [] };
  const offer = /** @type {Offer} */ (offersFor(state, vendorId).find((o) => o.id === offerId));
  const next = structuredClone(state);
  const levelBefore = levelFor(next.character.xp);
  /** @type {GameEvent[]} */
  const events = [];
  for (const cost of offer.costs) {
    if (cost.item) {
      let left = cost.count;
      for (const stack of next.bags) {
        if (stack.id !== cost.item || left === 0) continue;
        const n = Math.min(stack.count, left);
        stack.count -= n;
        left -= n;
      }
      next.bags = next.bags.filter((b) => b.count > 0);
      events.push({ type: 'traded-away', item: cost.item, count: cost.count });
    } else {
      for (const fish of takeFish(next, cost)) events.push({ type: 'traded-fish', fish: fish.fish, count: fish.count });
    }
  }
  if (offer.gives.item) {
    const count = offer.gives.count ?? 1;
    const stack = next.bags.find((b) => b.id === offer.gives.item);
    if (stack) stack.count += count;
    else next.bags.push({ id: /** @type {string} */ (offer.gives.item), count });
    next.found[offer.gives.item] = (next.found[offer.gives.item] ?? 0) + count;
    events.push({ type: 'event-gained', item: offer.gives.item, count });
  }
  if (offer.gives.buff) events.push(...giveBuff(next, offer.gives.buff));
  const total = `trades-${vendorId}`;
  const each = `trades-${vendorId}-${offerId}`;
  next.flags[total] = (Number(next.flags[total]) || 0) + 1;
  next.flags[each] = (Number(next.flags[each]) || 0) + 1;
  levelUp(next, levelBefore, events);
  return { state: next, events };
}

/**
 * Takes the fish a cost asks for out of the bucket, the least valuable first
 * (lowest rarity, then smallest). Changes `state` in place.
 * @param {GameState} state
 * @param {Cost} cost
 */
function takeFish(state, cost) {
  const rank = (/** @type {FishInstance} */ f) => RARITIES.indexOf(f.rarity) * 10000 + f.size;
  /** @type {{ fish: FishInstance, count: number }[]} */
  const taken = [];
  for (let i = 0; i < cost.count; i++) {
    const stacks = state.bucket.filter((b) => qualifies(b.fish, cost));
    if (!stacks.length) break;
    const stack = stacks.reduce((a, b) => (rank(b.fish) < rank(a.fish) ? b : a));
    stack.count--;
    const line = taken.find((t) => t.fish === stack.fish);
    if (line) line.count++;
    else taken.push({ fish: stack.fish, count: 1 });
    state.bucket = state.bucket.filter((b) => b.count > 0);
  }
  return taken;
}

// ---------- A fish out of the bucket (R21) ----------

/**
 * One fish out of a bucket stack. Changes `state` in place.
 * @param {GameState} state
 * @param {number} index
 * @returns {FishInstance | null}
 */
function fromBucket(state, index) {
  const stack = state.bucket[index];
  if (!stack) return null;
  stack.count--;
  state.bucket = state.bucket.filter((b) => b.count > 0);
  return stack.fish;
}

/**
 * Lets a fish go, at will (R21.1): back into the water here, into the pool
 * of fish that can be met again (R3.6). A class fish is an ordinary fish then
 * (D114).
 * @param {GameState} state
 * @param {number} index  Into the bucket.
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function letGo(state, index) {
  // In town there's no water to let it go into (R21.1).
  if (content.locations[state.location]?.town) return { state, events: [] };
  const next = structuredClone(state);
  const fish = fromBucket(next, index);
  if (!fish) return { state, events: [] };
  const { champion, ...plain } = /** @type {FishInstance & { champion?: string }} */ (fish);
  const key = poolKey(next);
  next.escaped[key] = [...(next.escaped[key] ?? []), { ...plain, tries: 0 }];
  return { state: next, events: [{ type: 'released', fish }] };
}

/**
 * The buff a fish gives on its own: its stew effects (R19.4), from content.
 * @param {string} species
 * @returns {import('./values.js').Effect[]}
 */
export function stewEffects(species) {
  return content.fish[species]?.stew ?? [];
}

/**
 * Sushi enjoyer (R21.1): eats a fish raw for its stew buff, for a few casts.
 * @param {GameState} state
 * @param {number} index
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function eatFish(state, index) {
  if (!hasPerk(state, 'sushi-enjoyer') || !state.bucket[index]) return { state, events: [] };
  const next = structuredClone(state);
  const fish = /** @type {FishInstance} */ (fromBucket(next, index));
  const rules = content.rules.stew;
  addBuff(next, {
    id: `sushi-${fish.species}`,
    source: 'sushi-enjoyer',
    effects: stewEffects(fish.species),
    casts: rules.eatCasts,
    // Named for the fish (D124: the buff's name is the fish's).
    label: [content.fish[fish.species].name],
  });
  return { state: next, events: [{ type: 'ate-fish', fish }] };
}

// ---------- The perpetual stew (R18.7, R19.4) ----------

/**
 * Puts a fish from the bucket into the pot. Only at the inn.
 * @param {GameState} state
 * @param {number} index
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function addToStew(state, index) {
  if (!atStew(state) || !state.bucket[index]) return { state, events: [] };
  const next = structuredClone(state);
  const fish = /** @type {FishInstance} */ (fromBucket(next, index));
  next.stewPot = [...(next.stewPot ?? []), fish];
  return { state: next, events: [{ type: 'stewed', fish }] };
}

/**
 * Takes a fish back out of the pot, before the bowl is eaten.
 * @param {GameState} state
 * @param {number} index  Into the pot.
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function takeFromStew(state, index) {
  const fish = state.stewPot?.[index];
  if (!fish || !atStew(state)) return { state, events: [] };
  const next = structuredClone(state);
  next.stewPot = next.stewPot.filter((_, i) => i !== index);
  const twin = next.bucket.find((b) => sameFish(b.fish, fish));
  if (twin) twin.count++;
  else next.bucket.push({ fish, count: 1 });
  return { state: next, events: [] };
}

/**
 * Is the player where the stew is?
 * @param {GameState} state
 */
export function atStew(state) {
  const stew = Object.values(content.vendors ?? {}).find((v) => v.kind === 'stew');
  return Boolean(stew && state.location === stew.location && state.spot === stew.spot);
}

/**
 * The bowl the pot's fish would make (R19.4): game minutes by each fish's
 * rarity, the stew's warmth, and the stew buffs of the rarest kinds that
 * went in, up to `flavours` of them.
 * @param {FishInstance[]} pot
 * @returns {{ minutes: number, effects: import('./values.js').Effect[], flavours: string[] }}
 */
export function bowlOf(pot) {
  const rules = content.rules.stew;
  const minutes = pot.reduce((sum, f) => sum + (rules.minutes[f.rarity] ?? 0), 0);
  /** @type {Map<string, number>} */
  const best = new Map();
  for (const f of pot) best.set(f.species, Math.max(best.get(f.species) ?? -1, RARITIES.indexOf(f.rarity)));
  const flavours = [...best.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, rules.flavours)
    .map(([species]) => species);
  return { minutes, effects: [...rules.effects, ...flavours.flatMap(stewEffects)], flavours };
}

/**
 * Eats a bowl (R19.4): a buff that lasts game time, from what went into the
 * pot since the last bowl; the pot is empty again. A new bowl replaces a
 * running one.
 * @param {GameState} state
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function eatStew(state) {
  if (!atStew(state) || !state.stewPot?.length) return { state, events: [] };
  const next = structuredClone(state);
  const bowl = bowlOf(next.stewPot);
  const rules = content.rules.stew;
  addBuff(next, buffFrom(next, { id: 'perpetual-stew', effects: bowl.effects, duration: { minutes: Math.max(30, bowl.minutes) } }, { label: [rules.name] }));
  next.stewPot = [];
  return { state: next, events: [{ type: 'ate-stew', minutes: bowl.minutes, flavours: bowl.flavours }] };
}

// ---------- The aquarium (R17.5) ----------

/**
 * Is the player in their room, with the aquarium perk?
 * @param {GameState} state
 */
export function atAquarium(state) {
  return hasPerk(state, 'aquarium') && content.locations[state.location]?.town === true && state.spot === 'room';
}

/**
 * A fish from the bucket into the aquarium, if there's room.
 * @param {GameState} state
 * @param {number} index
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function toAquarium(state, index) {
  if (!atAquarium(state) || !state.bucket[index] || (state.aquarium ?? []).length >= content.rules.stew.aquarium) return { state, events: [] };
  const next = structuredClone(state);
  const fish = /** @type {FishInstance} */ (fromBucket(next, index));
  next.aquarium = [...(next.aquarium ?? []), fish];
  return { state: next, events: [{ type: 'to-aquarium', fish }] };
}

/**
 * A fish out of the aquarium, back into the bucket.
 * @param {GameState} state
 * @param {number} index  Into the aquarium.
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function fromAquarium(state, index) {
  const fish = state.aquarium?.[index];
  if (!fish || !atAquarium(state)) return { state, events: [] };
  const next = structuredClone(state);
  next.aquarium = next.aquarium.filter((_, i) => i !== index);
  const twin = next.bucket.find((b) => sameFish(b.fish, fish));
  if (twin) twin.count++;
  else next.bucket.push({ fish, count: 1 });
  return { state: next, events: [] };
}
