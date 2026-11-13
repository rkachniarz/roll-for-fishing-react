// How many prompts the owner has given Claude Code on this project, per
// session, kept in docs/prompts.json. Claude Code deletes old transcripts
// after a while (30 days by default), so each run adds what's on this
// machine now to what was recorded before, and never drops a session.
//
//   npm run prompts
//
// Counts only what the owner typed: not slash commands, tool results,
// interruptions or the summaries that continue a session. Stores counts and
// dates only, never the prompts themselves.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const LOG = 'docs/prompts.json';
/** Claude Code's folder for this project: the path with every : \ / as a dash. */
const transcripts = join(homedir(), '.claude', 'projects', process.cwd().replace(/[:\\/]/g, '-'));

/**
 * @typedef {{ first: string, last: string, prompts: number }} Session
 * @type {{ sessions: Record<string, Session> }}
 */
const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : { sessions: {} };

/** @param {string} text */
const isPrompt = (text) =>
  text.trim() !== '' &&
  !/^<(command-|local-command|system-reminder|task-notification)/.test(text.trim()) &&
  !/^\[Request interrupted/.test(text) &&
  !/^This session is being continued/.test(text);

let read = 0;
if (existsSync(transcripts)) {
  for (const file of readdirSync(transcripts).filter((f) => f.endsWith('.jsonl'))) {
    const id = file.replace(/\.jsonl$/, '');
    /** @type {Session} */
    const session = { first: '', last: '', prompts: 0 };
    for (const line of readFileSync(join(transcripts, file), 'utf8').split('\n')) {
      if (!line) continue;
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }
      if (entry.type !== 'user' || entry.isMeta || entry.isSidechain) continue;
      const content = entry.message?.content;
      if (Array.isArray(content) && content.some((p) => p.type === 'tool_result')) continue;
      const text = typeof content === 'string' ? content : Array.isArray(content) ? content.filter((p) => p.type === 'text').map((p) => p.text).join('') : '';
      if (!isPrompt(text)) continue;
      session.prompts++;
      const at = entry.timestamp ?? '';
      if (at && (!session.first || at < session.first)) session.first = at;
      if (at && at > session.last) session.last = at;
    }
    if (!session.prompts) continue;
    read++;
    // A session still going has grown since it was last recorded; one whose
    // transcript was cut short keeps the bigger count.
    const before = log.sessions[id];
    if (!before || session.prompts >= before.prompts) log.sessions[id] = session;
  }
}

log.sessions = Object.fromEntries(Object.entries(log.sessions).sort(([, a], [, b]) => a.first.localeCompare(b.first)));
writeFileSync(LOG, JSON.stringify(log, null, 2) + '\n');

const all = Object.values(log.sessions);
const total = all.reduce((n, s) => n + s.prompts, 0);
const day = (/** @type {string} */ at) => at.slice(0, 10);
console.log(`${total} prompts in ${all.length} sessions, ${day(all[0]?.first ?? '')} to ${day(all.at(-1)?.last ?? '')}.`);
console.log(`(${read} transcripts on this machine; the rest are kept in ${LOG}.)`);
