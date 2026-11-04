// @ts-check
// Equipment slots and the bags (R8.1, R8.2; DEV_PLAN 5.1, 5.2; D83).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from '../src/engine/state.js';
import { EQUIPMENT_SLOTS, equip, fits, moveEquipped, moveInBags, quickEquip, unequip } from '../src/engine/equipment.js';
import { content } from '../src/generated/content.js';

const character = {
  name: 'Testek',
  gender: /** @type {const} */ ('f'),
  classId: 'rogue',
  stats: { fishingSkill: 3, fishFind: 5, treasureFind: 7 },
  luck: 0,
  xp: 0,
};
/** @param {{ id: string, count: number }[]} bags */
const withBags = (bags) => ({ ...newGame({ seed: 1, character }), bags });

test('every equippable item fits exactly the slots of its kind', () => {
  const kinds = new Set(EQUIPMENT_SLOTS.map((s) => s.kind));
  for (const item of Object.values(content.items)) {
    if (!item.slot) continue;
    assert.ok(kinds.has(item.slot), `${item.id}: no ${item.slot} slot`);
    for (const s of EQUIPMENT_SLOTS) assert.equal(fits(item.id, s.key), s.kind === item.slot, `${item.id} in ${s.key}`);
  }
  assert.equal(fits('bent-fork', 'trinket1'), false, 'junk fits nowhere');
});

test('there is an item for every slot, to test with (D83)', () => {
  for (const { kind } of EQUIPMENT_SLOTS) {
    assert.ok(
      Object.values(content.items).some((i) => i.slot === kind),
      `nothing for the ${kind} slot`,
    );
  }
});

test('equipping swaps with what was there, into the place it came from', () => {
  const state = withBags([{ id: 'bent-fork', count: 1 }, { id: 'willow-rod', count: 1 }, { id: 'snail-shell', count: 1 }]);
  const out = equip(state, 1, 'rod');
  assert.equal(out.error, undefined);
  assert.deepEqual(out.state.equipped.rod, { id: 'willow-rod', count: 1 });
  assert.deepEqual(out.state.bags.map((b) => b.id), ['bent-fork', 'stick', 'snail-shell']);
  assert.deepEqual(state.equipped.rod, { id: 'stick', count: 1 }, 'the old state is untouched');
});

test('the wrong slot, or junk, is refused with a reason', () => {
  const state = withBags([{ id: 'straw-hat', count: 1 }, { id: 'bent-fork', count: 1 }]);
  assert.deepEqual(equip(state, 0, 'rod'), { state, error: 'wrongSlot' });
  assert.deepEqual(equip(state, 1, 'hat'), { state, error: 'notEquippable' });
  assert.deepEqual(quickEquip(state, 1), { state, error: 'notEquippable' });
});

test('one item from a stack; bait goes in as the whole stack and joins more of itself', () => {
  let state = withBags([{ id: 'straw-hat', count: 2 }, { id: 'bread-crumbs', count: 5 }]);
  state = equip(state, 0, 'hat').state;
  assert.deepEqual(state.equipped.hat, { id: 'straw-hat', count: 1 });
  assert.deepEqual(state.bags, [{ id: 'straw-hat', count: 1 }, { id: 'bread-crumbs', count: 5 }]);
  assert.equal(equip(state, 0, 'hat').state, state, 'the same hat again changes nothing');
  state = equip(state, 1, 'bait').state;
  assert.deepEqual(state.equipped.bait, { id: 'bread-crumbs', count: 5 });
  state = equip({ ...state, bags: [...state.bags, { id: 'bread-crumbs', count: 3 }] }, 1, 'bait').state;
  assert.deepEqual(state.equipped.bait, { id: 'bread-crumbs', count: 8 });
  assert.deepEqual(state.bags, [{ id: 'straw-hat', count: 1 }]);
});

test('right-click equips into the first empty slot that fits, else the first', () => {
  let state = withBags([{ id: 'fish-compendium', count: 1 }, { id: 'heavy-bait', count: 1 }, { id: 'mega-mass-fish-chum', count: 1 }]);
  state = quickEquip(state, 0).state;
  state = quickEquip(state, 0).state;
  assert.equal(state.equipped.trinket1?.id, 'fish-compendium');
  assert.equal(state.equipped.trinket2?.id, 'heavy-bait');
  state = quickEquip(state, 0).state;
  assert.equal(state.equipped.trinket1?.id, 'mega-mass-fish-chum');
  assert.deepEqual(state.bags, [{ id: 'fish-compendium', count: 1 }]);
});

test('unequipping: to the bags, onto its own stack, or swapping with an item that fits', () => {
  const state = withBags([{ id: 'bent-fork', count: 1 }, { id: 'willow-rod', count: 1 }]);
  const off = unequip(state, 'rod', 0).state;
  assert.equal(off.equipped.rod, null);
  assert.deepEqual(off.bags.map((b) => b.id), ['stick', 'bent-fork', 'willow-rod']);
  const swapped = unequip(state, 'rod', 1).state;
  assert.equal(swapped.equipped.rod?.id, 'willow-rod');
  assert.deepEqual(swapped.bags.map((b) => b.id), ['bent-fork', 'stick']);
  const baited = { ...withBags([{ id: 'bread-crumbs', count: 2 }]), equipped: { ...state.equipped, bait: { id: 'bread-crumbs', count: 3 } } };
  assert.deepEqual(unequip(baited, 'bait').state.bags, [{ id: 'bread-crumbs', count: 5 }]);
});

test('trinkets swap between their two slots; other slots refuse', () => {
  const state = equip(withBags([{ id: 'fish-compendium', count: 1 }]), 0, 'trinket1').state;
  const moved = moveEquipped(state, 'trinket1', 'trinket2').state;
  assert.equal(moved.equipped.trinket1, null);
  assert.equal(moved.equipped.trinket2?.id, 'fish-compendium');
  assert.equal(moveEquipped(state, 'trinket1', 'hat').error, 'wrongSlot');
});

test('rearranging the bags: two stacks swap; onto an empty slot, to the end', () => {
  const state = withBags([{ id: 'a', count: 1 }, { id: 'b', count: 1 }, { id: 'c', count: 1 }]);
  assert.deepEqual(moveInBags(state, 0, 2).state.bags.map((b) => b.id), ['c', 'b', 'a']);
  assert.deepEqual(moveInBags(state, 0, null).state.bags.map((b) => b.id), ['b', 'c', 'a']);
  assert.equal(moveInBags(state, 1, 1).state, state);
});
