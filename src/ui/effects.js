// @ts-check
// An effect as a tooltip line (docs/spec.md, R8.6): made from the effect
// itself, so what a tooltip says and what the item does can't disagree.
// Upsides are green and downsides red (R8.1), by which way the value is
// better for the player (values.js).
//
//   { value: 'fishingSkill', add: 2 }       "+2 Fishing Skill"        good
//   { value: 'fishingSkill', add: 'd6' }    "+d6 Fishing Skill"       good
//   { value: 'biteDelayMin', add: 500 }     "+0.5 s shortest wait…"   bad
//   { value: 'playerVantage', add: -1 }     "Disadvantage on your roll"  bad

import { t } from '../strings.js';
import { GAME_VALUES, effectSign } from '../engine/values.js';

/** @typedef {import('../engine/values.js').Effect} Effect */

/** A minus sign, not a hyphen, as in the log. */
const MINUS = '−';

/**
 * @param {number} n
 * @param {import('../engine/values.js').Unit} [unit]
 */
function amount(n, unit) {
  const sign = n < 0 ? MINUS : '+';
  const size = Math.abs(n);
  if (unit === 'ms') return `${sign}${Number((size / 1000).toFixed(2))} s`;
  if (unit === '%') return `${sign}${size}%`;
  return `${sign}${size}`;
}

/**
 * @param {Effect} effect
 * @returns {{ text: string, tone?: 'good' | 'bad' }}
 */
export function effectLine(effect) {
  const meta = GAME_VALUES[effect.value];
  const sign = effectSign(effect);
  const tone = sign > 0 ? 'good' : sign < 0 ? 'bad' : undefined;
  // Advantage reads as words, as on a D&D sheet: 2 or more is strong.
  if ((effect.value === 'playerVantage' || effect.value === 'fishVantage') && typeof effect.add === 'number') {
    const kind = effect.add > 0 ? 'Advantage' : 'Disadvantage';
    const strong = Math.abs(effect.add) >= 2 ? 'Strong' : '';
    const key = effect.value === 'fishVantage' ? `effect.fish${strong}${kind}` : `effect.${strong ? 'strong' + kind : kind.toLowerCase()}`;
    return { text: t(key), tone };
  }
  if (effect.value === 'biteCertain' && typeof effect.add === 'number' && effect.add !== 0) {
    return { text: t(effect.add > 0 ? 'effect.biteCertain' : 'effect.noFish') };
  }
  if (effect.value === 'fromPool' && typeof effect.add === 'number' && effect.add > 0) return { text: t('effect.fromPool') };
  // Values that are either on or off read as a sentence.
  const onOff = ['vantageStacks', 'riftDoubled', 'treasureChoice', 'junkToTreasure', 'revealResistance', 'revealBite', 'revealTreasure', 'revealCompletion'];
  if (onOff.includes(effect.value) && typeof effect.add === 'number' && effect.add > 0) return { text: t(`effect.${effect.value}`), tone };
  if (effect.value === 'naturalCatch' && typeof effect.add === 'number') {
    return { text: t('effect.naturalCatch', { from: (meta.base ?? 20) + effect.add }), tone };
  }
  const shown = typeof effect.add === 'string' ? `+${effect.add}` : amount(effect.add, meta?.unit);
  return { text: t('effect.amount', { amount: shown, value: t(`value.${effect.value}`) }), tone };
}
