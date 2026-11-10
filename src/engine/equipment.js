// @ts-check
// Equipment slots and moving items between them and the bags (docs/spec.md,
// R8.1, R8.2; D83). Only equipped items apply their effects (valuesFor in
// game.js reads every slot).
//
// A slot holds a stack, as a bag slot does: one item, except the bait slot,
// which takes a whole stack of bait and uses it up a piece at a time (D39).
// Every function here returns a new state, or the same state and an `error`
// (a key under `error.` in src/strings.js) when the move isn't allowed.

import { content } from '../generated/content.js';

/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {{ id: string, count: number }} Stack */
/** @typedef {'rod' | 'line' | 'bobber' | 'bait' | 'hat' | 'trinket'} SlotKind */

/**
 * The slots, in the order the character pane lists them. Two trinket slots for
 * now; perks and items may add more later (D83), as more entries here.
 * @type {{ key: string, kind: SlotKind }[]}
 */
export const EQUIPMENT_SLOTS = [
  { key: 'rod', kind: 'rod' },
  { key: 'line', kind: 'line' },
  { key: 'bobber', kind: 'bobber' },
  { key: 'bait', kind: 'bait' },
  { key: 'hat', kind: 'hat' },
  { key: 'trinket1', kind: 'trinket' },
  { key: 'trinket2', kind: 'trinket' },
];

/** @param {string} key */
export const slotKind = (key) => EQUIPMENT_SLOTS.find((s) => s.key === key)?.kind ?? null;

/**
 * Every slot, empty. A new game fills in what it starts with.
 * @returns {Record<string, Stack | null>}
 */
export function emptyEquipment() {
  return Object.fromEntries(EQUIPMENT_SLOTS.map((s) => [s.key, null]));
}

/**
 * Can this item go in this slot?
 * @param {string} id
 * @param {string} key
 */
export function fits(id, key) {
  const slot = content.items[id]?.slot;
  return Boolean(slot) && slot === slotKind(key);
}

/**
 * Adds a stack to the bags: onto a stack of the same item, else at `at` (an
 * index into the bags), else at the end.
 * @param {Stack[]} bags  Changed in place.
 * @param {Stack} stack
 * @param {number | null} [at]
 */
function putInBags(bags, stack, at = null) {
  const same = bags.find((b) => b.id === stack.id);
  if (same) same.count += stack.count;
  else if (at !== null && at >= 0 && at <= bags.length) bags.splice(at, 0, { ...stack });
  else bags.push({ ...stack });
}

/**
 * A bag item into a slot. Bait goes in as the whole stack; anything else one at
 * a time. Whatever was in the slot goes back to the bags, into the place the
 * new item came from if that place is now empty, as WoW swaps them.
 * @param {GameState} state
 * @param {number} index  Into state.bags.
 * @param {string} key  The slot.
 * @returns {{ state: GameState, error?: string }}
 */
export function equip(state, index, key) {
  const stack = state.bags[index];
  if (!stack) return { state };
  if (!content.items[stack.id]?.slot) return { state, error: 'notEquippable' };
  if (!fits(stack.id, key)) return { state, error: 'wrongSlot' };
  const bait = slotKind(key) === 'bait';
  const old = state.equipped[key];
  // The same item again: nothing to do, except that more bait joins the stack.
  if (old && old.id === stack.id && !bait) return { state };
  const next = structuredClone(state);
  const from = next.bags[index];
  const taken = bait ? from.count : 1;
  from.count -= taken;
  if (old && old.id === from.id) /** @type {Stack} */ (next.equipped[key]).count += taken;
  else next.equipped[key] = { id: from.id, count: taken };
  if (from.count === 0) next.bags.splice(index, 1);
  if (old && old.id !== from.id) putInBags(next.bags, old, from.count === 0 ? index : null);
  return { state: next };
}

/**
 * An equipped item back to the bags. Dropped on a bag item that fits the slot,
 * the two swap; otherwise it goes in at `at` (or onto its own stack).
 * @param {GameState} state
 * @param {string} key
 * @param {number | null} [at]  Index into state.bags where it was dropped.
 * @returns {{ state: GameState, error?: string }}
 */
export function unequip(state, key, at = null) {
  const old = state.equipped[key];
  if (!old) return { state };
  const target = at !== null ? state.bags[at] : undefined;
  if (target && target.id !== old.id && fits(target.id, key)) return equip(state, /** @type {number} */ (at), key);
  const next = structuredClone(state);
  next.equipped[key] = null;
  putInBags(next.bags, old, at);
  return { state: next };
}

/**
 * From one slot to another: trinket 1 and trinket 2 swap. Only between slots
 * of the same kind.
 * @param {GameState} state
 * @param {string} from
 * @param {string} to
 * @returns {{ state: GameState, error?: string }}
 */
export function moveEquipped(state, from, to) {
  if (from === to || !state.equipped[from]) return { state };
  if (slotKind(from) !== slotKind(to)) return { state, error: 'wrongSlot' };
  const next = structuredClone(state);
  [next.equipped[from], next.equipped[to]] = [next.equipped[to], next.equipped[from]];
  return { state: next };
}

/**
 * Rearranging the bags: two stacks swap places; onto an empty slot (`to` null
 * or past the end), the stack moves to the end.
 * @param {GameState} state
 * @param {number} from
 * @param {number | null} to
 * @returns {{ state: GameState, error?: string }}
 */
export function moveInBags(state, from, to) {
  if (from === to || !state.bags[from]) return { state };
  const next = structuredClone(state);
  if (to === null || !next.bags[to]) next.bags.push(...next.bags.splice(from, 1));
  else [next.bags[from], next.bags[to]] = [next.bags[to], next.bags[from]];
  return { state: next };
}

/**
 * Right-click on a bag item (D29): into the first empty slot it fits, or, with
 * none empty, the first slot it fits, as WoW does.
 * @param {GameState} state
 * @param {number} index
 * @returns {{ state: GameState, error?: string }}
 */
export function quickEquip(state, index) {
  const stack = state.bags[index];
  if (!stack) return { state };
  const keys = EQUIPMENT_SLOTS.filter((s) => fits(stack.id, s.key)).map((s) => s.key);
  if (!keys.length) return { state, error: 'notEquippable' };
  return equip(state, index, keys.find((k) => !state.equipped[k]) ?? keys[0]);
}

/** The bait a Tiny fish becomes on the hook (R13.4, D41). */
export const SMALL_FISH = 'small-fish';

/**
 * Can this fish go on the hook? Any fish in the Tiny size band (D41).
 * @param {import('./fish.js').FishInstance} fish
 */
export function isTiny(fish) {
  return content.rules['size-bands'].bands[fish.band]?.id === 'tiny';
}

/**
 * A Tiny fish from the bucket onto the hook, as live bait for predators
 * (R13.4, D41): it leaves the bucket and joins the Small fish in the bait slot.
 * Other bait in the slot goes back to the bags.
 * @param {GameState} state
 * @param {number} index  Into state.bucket.
 * @returns {{ state: GameState, error?: string, fish?: import('./fish.js').FishInstance }}
 */
export function hookFish(state, index) {
  const stack = state.bucket[index];
  if (!stack) return { state };
  if (!isTiny(stack.fish)) return { state, error: 'notTiny' };
  const next = structuredClone(state);
  const from = next.bucket[index];
  from.count--;
  if (from.count === 0) next.bucket.splice(index, 1);
  const old = next.equipped.bait;
  if (old?.id === SMALL_FISH) old.count++;
  else {
    if (old) putInBags(next.bags, old);
    next.equipped.bait = { id: SMALL_FISH, count: 1 };
  }
  return { state: next, fish: stack.fish };
}

/**
 * The equipped items' ids, slot by slot, skipping empty slots.
 * @param {GameState} state
 */
export function equippedIds(state) {
  return EQUIPMENT_SLOTS.map((s) => state.equipped[s.key]?.id).filter((id) => typeof id === 'string');
}
