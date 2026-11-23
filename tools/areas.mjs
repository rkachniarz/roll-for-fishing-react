// The area index (D184): docs/areas.md, generated. The areas and their files are
// kept by hand below; everything else is read from the repo: the decisions and
// requirements each area's files cite (or that name them), the tests that import
// them, the sections of docs/sources.md, docs/art.md and docs/events.md about
// them, and the `Trap:` lines in its files' header comments. A test fails if a source file
// is in no area, or if docs/areas.md is behind (`npm run areas` rewrites it).
//
// Usage: node tools/areas.mjs [--check]

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * @typedef {{ name: string, about: string, files: string[] }} Area
 * `files`: paths, or folders ending in `/` (everything tracked under them).
 */

/** @type {Area[]} */
export const AREAS = [
  {
    name: 'Randomness, dice and saves',
    about: 'The seeded streams, the named dice, the game state and its save, migrations, settings.',
    files: ['src/rng.js', 'src/dice.js', 'src/engine/state.js', 'src/save.js', 'src/settings.js', 'src/engine/values.js', 'src/engine/schedule.js', 'content/rules/new-game.json', 'schemas/new-game.schema.json', 'schemas/common.schema.json', 'schemas/game-values.schema.json'],
  },
  {
    name: 'The cast, the bite and the catch',
    about: 'Casting, the line rolled when it goes out, striking, the fight, what comes up and how big.',
    files: ['src/engine/game.js', 'src/engine/cast.js', 'src/engine/tables.js', 'src/engine/fish.js', 'src/engine/features.js', 'content/fish/', 'content/features/', 'content/tables/', 'content/rules/size-bands.json', 'content/rules/weight.json', 'content/rules/fight-styles.json', 'content/rules/fish-preferences.json', 'content/rules/depth.json', 'schemas/fish.schema.json', 'schemas/feature.schema.json', 'schemas/table.schema.json', 'schemas/size-bands.schema.json', 'schemas/weight.schema.json', 'schemas/fight-styles.schema.json', 'schemas/fish-preferences.schema.json', 'schemas/depth.schema.json'],
  },
  {
    name: 'Life under the surface',
    about: "A spot's pool of fish, its turns with the time, spawning, predators, shoals, class fish, the dive and the tank, and fish drawn swimming.",
    files: ['src/engine/pool.js', 'src/engine/spawning.js', 'src/engine/champions.js', 'src/engine/dive.js', 'src/scene/swim.js', 'src/scene/fish-art.js', 'src/scene/fish-shapes.js', 'src/scene/deep.js', 'src/scene/views.js', 'content/rules/pool.json', 'content/rules/spawning.json', 'content/rules/tank.json', 'content/rules/plants.json', 'content/rules/champions.json', 'content/rules/conservation.json', 'schemas/pool.schema.json', 'schemas/spawning.schema.json', 'schemas/tank.schema.json', 'schemas/plants.schema.json', 'schemas/champions.schema.json', 'schemas/conservation.schema.json'],
  },
  {
    name: 'Time, weather and the water',
    about: 'The clock and the seasons, the weather hexflower, the wind, the water temperature, the cold, the sun and the moon as the engine knows them.',
    files: ['src/engine/time.js', 'src/engine/weather.js', 'src/engine/hexmap.js', 'src/engine/passage.js', 'src/engine/conditions.js', 'src/engine/sky.js', 'src/engine/moon.js', 'src/engine/wind.js', 'content/weather/', 'content/rules/weather-scales.json', 'content/rules/cold.json', 'content/rules/moon.json', 'content/rules/wind.json', 'schemas/season.schema.json', 'schemas/weather-scales.schema.json', 'schemas/cold.schema.json', 'schemas/moon.schema.json', 'schemas/wind.schema.json'],
  },
  {
    name: 'The sky, the light and the waves on screen',
    about: 'The sky layer, the sun and moon drawn, the clouds, the light of the hour, the wind on clouds and water.',
    files: ['src/scene/sky.js', 'src/scene/sky-layer.js', 'src/scene/clouds.js', 'src/scene/light.js', 'src/scene/waves.js', 'src/scene/wind.js', 'content/rules/sky.json', 'schemas/sky.schema.json'],
  },
  {
    name: 'The scene and its paintings',
    about: 'The PixiJS scene, its sizing, the painted spots, sprites and icons, the title, and the tools that turn photos and drawings into art.',
    files: ['src/scene/scene.js', 'src/scene/sprites.js', 'src/scene/rings.js', 'src/scene/pond.js', 'src/scene/reedy.js', 'src/scene/swamp.js', 'src/scene/swamp-pixels.js', 'src/scene/swamp-roots.js', 'src/scene/swamp-under.js', 'src/scene/icons.js', 'src/scene/logo.js', 'src/scene/d20.js', 'src/scene/dice.js', 'src/art.js', 'src/art-trials.js', 'art.html', 'tools/sprite-png.mjs', 'tools/photo-icon.mjs', 'tools/cutout.py', 'tools/commons.py', 'tools/py.mjs', 'tools/python-requirements.txt'],
  },
  {
    name: 'The character, perks and items',
    about: 'Classes, levels, perks and abilities, buffs, equipment and bags, vendors and barter, the stew, what the player knows.',
    files: ['src/engine/character.js', 'src/engine/perks.js', 'src/engine/abilities.js', 'src/engine/buffs.js', 'src/engine/equipment.js', 'src/engine/barter.js', 'src/engine/knowledge.js', 'content/classes/', 'content/perks/', 'content/buffs/', 'content/items/', 'content/sets/', 'content/vendors/', 'content/rules/levels.json', 'content/rules/stew.json', 'content/rules/names.json', 'schemas/class.schema.json', 'schemas/perk.schema.json', 'schemas/buff.schema.json', 'schemas/item.schema.json', 'schemas/set.schema.json', 'schemas/vendor.schema.json', 'schemas/levels.schema.json', 'schemas/stew.schema.json', 'schemas/names.schema.json'],
  },
  {
    name: 'Places, events and the town',
    about: 'Locations and spots, the map, events and their words, the town and its people.',
    files: ['src/engine/events.js', 'tools/event-text.mjs', 'src/ui/event-words.js', 'src/ui/map.js', 'tools/map.py', 'content/events/', 'content/locations/', 'schemas/location.schema.json'],
  },
  {
    name: 'People: faces and names',
    about: "How people look and what they are called: the parts and colours of a face, portraits drawn from them, the peoples' names, the named townsfolk, strangers, the player's look.",
    files: ['src/engine/looks.js', 'src/engine/people.js', 'src/scene/faces.js', 'tools/names.mjs', 'content/names/', 'content/people/', 'schemas/name-list.schema.json', 'schemas/person.schema.json'],
  },
  {
    name: 'The page: layout, UI and text',
    about: 'The page around the scene: layout and themes, panes, tooltips, the log, the bars, drag and drop, strings, sound, the dev bench.',
    files: ['src/main.js', 'index.html', 'styles.css', 'src/strings.js', 'src/audio.js', 'src/dev.js', 'src/ui/', 'tools/planks.py', 'tools/obsidian.py'],
  },
  {
    name: 'Tools, checks and publishing',
    about: 'The content build and editor, the browser checks, the balance sim, the single-file build, the prompt count, the docs and their checks.',
    files: ['tools/content.mjs', 'tools/editor/', 'editor.html', 'tools/verify.mjs', 'tools/sim.mjs', 'tools/build-artifact.mjs', 'tools/prompts.mjs', 'tools/areas.mjs'],
  },
];

/** The kinds of file that must belong to an area. */
export const MUST_BELONG = (/** @type {string} */ f) =>
  /^(src|tools)\//.test(f) && !f.startsWith('src/generated/') || /^(content\/[a-z]+\/|schemas\/)/.test(f) || ['index.html', 'art.html', 'editor.html', 'styles.css'].includes(f);

const read = (/** @type {string} */ f) => readFileSync(f, 'utf8');

/**
 * The repo's files, sorted. The index is built from the tracked files only (and
 * those staged to be), so a loose file in the working tree can't change it and
 * the clean checkout on GitHub sees the same index; `{ untracked: true }` adds
 * the new files that aren't ignored, for the checks that must see a file before
 * it is committed. `-z`, so a name with non-ASCII letters isn't quoted by git.
 */
export function repoFiles({ untracked = false } = {}) {
  return execFileSync('git', ['ls-files', '-z', ...(untracked ? ['-co', '--exclude-standard'] : [])], { encoding: 'utf8' })
    .split('\0')
    .filter((f) => f && existsSync(f))
    .sort();
}

/** @param {Area} area @param {string[]} files */
export const filesOf = (area, files) => files.filter((f) => area.files.some((p) => (p.endsWith('/') ? f.startsWith(p) : f === p)));

/** The decision log, row by row: its title, and whether it was later changed. */
function decisionRows() {
  /** @type {Map<number, { title: string, text: string, later: string }>} */
  const rows = new Map();
  for (const m of read('docs/decisions.md').matchAll(/^\| D(\d+) \|[^|]*\|(.*)\|\s*$/gm)) {
    const text = m[2];
    const title = (text.match(/\*\*(.+?)\*\*/)?.[1] ?? '').replace(/\.$/, '');
    const taken = text.match(/taken back by (D\d+)/i);
    const later = taken ? `taken back by ${taken[1]}` : (text.match(/\*Later ([^*]+?)\.?\*/)?.[1] ?? '');
    rows.set(Number(m[1]), { title, text, later });
  }
  return rows;
}

/** Sections (## or ###) of a doc, with the decisions their headings cite. */
function sectionsOf(/** @type {string} */ doc) {
  return read(doc)
    .split('\n')
    .filter((l) => /^#{2,3} /.test(l))
    .map((l) => ({ doc, heading: l.replace(/^#+ /, ''), cites: [...l.matchAll(/\bD(\d+)/g)].map((m) => Number(m[1])) }));
}

/** The kinds of file whose comments are read for `Trap:` lines. */
export const HAS_TRAPS = (/** @type {string} */ f) => /\.(js|mjs|css|html|py)$/.test(f);

/**
 * A file's traps: each `Trap:` line in its comments, with the lines that carry
 * it on (one space after the comment mark); deeper-indented lines are its detail.
 * Inside a block comment (`/* … *\/`, `<!-- … -->`) a line with no mark carries
 * it on too, up to a blank line or the comment's end. `#` marks a comment only in
 * Python, since in JavaScript it starts a private field.
 */
export function trapsOf(/** @type {string} */ file) {
  const lines = read(file).split(/\r?\n/);
  const mark = file.endsWith('.py') ? /^\s*(?:#|\/\/|\*|<!--|\/\*)/ : /^\s*(?:\/\/|\*|<!--|\/\*)/;
  const strip = (/** @type {string} */ l) => l.replace(mark, '').replace(/\s*(?:-->|\*\/)\s*$/, '');
  const closes = (/** @type {string} */ l) => /(?:-->|\*\/)/.test(l);
  /** Whether a line leaves a block comment open: it opens one after its last close. */
  const opens = (/** @type {string} */ l) => Math.max(l.lastIndexOf('<!--'), l.lastIndexOf('/*')) > Math.max(l.lastIndexOf('-->'), l.lastIndexOf('*/'));
  const carry = file.endsWith('.py') ? /^\s*#/ : /^\s*(?:\/\/|\*)/;
  /** @type {string[]} */
  const found = [];
  lines.forEach((line, i) => {
    const m = strip(line).match(/^ Trap: (.*)$/);
    if (!m) return;
    let lead = m[1];
    // In a block if this line opens one, or is a ` * ` line of one already open.
    let block = opens(line) || (/^\s*\*(?!\/)/.test(line) && !closes(line));
    for (let j = i + 1; j < lines.length; j++) {
      const raw = lines[j];
      let rest;
      if (carry.test(raw)) rest = strip(raw);
      else if (block && raw.trim() && !/^\s*(?:-->|\*\/)/.test(raw)) rest = ' ' + strip(raw).trim();
      else break;
      if (!/^ \S/.test(rest) || /^ Trap:/.test(rest)) break;
      lead += rest;
      if (closes(raw)) break;
    }
    found.push(lead.trim());
  });
  return found;
}

/** What a test file imports (`from '../…'` or `import('../…')`, either quote), as repo paths. */
function importsOf(/** @type {string} */ test) {
  return [...read(test).matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)(['"])\.\.\/(.+?)\1/g)].map((m) => m[2]);
}

export function areasMarkdown() {
  const files = repoFiles();
  const rows = decisionRows();
  const sections = ['docs/sources.md', 'docs/art.md', 'docs/events.md'].flatMap(sectionsOf);
  const tests = files.filter((f) => /^test\/.+\.test\.js$/.test(f));
  const basenames = new Map();
  for (const f of files) basenames.set(f.split('/').pop(), (basenames.get(f.split('/').pop()) ?? 0) + 1);

  const out = [
    '# Where to look: the areas',
    '',
    'Generated by `npm run areas` (`tools/areas.mjs`, D184); never edit by hand. Each area of the game with its files, the',
    'decisions and requirements behind it, its tests, and where else to read. Start here before changing something',
    'next to what exists: the decisions listed are every one its files cite or that names them, oldest first.',
    '',
    '**Not here:** the reasons themselves (`docs/decisions.md`), sources (`docs/sources.md`), plans (`DEV_PLAN.md`).',
    'Which files make an area is kept in `tools/areas.mjs`; a test fails if a file is in none.',
    '',
  ];
  for (const area of AREAS) {
    const own = filesOf(area, files);
    const named = new Set();
    for (const f of own) {
      if (f.endsWith('.png') || f.endsWith('.txt')) continue;
      for (const m of read(f).matchAll(/(?<![\w-])D(\d{1,3})(?!\w)/g)) named.add(Number(m[1]));
    }
    // Decisions that name one of the area's files (by path, or by a name no other file has).
    for (const [n, row] of rows) {
      if (own.some((f) => row.text.includes(f) || (basenames.get(f.split('/').pop()) === 1 && !f.startsWith('content/') && row.text.includes('`' + f.split('/').pop() + '`')))) named.add(n);
    }
    const reqs = new Set();
    for (const f of own) {
      if (f.endsWith('.png') || f.endsWith('.txt')) continue;
      for (const m of read(f).matchAll(/(?<![\w-])R(\d{1,2}(?:\.\d+)?)(?!\w)/g)) reqs.add(m[1]);
    }
    const ownTests = tests.filter((t) => importsOf(t).some((i) => own.includes(i)));
    const reading = sections.filter((s) => s.cites.some((d) => named.has(d)));
    const ownTraps = own.filter(HAS_TRAPS).flatMap((f) => trapsOf(f).map((lead) => ({ f, lead })));

    const folders = area.files.filter((p) => p.endsWith('/'));
    const single = own.filter((f) => !folders.some((p) => f.startsWith(p)));
    out.push(`## ${area.name}`, '', area.about, '');
    out.push(`**Files:** ${[...folders.map((p) => `\`${p}\``), ...single.map((f) => `\`${f}\``)].join(', ')}.`, '');
    if (ownTests.length) out.push(`**Tests:** ${ownTests.map((t) => `\`${t}\``).join(', ')}.`, '');
    if (reqs.size) out.push(`**Requirements** (\`docs/spec.md\`): ${[...reqs].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).map((r) => 'R' + r).join(', ')}.`, '');
    if (reading.length) {
      out.push('**Read also:**', '');
      for (const s of reading) out.push(`- \`${s.doc}\`: ${s.heading}`);
      out.push('');
    }
    if (ownTraps.length) {
      out.push("**Traps** (each file's `Trap:` lines; the file has the detail):", '');
      for (const t of ownTraps) out.push(`- \`${t.f}\`: ${t.lead}`);
      out.push('');
    }
    out.push('**Decisions:**', '');
    for (const n of [...named].sort((a, b) => a - b)) {
      const row = rows.get(n);
      if (!row) continue;
      out.push(`- D${n} ${row.title}${row.later ? ` _(${row.later})_` : ''}`);
    }
    out.push('');
  }
  return out.join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const md = areasMarkdown();
  if (process.argv.includes('--check')) {
    const same = existsSync('docs/areas.md') && read('docs/areas.md') === md;
    console.log(same ? 'docs/areas.md is up to date.' : 'docs/areas.md is behind: run npm run areas.');
    process.exit(same ? 0 : 1);
  }
  writeFileSync('docs/areas.md', md);
  const lines = md.split('\n').length;
  console.log(`Written: docs/areas.md (${AREAS.length} areas, ${lines} lines).`);
}
