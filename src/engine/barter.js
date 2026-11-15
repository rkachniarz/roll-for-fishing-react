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
import { diceFrom, levelFor } from './state.js';
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
  return { state: next, events: [{ type: 'released', fish }, ...conserve(next, fish)] };
}

/** The counter among the flags (R18.4's kind): endangered fish a Conservationist has let go. */
export const CONSERVED = 'endangered-released';

/**
 * A fish has been let go (D140): for a character with the Conservationist
 * perk an endangered one counts. Every `releasesPerLuck` of them give 1 Luck,
 * unseen, until `maxLuck`; after that each gives a share of its XP, rounded
 * up. Changes `state` in place.
 * @param {GameState} state
 * @param {FishInstance} fish
 * @returns {GameEvent[]}
 */
export function conserve(state, fish) {
  if (!hasPerk(state, 'conservationist') || !content.fish[fish.species]?.endangered) return [];
  const rules = content.rules.conservation;
  const count = Number(state.flags[CONSERVED] ?? 0) + 1;
  state.flags = { ...state.flags, [CONSERVED]: count };
  if (count <= rules.releasesPerLuck * rules.maxLuck) {
    if (count % rules.releasesPerLuck !== 0) return [];
    state.character.luck += 1;
    return [{ type: 'conserved', fish }];
  }
  const xp = Math.ceil((fish.xp * rules.xpPercent) / 100);
  const levelBefore = levelFor(state.character.xp);
  state.character.xp += xp;
  /** @type {GameEvent[]} */
  const events = [{ type: 'conserved', fish, xp }];
  levelUp(state, levelBefore, events);
  return events;
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
 * What a fish's taste does (D138): the minutes it adds to a bowl, and the
 * casts its buff lasts eaten raw, are multiplied by this.
 * @param {string} species
 * @returns {number}
 */
export function tasteFactor(species) {
  return content.rules.stew.taste[content.fish[species]?.taste ?? 'plain'] ?? 1;
}

/**
 * Sushi enjoyer (R21.1): eats a fish raw for its stew buff, for a few casts,
 * more or fewer by its taste. The player knows its taste from then on. A
 * freshwater fish may carry parasites (D138): a hidden roll by the fish's
 * risk, and a bad one leaves the player queasy on top of the buff.
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
    casts: Math.max(1, Math.round(rules.eatCasts * tasteFactor(fish.species))),
    // Named for the fish (D124: the buff's name is the fish's).
    label: [content.fish[fish.species].name],
  });
  next.tasted = { ...next.tasted, [fish.species]: true };
  // A fish with no risk draws nothing.
  const chance = rules.parasites[content.fish[fish.species].parasites] ?? 0;
  let queasy = false;
  if (chance > 0) {
    const { dice, commit } = diceFrom(next);
    queasy = dice.taste.roll100() <= chance;
    next.streams = commit();
  }
  const sick = content.buffs?.[rules.parasites.buff];
  if (queasy && sick) addBuff(next, buffFrom(next, sick, { label: [sick.name] }));
  return { state: next, events: [{ type: 'ate-fish', fish, queasy }] };
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
 * rarity, more or fewer by its taste (D138), the stew's warmth, and the stew
 * buffs of the rarest kinds that went in, up to `flavours` of them.
 * @param {FishInstance[]} pot
 * @returns {{ minutes: number, effects: import('./values.js').Effect[], flavours: string[] }}
 */
export function bowlOf(pot) {
  const rules = content.rules.stew;
  const minutes = pot.reduce((sum, f) => sum + Math.round((rules.minutes[f.rarity] ?? 0) * tasteFactor(f.species)), 0);
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
 * running one. The player learns the taste of one kind of fish in it, picked
 * at random from those they don't know yet, or from them all (D138).
 * @param {GameState} state
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function eatStew(state) {
  if (!atStew(state) || !state.stewPot?.length) return { state, events: [] };
  const next = structuredClone(state);
  const bowl = bowlOf(next.stewPot);
  const rules = content.rules.stew;
  addBuff(next, buffFrom(next, { id: 'perpetual-stew', effects: bowl.effects, duration: { minutes: Math.max(30, bowl.minutes) } }, { label: [rules.name] }));
  const kinds = [...new Set(next.stewPot.map((f) => f.species))].sort();
  const fresh = kinds.filter((k) => !next.tasted?.[k]);
  const from = fresh.length ? fresh : kinds;
  let taste = from[0];
  if (from.length > 1) {
    const { dice, commit } = diceFrom(next);
    taste = from[dice.taste.getRandomNumber(0, from.length - 1)];
    next.streams = commit();
  }
  next.tasted = { ...next.tasted, [taste]: true };
  next.stewPot = [];
  return { state: next, events: [{ type: 'ate-stew', minutes: bowl.minutes, flavours: bowl.flavours, taste }] };
}

// ---------- The aquarium (R17.5) ----------

/**
 * Could one fish eat the other (D152)? A predator, and the other well under its length.
 * @param {FishInstance} a
 * @param {FishInstance} b
 */
export function eats(a, b) {
  return Boolean(content.fish[a.species]?.predator) && b.size < a.size * content.rules.tank.preyRatio;
}

/**
 * Putting a fish in the tank beside one that would eat it, or that it would
 * eat (D152): the pair, for the page to warn about, or null.
 * @param {GameState} state
 * @param {FishInstance} fish
 * @returns {{ eater: FishInstance, eaten: FishInstance } | null}
 */
export function tankDanger(state, fish) {
  for (const other of state.aquarium ?? []) {
    if (eats(other, fish)) return { eater: other, eaten: fish };
    if (eats(fish, other)) return { eater: fish, eaten: other };
  }
  return null;
}

/**
 * The days since the tank was last looked at (D152): each one, a predator
 * with prey in the tank may eat it, unless the tank was fed. Run when the
 * player comes into the room. Changes `state` in place; draws from `tank`
 * only when there is prey to eat.
 * @param {GameState} state
 * @returns {GameEvent[]}
 */
export function tankMeals(state) {
  const rules = content.rules.tank;
  const today = Math.floor(state.time / (24 * 60));
  const tank = state.tank ?? { day: today, fedUntil: 0 };
  const days = Math.min(rules.days, Math.max(0, today - tank.day));
  state.tank = { ...tank, day: today };
  if (!days || !hasPerk(state, 'aquarium')) return [];
  /** @type {GameEvent[]} */
  const events = [];
  const { dice, commit } = diceFrom(state);
  let drew = false;
  for (let d = 0; d < days; d++) {
    // A fed tank: nobody hunts until the feeding wears off.
    const dayStart = (today - days + d) * 24 * 60;
    if (dayStart < tank.fedUntil) continue;
    const fish = state.aquarium ?? [];
    for (const eater of fish) {
      const prey = fish.filter((f) => f !== eater && eats(eater, f));
      if (!prey.length) continue;
      drew = true;
      if (dice.tank.roll100() > rules.chancePerDay) continue;
      const eaten = prey[dice.tank.getRandomNumber(0, prey.length - 1)];
      state.aquarium = (state.aquarium ?? []).filter((f) => f !== eaten);
      events.push({ type: 'tank-eaten', eater, fish: eaten });
      break;
    }
  }
  if (drew) state.streams = commit();
  return events;
}

/**
 * Feeds the tank (D152): one bait from the bags, and the predators don't hunt
 * for a few game days.
 * @param {GameState} state
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function feedTank(state) {
  const bait = state.bags.find((b) => content.items[b.id]?.slot === 'bait');
  if (!atAquarium(state) || !bait) return { state, events: [] };
  const next = structuredClone(state);
  const mine = /** @type {{ id: string, count: number }} */ (next.bags.find((b) => b.id === bait.id));
  mine.count--;
  next.bags = next.bags.filter((b) => b.count > 0);
  next.tank = { ...(next.tank ?? { day: 0, fedUntil: 0 }), fedUntil: next.time + content.rules.tank.fedDays * 24 * 60 };
  return { state: next, events: [{ type: 'tank-fed', item: bait.id }] };
}

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
