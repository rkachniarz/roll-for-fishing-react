// @ts-check
// The night, the town and the stew (R17-R21, D123): the clock's weekday,
// time passing in town, vendors' hours, barter, the stew, the cold, white
// items, and a fish's options.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content } from '../src/generated/content.js';
import { deserialize, newGame, serialize } from '../src/engine/state.js';
import { castLine, valuesFor } from '../src/engine/game.js';
import { arrive, choose, openSlide } from '../src/engine/events.js';
import { clock, minutesToMorning } from '../src/engine/time.js';
import { vendorStatus } from '../src/engine/schedule.js';
import { addToStew, bowlOf, costStatus, eatFish, eatStew, letGo, offersFor, toAquarium, trade } from '../src/engine/barter.js';
import { coldLevel, coldPoints, conditionBuffs } from '../src/engine/conditions.js';
import { passTime } from '../src/engine/passage.js';
import { placeOpen } from '../src/engine/knowledge.js';
import { createRng } from '../src/rng.js';
import { diceFor } from '../src/dice.js';

/** @typedef {import('../src/engine/state.js').GameState} GameState */

const DAY = 24 * 60;

/** A game whose welcome is behind it, at a given day (0 is a Monday) and hour. */
function game({ day = 0, hour = 10, seed = 1, classId = 'fish-fighter' } = {}) {
  const s = newGame({ seed, character: { name: 'Testek', gender: 'f', classId, stats: { fishingSkill: 3, fishFind: 5, treasureFind: 0 }, luck: 0, xp: 0 } });
  return { ...s, time: day * DAY + hour * 60, eventsSeen: { welcome: 1 } };
}

/** @param {string} species @param {string} rarity */
const fish = (species, rarity, size = 30) => ({ species, subname: -1, band: 2, size, difficulty: 1, xp: 1, rarity });

test('the clock has a weekday, and the first day is a Monday (R17.6)', () => {
  assert.equal(clock(0).weekday, 0);
  assert.equal(clock(4 * DAY + 600).weekday, 4, 'a Friday');
  assert.equal(clock(13 * DAY).weekday, 6, 'a Sunday');
});

test('the next morning: from the night, the evening, and from a morning, the next day\'s', () => {
  const night = 10 * DAY + 23 * 60;
  const wake = night + minutesToMorning(night);
  assert.equal(clock(wake).partOfDay, 'morning');
  assert.equal(clock(wake).dayIndex, 11);
  const morning = 10 * DAY + 9 * 60;
  assert.equal(clock(morning + minutesToMorning(morning)).dayIndex, 11, 'not the same morning');
});

test('time passing steps the weather and ends buffs that last game time (R17.2, R19.5)', () => {
  const s = /** @type {GameState} */ (structuredClone(game()));
  s.buffs = [{ id: 'short', source: 'x', effects: [], until: s.time + 60 }, { id: 'long', source: 'x', effects: [], until: s.time + 600 }];
  const events = passTime(s, 120, diceFor(createRng(1)));
  assert.equal(s.time, game().time + 120);
  assert.deepEqual(s.buffs.map((b) => b.id), ['long']);
  assert.ok(events.some((e) => e.type === 'buff-ended' && e.buff === 'short'));
});

test('the Alchemist keeps hours: Friday to Sunday, asleep 5 to 13, sometimes away (R17.6)', () => {
  assert.equal(vendorStatus(game({ day: 0, hour: 15 }), 'alchemist'), 'closed', 'Monday');
  assert.equal(vendorStatus(game({ day: 4, hour: 8 }), 'alchemist'), 'asleep', 'Friday morning');
  // Away on about a fifth of working days, the same answer every time.
  let away = 0;
  for (let week = 0; week < 40; week++) {
    for (const day of [4, 5, 6]) {
      const status = vendorStatus(game({ day: week * 7 + day, hour: 15 }), 'alchemist');
      assert.ok(status === 'open' || status === 'away');
      assert.equal(vendorStatus(game({ day: week * 7 + day, hour: 18 }), 'alchemist'), status, 'all day');
      if (status === 'away') away++;
    }
  }
  assert.ok(away > 10 && away < 45, `away ${away} of 120 days`);
});

/** A Friday afternoon at the Alchemist's, with the costs of a potion of breath in the bags. */
function atAlchemist() {
  for (let week = 0; week < 20; week++) {
    const s = { ...game({ day: week * 7 + 4, hour: 15 }), location: 'town', spot: 'alchemist' };
    if (vendorStatus(s, 'alchemist') === 'open') {
      return { ...s, bags: [{ id: 'canadian-waterweed', count: 3 }, { id: 'shiny-pebble', count: 1 }, { id: 'alchemists-vial', count: 2 }] };
    }
  }
  throw new Error('never in');
}

test('barter: costs met, the trade made, the costs gone, the potion in the bags, counted (R18)', () => {
  const s = atAlchemist();
  const breath = /** @type {any} */ (offersFor(s, 'alchemist').find((o) => o.id === 'potion-of-breath'));
  assert.ok(breath.costs.every((/** @type {any} */ c) => costStatus(s, c).met));
  const out = trade(s, 'alchemist', 'potion-of-breath');
  assert.deepEqual(out.state.bags, [
    { id: 'canadian-waterweed', count: 1 },
    { id: 'alchemists-vial', count: 1 },
    { id: 'potion-of-breath', count: 1 },
  ]);
  assert.equal(out.state.flags['trades-alchemist'], 1);
  assert.equal(out.state.flags['trades-alchemist-potion-of-breath'], 1);
  assert.equal(trade(out.state, 'alchemist', 'potion-of-breath').state, out.state, 'no pebble left: no trade');
  assert.equal(trade({ ...s, time: s.time - 4 * DAY }, 'alchemist', 'potion-of-breath').events.length, 0, 'not on a Monday');
});

test('barter: a fish cost takes the least valuable fish that qualifies (R18.5)', () => {
  const s = { ...atAlchemist(), bucket: [{ fish: fish('pike', 'epic'), count: 1 }, { fish: fish('roach', 'rare', 20), count: 1 }, { fish: fish('roach', 'common'), count: 2 }] };
  const out = trade(s, 'alchemist', 'vials-for-fish');
  assert.deepEqual(out.state.bucket.map((b) => [b.fish.species, b.fish.rarity, b.count]), [['pike', 'epic', 1], ['roach', 'common', 2]]);
});

test('the pebble question shows after five trades (R18.4)', () => {
  const s = atAlchemist();
  const asked = (/** @type {GameState} */ state) => {
    const open = structuredClone(state);
    arrive(open);
    return openSlide(open)?.choices.length;
  };
  const before = asked(s);
  assert.equal(asked({ ...s, flags: { 'trades-alchemist': 5 } }), (before ?? 0) + 1);
  assert.ok(offersFor({ ...s, flags: { 'trades-alchemist': 5 } }, 'alchemist').some((o) => o.id === 'secret-tincture'));
  assert.ok(!offersFor(s, 'alchemist').some((o) => o.id === 'secret-tincture'));
});

test('night sends the player to town; arriving at the inn the first time, the innkeeper (R17.3, R17.4)', () => {
  let s = /** @type {GameState} */ ({ ...game({ hour: 23 }), event: { id: 'nightfall', slide: 'start' } });
  assert.ok(!placeOpen(s, 'town'), 'not on the map before nightfall');
  assert.ok(placeOpen(choose(s, 2).state, 'town'), 'on the map, even staying out');
  const out = choose(s, 1);
  assert.equal(out.state.location, 'town');
  assert.equal(out.state.spot, 'inn');
  assert.equal(out.state.event?.id, 'innkeeper-first', 'arrived once the event closed');
  s = choose(out.state, 2).state;
  assert.equal(s.spot, 'room', 'up to the room');
  assert.equal(s.flags['met-innkeeper'], true);
  assert.equal(s.event?.id, 'your-room');
});

test('sleeping at the inn wakes the player in the morning, rested; no casting in town (R17.2)', () => {
  let s = /** @type {GameState} */ ({ ...game({ hour: 23 }), location: 'town', spot: 'inn', flags: { 'met-innkeeper': true } });
  arrive(s);
  assert.equal(s.event?.id, 'the-inn');
  const sleep = /** @type {any} */ (openSlide(s)).choices.find((/** @type {any} */ c) => content.events['the-inn'].slides.start.choices[c.index].effects.some((/** @type {any} */ e) => e.kind === 'sleep'));
  s = choose(s, sleep.index).state;
  assert.equal(clock(s.time).partOfDay, 'morning');
  assert.ok(s.buffs.some((b) => b.id === 'rested' && b.until !== undefined));
  assert.equal(castLine(s, 0).events[0]?.type, 'no-water');
});

test('the cold: three levels from the temperature and the time, less warmth; none indoors (R19.2)', () => {
  const warm = { ...game({ hour: 12 }), weather: { ...game().weather, temperature: 10 } };
  assert.equal(coldPoints(warm), 0);
  const summerNight = { ...warm, time: warm.time + 11 * 60 };
  assert.equal(clock(summerNight.time).partOfDay, 'night');
  assert.equal(coldLevel(summerNight, 0), 2, 'a night out is cold, even when it is warm');
  assert.equal(coldLevel(summerNight, 2), 0, 'the stew keeps it off');
  const winterNight = { ...summerNight, weather: { ...summerNight.weather, temperature: -3 } };
  assert.equal(coldLevel(winterNight, 2), 3, 'not in winter');
  assert.equal(coldLevel({ ...winterNight, location: 'town', spot: 'inn' }, 0), 0, 'indoors');
  const v = valuesFor(winterNight).flat;
  const fine = valuesFor(warm).flat;
  assert.equal(v.fishingSkill, fine.fishingSkill - 4, 'freezing');
  assert.ok(conditionBuffs(winterNight, 0).some((b) => b.id === 'cold-freezing' && b.debuff));
  assert.ok(conditionBuffs(winterNight, 0).some((b) => b.id === 'night-fishing'), 'night fishing pays (R19.3)');
});

test('the stew: 12 epic fish make a bowl of 24 hours, with warmth and the rarest fish\'s buffs (R19.4)', () => {
  const pot = Array.from({ length: 12 }, () => fish('northern-pike', 'epic'));
  assert.equal(bowlOf(pot).minutes, 24 * 60);
  let s = /** @type {GameState} */ ({ ...game(), location: 'town', spot: 'inn', bucket: [{ fish: fish('roach', 'common'), count: 2 }, { fish: fish('northern-pike', 'rare'), count: 1 }] });
  s = addToStew(s, 1).state;
  s = addToStew(s, 0).state;
  assert.equal(s.stewPot.length, 2);
  assert.equal(s.bucket[0].count, 1);
  const out = eatStew(s);
  const buff = /** @type {any} */ (out.state.buffs.find((b) => b.id === 'perpetual-stew'));
  assert.equal(buff.until, s.time + 60 + 30);
  assert.ok(buff.effects.some((/** @type {any} */ e) => e.value === 'warmth'));
  assert.deepEqual(out.state.stewPot, []);
  assert.equal(addToStew({ ...s, spot: 'square' }, 0).state.stewPot.length, 2, 'only at the inn');
});

test('every fish has a stew buff (R19.4)', () => {
  for (const f of Object.values(content.fish)) assert.ok(f.stew?.length, f.id);
});

test('a fish\'s options: let go, eaten with Sushi enjoyer, into the aquarium (R21)', () => {
  const s = /** @type {GameState} */ ({ ...game(), bucket: [{ fish: fish('roach', 'common'), count: 2 }] });
  const gone = letGo(s, 0).state;
  assert.equal(gone.bucket[0].count, 1);
  assert.equal(gone.escaped['lake/reedy-shore']?.length, 1, 'into the pool');
  const inTown = /** @type {GameState} */ ({ ...s, location: 'town', spot: 'inn' });
  assert.equal(letGo(inTown, 0).state, inTown, 'no water to let it go into in town');
  assert.equal(eatFish(s, 0).state, s, 'not without the perk');
  const sushi = { ...s, character: { ...s.character, xp: content.rules.levels.xp[2], perks: { 2: 'sushi-enjoyer' } } };
  const eaten = eatFish(sushi, 0).state;
  assert.ok(eaten.buffs.some((b) => b.id === 'sushi-roach' && b.casts === 5));
  const room = { ...sushi, character: { ...sushi.character, perks: { 2: 'aquarium' } }, location: 'town', spot: 'room' };
  assert.equal(toAquarium(room, 0).state.aquarium.length, 1);
});

test('white things come up as their own tier, more for a rogue (R19.1)', () => {
  /** @param {string} classId */
  const count = (classId) => {
    let s = { ...game({ classId, seed: 7 }), location: 'lake', spot: 'still-water' };
    let stuff = 0;
    for (let i = 0; i < 400; i++) {
      const out = castLine(s, 0, { extra: [{ label: 'test', effects: [{ value: 'biteCertain', add: -1 }] }] });
      if (out.cast.line.kind === 'item' && content.items[out.cast.line.id].category === 'stuff') stuff++;
      s = { ...out.state, found: {} };
    }
    return stuff;
  };
  const fighter = count('fish-fighter');
  const rogue = count('rogue-fisher');
  assert.ok(fighter > 40 && fighter < 120, `fighter ${fighter} of 400`);
  assert.ok(rogue > fighter, `rogue ${rogue}`);
});

test('a save from version 11 loads, its welcome behind it', () => {
  const v11 = { ...game(), version: 11 };
  for (const k of ['shop', 'stewPot', 'aquarium', 'dive']) delete (/** @type {any} */ (v11))[k];
  v11.eventsSeen = {};
  const s = deserialize(serialize(/** @type {any} */ (v11)));
  assert.equal(s.shop, null);
  assert.deepEqual(s.stewPot, []);
  assert.equal(s.eventsSeen.welcome, 1);
});
