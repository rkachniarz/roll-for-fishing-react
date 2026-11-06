import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { diceFor } from '../src/dice.js';

const rollMany = (fn, n = 20000) => Array.from({ length: n }, fn);

test('each die covers exactly its faces', () => {
  const { roll20, roll100, roll12, roll6, roll2d6 } = diceFor(createRng(1));
  const faces = (fn) => [...new Set(rollMany(fn))].sort((a, b) => a - b);
  const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  assert.deepEqual(faces(() => roll20()), range(1, 20));
  assert.deepEqual(faces(roll100), range(1, 100));
  assert.deepEqual(faces(roll12), range(1, 12));
  assert.deepEqual(faces(roll6), range(1, 6));
  assert.deepEqual(faces(roll2d6), range(2, 12));
});

test('getRandomNumber includes both ends', () => {
  const { getRandomNumber } = diceFor(createRng(2));
  const seen = new Set(rollMany(() => getRandomNumber(3, 5), 500));
  assert.deepEqual([...seen].sort(), [3, 4, 5]);
});

test('2d6 is a bell, not flat: 7 comes up about 6 times in 36', () => {
  const { roll2d6 } = diceFor(createRng(3));
  const rolls = rollMany(roll2d6);
  const sevens = rolls.filter((r) => r === 7).length / rolls.length;
  const twos = rolls.filter((r) => r === 2).length / rolls.length;
  assert.ok(Math.abs(sevens - 6 / 36) < 0.01, `7s: ${sevens}`);
  assert.ok(Math.abs(twos - 1 / 36) < 0.005, `2s: ${twos}`);
});

test('advantage raises the average d20, disadvantage lowers it', () => {
  const mean = (vantage) => {
    const { roll20 } = diceFor(createRng(4));
    const rolls = rollMany(() => roll20(vantage));
    return rolls.reduce((a, b) => a + b, 0) / rolls.length;
  };
  // Expected: 10.5 straight, about 13.8 with advantage, 7.2 with disadvantage.
  assert.ok(Math.abs(mean(0) - 10.5) < 0.15);
  assert.ok(Math.abs(mean(1) - 13.82) < 0.15);
  assert.ok(Math.abs(mean(-1) - 7.18) < 0.15);
  // More advantage is still one advantage (D&D, and the prototype's clover).
  assert.equal(mean(2), mean(1));
});

test('roll20Kept says which die did not count, from the same draws as roll20', () => {
  for (const vantage of [-1, 0, 1]) {
    const a = diceFor(createRng(9));
    const b = diceFor(createRng(9));
    for (let i = 0; i < 200; i++) {
      const kept = a.roll20Kept(vantage);
      assert.equal(kept.result, b.roll20(vantage));
      if (vantage === 0) assert.equal(kept.dropped, undefined);
      else if (vantage > 0) assert.ok(/** @type {number} */ (kept.dropped) <= kept.result);
      else assert.ok(/** @type {number} */ (kept.dropped) >= kept.result);
    }
  }
});

test('the same seed rolls the same dice', () => {
  const a = diceFor(createRng(99));
  const b = diceFor(createRng(99));
  assert.deepEqual(
    rollMany(() => [a.roll20(1), a.roll2d6(), a.roll100()], 50),
    rollMany(() => [b.roll20(1), b.roll2d6(), b.roll100()], 50),
  );
});
