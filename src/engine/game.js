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
import { bendFish, fishWeight, rollFish, sameFish } from './fish.js';
import { featureAt, partFish, swimOff, updateFeatures, waterAt } from './features.js';
import { TIMING, fightStrike, startCast, strike, tickCast } from './cast.js';
import { diceFrom, levelFor } from './state.js';
import { equippedIds } from './equipment.js';
import { afterCast, arrive } from './events.js';
import { hasPerk, levelUp, perkSources } from './perks.js';
import { LIGHTS, abilityStatus, spendCooldownCasts, startCooldown, tickCooldowns } from './abilities.js';
import { clock } from './time.js';
import { learn, noticeSpots, openByFragments, placeOpen, spotKnown } from './knowledge.js';
import { stepTime } from './passage.js';
import { conditionSources } from './conditions.js';
import { startDive } from './dive.js';
import { aimedAt, driftPool, joinPool, lookUnderwater, tended } from './pool.js';
import { waterNow } from './spawning.js';
import { conserve, tankMeals } from './barter.js';
import { championAt, championClass, championSources, championsHere, findChampion, poolKey, removeChampion, updateChampions } from './champions.js';

export { poolKey };

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
 * @property {number[]} [dropped]  With advantage or disadvantage, the dice that didn't count (D95).
 * @property {{ label: string, value: number }[]} mods
 * @property {number} total
 * @property {boolean} visible
 *
 * @typedef {{ kind: 'item', id: string, alt?: string, polished?: boolean, stolen?: boolean }} ItemLine  An item;
 *   `alt`: a second treasure to choose from (Fence), `polished`: junk that Polish made treasure (D106),
 *   `stolen`: a Rogue takes it as it comes up (D114).
 *
 * @typedef {{ kind: 'fish', fish: PoolFish, required: number, fishNatural?: number, seenBefore: boolean, fromPool: boolean,
 *     rift?: boolean, carried?: ItemLine, knighted?: boolean, twin?: boolean,
 *     player: { mods: { label: string, value: number }[], vantage: number, stacks?: boolean, natural?: number } }
 *   | ItemLine
 *   | { kind: 'empty', reason: 'nothing' }} Line  `rift`: from the spot's rift table (D104); `carried`: a
 *   Greedy fish's catch (D106); `knighted`: a Knight gave the fish advantage (D114).
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
 *   featureChance?: number,
 *   timeSlip?: boolean,
 *   reeledIn?: boolean,
 *   recast?: boolean,
 *   feature?: { id: string, born: number } | null,
 *   champion?: { class: string, born: number } | null,
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
  // What the class always brings (R19.1).
  const classEffects = content.classes[state.character.classId]?.effects;
  if (classEffects) sources.push({ label: state.character.classId, effects: classEffects });
  for (const id of equippedIds(state)) {
    const effects = content.items[id]?.effects;
    if (effects) sources.push({ label: id, effects });
  }
  for (const buff of state.buffs) sources.push({ label: buff.id, effects: buff.effects });
  // Class fish on this spot (D114).
  sources.push(...championSources(state));
  // An adjustable line, set to a depth (D148).
  sources.push(...depthSources(state));
  const values = deriveValues(state.character.stats, [...sources, ...extra]);
  // The cold and the night (R19.2, R19.3), which depend on the warmth the rest gives.
  const conditions = conditionSources(state, values.flat.warmth);
  return conditions.length ? deriveValues(state.character.stats, [...sources, ...conditions, ...extra]) : values;
}

/** The four depths fish keep to (D136), top to bottom. */
export const DEPTHS = /** @type {const} */ (['surface', 'upper', 'lower', 'bottom']);

/**
 * Is the line in the line slot one whose depth can be set (D148)?
 * @param {GameState} state
 */
export function lineAdjustable(state) {
  const line = state.equipped.line;
  return Boolean(line && content.items[line.id]?.adjustable);
}

/**
 * What an adjustable line set to a depth gives (D148): Fish Find for that
 * depth's fish, less for the others', and at the bottom a chance of something
 * that isn't a fish. Nothing without the line, or with no depth set.
 * @param {GameState} state
 * @returns {import('./values.js').Source[]}
 */
export function depthSources(state) {
  const depth = state.lineDepth;
  if (!depth || !lineAdjustable(state)) return [];
  const rules = content.rules.depth;
  /** @type {import('./values.js').Effect[]} */
  const effects = DEPTHS.map((d) => ({ value: `${d}FishFind`, add: d === depth ? rules.chosen : rules.others }));
  if (depth === 'bottom' && rules.bottomNonFish) effects.push({ value: 'nonFishChance', add: rules.bottomNonFish });
  return [{ label: `depth-${depth}`, effects }];
}

/**
 * The player sets their adjustable line's depth (D148), or clears it. Not
 * while the line is out (the page checks), as with equipment (D83).
 * @param {GameState} state
 * @param {typeof DEPTHS[number] | null} depth
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function setLineDepth(state, depth) {
  if (!lineAdjustable(state) || (depth !== null && !DEPTHS.includes(depth)) || state.lineDepth === depth) return { state, events: [] };
  return { state: { ...state, lineDepth: depth }, events: [{ type: 'depth-set', depth }] };
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
    // Not a game value: without it a manoeuvre would never run out (D141).
    fightMs: TIMING.fightMs,
  };
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
  // No water in town (R17.1).
  if (content.locations[state.location]?.town) {
    return { state, cast: /** @type {GameCast} */ ({ phase: 'idle' }), checkpoint: state, events: [{ type: 'no-water' }] };
  }
  // No rod, no cast (D83). The line and the bobber are optional.
  if (!state.equipped.rod) {
    return { state, cast: /** @type {GameCast} */ ({ phase: 'idle' }), checkpoint: state, events: [{ type: 'no-rod' }] };
  }
  // The fish under the surface here, stocked or topped up if it's time (D139).
  state = tended(state);
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
  // Cooldowns started since the last line count from this one (D96).
  for (const [id, { pending, ...cd }] of Object.entries(checkpoint.cooldowns)) checkpoint.cooldowns[id] = cd;
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
    if (dice.scatter.getRandomNumber(1, 100) <= values.flat.wildCast) {
      // Way off target, wherever it was aimed (D85); more often under
      // Gravitational Chaos (D114).
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
  // A class fish first (D114): cast by one, and it's on the line for certain.
  const champion = championAt(championsHere(next), landing);
  const hit = champion ? null : featureAt(next.features, landing);
  const feature = hit ? content.features[hit.id] : null;
  let lineValues = values;
  if (champion) {
    lineValues = valuesFor(state, [...lineExtra, { label: champion.class, effects: [{ value: 'biteCertain', add: 1 }] }]);
    events.push({ type: 'champion-hit', fish: champion.fish });
  } else if (hit && feature) {
    // A school or a big fish is as many as its fish in the pool (D156); anything else is used once more.
    if (!feature.fish) hit.uses--;
    lineValues = valuesFor(state, [...lineExtra, { label: feature.id, effects: feature.effects ?? [] }]);
    events.push({ type: 'feature-hit', feature: feature.id });
  }
  // A cast that lands on a shadow is after that very fish (D156).
  const aimed = champion || hit ? null : aimedAt(next, landing);
  if (aimed) events.push({ type: 'shadow-hit' });
  const { line, rolls } = rollLine(next, lineValues, dice, feature, hit, champion, aimed);
  // A Rogue on the spot may steal what comes up, anything but junk (D114).
  if (line.kind === 'item' && content.items[line.id]?.category !== 'junk' && lineValues.flat.stealChance > 0) {
    if (dice.champions.roll100() <= lineValues.flat.stealChance) line.stolen = true;
  }
  for (const roll of rolls) roll.visible = rollShown(state, lineValues, roll.kind);

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
    featureChance: values.flat.featureChance,
    // A strange fish's stew buff: now and then a cast takes no time (R19.4).
    ...(values.flat.timeSlip > 0 && dice.effects.roll100() <= values.flat.timeSlip ? { timeSlip: true } : {}),
    extra,
    feature: hit ? { id: hit.id, born: hit.born } : null,
    champion: champion ? { class: champion.class, born: champion.born } : null,
    ...(recast ? { recast: true } : {}),
  };
  next.streams = commit();
  return { state: next, cast, checkpoint, events };
}

/** The game value that reveals each kind of hidden roll (R5.2, D107). */
const REVEALS = /** @type {Record<string, string>} */ ({ resistance: 'revealResistance', bite: 'revealBite', treasure: 'revealTreasure' });

/**
 * Does the player see this kind of roll? From the level in rules/levels.json,
 * or a perk or item that reveals it (R5.2, D107). The fishing d20 always shows.
 * @param {GameState} state
 * @param {Values} values
 * @param {string} kind
 */
export function rollShown(state, values, kind) {
  const from = content.rules.levels.reveal?.[kind];
  return (from !== undefined && levelFor(state.character.xp) >= from) || (values.flat[REVEALS[kind]] ?? 0) > 0;
}

/**
 * What is on the line (R3), all rolled now and hidden (D63). Takes a fish from
 * the escaped pool out of `state` (a copy the caller owns) if one comes back.
 * @param {GameState} state
 * @param {Values} values
 * @param {Record<string, Dice>} dice
 * @param {any} [feature]  The surface feature the cast landed in, from content.
 * @param {import('./features.js').Feature | null} [hit]  That feature on the water: a school's fish and a big
 *   fish are the pool's, marked as its own (D156).
 * @param {import('./champions.js').Champion | null} [champion]  The class fish cast by (D114).
 * @param {PoolFish | null} [aimed]  The pool fish whose shadow the cast landed on (D156).
 * @returns {{ line: Line, rolls: Roll[] }}
 */
function rollLine(state, values, dice, feature = null, hit = null, champion = null, aimed = null) {
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
  // Fish Find by depth (D137, D148): the same roll checked for each depth,
  // each with its own bonus (and otherFishFind for all but the bottom); only
  // fish whose check passes can bite. With no bonuses the checks are one, and
  // nothing else is drawn.
  /** @param {number} bonus */
  const bites = (bonus) => certain > 0 || (certain === 0 && biteRoll + fishFind.total + bonus >= loc.biteThreshold);
  const depthBites = {
    surface: bites(values.flat.surfaceFishFind + values.flat.otherFishFind),
    upper: bites(values.flat.upperFishFind + values.flat.otherFishFind),
    lower: bites(values.flat.lowerFishFind + values.flat.otherFishFind),
    bottom: bites(values.flat.bottomFishFind),
  };
  const allBite = Object.values(depthBites).every(Boolean);
  /** @param {string} species */
  const canBite = (species) => depthBites[/** @type {keyof typeof depthBites} */ (content.fish[species]?.swims ?? 'lower')] ?? depthBites.lower;
  // Set to the bottom, now and then a bite is something else (D148); drawn only then.
  // Never in place of a fish that is certain: a summoned one, a class fish cast by (D96, D114).
  const nonFish = values.flat.nonFishChance > 0 && dice.line.roll100() <= values.flat.nonFishChance && certain <= 0;
  if (Object.values(depthBites).some(Boolean) && !nonFish) {
    // A fish that got away here may come back: the more there are, the likelier (R3.6).
    const key = poolKey(state);
    // The pool's own fish; a school's and a big fish are theirs, and come up only when cast at (D156).
    const pool = (state.escaped[key] ?? []).filter((f) => f.of === undefined && canBite(f.species));
    /** @param {PoolFish} one  Out of the pool, onto the line. */
    const take = (one) => {
      state.escaped[key] = (state.escaped[key] ?? []).filter((f) => f !== one);
      return one;
    };
    /**
     * A pool fish as it fights this cast: the cast's difficulty and XP values count for it as for a fish
     * rolled now (D157). `plain`: what it goes back into the pool as if it gets away.
     * @param {PoolFish} one
     * @returns {PoolFish}
     */
    const onLine = (one) => {
      const harder = value('fishDifficulty').total;
      const xp = value('fishXp').total;
      if (!harder && !xp) return one;
      return { ...one, difficulty: one.difficulty + harder, xp: Math.max(one.xp + harder + xp, 1), plain: { difficulty: one.difficulty, xp: one.xp } };
    };
    /** @type {PoolFish | null} */
    let fish = null;
    let fromPool = false;
    let rift = false;
    if (champion) {
      // A class fish isn't the pool's: it holds its spot, and stays there if pulled out too early (D114).
      fish = canBite(champion.fish.species) ? champion.fish : null;
    } else if (feature?.fish) {
      // A school or a big fish: one of its own fish, if one bites at this depth; no other.
      const theirs = hit ? (state.escaped[key] ?? []).filter((f) => f.of === hit.born && canBite(f.species)) : [];
      if (theirs.length) {
        fish = onLine(take(theirs.length === 1 ? theirs[0] : theirs[dice.line.getRandomNumber(0, theirs.length - 1)]));
        fromPool = true;
      }
    } else if (aimed && canBite(aimed.species)) {
      // Fishing where the fish are: the one whose shadow the bobber landed on (D156).
      fish = onLine(take(aimed));
      fromPool = true;
    } else {
      // Recall brings back one the player has met, if there is one (D139).
      const met = values.flat.fromPool > 0 ? pool.filter((f) => !f.wild) : [];
      // Rift Fishing: now and then, the spot's rift table instead (D104, D106).
      const riftChance = values.flat.riftChance * (values.flat.riftDoubled > 0 ? 2 : 1);
      const riftTable = !met.length && riftChance > 0 && dice.line.roll100() <= riftChance ? locationTable(where, 'rift', { moment: momentOf(state) }) : [];
      rift = riftTable.length > 0;
      // The fish that bites lives here, mostly (D157): the pool's own, by how full the pool is; a passer-by
      // from the spot's table fills the gap, so a thin pool gives other fish, not fewer.
      const size = state.pools?.[key]?.size ?? pool.length;
      const share = content.rules.pool.fromPool * Math.min(1, size > 0 ? pool.length / size : 0);
      if (met.length) {
        fish = onLine(take(met[dice.line.getRandomNumber(0, met.length - 1)]));
        fromPool = true;
      } else if (!rift && pool.length > 0 && dice.line.roll100() <= share) {
        // Which of them: any, or with a size shift (a big bait, a perk) the bigger or the smaller the likelier.
        const shift = value('fishSizeBand').total;
        const bands = content.rules['size-bands'].bands.length;
        const one = pick(pool.map((f) => ({ fish: f, weight: shift > 0 ? (f.band + 1) ** shift : shift < 0 ? (bands - f.band) ** -shift : 1 })), dice.line);
        if (one) {
          fish = onLine(take(one.fish));
          fromPool = true;
        }
      }
      const table = rift ? riftTable : locationTable(where, 'fish', { moment: momentOf(state) });
      if (!fish) {
        const species = pick(allBite ? table : table.filter((e) => canBite(/** @type {string} */ (e.id))), dice.line);
        if (species) {
          fish = rollFish(
            /** @type {string} */ (species.id),
            {
              fishSizeBand: value('fishSizeBand').total,
              fishDifficulty: value('fishDifficulty').total,
              fishXp: value('fishXp').total,
            },
            dice.line,
            { condition: dice.condition },
          );
        }
      }
    }
    if (fish) {
      // The fish's resistance: its own d20 on top of its difficulty (R3.5).
      // roll20Kept is roll20 from the same draws, saying which dice didn't count (D95).
      // A Knight on the spot comes to its aid, now and then: advantage (D114).
      const chance = values.flat.fishAdvantageChance;
      const knighted = chance > 0 && dice.champions.roll100() <= chance;
      const kept = dice.line.roll20Kept(value('fishVantage').total + (knighted ? 1 : 0));
      // A Cleric on the spot adds to every fish's roll; a Rogue to its own (D114).
      const mods = [{ label: 'difficulty', value: fish.difficulty }];
      if (values.flat.fishResistance) mods.push({ label: 'cleric', value: values.flat.fishResistance });
      const own = champion ? championClass(champion.class).resistance ?? 0 : 0;
      if (own) mods.push({ label: champion?.class ?? '', value: own });
      const required = kept.result + mods.reduce((sum, m) => sum + m.value, 0);
      rolls.push({
        kind: 'resistance',
        die: 'd20',
        result: kept.result,
        ...(kept.dropped !== undefined ? { dropped: kept.dropped } : {}),
        mods,
        total: required,
        visible: false,
      });
      // Greedy Fish: something caught on it, rolled as a cast that brought up no fish (D106).
      /** @type {ItemLine | null} */
      let carried = null;
      if (values.flat.greedyChance > 0 && dice.line.roll100() <= values.flat.greedyChance) {
        const loot = rollLoot(state, values, dice.line, dice.effects, null, rolls).line;
        if (loot.kind === 'item') carried = loot;
      }
      // A stew buff: an identical twin comes up with it, now and then (R19.4).
      const twin = values.flat.twinChance > 0 && dice.line.roll100() <= values.flat.twinChance;
      const skill = value('fishingSkill');
      const fight = fightFor(state, values, fish, dice.fight);
      const playerMods = skill.mods.map((m) => (m.label === 'stat' ? { ...m, label: 'skill' } : m));
      // The Rogue shows off on a fish that makes its move (D141).
      if (fight?.manoeuvre && values.flat.manoeuvreBonus) playerMods.push({ label: 'showmanship', value: values.flat.manoeuvreBonus });
      return {
        line: {
          kind: 'fish',
          fish,
          ...(twin ? { twin } : {}),
          required,
          fishNatural: kept.result,
          // A fish the pool was stocked with is new to the player, unless the wizard has looked at it (D139).
          seenBefore: Boolean(champion) || (fromPool && (!fish.wild || (fish.looks ?? 0) > 0)),
          fromPool,
          ...(rift ? { rift } : {}),
          ...(carried ? { carried } : {}),
          ...(knighted ? { knighted } : {}),
          ...(fight ? { fight } : {}),
          player: {
            mods: playerMods,
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
 * an event that starts on arriving may start. A location an event holds the
 * player at can't be left (R10.8, 7.6), except from the ?dev bench.
 * @param {GameState} state
 * @param {string} location
 * @param {string} spot
 * @param {{ force?: boolean }} [options]
 * @returns {{ state: GameState, events: GameEvent[], error?: string }}
 */
export function travel(state, location, spot, { force = false } = {}) {
  if (state.location === location && state.spot === spot) return { state, events: [] };
  if (state.locked && location !== state.locked && !force) return { state, events: [], error: 'locked' };
  // A choice the player owes is made where it came up (D59, D106).
  if (state.pendingCatch || state.pendingTreasure) return { state, events: [], error: 'choiceWaiting' };
  // Only to a location on the map (8.2).
  if (!placeOpen(state, location) && !force) return { state, events: [], error: 'unknownPlace' };
  // Only to a spot the player knows of (R11.8); the bench goes anywhere.
  if (!spotKnown(state, location, spot) && !force) return { state, events: [], error: 'unknownSpot' };
  // A lit ability acts on a fish at the spot it lit up; it goes dark here, as
  // it does when the next line goes out (D96).
  const next = structuredClone(state);
  // The schools and big fish stay behind, and their fish go from the pool with them (D156).
  partFish(next);
  Object.assign(next, { location, spot, features: [], lit: {} });
  // Back in the room: what happened in the aquarium meanwhile (D152).
  const meals = content.locations[location]?.town && spot === 'room' ? tankMeals(next) : [];
  return { state: next, events: [...meals, ...arrive(next)] };
}

/**
 * What the fish's preferences are checked against as the line goes out (D101).
 * @param {GameState} state
 * @returns {import('./tables.js').Moment}
 */
export function momentOf(state) {
  const bait = state.equipped.bait ? content.items[state.equipped.bait.id]?.bait ?? null : null;
  // The water too, for who is spawning (D149).
  return { weather: state.weather, partOfDay: clock(state.time).partOfDay, bait, ...waterNow(state) };
}

/**
 * No fish: treasure when d100 - Treasure Find is at or under the threshold;
 * if not, stuff when another d100 - Stuff Find is at or under the stuff
 * threshold (R19.1, D125); else junk (R3.4). Also what a gutted fish had
 * swallowed (D96).
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
  } else {
    // Not treasure: the white things used for something, or junk (R19.1, D125).
    const stuffFind = applyValue(values, 'stuffFind', effectDice);
    const stuffRoll = lootDice.roll100();
    rolls.push({
      kind: 'stuff',
      die: 'd100',
      result: stuffRoll,
      mods: stuffFind.mods.map((m) => ({ ...m, value: -m.value })),
      total: stuffRoll - stuffFind.total,
      visible: false,
    });
    if (!feature?.junk && stuffRoll - stuffFind.total <= (loc.stuffThreshold ?? 0)) {
      const stuff = pick(locationTable(where, 'stuff', { found: state.found }), lootDice);
      if (stuff?.id) return { line: { kind: 'item', id: stuff.id }, rolls };
      // Nothing left to find here: junk instead.
    }
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
    // Refused (an event opened on the missed splash): no line went out, so the log doesn't say one did.
    return recast.cast.phase === 'idle' ? recast : { ...recast, events: [{ type: 'recast' }, ...recast.events] };
  }
  return { state, cast: next, events: [] };
}

/**
 * How a fish on the line fights (D141): its style's tilt by how it is struck,
 * and, now and then, its manoeuvre, rolled now and hidden like the rest of
 * the line (D63). None when the fish are calmed. Draws only from `fight`,
 * and only for a fish with a style.
 * @param {GameState} state
 * @param {Values} values
 * @param {PoolFish} fish
 * @param {Dice} dice
 * @returns {{ style: string, tilt: { fast?: number, ok?: number, bad?: number }, throwsOn?: number, manoeuvre?: { delay: number } } | null}
 */
function fightFor(state, values, fish, dice) {
  const species = content.fish[fish.species];
  const rules = content.rules['fight-styles'];
  const style = rules?.styles.find((/** @type {{ id: string }} */ s) => s.id === species?.fights);
  if (!style || values.flat.calmFish > 0) return null;
  const line = state.equipped.line ? 0 : style.withoutLine ?? 0;
  /** @type {{ fast?: number, ok?: number, bad?: number }} */
  const tilt = {};
  for (const grade of /** @type {const} */ (['fast', 'ok', 'bad'])) {
    const n = (style[grade] ?? 0) + line;
    if (n) tilt[grade] = n;
  }
  const chance = species.fighter ? rules.fighterChance : rules.manoeuvreChance;
  const moves = dice.roll100() <= chance;
  return {
    style: style.id,
    tilt,
    ...(style.throwsOn ? { throwsOn: style.throwsOn } : {}),
    ...(moves ? { manoeuvre: { delay: dice.getRandomNumber(rules.delay.min, rules.delay.max) } } : {}),
  };
}

/**
 * The player strikes. During the pause after a missed splash, a strike pulls
 * the line out instead (D64). A fish the roll has landed may make its
 * manoeuvre first: the cast goes to `fight`, and the next strike answers it (D141).
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
  if (cast.phase === 'fight') {
    const next = /** @type {GameCast} */ (fightStrike(cast, now, cast.timing));
    return next.phase === 'done' ? resolveCast(state, next) : { state, cast: next, events: [] };
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
          ...(line.fight ? { tilt: line.fight.tilt, throwsOn: line.fight.throwsOn } : {}),
        }
      : null;
  const { dice, commit } = diceFrom(state);
  const next = /** @type {GameCast} */ (strike(cast, now, dice.fishing, opponent, cast.timing));
  if (next.phase !== 'done') return { state, cast: next, events: [] };
  // Landed by the roll, but it makes its move first (D141).
  const move = line.kind === 'fish' ? line.fight?.manoeuvre : undefined;
  if (move && next.outcome.result === 'caught') {
    const { endedAt, outcome, ...rest } = next;
    const fighting = /** @type {GameCast} */ ({ ...rest, phase: 'fight', fightAt: now + move.delay, held: outcome });
    return { state: { ...state, streams: commit() }, cast: fighting, events: [] };
  }
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
  // The class fish it went out to (D114).
  const champion = findChampion(next, cast.champion);
  const water = waterAt(next.location, next.spot);
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
    if (line.knighted && (result === 'caught' || result === 'escaped')) {
      const knight = championsHere(next).find((c) => c.class === 'knight');
      if (knight) events.push({ type: 'champion-knight', fish: knight.fish });
    }
    if (result === 'caught') {
      catchFish(next, fish, cast.bucketSize);
      // A Greedy fish is named so in the log, not in the bucket (D106).
      const shown = line.carried ? { ...fish, greedy: true } : fish;
      events.push({ type: 'caught', fish: shown, roll: cast.outcome.rolls[0], required: line.required, seenBefore: line.seenBefore });
      if (line.rift) events.push({ type: 'rift', fish });
      if (line.twin && !champion) {
        catchFish(next, fish, cast.bucketSize);
        events.push({ type: 'twin', fish });
      }
      if (line.carried) {
        receive(next, line.carried);
        events.push({ type: 'greedy', item: line.carried.id, alt: line.carried.alt });
        if (line.carried.polished) events.push({ type: 'polished' });
      }
      if (champion) {
        // Its hold on the spot ends; a Rogue gives up what it stole (D114).
        removeChampion(next, champion);
        next.book.champions = { ...next.book.champions, [champion.class]: (next.book.champions?.[champion.class] ?? 0) + 1 };
        events.push({ type: 'champion-caught', fish });
        for (const id of champion.stolen ?? []) {
          takeItem(next, id);
          events.push({ type: 'champion-recovered', item: id });
        }
      }
      if (next.pendingCatch) events.push({ type: 'bucket-full' });
      else light(next, 'caught', fish, events);
      if (next.equipped.bait) {
        if (dice.bait.roll100() <= cast.bait.recovery) events.push({ type: 'bait-saved', bait: next.equipped.bait.id });
        else events.push({ type: 'bait-eaten', bait: useBait(next), fish });
      }
    } else if (result === 'escaped' || result === 'missed') {
      // Met now: no longer one of the pool's wild fish (D139). Back in the water it is as it was, without
      // this cast's values (D157).
      const { wild, plain, ...asCaught } = fish;
      const met = { ...asCaught, ...plain };
      const escaped = { ...met, tries: (fish.tries ?? 0) + 1 };
      events.push({ type: result, fish, roll: cast.outcome.rolls[0], required: line.required, ...(cast.outcome.thrown ? { thrown: true } : {}) });
      const def = hit ? content.features[hit.id] : null;
      if (champion) {
        // A class fish stays where it is, and is met again there (D114).
        champion.fish = escaped;
      } else {
        // Back into the pool, where the bobber was. A school's fish is still the school's. A big fish swims
        // off somewhere else and can be tried again, the same fish (D85); after its last escape it is on its
        // own, a fish of the pool like any other (D156).
        const theirs = hit && fish.of === hit.born;
        const { of, ...own } = escaped;
        if (theirs && def?.swimsOff && (hit.swamOff ?? 0) < def.swimsOff) {
          swimOff(hit, def, dice.features, waterAt(next.location, next.spot));
          events.push({ type: 'feature-moved', feature: hit.id });
          joinPool(next, escaped);
        } else joinPool(next, theirs && !def?.swimsOff ? escaped : own, cast.landing);
        light(next, 'got-away', escaped, events);
      }
      // Seen, if not landed: known of here (R4.5).
      if (result === 'escaped') learn(next, next.location, 'fish', fish.species, 'heard');
      if (next.equipped.bait && dice.bait.roll100() <= cast.bait.escapeLoss) {
        events.push({ type: 'bait-lost', bait: useBait(next), fish });
      }
    } else if (result === 'too-early') {
      // It never bit: a fish from the pool goes back, untouched.
      if (line.fromPool) {
        const key = poolKey(next);
        const { plain, ...asCaught } = fish;
        next.escaped[key] = [...(next.escaped[key] ?? []), { ...asCaught, ...plain }];
      }
      events.push({ type: 'too-early' });
    }
  } else if (result === 'landed') {
    const rogue = line.kind === 'item' && line.stolen ? championsHere(next).find((c) => c.stolen) : null;
    if (line.kind === 'item' && rogue) {
      // The Rogue has it, and the player gets it back by catching it (D114).
      rogue.stolen = [...(rogue.stolen ?? []), line.id, ...(line.alt ? [line.alt] : [])];
      events.push({ type: 'champion-stole', fish: rogue.fish, item: line.id, alt: line.alt });
    } else if (line.kind === 'item') {
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
    if (hit && !content.features[hit.id].fish) hit.uses++;
    events.push(...updateFeatures(next, dice.features, { appear: false }));
    events.push(...updateChampions(next, dice.champions, water, { moveOnly: true }));
    driftPool(next, dice.pool);
    next.streams = commit();
    return { state: next, cast, events };
  }

  if (result === 'missed' && next.missStreak >= MISS_LIMIT) {
    events.push({ type: 'reeled-in' });
    cast = { ...cast, reeledIn: true };
  }

  levelUp(next, levelBefore, events);

  // Casts here count towards noticing another spot (R11.8); the last map
  // fragment found opens its place (8.2).
  events.push(...noticeSpots(next));
  events.push(...openByFragments(next));
  events.push(...updateFeatures(next, dice.features, { champions: dice.champions, extraChance: cast.featureChance ?? 0, condition: dice.condition }));
  // The fish here move a little with every cast, and a shoal draws together (D157).
  driftPool(next, dice.pool);

  // Time and weather move on with every cast that went out and ended, and
  // buffs that last game time run down (R19.5); unless time slipped (R19.4).
  if (cast.timeSlip) events.push({ type: 'time-slip' });
  else events.push(...stepTime(next, dice));
  // After the weather, so a Shaman's holds (D114).
  events.push(...updateChampions(next, dice.champions, water));

  // Last, so an event sees the cast's catch and the new time (D84).
  events.push(...afterCast(next, dice.events, {
    // Two treasures to choose from start no item's event (no treasure has one yet).
    found: result === 'landed' && line.kind === 'item' && !line.alt && !line.stolen ? line.id : undefined,
    empty: result === 'landed' && line.kind === 'empty',
    fill: cast.meterFill ?? 100,
  }));

  next.streams = commit();
  return { state: next, cast, events };
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
    case 'look-underwater': {
      // The pool here, each fish looked at once more (D139).
      const looked = lookUnderwater(next);
      if (!looked.length) return { state, events: [] };
      events.push(...looked);
      break;
    }
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
      // The book holds the fish as it is now: a new record is this one, here
      // and now, where it was just caught. The only one of its kind is both.
      const entry = next.book.fish[bent.species];
      if (entry) {
        entry.totalSize += bent.size - before.size;
        if (bent.size > entry.largest.size) entry.largest = bookRecord(next, bent.size);
        const heavier = fishWeight(bent);
        if (heavier !== null && heavier > (entry.heaviest?.weight ?? -1)) entry.heaviest = { ...bookRecord(next, bent.size), weight: heavier };
        if (entry.caught === 1) entry.smallest = entry.largest;
      }
      next.character.xp += bent.xp - before.xp;
      events.push({ type: 'bent', from: before, fish: bent, xp: bent.xp - before.xp });
      break;
    }
    case 'jump-in': {
      // After the fish that just got away, under the water: the dive (R20.3, D128).
      const fish = next.lit[id]?.fish;
      const key = poolKey(next);
      const pool = next.escaped[key] ?? [];
      const i = fish ? pool.findLastIndex((f) => sameFish(f, fish)) : -1;
      if (i < 0) return { state, events: [] };
      const escapee = pool[i];
      next.escaped[key] = pool.filter((_, j) => j !== i);
      events.push(...startDive(next, escapee, extra));
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
      // Both from the abilities' stream: Gut mustn't move the casts' dice (D4).
      const { line } = rollLoot(next, valuesFor(next, extra), dice.abilities, dice.abilities);
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
  // Slow makes it longer (D114).
  startCooldown(next, id, values.cooldownFactor);
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
export function catchFish(state, fish, bucketSize) {
  const { tries, wild, looks, since, stays, x, y, of, n, plain, ...instance } = fish;
  // Caught either way: the book and the XP count it. A full bucket holds it
  // back until the player lets one go (D59).
  if (fishInBucket(state) >= bucketSize) state.pendingCatch = instance;
  else addToBucket(state, instance);

  state.book.catches++;
  learn(state, state.location, 'fish', fish.species, 'found');
  const weight = fishWeight(fish);
  const record = { ...bookRecord(state, fish.size), ...(weight !== null ? { weight } : {}) };
  const entry = state.book.fish[fish.species];
  if (!entry) {
    state.book.fish[fish.species] = { caught: 1, totalSize: fish.size, smallest: record, largest: record, heaviest: record, mostTries: tries ?? 0 };
  } else {
    // The heaviest by weight (D146): a fat fish can beat the longest.
    if (weight !== null && weight > (entry.heaviest?.weight ?? -1)) entry.heaviest = record;
    entry.caught++;
    entry.totalSize += fish.size;
    if (fish.size < entry.smallest.size) entry.smallest = record;
    if (fish.size > entry.largest.size) entry.largest = record;
    entry.mostTries = Math.max(entry.mostTries, tries ?? 0);
  }
  state.character.xp += fish.xp;
}

/**
 * A catch for the book: its size, where and when.
 * @param {GameState} state
 * @param {number} size
 */
function bookRecord(state, size) {
  return { size, location: state.location, spot: state.spot, time: state.time, weather: { season: state.weather.season, cell: state.weather.cell } };
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
  // A class fish let go is an ordinary fish now (D114).
  const { champion, ...plain } = released;
  joinPool(next, { ...plain, tries: 0 });
  return { state: next, events: [{ type: 'released', fish: released }, ...conserve(next, released)] };
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
  learn(state, state.location, 'item', id, 'found');
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
