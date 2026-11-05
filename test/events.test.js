// @ts-check
// Events (R10; D45, D84): the text format, requirements, choices and their
// effects, and what starts an event.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, cp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEvent } from '../tools/event-text.mjs';
import { buildContent } from '../tools/content.mjs';
import { content } from '../src/generated/content.js';
import { METER_FIRES, afterCast, canStart, choose, openSlide, startEvent } from '../src/engine/events.js';
import { castLine, tick } from '../src/engine/game.js';
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
const choices = (/** @type {GameState} */ s) => openSlide(s)?.choices.map((c) => t(c.text));

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
  assert.deepEqual(observe, { text: 'Observe it closely', to: 'observe', needs: [], effects: [] });
  assert.equal(ignore.to, 'end');
  assert.deepEqual(lunge.needs, [{ kind: 'class', id: 'rogue-fisher' }]);
  assert.deepEqual(event.slides.observe.choices[0].effects, [{ kind: 'luck', add: 2 }]);
  assert.deepEqual(event.slides.lunge.choices[0].effects, [{ kind: 'luck', add: -1 }]);
  assert.equal(event.slides.lunge.choices[0].text, 'Well, shit.');
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
  assert.equal(event.slides.a.text, 'First paragraph, still the first.\n\nSecond paragraph.');
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
  assert.equal(t(content.events.frog.title), 'A froggy encounter');
  assert.equal(t(content.events.frog.slides.start.text), 'You see a frog in the shallow water, just outside your reach.');
});

// ---------- Playing an event ----------

test('the frog: a rogue may lunge, others only observe or ignore it (§C.6)', () => {
  const fighter = startEvent(game('fish-fighter'), 'frog');
  assert.deepEqual(choices(fighter), ['Observe it closely', 'Ignore it']);
  const rogue = startEvent(game('rogue-fisher'), 'frog');
  assert.deepEqual(choices(rogue), ['Observe it closely', 'Ignore it', 'Attempt to catch the frog']);

  // Observe: +2 Luck, hidden, so nothing for the log.
  let s = choose(fighter, 0).state;
  assert.equal(openSlide(s)?.text, 'event.frog.observe.text');
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

test('the frog happens once (it is "once: true")', () => {
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
