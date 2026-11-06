// @ts-check
// The action bar (D96): the character's active abilities, under the button
// row, as WoW's. Each button shows how many casts are left on its cooldown,
// glows when it lights up, and is greyed out when it can't be used. A tap or
// a click uses it; keys 1, 2, 3… do too. Hover, or a long press on a touch
// screen, shows what it does.
//
// It isn't the water: nothing here casts or strikes.

import { content } from '../generated/content.js';
import { t } from '../strings.js';
import { hideTip, showTip } from './tooltip.js';

/** @typedef {ReturnType<typeof import('../engine/abilities.js').abilityStatus>} Status */

const LONG_PRESS_MS = 500;

/**
 * The placeholder icon until abilities have art (R15.5): the name's initials.
 * @param {string} name
 */
function initials(name) {
  return name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * What's left of a cooldown, for the button: casts as a number, time as
 * minutes or seconds, as the buff bar shows it (D31).
 * @param {{ casts?: number, ms?: number }} cd
 */
function left(cd) {
  if (cd.casts) return String(cd.casts);
  const ms = cd.ms ?? 0;
  return ms >= 60_000 ? `${Math.round(ms / 60_000)}m` : `${Math.ceil(ms / 1000)}s`;
}

/**
 * The tooltip: name, cooldown, what it does, and why it can't be used now.
 * @param {Status} s
 */
export function abilityTip(s) {
  const p = content.perks[s.id];
  const cd = p.cooldown?.casts ? t(p.cooldown.minusLevel ? 'perk.cooldownMinusLevel' : 'perk.cooldown', { casts: p.cooldown.casts }) : '';
  /** @type {{ text: string, tone?: 'flavor' | 'good' | 'bad' }[]} */
  const lines = [{ text: [t('perk.active'), cd].filter(Boolean).join(' · '), tone: 'flavor' }, { text: t(p.description) }];
  if (!s.working) lines.push({ text: t('ability.notYet'), tone: 'bad' });
  else if (s.cooldown) lines.push({ text: t('ability.cooling', { left: left(s.cooldown) }), tone: 'bad' });
  else if (s.armed) lines.push({ text: t('ability.armed'), tone: 'good' });
  else if (s.lit) lines.push({ text: t('ability.lit'), tone: 'good' });
  return { title: t(p.name), lines };
}

/**
 * @param {HTMLElement} root
 * @param {(id: string) => void} onUse
 */
export function createActionBar(root, onUse) {
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('contextmenu', (e) => e.preventDefault());
  /** @type {Status[]} */
  let shown = [];

  /** @param {string} id @param {number} i */
  function button(id, i) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'action';
    el.dataset.ability = id;
    const icon = document.createElement('span');
    icon.className = 'action-icon';
    icon.textContent = initials(t(content.perks[id].name));
    const key = document.createElement('span');
    key.className = 'action-key';
    key.textContent = String(i + 1);
    const cd = document.createElement('span');
    cd.className = 'action-cd';
    el.append(icon, key, cd);

    const tip = () => {
      const s = shown.find((x) => x.id === id);
      if (s) showTip(el, abilityTip(s));
    };
    el.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && tip());
    el.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && hideTip());
    let timer = 0;
    let longPressed = false;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      longPressed = false;
      timer = window.setTimeout(() => {
        longPressed = true;
        tip();
      }, LONG_PRESS_MS);
    });
    const endPress = () => window.clearTimeout(timer);
    el.addEventListener('pointerup', endPress);
    el.addEventListener('pointercancel', endPress);
    el.addEventListener('click', () => {
      if (longPressed) {
        longPressed = false;
        return;
      }
      onUse(id);
    });
    return el;
  }

  return {
    /**
     * @param {Status[]} statuses
     * @returns {boolean}  Whether the bar is shown.
     */
    update(statuses) {
      if (statuses.map((s) => s.id).join() !== shown.map((s) => s.id).join()) {
        root.replaceChildren(...statuses.map((s, i) => button(s.id, i)));
      }
      shown = statuses;
      for (const s of statuses) {
        const el = /** @type {HTMLElement} */ (root.querySelector(`[data-ability="${CSS.escape(s.id)}"]`));
        el.classList.toggle('lit', s.lit && s.usable);
        el.classList.toggle('armed', s.armed);
        el.classList.toggle('unusable', !s.usable && !s.armed);
        el.classList.toggle('cooling', Boolean(s.cooldown));
        const cd = /** @type {HTMLElement} */ (el.querySelector('.action-cd'));
        const text = s.cooldown ? left(s.cooldown) : '';
        if (cd.textContent !== text) cd.textContent = text;
        el.setAttribute('aria-label', `${t(content.perks[s.id].name)}${text ? `, ${t('ability.cooling', { left: text })}` : ''}`);
      }
      root.hidden = statuses.length === 0;
      return !root.hidden;
    },
  };
}
