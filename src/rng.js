// @ts-check
// The game's only source of randomness that can affect an outcome (docs/spec.md,
// R9.1). Everything is drawn from a seed, so the same seed replays the same
// session: the same bites, the same fish, the same weather.
//
// A seed is split into independent streams by label (deriveSeed). Each stream is
// only ever drawn from by one part of the game, so drawing more from one - an
// extra size roll on a fish, say - never shifts what another one produces.
//
// Ported unchanged from SuperRollies (docs/decisions.md, D4).

/**
 * @typedef {Object} Rng
 * @property {() => number} next  Uniform in [0, 1).
 * @property {(n: number) => number} int  Uniform integer in [0, n).
 * @property {number} state  The current state, a uint32. createRng(rng.state)
 *   carries on exactly where this one left off.
 */

/**
 * Mulberry32: small, fast, and identical on every JavaScript engine (32-bit
 * integer arithmetic only).
 * @param {number} seed  Any number; only its low 32 bits are used.
 * @returns {Rng}
 */
export function createRng(seed) {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(n) {
      return Math.floor(this.next() * n);
    },
    get state() {
      return a;
    },
  };
}

/**
 * Mulberry32 as a bare `() => number`, for code that only needs the numbers.
 * @param {number} seed
 */
export function mulberry32(seed) {
  const rng = createRng(seed);
  return () => rng.next();
}

/**
 * The seed of the stream called `label` within a match seeded with `seed`.
 * FNV-1a over the label, mixed with the seed through a final avalanche so
 * nearby seeds and similar labels still give unrelated streams.
 * @param {number} seed
 * @param {string} label
 */
export function deriveSeed(seed, label) {
  let h = 0x811c9dc5;
  for (let i = 0; i < label.length; i++) {
    h = Math.imul(h ^ label.charCodeAt(i), 0x01000193);
  }
  h = (h ^ (seed >>> 0)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * A fresh seed for a new match. The one place real entropy enters the game;
 * everything after it follows from the seed.
 */
export function randomSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
