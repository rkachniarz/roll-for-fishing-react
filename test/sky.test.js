// @ts-check
// The spots' compass facings and the shared width of view (12.1, D166); the
// sun and the moon (12.2, D167).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content } from '../src/generated/content.js';
import { HORIZON, MOON, VIEW, acrossView, facingOf, moonOf, moonPhase, moonPhaseName, moonPosition, sunOf, sunPosition } from '../src/engine/sky.js';
import { clock } from '../src/engine/time.js';
import { SAVE_VERSION, deserialize, newGame, serialize } from '../src/engine/state.js';

test('every spot that shows sky has a facing; the swamp and the town have none', () => {
  for (const loc of Object.values(content.locations)) {
    for (const spot of loc.spots ?? []) {
      const where = `${loc.id}/${spot.id}`;
      const facing = facingOf(loc.id, spot.id);
      const noSky = loc.town || spot.look?.painting === 'swamp';
      if (noSky) {
        assert.equal(facing, null, `${where} shows no sky, so has no facing`);
        continue;
      }
      // A painted spot, or one on the map, shows sky.
      if (spot.look?.painting || spot.map) {
        assert.equal(typeof facing, 'number', `${where} shows sky but has no facing`);
        assert.ok(facing >= 0 && facing < 360, `${where}: facing ${facing} out of 0..359`);
      }
    }
  }
});

test('the facings are the owner\'s', () => {
  assert.equal(facingOf('lake', 'reedy-shore'), 90);
  assert.equal(facingOf('lake', 'deep-water'), 210);
  assert.equal(facingOf('river', 'upper-river'), 25);
  assert.equal(facingOf('mage-tower', 'the-first-pool'), 180);
  assert.equal(facingOf('lake', 'nowhere'), null);
});

test('acrossView places a bearing across the picture, and wraps past north', () => {
  assert.equal(VIEW.width, 60);
  assert.equal(acrossView(90, 90), 0);
  assert.equal(acrossView(90, 60), -1);
  assert.equal(acrossView(90, 120), 1);
  assert.equal(acrossView(90, 105), 0.5);
  assert.equal(acrossView(90, 121), null);
  assert.equal(acrossView(90, 270), null);
  assert.equal(acrossView(10, 350), -2 / 3);
  assert.equal(acrossView(335, 5), 1);
  assert.equal(acrossView(335, 365), 1);
  assert.equal(acrossView(null, 90), null);
  assert.equal(acrossView(90, 100, 20), 1);
});

// ---------- The sun and the moon (12.2, D167) ----------

const DAY = 24 * 60;
/** The game's longest and shortest days: the 112-day year's days nearest 21 June and 21 December. */
const MIDSUMMER = 34;
const MIDWINTER = 90;
/** @param {number} day @param {number} hour */
const at = (day, hour) => day * DAY + Math.round(hour * 60);
/** Noon by the sun: midway between `SUN`'s sunrise and sunset. */
const noonOf = (/** @type {number} */ day) => {
  const { sun } = clock(day * DAY);
  return (sun.rise + sun.set) / 2;
};

test('the sun stands about 59° up at midsummer noon and 12° at midwinter noon, due south', () => {
  const summer = sunPosition(at(MIDSUMMER, noonOf(MIDSUMMER)));
  const winter = sunPosition(at(MIDWINTER, noonOf(MIDWINTER)));
  assert.ok(Math.abs(summer.altitude - 58.9) < 0.5, `midsummer noon ${summer.altitude}`);
  assert.ok(Math.abs(winter.altitude - 12.0) < 0.5, `midwinter noon ${winter.altitude}`);
  assert.ok(Math.abs(summer.bearing - 180) < 1, `midsummer noon bearing ${summer.bearing}`);
  assert.ok(Math.abs(winter.bearing - 180) < 1, `midwinter noon bearing ${winter.bearing}`);
});

test('at midsummer the sun rises in the north-east and sets in the north-west; at midwinter, south of east and west', () => {
  const { sun: summer } = clock(MIDSUMMER * DAY);
  const rise = sunPosition(at(MIDSUMMER, summer.rise)).bearing;
  const set = sunPosition(at(MIDSUMMER, summer.set)).bearing;
  assert.ok(rise > 25 && rise < 60, `midsummer sunrise bearing ${rise}`);
  assert.ok(set > 300 && set < 335, `midsummer sunset bearing ${set}`);
  const { sun: winter } = clock(MIDWINTER * DAY);
  const wRise = sunPosition(at(MIDWINTER, winter.rise)).bearing;
  const wSet = sunPosition(at(MIDWINTER, winter.set)).bearing;
  assert.ok(wRise > 120 && wRise < 145, `midwinter sunrise bearing ${wRise}`);
  assert.ok(wSet > 215 && wSet < 240, `midwinter sunset bearing ${wSet}`);
});

test('the sun is up exactly between SUN\'s sunrise and sunset, every half hour of the year, and below at midnight', () => {
  for (let day = 0; day < 112; day++) {
    const { sun } = clock(day * DAY);
    // At sunrise and sunset its centre is on the horizon line.
    assert.ok(Math.abs(sunPosition(at(day, sun.rise)).altitude - HORIZON) < 0.2, `day ${day} sunrise`);
    assert.ok(Math.abs(sunPosition(at(day, sun.set)).altitude - HORIZON) < 0.2, `day ${day} sunset`);
    for (let m = 0; m < DAY; m += 30) {
      const h = m / 60;
      const up = sunPosition(day * DAY + m).altitude > HORIZON;
      const shouldBe = h > sun.rise && h < sun.set;
      if (Math.abs(h - sun.rise) > 0.05 && Math.abs(h - sun.set) > 0.05) assert.equal(up, shouldBe, `day ${day} at ${h}`);
    }
    assert.ok(sunPosition(day * DAY).altitude < -5, `day ${day} midnight`);
  }
});

test('the sun climbs through the morning and sinks through the afternoon, east to west', () => {
  const day = 50;
  const noon = noonOf(day);
  const morning = sunPosition(at(day, noon - 3));
  const later = sunPosition(at(day, noon - 1));
  const afternoon = sunPosition(at(day, noon + 3));
  assert.ok(later.altitude > morning.altitude);
  assert.ok(afternoon.altitude < sunPosition(at(day, noon + 1)).altitude);
  assert.ok(morning.bearing < 180 && afternoon.bearing > 180);
});

test('the moon goes round its 14-day cycle: full, last quarter, new, first quarter, full', () => {
  const full = 10 * DAY;
  assert.equal(MOON.cycleDays, 14);
  assert.equal(moonPhase(full, full), 0.5);
  assert.equal(moonPhase(full + 14 * DAY, full), 0.5);
  assert.equal(moonPhase(full - 28 * DAY, full), 0.5);
  assert.equal(moonPhase(full + 7 * DAY, full), 0);
  assert.equal(moonPhaseName(moonPhase(full, full)), 'full');
  assert.equal(moonPhaseName(moonPhase(full + 3.5 * DAY, full)), 'last-quarter');
  assert.equal(moonPhaseName(moonPhase(full + 7 * DAY, full)), 'new');
  assert.equal(moonPhaseName(moonPhase(full + 10.5 * DAY, full)), 'first-quarter');
  assert.equal(moonPosition(full, full).lit, 1);
  assert.equal(moonPosition(full + 7 * DAY, full).lit, 0);
  assert.ok(Math.abs(moonPosition(full + 3.5 * DAY, full).lit - 0.5) < 1e-9);
  // Every name in turn through a cycle, from new.
  /** @type {string[]} */
  const names = [];
  for (let m = full + 7 * DAY; m < full + 21 * DAY; m += 30) {
    const name = moonPosition(m, full).name;
    if (names[names.length - 1] !== name) names.push(name);
  }
  assert.deepEqual(names, ['new', 'waxing-crescent', 'first-quarter', 'waxing-gibbous', 'full', 'waning-gibbous', 'last-quarter', 'waning-crescent', 'new']);
});

test('the full moon is high in the south at midnight, the new moon down with the sun', () => {
  const full = (60 + 1) * DAY; // the midnight ending day 60
  const fullMoon = moonPosition(full, full);
  assert.ok(fullMoon.altitude > 20, `full moon at midnight ${fullMoon.altitude}`);
  assert.ok(Math.abs(fullMoon.bearing - 180) < 20, `full moon at midnight bearing ${fullMoon.bearing}`);
  const newMoon = moonPosition(full + 7 * DAY, full);
  assert.ok(newMoon.altitude < 0, `new moon at midnight ${newMoon.altitude}`);
  // At new moon it keeps close to the sun (its hours are not stretched as the sun's are).
  const then = full + 7 * DAY;
  const moon = moonPosition(then, full);
  const sun = sunPosition(then);
  assert.ok(Math.abs(moon.bearing - sun.bearing) < 10 && Math.abs(moon.altitude - sun.altitude) < 5, `moon ${JSON.stringify(moon)} sun ${JSON.stringify(sun)}`);
});

/**
 * The game minutes the moon rises, in 5-minute steps, from `from` for `days`.
 * @param {number} from @param {number} days @param {number} full
 */
const moonrises = (from, days, full) => {
  const rises = [];
  let before = moonPosition(from, full).altitude;
  for (let m = from + 5; m < from + days * DAY; m += 5) {
    const now = moonPosition(m, full).altitude;
    if (before <= 0 && now > 0) rises.push(m);
    before = now;
  }
  return rises;
};

test('the moon rises later each day, about 24/13 hours, once round the clock a cycle', () => {
  const full = 40 * DAY;
  const rises = moonrises(full, 28, full);
  const gaps = rises.slice(1).map((m, i) => (m - rises[i]) / 60);
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  assert.ok(Math.abs(mean - (24 * 14) / 13) < 0.25, `mean gap ${mean}`);
  for (const g of gaps) assert.ok(g > 24 && g < 28, `gap ${g}`);
  // The full moon rises around sunset; the new moon around sunrise.
  const { sun } = clock(full);
  assert.ok(Math.abs(moonrises(full - DAY / 2, 1, full)[0] % DAY / 60 - sun.set) < 2, 'full moon rises at dusk');
  const newRise = moonrises(full + 7 * DAY - DAY / 2, 1, full)[0] % DAY / 60;
  assert.ok(Math.abs(newRise - clock(full + 7 * DAY).sun.rise) < 2, `new moon rises at dawn (${newRise})`);
});

test('the full moon rides high in winter and low in summer', () => {
  const highest = (/** @type {number} */ full) => {
    let best = -90;
    for (let m = full - DAY / 2; m < full + DAY / 2; m += 10) best = Math.max(best, moonPosition(m, full).altitude);
    return best;
  };
  const winter = highest((MIDWINTER + 1) * DAY);
  const summer = highest((MIDSUMMER + 1) * DAY);
  assert.ok(winter > 55, `winter full moon ${winter}`);
  assert.ok(summer < 18, `summer full moon ${summer}`);
});

const character = /** @type {const} */ ({ name: 'Testek', gender: 'f', classId: 'rogue', stats: { fishingSkill: 3, fishFind: 5, treasureFind: 7 } });
const game = (/** @type {number} */ seed) => newGame({ seed, character: { ...character, luck: 0, xp: 0 } });

test('a new game rolls its first full moon for one of the next 14 nights, the same for the same seed', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 200; seed++) {
    const s = game(seed);
    const night = s.fullMoonAt / DAY - Math.floor(s.time / DAY);
    assert.ok(Number.isInteger(night) && night >= 1 && night <= 14, `seed ${seed}: ${night}`);
    seen.add(night);
    assert.equal(moonOf(s).phase, moonPhase(s.time, s.fullMoonAt));
    assert.deepEqual(sunOf(s), sunPosition(s.time));
  }
  assert.equal(seen.size, 14);
  assert.equal(game(7).fullMoonAt, game(7).fullMoonAt);
  // Its own stream: the rest of the game's dice are where they were.
  assert.ok(!('moon' in game(7).streams));
});

test('a save from version 21 gains its first full moon, rolled from today', () => {
  const { fullMoonAt, ...v21 } = game(9);
  const old = { ...v21, version: 21, time: v21.time + 30 * DAY };
  const migrated = deserialize(JSON.stringify(old));
  assert.equal(migrated.version, SAVE_VERSION);
  const night = migrated.fullMoonAt / DAY - Math.floor(old.time / DAY);
  assert.ok(night >= 1 && night <= 14);
  assert.equal(deserialize(serialize(migrated)).fullMoonAt, migrated.fullMoonAt);
});
