// @ts-check
// The night, the town and the stew (R17-R21, D123): the clock's weekday,
// time passing in town, vendors' hours, barter, the stew, the cold, white
// items, and a fish's options.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content } from '../src/generated/content.js';
import { deserialize, newGame, serialize } from '../src/engine/state.js';
import { castLine, catchFish, lineAdjustable, setLineDepth, useAbility, valuesFor } from '../src/engine/game.js';
import { lookStage, poolDue, tended } from '../src/engine/pool.js';
import { offers } from '../src/engine/perks.js';
import { arrive, choose, openSlide } from '../src/engine/events.js';
import { clock, minutesToMorning } from '../src/engine/time.js';
import { vendorStatus } from '../src/engine/schedule.js';
import { addToStew, bowlOf, costStatus, eatFish, eatStew, letGo, offersFor, tasteFactor, toAquarium, trade } from '../src/engine/barter.js';
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
/** Catches a fish into the bucket and the book (catchFish), with room made. @param {GameState} s @param {any} f */
const castThenCatch = (s, f) => {
  const next = structuredClone({ ...s, bucket: [] });
  catchFish(next, f, 16);
  return next;
};
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
  // Pike is plain eating (D138), so its minutes are the rarity's own.
  const pot = Array.from({ length: 12 }, () => fish('northern-pike', 'epic'));
  assert.equal(bowlOf(pot).minutes, 24 * 60);
  let s = /** @type {GameState} */ ({ ...game(), location: 'town', spot: 'inn', bucket: [{ fish: fish('roach', 'common'), count: 2 }, { fish: fish('northern-pike', 'rare'), count: 1 }] });
  s = addToStew(s, 1).state;
  s = addToStew(s, 0).state;
  assert.equal(s.stewPot.length, 2);
  assert.equal(s.bucket[0].count, 1);
  const out = eatStew(s);
  const buff = /** @type {any} */ (out.state.buffs.find((b) => b.id === 'perpetual-stew'));
  assert.equal(buff.until, s.time + 60 + 15, 'a rare pike, plain, and a common roach, poor eating (D138)');
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
  assert.ok(eaten.buffs.some((b) => b.id === 'sushi-roach' && b.casts === 3), 'poor eating: fewer casts (D138)');
  const room = { ...sushi, character: { ...sushi.character, perks: { 2: 'aquarium' } }, location: 'town', spot: 'room' };
  assert.equal(toAquarium(room, 0).state.aquarium.length, 1);
});

test('taste: a tastier fish makes a longer bowl and a longer raw buff (D138)', () => {
  const { taste } = content.rules.stew;
  assert.ok(taste.poor < taste.plain && taste.plain < taste.good && taste.good < taste.delicacy);
  assert.equal(tasteFactor('roach'), taste.poor);
  assert.equal(tasteFactor('zander'), taste.delicacy);
  assert.ok(bowlOf([fish('zander', 'rare')]).minutes > bowlOf([fish('northern-pike', 'rare')]).minutes);
  assert.ok(bowlOf([fish('roach', 'rare')]).minutes < bowlOf([fish('northern-pike', 'rare')]).minutes);
  for (const f of Object.values(content.fish)) {
    assert.ok(f.taste && f.tasteLine, `${f.id} has a taste`);
    assert.equal(Boolean(f.parasites), !f.rift, `${f.id}: freshwater fish carry a risk, rift fish none`);
  }
  assert.ok(content.buffs[content.rules.stew.parasites.buff].debuff);
});

test('taste: eating a fish teaches its taste; a bowl teaches one kind in it, a new one first (D138)', () => {
  const sushi = /** @type {GameState} */ ({ ...game(), bucket: [{ fish: fish('zander', 'common'), count: 1 }] });
  sushi.character = { ...sushi.character, xp: content.rules.levels.xp[2], perks: { 2: 'sushi-enjoyer' } };
  assert.deepEqual(sushi.tasted, {});
  const raw = eatFish(sushi, 0);
  assert.deepEqual(raw.state.tasted, { zander: true });
  assert.ok(raw.state.buffs.some((b) => b.id === 'sushi-zander' && b.casts === 8), 'a delicacy lasts longer');

  const inn = /** @type {GameState} */ ({ ...game(), location: 'town', spot: 'inn', tasted: { roach: true } });
  inn.stewPot = [fish('roach', 'common'), fish('roach', 'common'), fish('northern-pike', 'rare')];
  const bowl = eatStew(inn);
  assert.equal(bowl.events[0].taste, 'northern-pike', 'the one not yet known');
  assert.deepEqual(bowl.state.tasted, { roach: true, 'northern-pike': true });
  assert.deepEqual(bowl.state.streams, inn.streams, 'one fish to pick from: nothing drawn');

  const mixed = { ...inn, tasted: {}, stewPot: [fish('roach', 'common'), fish('northern-pike', 'rare'), fish('zander', 'rare')] };
  const picked = eatStew(mixed);
  assert.equal(Object.keys(picked.state.tasted).length, 1, 'only one of them');
  assert.deepEqual(eatStew(mixed).events, picked.events, 'the same game picks the same fish');
  assert.notEqual(picked.state.streams.taste, mixed.streams.taste);
  assert.deepEqual({ ...picked.state.streams, taste: 0 }, { ...mixed.streams, taste: 0 }, 'only its own stream moves');
});

test('taste: a raw freshwater fish may leave the player queasy, a rift fish never (D138)', () => {
  const { parasites } = content.rules.stew;
  /** @param {string} species */
  const sick = (species) => {
    let n = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const s = /** @type {GameState} */ ({ ...game({ seed }), bucket: [{ fish: fish(species, 'common'), count: 1 }] });
      s.character = { ...s.character, xp: content.rules.levels.xp[2], perks: { 2: 'sushi-enjoyer' } };
      const out = eatFish(s, 0);
      const queasy = out.state.buffs.some((b) => b.id === parasites.buff && b.debuff);
      assert.equal(out.events[0].queasy, queasy);
      assert.ok(out.state.buffs.some((b) => b.id === `sushi-${species}`), 'the buff comes either way');
      if (queasy) n++;
    }
    return n;
  };
  const high = sick('northern-pike');
  const low = sick('tench');
  assert.ok(high > 400 * (parasites.high / 100) * 0.6 && high < 400 * (parasites.high / 100) * 1.4, `pike: ${high} of 400`);
  assert.ok(low > 0 && low < high, `tench: ${low} of 400`);
  assert.equal(sick('arapaima'), 0);
});

test('a save from version 12 loads, with nothing tasted and the taste stream (D138)', () => {
  const v12 = /** @type {any} */ ({ ...game(), version: 12 });
  delete v12.tasted;
  delete v12.pools;
  v12.streams = Object.fromEntries(Object.entries(v12.streams).filter(([k]) => k !== 'taste' && k !== 'pool'));
  const s = deserialize(serialize(v12));
  assert.deepEqual(s.tasted, {});
  assert.equal(s.streams.taste, game().streams.taste);
  assert.deepEqual(s.pools, {});
  assert.equal(s.streams.pool, game().streams.pool);
});

test('the pool: stocked with 2d6+3 fish the first time it is looked at, from its own stream (D139)', () => {
  const s = game();
  assert.ok(poolDue(s));
  const stocked = tended(s);
  const pool = stocked.escaped['lake/reedy-shore'];
  assert.ok(pool.length >= 5 && pool.length <= 15, String(pool.length));
  assert.ok(pool.every((f) => f.wild && !f.tries));
  assert.equal(stocked.pools['lake/reedy-shore'].size, pool.length);
  assert.deepEqual({ ...stocked.streams, pool: 0, condition: 0 }, { ...s.streams, pool: 0, condition: 0 }, 'only its own streams move: the fish, and how fat each is (D146)');
  assert.equal(tended(stocked), stocked, 'kept from then on');
  assert.deepEqual(tended(s), stocked, 'the same game stocks the same fish');
  assert.equal(castLine(s, 0).checkpoint.escaped['lake/reedy-shore'].length, pool.length, 'a cast looks too');
  const town = /** @type {GameState} */ ({ ...s, location: 'town', spot: 'inn' });
  assert.equal(tended(town), town, 'no water in town');
});

test('the pool: a fish a day drifts in, a new season rolls the wild fish anew, and under two it is rolled anew (D139)', () => {
  const stocked = tended(game());
  const key = 'lake/reedy-shore';
  const size = stocked.pools[key].size;
  const met = { ...stocked.escaped[key][0], wild: undefined, tries: 2 };
  delete met.wild;
  // Three fish left, one of them met; two days on, two more.
  const thinned = { ...stocked, escaped: { [key]: [met, ...stocked.escaped[key].slice(1, 3)] } };
  assert.equal(tended(thinned), thinned, 'nothing the same day');
  const later = tended({ ...thinned, time: thinned.time + 2 * 24 * 60 + 30 });
  assert.equal(later.escaped[key].length, 5);
  assert.equal(later.pools[key].at, stocked.pools[key].at + 2 * 24 * 60, 'whole days are counted');
  // A full pool takes nobody in, though the day is counted.
  const full = tended({ ...stocked, time: stocked.time + 24 * 60 });
  assert.equal(full.escaped[key].length, size);
  assert.equal(full.pools[key].at, stocked.pools[key].at + 24 * 60);
  // A new season: the wild ones go, the one the player met stays.
  const season = tended({ ...thinned, pools: { [key]: { ...thinned.pools[key], season: 'another' } } });
  assert.ok(season.escaped[key].some((f) => f.tries === 2), 'the fish that got away is still there');
  assert.equal(season.escaped[key].filter((f) => f.wild).length, season.pools[key].size);
  assert.equal(season.escaped[key].length, season.pools[key].size + 1);
  // Down to one: rolled anew, on top of it.
  const low = tended({ ...stocked, escaped: { [key]: [met] } });
  assert.equal(low.escaped[key].length, low.pools[key].size + 1);
});

test('Look Underwater: a shadow, then colours, then its name; offered to the wizard on the universal levels (D139)', () => {
  const wizard = /** @type {GameState} */ ({ ...game({ classId: 'fishing-wizard' }) });
  wizard.character = { ...wizard.character, xp: content.rules.levels.xp[2], perks: { 1: 'summon-fish', 2: 'look-underwater' } };
  assert.equal(lookStage(1), 'shadow');
  assert.equal(lookStage(2), 'colour');
  assert.equal(lookStage(3), 'named');
  const first = useAbility(wizard, 'look-underwater');
  const seen = first.events.find((e) => e.type === 'looked');
  assert.ok(seen.fish.length >= 5 && seen.fish.every((/** @type {any} */ f) => f.looks === 1));
  assert.deepEqual(first.state.known, wizard.known, 'a shadow teaches nothing');
  assert.deepEqual(first.state.cooldowns['look-underwater'], { casts: 10, pending: true });
  assert.equal(first.state.time, wizard.time, 'no time passes');
  let s = { ...first.state, cooldowns: {} };
  s = { ...useAbility(s, 'look-underwater').state, cooldowns: {} };
  // A fish that got away since has been looked at less than the others.
  const key = 'lake/reedy-shore';
  s = { ...s, escaped: { [key]: [...s.escaped[key], { ...s.escaped[key][0], species: 'northern-pike', looks: 0, tries: 1 }] } };
  const third = useAbility(s, 'look-underwater');
  const pool = third.state.escaped[key];
  assert.ok(pool.slice(0, -1).every((f) => f.looks === 3));
  assert.equal(pool.at(-1)?.looks, 1, 'each fish keeps its own count');
  for (const f of pool.slice(0, -1)) assert.ok(third.state.known[`lake:fish:${f.species}`], `${f.species} is known to be here`);
  // A fish from the pool the wizard has looked at is one seen before; a wild one never looked at is not.
  const town = /** @type {GameState} */ ({ ...wizard, location: 'town', spot: 'inn' });
  assert.equal(useAbility(town, 'look-underwater').state, town, 'no water to look into');

  // On the universal levels, for the wizard alone.
  /** @param {string} classId */
  const offered = (classId) => {
    let n = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const g = game({ classId, seed });
      if (offers({ ...g, character: { ...g.character, xp: content.rules.levels.xp[2], perks: { 1: 'x' } } }, 2).includes('look-underwater')) n++;
    }
    return n;
  };
  assert.ok(offered('fishing-wizard') > 0);
  assert.equal(offered('fish-fighter'), 0);
});

test('Conservationist: endangered fish let go give Luck twice, then a quarter of their XP (D140)', () => {
  const rules = content.rules.conservation;
  const sturgeon = { ...fish('lake-sturgeon', 'epic'), xp: 9 };
  const base = /** @type {GameState} */ ({ ...game(), bucket: [{ fish: sturgeon, count: 40 }, { fish: fish('roach', 'common'), count: 5 }] });
  const plain = letGo(base, 0);
  assert.deepEqual(plain.events.map((e) => e.type), ['released'], 'nothing without the perk');
  assert.equal(plain.state.flags['endangered-released'], undefined);

  let s = /** @type {GameState} */ ({ ...base, character: { ...base.character, xp: content.rules.levels.xp[2], perks: { 1: 'jump-in', 2: 'conservationist' } } });
  assert.deepEqual(letGo(s, 1).events.map((e) => e.type), ['released'], 'a roach is not endangered');
  const luck = s.character.luck;
  const xp = s.character.xp;
  for (let n = 1; n <= rules.releasesPerLuck * rules.maxLuck; n++) {
    const out = letGo(s, 0);
    s = out.state;
    assert.equal(out.events.some((e) => e.type === 'conserved'), n % rules.releasesPerLuck === 0, `fish ${n}`);
  }
  assert.equal(s.character.luck, luck + rules.maxLuck);
  assert.equal(s.character.xp, xp, 'no XP until the Luck is earned');
  const after = letGo(s, 0);
  assert.equal(after.state.character.luck, luck + rules.maxLuck, 'no more Luck');
  assert.equal(after.state.character.xp, xp + 3, 'a quarter of 9 XP, rounded up');
  assert.equal(after.events.find((e) => e.type === 'conserved')?.xp, 3);

  // Every spot with fish has two endangered kinds; the tower's pool has one.
  for (const loc of Object.values(content.locations)) {
    for (const spot of loc.spots ?? []) {
      if (!spot.fish?.length) continue;
      const n = spot.fish.filter((/** @type {{ id: string }} */ e) => content.fish[e.id]?.endangered).length;
      assert.equal(n, loc.id === 'mage-tower' ? 1 : 2, `${loc.id}/${spot.id}`);
    }
  }
});

test('fight styles: every fish has one; each tilts the roll by the strike; calm fish fight plainly (D141)', () => {
  const rules = content.rules['fight-styles'];
  const ids = rules.styles.map((/** @type {{ id: string }} */ s) => s.id);
  for (const f of Object.values(content.fish)) assert.ok(ids.includes(f.fights), `${f.id} fights`);
  /** A cast with a fish of this species on the line, from many seeds. @param {string} species @param {GameState} [base] */
  const lines = (species, base) => {
    const out = [];
    for (let seed = 1; seed <= 300 && out.length < 120; seed++) {
      const s = /** @type {GameState} */ ({ ...(base ?? game({ seed })), seed, streams: game({ seed }).streams });
      const c = castLine({ ...s, features: [], champions: {}, escaped: {}, pools: {} }, 0).cast;
      if (c.line?.kind === 'fish' && c.line.fish.species === species) out.push(c.line);
    }
    return out;
  };
  // The reedy shore's first fish, the roach, is a jumper: +1 fast, −1 slow.
  const roach = lines('roach');
  assert.ok(roach.length > 20, String(roach.length));
  assert.deepEqual(roach[0].fight.tilt, { fast: 1, bad: -1 });
  const moves = roach.filter((l) => l.fight.manoeuvre).length;
  assert.ok(moves < roach.length * 0.2, `a roach moves rarely: ${moves} of ${roach.length}`);
  // Calmed: no fight at all.
  const calm = game();
  calm.buffs = [{ id: 'calm', source: 'calm', effects: [{ value: 'calmFish', add: 1 }], casts: 5 }];
  assert.ok(lines('roach', calm).every((l) => !l.fight));
});

test('a manoeuvre: the roll landed it, then it moves, and the next strike must come in time (D141)', async () => {
  const { strike, fightStrike, tickCast, TIMING } = await import('../src/engine/cast.js');
  const dice = { roll20Kept: () => ({ result: 10 }) };
  const bite = /** @type {any} */ ({ phase: 'bite', castAt: 0, biteAt: 1000 });
  // A head-shaker throws the hook on a low natural roll, whatever the total.
  const low = strike(bite, 1100, /** @type {any} */ ({ roll20Kept: () => ({ result: 2 }) }), { difficulty: 0, throwsOn: 2 });
  assert.equal(low.phase === 'done' && low.outcome.result, 'escaped');
  assert.equal(low.phase === 'done' && low.outcome.thrown, true);
  // A jumper struck fast gets +1.
  const fast = strike(bite, 1100, /** @type {any} */ (dice), { difficulty: 12, tilt: { fast: 1 } });
  assert.equal(fast.phase === 'done' && fast.outcome.result, 'caught', '10 + 1 fast + 1 its fight');
  // The fight: too early throws it, in time lands it, too late throws it.
  const held = { result: 'caught', rolls: [] };
  const fight = /** @type {any} */ ({ phase: 'fight', castAt: 0, biteAt: 1000, fightAt: 2000, held });
  assert.equal(/** @type {any} */ (fightStrike(fight, 1900)).outcome.thrown, true, 'before it moves');
  assert.equal(/** @type {any} */ (fightStrike(fight, 2300)).outcome.result, 'caught', 'in time');
  const late = /** @type {any} */ (tickCast(fight, 2000 + TIMING.fightMs));
  assert.equal(late.outcome.thrown, true, 'nobody answered');
  assert.equal(late.endedAt, 2000 + TIMING.fightMs);
});

test('the Rogue shows off on a fish that makes its move; the rod and the draught calm fish (D141)', () => {
  const rogue = content.classes['rogue-fisher'].effects.find((/** @type {{ value: string }} */ e) => e.value === 'manoeuvreBonus');
  assert.equal(rogue?.add, 2);
  assert.ok(content.items['paralysing-rod'].effects.some((/** @type {{ value: string }} */ e) => e.value === 'calmFish'));
  assert.equal(content.buffs[content.items['calming-draught'].use.buff].effects[0].value, 'calmFish');
  assert.ok(content.vendors.alchemist.offers.some((/** @type {{ id: string }} */ o) => o.id === 'calming-draught'));
  // A rogue's line, when the fish moves, has the bonus in its mods.
  for (let seed = 1; seed <= 400; seed++) {
    const s = game({ classId: 'rogue-fisher', seed });
    const c = castLine({ ...s, features: [], champions: {} }, 0).cast;
    if (c.line?.kind !== 'fish' || !c.line.fight?.manoeuvre) continue;
    assert.ok(c.line.player.mods.some((/** @type {{ label: string, value: number }} */ m) => m.label === 'showmanship' && m.value === 2));
    return;
  }
  assert.fail('no manoeuvre in 400 casts');
});

test('weight (D146): every fish has a formula; a fish weighs it times its condition, within the spread', async () => {
  const { fishWeight, rollCondition } = await import('../src/engine/fish.js');
  for (const f of Object.values(content.fish)) assert.ok(f.lengthWeight?.a > 0 && f.lengthWeight.b > 2, f.id);
  const pike = content.fish['northern-pike'].lengthWeight;
  assert.equal(fishWeight({ species: 'northern-pike', size: 80 }), pike.a * 80 ** pike.b);
  assert.equal(fishWeight({ species: 'northern-pike', size: 80, condition: 1.1 }), pike.a * 80 ** pike.b * 1.1);
  const w = fishWeight({ species: 'northern-pike', size: 130 });
  assert.ok(w > 10000 && w < 20000, `a 130 cm pike weighs ${w} g`);
  const dice = diceFor(createRng(5));
  for (let i = 0; i < 200; i++) {
    const c = rollCondition(dice);
    assert.ok(c >= 0.9 && c <= 1.1, String(c));
  }
});

test('weight (D146): the fish on a cast has a condition from its own stream; the book keeps the heaviest', () => {
  const s = game();
  for (let seed = 1; seed <= 60; seed++) {
    const out = castLine({ ...game({ seed }), features: [], champions: {} }, 0);
    if (out.cast.line?.kind !== 'fish') continue;
    const fish = out.cast.line.fish;
    assert.ok(fish.condition >= 0.9 && fish.condition <= 1.1, 'rolled when the line goes out');
    break;
  }
  // The book: a fat fish beats a longer, thin one for the heaviest.
  let state = /** @type {GameState} */ (structuredClone(s));
  const long = { ...fish('northern-pike', 'rare', 100), condition: 0.9 };
  const fat = { ...fish('northern-pike', 'rare', 98), condition: 1.1 };
  state = castThenCatch(state, long);
  state = castThenCatch(state, fat);
  const entry = state.book.fish['northern-pike'];
  assert.equal(entry.largest.size, 100);
  assert.equal(entry.heaviest?.size, 98);
});

test('a save from version 14 loads, the heaviest of each record its longest (D146)', () => {
  const v14 = /** @type {any} */ ({ ...game(), version: 14 });
  v14.streams = Object.fromEntries(Object.entries(v14.streams).filter(([k]) => k !== 'condition'));
  const record = { size: 90, location: 'lake', spot: 'reedy-shore', time: 0, weather: { season: 'summer', cell: 0 } };
  v14.book = { ...v14.book, fish: { 'northern-pike': { caught: 1, totalSize: 90, smallest: record, largest: record, mostTries: 0 } } };
  const s = deserialize(serialize(v14));
  assert.equal(s.streams.condition, game().streams.condition);
  assert.equal(s.book.fish['northern-pike'].heaviest?.size, 90);
  assert.ok((s.book.fish['northern-pike'].heaviest?.weight ?? 0) > 0);
});

test('every fish has its own way of swimming (D147)', () => {
  for (const f of Object.values(content.fish)) {
    assert.ok(f.swim && f.swim.cruise > 0 && f.swim.lunge >= 1, f.id);
  }
  const pike = content.fish['northern-pike'].swim;
  const bleak = content.fish.bleak.swim;
  assert.ok(pike.rest > bleak.rest && pike.lunge > bleak.lunge, 'a pike waits and lunges');
  assert.ok(bleak.cruise > pike.cruise, 'bleak dart about');
  assert.ok((content.fish['mainland-eel'].swim.wind ?? 0) > 0, 'an eel winds');
});

test('the adjustable line (D148): a depth set counts only with the line on; its fish bite more, the bottom brings up more that is not fish', () => {
  const base = game();
  const without = setLineDepth(base, 'bottom');
  assert.equal(without.state, base, 'no adjustable line, no depth');
  const lined = /** @type {GameState} */ ({ ...base, equipped: { ...base.equipped, line: { id: 'adjustable-line', count: 1 } } });
  assert.ok(lineAdjustable(lined));
  const set = setLineDepth(lined, 'surface');
  assert.equal(set.state.lineDepth, 'surface');
  assert.deepEqual(set.events, [{ type: 'depth-set', depth: 'surface' }]);
  const rules = content.rules.depth;
  const v = valuesFor(set.state).flat;
  assert.equal(v.surfaceFishFind, rules.chosen);
  assert.equal(v.bottomFishFind, rules.others);
  assert.equal(v.nonFishChance, 0);
  // Taken off, the depth no longer counts.
  const off = /** @type {GameState} */ ({ ...set.state, equipped: { ...set.state.equipped, line: null } });
  assert.equal(valuesFor(off).flat.surfaceFishFind, 0);
  // Over many casts at the reedy shore, surface and upper fish come more when set to the surface than to the bottom.
  /** @param {'surface' | 'bottom'} depth */
  const share = (depth) => {
    let top = 0;
    let fish = 0;
    let other = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const g = /** @type {GameState} */ ({ ...game({ seed }), equipped: { ...game({ seed }).equipped, line: { id: 'adjustable-line', count: 1 } }, lineDepth: depth, features: [], champions: {}, escaped: {}, pools: {} });
      g.pools = { 'lake/reedy-shore': { season: 'x', size: 0, at: g.time } };
      const line = castLine(g, 0).cast.line;
      if (line?.kind === 'fish') {
        fish++;
        if (['surface', 'upper'].includes(content.fish[line.fish.species].swims)) top++;
      } else other++;
    }
    return { top: top / Math.max(1, fish), other };
  };
  const surface = share('surface');
  const bottom = share('bottom');
  assert.ok(surface.top > bottom.top, `surface fish: ${surface.top} set high, ${bottom.top} set low`);
  assert.ok(bottom.other > surface.other, `not fish: ${bottom.other} at the bottom, ${surface.other} at the surface`);
});

test('a save from version 15 loads with no depth set (D148)', () => {
  const v15 = /** @type {any} */ ({ ...game(), version: 15 });
  delete v15.lineDepth;
  assert.equal(deserialize(serialize(v15)).lineDepth, null);
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
