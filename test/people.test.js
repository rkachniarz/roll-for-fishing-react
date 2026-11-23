// People: looks, names and townsfolk (8.13, D187, D188).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLOTHES, EYES, HAIR, PARTS, PART_COLOURS, PART_NAMES, PEOPLES, SKIN, fits, optionsFor, refit, rollLook, stepPart } from '../src/engine/looks.js';
import { personName, personSeed, playerLook, rollPerson, stranger, townsperson } from '../src/engine/people.js';
import { DRAWN, faceGrid } from '../src/scene/faces.js';
import { content } from '../src/generated/content.js';
import { t } from '../src/strings.js';
import { readNames } from '../tools/names.mjs';
import { deserialize, newGame, serialize } from '../src/engine/state.js';

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 3);
const people = SEEDS.map((s) => rollPerson(s));

test('the same seed gives the same person, and different seeds different people (D187)', () => {
  assert.deepEqual(rollPerson(42), rollPerson(42));
  assert.deepEqual(rollLook(42, 'orc', 'f'), rollLook(42, 'orc', 'f'));
  const faces = new Set(people.map((p) => JSON.stringify(p)));
  assert.ok(faces.size > SEEDS.length * 0.95, `${faces.size} of ${SEEDS.length} different`);
});

test('each part has its own label: the face never moves the name, nor one part another (D187)', () => {
  for (const seed of SEEDS.slice(0, 50)) {
    const a = rollPerson(seed, { people: 'dwarf', sex: 'm' });
    const b = rollPerson(seed, { people: 'dwarf', sex: 'f' });
    // Another name list changes the first name only; the surname and every face part that fits both stay.
    assert.equal(a.surname, b.surname);
    for (const part of ['head', 'skin', 'eyes', 'brows', 'nose', 'mouth', 'beard', 'ears', 'hat', 'clothes']) assert.equal(a[part], b[part], part);
  }
  // Rolling a look and a person from one seed gives the same face: the name draws nothing from the face's labels.
  const p = rollPerson(7, { people: 'human', sex: 'f' });
  const { name, surname, ...look } = p;
  assert.deepEqual(look, rollLook(7, 'human', 'f'));
});

test('beards only on dwarves (women too), tusks only on orcs (D188)', () => {
  for (const p of people) {
    assert.equal(p.beard !== 'none', p.people === 'dwarf', `${p.people} with beard ${p.beard}`);
    assert.equal(p.tusks !== 'none', p.people === 'orc', `${p.people} with tusks ${p.tusks}`);
  }
  const dwarfWomen = SEEDS.map((s) => rollPerson(s, { people: 'dwarf', sex: 'f' }));
  assert.ok(dwarfWomen.every((p) => p.beard !== 'none'));
});

test('skin by people: humans the human range, orcs never human, dwarves never green (D188)', () => {
  const greens = ['moss', 'sage', 'olive-green', 'swamp'];
  for (const seed of SEEDS) {
    assert.ok(!greens.includes(rollLook(seed, 'dwarf', 'm').skin));
    assert.ok(!greens.includes(rollLook(seed, 'human', 'f').skin));
  }
  const human = new Set(PARTS.skin.human);
  assert.ok(PARTS.skin.orc.every((s) => !human.has(String(s))), 'an orc has no human skin');
  assert.ok(PARTS.skin.dwarf.every((s) => !greens.includes(String(s))));
  // Dwarves have every human and orc colour but the greens.
  const want = new Set([...PARTS.skin.human, ...PARTS.skin.orc].map(String).filter((s) => !greens.includes(s)));
  assert.deepEqual(new Set(PARTS.skin.dwarf.map(String)), want);
});

test('every option is drawn or has a colour, and each colour part names real colours', () => {
  for (const part of PART_NAMES) {
    for (const p of PEOPLES) {
      for (const o of optionsFor(part, p, 'm')) {
        if (PART_COLOURS[part]) assert.ok(PART_COLOURS[part][o.id], `${part} ${o.id}: no colour`);
        else assert.ok(o.id in DRAWN[/** @type {keyof typeof DRAWN} */ (part)], `${part} ${o.id}: no drawing`);
      }
    }
  }
  for (const palette of [SKIN, HAIR, EYES, CLOTHES]) for (const hex of Object.values(palette)) assert.match(hex, /^#[0-9a-f]{6}$/);
});

test('a look made to fit another people keeps what fits and rolls the rest; the arrows go round', () => {
  const dwarf = rollLook(5, 'dwarf', 'm');
  const human = refit(dwarf, 'human', 'm', 5);
  assert.equal(human.beard, 'none');
  assert.equal(human.eyes, dwarf.eyes);
  for (const part of PART_NAMES) assert.ok(fits(part, 'human', human[part]), part);
  let look = human;
  const n = PARTS.hair.human.length;
  for (let i = 0; i < n; i++) look = stepPart(look, 'hair', 1);
  assert.equal(look.hair, human.hair);
  assert.notEqual(stepPart(human, 'hair', -1).hair, human.hair);
});

test('named townsfolk: rolled from their id, the same every time, what their file writes out wins (D187)', () => {
  for (const id of Object.keys(content.people)) {
    const p = townsperson(id);
    assert.deepEqual(p, townsperson(id));
    assert.equal(p.people, content.people[id].people);
    for (const part of PART_NAMES) assert.ok(fits(part, p.people, p[part]), `${id}: ${part} ${p[part]}`);
  }
  assert.equal(townsperson('alchemist').people, 'orc');
  assert.equal(townsperson('scrap-dealer').people, 'dwarf');
  assert.equal(townsperson('junk-collector').sex, 'f');
  // A recipe written out wins over the roll, part by part.
  const saved = content.people.innkeeper;
  try {
    content.people.innkeeper = { ...saved, look: { hair: 'mohawk', hat: 'none' }, name: 'person.test.name' };
    const p = townsperson('innkeeper');
    assert.equal(p.hair, 'mohawk');
    assert.equal(p.name, 'person.test.name');
    assert.equal(p.skin, rollPerson(personSeed('innkeeper'), { people: 'human', sex: p.sex }).skin);
  } finally {
    content.people.innkeeper = saved;
  }
});

test('names on screen: "Name the Role", otherwise "Name Surname" (D188)', () => {
  const alchemist = townsperson('alchemist');
  assert.equal(personName(alchemist), `${t(alchemist.name)} the Alchemist`);
  const s = stranger(1, 'patron-1');
  assert.equal(personName(s), `${t(s.name)} ${t(s.surname)}`);
  assert.ok(content.names[s.people][s.sex === 'f' ? 'female' : 'male'].includes(s.name), 'the first name from its people and list');
  assert.deepEqual(stranger(1, 'patron-1'), s);
});

test('strangers are mostly human (D188)', () => {
  const humans = SEEDS.filter((s) => stranger(s, 'x').people === 'human').length;
  assert.ok(humans > SEEDS.length * 0.65 && humans < SEEDS.length * 0.95, `${humans} of ${SEEDS.length}`);
});

test("the player's look: rolled from the seed for a new game, saved, and given to an old save (D188)", () => {
  const character = { name: 'Testek', gender: /** @type {'f'} */ ('f'), classId: 'rogue-fisher', stats: { fishingSkill: 1, fishFind: 1, treasureFind: 1 }, luck: 0, xp: 0, perks: {} };
  const state = newGame({ seed: 9, character });
  assert.deepEqual(state.character.look, playerLook(9, 'f'));
  const picked = { ...playerLook(9, 'f', 'dwarf'), hair: 'bun' };
  const own = newGame({ seed: 9, character: { ...character, look: picked } });
  assert.deepEqual(deserialize(serialize(own)).character.look, picked);
  const { look, ...old } = state.character;
  const back = deserialize(JSON.stringify({ ...state, version: 25, character: old }));
  assert.deepEqual(back.character.look, playerLook(9, 'f'));
});

test('a face stays inside the round portrait, at 64 and at 32 (D142)', () => {
  for (const p of people.slice(0, 40)) {
    for (const size of [64, 32]) {
      const grid = faceGrid(p, size);
      assert.equal(grid.length, size);
      const c = size / 2;
      grid.forEach((row, y) => row.forEach((colour, x) => {
        if (colour) assert.ok((x + 0.5 - c) ** 2 + (y + 0.5 - c) ** 2 <= c * c, `${size}: (${x}, ${y}) outside the circle`);
      }));
      assert.ok(grid.flat().filter(Boolean).length > size * size * 0.2, 'a face fills its portrait');
    }
  }
});

test("the name import reads the owner's one-column lists", () => {
  const { names, notes } = readNames('﻿name\r\nBorek\r\n"Bratan"\r\n\r\nBorek\r\n', 'x.csv');
  assert.deepEqual(names, ['Borek', 'Bratan']);
  assert.equal(notes.length, 1);
  assert.deepEqual(readNames('surname\nAall\n', 'y').names, ['Aall']);
  for (const p of PEOPLES) for (const list of ['male', 'female', 'surnames']) assert.ok(content.names[p][list].length > 0, `${p} ${list}`);
});
