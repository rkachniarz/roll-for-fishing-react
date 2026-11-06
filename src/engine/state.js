// @ts-check
// The game state: one serialisable object, saved whole after every resolved
// cast (docs/spec.md, R1; D13). It holds only the player's own state and ids,
// never a copy of content, so new and changed content shows up in old saves
// (D44). It also holds where every random stream has got to, so a reload
// carries on with the same dice (D53).
//
// Modifiers are never stored: they are worked out from the state each time
// (values.js). That rule is what the prototype's worst bugs taught
// (PORTING-NOTES §4).

import { createRng, deriveSeed } from '../rng.js';
import { diceFor } from '../dice.js';
import { content } from '../generated/content.js';
import { weatherAt } from './weather.js';
import { clock, seasonOfMonth, startTime } from './time.js';
import { emptyEquipment } from './equipment.js';

/** Bump with a migration below whenever the shape changes. */
export const SAVE_VERSION = 5;

/**
 * One stream per consumer (D4): drawing more from one never shifts another.
 * cast-timing: bite delays · fishing: the player's d20 · line: what is on the
 * line · effects: dice on effects · weather · scatter: where the bobber lands ·
 * bait: saving or losing bait · features: surface features appearing and drifting ·
 * events: the event meter and which event it picks.
 */
export const STREAMS = ['cast-timing', 'fishing', 'line', 'effects', 'weather', 'scatter', 'bait', 'features', 'events'];

/**
 * @typedef {import('./fish.js').FishInstance & { tries?: number }} PoolFish  A fish
 *   that got away or was released, with how many times it was met.
 *
 * @typedef {Object} Buff  A temporary modifier (R12). Lasts `casts` casts or `ms` real milliseconds.
 * @property {string} id
 * @property {string} source
 * @property {import('./values.js').Effect[]} effects
 * @property {boolean} [debuff]
 * @property {number} [casts]
 * @property {number} [ms]
 *
 * @typedef {Object} GameState
 * @property {number} version
 * @property {number} seed
 * @property {Record<string, number>} streams  Each stream's state (D53).
 * @property {{ name: string, gender: 'm' | 'f', classId: string,
 *   stats: { fishingSkill: number, fishFind: number, treasureFind: number },
 *   luck: number, xp: number, perks: Record<number, string> }} character  `perks`: level -> the perk
 *   taken for it (perks.js, D96).
 * @property {string} location
 * @property {string | null} spot
 * @property {number} time  Game minutes (time.js).
 * @property {import('./weather.js').Weather} weather
 * @property {Record<string, { id: string, count: number } | null>} equipped  Slot -> what is in it
 *   (equipment.js, D83). Equipped items aren't in the bags.
 * @property {{ id: string, count: number }[]} bags
 * @property {{ fish: import('./fish.js').FishInstance, count: number }[]} bucket
 * @property {Record<string, number>} found  Item id -> how many ever found.
 * @property {Record<string, PoolFish[]>} escaped  Per location or location/spot (R3.6, D59).
 * @property {Buff[]} buffs
 * @property {import('./features.js').Feature[]} features  On the water now (R14).
 * @property {import('./fish.js').FishInstance | null} [pendingCatch]  A fish landed with
 *   the bucket full, waiting for the player to choose one to let go (D59). No
 *   cast goes out until then.
 * @property {{ casts: number, catches: number, fish: Record<string, BookEntry> }} book  The
 *   accomplishments book (R4.2).
 * @property {Record<string, boolean | number | string>} flags  For events (R10).
 * @property {number} eventMeter  Fills with each cast; an event may start above 100 (events.js).
 * @property {{ id: string, slide: string } | null} event  The open event and its slide (D84).
 *   No cast goes out until it ends.
 * @property {Record<string, number>} eventsSeen  Event id -> how many times it has started.
 * @property {number} missStreak  Splashes missed in a row (D64).
 */

/**
 * @typedef {{ size: number, location: string, spot: string | null, time: number,
 *   weather: { season: string, cell: number } }} BookRecord  A record, with where, when and in what weather.
 *
 * @typedef {Object} BookEntry  One species in the book.
 * @property {number} caught
 * @property {number} totalSize  For the average.
 * @property {BookRecord} smallest
 * @property {BookRecord} largest
 * @property {number} mostTries  The most times one fish got away before it was caught (R3.6).
 */

/**
 * @param {Object} options
 * @param {number} options.seed
 * @param {GameState['character']} options.character
 * @param {number} [options.month]  This month outside (0 for January), from
 *   the page: the start leans towards its season (D85). The engine never reads
 *   a clock (D7); without it, the season in new-game.json.
 * @returns {GameState}
 */
export function newGame({ seed, character, month }) {
  const start = content.rules['new-game'];
  /** @type {Record<string, number>} */
  const streams = {};
  for (const label of STREAMS) streams[label] = deriveSeed(seed, label);
  // Once, at the start: its own stream, never stored (D4).
  const time = startTime(month === undefined ? start.weather.season : seasonOfMonth(month), diceFor(createRng(deriveSeed(seed, 'start'))));
  const weatherRng = createRng(streams.weather);
  const weather = weatherAt(clock(time).season, start.weather.cell, diceFor(weatherRng));
  streams.weather = weatherRng.state;
  return {
    version: SAVE_VERSION,
    seed,
    streams,
    character: { ...character, luck: character.luck ?? 0, xp: character.xp ?? 0, perks: character.perks ?? {} },
    location: start.location,
    spot: null,
    time,
    weather,
    equipped: {
      ...emptyEquipment(),
      ...Object.fromEntries(Object.entries(start.equipped).map(([slot, id]) => [slot, { id, count: 1 }])),
    },
    bags: [],
    bucket: [],
    found: {},
    escaped: {},
    buffs: [],
    features: [],
    pendingCatch: null,
    book: { casts: 0, catches: 0, fish: {} },
    flags: {},
    eventMeter: 0,
    event: null,
    eventsSeen: {},
    missStreak: 0,
  };
}

/**
 * The dice for some of the state's streams. Draw from them, then call
 * `commit()` for the streams' new positions, to store in the next state.
 * @param {GameState} state
 */
export function diceFrom(state) {
  /** @type {Record<string, import('../rng.js').Rng>} */
  const rngs = {};
  /** @type {Record<string, ReturnType<typeof diceFor>>} */
  const dice = {};
  for (const label of STREAMS) {
    rngs[label] = createRng(state.streams[label]);
    dice[label] = diceFor(rngs[label]);
  }
  return {
    dice,
    commit: () => Object.fromEntries(STREAMS.map((label) => [label, rngs[label].state])),
  };
}

/**
 * The level for an amount of XP (§C.1).
 * @param {number} xp
 */
export function levelFor(xp) {
  const curve = content.rules.levels.xp;
  let level = 0;
  while (level + 1 < curve.length && xp >= curve[level + 1]) level++;
  return level;
}

// ---------- Saving ----------

/**
 * Migrations from each older version to the next. A save from version n goes
 * through MIGRATIONS[n], MIGRATIONS[n + 1]… up to SAVE_VERSION.
 * @type {Record<number, (save: any) => any>}
 */
const MIGRATIONS = {
  // 1 -> 2: surface features (R14), with their own stream.
  1: (save) => ({ ...save, features: [], streams: { ...save.streams, features: deriveSeed(save.seed, 'features') } }),
  // 2 -> 3: seven equipment slots holding stacks (D83). Equipped bait used to
  // stay in the bags; its stack moves into the slot.
  2: (save) => {
    const bait = save.equipped.bait ? save.bags.find((/** @type {{ id: string }} */ b) => b.id === save.equipped.bait) : null;
    return {
      ...save,
      equipped: {
        ...emptyEquipment(),
        rod: save.equipped.rod ? { id: save.equipped.rod, count: 1 } : null,
        bait: bait ? { ...bait } : null,
      },
      bags: bait ? save.bags.filter((/** @type {{ id: string }} */ b) => b !== bait) : save.bags,
    };
  },
  // 3 -> 4: events (D84), with their own stream.
  3: (save) => ({
    ...save,
    eventMeter: 0,
    event: null,
    eventsSeen: {},
    streams: { ...save.streams, events: deriveSeed(save.seed, 'events') },
  }),
  // 4 -> 5: perks (D96). None taken yet; the page offers what the level owes.
  4: (save) => ({ ...save, character: { ...save.character, perks: {} } }),
};

/** @param {GameState} state */
export function serialize(state) {
  return JSON.stringify(state);
}

/**
 * A saved game, migrated to the current version.
 * @param {string} text
 * @returns {GameState}
 */
export function deserialize(text) {
  let save = JSON.parse(text);
  if (typeof save.version !== 'number') throw new Error('Not a saved game');
  if (save.version > SAVE_VERSION) throw new Error(`Saved by a newer version of the game (${save.version})`);
  while (save.version < SAVE_VERSION) save = { ...MIGRATIONS[save.version](save), version: save.version + 1 };
  return save;
}
