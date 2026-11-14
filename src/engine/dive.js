// @ts-check
// The Fighter's dive (R20.3, D128): Jump In takes the player under the water,
// where the fish that got away swims with a few others from the spot. Each
// can be struck once, for its own roll: the player's d20 and skill against
// the fish's d20 and difficulty. Everything is rolled when the dive starts,
// from the `abilities` stream, so a reload can't reroll it (D63); a strike
// only shows what was rolled. The time limit is the page's, in real seconds.

import { applyValue } from './values.js';
import { locationTable, pick } from './tables.js';
import { rollFish } from './fish.js';
import { diceFrom, levelFor } from './state.js';
import { levelUp } from './perks.js';
import { catchFish, fishInBucket, momentOf, poolKey, valuesFor } from './game.js';

/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {import('./fish.js').FishInstance} FishInstance */
/** @typedef {import('./game.js').GameEvent} GameEvent */

/**
 * @typedef {Object} DiveFish  One fish swimming by, and its roll, rolled at the start.
 * @property {FishInstance} fish
 * @property {number} fishRoll  Its d20.
 * @property {number} required  Its d20 plus its difficulty: what the player needs.
 * @property {number} playerRoll  The player's d20.
 * @property {number} playerTotal  With Fishing Skill.
 * @property {boolean} caught
 * @property {boolean} struck  Struck at already: it can't be again.
 * @property {boolean} [escapee]  The fish that got away, which lit Jump In.
 *
 * @typedef {{ seconds: number, fish: DiveFish[] }} Dive
 */

/**
 * The dive begins: the fish that lit Jump In, taken out of the pool, and
 * `diveFish` - 1 others from the spot. Changes `state` in place (a copy the
 * caller owns).
 * @param {GameState} state
 * @param {FishInstance} escapee
 * @param {import('./values.js').Source[]} [extra]
 * @returns {GameEvent[]}
 */
export function startDive(state, escapee, extra = []) {
  const values = valuesFor(state, extra);
  const { dice, commit } = diceFrom(state);
  const d = dice.abilities;
  const where = { location: state.location, spot: state.spot };
  /** @type {FishInstance[]} */
  const fish = [escapee];
  const table = locationTable(where, 'fish', { moment: momentOf(state) });
  for (let i = 1; i < Math.max(1, values.flat.diveFish); i++) {
    const species = pick(table, d);
    if (!species?.id) continue;
    fish.push(
      rollFish(
        /** @type {string} */ (species.id),
        { fishSizeBand: values.flat.fishSizeBand, fishDifficulty: values.flat.fishDifficulty, fishXp: values.flat.fishXp },
        d,
      ),
    );
  }
  const skill = applyValue(values, 'fishingSkill', dice.effects).total;
  state.dive = {
    seconds: values.flat.diveSeconds,
    fish: fish.map((f, i) => {
      const fishRoll = d.roll20();
      const playerRoll = d.roll20();
      const required = fishRoll + f.difficulty;
      const playerTotal = playerRoll + skill;
      // A natural 20 lands it unless the fish's own d20 is a 20 too (D96).
      const caught = (playerRoll === 20 && fishRoll !== 20) || playerTotal >= required;
      return { fish: f, fishRoll, required, playerRoll, playerTotal, caught, struck: false, ...(i === 0 ? { escapee: true } : {}) };
    }),
  };
  state.streams = commit();
  return [{ type: 'dive-started', fish: state.dive.fish.length, seconds: state.dive.seconds }];
}

/**
 * The player strikes at one fish in the dive (R20.3): what was rolled shows,
 * and a fish caught goes in the bucket. A full bucket holds one back for the
 * player to choose (D59); any more get away.
 * @param {GameState} state
 * @param {number} index
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function diveStrike(state, index) {
  const target = state.dive?.fish[index];
  if (!target || target.struck) return { state, events: [] };
  const next = structuredClone(state);
  const levelBefore = levelFor(next.character.xp);
  const one = /** @type {DiveFish} */ (next.dive?.fish[index]);
  one.struck = true;
  /** @type {GameEvent[]} */
  const events = [];
  const roll = { player: one.playerRoll, total: one.playerTotal, fish: one.fishRoll, required: one.required };
  const full = fishInBucket(next) >= valuesFor(next).flat.bucketSize;
  if (one.caught && !(full && next.pendingCatch)) {
    catchFish(next, one.fish, valuesFor(next).flat.bucketSize);
    events.push({ type: 'dive-caught', fish: one.fish, ...roll });
    if (next.pendingCatch) events.push({ type: 'bucket-full' });
  } else {
    one.caught = false;
    events.push({ type: 'dive-escaped', fish: one.fish, ...roll });
  }
  levelUp(next, levelBefore, events);
  return { state: next, events };
}

/**
 * Out of the water: the fish that got away, if it wasn't caught, is back in
 * the pool; the others swim off.
 * @param {GameState} state
 * @returns {{ state: GameState, events: GameEvent[] }}
 */
export function endDive(state) {
  if (!state.dive) return { state, events: [] };
  const next = structuredClone(state);
  const escapee = next.dive?.fish.find((f) => f.escapee);
  if (escapee && !(escapee.struck && escapee.caught)) {
    const key = poolKey(next);
    next.escaped[key] = [...(next.escaped[key] ?? []), { ...escapee.fish, tries: 1 }];
  }
  const caught = next.dive?.fish.filter((f) => f.struck && f.caught).length ?? 0;
  next.dive = null;
  return { state: next, events: [{ type: 'dive-ended', caught }] };
}
