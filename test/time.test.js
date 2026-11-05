// @ts-check
// Game time (R11.4, D66).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIME, advanceTime, clock, seasonOfMonth, startTime, sunAt } from '../src/engine/time.js';
import { createRng } from '../src/rng.js';
import { diceFor } from '../src/dice.js';

test('a new game starts on a random day in year 1, in the morning, leaning to the season outside (D85)', () => {
  const counts = /** @type {Record<string, number>} */ ({});
  const days = new Set();
  for (let seed = 1; seed <= 400; seed++) {
    const c = clock(startTime('autumn', diceFor(createRng(seed))));
    assert.equal(c.year, 1);
    assert.equal(c.partOfDay, 'morning', `${c.season} ${c.day} ${c.hour}:${c.minute}`);
    assert.ok(c.minute === 0 || c.minute === 30);
    counts[c.season] = (counts[c.season] ?? 0) + 1;
    days.add(c.day);
  }
  assert.ok(counts.autumn > 160 && counts.autumn < 240, `autumn ${counts.autumn} of 400`);
  for (const s of ['spring', 'summer', 'winter']) assert.ok(counts[s] > 40, `${s} ${counts[s]}`);
  assert.equal(days.size, TIME.seasonDays);
});

test('the season outside, northern hemisphere, spring from March', () => {
  assert.deepEqual([0, 1, 2, 4, 5, 7, 8, 10, 11].map(seasonOfMonth), ['winter', 'winter', 'spring', 'spring', 'summer', 'summer', 'autumn', 'autumn', 'winter']);
});

test("the sun follows Gdynia's year: long summer days, short winter ones", () => {
  const midsummer = sunAt(0.307);
  const midwinter = sunAt(0.807);
  assert.equal(Math.round(midsummer.rise * 60), 4 * 60 + 12);
  assert.equal(Math.round(midsummer.set * 60), 21 * 60 + 22);
  assert.equal(Math.round(midwinter.rise * 60), 7 * 60 + 48);
  assert.equal(Math.round(midwinter.set * 60), 15 * 60 + 28);
});

test('a cast is 30 minutes, so a day is 48 casts', () => {
  let minutes = 0;
  let days = 0;
  for (let i = 0; i < 48 * 3; i++) {
    const step = advanceTime(minutes);
    minutes = step.minutes;
    if (step.newDay) days++;
  }
  assert.equal(days, 3);
  assert.equal(clock(minutes).day, 4);
});

test('a season is 28 days; the year wraps after winter', () => {
  const day = 24 * 60;
  assert.equal(clock(27 * day).season, 'spring');
  assert.equal(clock(28 * day).season, 'summer');
  assert.equal(clock(28 * day).day, 1);
  assert.equal(clock(4 * 28 * day - 1).season, 'winter');
  assert.deepEqual([clock(4 * 28 * day).season, clock(4 * 28 * day).year], ['spring', 2]);
});

test('the cast that crosses into a new season says so', () => {
  const lastCast = 28 * 24 * 60 - TIME.castMinutes;
  assert.equal(advanceTime(lastCast).newSeason, 'summer');
  assert.equal(advanceTime(lastCast - TIME.castMinutes).newSeason, null);
});

test('parts of the day move with the sun (D85)', () => {
  const day = 24 * 60;
  const on = (/** @type {number} */ dayIndex) => (/** @type {number} */ h) => clock(dayIndex * day + h * 60).partOfDay;
  // Early spring: sunrise about 06:50, sunset about 17:40.
  const spring = on(0);
  assert.deepEqual(
    [3, 6.5, 9, 12, 14, 17.5, 19.5, 23].map(spring),
    ['night', 'dawn', 'morning', 'noon', 'afternoon', 'sunset', 'evening', 'night'],
  );
  // Midsummer: light by 05:00, the sun still setting at 22:00, evening till midnight.
  const summer = on(34);
  assert.deepEqual([2, 5, 16, 22, 23.5].map(summer), ['night', 'dawn', 'afternoon', 'sunset', 'evening']);
  // Midwinter: still dawn at 08:00, sunset by 15:00, night by 19:00.
  const winter = on(90);
  assert.deepEqual([6, 8, 15, 19].map(winter), ['night', 'dawn', 'sunset', 'night']);
});
