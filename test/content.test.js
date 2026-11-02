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

test('the Lake has what the prototype had', () => {
  const lake = result.all.locations.lake;
  assert.equal(lake.fish.length, 7);
  assert.equal(lake.junk.length, 38);
  assert.equal(lake.treasure.length, 7);
  // The prototype's filler entries become explicit weights summing to 100.
  assert.equal(lake.fish.reduce((t, f) => t + f.weight, 0), 100);
  assert.equal(lake.junk.reduce((t, j) => t + j.weight, 0) + lake.emptyHook, 100);
});

test('text is replaced by keys, and the keys resolve', () => {
  const pike = result.bundle.fish.pike;
  assert.equal(pike.name, 'fish.pike.name');
  assert.equal(t(pike.name), 'Pike');
  assert.equal(t(pike.subnames[0]), 'Northern');
  assert.equal(t(result.bundle.locations.lake.spots[2].name), "Old Man's Cove");
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

    const broken = await buildContent(dir);
    const has = (/** @type {string} */ text) => broken.errors.some((e) => e.includes(text));
    assert.ok(has('no fish "piranha"'), 'unknown fish');
    assert.ok(has('"vendor-trash" is junk, not treasure'), 'wrong list');
    assert.ok(has('id "eeel" doesn\'t match'), 'id and file name');
    assert.ok(has('size.min must be below size.max'), 'size range');
    assert.ok(has('content/items/bad.json: /rarity'), 'schema');
    assert.ok(has("goes to 14, but 14 doesn't come back"), 'weather edge line');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
