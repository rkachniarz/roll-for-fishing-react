// @ts-check
// One cast, from throwing the line to the outcome (docs/spec.md, R2).
//
// The engine has no clock: every step is given `now` (milliseconds, from
// whatever clock the caller uses), so a test can play a whole cast in a few
// lines and the scene can drive it from its frame ticker. Nothing here waits
// for an animation - the scene animates whatever phase the cast is in.
//
//   idle --cast--> waiting --(time)--> bite --react--> done (caught / escaped / landed)
//                     |                  |       `--> fight --react in time--> done (caught)
//                     |                  |               `--(too early, too late)--> done (escaped: thrown)
//                     |                  `--(too late)--> done (missed)
//                     `--react (too early)--> done (pulled out)
//
// A fish that makes its manoeuvre (D141) goes to `fight` once the roll has
// landed it: the move comes at `fightAt`, and the player must react to it.
//
// Only a fish fights back with a d20; junk and treasure are landed by any
// strike in time (D64).
//
// Trap: `tickCast` checks for a late strike straight after the bite starts, in the same tick.
//  A long gap between ticks (a background tab, a late strike) would otherwise skip past a bite that
//   has already run out.

/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */

/**
 * Timings, in milliseconds. Defaults are the Phase 1 trial's starting point
 * (DEV_PLAN.md, 1.4); ?dev can override them to try others.
 */
export const TIMING = {
  /** Shortest and longest wait from the cast to the bite, flight included. */
  biteDelayMin: 2500,
  biteDelayMax: 8000,
  /** A reaction faster than this is 'fast' (+1 to the roll). */
  fastMs: 450,
  /** Faster than this (and not fast) is 'ok' (+0); slower is 'bad' (-1). */
  okMs: 900,
  /** At or past this, the fish is gone before you strike (R2.4). */
  lateMs: 3000,
  /** How long the player has to react to a fish's manoeuvre (D141). */
  fightMs: 1500,
};

/**
 * @typedef {'fast' | 'ok' | 'bad' | 'late'} Grade
 *
 * @typedef {Object} Roll
 * @property {string} kind      What the roll was for, e.g. 'fishing'.
 * @property {string} die       e.g. 'd20'.
 * @property {number} result    The die as rolled.
 * @property {number[]} [dropped]  With advantage or disadvantage, the dice that didn't count.
 * @property {boolean} [crit]   It landed the fish on its natural roll alone (D96).
 * @property {{ label: string, value: number }[]} mods  Named additions.
 * @property {number} total
 * @property {boolean} visible  Shown to the player (R5.1).
 *
 * @typedef {Object} Outcome
 * @property {'caught' | 'escaped' | 'landed' | 'missed' | 'too-early'} result
 *   caught/escaped: the roll beat the fish or didn't; landed: something that
 *   doesn't fight came up; missed: no strike in time; too-early: struck
 *   before the bite and pulled the line out.
 * @property {number} [reactionMs]
 * @property {Grade} [grade]
 * @property {Roll[]} rolls
 * @property {boolean} [thrown]  It shook the hook out: its style, or its manoeuvre (D141).
 *
 * @typedef {{ phase: 'idle' }
 *   | { phase: 'waiting', castAt: number, biteAt: number }
 *   | { phase: 'bite', castAt: number, biteAt: number }
 *   | { phase: 'fight', castAt: number, biteAt: number, fightAt: number, held: Outcome }
 *   | { phase: 'done', castAt: number, biteAt: number, endedAt: number, outcome: Outcome }} Cast
 *
 * @typedef {Object} Opponent  What the strike is up against, if it fights.
 * @property {number} difficulty  What the roll must reach.
 * @property {number} [skill]     Added to the roll, labelled 'skill'.
 * @property {{ label: string, value: number }[]} [mods]  Further named additions.
 * @property {number} [vantage]   Advantage (> 0) or disadvantage (< 0) on the d20.
 * @property {boolean} [stacks]   Every point of vantage adds a die (D96).
 * @property {number} [natural]   The lowest natural roll that lands the fish whatever the total (20).
 * @property {number} [fishNatural]  The fish's own d20: a 20 there cancels a natural catch (D96).
 * @property {{ fast?: number, ok?: number, bad?: number }} [tilt]  Its fight style, by how the player struck (D141).
 * @property {number} [throwsOn]  A natural roll this low throws the hook (D141).
 */

/** @returns {Cast} */
export function idleCast() {
  return { phase: 'idle' };
}

/**
 * Throws the line. When the fish will bite is decided now, from the dice.
 * @param {number} now
 * @param {Dice} dice
 * @param {typeof TIMING} [timing]
 * @returns {Cast}
 */
export function startCast(now, dice, timing = TIMING) {
  const delay = dice.getRandomNumber(timing.biteDelayMin, timing.biteDelayMax);
  return { phase: 'waiting', castAt: now, biteAt: now + delay };
}

/**
 * Moves the cast along with time: the bite comes, and a bite nobody strikes
 * at runs out.
 * @param {Cast} cast
 * @param {number} now
 * @param {typeof TIMING} [timing]
 * @returns {Cast}
 */
export function tickCast(cast, now, timing = TIMING) {
  if (cast.phase === 'waiting' && now >= cast.biteAt) cast = { ...cast, phase: 'bite' };
  // Checked straight after, so a long gap between ticks (a background tab, a
  // late strike) can't skip past a bite that has already run out.
  if (cast.phase === 'bite' && now - cast.biteAt >= timing.lateMs) {
    const endedAt = cast.biteAt + timing.lateMs;
    return { ...cast, phase: 'done', endedAt, outcome: { result: 'missed', grade: 'late', rolls: [] } };
  }
  // A manoeuvre nobody reacted to: the hook is thrown (D141).
  if (cast.phase === 'fight' && now - cast.fightAt >= timing.fightMs) {
    return thrownOff(cast, cast.fightAt + timing.fightMs);
  }
  return cast;
}

/**
 * The fish shakes the hook out during its manoeuvre (D141).
 * @param {Cast & { phase: 'fight' }} cast
 * @param {number} endedAt
 * @returns {Cast}
 */
function thrownOff(cast, endedAt) {
  const { fightAt, held, ...rest } = cast;
  return { ...rest, phase: 'done', endedAt, outcome: { ...held, result: 'escaped', thrown: true } };
}

/**
 * The player reacts to a fish's manoeuvre (D141): in time, the fish is
 * landed as the roll said; before it moves, the line is yanked and the hook
 * comes out.
 * @param {Cast} cast
 * @param {number} now
 * @param {typeof TIMING} [timing]
 * @returns {Cast}
 */
export function fightStrike(cast, now, timing = TIMING) {
  cast = tickCast(cast, now, timing);
  if (cast.phase !== 'fight') return cast;
  if (now < cast.fightAt) return thrownOff(cast, now);
  const { fightAt, held, ...rest } = cast;
  return { ...rest, phase: 'done', endedAt: now, outcome: held };
}

/**
 * How quick a strike was, and what it adds to the fishing roll (R2.3).
 * @param {number} reactionMs  Time from the bite to the strike.
 * @param {typeof TIMING} [timing]
 * @returns {{ grade: Grade, modifier: number }}
 */
export function gradeReaction(reactionMs, timing = TIMING) {
  if (reactionMs < timing.fastMs) return { grade: 'fast', modifier: 1 };
  if (reactionMs < timing.okMs) return { grade: 'ok', modifier: 0 };
  if (reactionMs < timing.lateMs) return { grade: 'bad', modifier: -1 };
  return { grade: 'late', modifier: 0 };
}

/**
 * The player strikes (tap, click or key).
 * @param {Cast} cast
 * @param {number} now
 * @param {Dice} dice
 * @param {Opponent | null} opponent  A fish to roll against, or null for
 *   something that doesn't fight.
 * @param {typeof TIMING} [timing]
 * @returns {Cast}
 */
export function strike(cast, now, dice, opponent, timing = TIMING) {
  cast = tickCast(cast, now, timing);
  if (cast.phase === 'waiting') {
    return { ...cast, phase: 'done', endedAt: now, outcome: { result: 'too-early', rolls: [] } };
  }
  if (cast.phase !== 'bite') return cast;

  const reactionMs = now - cast.biteAt;
  const { grade, modifier } = gradeReaction(reactionMs, timing);
  if (!opponent) {
    return { ...cast, phase: 'done', endedAt: now, outcome: { result: 'landed', reactionMs, grade, rolls: [] } };
  }
  const { difficulty, skill, mods: extra = [], vantage = 0, stacks = false, natural = 20, fishNatural, tilt, throwsOn = 0 } = opponent;
  const { result, dropped } = dice.roll20Kept(vantage, stacks);
  const mods = [...(skill !== undefined ? [{ label: 'skill', value: skill }] : []), ...extra];
  if (modifier !== 0) mods.push({ label: `${grade} reaction`, value: modifier });
  // How it fights, by how it was struck (D141).
  const fought = tilt?.[/** @type {'fast' | 'ok' | 'bad'} */ (grade)] ?? 0;
  if (fought !== 0) mods.push({ label: 'its fight', value: fought });
  const total = result + mods.reduce((sum, m) => sum + m.value, 0);
  // A natural 20 lands the fish, as in the prototype, unless the fish rolled
  // a 20 too: then the totals decide (D96).
  const crit = result >= natural && fishNatural !== 20;
  // A head-shaker throws a weak hookset, whatever the total (D141).
  const thrown = !crit && result <= throwsOn;
  const caught = crit || (!thrown && total >= difficulty);
  /** @type {Roll} */
  const roll = {
    kind: 'fishing',
    die: 'd20',
    result,
    ...(dropped !== undefined ? { dropped } : {}),
    ...(crit ? { crit: true } : {}),
    mods,
    total,
    visible: true,
  };
  return {
    ...cast,
    phase: 'done',
    endedAt: now,
    outcome: { result: caught ? 'caught' : 'escaped', reactionMs, grade, rolls: [roll], ...(thrown ? { thrown } : {}) },
  };
}
