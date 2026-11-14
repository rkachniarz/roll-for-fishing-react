// @ts-check
// The content in content/ is valid, and src/generated/content.js matches it
// (docs/decisions.md, D43). A broken copy of the content shows the checks bite.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContent, generatedFiles } from '../tools/content.mjs';
import { GAME_VALUES, effectSign } from '../src/engine/values.js';
import { t } from '../src/strings.js';

// fileURLToPath, not .pathname: a folder with a space in its name stays readable.
const root = fileURLToPath(new URL('..', import.meta.url));
const result = await buildContent(root);

test('the content has no errors', () => {
  assert.deepEqual(result.errors, []);
});

test('the generated files are up to date (run npm run content)', async () => {
  for (const [path, text] of Object.entries(generatedFiles(result))) {
    const onDisk = (await readFile(join(root, path), 'utf8')).replace(/\r\n/g, '\n');
    assert.equal(onDisk, text, `${path} is out of date`);
  }
});

test('every fish says which quarter of the water it swims in (D136)', async () => {
  const { content } = await import('../src/generated/content.js');
  const without = Object.values(content.fish).filter((f) => !f.retired && !f.swims).map((f) => f.id);
  assert.deepEqual(without, []);
});

test("the spots hold the owner's spawn table (D101)", () => {
  const { lake, river } = result.all.locations;
  assert.deepEqual(lake.spots.map((/** @type {{ id: string }} */ s) => s.id), ['reedy-shore', 'swamp', 'still-water', 'rocky-shore', 'open-water', 'deep-water']);
  assert.deepEqual(river.spots.map((/** @type {{ id: string }} */ s) => s.id), ['upper-river', 'lower-river', 'river-mouth']);
  const reeds = lake.spots[0].fish;
  assert.equal(reeds.length, 14);
  assert.deepEqual(reeds[0], { id: 'roach', weight: 100 }, 'rank 1');
  assert.ok(reeds.every((/** @type {{ weight: number }} */ f, /** @type {number} */ i) => i === 0 || f.weight <= reeds[i - 1].weight), 'rarer down the list');
  const fish = Object.values(result.all.fish);
  assert.equal(fish.filter((f) => !f.rift).length, 80);
  // And a rift table for every spot (D104).
  assert.equal(fish.filter((f) => f.rift).length, 42);
  assert.ok([...lake.spots, ...river.spots].every((/** @type {{ rift?: unknown[] }} */ s) => (s.rift ?? []).length >= 3));
  // The prototype's junk and treasure, shared by both locations, with the placeholder gear (5.3, 5.7).
  const junk = result.all.tables['common-junk'].entries;
  assert.equal(junk.length, 38);
  assert.equal(result.all.tables['common-treasure'].entries.length, 7 + 16 + 1, 'and the Heavyweight heavy weights (D137)');
  assert.equal(junk.reduce((/** @type {number} */ t, /** @type {{ weight: number }} */ j) => t + j.weight, 0) + lake.emptyHook, 100);
});

test('text is replaced by keys, and the keys resolve', () => {
  const pike = result.bundle.fish['northern-pike'];
  assert.equal(pike.name, 'fish.northern-pike.name');
  assert.equal(t(pike.name), 'Northern pike');
  assert.equal(t(result.bundle.locations.lake.spots[1].name), 'the swamp');
  assert.equal(t(result.bundle.rules['fish-preferences'].baits[0].name), 'Maggot');
});

test('every game value has a label', () => {
  for (const name of Object.keys(GAME_VALUES)) assert.notEqual(t(`value.${name}`), `value.${name}`, name);
});

test('mistakes in content are caught', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rff-content-'));
  try {
    await cp(join(root, 'schemas'), join(dir, 'schemas'), { recursive: true });
    await cp(join(root, 'content'), join(dir, 'content'), { recursive: true });
    const lakePath = join(dir, 'content/locations/lake.json');
    const lake = JSON.parse(await readFile(lakePath, 'utf8'));
    lake.fish.push({ id: 'piranha', weight: 1 });
    lake.treasure.push({ id: 'vendor-trash', weight: 1 });
    await writeFile(lakePath, JSON.stringify(lake));
    await writeFile(join(dir, 'content/fish/eel.json'), JSON.stringify({ id: 'eeel', name: 'Eel', size: { min: 5, max: 5 }, difficulty: 0, rarity: 'common' }));
    // The prototype's own defect: Summer #8 leading north past its edge line.
    const summerPath = join(dir, 'content/weather/summer.json');
    const summer = JSON.parse(await readFile(summerPath, 'utf8'));
    summer.weathers[8].changeSet[0] = 14;
    await writeFile(summerPath, JSON.stringify(summer));
    await writeFile(join(dir, 'content/items/bad.json'), JSON.stringify({ id: 'bad', category: 'junk', name: 'Bad', rarity: 'shiny', value: 1 }));
    // What fish prefer (D101): words and baits that don't exist, bait that isn't bait.
    const zanderPath = join(dir, 'content/fish/zander.json');
    const zander = JSON.parse(await readFile(zanderPath, 'utf8'));
    zander.prefers = { weather: ['drizzly'], bait: ['caviar'] };
    await writeFile(zanderPath, JSON.stringify(zander));
    // A school of a fish that doesn't live in the spot (D102).
    const riverPath = join(dir, 'content/locations/river.json');
    const river = JSON.parse(await readFile(riverPath, 'utf8'));
    river.spots[0].features.push({ id: 'carp-school', weight: 1 });
    // A rift fish among the ordinary fish, and an ordinary one in the rift (D104).
    river.spots[0].fish.push({ id: 'arapaima', weight: 1 });
    river.spots[0].rift.push({ id: 'roach', weight: 1 });
    await writeFile(riverPath, JSON.stringify(river));
    const wormsPath = join(dir, 'content/items/worms.json');
    await writeFile(wormsPath, JSON.stringify({ ...JSON.parse(await readFile(wormsPath, 'utf8')), slot: 'trinket' }));

    const broken = await buildContent(dir);
    const has = (/** @type {string} */ text) => broken.errors.some((e) => e.includes(text));
    assert.ok(has('no fish "piranha"'), 'unknown fish');
    assert.ok(has('"vendor-trash" is junk, not treasure'), 'wrong list');
    assert.ok(has('id "eeel" doesn\'t match'), 'id and file name');
    assert.ok(has('size.min must be below size.max'), 'size range');
    assert.ok(has('content/items/bad.json: /rarity'), 'schema');
    assert.ok(has("goes to 14, but 14 doesn't come back"), 'weather edge line');
    assert.ok(has('zander.json: no weather word "drizzly"'), 'weather word');
    assert.ok(has('zander.json: no bait "caviar"'), 'bait kind');
    assert.ok(has('worms.json: only bait has a bait kind'), 'bait kind off the bait slot');
    assert.ok(has(`(upper-river): "carp-school" holds common-carp, which doesn't live here`), 'a school out of place');
    assert.ok(has('(upper-river): rift fish "arapaima" only belongs in the rift table'), 'a rift fish out of the rift');
    assert.ok(has(`(upper-river): "roach" in the rift table isn't a rift fish`), 'an ordinary fish in the rift');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('mistakes in perks, items and spots are caught (D96, D106, D110-D112, 4.2)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rff-content-'));
  /** @param {string} path @param {(json: any) => void} change */
  const edit = async (path, change) => {
    const json = JSON.parse(await readFile(join(dir, path), 'utf8'));
    change(json);
    await writeFile(join(dir, path), JSON.stringify(json));
  };
  try {
    await cp(join(root, 'schemas'), join(dir, 'schemas'), { recursive: true });
    await cp(join(root, 'content'), join(dir, 'content'), { recursive: true });
    await edit('content/perks/battle-focus.json', (p) => (p.cooldown = { minusLevel: true }));
    await edit('content/perks/fence.json', (p) => (p.cooldowns = { gutt: { casts: 3 }, gut: {} }));
    await edit('content/items/mage-tower-map-1.json', (i) => (i.fragmentOf = 'mage-towr'));
    await edit('content/locations/river.json', (l) => (l.spots[0].water = { x0: 200, y0: 100, x1: 40, y1: 180 }));
    const junk = { id: 'shiny-junk', category: 'junk', name: 'Shiny junk', rarity: 'common', value: 1, set: 'no-such-set' };
    await writeFile(join(dir, 'content/items/shiny-junk.json'), JSON.stringify(junk));

    const broken = await buildContent(dir);
    const has = (/** @type {string} */ text) => broken.errors.some((e) => e.includes(text));
    assert.ok(has('battle-focus.json: a cooldown needs "casts" or "ms"'), 'a cooldown that never runs');
    assert.ok(has(`fence.json: "cooldowns" names "gutt", which isn't an active perk`), 'a cooldown for nothing');
    assert.ok(has('fence.json: the cooldown for "gut" needs "casts" or "ms"'), "another's cooldown that never runs");
    assert.ok(has(`mage-tower-map-1.json: a map fragment of "mage-towr", which isn't a location`), 'a map to nowhere');
    assert.ok(has('(upper-river): the water box needs'), 'water corners out of order');
    assert.ok(has('shiny-junk.json: junk is gray'), "junk that isn't gray");
    assert.ok(has('shiny-junk.json: junk is good for nothing'), 'junk with a use');
    assert.ok(has('shiny-junk.json: no set "no-such-set"'), "a set that isn't there");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('every upside has a downside, bait aside, which is used up (R8.5, 5.3)', async () => {
  const result = await buildContent(root);
  for (const item of Object.values(result.all.items)) {
    const signs = (item.effects ?? []).map(effectSign);
    if (item.slot === 'bait' || !signs.includes(1)) continue;
    assert.ok(signs.includes(-1), `${item.id}: an upside with no downside`);
  }
  // Placeholder gear for every slot, findable, not only on the bench (5.3, 5.7).
  for (const slot of ['rod', 'line', 'bobber', 'hat', 'trinket']) {
    const found = Object.values(result.all.items).filter((i) => i.slot === slot && !i.devOnly && i.effects);
    assert.ok(found.length >= 1, `nothing findable for the ${slot} slot`);
  }
  assert.ok(Object.values(result.all.items).filter((i) => i.slot === 'rod' && !i.devOnly).length >= 4, 'the stick and three better rods (5.7)');
});
