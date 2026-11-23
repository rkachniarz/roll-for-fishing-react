// The owner's name lists into content/ (8.13, D187, D188).
//
//   npm run names
//
// Reads the one-column CSVs in docs/names/ (local only, gitignored), named
// <people>_male_names.csv, <people>_female_names.csv and <people>_surnames.csv,
// each with a header row (`name` or `surname`), and writes one file per people,
// content/names/<people>.json, then runs `npm run content` to check it and
// rebuild what the game loads. The CSVs stay where they are; run it again
// whenever they change. The names are meant to be published (D188), so the
// JSON is tracked: the tests and GitHub never need the CSVs.
//
// Order is kept as the lists have it, since a person's roll picks by place in
// the list: a name added at the end leaves everyone else's name alone, and one
// added in the middle renames the strangers after it.

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PEOPLES } from '../src/engine/looks.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'docs', 'names');

/** Each list in a people's file and the CSV it comes from. */
const LISTS = { male: 'male_names', female: 'female_names', surnames: 'surnames' };

/**
 * The names in one CSV: one per line, the header and blank lines dropped, quotes and spaces trimmed, a repeat
 * kept once (reported).
 * @param {string} text
 * @param {string} where  For the report.
 * @returns {{ names: string[], notes: string[] }}
 */
export function readNames(text, where) {
  /** @type {string[]} */
  const names = [];
  /** @type {string[]} */
  const notes = [];
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  lines.forEach((line, i) => {
    const name = line.split(',')[0].trim().replace(/^"(.*)"$/, '$1').trim();
    if (!name || (i === 0 && /^(sur)?names?$/i.test(name))) return;
    if (names.includes(name)) notes.push(`${where}: "${name}" twice, kept once`);
    else names.push(name);
  });
  return { names, notes };
}

/**
 * A people's file from their three lists.
 * @param {string} people
 * @param {Record<string, string[]>} lists
 */
export function namesFile(people, lists) {
  return { $schema: '../../schemas/name-list.schema.json', id: people, male: lists.male, female: lists.female, surnames: lists.surnames };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!existsSync(SOURCE)) {
    console.log('No docs/names/ here: the lists are local only. content/names/ stays as it is.');
    process.exit(1);
  }
  const present = new Set(await readdir(SOURCE));
  let problems = 0;
  for (const people of PEOPLES) {
    /** @type {Record<string, string[]>} */
    const lists = {};
    for (const [list, file] of Object.entries(LISTS)) {
      const name = `${people}_${file}.csv`;
      if (!present.has(name)) {
        console.log(`MISSING  docs/names/${name}`);
        problems++;
        continue;
      }
      const { names, notes } = readNames(await readFile(join(SOURCE, name), 'utf8'), `docs/names/${name}`);
      for (const n of notes) console.log(`note     ${n}`);
      lists[list] = names;
    }
    if (Object.keys(lists).length < 3) continue;
    await mkdir(join(ROOT, 'content', 'names'), { recursive: true });
    await writeFile(join(ROOT, 'content', 'names', `${people}.json`), `${JSON.stringify(namesFile(people, lists), null, 2)}\n`, 'utf8');
    console.log(`${people}: ${lists.male.length} male, ${lists.female.length} female, ${lists.surnames.length} surnames -> content/names/${people}.json`);
  }
  const others = [...present].filter((f) => f.endsWith('.csv') && !PEOPLES.some((p) => Object.values(LISTS).some((l) => f === `${p}_${l}.csv`)));
  for (const f of others) console.log(`skipped  docs/names/${f} (not <people>_male_names, _female_names or _surnames for ${PEOPLES.join(', ')})`);
  if (problems) process.exit(1);
  // Check them and rebuild the game's copy.
  const run = spawnSync(process.execPath, [join(ROOT, 'tools', 'content.mjs')], { stdio: 'inherit' });
  process.exit(run.status ?? 1);
}
