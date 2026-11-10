// @ts-check
// Events (R10; D45, D84): the text format, requirements, choices and their
// effects, and what starts an event.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, cp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLACEHOLDERS, parseEvent, parseText } from '../tools/event-text.mjs';
import { eventWords, sayEventText } from '../src/ui/event-words.js';
import { buildContent, eventText } from '../tools/content.mjs';
import { content } from '../src/generated/content.js';
import { METER_FIRES, afterCast, arrive, canStart, choose, meets, openSlide, startEvent, textNow, uselessJunk } from '../src/engine/events.js';
import { castLine, tick, travel } from '../src/engine/game.js';
import { deserialize, newGame } from '../src/engine/state.js';
import { createRng } from '../src/rng.js';
import { diceFor } from '../src/dice.js';
import { t } from '../src/strings.js';

/** @typedef {import('../src/engine/state.js').GameState} GameState */

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** @param {string} classId */
const game = (classId = 'fish-fighter', seed = 1) =>
  newGame({ seed, character: { name: 'Testek', gender: 'f', classId, stats: { fishingSkill: 3, fishFind: 5, treasureFind: 7 }, luck: 0, xp: 0 } });

/** The choice texts on the open slide, in English. */
const choices = (/** @type {GameState} */ s) => openSlide(s)?.choices.map((c) => c.text.map((k) => t(k)).join(''));

/**
 * A made-up event, put into the content for one test.
 * @param {any} event
 * @param {() => void} body
 */
function withEvent(event, body) {
  content.events[event.id] = event;
  try {
    body();
  } finally {
    delete content.events[event.id];
  }
}

// ---------- The text format ----------

test('the frog reads as three slides, with a class requirement and Luck', async () => {
  const { event, errors } = parseEvent(await readFile(join(root, 'content/events/frog.md'), 'utf8'));
  assert.deepEqual(errors, []);
  assert.ok(event);
  assert.equal(event.id, 'frog');
  assert.equal(event.first, 'start');
  assert.equal(event.once, true);
  assert.equal(event.trigger, 'meter');
  assert.deepEqual(Object.keys(event.slides), ['start', 'observe', 'lunge']);
  const [observe, ignore, lunge] = event.slides.start.choices;
  assert.deepEqual(observe, { text: ['Observe it closely'], to: 'observe', needs: [], effects: [] });
  assert.equal(ignore.to, 'end');
  assert.deepEqual(lunge.needs, [{ kind: 'class', id: 'rogue-fisher' }]);
  assert.deepEqual(event.slides.observe.choices[0].effects, [{ kind: 'luck', add: 2 }]);
  assert.deepEqual(event.slides.lunge.choices[0].effects, [{ kind: 'luck', add: -1 }]);
  assert.deepEqual(event.slides.lunge.choices[0].text, ['Well, shit.']);
});

test('every word in the vocabulary reads', () => {
  const { event, errors } = parseEvent(`---
id: test
title: Test
trigger: needs
needs: caught roach 3
needs: no-flag met
---

## a
First paragraph,
still the first.

Second paragraph.

- Go -> b
  needs: level 2
  needs: luck 1
  needs: item bent-fork 2
  needs: flag x
  needs: season summer
  needs: time dawn
  gain: 50 xp
  gain: bent-fork
  lose: 3 bread-crumbs
  set: met
  clear: x

## b
The end.

- Bye -> end
`);
  assert.deepEqual(errors, []);
  assert.ok(event);
  assert.deepEqual(event.slides.a.text, ['First paragraph, still the first.\n\nSecond paragraph.']);
  assert.deepEqual(event.needs, [{ kind: 'caught', fish: 'roach', count: 3 }, { kind: 'no-flag', name: 'met' }]);
  const go = event.slides.a.choices[0];
  assert.deepEqual(go.needs, [
    { kind: 'level', at: 2 },
    { kind: 'luck', at: 1 },
    { kind: 'item', id: 'bent-fork', count: 2 },
    { kind: 'flag', name: 'x' },
    { kind: 'season', id: 'summer' },
    { kind: 'time', part: 'dawn' },
  ]);
  assert.deepEqual(go.effects, [
    { kind: 'xp', add: 50 },
    { kind: 'item', id: 'bent-fork', add: 1 },
    { kind: 'item', id: 'bread-crumbs', add: -3 },
    { kind: 'flag', name: 'met', set: true },
    { kind: 'flag', name: 'x', set: false },
  ]);
});

test('mistakes in an event are reported with their line', () => {
  const bad = parseEvent(`---
id: Bad Id
title: Bad
---
Loose text.
## a
Text.
- No arrow here
- Somewhere -> nowhere
  needs: wizardry 9
  gain: 2 sandwiches please
More text after the choices.
`);
  assert.equal(bad.event, null);
  const has = (/** @type {string} */ text) => bad.errors.some((e) => e.includes(text));
  assert.ok(has('needs an id'), 'id');
  assert.ok(has('line 5: text before the first slide'), 'loose text');
  assert.ok(has('line 8: a choice is'), 'no arrow');
  assert.ok(has('line 9: no slide "nowhere"'), 'unknown slide');
  assert.ok(has('line 10: no requirement "wizardry"'), 'unknown word');
  assert.ok(has('line 11: "gain" takes'), 'bad effect');
  assert.ok(has("line 12: a slide's text goes before its choices"), 'text after choices');
  assert.deepEqual(parseEvent('## a\nText').errors, ['the file must start with front matter between --- lines']);
});

test('npm run content checks what an event names', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rff-events-'));
  try {
    await cp(join(root, 'schemas'), join(dir, 'schemas'), { recursive: true });
    await cp(join(root, 'content'), join(dir, 'content'), { recursive: true });
    await writeFile(
      join(dir, 'content/events/broken.md'),
      '---\nid: broken\ntitle: Broken\n---\n## a\nText.\n- Hi -> end\n  needs: class bard\n  gain: golden-carp\n## b\nNobody comes here.\n- Bye -> end\n',
    );
    const built = await buildContent(dir);
    const has = (/** @type {string[]} */ list, /** @type {string} */ text) => list.some((e) => e.includes(text));
    assert.ok(has(built.errors, 'broken.md (a): no class "bard"'));
    assert.ok(has(built.errors, 'broken.md (a): no item "golden-carp"'));
    assert.ok(has(built.warnings, 'broken.md: nothing leads to slide "b"'));
    assert.ok(has(built.warnings, 'broken.md: nothing starts it'));
    assert.ok(has(built.warnings, 'broken.md (a): every choice has a requirement'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the frog's text is in the string table", () => {
  assert.deepEqual(content.events.frog.title, ['event.frog.title']);
  assert.equal(t(content.events.frog.title[0]), 'A froggy encounter');
  assert.equal(t(content.events.frog.slides.start.text[0]), 'You see a frog in the shallow water, just outside your reach.');
});

test('conditional text: needs, an otherwise, escapes, and mistakes (D88)', () => {
  assert.deepEqual(parseText('You stand on the shore. [precipitation 3+: Your clothes are getting wet.]'), [
    'You stand on the shore. ',
    { needs: [{ kind: 'weather', level: 'precipitation', min: 3, max: null }], text: 'Your clothes are getting wet.' },
  ]);
  assert.deepEqual(parseText('The water is [temperature 0-, season winter: frozen solid | cold and dark].'), [
    'The water is ',
    {
      needs: [{ kind: 'weather', level: 'temperature', min: null, max: 0 }, { kind: 'season', id: 'winter' }],
      text: 'frozen solid',
      otherwise: 'cold and dark',
    },
    '.',
  ]);
  assert.deepEqual(parseText('A \\[bracket\\] and [gender f: a lass: yes | a lad]'), [
    'A [bracket] and ',
    { needs: [{ kind: 'gender', gender: 'f' }], text: 'a lass: yes', otherwise: 'a lad' },
  ]);
  assert.match(String(parseText('[wind 3+ no colon]')), /needs requirements, a colon/);
  assert.match(String(parseText('[wind 3+: a [b: c]]')), /can't nest/);
  assert.match(String(parseText('[wind 3+: a')), /no "]"/);
  assert.match(String(parseText('a ] b')), /no "\[" before it/);
  assert.match(String(parseText('[wind 3+: a | b | c]')), /one "\|" at most/);
  assert.match(String(parseText('[weather rainy: a]')), /no requirement "weather"/);
});

test('npm run content gives each part its key and checks placeholders and conditions', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rff-text-'));
  try {
    await cp(join(root, 'schemas'), join(dir, 'schemas'), { recursive: true });
    await cp(join(root, 'content'), join(dir, 'content'), { recursive: true });
    await writeFile(
      join(dir, 'content/events/shore.md'),
      "---\nid: shore\ntitle: The shore, {Season}\n---\n## a\nHello, {name}. [gender f: Ma'am. | Sir.] {nmae}\n- Hi [class wizzard: mage] -> end\n",
    );
    const built = await buildContent(dir);
    const has = (/** @type {string} */ text) => built.errors.some((e) => e.includes(text));
    assert.ok(has('shore.md (a): no placeholder {nmae}'), built.errors.join('\n'));
    assert.ok(has('shore.md (a): no class "wizzard"'));
    const parsed = parseEvent("---\nid: shore\ntitle: The shore, {Season}\n---\n## a\nHello, {name}. [gender f: Ma'am. | Sir.] Bye.\n- Hi -> end\n");
    assert.ok(parsed.event);
    const strings = /** @type {Record<string, string>} */ ({});
    const copy = structuredClone(parsed.event);
    eventText(copy, strings);
    assert.deepEqual(copy.slides.a.text, [
      'event.shore.a.text.0',
      { needs: [{ kind: 'gender', gender: 'f' }], text: 'event.shore.a.text.1', otherwise: 'event.shore.a.text.1.else' },
      'event.shore.a.text.2',
    ]);
    assert.equal(strings['event.shore.a.text.1.else'], 'Sir.');
    assert.deepEqual(copy.title, ['event.shore.title']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('event text put together: placeholders filled, conditions chosen, spaces tidied (D88)', () => {
  const base = game('rogue-fisher');
  const s = { ...base, character: { ...base.character, name: 'Wanda', gender: /** @type {const} */ ('f') } };
  const words = eventWords(s);
  for (const name of Object.keys(PLACEHOLDERS)) assert.ok(name in words, `{${name}} is filled`);
  assert.equal(words.class, 'Rogue Fisherwoman');
  assert.equal(words.location, 'the Lake');
  assert.equal(words.Location, 'The Lake');
  assert.match(String(words.season), /^[a-z]/);
  assert.match(String(words.Season), /^[A-Z]/);
  // Plain text in place of string keys: t() hands back a key it doesn't know as it is.
  const parts = /** @type {any} */ (parseText("Hello, {name} the {class}. [gender m: Sir! | Ma'am!] [wind 9+: It howls.] It is {season}."));
  assert.equal(sayEventText(textNow(s, parts), words), `Hello, Wanda the Rogue Fisherwoman. Ma'am! It is ${words.season}.`);
  assert.equal(sayEventText(['The water is ', '', '.'], {}), 'The water is.');
  assert.equal(sayEventText(['One.\n\n', '', '\n\nTwo.'], {}), 'One.\n\nTwo.');
});

// ---------- Playing an event ----------

test('an event happens once unless it says "once: false"; a key given twice is a mistake (D87)', () => {
  const head = (/** @type {string} */ extra) => `---\nid: x\ntitle: X\n${extra}---\n## a\nText.\n- Bye -> end\n`;
  assert.equal(parseEvent(head('')).event?.once, true);
  assert.equal(parseEvent(head('once: false\n')).event?.once, false);
  assert.ok(parseEvent(head('trigger: item\ntrigger: needs\n')).errors.some((e) => e.includes('"trigger" twice')));
});

test('weather requirements: exactly, at least, at most, between', () => {
  const { event, errors } = parseEvent(
    '---\nid: x\ntitle: X\nneeds: wind 3+\nneeds: temperature 0-\nneeds: precipitation 2..4\nneeds: clouds 5\n---\n## a\nText.\n- Bye -> end\n',
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(event?.needs, [
    { kind: 'weather', level: 'wind', min: 3, max: null },
    { kind: 'weather', level: 'temperature', min: null, max: 0 },
    { kind: 'weather', level: 'precipitation', min: 2, max: 4 },
    { kind: 'weather', level: 'clouds', min: 5, max: 5 },
  ]);
  assert.ok(parseEvent('---\nid: x\ntitle: X\nneeds: wind strong\n---\n## a\nText.\n- Bye -> end\n').errors.some((e) => e.includes('"wind" takes an amount')));
  const s = { ...game(), weather: { ...game().weather, wind: 4, temperature: -2, precipitation: 3, clouds: 5 } };
  for (const need of /** @type {any[]} */ (event?.needs)) assert.ok(meets(s, need), JSON.stringify(need));
  assert.ok(!meets({ ...s, weather: { ...s.weather, wind: 2 } }, /** @type {any} */ (event?.needs[0])));
  assert.ok(!meets({ ...s, weather: { ...s.weather, precipitation: 5 } }, /** @type {any} */ (event?.needs[2])));
});

test('the frog: a rogue may lunge, others only observe or ignore it (§C.6)', () => {
  const fighter = startEvent(game('fish-fighter'), 'frog');
  assert.deepEqual(choices(fighter), ['Observe it closely', 'Ignore it']);
  const rogue = startEvent(game('rogue-fisher'), 'frog');
  assert.deepEqual(choices(rogue), ['Observe it closely', 'Ignore it', 'Attempt to catch the frog']);

  // Observe: +2 Luck, hidden, so nothing for the log.
  let s = choose(fighter, 0).state;
  assert.deepEqual(openSlide(s)?.text, ['event.frog.observe.text']);
  assert.equal(s.character.luck, 0);
  const end = choose(s, 0);
  assert.equal(end.state.character.luck, 2);
  assert.equal(end.state.event, null);
  assert.deepEqual(end.events.map((e) => e.type), ['event-ended']);

  // The lunge: −1 Luck.
  s = choose(rogue, 2).state;
  s = choose(s, 0).state;
  assert.equal(s.character.luck, -1);

  // A fighter can't take the rogue's choice by its index either.
  assert.equal(choose(fighter, 2).state, fighter);
  // Ignore it: nothing changes but the event ending.
  assert.equal(choose(fighter, 1).state.character.luck, 0);
});

test('the frog happens once', () => {
  const s = choose(startEvent(game(), 'frog'), 1).state;
  assert.equal(s.eventsSeen.frog, 1);
  assert.equal(canStart(s, 'frog'), false);
  assert.equal(canStart(game(), 'frog'), true);
});

test('effects: items in and out of the bags, XP with a level-up, flags', () => {
  withEvent(
    {
      id: 'test-gifts',
      title: 'x',
      once: false,
      trigger: 'meter',
      needs: [],
      first: 'a',
      slides: {
        a: {
          text: 'x',
          choices: [
            {
              text: 'x',
              to: 'end',
              needs: [{ kind: 'item', id: 'bent-fork', count: 1 }],
              effects: [
                { kind: 'item', id: 'bent-fork', add: -5 },
                { kind: 'item', id: 'iron-key', add: 2 },
                { kind: 'xp', add: 500 },
                { kind: 'flag', name: 'gifted', set: true },
                { kind: 'flag', name: 'old', set: false },
              ],
            },
          ],
        },
      },
    },
    () => {
      const before = { ...startEvent(game(), 'test-gifts'), flags: { old: true } };
      assert.deepEqual(openSlide(before)?.choices, [], 'no bent fork, no choice');
      const s = { ...before, bags: [{ id: 'bent-fork', count: 2 }] };
      const out = choose(s, 0);
      assert.deepEqual(out.state.bags, [{ id: 'iron-key', count: 2 }], 'only the two forks there were are taken');
      assert.equal(out.state.found['iron-key'], 2);
      assert.equal(out.state.character.xp, 500);
      assert.deepEqual(out.state.flags, { gifted: true });
      assert.deepEqual(
        out.events.map((e) => e.type),
        ['event-lost', 'event-gained', 'event-xp', 'level-up', 'event-ended'],
      );
      assert.equal(out.events[0].count, 2);
    },
  );
});

// ---------- What starts an event ----------

test('an event can start on arriving: a new game arrives at its location (D89)', () => {
  const welcome = {
    id: 'test-welcome', title: ['x'], once: true, trigger: 'arrive', needs: [{ kind: 'location', id: 'lake' }], first: 'a',
    slides: { a: { text: ['x'], choices: [{ text: ['x'], to: 'end', needs: [], effects: [] }] } },
  };
  withEvent(welcome, () => {
    const s = game();
    assert.deepEqual(arrive(s), [{ type: 'event-started', event: 'test-welcome' }]);
    assert.deepEqual(s.event, { id: 'test-welcome', slide: 'a' }, 'open from the start');
    const after = choose(s, 0).state;
    const again = structuredClone(after);
    assert.deepEqual(arrive(again), [], 'once: the first arrival only');
    const elsewhere = structuredClone({ ...game(), event: null, eventsSeen: {}, location: 'river' });
    assert.deepEqual(arrive(elsewhere), [], 'not at another location');
  });
});

test('location and spot requirements, and an empty gain line', () => {
  const s = { ...game(), spot: 'reeds' };
  assert.ok(meets(s, { kind: 'location', id: 'lake' }));
  assert.ok(!meets(s, { kind: 'location', id: 'river' }));
  assert.ok(meets(s, { kind: 'spot', id: 'reeds' }));
  assert.ok(parseEvent('---\nid: x\ntitle: X\n---\n## a\nT.\n- Hi -> end\n  gain:\n').errors.some((e) => e.includes('"gain" needs something to gain')));
});

test('the event meter: a d20 per cast, +5 for an empty hook, fires above 100 at the Lake', () => {
  const dice = diceFor(createRng(5));
  const s = structuredClone(game());
  afterCast(s, dice, {});
  assert.ok(s.eventMeter >= 1 && s.eventMeter <= 20);
  const before = s.eventMeter;
  afterCast(s, dice, { empty: true });
  assert.ok(s.eventMeter >= before + 6 && s.eventMeter <= before + 25);

  s.eventMeter = METER_FIRES;
  const events = afterCast(s, dice, {});
  assert.deepEqual(events, [{ type: 'event-started', event: 'frog' }]);
  assert.equal(s.eventMeter, 0);
  assert.deepEqual(s.event, { id: 'frog', slide: 'start' });

  // Once the frog has been seen, a full meter finds nothing at the Lake.
  const after = structuredClone(choose(s, 1).state);
  after.eventMeter = METER_FIRES;
  assert.deepEqual(afterCast(after, dice, {}), []);
  assert.equal(after.eventMeter, 0);
});

test('an event can start from an item fished up, or once its needs are met', () => {
  const event = (/** @type {string} */ id, /** @type {string} */ trigger, /** @type {any[]} */ needs) => ({
    id, title: 'x', once: true, trigger, needs, first: 'a', slides: { a: { text: 'x', choices: [{ text: 'x', to: 'end', needs: [], effects: [] }] } },
  });
  const dice = diceFor(createRng(6));
  withEvent(event('test-key', 'item', []), () => {
    content.items['iron-key'].event = 'test-key';
    try {
      const s = structuredClone(game());
      assert.deepEqual(afterCast(s, dice, { found: 'iron-key' }), [{ type: 'event-started', event: 'test-key' }]);
    } finally {
      delete content.items['iron-key'].event;
    }
  });
  withEvent(event('test-roach', 'needs', [{ kind: 'caught', fish: 'roach', count: 3 }]), () => {
    const s = structuredClone(game());
    assert.deepEqual(afterCast(s, dice, {}), []);
    s.book.fish.roach = { caught: 3, totalSize: 30, smallest: /** @type {any} */ (null), largest: /** @type {any} */ (null), mostTries: 0 };
    assert.deepEqual(afterCast(s, dice, {}), [{ type: 'event-started', event: 'test-roach' }]);
  });
});

test('no cast goes out while an event is open; the meter fills through a whole cast', () => {
  const s = startEvent(game(), 'frog');
  const out = castLine(s, 0);
  assert.equal(out.state, s);
  assert.equal(out.cast.phase, 'idle');

  const fresh = game();
  const cast = castLine(fresh, 0);
  const done = tick(cast.state, cast.cast, cast.cast.biteAt + cast.cast.timing.lateMs + 1);
  assert.ok(done.state.eventMeter > 0);
});

test('a version 3 save gets an event meter, no open event, and an events stream', () => {
  const { eventMeter, event, eventsSeen, ...v3 } = game();
  const { events, ...streams } = v3.streams;
  const migrated = deserialize(JSON.stringify({ ...v3, version: 3, streams }));
  assert.equal(migrated.eventMeter, 0);
  assert.equal(migrated.event, null);
  assert.deepEqual(migrated.eventsSeen, {});
  assert.equal(typeof migrated.streams.events, 'number');
});

// ---------- Counters, fish, visitors, holding the player, trading junk (7.6-7.10) ----------

/**
 * An event from its text, for one test.
 * @param {string} text
 */
function eventFrom(text) {
  const { event, errors } = parseEvent(text);
  assert.deepEqual(errors, []);
  return /** @type {any} */ (event);
}

test('the new words read, and mistakes in them are reported', () => {
  const event = eventFrom(`---
id: test-words
title: x
again: 3 days
needs: count cat-trust 5+
needs: fish roach 3
---

## a
x {#cat-trust}

- x -> end
  add: cat-trust -2
  lose: 3 fish roach
  lose: rarest fish
  lose: fish
  go: river upper-river
  lock:
  unlock:
  trade: junk junk-collector
`);
  assert.deepEqual(event.again, { days: 3 });
  assert.equal(event.once, false, '"again" brings it back');
  assert.deepEqual(event.needs, [
    { kind: 'count', name: 'cat-trust', min: 5, max: null },
    { kind: 'fish', species: 'roach', count: 3 },
  ]);
  assert.deepEqual(event.slides.a.choices[0].effects, [
    { kind: 'count', name: 'cat-trust', add: -2 },
    { kind: 'fish', which: 'species', species: 'roach', count: 3 },
    { kind: 'fish', which: 'rarest', species: null, count: 1 },
    { kind: 'fish', which: 'any', species: null, count: 1 },
    { kind: 'go', location: 'river', spot: 'upper-river' },
    { kind: 'lock', set: true },
    { kind: 'lock', set: false },
    { kind: 'trade', what: 'junk', table: 'junk-collector' },
  ]);
  const bad = (/** @type {string} */ front, /** @type {string} */ line) =>
    parseEvent(`---\nid: x\ntitle: x\n${front}---\n\n## a\nx\n\n- x -> end\n  ${line}\n`).errors.join(' ');
  assert.match(bad('again: soon\n', 'set: a'), /"again" is a number of casts or days/);
  assert.match(bad('again: 3 casts\nonce: true\n', 'set: a'), /can't be "once: true"/);
  assert.match(bad('', 'add: cat-trust'), /"add" takes a counter name and a number/);
  assert.match(bad('', 'gain: fish'), /only be lost/);
  assert.match(bad('', 'lock: here'), /takes nothing/);
  assert.match(bad('', 'trade: fish x'), /"trade" takes "junk"/);
  assert.match(bad('', 'needs: count cat-trust'), /"count" takes a counter name and an amount/);
});

test('counters go up and down, are checked, and show in text (7.7)', () => {
  withEvent(eventFrom(`---\nid: test-cat\ntitle: x\nonce: false\n---\n\n## a\nTrust: {#cat-trust} of 5.\n\n- Feed -> end\n  add: cat-trust 2\n- Shoo -> end\n  add: cat-trust -1\n- Pet -> end\n  needs: count cat-trust 3+\n`), () => {
    let s = startEvent(game(), 'test-cat');
    assert.equal(openSlide(s)?.choices.length, 2, 'Pet needs trust 3');
    assert.equal(sayEventText(openSlide(s)?.text ?? [], eventWords(s), s.flags), 'Trust: 0 of 5.');
    s = startEvent(choose(s, 0).state, 'test-cat');
    s = startEvent(choose(s, 0).state, 'test-cat');
    assert.equal(s.flags['cat-trust'], 4);
    assert.equal(openSlide(s)?.choices.length, 3);
    assert.equal(sayEventText(openSlide(s)?.text ?? [], eventWords(s), s.flags), 'Trust: 4 of 5.');
    s = choose(s, 1).state;
    assert.equal(s.flags['cat-trust'], 3);
  });
});

test('events take fish from the bucket: the least valuable, a species, the rarest (7.8)', () => {
  const fish = (/** @type {string} */ species, /** @type {number} */ size, /** @type {string} */ rarity) => ({ species, subname: -1, band: 2, size, difficulty: 1, xp: 1, rarity });
  const roach = fish('roach', 20, 'common');
  const smallRoach = fish('roach', 12, 'common');
  const pike = fish('northern-pike', 80, 'rare');
  const perch = fish('perch', 15, 'poor');
  withEvent(eventFrom(`---\nid: test-take\ntitle: x\nonce: false\n---\n\n## a\nx\n\n- any -> end\n  lose: fish\n- roach -> end\n  needs: fish roach 3\n  lose: 3 fish roach\n- rarest -> end\n  lose: rarest fish\n`), () => {
    const base = { ...startEvent(game(), 'test-take'), bucket: [{ fish: roach, count: 2 }, { fish: smallRoach, count: 1 }, { fish: pike, count: 1 }, { fish: perch, count: 1 }] };
    const any = choose(base, 0);
    assert.deepEqual(any.events[0], { type: 'event-lost-fish', fish: perch, count: 1 }, 'the poor one');
    const species = choose(base, 1);
    assert.deepEqual(species.events.filter((e) => e.type === 'event-lost-fish'), [
      { type: 'event-lost-fish', fish: smallRoach, count: 1 },
      { type: 'event-lost-fish', fish: roach, count: 2 },
    ]);
    assert.deepEqual(species.state.bucket.map((b) => b.fish.species), ['northern-pike', 'perch']);
    assert.deepEqual(choose(base, 2).events[0], { type: 'event-lost-fish', fish: pike, count: 1 });
    const fewer = { ...base, bucket: [{ fish: roach, count: 2 }] };
    assert.equal(openSlide(fewer)?.choices.length, 2, 'not 3 roach: the hand-in is hidden');
  });
});

test('a visitor comes back only after so many casts or days (7.10)', () => {
  for (const again of ['again: 5 casts', 'again: 2 days']) {
    withEvent(eventFrom(`---\nid: test-visitor\ntitle: x\n${again}\n---\n\n## a\nx\n\n- Bye -> end\n`), () => {
      let s = game();
      assert.ok(canStart(s, 'test-visitor'));
      s = choose(startEvent(s, 'test-visitor'), 0).state;
      assert.ok(!canStart(s, 'test-visitor'), 'not straight away');
      const later = again.includes('casts') ? { ...s, book: { ...s.book, casts: s.book.casts + 5 } } : { ...s, time: s.time + 2 * 24 * 60 };
      assert.ok(canStart(later, 'test-visitor'), `${again}: back`);
    });
  }
});

test('an event can move the player and hold them there until another lets them go (7.6, R10.8)', () => {
  withEvent(eventFrom(`---\nid: test-portal\ntitle: x\nonce: false\n---\n\n## a\nx\n\n- In -> end\n  go: river lower-river\n  lock:\n- Out -> end\n  unlock:\n`), () => {
    const s = game();
    const moved = choose(startEvent(s, 'test-portal'), 0);
    assert.equal(moved.state.location, 'river');
    assert.equal(moved.state.spot, 'lower-river');
    assert.equal(moved.state.locked, 'river');
    assert.deepEqual(moved.events[0], { type: 'moved', location: 'river', spot: 'lower-river' });
    const stuck = travel(moved.state, 'lake', 'reedy-shore');
    assert.equal(stuck.error, 'locked');
    assert.equal(stuck.state, moved.state);
    assert.equal(travel(moved.state, 'river', 'upper-river').state.spot, 'upper-river', 'spots there are fine');
    assert.equal(travel(moved.state, 'lake', 'reedy-shore', { force: true }).state.location, 'lake', 'the bench may');
    const freed = choose(startEvent(moved.state, 'test-portal'), 1).state;
    assert.equal(freed.locked, null);
    assert.equal(travel(freed, 'lake', 'reedy-shore').state.location, 'lake');
  });
});

test('trading junk: every useless piece goes, the reward by their total value (7.9)', () => {
  withEvent(eventFrom(`---\nid: test-collector\ntitle: x\nonce: false\n---\n\n## a\nx\n\n- Trade -> end\n  trade: junk junk-collector\n`), () => {
    const s = { ...startEvent(game(), 'test-collector'), bags: [{ id: 'bent-fork', count: 2 }, { id: 'dwarven-stein', count: 3 }, { id: 'willow-rod', count: 1 }, { id: 'worms', count: 1 }] };
    assert.ok(uselessJunk('bent-fork') && !uselessJunk('willow-rod') && !uselessJunk('worms'));
    const out = choose(s, 0);
    // 2 × 1 + 3 × 5 = 17: the 15 tier, a straw hat or a horsehair line.
    const gained = out.events.find((e) => e.type === 'event-gained');
    assert.ok(['straw-hat', 'horsehair-line'].includes(gained?.item), gained?.item);
    assert.ok(!out.state.bags.some((b) => b.id === 'bent-fork' || b.id === 'dwarven-stein'));
    assert.ok(out.state.bags.some((b) => b.id === 'willow-rod') && out.state.bags.some((b) => b.id === 'worms'), 'the rest stays');
    assert.notEqual(out.state.streams.events, s.streams.events, 'the reward from the events stream');
    const nothing = choose({ ...s, bags: [{ id: 'worms', count: 1 }] }, 0);
    assert.deepEqual(nothing.events.filter((e) => e.type !== 'event-ended'), [], 'no junk, no trade');
  });
});

test('a version 7 save gets visitors and no hold', () => {
  const { eventsLast, locked, ...v7 } = game();
  const migrated = deserialize(JSON.stringify({ ...v7, version: 7 }));
  assert.deepEqual(migrated.eventsLast, {});
  assert.equal(migrated.locked, null);
});
