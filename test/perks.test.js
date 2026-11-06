// @ts-check
// Perks (R6.3, D96): what each level offers, choosing, the level-1 perk given
// without a choice, passive perks in the game values, and old saves.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content } from '../src/generated/content.js';
import { SAVE_VERSION, deserialize, newGame } from '../src/engine/state.js';
import { valuesFor } from '../src/engine/game.js';
import { offers, owedLevels, perkSources, settlePerks, takePerk } from '../src/engine/perks.js';

/** @typedef {import('../src/engine/state.js').GameState} GameState */

const XP = content.rules.levels.xp;

/**
 * @param {string} classId
 * @param {number} level
 * @param {number} [seed]
 */
function character(classId, level, seed = 1) {
  return newGame({
    seed,
    character: { name: 'Testek', gender: 'f', classId, stats: { fishingSkill: 3, fishFind: 5, treasureFind: 7 }, luck: 0, xp: XP[level], perks: {} },
  });
}

test('every class has one perk at level 1 and a passive and an active at 3 and 5', () => {
  for (const c of Object.values(content.classes)) {
    const s = character(c.id, 8);
    assert.equal(offers(s, 1).length, 1, c.id);
    for (const level of [3, 5]) {
      const kinds = offers(s, level).map((id) => content.perks[id].kind);
      assert.deepEqual(kinds, ['passive', 'active'], `${c.id} level ${level}`);
    }
    assert.deepEqual(offers(s, 7), [], 'level 7 gives nothing');
  }
});

test('universal levels offer two universal perks, the same two after a reload', () => {
  const s = character('fish-fighter', 8);
  for (const level of content.rules.levels.universal) {
    const choice = offers(s, level);
    assert.equal(choice.length, 2);
    assert.notEqual(choice[0], choice[1]);
    for (const id of choice) assert.equal(content.perks[id].class, 'any');
    assert.deepEqual(offers(/** @type {GameState} */ (structuredClone(s)), level), choice);
  }
});

test('a non-repeatable universal perk taken is never offered again', () => {
  // Over many seeds, Bigger Bucket comes up at level 2 sometimes; take it there.
  for (let seed = 1; seed < 60; seed++) {
    let s = settlePerks(character('fish-fighter', 6, seed)).state;
    if (!offers(s, 2).includes('bigger-bucket')) continue;
    s = takePerk(s, 'bigger-bucket');
    assert.equal(s.character.perks[2], 'bigger-bucket');
    s = takePerk(s, offers(s, 3)[0]);
    assert.ok(!offers(s, 4).includes('bigger-bucket'));
    return;
  }
  assert.fail('Bigger Bucket never came up');
});

test('the level-1 perk is given without a choice; later levels wait, lowest first', () => {
  const { state, taken } = settlePerks(character('fish-fighter', 4));
  assert.deepEqual(taken, ['jump-in']);
  assert.deepEqual(owedLevels(state), [2, 3, 4]);
  // Only the lowest owed level can be chosen.
  const level3 = offers(state, 3)[0];
  assert.equal(takePerk(state, level3), state);
  const s2 = takePerk(state, offers(state, 2)[1]);
  assert.deepEqual(owedLevels(s2), [3, 4]);
  // Something not on offer changes nothing.
  assert.equal(takePerk(s2, 'gut'), s2);
});

test("a level-0 character is owed nothing", () => {
  const s = character('rogue-fisher', 0);
  assert.deepEqual(owedLevels(s), []);
  assert.deepEqual(settlePerks(s).taken, []);
});

test('passive perks change the game values; actives add nothing', () => {
  let s = character('fish-fighter', 5);
  s = { ...s, character: { ...s.character, perks: { 1: 'jump-in', 3: 'heavy-hand', 5: 'overwhelm' } } };
  const v = valuesFor(s).flat;
  assert.equal(v.naturalCatch, 19);
  assert.equal(v.playerVantage, 1);
  assert.equal(v.vantageStacks, 1);
  assert.deepEqual(perkSources(s).map((p) => p.label), ['heavy-hand', 'overwhelm']);
});

test('a repeatable perk taken twice counts twice', () => {
  let s = character('fish-fighter', 4);
  s = { ...s, character: { ...s.character, perks: { 2: 'steady-hands', 4: 'steady-hands' } } };
  assert.equal(valuesFor(s).flat.fishingSkill, 5);
});

test('a save from before perks loads with none taken', () => {
  const s = character('rogue-fisher', 4);
  const old = { ...structuredClone(s), version: 4, character: { ...s.character } };
  delete (/** @type {any} */ (old.character).perks);
  const loaded = deserialize(JSON.stringify(old));
  assert.equal(loaded.version, SAVE_VERSION);
  assert.deepEqual(loaded.character.perks, {});
  assert.deepEqual(settlePerks(loaded).taken, ['gut']);
});
