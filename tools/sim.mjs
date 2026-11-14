// Balance simulation (DEV_PLAN 9.1): seeded games played headless on the real
// engine, a class at a time, and what came of them.
//
//   npm run sim                    every class, 20 games of 500 casts
//   npm run sim -- casts=2000 games=50 class=rogue-fisher strike=250..900
//
// The simulated player strikes `strike` ms after each splash (a range, drawn
// from its own stream), takes the first perk on offer (or the one named with
// perks=passive|active), uses every ability as soon as it can, takes the
// last choice an event offers (staying out, never a trip to town), keeps the newer fish when the bucket is full
// and the first of two treasures. Nothing here changes the game; it reads what
// the engine does, so the numbers move when content or rules do.

import { pathToFileURL } from 'node:url';
import { content } from '../src/generated/content.js';
import { newGame, levelFor } from '../src/engine/state.js';
import { castLine, chooseTreasure, releaseFish, strikeLine, tick, useAbility } from '../src/engine/game.js';
import { activePerks, abilityStatus } from '../src/engine/abilities.js';
import { offers, owedLevels, takePerk } from '../src/engine/perks.js';
import { choose, openSlide } from '../src/engine/events.js';
import { diveStrike, endDive } from '../src/engine/dive.js';
import { rollStats } from '../src/engine/character.js';
import { createRng, deriveSeed } from '../src/rng.js';
import { diceFor } from '../src/dice.js';

/** @typedef {import('../src/engine/state.js').GameState} GameState */

/**
 * @typedef {Object} Options
 * @property {number} casts  Per game.
 * @property {number} games  Per class, each from its own seed.
 * @property {string[]} classes
 * @property {[number, number]} strike  The player's reaction, in ms after the splash.
 * @property {'first' | 'passive' | 'active'} perks
 */

/**
 * What one class's games added up to.
 * @typedef {Object} Tally
 * @property {number} casts
 * @property {Record<string, number>} results  caught, escaped, missed, landed, too-early…
 * @property {Record<string, number>} found  fish, junk, treasure, empty, consumable
 * @property {Record<string, number>} rarity  Of the fish caught.
 * @property {number} rift  Rift fish caught.
 * @property {number} xp  From everything: casts, abilities, events.
 * @property {number[]} levelAt  Casts to reach each level, summed over the games that got there.
 * @property {number[]} levelGames  How many games reached each level.
 * @property {number} abilities  Abilities used.
 * @property {number} events  Events started.
 */

/**
 * Plays one game.
 * @param {string} classId
 * @param {number} seed
 * @param {Options} options
 * @param {Tally} tally  Added to.
 */
function playGame(classId, seed, options, tally) {
  const start = diceFor(createRng(deriveSeed(seed, 'sim-start')));
  const reaction = diceFor(createRng(deriveSeed(seed, 'sim-reaction')));
  /** @type {GameState} */
  let state = newGame({ seed, character: { name: 'Sim', gender: 'f', classId, stats: rollStats(classId, start), luck: 0, xp: 0 } });
  let now = 0;
  let level = 0;
  // Levels from anything: casts, abilities, events.
  const noteLevels = (/** @type {number} */ casts) => {
    const reached = levelFor(state.character.xp);
    for (let l = level + 1; l <= reached; l++) {
      tally.levelAt[l] = (tally.levelAt[l] ?? 0) + casts;
      tally.levelGames[l] = (tally.levelGames[l] ?? 0) + 1;
    }
    level = Math.max(level, reached);
  };
  for (let n = 0; n < options.casts; n++) {
    state = settle(state, options, tally);
    noteLevels(n);
    const out = castLine(state, now);
    if (out.cast.phase === 'idle') {
      if (process.env.SIM_DEBUG) console.error(classId, seed, n, JSON.stringify(out.events), state.event, Boolean(state.pendingCatch), state.equipped.rod);
      break;
    }
    const cast = out.cast;
    const bite = tick(out.state, cast, cast.biteAt);
    const ms = reaction.getRandomNumber(options.strike[0], options.strike[1]);
    let done = strikeLine(bite.state, bite.cast, cast.biteAt + ms);
    if (done.cast.phase !== 'done') done = tick(bite.state, bite.cast, cast.biteAt + 60000);
    // A missed splash: pull out in the pause, so every cast is one cast.
    const missed = done.cast.phase === 'done' && done.cast.outcome.result === 'missed';
    if (missed) done = { ...strikeLine(done.state, done.cast, /** @type {any} */ (done.cast).endedAt + 1), events: done.events };
    tallyCast(done, tally);
    state = done.state;
    noteLevels(n + 1);
    tally.casts++;
    now += 20000;
  }
  tally.xp += state.character.xp;
}

/**
 * Everything the player is asked between casts: perks, a full bucket, two
 * treasures, an open event; then any ability that can be used.
 * @param {GameState} state
 * @param {Options} options
 * @param {Tally} tally  Abilities used.
 */
function settle(state, options, tally) {
  for (let guard = 0; guard < 50; guard++) {
    if (owedLevels(state).length) {
      const offer = offers(state, owedLevels(state)[0]);
      const want = options.perks === 'first' ? offer[0] : offer.find((id) => content.perks[id].kind === options.perks) ?? offer[0];
      state = takePerk(state, want);
    } else if (state.pendingCatch) state = releaseFish(state, 'new').state;
    else if (state.dive) {
      // The dive (R20.3): every fish struck at, as a quick player would.
      const struck = state.dive.fish.findIndex((f) => !f.struck);
      state = struck >= 0 && !state.pendingCatch ? diveStrike(state, struck).state : endDive(state).state;
    }
    else if (state.pendingTreasure) state = chooseTreasure(state, state.pendingTreasure[0]).state;
    else if (state.event) {
      const slide = openSlide(state);
      state = slide?.choices.length ? choose(state, /** @type {any} */ (slide.choices.at(-1)).index).state : { ...state, event: null };
    } else {
      // An ability, then round again: Jump In can fill the bucket.
      const id = activePerks(state).find((a) => abilityStatus(state, a).usable);
      const used = id ? useAbility(state, id) : null;
      if (!used || used.state === state) break;
      tally.abilities++;
      state = used.state;
    }
  }
  return state;
}

/**
 * @param {{ state: GameState, cast: any, events: any[] }} done
 * @param {Tally} tally
 */
function tallyCast(done, tally) {
  const result = done.cast.phase === 'done' ? done.cast.outcome.result : 'unfinished';
  tally.results[result] = (tally.results[result] ?? 0) + 1;
  for (const e of done.events) {
    if (e.type === 'caught') {
      tally.found.fish = (tally.found.fish ?? 0) + 1;
      tally.rarity[e.fish.rarity] = (tally.rarity[e.fish.rarity] ?? 0) + 1;
      if (content.fish[e.fish.species]?.rift) tally.rift++;
    }
    if (e.type === 'found') {
      const kind = content.items[e.item].category;
      tally.found[kind] = (tally.found[kind] ?? 0) + 1;
    }
    if (e.type === 'empty') tally.found.empty = (tally.found.empty ?? 0) + 1;
    if (e.type === 'event-started') tally.events++;
  }
}

/**
 * Plays every game for every class.
 * @param {Partial<Options>} [given]
 * @returns {Record<string, Tally>}
 */
export function simulate(given = {}) {
  /** @type {Options} */
  const options = { casts: 500, games: 20, classes: Object.keys(content.classes), strike: [250, 900], perks: 'first', ...given };
  /** @type {Record<string, Tally>} */
  const out = {};
  for (const classId of options.classes) {
    /** @type {Tally} */
    const tally = { casts: 0, results: {}, found: {}, rarity: {}, rift: 0, xp: 0, levelAt: [], levelGames: [], abilities: 0, events: 0 };
    for (let g = 0; g < options.games; g++) playGame(classId, 1000 + g, options, tally);
    out[classId] = tally;
  }
  return out;
}

/** @param {number} n @param {number} of */
const pct = (n, of) => (of ? `${((100 * n) / of).toFixed(1)}%` : '-');

/**
 * The report, as text.
 * @param {Record<string, Tally>} results
 * @param {Options} options
 */
export function report(results, options) {
  const lines = [`${options.games} games of ${options.casts} casts per class; strike ${options.strike[0]}-${options.strike[1]} ms after the splash; perks: ${options.perks}.`, ''];
  for (const [classId, t] of Object.entries(results)) {
    const casts = t.casts || 1;
    lines.push(`## ${classId}`);
    lines.push(`  outcomes   ${Object.entries(t.results).sort(([, a], [, b]) => b - a).map(([k, v]) => `${k} ${pct(v, casts)}`).join(', ')}`);
    lines.push(`  brought up ${Object.entries(t.found).sort(([, a], [, b]) => b - a).map(([k, v]) => `${k} ${pct(v, casts)}`).join(', ')}`);
    lines.push(`  fish       ${['poor', 'common', 'uncommon', 'rare', 'epic', 'legendary'].filter((r) => t.rarity[r]).map((r) => `${r} ${pct(t.rarity[r], t.found.fish ?? 0)}`).join(', ')}${t.rift ? `; rift ${pct(t.rift, t.found.fish ?? 0)}` : ''}`);
    lines.push(`  XP         ${(t.xp / casts).toFixed(2)} per cast`);
    const levels = t.levelGames.map((g, l) => (g ? `L${l} ${Math.round(t.levelAt[l] / g)} (${g}/${options.games})` : '')).filter(Boolean);
    lines.push(`  levels     ${levels.join(', ') || 'none reached'}   (mean casts to reach; games that did)`);
    lines.push(`  abilities  ${(t.abilities / (options.games || 1)).toFixed(1)} used per game; events ${(t.events / (options.games || 1)).toFixed(1)} per game`);
    lines.push('');
  }
  return lines.join('\n');
}

/** @param {string[]} argv */
function parseArgs(argv) {
  /** @type {Partial<Options>} */
  const o = {};
  for (const arg of argv) {
    const [k, v] = arg.split('=');
    if (k === 'casts' || k === 'games') o[k] = Number(v);
    else if (k === 'class') o.classes = v.split(',');
    else if (k === 'strike') {
      const [a, b] = v.split('..').map(Number);
      o.strike = [a, b ?? a];
    } else if (k === 'perks' && (v === 'first' || v === 'passive' || v === 'active')) o.perks = v;
    else throw new Error(`unknown option "${arg}" (casts=, games=, class=, strike=a..b, perks=first|passive|active)`);
  }
  return o;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const given = parseArgs(process.argv.slice(2));
  const options = /** @type {Options} */ ({ casts: 500, games: 20, classes: Object.keys(content.classes), strike: [250, 900], perks: 'first', ...given });
  console.log(report(simulate(options), options));
}
