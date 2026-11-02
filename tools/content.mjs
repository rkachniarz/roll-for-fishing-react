// Checks everything in content/ and builds what the game loads (D43).
//
//   npm run content
//
// Reads content/<kind>/*.json, checks each file against its schema in schemas/
// and every reference between them, then writes:
//
//   src/generated/content.js        the game's content, with text replaced by
//                                   string keys, and the English string table
//   schemas/game-values.schema.json the effect vocabulary, for VS Code
//   dist/content-overview.html      sortable tables of everything (untracked)
//
// The first two are committed, so the game runs straight from a checkout; a
// test fails if they are out of date (test/content.test.js). Nothing is
// written while there are errors.

import Ajv from 'ajv';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GAME_VALUES, EFFECT_DICE, effectSign } from '../src/engine/values.js';
import { HEX_NEIGHBOURS, OPPOSITE } from '../src/engine/hexmap.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Each folder in content/, the schema its files follow, and its string key prefix. */
const KINDS = {
  fish: { schema: 'fish', prefix: 'fish' },
  items: { schema: 'item', prefix: 'item' },
  locations: { schema: 'location', prefix: 'location' },
  tables: { schema: 'table', prefix: 'table' },
  weather: { schema: 'season', prefix: 'weather' },
  // One file per rule set; each has its own schema, named after its id.
  rules: { schema: null, prefix: 'rules' },
};

/**
 * Where the player-facing text is, per kind (D46). `#` is an array index, `@`
 * an array of objects keyed by their id: ['spots', '@', 'name'] gives
 * location.lake.spots.crossroads.name.
 */
const TEXT = {
  fish: [['name'], ['subnames', '#']],
  items: [['name'], ['flavor']],
  locations: [['name'], ['spots', '@', 'name']],
  tables: [],
  weather: [['name'], ['weathers', '#', 'name'], ['weathers', '#', 'descriptions', '#']],
  rules: [
    ['bands', '@', 'name'],
    ['temperature', '#', 'word'],
    ['wind', '#'],
    ['clouds', '#'],
    ['precipitation', '#'],
  ],
};

const GENERATED = 'src/generated/content.js';
const VALUES_SCHEMA = 'schemas/game-values.schema.json';

/** The effect vocabulary as a schema, so VS Code completes value and die names. */
export function gameValuesSchema() {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Game values and dice an effect may use. Generated from src/engine/values.js by npm run content.',
    definitions: {
      value: { enum: Object.keys(GAME_VALUES) },
      die: { enum: Object.keys(EFFECT_DICE) },
    },
  };
}

/**
 * Reads and checks all content.
 * @param {string} [root]
 */
export async function buildContent(root = ROOT) {
  /** @type {string[]} */ const errors = [];
  /** @type {string[]} */ const warnings = [];

  const ajv = new Ajv({ allErrors: true });
  ajv.addSchema(gameValuesSchema(), 'game-values.schema.json');
  for (const name of await readdir(join(root, 'schemas'))) {
    if (name === 'game-values.schema.json' || !name.endsWith('.schema.json')) continue;
    ajv.addSchema(JSON.parse(await readFile(join(root, 'schemas', name), 'utf8')), name);
  }

  // ---------- Read and check each file on its own ----------

  /** @type {Record<string, Record<string, any>>} */
  const all = {};
  for (const kind of Object.keys(KINDS)) {
    all[kind] = {};
    const dir = join(root, 'content', kind);
    if (!existsSync(dir)) continue;
    for (const file of (await readdir(dir)).filter((f) => f.endsWith('.json')).sort()) {
      const where = `content/${kind}/${file}`;
      let data;
      try {
        data = JSON.parse(await readFile(join(dir, file), 'utf8'));
      } catch (e) {
        errors.push(`${where}: not valid JSON (${e.message})`);
        continue;
      }
      const schemaName = `${KINDS[kind].schema ?? data.id}.schema.json`;
      const validate = ajv.getSchema(schemaName);
      if (!validate) {
        errors.push(`${where}: no schema ${schemaName}`);
        continue;
      }
      if (!validate(data)) {
        for (const e of validate.errors ?? []) errors.push(`${where}: ${e.instancePath || '(top)'} ${e.message}`);
        continue;
      }
      if (`${data.id}.json` !== file) errors.push(`${where}: id "${data.id}" doesn't match the file name`);
      delete data.$schema;
      all[kind][data.id] = data;
    }
  }

  // ---------- References between files ----------

  /** id -> the locations (and spots) that list it, for the overview and the unused check. */
  /** @type {Map<string, string[]>} */
  const foundAt = new Map();
  const note = (id, place) => foundAt.set(id, [...(foundAt.get(id) ?? []), place]);

  /**
   * @param {string} where
   * @param {any[] | undefined} entries
   * @param {'fish' | 'treasure' | 'junk'} list
   * @param {string} place
   */
  function checkEntries(where, entries, list, place) {
    for (const entry of entries ?? []) {
      if (entry.table) {
        const table = all.tables[entry.table];
        if (!table) errors.push(`${where}: no table "${entry.table}"`);
        else if ((list === 'fish') !== (table.kind === 'fish')) errors.push(`${where}: table "${entry.table}" holds ${table.kind}`);
        else for (const e of table.entries) note(e.id, place);
        continue;
      }
      if (list === 'fish') {
        if (!all.fish[entry.id]) errors.push(`${where}: no fish "${entry.id}"`);
      } else {
        const item = all.items[entry.id];
        const fits = list === 'treasure' ? ['treasure'] : ['junk', 'consumable'];
        if (!item) errors.push(`${where}: no item "${entry.id}"`);
        else if (!fits.includes(item.category)) errors.push(`${where}: "${entry.id}" is ${item.category}, not ${list}`);
      }
      note(entry.id, place);
    }
  }

  for (const table of Object.values(all.tables)) {
    const where = `content/tables/${table.id}.json`;
    for (const e of table.entries) {
      if (e.table) errors.push(`${where}: a table can't include another table`);
      else if (table.kind === 'fish' ? !all.fish[e.id] : !all.items[e.id]) errors.push(`${where}: no ${table.kind} "${e.id}"`);
    }
  }

  for (const loc of Object.values(all.locations)) {
    const where = `content/locations/${loc.id}.json`;
    for (const list of /** @type {const} */ (['fish', 'treasure', 'junk'])) checkEntries(where, loc[list], list, loc.id);
    const spotIds = new Set();
    for (const spot of loc.spots ?? []) {
      if (spotIds.has(spot.id)) errors.push(`${where}: two spots called "${spot.id}"`);
      spotIds.add(spot.id);
      for (const list of /** @type {const} */ (['fish', 'treasure', 'junk'])) {
        checkEntries(`${where} (${spot.id})`, spot[list], list, `${loc.id}/${spot.id}`);
      }
    }
  }

  for (const fish of Object.values(all.fish)) {
    const where = `content/fish/${fish.id}.json`;
    if (fish.size.min >= fish.size.max) errors.push(`${where}: size.min must be below size.max`);
    if (!foundAt.has(fish.id) && !fish.retired) warnings.push(`${where}: no location lists it`);
  }

  for (const item of Object.values(all.items)) {
    const where = `content/items/${item.id}.json`;
    const signs = (item.effects ?? []).map(effectSign);
    // R8.5. A warning until Phase 5 gives the prototype's treasure real downsides (5.3).
    if (signs.includes(1) && !signs.includes(-1)) warnings.push(`${where}: an upside with no downside (R8.5)`);
    if (!foundAt.has(item.id) && !item.retired) warnings.push(`${where}: no location lists it`);
  }

  checkSeasons(all.weather, errors);

  const bands = all.rules['size-bands']?.bands;
  if (!bands) errors.push('content/rules/size-bands.json: missing');
  else if (new Set(bands.map((b) => b.id)).size !== bands.length) errors.push('content/rules/size-bands.json: two bands share an id');

  // ---------- Text into the string table (D46) ----------

  /** @type {Record<string, string>} */
  const strings = {};
  /** @type {Record<string, Record<string, any>>} */
  const bundle = {};
  for (const [kind, entities] of Object.entries(all)) {
    bundle[kind] = {};
    for (const [id, entity] of Object.entries(entities)) {
      const copy = structuredClone(entity);
      for (const path of TEXT[kind]) moveText(copy, path, `${KINDS[kind].prefix}.${id}`, strings);
      bundle[kind][id] = copy;
    }
  }

  const missingArt = Object.fromEntries(
    ['fish', 'items', 'locations'].map((kind) => [kind, Object.values(all[kind]).filter((e) => !e.icon).length]),
  );

  return { errors, warnings, all, bundle, strings, foundAt, missingArt };
}

/**
 * The weather maps (D26, PORTING-NOTES §1.1). Every season has the same 19
 * cells; each move either goes to the hex map's neighbour (wrapping round the
 * edge) or, across an edge line, stays put; and every move can be made back.
 * @param {Record<string, any>} seasons
 * @param {string[]} errors
 */
function checkSeasons(seasons, errors) {
  const list = Object.values(seasons).sort((a, b) => a.order - b.order);
  if (list.length === 0) return;
  list.forEach((season, i) => {
    if (season.order !== i) errors.push(`content/weather/${season.id}.json: order should be ${i}`);
  });
  for (const season of list) {
    const where = `content/weather/${season.id}.json`;
    season.weathers.forEach((w, cell) => {
      w.changeSet.forEach((to, dir) => {
        if (to !== cell && to !== HEX_NEIGHBOURS[cell][dir]) {
          errors.push(`${where}: cell ${cell} "${w.name}" direction ${dir} goes to ${to}, not its neighbour ${HEX_NEIGHBOURS[cell][dir]} or itself`);
        } else if (to !== cell && season.weathers[to].changeSet[OPPOSITE[dir]] !== cell) {
          errors.push(`${where}: cell ${cell} "${w.name}" goes to ${to}, but ${to} doesn't come back`);
        }
      });
      for (const level of ['temperature', 'wind', 'clouds', 'precipitation']) {
        const v = w[level];
        if (typeof v === 'object' && v.min > v.max) errors.push(`${where}: cell ${cell} ${level} min is above max`);
      }
    });
  }
}

/**
 * Replaces the text at `path` with its string key, and files the text under
 * that key.
 * @param {any} node
 * @param {string[]} path
 * @param {string} key
 * @param {Record<string, string>} strings
 */
function moveText(node, path, key, strings) {
  if (node == null) return;
  const [step, ...rest] = path;
  if (step === '#' || step === '@') {
    if (!Array.isArray(node)) return;
    node.forEach((child, i) => {
      const childKey = `${key}.${step === '#' ? i : child.id}`;
      if (rest.length === 0) {
        strings[childKey] = child;
        node[i] = childKey;
      } else moveText(child, rest, childKey, strings);
    });
    return;
  }
  if (rest.length === 0) {
    if (typeof node[step] !== 'string') return;
    strings[`${key}.${step}`] = node[step];
    node[step] = `${key}.${step}`;
  } else moveText(node[step], rest, `${key}.${step}`, strings);
}

/** The generated files, path -> text. */
export function generatedFiles({ bundle, strings }) {
  const content =
    '// Generated by `npm run content` from content/ (docs/decisions.md, D43). Don\'t edit\n' +
    '// this file: edit content/ and run it again. Text is replaced by keys into\n' +
    '// `strings` (D46).\n\n' +
    `export const content = ${JSON.stringify(bundle, null, 2)};\n\n` +
    `/** @type {Record<string, Record<string, string>>} */\n` +
    `export const strings = ${JSON.stringify({ en: strings }, null, 2)};\n`;
  return {
    [GENERATED]: content,
    [VALUES_SCHEMA]: JSON.stringify(gameValuesSchema(), null, 2) + '\n',
  };
}

// ---------- The overview page ----------

const esc = (/** @type {unknown} */ s) => String(s ?? '').replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * @param {string} title
 * @param {string[]} head
 * @param {unknown[][]} rows
 */
function table(title, head, rows) {
  return `<h2>${esc(title)} <small>(${rows.length})</small></h2>
<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n')}</tbody></table>`;
}

export function overviewHtml({ all, foundAt }) {
  const where = (id) => (foundAt.get(id) ?? []).join(', ') || '(nowhere)';
  const effects = (item) =>
    (item.effects ?? []).map((e) => `${e.value} ${typeof e.add === 'number' && e.add > 0 ? '+' : ''}${e.add}`).join('; ');
  const fish = Object.values(all.fish).map((f) => [
    f.id, f.name, f.rarity, f.size.min, f.size.max, f.difficulty, (f.weather ?? []).length, where(f.id), f.icon ?? '',
  ]);
  const items = Object.values(all.items).map((i) => [
    i.id, i.category, i.name, i.rarity, i.value, i.unique ? 'yes' : '', i.xp ?? '', effects(i), where(i.id), i.icon ?? '',
  ]);
  const locations = Object.values(all.locations).map((l) => [
    l.id, l.name, l.biteThreshold, l.treasureThreshold, l.fish.length, l.treasure.length, l.junk.length, l.emptyHook,
    (l.spots ?? []).map((s) => s.id).join(', '),
  ]);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Content overview</title>
<style>
  body { font: 14px/1.4 system-ui, sans-serif; margin: 16px; background: #14232b; color: #e8f4f0; }
  table { border-collapse: collapse; margin-bottom: 24px; }
  th, td { padding: 3px 8px; border-bottom: 1px solid #2c4f5e; text-align: left; vertical-align: top; }
  th { cursor: pointer; position: sticky; top: 0; background: #1d3540; }
  th:hover { color: #ffd36b; }
  small { color: #9cbcc4; font-weight: normal; }
</style></head><body>
<h1>Content overview</h1>
<p><small>Generated by npm run content. Click a column to sort.</small></p>
${table('Fish', ['id', 'name', 'rarity', 'min cm', 'max cm', 'difficulty', 'weather prefs', 'found at', 'icon'], fish)}
${table('Items', ['id', 'category', 'name', 'rarity', 'value', 'unique', 'xp', 'effects', 'found at', 'icon'], items)}
${table('Locations', ['id', 'name', 'bite at', 'treasure at', 'fish', 'treasure', 'junk', 'empty hook', 'spots'], locations)}
<script>
for (const th of document.querySelectorAll('th')) {
  th.addEventListener('click', () => {
    const body = th.closest('table').tBodies[0];
    const col = th.cellIndex;
    const asc = th.dataset.dir !== 'asc';
    th.dataset.dir = asc ? 'asc' : 'desc';
    const value = (row) => row.cells[col].textContent;
    const rows = [...body.rows].sort((a, b) => {
      const x = value(a), y = value(b);
      const n = x !== '' && y !== '' && !isNaN(x) && !isNaN(y) ? x - y : x.localeCompare(y);
      return asc ? n : -n;
    });
    body.append(...rows);
  });
}
</script>
</body></html>
`;
}

// ---------- Command line ----------

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = await buildContent();
  for (const w of result.warnings) console.log(`warning  ${w}`);
  for (const e of result.errors) console.log(`ERROR    ${e}`);
  if (result.errors.length) {
    console.log(`\n${result.errors.length} error(s); nothing written.`);
    process.exit(1);
  }
  for (const [path, text] of Object.entries(generatedFiles(result))) {
    await mkdir(dirname(join(ROOT, path)), { recursive: true });
    await writeFile(join(ROOT, path), text, 'utf8');
  }
  await mkdir(join(ROOT, 'dist'), { recursive: true });
  await writeFile(join(ROOT, 'dist/content-overview.html'), overviewHtml(result), 'utf8');

  const count = (kind) => Object.keys(result.all[kind]).length;
  console.log(
    `\n${count('fish')} fish, ${count('items')} items, ${count('locations')} location(s), ${count('tables')} table(s); ` +
      `${Object.keys(result.strings).length} strings.`,
  );
  const art = Object.entries(result.missingArt).filter(([, n]) => n > 0);
  if (art.length) console.log(`No art yet: ${art.map(([kind, n]) => `${n} ${kind}`).join(', ')} (default icons used).`);
  console.log(`Written: ${GENERATED}, ${VALUES_SCHEMA}, dist/content-overview.html`);
}
