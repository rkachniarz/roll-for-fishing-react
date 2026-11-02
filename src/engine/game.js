// @ts-check
// One cast from the game's side: what goes out, what comes up, and what it
// changes (docs/spec.md, R2-R3; DEV_PLAN 2.6). cast.js times the reflex; this
// file decides what is on the line and applies the outcome to the state.
//
//   castLine   the line goes out: buff charges are spent, the bobber lands,
//              and everything on the line is rolled now, hidden (D63)
//   tick       time passes: the bite, a missed splash, the pause and recast
//   strikeLine the player strikes: the d20, for a fish only (D64)
//
// Every function returns a new state; none reads a clock (D7). Each returns
// `events`, a plain record of what happened, for the log and the scene.

import { content } from '../generated/content.js';
import { applyValue, deriveValues } from './values.js';
import { locationTable, pick } from './tables.js';
import { rollFish, sameFish } from './fish.js';
import { startCast, strike, tickCast } from './cast.js';
import { diceFrom, levelFor } from './state.js';
import { advanceTime } from './time.js';
import { changeSeason, stepWeather } from './weather.js';

/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {import('./state.js').PoolFish} PoolFish */
/** @typedef {import('./values.js').Values} Values */
/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */
/** @typedef {{ x: number, y: number }} Point */
/** @typedef {{ x0: number, y0: number, x1: number, y1: number }} Bounds */

/** A second missed splash in a row reels the line in (D64). */
export const MISS_LIMIT = 2;

/**
 * @typedef {Object} Roll  A hidden or visible roll, for the record (R5.1).
 * @property {string} kind
 * @property {string} die
 * @property {number} result
 * @property {{ label: string, value: number }[]} mods
 * @property {number} total
 * @property {boolean} visible
 *
 * @typedef {{ kind: 'fish', fish: PoolFish, required: number, seenBefore: boolean, fromPool: boolean,
 *     player: { mods: { label: string, value: number }[], vantage: number } }
 *   | { kind: 'item', id: string }
 *   | { kind: 'empty', reason: 'nothing' }} Line
 *
 * @typedef {import('./cast.js').Cast & {
 *   timing: typeof import('./cast.js').TIMING,
 *   line: Line,
 *   rolls: Roll[],
 *   landing: Point | null,
 *   missPause: number,
 *   bait: { recovery: number, escapeLoss: number },
 *   reeledIn?: boolean,
 * }} GameCast
 *
 * @typedef {{ type: string, [key: string]: any }} GameEvent
 */

/**
 * Every game value, from the character, the equipped items and the buffs.
 * @param {GameState} state
 * @returns {Values}
 */
export function valuesFor(state) {
  /** @type {import('./values.js').Source[]} */
  const sources = [];
  for (const id of [state.equipped.rod, state.equipped.bait]) {
    const effects = id ? content.items[id]?.effects : null;
    if (effects) sources.push({ label: id, effects });
  }
  for (const buff of state.buffs) sources.push({ label: buff.id, effects: buff.effects });
  return deriveValues(state.character.stats, sources);
}

/**
 * The cast engine's timings, from the game values.
 * @param {Values} v
 */
export function timingFrom(v) {
  return {
    biteDelayMin: v.flat.biteDelayMin,
    biteDelayMax: Math.max(v.flat.biteDelayMin, v.flat.biteDelayMax),
    fastMs: v.flat.reactionFast,
    okMs: v.flat.reactionOk,
    lateMs: v.flat.strikeLimit,
  };
}

/** @param {GameState} state  The escaped-fish pool for where the player is (R3.6, D59). */
function poolKey(state) {
  return state.spot ? `${state.location}/${state.spot}` : state.location;
}

/**
 * Where the bobber lands: within `radius` scene pixels of the aim, kept in the
 * water (D34). Whole pixels, drawn from the `scatter` stream.
 * @param {Point} aim
 * @param {Bounds} bounds
 * @param {number} radius
 * @param {Dice} dice
 * @returns {Point}
 */
export function scatter(aim, bounds, radius, dice) {
  const r = Math.max(0, Math.round(radius));
  let dx, dy;
  do {
    dx = dice.getRandomNumber(-r, r);
    dy = dice.getRandomNumber(-r, r);
  } while (dx * dx + dy * dy > r * r);
  const clamp = (/** @type {number} */ v, /** @type {number} */ lo, /** @type {number} */ hi) => Math.min(Math.max(v, lo), hi);
  return { x: clamp(Math.round(aim.x) + dx, bounds.x0, bounds.x1), y: clamp(Math.round(aim.y) + dy, bounds.y0, bounds.y1) };
}

/**
 * The line goes out.
 *
 * Returns, besides the new state, a `checkpoint`: the state as it should be
 * saved while the cast is in progress. It has this cast's buff charges spent
 * (D22) and nothing else, so a reload mid-cast loses the charge but replays the
 * same dice (D53, D63).
 * @param {GameState} state
 * @param {number} now
 * @param {{ aim?: Point | null, bounds?: Bounds | null, landing?: Point | null }} [where]
 *   Where the player aimed and where the water is; or, for a recast after a
 *   missed splash, where the bobber already is.
 * @returns {{ state: GameState, cast: GameCast, checkpoint: GameState, events: GameEvent[] }}
 */
export function castLine(state, now, { aim = null, bounds = null, landing = null } = {}) {
  // The values for this cast are taken before its charges are spent, so a
  // "next 3 casts" buff covers this one (R1.5).
  const values = valuesFor(state);
  const checkpoint = structuredClone(state);
  checkpoint.buffs = checkpoint.buffs
    .map((b) => (b.casts !== undefined ? { ...b, casts: b.casts - 1 } : b))
    .filter((b) => b.casts === undefined || b.casts > 0);

  const next = structuredClone(checkpoint);
  next.book.casts++;
  const { dice, commit } = diceFrom(next);
  const timing = timingFrom(values);
  if (!landing && aim && bounds) landing = scatter(aim, bounds, values.flat.castScatter, dice.scatter);
  const { line, rolls } = rollLine(next, values, dice);

  /** @type {GameCast} */
  const cast = {
    ...startCast(now, dice['cast-timing'], timing),
    timing,
    line,
    rolls,
    landing,
    missPause: values.flat.missPause,
    bait: { recovery: values.flat.baitRecovery, escapeLoss: values.flat.baitEscapeLoss },
  };
  next.streams = commit();
  return { state: next, cast, checkpoint, events: [{ type: 'cast', landing }] };
}

/**
 * What is on the line (R3), all rolled now and hidden (D63). Takes a fish from
 * the escaped pool out of `state` (a copy the caller owns) if one comes back.
 * @param {GameState} state
 * @param {Values} values
 * @param {Record<string, Dice>} dice
 * @returns {{ line: Line, rolls: Roll[] }}
 */
function rollLine(state, values, dice) {
  const loc = content.locations[state.location];
  const where = { location: state.location, spot: state.spot };
  /** @type {Roll[]} */
  const rolls = [];
  /** @param {string} name */
  const value = (name) => applyValue(values, name, dice.effects);

  // Does a fish bite? d100 + Fish Find against the location's threshold (R3.1).
  const fishFind = value('fishFind');
  const biteRoll = dice.line.roll100();
  rolls.push({ kind: 'bite', die: 'd100', result: biteRoll, mods: fishFind.mods, total: biteRoll + fishFind.total, visible: false });

  if (biteRoll + fishFind.total >= loc.biteThreshold) {
    // A fish that got away here may come back: the more there are, the likelier (R3.6).
    const key = poolKey(state);
    const pool = state.escaped[key] ?? [];
    /** @type {PoolFish | null} */
    let fish = null;
    let fromPool = false;
    if (pool.length > 0 && dice.line.roll100() <= pool.length) {
      const i = dice.line.getRandomNumber(0, pool.length - 1);
      fish = pool[i];
      state.escaped[key] = pool.filter((_, j) => j !== i);
      fromPool = true;
    } else {
      const species = pick(locationTable(where, 'fish', { weather: state.weather }), dice.line);
      if (species) {
        fish = rollFish(
          /** @type {string} */ (species.id),
          {
            fishSizeBand: value('fishSizeBand').total,
            fishDifficulty: value('fishDifficulty').total,
            fishXp: value('fishXp').total,
          },
          dice.line,
        );
      }
    }
    if (fish) {
      // The fish's resistance: its own d20 on top of its difficulty (R3.5).
      const resistance = dice.line.roll20(value('fishVantage').total);
      rolls.push({
        kind: 'resistance',
        die: 'd20',
        result: resistance,
        mods: [{ label: 'difficulty', value: fish.difficulty }],
        total: fish.difficulty + resistance,
        visible: false,
      });
      const skill = value('fishingSkill');
      return {
        line: {
          kind: 'fish',
          fish,
          required: fish.difficulty + resistance,
          seenBefore: fromPool,
          fromPool,
          player: {
            mods: skill.mods.map((m) => (m.label === 'stat' ? { ...m, label: 'skill' } : m)),
            vantage: value('playerVantage').total,
          },
        },
        rolls,
      };
    }
  }

  // No fish: treasure when d100 - Treasure Find is at or under the threshold, else junk (R3.4).
  const treasureFind = value('treasureFind');
  const treasureRoll = dice.line.roll100();
  rolls.push({
    kind: 'treasure',
    die: 'd100',
    result: treasureRoll,
    mods: treasureFind.mods.map((m) => ({ ...m, value: -m.value })),
    total: treasureRoll - treasureFind.total,
    visible: false,
  });
  if (treasureRoll - treasureFind.total <= loc.treasureThreshold) {
    const treasure = pick(locationTable(where, 'treasure', { found: state.found }), dice.line);
    if (treasure) return { line: { kind: 'item', id: /** @type {string} */ (treasure.id) }, rolls };
    // Every unique treasure here is found: junk instead (D75).
  }
  const junk = pick(locationTable(where, 'junk', { found: state.found }), dice.line);
  return { line: junk?.id ? { kind: 'item', id: junk.id } : { kind: 'empty', reason: 'nothing' }, rolls };
}

/**
 * Time passes for a cast in progress: the bite comes, a splash nobody strikes
 * at runs out, and after a first missed splash the line counts as cast again
 * once the pause is over (D64).
 * @param {GameState} state
 * @param {GameCast} cast
 * @param {number} now
 * @returns {{ state: GameState, cast: GameCast, checkpoint?: GameState, events: GameEvent[] }}
 */
export function tick(state, cast, now) {
  const next = /** @type {GameCast} */ (tickCast(cast, now, cast.timing));
  if (cast.phase !== 'done' && next.phase === 'done') return resolveCast(state, next);
  if (
    next.phase === 'done' &&
    next.outcome.result === 'missed' &&
    !next.reeledIn &&
    state.missStreak < MISS_LIMIT &&
    now >= next.endedAt + next.missPause
  ) {
    const recast = castLine(state, now, { landing: next.landing });
    return { ...recast, events: [{ type: 'recast' }, ...recast.events] };
  }
  return { state, cast: next, events: [] };
}

/**
 * The player strikes. During the pause after a missed splash, a strike pulls
 * the line out instead (D64).
 * @param {GameState} state
 * @param {GameCast} cast
 * @param {number} now
 * @returns {{ state: GameState, cast: GameCast, events: GameEvent[] }}
 */
export function strikeLine(state, cast, now) {
  if (cast.phase === 'done') {
    const pausing = cast.outcome.result === 'missed' && !cast.reeledIn && state.missStreak < MISS_LIMIT;
    if (pausing) return { state, cast: { ...cast, reeledIn: true }, events: [{ type: 'reeled-in' }] };
    return { state, cast, events: [] };
  }
  const line = cast.line;
  const opponent =
    line.kind === 'fish' ? { difficulty: line.required, mods: line.player.mods, vantage: line.player.vantage } : null;
  const { dice, commit } = diceFrom(state);
  const next = /** @type {GameCast} */ (strike(cast, now, dice.fishing, opponent, cast.timing));
  if (next.phase !== 'done') return { state, cast: next, events: [] };
  return resolveCast({ ...state, streams: commit() }, next);
}

/**
 * A finished cast's consequences: the catch, the records, XP, bait, and then
 * time and weather moving on, as for every cast that went out (R11.4).
 * @param {GameState} state
 * @param {GameCast & { phase: 'done' }} cast
 * @returns {{ state: GameState, cast: GameCast, events: GameEvent[] }}
 */
function resolveCast(state, cast) {
  const next = structuredClone(state);
  const { dice, commit } = diceFrom(next);
  /** @type {GameEvent[]} */
  const events = [];
  const result = cast.outcome.result;
  const line = cast.line;
  const levelBefore = levelFor(next.character.xp);

  next.missStreak = result === 'missed' ? next.missStreak + 1 : 0;

  if (line.kind === 'fish') {
    const fish = line.fish;
    if (result === 'caught') {
      catchFish(next, fish);
      events.push({ type: 'caught', fish, roll: cast.outcome.rolls[0], required: line.required, seenBefore: line.seenBefore });
      if (next.equipped.bait) {
        if (dice.bait.roll100() <= cast.bait.recovery) events.push({ type: 'bait-saved', bait: next.equipped.bait });
        else events.push({ type: 'bait-eaten', bait: useBait(next), fish });
      }
    } else if (result === 'escaped' || result === 'missed') {
      const key = poolKey(next);
      next.escaped[key] = [...(next.escaped[key] ?? []), { ...fish, tries: (fish.tries ?? 0) + 1 }];
      events.push({ type: result, fish, roll: cast.outcome.rolls[0], required: line.required });
      if (next.equipped.bait && dice.bait.roll100() <= cast.bait.escapeLoss) {
        events.push({ type: 'bait-lost', bait: useBait(next), fish });
      }
    } else if (result === 'too-early') {
      // It never bit: a fish from the pool goes back, untouched.
      if (line.fromPool) {
        const key = poolKey(next);
        next.escaped[key] = [...(next.escaped[key] ?? []), fish];
      }
      events.push({ type: 'too-early' });
    }
  } else if (result === 'landed') {
    if (line.kind === 'item') {
      const item = content.items[line.id];
      addToBags(next, line.id);
      next.found[line.id] = (next.found[line.id] ?? 0) + 1;
      next.character.xp += item.xp ?? 0;
      events.push({ type: 'found', item: line.id });
    } else {
      events.push({ type: 'empty', reason: line.reason });
    }
  } else {
    events.push({ type: result === 'missed' ? 'missed' : 'too-early' });
  }

  if (result === 'missed' && next.missStreak >= MISS_LIMIT) events.push({ type: 'reeled-in' });

  const levelAfter = levelFor(next.character.xp);
  if (levelAfter > levelBefore) events.push({ type: 'level-up', level: levelAfter });

  // Time and weather move on with every cast that went out and ended.
  const time = advanceTime(next.time);
  next.time = time.minutes;
  if (time.newSeason) {
    next.weather = changeSeason(next.weather, time.newSeason, dice.weather);
    events.push({ type: 'season', season: time.newSeason, weather: next.weather });
  } else {
    const step = stepWeather(next.weather, dice.weather);
    if (step.changed) {
      next.weather = step.weather;
      events.push({ type: 'weather', weather: next.weather });
    }
  }

  next.streams = commit();
  return { state: next, cast, events };
}

/**
 * Into the bucket, stacked with an identical twin (D50); into the book (R4.2).
 * @param {GameState} state
 * @param {PoolFish} fish
 */
function catchFish(state, fish) {
  const { tries, ...instance } = fish;
  const twin = state.bucket.find((b) => sameFish(b.fish, instance));
  if (twin) twin.count++;
  else state.bucket.push({ fish: instance, count: 1 });

  state.book.catches++;
  const record = { size: fish.size, location: state.location, spot: state.spot, time: state.time, weather: { season: state.weather.season, cell: state.weather.cell } };
  const entry = state.book.fish[fish.species];
  if (!entry) {
    state.book.fish[fish.species] = { caught: 1, totalSize: fish.size, smallest: record, largest: record, mostTries: tries ?? 0 };
  } else {
    entry.caught++;
    entry.totalSize += fish.size;
    if (fish.size < entry.smallest.size) entry.smallest = record;
    if (fish.size > entry.largest.size) entry.largest = record;
    entry.mostTries = Math.max(entry.mostTries, tries ?? 0);
  }
  state.character.xp += fish.xp;
}

/**
 * @param {GameState} state
 * @param {string} id
 */
function addToBags(state, id) {
  const stack = state.bags.find((b) => b.id === id);
  if (stack) stack.count++;
  else state.bags.push({ id, count: 1 });
}

/**
 * One bait used up, from the bags; the slot empties with the last one (D39).
 * @param {GameState} state
 * @returns {string} The bait's id.
 */
function useBait(state) {
  const id = /** @type {string} */ (state.equipped.bait);
  const stack = state.bags.find((b) => b.id === id);
  if (stack) stack.count--;
  state.bags = state.bags.filter((b) => b.count > 0);
  if (!state.bags.some((b) => b.id === id)) state.equipped.bait = null;
  return id;
}

// ---------- Buffs (R12) ----------

/**
 * Timed buffs and debuffs count down in real time, but only while the game is
 * open (D32): the page calls this with the time it has been open since.
 * @param {GameState} state
 * @param {number} ms
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function tickBuffs(state, ms) {
  if (!state.buffs.some((b) => b.ms !== undefined)) return { state, events: [] };
  const buffs = state.buffs.map((b) => (b.ms !== undefined ? { ...b, ms: b.ms - ms } : b));
  const ended = buffs.filter((b) => b.ms !== undefined && b.ms <= 0);
  return {
    state: { ...state, buffs: buffs.filter((b) => !ended.includes(b)) },
    events: ended.map((b) => ({ type: 'buff-ended', buff: b.id })),
  };
}

/**
 * The player cancels a buff (R12.7). Debuffs can't be cancelled.
 * @param {GameState} state
 * @param {string} id
 */
export function cancelBuff(state, id) {
  return { ...state, buffs: state.buffs.filter((b) => b.id !== id || b.debuff) };
}
