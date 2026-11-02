// @ts-check
// The buff bar's text (R12.4, D31).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeBuff, remaining } from '../src/ui/buffbar.js';

const buff = (/** @type {Partial<import('../src/engine/state.js').Buff>} */ b) => ({ id: 'b', source: 's', effects: [], ...b });

test('casts left show as a number', () => {
  assert.equal(remaining(buff({ casts: 3 })), '3');
});

test('time rounds to the nearest minute (not up, as WoW does), then seconds under a minute', () => {
  assert.equal(remaining(buff({ ms: 4 * 60_000 + 29_000 })), '4m');
  assert.equal(remaining(buff({ ms: 4 * 60_000 + 31_000 })), '5m');
  assert.equal(remaining(buff({ ms: 89_000 })), '1m');
  assert.equal(remaining(buff({ ms: 60_000 })), '1m');
  assert.equal(remaining(buff({ ms: 59_900 })), '60s');
  assert.equal(remaining(buff({ ms: 44_100 })), '45s');
});

test('a description from the effects', () => {
  const b = buff({ effects: [{ value: 'fishFind', add: 20 }, { value: 'fishingSkill', add: -2 }, { value: 'treasureFind', add: 'd6' }] });
  assert.equal(describeBuff(b), '+20 Fish Find, −2 Fishing Skill, +d6 Treasure Find');
});
