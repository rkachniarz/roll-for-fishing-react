// The docs are the only source of truth besides the code (D182). These checks
// keep their pointers honest, so Claude can (1) tell there is knowledge to be
// found and (2) find it: every decision, requirement and creative task cited
// exists, the docs that describe the present name files that exist, nothing
// keeps its reasons on REVIEW.md, a decision that changes an earlier one is
// named on the earlier one too, every doc says what it is for, and README.md's
// file map names every source file (D186).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';

const git = (/** @type {string[]} */ ...args) => execFileSync('git', args, { encoding: 'utf8' });
const read = (/** @type {string} */ f) => readFileSync(f, 'utf8');

/** Every tracked or new text file Claude writes or reads for meaning (`-z`: names with non-ASCII letters unquoted). */
const FILES = git('ls-files', '-z', '-co', '--exclude-standard')
  .split('\0')
  .filter((f) => /\.(md|js|mjs|py|json|css|html)$/.test(f))
  .filter((f) => !f.startsWith('src/generated/') && f !== 'package-lock.json' && existsSync(f));
const DOCS = FILES.filter((f) => f.endsWith('.md') && !f.startsWith('content/'));

/** The records of the past: they may name files and paths that have since gone. */
const RECORDS = new Set(['docs/decisions.md', 'docs/history.md', 'docs/PORTING-NOTES.md', 'docs/brainstorm-2026-11-14.md', 'docs/town-questions.md', 'OLD-CONCEPT.md']);

/** The owner's own documents, kept as they wrote them. */
const OWNERS = new Set(['OLD-CONCEPT.md']);

/** Docs that are instructions for an agent rather than part of the project's documentation. */
const AGENTS = (/** @type {string} */ f) => f.startsWith('.claude/');

const decisions = read('docs/decisions.md');
/** @type {Map<number, string>} */
const ROWS = new Map([...decisions.matchAll(/^\| D(\d+) \|[^|]*\|(.*)\|\s*$/gm)].map((m) => [Number(m[1]), m[2]]));
const spec = read('docs/spec.md');
const REQS = new Set([...spec.matchAll(/\*\*R(\d+(?:\.\d+)?)\*\*|^#+ R(\d+)\b/gm)].map((m) => m[1] ?? m[2]));
const plans = read('DEV_PLAN.md') + read('docs/history.md');
/** Creative tasks: on the plan or in the history, or dropped by a decision. */
const CREATIVE = new Set([
  ...[...plans.matchAll(/\*\*CR-(\d+)\*\*/g)].map((m) => Number(m[1])),
  // Every CR-n in a "drops …" clause, up to the end of the clause ("drops CR-3 and CR-4").
  ...[...decisions.matchAll(/drops([^|;)]*)/g)].flatMap((m) => [...m[1].matchAll(/CR-(\d+)/g)].map((c) => Number(c[1]))),
]);

/** @param {(line: string, at: string, file: string) => string[]} check */
function sweep(files, check) {
  /** @type {string[]} */
  const bad = [];
  for (const f of files) read(f).split('\n').forEach((line, i) => bad.push(...check(line, `${f}:${i + 1}`, f)));
  return bad;
}

test('every decision, requirement and creative task cited exists', () => {
  const bad = sweep(FILES, (line, at) => [
    ...[...line.matchAll(/(?<![\w-])D(\d{1,3})(?!\w)/g)].filter((m) => !ROWS.has(Number(m[1]))).map((m) => `${at}: D${m[1]}`),
    ...[...line.matchAll(/(?<![\w-])R(\d{1,2})(\.\d+)?(?!\w)/g)]
      .filter((m) => !REQS.has(m[1] + (m[2] ?? '')) && !REQS.has(m[1]))
      .map((m) => `${at}: R${m[1]}${m[2] ?? ''}`),
    ...[...line.matchAll(/\bCR-(\d+)/g)].filter((m) => !CREATIVE.has(Number(m[1]))).map((m) => `${at}: CR-${m[1]}`),
  ]);
  assert.deepEqual(bad, [], 'cited but not in docs/decisions.md, docs/spec.md or the plan');
});

test('the docs that describe the present name files that exist', () => {
  const PATH = /(?:^|[\s`(\[])((?:src|docs|content|tools|test|schemas|assets|art)\/[A-Za-z0-9_./-]*[A-Za-z0-9_])([-.]?[<*{]?)/g;
  /** @type {{ at: string, path: string }[]} */
  const named = [];
  sweep(DOCS.filter((f) => !RECORDS.has(f)), (line, at) => {
    for (const m of line.matchAll(PATH)) {
      if (/[<*{]/.test(m[2])) continue; // a pattern such as icon-fish-<id> or *.png
      named.push({ at, path: m[1].replace(/\.+$/, '') });
    }
    return [];
  });
  const missing = named.filter((n) => !existsSync(n.path));
  // Local-only files (the owner's photos, exports) are gitignored on purpose.
  // check-ignore exits 1 when none of the paths is ignored: that's an answer, not a failure.
  // Each path is asked about with a trailing slash too: on a clean checkout an ignored folder
  // (docs/names/) isn't there, so git can't tell it's a folder and `docs/names` misses the pattern.
  const asked = missing.flatMap((n) => [n.path, `${n.path}/`]);
  const check = missing.length ? spawnSync('git', ['check-ignore', '--no-index', '--stdin'], { input: asked.join('\n'), encoding: 'utf8' }) : null;
  if (check && check.status !== 0 && check.status !== 1) throw new Error(`git check-ignore failed: ${check.stderr || check.error}`);
  const ignored = new Set(check ? check.stdout.split(/\r?\n/).map((p) => p.replace(/\/$/, '')) : []);
  const bad = missing.filter((n) => !ignored.has(n.path)).map((n) => `${n.at}: ${n.path}`);
  assert.deepEqual(bad, [], 'named in a doc but not in the repo');
});

test('no code or content keeps its reasons on docs/REVIEW.md (D182)', () => {
  const bad = sweep(
    FILES.filter((f) => !f.endsWith('.md') && f !== 'test/docs.test.js'),
    (line, at) => (/REVIEW\.md/.test(line) ? [at] : []),
  );
  assert.deepEqual(bad, [], 'REVIEW.md empties as items settle: put the reason beside the number or in docs/sources.md');
});

test('a decision that changes an earlier one is named on the earlier one too', () => {
  const bad = [];
  for (const [n, text] of ROWS) {
    for (const v of text.matchAll(/\b(refines|replaces|supersedes|settles)\b([^.;)]*)/gi)) {
      for (const d of v[2].matchAll(/\bD(\d+)\b/g)) {
        const old = Number(d[1]);
        if (old < n && !new RegExp(`\\bD${n}\\b`).test(ROWS.get(old) ?? '')) bad.push(`D${n} ${v[1]} D${old}, but D${old} doesn't name D${n}`);
      }
    }
  }
  assert.deepEqual(bad, [], 'end the earlier row with *Later refined by Dn* (or partly replaced, settled)');
});

test('every doc says what it is for and what is not here, and CLAUDE.md names it', () => {
  const claude = read('CLAUDE.md');
  // Named as a whole path: `README.md` isn't named by `art/README.md`, nor `docs/ideas.md` by `docs/ideas.md.bak`.
  const names = (/** @type {string} */ f) => new RegExp(`(?<![\\w./-])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w/-]|\\.\\w)`).test(claude);
  const bad = [];
  for (const f of DOCS.filter((f) => !AGENTS(f))) {
    if (!OWNERS.has(f) && !read(f).split('\n').slice(0, 20).some((l) => l.startsWith('**Not here:**'))) bad.push(`${f}: no **Not here:** line near the top`);
    if (f !== 'CLAUDE.md' && !names(f)) bad.push(`${f}: not named in CLAUDE.md`);
  }
  assert.deepEqual(bad, [], 'a doc nobody knows of is knowledge nobody finds');
});

test('every source file belongs to an area, and docs/areas.md is up to date (D184)', async () => {
  const { AREAS, MUST_BELONG, repoFiles, filesOf, areasMarkdown } = await import('../tools/areas.mjs');
  const files = repoFiles({ untracked: true });
  const placed = new Set(AREAS.flatMap((a) => filesOf(a, files)));
  assert.deepEqual(files.filter((f) => MUST_BELONG(f) && !placed.has(f)), [], 'add it to an area in tools/areas.mjs');
  // The index is built from tracked files only, so a loose file can't change it; a new file in an area is
  // named here, or it would be left out until committed and the clean checkout on GitHub would fail.
  const tracked = new Set(repoFiles());
  const loose = files.filter((f) => !tracked.has(f) && (placed.has(f) || /^test\/.+\.test\.js$/.test(f)));
  assert.deepEqual(loose, [], 'git add it (then npm run areas), or delete it if it is a loose file');
  assert.ok(read('docs/areas.md') === areasMarkdown(), 'docs/areas.md is behind: run npm run areas');
});

test("README.md's file map names every source file and page (D186)", async () => {
  const { repoFiles } = await import('../tools/areas.mjs');
  const readme = read('README.md');
  const files = repoFiles({ untracked: true }).filter((f) => (/^(src|tools)\//.test(f) && !f.startsWith('src/generated/')) || ['index.html', 'art.html', 'editor.html', 'styles.css'].includes(f));
  const base = (/** @type {string} */ f) => f.split('/').pop() ?? f;
  /** @type {Map<string, number>} */
  const seen = new Map();
  for (const f of files) seen.set(base(f), (seen.get(base(f)) ?? 0) + 1);
  // Named by its path, or in passing by its file name when no other file shares it.
  const named = (/** @type {string} */ f) => readme.includes('`' + f + '`') || (seen.get(base(f)) === 1 && readme.includes('`' + base(f) + '`'));
  assert.deepEqual(files.filter((f) => !named(f)), [], 'add a row for it to the Files table in README.md');
});
