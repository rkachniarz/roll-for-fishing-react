// @ts-check
// Tooltips made from effects (R8.6; DEV_PLAN 5.4).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectLine } from '../src/ui/effects.js';
import { GAME_VALUES } from '../src/engine/values.js';
import { content } from '../src/generated/content.js';

test('an effect reads as its amount and the value, green when it helps, red when it hurts', () => {
  assert.deepEqual(effectLine({ value: 'fishingSkill', add: 2 }), { text: '+2 Fishing Skill', tone: 'good' });
  assert.deepEqual(effectLine({ value: 'treasureFind', add: -2 }), { text: '−2 Treasure Find', tone: 'bad' });
  assert.deepEqual(effectLine({ value: 'fishDifficulty', add: 3 }), { text: '+3 fish difficulty', tone: 'bad' });
  assert.deepEqual(effectLine({ value: 'fishingSkill', add: 'd6' }), { text: '+d6 Fishing Skill', tone: 'good' });
});

test('times in seconds, chances in percent', () => {
  assert.deepEqual(effectLine({ value: 'biteDelayMin', add: 500 }), { text: '+0.5 s shortest wait for a bite', tone: 'bad' });
  assert.deepEqual(effectLine({ value: 'reactionFast', add: -50 }), { text: '−0.05 s time for a fast strike', tone: 'bad' });
  assert.deepEqual(effectLine({ value: 'baitRecovery', add: 15 }), { text: '+15% chance to save bait', tone: 'good' });
});

test('advantage reads as words; two or more is strong', () => {
  assert.deepEqual(effectLine({ value: 'playerVantage', add: 1 }), { text: 'Advantage on your roll', tone: 'good' });
  assert.deepEqual(effectLine({ value: 'playerVantage', add: 2 }), { text: 'Strong advantage on your roll', tone: 'good' });
  assert.deepEqual(effectLine({ value: 'playerVantage', add: -1 }), { text: 'Disadvantage on your roll', tone: 'bad' });
  assert.deepEqual(effectLine({ value: 'fishVantage', add: -1 }), { text: "Disadvantage on the fish's roll", tone: 'good' });
});

test('every effect in content and every game value has words', () => {
  for (const name of Object.keys(GAME_VALUES)) {
    for (const add of [1, -1]) assert.doesNotMatch(effectLine({ value: name, add }).text, /value\.|effect\./, name);
  }
  for (const item of Object.values(content.items)) {
    for (const e of item.effects ?? []) assert.doesNotMatch(effectLine(e).text, /value\.|effect\./, item.id);
  }
});
