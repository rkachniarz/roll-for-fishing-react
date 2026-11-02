// @ts-check
// Game time (R11.4, D66).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIME, advanceTime, clock } from '../src/engine/time.js';

test('a new game starts at 08:00 on the first day of spring, year 1', () => {
  assert.deepEqual(clock(TIME.startMinutes), {
    year: 1,
    season: 'spring',
    day: 1,
    hour: 8,
    minute: 0,
    partOfDay: 'morning',
  });
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

test('parts of the day', () => {
  const at = (/** @type {number} */ h) => clock(h * 60).partOfDay;
  assert.deepEqual(
    [at(3), at(6), at(9), at(12), at(14), at(19), at(21), at(23)],
    ['night', 'dawn', 'morning', 'noon', 'afternoon', 'sunset', 'evening', 'night'],
  );
});
