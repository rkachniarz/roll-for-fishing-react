// @ts-check
// The dice. Each one is its own named function, rolled the way a tabletop
// player would: roll20 for the fishing roll, roll2d6 for the weather's
// direction, roll100 for percentages. They are deliberately NOT folded into a
// generic roll('2d6') (docs/decisions.md, D5) - add a new die as a new function
// in the same style.
//
// The only thing that changed since the prototype: the dice draw from a seeded
// stream (src/rng.js) instead of Math.random, so a seed replays every roll.
//
//   const { roll20, roll2d6 } = diceFor(createRng(deriveSeed(seed, 'fishing')));

/** @typedef {import('./rng.js').Rng} Rng */

/**
 * The dice, bound to one random stream.
 * @param {Rng} rng
 */
export function diceFor(rng) {
  /**
   * A whole number from min to max, both included.
   * @param {number} min
   * @param {number} max
   */
  function getRandomNumber(min, max) {
    return Math.floor(rng.next() * (max - min + 1)) + min;
  }

  /**
   * A d20. Positive vantage rolls two and keeps the higher (advantage),
   * negative keeps the lower (disadvantage). Its size doesn't matter: two
   * sources of advantage are still one advantage, as in D&D.
   * @param {number} [vantage]
   */
  function roll20(vantage = 0) {
    return roll20Kept(vantage).result;
  }

  /**
   * The same d20, also saying which die didn't count, for the log to show
   * struck through: `dropped` is undefined on a straight roll.
   * @param {number} [vantage]
   * @returns {{ result: number, dropped?: number }}
   */
  function roll20Kept(vantage = 0) {
    const firstroll = getRandomNumber(1, 20);
    if (vantage === 0) return { result: firstroll };
    const secondroll = getRandomNumber(1, 20);
    const keepFirst = vantage < 0 ? firstroll <= secondroll : firstroll >= secondroll;
    return keepFirst ? { result: firstroll, dropped: secondroll } : { result: secondroll, dropped: firstroll };
  }

  function roll100() {
    return getRandomNumber(1, 100);
  }

  function roll12() {
    return getRandomNumber(1, 12);
  }

  function roll6() {
    return getRandomNumber(1, 6);
  }

  function roll2d6() {
    return getRandomNumber(1, 6) + getRandomNumber(1, 6);
  }

  return { getRandomNumber, roll20, roll20Kept, roll100, roll12, roll6, roll2d6 };
}
