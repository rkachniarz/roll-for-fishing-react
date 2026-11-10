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
import { listTable, locationTable, pick } from './tables.js';
import { bendFish, rollFish, sameFish, sizeBands } from './fish.js';
import { featureAt, swimOff, updateFeatures } from './features.js';
import { startCast, strike, tickCast } from './cast.js';
import { diceFrom, levelFor } from './state.js';
import { equippedIds } from './equipment.js';
import { afterCast, arrive } from './events.js';
import { hasPerk, owedLevels, perkSources, settlePerks } from './perks.js';
import { LIGHTS, abilityStatus, spendCooldownCasts, startCooldown, tickCooldowns } from './abilities.js';
import { advanceTime, clock } from './time.js';
import { changeSeason, stepWeather } from './weather.js';

/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {import('./state.js').PoolFish} PoolFish */
/** @typedef {import('./values.js').Values} Values */
/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */
/** @typedef {{ x: number, y: number }} Point */
/** @typedef {{ x0: number, y0: number, x1: number, y1: number }} Bounds */

/** A second missed splash in a row reels the line in (D64). */
export const MISS_LIMIT = 2;

/** One cast in this many flies off somewhere else entirely (D85). */
export const WILD_CAST = 100;

/**
 * @typedef {Object} Roll  A hidden or visible roll, for the record (R5.1).
 * @property {string} kind
 * @property {string} die
 * @property {number} result
 * @property {{ label: string, value: number }[]} mods
 * @property {number} total
 * @property {boolean} visible
 *
 * @typedef {{ kind: 'item', id: string, alt?: string, polished?: boolean }} ItemLine  An item;
 *   `alt`: a second treasure to choose from (Fence), `polished`: junk that Polish made treasure (D106).
 *
 * @typedef {{ kind: 'fish', fish: PoolFish, required: number, fishNatural?: number, seenBefore: boolean, fromPool: boolean,
 *     rift?: boolean, carried?: ItemLine,
 *     player: { mods: { label: string, value: number }[], vantage: number, stacks?: boolean, natural?: number } }
 *   | ItemLine
 *   | { kind: 'empty', reason: 'nothing' }} Line  `rift`: from the spot's rift table (D104); `carried`: a
 *   Greedy fish's catch (D106).
 *
 * @typedef {import('./cast.js').Cast & {
 *   timing: typeof import('./cast.js').TIMING,
 *   line: Line,
 *   rolls: Roll[],
 *   landing: Point | null,
 *   missPause: number,
 *   bait: { recovery: number, escapeLoss: number },
 *   bucketSize: number,
 *   meterFill: number,
 *   reeledIn?: boolean,
 *   recast?: boolean,
 *   feature?: { id: string, born: number } | null,
 *   extra: import('./values.js').Source[],
 * }} GameCast
 *
 * @typedef {{ type: string, [key: string]: any }} GameEvent
 */

/**
 * Every game value, from the character, its perks, the equipped items and the buffs.
 * @param {GameState} state
 * @param {import('./values.js').Source[]} [extra]  Sources that aren't part of
 *   the state, such as the ?dev bench's overrides; never saved.
 * @returns {Values}
 */
export function valuesFor(state, extra = []) {
  /** @type {import('./values.js').Source[]} */
  const sources = perkSources(state);
  for (const id of equippedIds(state)) {
    const effects = content.items[id]?.effects;
    if (effects) sources.push({ label: id, effects });
  }
  for (const buff of state.buffs) sources.push({ label: buff.id, effects: buff.effects });
  return deriveValues(state.character.stats, [...sources, ...extra]);
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
export function poolKey(state) {
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
 * @param {{ aim?: Point | null, bounds?: Bounds | null, landing?: Point | null,
 *   extra?: import('./values.js').Source[], recast?: boolean }} [options]
 *   Where the player aimed (null: anywhere, as with the keyboard) and where the
 *   water is; or, for a recast after a missed splash, where the bobber already
 *   is. `extra`: see valuesFor.
 * @returns {{ state: GameState, cast: GameCast, checkpoint: GameState, events: GameEvent[] }}
 */
export function castLine(state, now, { aim = null, bounds = null, landing = null, extra = [], recast = false } = {}) {
  // A full bucket waits for the player's choice before anything else (D59).
  if (state.pendingCatch) {
    return { state, cast: /** @type {GameCast} */ ({ phase: 'idle' }), checkpoint: state, events: [{ type: 'bucket-full' }] };
  }
  // Nor while two treasures wait for the player to keep one (Fence, D106).
  if (state.pendingTreasure) {
    return { state, cast: /** @type {GameCast} */ ({ phase: 'idle' }), checkpoint: state, events: [{ type: 'treasure-choice' }] };
  }
  // Nor while an event is open (D84).
  if (state.event) return { state, cast: /** @type {GameCast} */ ({ phase: 'idle' }), checkpoint: state, events: [] };
  // No rod, no cast (D83). The line and the bobber are optional.
  if (!state.equipped.rod) {
    return { state, cast: /** @type {GameCast} */ ({ phase: 'idle' }), checkpoint: state, events: [{ type: 'no-rod' }] };
  }
  // Ever-Summoning: Summon Fish by itself, every other cast (D106).
  const summoned = hasPerk(state, 'ever-summoning') && (state.book.casts + 1) % 2 === 0;
  const lineExtra = summoned ? [...extra, { label: 'ever-summoning', effects: [{ value: 'biteCertain', add: 1 }] }] : extra;
  // The values for this cast are taken before its charges are spent, so a
  // "next 3 casts" buff covers this one (R1.5).
  const values = valuesFor(state, lineExtra);
  const checkpoint = structuredClone(state);
  checkpoint.buffs = checkpoint.buffs
    .map((b) => (b.casts !== undefined ? { ...b, casts: b.casts - 1 } : b))
    .filter((b) => b.casts === undefined || b.casts > 0)
    // An ability used while the last line was out counts from this cast (D96).
    .map(({ pending, ...b }) => b);
  // Lit abilities go dark when the next line goes out (D96).
  checkpoint.lit = {};

  const next = structuredClone(checkpoint);
  next.book.casts++;
  const { dice, commit } = diceFrom(next);
  const timing = timingFrom(values);
  /** @type {GameEvent[]} */
  const events = [];
  if (!landing && bounds) {
    const anywhere = () => ({
      x: dice.scatter.getRandomNumber(bounds.x0, bounds.x1),
      y: dice.scatter.getRandomNumber(bounds.y0, bounds.y1),
    });
    if (dice.scatter.getRandomNumber(1, WILD_CAST) === 1) {
      // Way off target, wherever it was aimed (D85).
      landing = anywhere();
      events.push({ type: 'wild-cast' });
    } else {
      // No aim (the keyboard): somewhere on the water, from the same stream,
      // since where the bobber lands can change the odds (R14).
      landing = scatter(aim ?? anywhere(), bounds, values.flat.castScatter, dice.scatter);
    }
  }
  // Landing in a surface feature: its effects and tables for this cast, and
  // one use of it gone (R14).
  events.unshift({ type: 'cast', landing });
  const hit = featureAt(next.features, landing);
  const feature = hit ? content.features[hit.id] : null;
  let lineValues = values;
  if (hit && feature) {
    hit.uses--;
    lineValues = valuesFor(state, [...lineExtra, { label: feature.id, effects: feature.effects ?? [] }]);
    events.push({ type: 'feature-hit', feature: feature.id });
  }
  const { line, rolls } = rollLine(next, lineValues, dice, feature, hit?.fish ?? null);

  /** @type {GameCast} */
  const cast = {
    ...startCast(now, dice['cast-timing'], timing),
    timing,
    line,
    rolls,
    landing,
    missPause: values.flat.missPause,
    bait: { recovery: values.flat.baitRecovery, escapeLoss: values.flat.baitEscapeLoss },
    bucketSize: values.flat.bucketSize,
    meterFill: values.flat.eventMeterFill,
    extra,
    feature: hit ? { id: hit.id, born: hit.born } : null,
    ...(recast ? { recast: true } : {}),
  };
  next.streams = commit();
  return { state: next, cast, checkpoint, events };
}

/**
 * What is on the line (R3), all rolled now and hidden (D63). Takes a fish from
 * the escaped pool out of `state` (a copy the caller owns) if one comes back.
 * @param {GameState} state
 * @param {Values} values
 * @param {Record<string, Dice>} dice
 * @param {any} [feature]  The surface feature the cast landed in, from content.
 * @param {PoolFish | null} [featureFish]  The fish that feature holds, if one
 *   already got away from it once (a big fish that swam off, D85).
 * @returns {{ line: Line, rolls: Roll[] }}
 */
function rollLine(state, values, dice, feature = null, featureFish = null) {
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

  // Abilities can make a fish certain, or rule one out (D96).
  const certain = values.flat.biteCertain;
  if (certain > 0 || (certain === 0 && biteRoll + fishFind.total >= loc.biteThreshold)) {
    // A fish that got away here may come back: the more there are, the likelier (R3.6).
    const key = poolKey(state);
    const pool = state.escaped[key] ?? [];
    /** @type {PoolFish | null} */
    let fish = null;
    let fromPool = false;
    let rift = false;
    // A feature with its own fish (a school, a big fish) brings up those, not the pool's.
    if (featureFish) {
      // Not from the pool: it stays with the feature if pulled out too early.
      fish = featureFish;
    } else if (!feature?.fish && pool.length > 0 && (values.flat.fromPool > 0 || dice.line.roll100() <= pool.length)) {
      const i = dice.line.getRandomNumber(0, pool.length - 1);
      fish = pool[i];
      state.escaped[key] = pool.filter((_, j) => j !== i);
      fromPool = true;
    } else {
      // Rift Fishing: now and then, the spot's rift table instead (D104, D106).
      const riftChance = values.flat.riftChance * (values.flat.riftDoubled > 0 ? 2 : 1);
      const riftTable = !feature?.fish && riftChance > 0 && dice.line.roll100() <= riftChance ? locationTable(where, 'rift', { moment: momentOf(state) }) : [];
      rift = riftTable.length > 0;
      const table = rift
        ? riftTable
        : feature?.fish
          ? listTable(feature.fish, 'fish', { moment: momentOf(state) })
          : locationTable(where, 'fish', { moment: momentOf(state) });
      const species = pick(table, dice.line);
      const minBand = feature?.minBand ? sizeBands().findIndex((/** @type {{ id: string }} */ b) => b.id === feature.minBand) : 0;
      if (species) {
        fish = rollFish(
          /** @type {string} */ (species.id),
          {
            fishSizeBand: value('fishSizeBand').total,
            fishDifficulty: value('fishDifficulty').total,
            fishXp: value('fishXp').total,
          },
          dice.line,
          { minBand },
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
      // Greedy Fish: something caught on it, rolled as a cast that brought up no fish (D106).
      /** @type {ItemLine | null} */
      let carried = null;
      if (values.flat.greedyChance > 0 && dice.line.roll100() <= values.flat.greedyChance) {
        const loot = rollLoot(state, values, dice.line, dice.effects, null, rolls).line;
        if (loot.kind === 'item') carried = loot;
      }
      const skill = value('fishingSkill');
      return {
        line: {
          kind: 'fish',
          fish,
          required: fish.difficulty + resistance,
          fishNatural: resistance,
          seenBefore: fromPool || Boolean(featureFish),
          fromPool,
          ...(rift ? { rift } : {}),
          ...(carried ? { carried } : {}),
          player: {
            mods: skill.mods.map((m) => (m.label === 'stat' ? { ...m, label: 'skill' } : m)),
            vantage: value('playerVantage').total,
            stacks: value('vantageStacks').total > 0,
            natural: value('naturalCatch').total,
          },
        },
        rolls,
      };
    }
  }

  return rollLoot(state, values, dice.line, dice.effects, feature, rolls);
}

/**
 * Going to another spot, or another location (R11.8, D101). Only between
 * casts. The surface features stay behind with the water they were on, and
 * an event that starts on arriving may start.
 * @param {GameState} state
 * @param {string} location
 * @param {string} spot
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function travel(state, location, spot) {
  if (state.location === location && state.spot === spot) return { state, events: [] };
  const next = { ...structuredClone(state), location, spot, features: [] };
  return { state: next, events: arrive(next) };
}

/**
 * What the fish's preferences are checked against as the line goes out (D101).
 * @param {GameState} state
 * @returns {import('./tables.js').Moment}
 */
export function momentOf(state) {
  const bait = state.equipped.bait ? content.items[state.equipped.bait.id]?.bait ?? null : null;
  return { weather: state.weather, partOfDay: clock(state.time).partOfDay, bait };
}

/**
 * No fish: treasure when d100 - Treasure Find is at or under the threshold,
 * else junk (R3.4). Also what a gutted fish had swallowed (D96).
 * @param {GameState} state
 * @param {Values} values
 * @param {Dice} lootDice  The stream for the d100 and the tables.
 * @param {Dice} effectDice  The `effects` stream.
 * @param {any} [feature]
 * @param {Roll[]} [rolls]  Added to.
 * @returns {{ line: Line, rolls: Roll[] }}
 */
function rollLoot(state, values, lootDice, effectDice, feature = null, rolls = []) {
  const loc = content.locations[state.location];
  const where = { location: state.location, spot: state.spot };
  const treasureFind = applyValue(values, 'treasureFind', effectDice);
  const treasureRoll = lootDice.roll100();
  rolls.push({
    kind: 'treasure',
    die: 'd100',
    result: treasureRoll,
    mods: treasureFind.mods.map((m) => ({ ...m, value: -m.value })),
    total: treasureRoll - treasureFind.total,
    visible: false,
  });
  if (treasureRoll - treasureFind.total <= loc.treasureThreshold) {
    const treasure = pickTreasure(state, values, lootDice);
    if (treasure) return { line: treasure, rolls };
    // Every unique treasure here is found: junk instead (D75).
  }
  const junkTable = feature?.junk ? listTable(feature.junk, 'junk', { found: state.found }) : locationTable(where, 'junk', { found: state.found });
  const junk = pick(junkTable, lootDice);
  if (junk?.id && values.flat.junkToTreasure > 0) {
    // Polish: the junk turns out to be treasure, if any is left here (D106).
    const treasure = pickTreasure(state, values, lootDice);
    if (treasure) return { line: { ...treasure, polished: true }, rolls };
  }
  return { line: junk?.id ? { kind: 'item', id: junk.id } : { kind: 'empty', reason: 'nothing' }, rolls };
}

/**
 * A treasure from where the player is, and with Fence a second, different
 * one to choose from, if there is one (D106).
 * @param {GameState} state
 * @param {Values} values
 * @param {Dice} dice
 * @returns {ItemLine | null}  Null when every unique treasure here is found.
 */
function pickTreasure(state, values, dice) {
  const table = locationTable({ location: state.location, spot: state.spot }, 'treasure', { found: state.found });
  const treasure = pick(table, dice);
  if (!treasure?.id) return null;
  const alt = values.flat.treasureChoice > 0 ? pick(table.filter((e) => e.id !== treasure.id), dice) : null;
  return { kind: 'item', id: treasure.id, ...(alt?.id ? { alt: alt.id } : {}) };
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
    const recast = castLine(state, now, { landing: next.landing, extra: next.extra, recast: true });
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
    line.kind === 'fish'
      ? {
          difficulty: line.required,
          mods: line.player.mods,
          vantage: line.player.vantage,
          stacks: line.player.stacks,
          natural: line.player.natural,
          fishNatural: line.fishNatural,
        }
      : null;
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
  // The surface feature it landed in, if it's still there.
  const hit = cast.feature ? next.features.find((f) => f.id === cast.feature?.id && f.born === cast.feature?.born) : null;
  const levelBefore = levelFor(next.character.xp);

  next.missStreak = result === 'missed' ? next.missStreak + 1 : 0;

  // An attempt at a catch, the empty hook included, counts for cooldowns and
  // uses up an ability's "next cast" (D96). A missed splash doesn't.
  if (result === 'caught' || result === 'escaped' || result === 'landed') {
    spendCooldownCasts(next);
    next.buffs = next.buffs
      .map((b) => (b.attempts !== undefined && !b.pending ? { ...b, attempts: b.attempts - 1 } : b))
      .filter((b) => b.attempts === undefined || b.attempts > 0);
  }

  if (line.kind === 'fish') {
    const fish = line.fish;
    if (result === 'caught') {
      catchFish(next, fish, cast.bucketSize);
      // A Greedy fish is named so in the log, not in the bucket (D106).
      const shown = line.carried ? { ...fish, greedy: true } : fish;
      events.push({ type: 'caught', fish: shown, roll: cast.outcome.rolls[0], required: line.required, seenBefore: line.seenBefore });
      if (line.rift) events.push({ type: 'rift', fish });
      if (line.carried) {
        receive(next, line.carried);
        events.push({ type: 'greedy', item: line.carried.id, alt: line.carried.alt });
        if (line.carried.polished) events.push({ type: 'polished' });
      }
      if (next.pendingCatch) events.push({ type: 'bucket-full' });
      else light(next, 'caught', fish, events);
      if (next.equipped.bait) {
        if (dice.bait.roll100() <= cast.bait.recovery) events.push({ type: 'bait-saved', bait: next.equipped.bait.id });
        else events.push({ type: 'bait-eaten', bait: useBait(next), fish });
      }
    } else if (result === 'escaped' || result === 'missed') {
      const escaped = { ...fish, tries: (fish.tries ?? 0) + 1 };
      events.push({ type: result, fish, roll: cast.outcome.rolls[0], required: line.required });
      const def = hit ? content.features[hit.id] : null;
      if (hit && def?.swimsOff && (hit.swamOff ?? 0) < def.swimsOff) {
        // A big fish swims off somewhere else and can be tried again, the
        // same fish (D85). After its last escape it goes, into the pool.
        swimOff(hit, def, escaped, dice.features);
        events.push({ type: 'feature-moved', feature: hit.id });
      } else {
        const key = poolKey(next);
        next.escaped[key] = [...(next.escaped[key] ?? []), escaped];
        // Only a fish in the pool can be jumped in after: a big fish that swam
        // off is somewhere else (D85).
        light(next, 'got-away', escaped, events);
      }
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
      receive(next, line);
      events.push({ type: 'found', item: line.id, alt: line.alt });
      if (line.polished) events.push({ type: 'polished' });
    } else {
      events.push({ type: 'empty', reason: line.reason });
    }
  } else {
    events.push({ type: result === 'missed' ? 'missed' : 'too-early' });
  }

  // Pulled out before anything bit: no time passes, the weather stays, the
  // event meter doesn't fill and no new feature appears, so pulling out at
  // once can't hurry the day along. The features on the water still age and
  // drift, so recasting until one is hit costs a cast of its lifetime each
  // time; the one it landed in gets its use back (D85).
  if (result === 'too-early') {
    if (hit) hit.uses++;
    events.push(...updateFeatures(next, dice.features, { appear: false }));
    next.streams = commit();
    return { state: next, cast, events };
  }

  if (result === 'missed' && next.missStreak >= MISS_LIMIT) {
    events.push({ type: 'reeled-in' });
    cast = { ...cast, reeledIn: true };
  }

  levelUp(next, levelBefore, events);

  events.push(...updateFeatures(next, dice.features));

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

  // Last, so an event sees the cast's catch and the new time (D84).
  events.push(...afterCast(next, dice.events, {
    // Two treasures to choose from start no item's event (no treasure has one yet).
    found: result === 'landed' && line.kind === 'item' && !line.alt ? line.id : undefined,
    empty: result === 'landed' && line.kind === 'empty',
    fill: cast.meterFill ?? 100,
  }));

  next.streams = commit();
  return { state: next, cast, events };
}

/**
 * A level-up, if the XP made one: the level-1 perk given, a choice to come
 * (D96). Changes `state` in place.
 * @param {GameState} state
 * @param {number} levelBefore
 * @param {GameEvent[]} events  Added to.
 */
function levelUp(state, levelBefore, events) {
  const levelAfter = levelFor(state.character.xp);
  if (levelAfter <= levelBefore) return;
  events.push({ type: 'level-up', level: levelAfter });
  // A level with only one perk on offer gives it; one with a choice waits for
  // the player, without stopping the game (D96).
  const settled = settlePerks(state);
  Object.assign(state, settled.state);
  for (const id of settled.taken) events.push({ type: 'perk', perk: id });
  if (owedLevels(state).length > 0) events.push({ type: 'perk-owed' });
}

/**
 * Lights every ready ability that `what` lights, for this fish (D96).
 * Changes `state` in place.
 * @param {GameState} state
 * @param {'caught' | 'got-away'} what
 * @param {PoolFish} fish
 * @param {GameEvent[]} events  Added to.
 */
function light(state, what, fish, events) {
  for (const [id, by] of Object.entries(LIGHTS)) {
    if (by !== what || !Object.values(state.character.perks).includes(id)) continue;
    const { tries, ...instance } = fish;
    state.lit[id] = { fish: instance };
    if (abilityStatus(state, id).usable) events.push({ type: 'lit', perk: id });
    else delete state.lit[id];
  }
}

// ---------- Abilities (D96) ----------

/**
 * The player uses an ability from the action bar. Most add a buff for the
 * next attempt at a catch; a lit one acts on the fish that lit it.
 * @param {GameState} state
 * @param {string} id
 * @param {import('./values.js').Source[]} [extra]  See valuesFor.
 * @returns {{ state: GameState, events: GameEvent[] }}  The same state if it can't be used now.
 */
export function useAbility(state, id, extra = []) {
  if (!abilityStatus(state, id).usable) return { state, events: [] };
  const next = structuredClone(state);
  const values = valuesFor(state, extra).flat;
  const levelBefore = levelFor(next.character.xp);
  /** @type {GameEvent[]} */
  const events = [{ type: 'ability', perk: id }];
  /** @param {import('./values.js').Effect[]} effects */
  const nextCast = (effects) => next.buffs.push({ id, source: id, effects, attempts: 1, pending: true });

  switch (id) {
    case 'battle-focus':
      nextCast([{ value: 'fishingSkill', add: levelBefore }]);
      break;
    case 'full-force':
      // Both stats, for both rolls: as they stand now.
      nextCast([
        { value: 'fishingSkill', add: values.fishFind },
        { value: 'fishFind', add: values.fishingSkill },
      ]);
      break;
    case 'summon-fish':
      nextCast([{ value: 'biteCertain', add: 1 }]);
      break;
    case 'sleight-of-hook':
      nextCast([{ value: 'biteCertain', add: -1 }]);
      break;
    case 'recall':
      nextCast([{ value: 'fromPool', add: 1 }]);
      break;
    case 'polish':
      // Until junk comes up, however many casts that takes (D106).
      next.buffs.push({ id, source: id, effects: [{ value: 'junkToTreasure', add: 1 }] });
      break;
    case 'bend-reality': {
      // The fish that was just caught, bigger and rarer, back into the bucket (D106).
      const fish = next.lit[id]?.fish;
      const stack = fish ? next.bucket.find((b) => sameFish(b.fish, fish)) : null;
      if (!fish || !stack) return { state, events: [] };
      const before = stack.fish;
      stack.count--;
      next.bucket = next.bucket.filter((b) => b.count > 0);
      const { dice, commit } = diceFrom(next);
      const bent = bendFish(before, dice.abilities);
      next.streams = commit();
      addToBucket(next, bent);
      const entry = next.book.fish[bent.species];
      if (entry) {
        entry.totalSize += bent.size - before.size;
        if (bent.size > entry.largest.size) entry.largest = { ...entry.largest, size: bent.size };
      }
      next.character.xp += bent.xp - before.xp;
      events.push({ type: 'bent', from: before, fish: bent, xp: bent.xp - before.xp });
      break;
    }
    case 'jump-in': {
      // The fish that just got away, out of the pool and into the bucket.
      const fish = next.lit[id]?.fish;
      const key = poolKey(next);
      const pool = next.escaped[key] ?? [];
      const i = fish ? pool.findLastIndex((f) => sameFish(f, fish)) : -1;
      if (i < 0) return { state, events: [] };
      const caught = pool[i];
      next.escaped[key] = pool.filter((_, j) => j !== i);
      catchFish(next, caught, values.bucketSize);
      events.push({ type: 'caught', fish: caught, seenBefore: false });
      if (next.pendingCatch) events.push({ type: 'bucket-full' });
      break;
    }
    case 'gut': {
      // The fish that was just caught, out of the bucket; what it swallowed,
      // rolled as a cast that brought up no fish (R3.4).
      const fish = next.lit[id]?.fish;
      const stack = fish ? next.bucket.find((b) => sameFish(b.fish, fish)) : null;
      if (!fish || !stack) return { state, events: [] };
      stack.count--;
      next.bucket = next.bucket.filter((b) => b.count > 0);
      const { dice, commit } = diceFrom(next);
      const { line } = rollLoot(next, valuesFor(next, extra), dice.abilities, dice.effects);
      next.streams = commit();
      if (line.kind === 'item') {
        receive(next, line);
        events.push({ type: 'gutted', fish, item: line.id, alt: line.alt });
        if (line.polished) events.push({ type: 'polished' });
      } else events.push({ type: 'gutted', fish });
      break;
    }
    default:
      return { state, events: [] };
  }
  delete next.lit[id];
  startCooldown(next, id);
  levelUp(next, levelBefore, events);
  return { state: next, events };
}

/**
 * Into the bucket, stacked with an identical twin (D50), unless it's full
 * (D57); into the book (R4.2).
 * @param {GameState} state
 * @param {PoolFish} fish
 * @param {number} bucketSize
 */
function catchFish(state, fish, bucketSize) {
  const { tries, ...instance } = fish;
  // Caught either way: the book and the XP count it. A full bucket holds it
  // back until the player lets one go (D59).
  if (fishInBucket(state) >= bucketSize) state.pendingCatch = instance;
  else addToBucket(state, instance);

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

/** @param {GameState} state */
export function fishInBucket(state) {
  return state.bucket.reduce((n, b) => n + b.count, 0);
}

/**
 * @param {GameState} state
 * @param {import('./fish.js').FishInstance} fish
 */
function addToBucket(state, fish) {
  const twin = state.bucket.find((b) => sameFish(b.fish, fish));
  if (twin) twin.count++;
  else state.bucket.push({ fish, count: 1 });
}

/**
 * The player lets a fish go to make room (D59): the one just caught, or one
 * from the bucket, which the new one then replaces. The fish goes back into
 * the water here, into the pool of fish that can be met again (R3.6).
 * @param {GameState} state
 * @param {number | 'new'} choice  An index into the bucket, or 'new'.
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function releaseFish(state, choice) {
  if (!state.pendingCatch) return { state, events: [] };
  const next = structuredClone(state);
  const caught = /** @type {import('./fish.js').FishInstance} */ (next.pendingCatch);
  let released = caught;
  if (choice !== 'new') {
    const stack = next.bucket[choice];
    if (!stack) return { state, events: [] };
    released = stack.fish;
    stack.count--;
    next.bucket = next.bucket.filter((b) => b.count > 0);
    addToBucket(next, caught);
  }
  next.pendingCatch = null;
  const key = poolKey(next);
  next.escaped[key] = [...(next.escaped[key] ?? []), { ...released, tries: 0 }];
  return { state: next, events: [{ type: 'released', fish: released }] };
}

/**
 * An item comes to the player: into the bags, or, with a second treasure to
 * choose from (Fence), waiting for the player to keep one. Polish is used up
 * by the junk it turned (D106). Changes `state` in place.
 * @param {GameState} state
 * @param {ItemLine} line
 */
function receive(state, line) {
  if (line.polished) state.buffs = state.buffs.filter((b) => b.source !== 'polish');
  if (line.alt) state.pendingTreasure = [line.id, line.alt];
  else takeItem(state, line.id);
}

/**
 * Into the bags, counted as found, with its XP. Changes `state` in place.
 * @param {GameState} state
 * @param {string} id
 */
function takeItem(state, id) {
  addToBags(state, id);
  state.found[id] = (state.found[id] ?? 0) + 1;
  state.character.xp += content.items[id].xp ?? 0;
}

/**
 * The player keeps one of two treasures (Fence, D106). The other goes back
 * into the water, not found, so a unique one can come up again.
 * @param {GameState} state
 * @param {string} id
 * @returns {{ state: GameState, events: GameEvent[] }}  The same state if `id` isn't on offer.
 */
export function chooseTreasure(state, id) {
  if (!state.pendingTreasure?.includes(id)) return { state, events: [] };
  const next = structuredClone(state);
  const levelBefore = levelFor(next.character.xp);
  next.pendingTreasure = null;
  takeItem(next, id);
  /** @type {GameEvent[]} */
  const events = [{ type: 'kept', item: id }];
  levelUp(next, levelBefore, events);
  return { state: next, events };
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
 * One bait used up from the stack in the bait slot; the slot empties with the
 * last one (D39, D83).
 * @param {GameState} state
 * @returns {string} The bait's id.
 */
function useBait(state) {
  const stack = /** @type {{ id: string, count: number }} */ (state.equipped.bait);
  stack.count--;
  if (stack.count <= 0) state.equipped.bait = null;
  return stack.id;
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
  // Cooldowns that count time run down with them (D96).
  state = tickCooldowns(state, ms);
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
