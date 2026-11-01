// @ts-check
// One cast, from throwing the line to the outcome (docs/spec.md, R2).
//
// The engine has no clock: every step is given `now` (milliseconds, from
// whatever clock the caller uses), so a test can play a whole cast in a few
// lines and the scene can drive it from its frame ticker. Nothing here waits
// for an animation - the scene animates whatever phase the cast is in.
//
//   idle --cast--> waiting --(time)--> bite --react--> done
//                     |                  `--(too late)--> done (escaped)
//                     `--react (too early)--> done (pulled out)

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
 * @property {{ label: string, value: number }[]} mods  Named additions.
 * @property {number} total
 * @property {boolean} visible  Shown to the player (R5.1).
 *
 * @typedef {Object} Outcome
 * @property {'caught' | 'escaped' | 'missed' | 'too-early'} result
 *   caught/escaped: the roll beat the fish or didn't; missed: no strike in
 *   time; too-early: struck before the bite and pulled the line out.
 * @property {number} [reactionMs]
 * @property {Grade} [grade]
 * @property {Roll[]} rolls
 *
 * @typedef {{ phase: 'idle' }
 *   | { phase: 'waiting', castAt: number, biteAt: number }
 *   | { phase: 'bite', castAt: number, biteAt: number }
 *   | { phase: 'done', castAt: number, biteAt: number, outcome: Outcome }} Cast
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
    return { ...cast, phase: 'done', outcome: { result: 'missed', grade: 'late', rolls: [] } };
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
 *
 * `fish.difficulty` is what the roll must reach. Until the engine proper
 * exists (Phase 2), the trial passes a fixed number.
 * @param {Cast} cast
 * @param {number} now
 * @param {Dice} dice
 * @param {{ skill: number, difficulty: number }} fish
 * @param {typeof TIMING} [timing]
 * @returns {Cast}
 */
export function strike(cast, now, dice, { skill, difficulty }, timing = TIMING) {
  cast = tickCast(cast, now, timing);
  if (cast.phase === 'waiting') {
    return { ...cast, phase: 'done', outcome: { result: 'too-early', rolls: [] } };
  }
  if (cast.phase !== 'bite') return cast;

  const reactionMs = now - cast.biteAt;
  const { grade, modifier } = gradeReaction(reactionMs, timing);
  const result = dice.roll20();
  const mods = [{ label: 'skill', value: skill }];
  if (modifier !== 0) mods.push({ label: `${grade} reaction`, value: modifier });
  const total = result + mods.reduce((sum, m) => sum + m.value, 0);
  // A natural 20 always lands the fish, as in the prototype.
  const caught = result === 20 || total >= difficulty;
  /** @type {Roll} */
  const roll = { kind: 'fishing', die: 'd20', result, mods, total, visible: true };
  return {
    ...cast,
    phase: 'done',
    outcome: { result: caught ? 'caught' : 'escaped', reactionMs, grade, rolls: [roll] },
  };
}
