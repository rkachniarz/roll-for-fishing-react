// @ts-check
// The content in content/ is valid, and src/generated/content.js matches it
// (docs/decisions.md, D43). A broken copy of the content shows the checks bite.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildContent, generatedFiles } from '../tools/content.mjs';
import { GAME_VALUES } from '../src/engine/values.js';
import { t } from '../src/strings.js';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
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

test("the spots hold the owner's spawn table (D101)", () => {
  const { lake, river } = result.all.locations;
  assert.deepEqual(lake.spots.map((/** @type {{ id: string }} */ s) => s.id), ['reedy-shore', 'swamp', 'still-water', 'rocky-shore', 'open-water', 'deep-water']);
  assert.deepEqual(river.spots.map((/** @type {{ id: string }} */ s) => s.id), ['upper-river', 'lower-river', 'river-mouth']);
  const reeds = lake.spots[0].fish;
  assert.equal(reeds.length, 14);
  assert.deepEqual(reeds[0], { id: 'roach', weight: 100 }, 'rank 1');
  assert.ok(reeds.every((/** @type {{ weight: number }} */ f, /** @type {number} */ i) => i === 0 || f.weight <= reeds[i - 1].weight), 'rarer down the list');
  assert.equal(Object.keys(result.all.fish).length, 80);
  // The prototype's junk and treasure, shared by both locations.
  const junk = result.all.tables['common-junk'].entries;
  assert.equal(junk.length, 38);
  assert.equal(result.all.tables['common-treasure'].entries.length, 7);
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
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
