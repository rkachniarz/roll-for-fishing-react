// Checks everything in content/ and builds what the game loads (D43).
//
//   npm run content
//
// Reads content/<kind>/*.json, checks each file against its schema in schemas/
// and every reference between them, reads the events in content/events/*.md
// (tools/event-text.mjs), then writes:
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
import { PLACEHOLDERS, parseEvent } from './event-text.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Each folder in content/, the schema its files follow, and its string key prefix. */
const KINDS = {
  fish: { schema: 'fish', prefix: 'fish' },
  items: { schema: 'item', prefix: 'item' },
  locations: { schema: 'location', prefix: 'location' },
  tables: { schema: 'table', prefix: 'table' },
  weather: { schema: 'season', prefix: 'weather' },
  classes: { schema: 'class', prefix: 'class' },
  features: { schema: 'feature', prefix: 'feature' },
  perks: { schema: 'perk', prefix: 'perk' },
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
  classes: [['name', 'm'], ['name', 'f'], ['description']],
  features: [['name']],
  perks: [['name'], ['description']],
  rules: [
    ['bands', '@', 'name'],
    ['temperature', '#', 'word'],
    ['wind', '#'],
    ['clouds', '#'],
    ['precipitation', '#'],
    ['baits', '@', 'name'],
    ['weatherWords', '@', 'name'],
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

  // ---------- Events, written as text (D45, D84) ----------

  all.events = {};
  const eventsDir = join(root, 'content', 'events');
  if (existsSync(eventsDir)) {
    for (const file of (await readdir(eventsDir)).filter((f) => f.endsWith('.md')).sort()) {
      const where = `content/events/${file}`;
      const { event, errors: problems } = parseEvent(await readFile(join(eventsDir, file), 'utf8'));
      for (const p of problems) errors.push(`${where}: ${p}`);
      if (!event) continue;
      if (`${event.id}.md` !== file) errors.push(`${where}: id "${event.id}" doesn't match the file name`);
      all.events[event.id] = event;
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
    // A trade's rewards (7.9): items, and nothing else in it.
    if (table.kind === 'rewards') {
      if (!table.rewards?.length || table.entries) errors.push(`${where}: a rewards table has "rewards" and no "entries"`);
      for (const r of table.rewards ?? []) if (!all.items[r.id]) errors.push(`${where}: no item "${r.id}"`);
      continue;
    }
    if (!table.entries || table.rewards) errors.push(`${where}: a ${table.kind} table has "entries" and no "rewards"`);
    for (const e of table.entries ?? []) {
      if (e.table) errors.push(`${where}: a table can't include another table`);
      else if (table.kind === 'fish' ? !all.fish[e.id] : !all.items[e.id]) errors.push(`${where}: no ${table.kind} "${e.id}"`);
    }
  }

  for (const loc of Object.values(all.locations)) {
    const where = `content/locations/${loc.id}.json`;
    for (const list of /** @type {const} */ (['fish', 'treasure', 'junk'])) checkEntries(where, loc[list], list, loc.id);
    // Map fragments (8.2): enough of them to open it.
    const pieces = Object.values(all.items).filter((i) => i.fragmentOf === loc.id && !i.retired).length;
    if (loc.fragments && pieces < loc.fragments) errors.push(`${where}: needs ${loc.fragments} map fragments, but ${pieces} items are fragments of it`);
    if (loc.fragments && !loc.hidden) warnings.push(`${where}: has map fragments but isn't hidden`);
    for (const f of loc.features ?? []) {
      if (!all.features[f.id]) errors.push(`${where}: no surface feature "${f.id}"`);
      else note(f.id, loc.id);
    }
    const spotIds = new Set();
    for (const spot of loc.spots ?? []) {
      if (spotIds.has(spot.id)) errors.push(`${where}: two spots called "${spot.id}"`);
      spotIds.add(spot.id);
      for (const list of /** @type {const} */ (['fish', 'treasure', 'junk'])) {
        checkEntries(`${where} (${spot.id})`, spot[list], list, `${loc.id}/${spot.id}`);
      }
      // Rift fish only in rift tables, and only rift fish there (D104).
      checkEntries(`${where} (${spot.id}) rift`, spot.rift, 'fish', `${loc.id}/${spot.id} (rift)`);
      for (const e of spot.rift ?? []) {
        if (e.id && all.fish[e.id] && !all.fish[e.id].rift) errors.push(`${where} (${spot.id}): "${e.id}" in the rift table isn't a rift fish`);
      }
      for (const e of [...(loc.fish ?? []), ...(spot.fish ?? [])]) {
        if (e.id && all.fish[e.id]?.rift) errors.push(`${where} (${spot.id}): rift fish "${e.id}" only belongs in the rift table`);
      }
      // A spot's schools and big fish hold fish that live there (D102).
      const lives = new Set([...(loc.fish ?? []), ...(spot.fish ?? [])].map((/** @type {{ id: string }} */ e) => e.id));
      for (const f of spot.features ?? []) {
        const feature = all.features[f.id];
        if (!feature) errors.push(`${where} (${spot.id}): no surface feature "${f.id}"`);
        else {
          note(f.id, `${loc.id}/${spot.id}`);
          for (const e of feature.fish ?? []) {
            if (e.id && !lives.has(e.id)) errors.push(`${where} (${spot.id}): "${f.id}" holds ${e.id}, which doesn't live here`);
          }
        }
      }
    }
  }

  for (const feature of Object.values(all.features)) {
    const where = `content/features/${feature.id}.json`;
    checkEntries(where, feature.fish, 'fish', `${feature.id} (feature)`);
    checkEntries(where, feature.junk, 'junk', `${feature.id} (feature)`);
    if (feature.minBand && !all.rules['size-bands']?.bands.some((/** @type {{ id: string }} */ b) => b.id === feature.minBand)) {
      errors.push(`${where}: no size band "${feature.minBand}"`);
    }
    if (!foundAt.has(feature.id) && !feature.retired) warnings.push(`${where}: no location lists it`);
  }

  const start = all.rules['new-game'];
  if (start) {
    const where = 'content/rules/new-game.json';
    if (!all.locations[start.location]) errors.push(`${where}: no location "${start.location}"`);
    if (!all.weather[start.weather.season]) errors.push(`${where}: no season "${start.weather.season}"`);
    if (!all.locations[start.location]?.spots?.some((/** @type {{ id: string }} */ s) => s.id === start.spot)) {
      errors.push(`${where}: "${start.location}" has no spot "${start.spot}"`);
    }
    for (const [slot, id] of Object.entries(start.equipped)) {
      // trinket1 and trinket2 both take trinkets.
      if (all.items[id]?.slot !== slot.replace(/\d+$/, '')) errors.push(`${where}: "${id}" isn't an item for the ${slot} slot`);
      else note(id, 'a new game');
    }
  } else errors.push('content/rules/new-game.json: missing');

  // What fish prefer (D101): the vocabulary in rules/fish-preferences.json.
  const preferences = all.rules['fish-preferences'];
  if (!preferences) errors.push('content/rules/fish-preferences.json: missing');
  const baits = new Set((preferences?.baits ?? []).map((/** @type {{ id: string }} */ b) => b.id));
  const weatherWords = new Set((preferences?.weatherWords ?? []).map((/** @type {{ id: string }} */ w) => w.id));

  for (const fish of Object.values(all.fish)) {
    const where = `content/fish/${fish.id}.json`;
    if (fish.size.min >= fish.size.max) errors.push(`${where}: size.min must be below size.max`);
    if (!foundAt.has(fish.id) && !fish.retired) warnings.push(`${where}: no location lists it`);
    for (const id of fish.prefers?.weather ?? []) if (!weatherWords.has(id)) errors.push(`${where}: no weather word "${id}"`);
    for (const id of fish.prefers?.season ?? []) if (!all.weather[id]) errors.push(`${where}: no season "${id}"`);
    for (const id of fish.prefers?.bait ?? []) if (!baits.has(id)) errors.push(`${where}: no bait "${id}"`);
  }

  for (const item of Object.values(all.items)) {
    const where = `content/items/${item.id}.json`;
    const signs = (item.effects ?? []).map(effectSign);
    // R8.5: every upside has a downside. Bait's is being used up (D39, 5.3).
    if (signs.includes(1) && !signs.includes(-1) && item.slot !== 'bait') errors.push(`${where}: an upside with no downside (R8.5)`);
    if (!foundAt.has(item.id) && !item.retired && !item.devOnly) warnings.push(`${where}: no location lists it`);
    if (item.bobber && item.slot !== 'bobber') errors.push(`${where}: only a bobber has a bobber's looks`);
    if (item.bait && item.slot !== 'bait') errors.push(`${where}: only bait has a bait kind`);
    if (item.bait && !baits.has(item.bait)) errors.push(`${where}: no bait "${item.bait}"`);
  }

  checkPerks(all, errors, warnings);
  checkSeasons(all.weather, errors);
  checkEvents(all, errors, warnings);

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
      if (kind === 'events') eventText(copy, strings);
      else for (const path of TEXT[kind]) moveText(copy, path, `${KINDS[kind].prefix}.${id}`, strings);
      bundle[kind][id] = copy;
    }
  }

  const missingArt = Object.fromEntries(
    ['fish', 'items', 'locations'].map((kind) => [kind, Object.values(all[kind]).filter((e) => !e.icon).length]),
  );

  return { errors, warnings, all, bundle, strings, foundAt, missingArt };
}

/**
 * Perks (D96): a class perk has a level and a real class; a universal one has
 * neither. Each class has one perk at level 1 and a passive and an active at
 * each later class level, for the player to choose between.
 * @param {Record<string, Record<string, any>>} all
 * @param {string[]} errors
 * @param {string[]} warnings
 */
function checkPerks(all, errors, warnings) {
  /** @type {Record<string, Record<number, any[]>>} */
  const byClass = {};
  for (const perk of Object.values(all.perks)) {
    const where = `content/perks/${perk.id}.json`;
    if (perk.class === 'any') {
      if (perk.level !== undefined) errors.push(`${where}: a universal perk comes on the levels in rules/levels.json, not its own`);
    } else {
      if (!all.classes[perk.class]) errors.push(`${where}: no class "${perk.class}"`);
      if (perk.level === undefined) errors.push(`${where}: a class perk needs a level`);
      if (perk.repeatable) errors.push(`${where}: only a universal perk can be repeatable`);
      if (!perk.retired) ((byClass[perk.class] ??= {})[perk.level] ??= []).push(perk);
    }
    if (perk.kind === 'active' && !perk.cooldown) errors.push(`${where}: an active perk needs a cooldown`);
    if (perk.kind === 'passive' && perk.cooldown) errors.push(`${where}: a passive perk has no cooldown`);
    // An active perk's `effects` hold while it is taken, used or not (Bend Reality's doubled rift chance, D106);
    // what using it does is its ability's, in game.js.
  }
  const universal = new Set(all.rules.levels?.universal ?? []);
  for (const [classId, levels] of Object.entries(byClass)) {
    for (const [level, perks] of Object.entries(levels)) {
      const where = `content/perks (${classId}, level ${level})`;
      if (universal.has(Number(level))) errors.push(`${where}: level ${level} is a universal perk level`);
      const want = Number(level) === 1 ? 1 : 2;
      if (perks.length !== want) warnings.push(`${where}: ${perks.length} perks, expected ${want}`);
    }
  }
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
 * An event's references: classes, items, fish, seasons, slides that nothing
 * leads to, and what starts it (D84).
 * @param {Record<string, Record<string, any>>} all
 * @param {string[]} errors
 * @param {string[]} warnings
 */
function checkEvents(all, errors, warnings) {
  /** Event id -> what can start it. */
  /** @type {Map<string, string[]>} */
  const startedBy = new Map();
  const started = (/** @type {string} */ id, /** @type {string} */ by) => startedBy.set(id, [...(startedBy.get(id) ?? []), by]);

  for (const loc of Object.values(all.locations)) {
    const where = `content/locations/${loc.id}.json`;
    for (const list of [loc.events ?? [], ...(loc.spots ?? []).map((/** @type {any} */ s) => s.events ?? [])]) {
      for (const e of list) {
        const event = all.events[e.id];
        if (!event) errors.push(`${where}: no event "${e.id}"`);
        else if (event.trigger !== 'meter') errors.push(`${where}: event "${e.id}" has "trigger: ${event.trigger}", so the event meter never starts it`);
        else started(e.id, loc.id);
      }
    }
  }
  for (const item of Object.values(all.items)) {
    if (!item.event) continue;
    const event = all.events[item.event];
    const where = `content/items/${item.id}.json`;
    if (!event) errors.push(`${where}: no event "${item.event}"`);
    else if (event.trigger !== 'item') errors.push(`${where}: event "${item.event}" needs "trigger: item" to be started by an item`);
    else started(item.event, item.id);
  }

  /** @param {string} where @param {any} need */
  const checkNeed = (where, need) => {
    if (need.kind === 'class' && !all.classes[need.id]) errors.push(`${where}: no class "${need.id}"`);
    if (need.kind === 'season' && !all.weather[need.id]) errors.push(`${where}: no season "${need.id}"`);
    if (need.kind === 'location' && !all.locations[need.id]) errors.push(`${where}: no location "${need.id}"`);
    if (need.kind === 'spot' && !Object.values(all.locations).some((l) => (l.spots ?? []).some((/** @type {{ id: string }} */ s) => s.id === need.id))) {
      errors.push(`${where}: no location has a spot "${need.id}"`);
    }
    if (need.kind === 'item' && !all.items[need.id]) errors.push(`${where}: no item "${need.id}"`);
    if (need.kind === 'caught' && !all.fish[need.fish]) errors.push(`${where}: no fish "${need.fish}"`);
    if (need.kind === 'fish' && need.species && !all.fish[need.species]) errors.push(`${where}: no fish "${need.species}"`);
    if (need.kind === 'weather' && need.level !== 'temperature') {
      for (const v of [need.min, need.max]) if (v !== null && (v < 0 || v > 5)) errors.push(`${where}: ${need.level} goes from 0 to 5, not ${v}`);
    }
  };

  for (const event of Object.values(all.events)) {
    const where = `content/events/${event.id}.md`;
    for (const need of event.needs) checkNeed(where, need);
    if (event.trigger === 'needs' && event.needs.length === 0) errors.push(`${where}: "trigger: needs" with no needs would start at once`);
    if (event.trigger === 'needs' && !event.once) warnings.push(`${where}: "trigger: needs" with "once: false" starts again after every cast while its needs are met`);
    if ((event.trigger === 'meter' || event.trigger === 'item') && !startedBy.has(event.id)) warnings.push(`${where}: nothing starts it`);
    if (event.trigger === 'arrive' && !event.needs.some((/** @type {any} */ n) => n.kind === 'location' || n.kind === 'spot')) {
      warnings.push(`${where}: "trigger: arrive" with no "needs: location" or "needs: spot" starts on arriving anywhere`);
    }
    /** Placeholders and the needs of conditional text. @param {string} at @param {any[]} parts */
    const checkText = (at, parts) => {
      for (const part of parts) {
        const strings = typeof part === 'string' ? [part] : [part.text, part.otherwise ?? ''];
        if (typeof part !== 'string') for (const need of part.needs) checkNeed(at, need);
        for (const s of strings) {
          for (const m of s.matchAll(/\{(\w+)\}/g)) {
            if (!(m[1] in PLACEHOLDERS)) errors.push(`${at}: no placeholder {${m[1]}} (known: ${Object.keys(PLACEHOLDERS).join(', ')})`);
          }
        }
      }
    };
    checkText(`${where} (title)`, event.title);
    const reached = new Set([event.first]);
    for (const [id, slide] of Object.entries(event.slides)) {
      const s = /** @type {any} */ (slide);
      checkText(`${where} (${id})`, s.text);
      for (const choice of s.choices) {
        checkText(`${where} (${id})`, choice.text);
        reached.add(choice.to);
        for (const need of choice.needs) checkNeed(`${where} (${id})`, need);
        for (const effect of choice.effects) {
          if (effect.kind === 'item' && !all.items[effect.id]) errors.push(`${where} (${id}): no item "${effect.id}"`);
          if (effect.kind === 'fish' && effect.species && !all.fish[effect.species]) errors.push(`${where} (${id}): no fish "${effect.species}"`);
          if (effect.kind === 'go') {
            const loc = all.locations[effect.location];
            if (!loc) errors.push(`${where} (${id}): no location "${effect.location}"`);
            else if (effect.spot && !(loc.spots ?? []).some((/** @type {{ id: string }} */ s) => s.id === effect.spot)) {
              errors.push(`${where} (${id}): ${effect.location} has no spot "${effect.spot}"`);
            }
          }
          if (effect.kind === 'trade' && all.tables[effect.table]?.kind !== 'rewards') errors.push(`${where} (${id}): no rewards table "${effect.table}"`);
          if (effect.kind === 'place' && !all.locations[effect.location]) errors.push(`${where} (${id}): no location "${effect.location}"`);
          if (effect.kind === 'learn') {
            const loc = all.locations[effect.location];
            const there = !loc
              ? false
              : effect.what === 'spot'
                ? (loc.spots ?? []).some((/** @type {{ id: string }} */ s) => s.id === effect.id)
                : effect.what === 'fish'
                  ? Boolean(all.fish[effect.id])
                  : Boolean(all.items[effect.id]);
            if (!there) errors.push(`${where} (${id}): nothing to learn: ${effect.what} "${effect.id}" at "${effect.location}"`);
          }
        }
      }
      if (!s.choices.some((/** @type {any} */ c) => c.needs.length === 0)) {
        warnings.push(`${where} (${id}): every choice has a requirement, so a player could be stuck`);
      }
    }
    for (const id of Object.keys(event.slides)) if (!reached.has(id)) warnings.push(`${where}: nothing leads to slide "${id}"`);
  }
}

/**
 * An event's text into the string table: event.frog.title,
 * event.frog.start.text, event.frog.start.0 (the first choice). Text in
 * several parts (D88) gets a key per part, `.text.1`, and a conditional
 * part's otherwise `.text.1.else`.
 * @param {any} event  A copy, changed in place.
 * @param {Record<string, string>} strings
 */
export function eventText(event, strings) {
  const key = `event.${event.id}`;
  /** @param {any[]} parts @param {string} base */
  const move = (parts, base) => {
    if (parts.length === 1 && typeof parts[0] === 'string') {
      strings[base] = parts[0];
      return [base];
    }
    return parts.map((part, n) => {
      if (typeof part === 'string') {
        strings[`${base}.${n}`] = part;
        return `${base}.${n}`;
      }
      strings[`${base}.${n}`] = part.text;
      const out = { needs: part.needs, text: `${base}.${n}` };
      if (part.otherwise === undefined) return out;
      strings[`${base}.${n}.else`] = part.otherwise;
      return { ...out, otherwise: `${base}.${n}.else` };
    });
  };
  event.title = move(event.title, `${key}.title`);
  for (const [id, slide] of Object.entries(event.slides)) {
    const s = /** @type {any} */ (slide);
    s.text = move(s.text, `${key}.${id}.text`);
    s.choices.forEach((/** @type {any} */ c, /** @type {number} */ n) => {
      c.text = move(c.text, `${key}.${id}.${n}`);
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
  const prefers = (f) => Object.values(f.prefers ?? {}).map((words) => words.join('/')).join(', ');
  const fish = Object.values(all.fish).map((f) => [
    f.id, f.name, f.rarity, f.size.min, f.size.max, f.difficulty, prefers(f), where(f.id), f.icon ?? '',
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
${table('Fish', ['id', 'name', 'rarity', 'min cm', 'max cm', 'difficulty', 'prefers', 'found at', 'icon'], fish)}
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
    `\n${count('fish')} fish, ${count('items')} items, ${count('locations')} location(s), ${count('tables')} table(s), ${count('events')} event(s); ` +
      `${Object.keys(result.strings).length} strings.`,
  );
  const art = Object.entries(result.missingArt).filter(([, n]) => n > 0);
  if (art.length) console.log(`No art yet: ${art.map(([kind, n]) => `${n} ${kind}`).join(', ')} (default icons used).`);
  console.log(`Written: ${GENERATED}, ${VALUES_SCHEMA}, dist/content-overview.html`);
}
