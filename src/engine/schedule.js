// @ts-check
// When a vendor is in (R17.6): the days they work, the hours they sleep, and
// days away, drawn once per day from the seed and the vendor, so asking twice
// gives the same answer and nothing is stored (as perk offers, D96).

import { content } from '../generated/content.js';
import { createRng, deriveSeed } from '../rng.js';
import { diceFor } from '../dice.js';
import { WEEKDAYS, clock } from './time.js';

/** @typedef {'open' | 'asleep' | 'away' | 'closed'} VendorStatus */

/**
 * @param {import('./state.js').GameState} state
 * @param {string} id  A vendor in content/vendors/.
 * @returns {VendorStatus}  closed: not a day they work.
 */
export function vendorStatus(state, id) {
  const vendor = content.vendors?.[id];
  if (!vendor) return 'closed';
  const s = vendor.schedule;
  if (!s) return 'open';
  const now = clock(state.time);
  if (s.days && !s.days.includes(WEEKDAYS[now.weekday])) return 'closed';
  if (s.sleeps) {
    const h = now.hour;
    const { from, to } = s.sleeps;
    const asleep = from <= to ? h >= from && h < to : h >= from || h < to;
    if (asleep) return 'asleep';
  }
  if (s.awayChance) {
    const dice = diceFor(createRng(deriveSeed(state.seed, `away:${id}:${now.dayIndex}`)));
    if (dice.roll100() <= s.awayChance) return 'away';
  }
  return 'open';
}
