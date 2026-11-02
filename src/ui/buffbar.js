// @ts-check
// The buff and debuff bar (docs/spec.md, R12.3-R12.7; D29, D31), at the top
// right of the game area as in WoW: buffs in one row with green borders,
// debuffs in another with red ones, each with its time or casts left in the
// corner. Hover (or tap, on touch) shows what it does; right-click (or
// long-press) cancels a buff. Debuffs can't be cancelled.
//
// It sits in the layer over the scene (D71): taps on it never reach the water.

import { t } from '../strings.js';

/** @typedef {import('../engine/state.js').Buff} Buff */

const LONG_PRESS_MS = 600;

/**
 * What's left, for the square's corner (R12.4): casts as a number; time to the
 * nearest minute ("4m", D31) until under a minute, then seconds ("45s").
 * @param {Buff} buff
 */
export function remaining(buff) {
  if (buff.casts !== undefined) return String(buff.casts);
  const ms = Math.max(0, buff.ms ?? 0);
  if (ms >= 60_000) return `${Math.round(ms / 60_000)}m`;
  return `${Math.ceil(ms / 1000)}s`;
}

/**
 * What a buff does, from its effects (R8.6): "+20 Fish Find".
 * @param {Buff} buff
 */
export function describeBuff(buff) {
  /** @param {number | string} add */
  const amount = (add) => (typeof add === 'string' ? `+${add}` : `${add < 0 ? '−' : '+'}${Math.abs(add)}`);
  return buff.effects.map((e) => `${amount(e.add)} ${t(`value.${e.value}`)}`).join(', ');
}

/**
 * @param {HTMLElement} root  Positioned over the scene.
 * @param {(id: string) => void} onCancel
 */
export function createBuffBar(root, onCancel) {
  root.className = 'buff-bar';
  const buffRow = document.createElement('div');
  buffRow.className = 'buff-row buffs';
  const debuffRow = document.createElement('div');
  debuffRow.className = 'buff-row debuffs';
  const tip = document.createElement('div');
  tip.className = 'buff-tip';
  tip.hidden = true;
  root.append(buffRow, debuffRow, tip);

  // The bar is not the water: nothing here casts or strikes.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('contextmenu', (e) => e.preventDefault());

  /** @type {string | null} */
  let tipFor = null;
  /** @type {Buff[]} */
  let shown = [];

  /** @param {Buff} buff @param {HTMLElement} square */
  function showTip(buff, square) {
    tipFor = buff.id;
    tip.hidden = false;
    tip.textContent = describeBuff(buff) + (buff.debuff ? '' : ` · ${t('buff.cancelHint')}`);
    tip.style.top = `${square.offsetTop + square.offsetHeight + 4}px`;
  }
  function hideTip() {
    tipFor = null;
    tip.hidden = true;
  }

  /** @param {Buff} buff */
  function square(buff) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `buff ${buff.debuff ? 'debuff' : ''}`;
    el.dataset.id = buff.id;
    el.setAttribute('aria-label', describeBuff(buff));
    const icon = document.createElement('span');
    icon.className = 'buff-icon';
    // The default icon until buffs have art (R15.5).
    icon.textContent = buff.debuff ? '▼' : '▲';
    const left = document.createElement('span');
    left.className = 'buff-left';
    el.append(icon, left);

    el.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && showTip(buff, el));
    el.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && hideTip());
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!buff.debuff) onCancel(buff.id);
    });
    let pressTimer = 0;
    let longPressed = false;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      longPressed = false;
      pressTimer = window.setTimeout(() => {
        longPressed = true;
        if (!buff.debuff) onCancel(buff.id);
      }, LONG_PRESS_MS);
    });
    const endPress = () => window.clearTimeout(pressTimer);
    el.addEventListener('pointerup', endPress);
    el.addEventListener('pointercancel', endPress);
    el.addEventListener('click', (e) => {
      if (longPressed || (e instanceof PointerEvent && e.pointerType === 'mouse')) return;
      if (tipFor === buff.id) hideTip();
      else showTip(buff, el);
    });
    return el;
  }

  return {
    /** @param {Buff[]} buffs */
    update(buffs) {
      const ids = buffs.map((b) => b.id).join();
      if (ids !== shown.map((b) => b.id).join()) {
        buffRow.replaceChildren(...buffs.filter((b) => !b.debuff).map(square));
        debuffRow.replaceChildren(...buffs.filter((b) => b.debuff).map(square));
        if (tipFor && !buffs.some((b) => b.id === tipFor)) hideTip();
      }
      shown = buffs;
      for (const b of buffs) {
        const left = root.querySelector(`.buff[data-id="${CSS.escape(b.id)}"] .buff-left`);
        if (left && left.textContent !== remaining(b)) left.textContent = remaining(b);
      }
      root.hidden = buffs.length === 0;
    },
  };
}
