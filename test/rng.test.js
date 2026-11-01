import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, mulberry32, deriveSeed, randomSeed } from '../src/rng.js';

const draw = (rng, n) => Array.from({ length: n }, () => rng.next());

test('the same seed gives the same sequence', () => {
  assert.deepEqual(draw(createRng(42), 50), draw(createRng(42), 50));
});

test('different seeds give different sequences', () => {
  assert.notDeepEqual(draw(createRng(1), 10), draw(createRng(2), 10));
});

test('values are in [0, 1)', () => {
  for (const x of draw(createRng(7), 10000)) assert.ok(x >= 0 && x < 1, `${x}`);
});

test('the sequence is pinned: mulberry32 exactly, as the recorded fixtures assume', () => {
  // Saves and dev replays (?dev&seed=N) depend on these numbers; a change to
  // the generator would quietly change every seeded session.
  const rand = mulberry32(20);
  assert.deepEqual([rand(), rand(), rand()].map((x) => x.toFixed(10)),
    ['0.7526106623', '0.3850033404', '0.5976068757']);
});

test('state resumes a stream exactly where it left off', () => {
  const a = createRng(123);
  draw(a, 17);
  const b = createRng(a.state);
  assert.deepEqual(draw(b, 20), draw(a, 20));
});

test('int(n) covers 0..n-1 and nothing else', () => {
  const rng = createRng(9);
  const seen = new Set(Array.from({ length: 2000 }, () => rng.int(6)));
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3, 4, 5]);
});

test('derived streams are fixed per seed and label, and differ between labels', () => {
  assert.equal(deriveSeed(5, 'rules'), deriveSeed(5, 'rules'));
  assert.notEqual(deriveSeed(5, 'rules'), deriveSeed(5, 'opponent'));
  assert.notEqual(deriveSeed(5, 'rules'), deriveSeed(6, 'rules'));
  const s = deriveSeed(0xffffffff, 'throw');
  assert.ok(Number.isInteger(s) && s >= 0 && s <= 0xffffffff);
});

test('randomSeed is a uint32', () => {
  const s = randomSeed();
  assert.ok(Number.isInteger(s) && s >= 0 && s <= 0xffffffff);
});
