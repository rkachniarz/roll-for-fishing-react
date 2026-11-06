// @ts-check
// One cast, from throwing the line to the outcome (docs/spec.md, R2).
//
// The engine has no clock: every step is given `now` (milliseconds, from
// whatever clock the caller uses), so a test can play a whole cast in a few
// lines and the scene can drive it from its frame ticker. Nothing here waits
// for an animation - the scene animates whatever phase the cast is in.
//
//   idle --cast--> waiting --(time)--> bite --react--> done (caught / escaped / landed)
//                     |                  `--(too late)--> done (missed)
//                     `--react (too early)--> done (pulled out)
//
// Only a fish fights back with a d20; junk and treasure are landed by any
// strike in time (D64).

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
};

/**
 * @typedef {'fast' | 'ok' | 'bad' | 'late'} Grade
 *
 * @typedef {Object} Roll
 * @property {string} kind      What the roll was for, e.g. 'fishing'.
 * @property {string} die       e.g. 'd20'.
 * @property {number} result    The die as rolled.
 * @property {number} [dropped]  With advantage or disadvantage, the die that didn't count.
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
 *
 * @typedef {{ phase: 'idle' }
 *   | { phase: 'waiting', castAt: number, biteAt: number }
 *   | { phase: 'bite', castAt: number, biteAt: number }
 *   | { phase: 'done', castAt: number, biteAt: number, endedAt: number, outcome: Outcome }} Cast
 *
 * @typedef {Object} Opponent  What the strike is up against, if it fights.
 * @property {number} difficulty  What the roll must reach.
 * @property {number} [skill]     Added to the roll, labelled 'skill'.
 * @property {{ label: string, value: number }[]} [mods]  Further named additions.
 * @property {number} [vantage]   Advantage (> 0) or disadvantage (< 0) on the d20.
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
  return cast;
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
  const { difficulty, skill, mods: extra = [], vantage = 0 } = opponent;
  const { result, dropped } = dice.roll20Kept(vantage);
  const mods = [...(skill !== undefined ? [{ label: 'skill', value: skill }] : []), ...extra];
  if (modifier !== 0) mods.push({ label: `${grade} reaction`, value: modifier });
  const total = result + mods.reduce((sum, m) => sum + m.value, 0);
  // A natural 20 always lands the fish, as in the prototype.
  const caught = result === 20 || total >= difficulty;
  /** @type {Roll} */
  const roll = { kind: 'fishing', die: 'd20', result, ...(dropped !== undefined ? { dropped } : {}), mods, total, visible: true };
  return {
    ...cast,
    phase: 'done',
    endedAt: now,
    outcome: { result: caught ? 'caught' : 'escaped', reactionMs, grade, rolls: [roll] },
  };
}
