// @ts-check
// Names of fish and items, and links to them: the name in brackets in its
// rarity colour, as in WoW's chat frame (docs/spec.md, R16.5; D49). A tap on a
// link shows its tooltip; so does a mouse over it (D119).

import { content } from '../generated/content.js';
import { t } from '../strings.js';
import { fishNameKeys } from '../engine/fish.js';
import { RARITY_COLOURS, iconName, paintIcon } from '../scene/icons.js';
import { bindTip } from './tooltip.js';
import { effectLine } from './effects.js';

/** @typedef {import('../engine/fish.js').FishInstance} FishInstance */
/** @typedef {{ kind: 'fish', fish: FishInstance } | { kind: 'item', id: string }} Thing */

/** @param {FishInstance} fish */
export const fishName = (fish) => fishNameKeys(fish).map((k) => t(k)).join(' ');
/** @param {string} id */
export const itemName = (id) => t(content.items[id].name);
/**
 * A rarity's colour as a CSS value: WoW's colours on the dark theme, darker
 * ones that read on the light theme (styles.css, --rarity-*).
 * @param {string} rarity
 */
export const rarityColour = (rarity) => `var(--rarity-${rarity in RARITY_COLOURS ? rarity : 'common'})`;

/**
 * The bag tab an item goes in (R8.1, D112): anything with a slot is
 * equipment, consumables are consumables, complete junk is junk, and
 * everything else is stuff.
 * @param {string} id
 * @returns {'equipment' | 'consumables' | 'stuff' | 'junk'}
 */
export function bagTab(id) {
  const item = content.items[id];
  if (item.slot) return 'equipment';
  if (item.category === 'consumable') return 'consumables';
  if (item.category === 'junk') return 'junk';
  return 'stuff';
}

/**
 * What a thing's tooltip says, WoW's order: name, Unique, slot, effects (made
 * from the effects themselves, R8.6), flavour text, price.
 * @param {Thing} thing
 * @returns {import('./tooltip.js').Tip}
 */
export function tipFor(thing) {
  if (thing.kind === 'fish') {
    return {
      title: fishName(thing.fish),
      colour: rarityColour(thing.fish.rarity),
      // "I want to see what we caught" (D119).
      icon: iconName({ kind: 'fish', id: thing.fish.species }),
      lines: [
        { text: t('tip.fish') },
        { text: t('tip.size', { size: thing.fish.size }) },
        // What it adds to the stew, and gives eaten raw (R19.4, R21.1).
        ...(content.fish[thing.fish.species]?.stew?.length ? [{ text: t('tip.stew', { effects: effectsText(content.fish[thing.fish.species].stew) }), tone: /** @type {const} */ ('good') }] : []),
      ],
    };
  }
  const item = content.items[thing.id];
  /** @type {import('./tooltip.js').Tip['lines']} */
  const lines = [];
  if (item.unique) lines.push({ text: t('tip.unique') });
  if (item.slot) lines.push({ text: t(`slot.${item.slot}`) });
  else if (item.category === 'consumable') lines.push({ text: t('tip.consumable') });
  for (const effect of item.effects ?? []) lines.push(effectLine(effect));
  if (item.bobber) lines.push({ text: t('effect.cosmetic') });
  if (item.set) lines.push({ text: t('tip.set', { set: t(content.sets[item.set].name) }) });
  if (item.flavor) lines.push({ text: `"${t(item.flavor)}"`, tone: 'flavor' });
  // A page that can be read (8.7).
  if (item.page) lines.push({ text: t(item.page), tone: 'page' });
  // A potion (R18.8): what it gives when used.
  const buff = item.use ? content.buffs?.[item.use.buff] : null;
  if (buff) {
    lines.push({ text: t('tip.use', { buff: t(buff.name), effects: effectsText(buff.effects), duration: durationText(buff.duration) }), tone: 'good' });
    lines.push({ text: t('tip.useHint') });
  }
  // No sell price: there's no money, only barter (D85).
  return { title: itemName(thing.id), colour: rarityColour(item.rarity), lines };
}

/**
 * A link to a thing: "[Large Roach]" in its rarity colour.
 * @param {Thing} thing
 */
export function link(thing) {
  const tip = tipFor(thing);
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'link';
  b.textContent = `[${tip.title}]`;
  b.style.color = tip.colour ?? '';
  bindTip(b, tip);
  return b;
}

/**
 * A thing's icon, bordered in its rarity colour, as a button that shows the
 * tooltip: the bag and bucket's slots.
 * @param {Thing} thing
 * @param {number} [count]  Shown in the corner when more than one.
 * @param {string} [hint]  A last line for its tooltip: "Right-click for options".
 */
export function slot(thing, count = 1, hint) {
  const base = tipFor(thing);
  const tip = hint ? { ...base, lines: [...base.lines, { text: hint }] } : base;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'slot';
  b.style.borderColor = tip.colour ?? '';
  b.setAttribute('aria-label', tip.title + (count > 1 ? ` ×${count}` : ''));
  const art = paintIcon(iconName(thing.kind === 'fish' ? { kind: 'fish', id: thing.fish.species } : thing));
  art.className = 'icon';
  b.append(art);
  if (count > 1) {
    const n = document.createElement('span');
    n.className = 'count';
    n.textContent = String(count);
    b.append(n);
  }
  bindTip(b, tip);
  return b;
}

/**
 * Effects as one line of text: "+5 Fish Find, +1 Warmth" (R8.6).
 * @param {import('../engine/values.js').Effect[]} effects
 */
export function effectsText(effects) {
  return effects.map((e) => effectLine(e).text).join(', ');
}

/**
 * Game minutes as words: "30 minutes", "an hour", "6 hours" (R19.5).
 * @param {number} minutes
 */
export function hoursText(minutes) {
  if (minutes < 60) return t('hours.minutes', { minutes });
  const hours = Math.round((minutes / 60) * 2) / 2;
  return hours === 1 ? t('hours.one') : t('hours.many', { hours });
}

/**
 * A buff's duration as words.
 * @param {{ casts?: number, attempts?: number, minutes?: number, ms?: number }} d
 */
export function durationText(d) {
  if (d.casts !== undefined) return t('duration.casts', { n: d.casts });
  if (d.attempts !== undefined) return t('duration.attempts', { n: d.attempts });
  if (d.minutes !== undefined) return t('duration.minutes', { hours: hoursText(d.minutes) });
  return t('duration.ms', { n: Math.round((d.ms ?? 0) / 60000) });
}
