import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { diceFor } from '../src/dice.js';
import { TIMING, idleCast, startCast, tickCast, strike, gradeReaction } from '../src/engine/cast.js';

const dice = () => diceFor(createRng(7));
const FISH = { skill: 0, difficulty: 11 };

test('the bite comes within the configured delay', () => {
  const d = dice();
  for (let i = 0; i < 500; i++) {
    const cast = startCast(1000, d);
    assert.equal(cast.phase, 'waiting');
    if (cast.phase !== 'waiting') return;
    const delay = cast.biteAt - 1000;
    assert.ok(delay >= TIMING.biteDelayMin && delay <= TIMING.biteDelayMax, `${delay}`);
  }
});

test('waiting turns into a bite at biteAt, not before', () => {
  const cast = startCast(0, dice());
  if (cast.phase !== 'waiting') throw new Error();
  assert.equal(tickCast(cast, cast.biteAt - 1).phase, 'waiting');
  assert.equal(tickCast(cast, cast.biteAt).phase, 'bite');
});

test('reaction grades: fast +1, ok 0, bad -1, late at 3 s (R2.3, R2.4)', () => {
  assert.deepEqual(gradeReaction(0), { grade: 'fast', modifier: 1 });
  assert.deepEqual(gradeReaction(TIMING.fastMs - 1), { grade: 'fast', modifier: 1 });
  assert.deepEqual(gradeReaction(TIMING.fastMs), { grade: 'ok', modifier: 0 });
  assert.deepEqual(gradeReaction(TIMING.okMs), { grade: 'bad', modifier: -1 });
  assert.equal(gradeReaction(2999).grade, 'bad');
  assert.equal(gradeReaction(3000).grade, 'late');
});

test('striking before the bite pulls the line out', () => {
  const d = dice();
  const cast = startCast(0, d);
  const done = strike(cast, 1, d, FISH);
  assert.equal(done.phase, 'done');
  if (done.phase === 'done') assert.equal(done.outcome.result, 'too-early');
});

test('no strike for 3 s after the bite: the fish is gone, no roll', () => {
  const cast = startCast(0, dice());
  if (cast.phase !== 'waiting') throw new Error();
  const done = tickCast(tickCast(cast, cast.biteAt), cast.biteAt + TIMING.lateMs);
  assert.equal(done.phase, 'done');
  if (done.phase === 'done') {
    assert.equal(done.outcome.result, 'missed');
    assert.equal(done.outcome.rolls.length, 0);
  }
});

test('a strike after the time limit counts as missed, even if no tick saw it', () => {
  const d = dice();
  const cast = startCast(0, d);
  if (cast.phase !== 'waiting') throw new Error();
  const done = strike(cast, cast.biteAt + 5000, d, FISH);
  if (done.phase !== 'done') throw new Error();
  assert.equal(done.outcome.result, 'missed');
});

test('a fast strike adds +1 to the visible d20 roll', () => {
  const d = dice();
  const cast = startCast(0, d);
  if (cast.phase !== 'waiting') throw new Error();
  const done = strike(cast, cast.biteAt + 100, d, { skill: 2, difficulty: 11 });
  if (done.phase !== 'done') throw new Error();
  const [roll] = done.outcome.rolls;
  assert.equal(done.outcome.grade, 'fast');
  assert.equal(roll.total, roll.result + 2 + 1);
  assert.equal(roll.visible, true);
  assert.equal(done.outcome.result, roll.result === 20 || roll.total >= 11 ? 'caught' : 'escaped');
});

test('a bad strike subtracts 1; an ok strike adds nothing', () => {
  const d = dice();
  for (const [after, mod] of [
    [TIMING.okMs + 10, -1],
    [TIMING.fastMs + 10, 0],
  ]) {
    const cast = startCast(0, d);
    if (cast.phase !== 'waiting') throw new Error();
    const done = strike(cast, cast.biteAt + after, d, FISH);
    if (done.phase !== 'done') throw new Error();
    assert.equal(done.outcome.rolls[0].total, done.outcome.rolls[0].result + mod);
  }
});

test('a natural 20 always lands the fish', () => {
  const d = dice();
  let seen = 0;
  for (let i = 0; i < 400; i++) {
    const cast = startCast(0, d);
    if (cast.phase !== 'waiting') throw new Error();
    const done = strike(cast, cast.biteAt + 2000, d, { skill: 0, difficulty: 99 });
    if (done.phase !== 'done') throw new Error();
    const [roll] = done.outcome.rolls;
    assert.equal(done.outcome.result, roll.result === 20 ? 'caught' : 'escaped');
    if (roll.result === 20) seen++;
  }
  assert.ok(seen > 0);
});

/**
 * Strikes `count` times against an unbeatable fish; the rolls and outcomes.
 * @param {import('../src/engine/cast.js').Opponent} opponent
 */
function strikes(opponent, count = 600) {
  const d = dice();
  const out = [];
  for (let i = 0; i < count; i++) {
    const cast = startCast(0, d);
    if (cast.phase !== 'waiting') throw new Error();
    const done = strike(cast, cast.biteAt + 2000, d, opponent);
    if (done.phase !== 'done') throw new Error();
    out.push({ roll: done.outcome.rolls[0], result: done.outcome.result });
  }
  return out;
}

test("a natural 20 doesn't land the fish when the fish rolled a 20 too: the totals decide (D96)", () => {
  const all = strikes({ skill: 0, difficulty: 99, fishNatural: 20 });
  assert.ok(all.some((s) => s.roll.result === 20));
  for (const s of all) {
    assert.equal(s.result, 'escaped');
    assert.equal(s.roll.crit, undefined);
  }
  // Against a fish that rolled 19, the 20 still lands it.
  for (const s of strikes({ skill: 0, difficulty: 99, fishNatural: 19 })) assert.equal(s.result, s.roll.result === 20 ? 'caught' : 'escaped');
});

test('a lower natural catch makes 19 a crit too (the Heavy Hand perk, D96)', () => {
  const all = strikes({ skill: 0, difficulty: 99, natural: 19 });
  assert.ok(all.some((s) => s.roll.result === 19));
  for (const s of all) {
    assert.equal(s.result, s.roll.result >= 19 ? 'caught' : 'escaped');
    assert.equal(Boolean(s.roll.crit), s.roll.result >= 19);
  }
});

test('stacking advantage rolls a die per point and keeps the best (D96)', () => {
  for (const s of strikes({ skill: 0, difficulty: 10, vantage: 2, stacks: true }, 100)) {
    assert.equal(s.roll.dropped?.length, 2);
    for (const d of s.roll.dropped ?? []) assert.ok(d <= s.roll.result);
  }
});

test('an idle cast ignores a strike', () => {
  assert.equal(strike(idleCast(), 0, dice(), FISH).phase, 'idle');
});
