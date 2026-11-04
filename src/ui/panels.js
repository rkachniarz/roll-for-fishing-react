// @ts-check
// What the panes over the scene show (docs/spec.md, R16.4): the character,
// the journal, the map, the bucket, the bag and the menu. Each is drawn afresh
// from the state; none changes it except through the callbacks it is given.

import { content } from '../generated/content.js';
import { t } from '../strings.js';
import { levelFor } from '../engine/state.js';
import { className } from '../engine/character.js';
import { paintIcon } from '../scene/icons.js';
import { bagTab, link, slot } from './links.js';

/** @typedef {import('../engine/state.js').GameState} GameState */

/** @template {keyof HTMLElementTagNameMap} K @param {K} tag @param {Record<string, any>} [props] @param {(Node | string)[]} [kids] */
function el(tag, props = {}, kids = []) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
}

/** @param {number} count  Empty slots to draw. */
const empties = (count) => Array.from({ length: Math.max(0, count) }, () => el('span', { className: 'slot empty' }));

/**
 * The character: portrait, level and XP, stats, and what is equipped. The
 * equipment slots get their own layout with the owner's next sketch.
 * @param {GameState} state
 * @param {Record<string, number>} values  The game values' totals (valuesFor().flat).
 */
export function playerPane(state, values) {
  const c = state.character;
  const level = levelFor(c.xp);
  const curve = content.rules.levels.xp;
  const next = curve[level + 1];
  const portrait = paintIcon('ui/portrait');
  portrait.className = 'portrait';
  const fill = el('div', { className: 'xp-fill' });
  fill.style.width = next === undefined ? '100%' : `${(100 * (c.xp - curve[level])) / (next - curve[level])}%`;
  const statKeys = ['fishingSkill', 'fishFind', 'treasureFind'];
  return [
    el('div', { className: 'who' }, [
      portrait,
      el('div', {}, [
        el('p', { className: 'name', textContent: c.name }),
        el('p', { textContent: t('player.level', { level, className: t(className(c.classId, c.gender)) }) }),
      ]),
    ]),
    el('div', { className: 'xp-bar' }, [fill]),
    el('p', { className: 'muted', textContent: next === undefined ? t('player.maxLevel', { xp: c.xp }) : t('player.xp', { xp: c.xp, next }) }),
    el('h3', { textContent: t('player.stats') }),
    el('dl', { className: 'stats' }, statKeys.flatMap((k) => [el('dt', { textContent: t(`value.${k}`) }), el('dd', { textContent: String(values[k]) })])),
    el('h3', { textContent: t('player.equipment') }),
    el(
      'dl',
      { className: 'stats' },
      /** @type {const} */ (['rod', 'bait']).flatMap((s) => {
        const id = state.equipped[s];
        return [
          el('dt', { textContent: t(`slot.${s}`) }),
          el('dd', {}, [id ? link({ kind: 'item', id }) : el('span', { className: 'muted', textContent: t('slot.none') })]),
        ];
      }),
    ),
  ];
}

/**
 * The accomplishments book (R4.2): lifetime counts and every species caught.
 * Achievements join it later.
 * @param {GameState} state
 */
export function journalPane(state) {
  const species = Object.entries(state.book.fish).sort(([a], [b]) => t(content.fish[a].name).localeCompare(t(content.fish[b].name)));
  return [
    el('dl', { className: 'stats' }, [
      el('dt', { textContent: t('journal.casts') }),
      el('dd', { textContent: String(state.book.casts) }),
      el('dt', { textContent: t('journal.catches') }),
      el('dd', { textContent: String(state.book.catches) }),
    ]),
    el('h3', { textContent: t('journal.fish') }),
    ...(species.length
      ? species.map(([id, e]) =>
          el('p', { className: 'species' }, [
            el('strong', { textContent: t(content.fish[id].name) }),
            ' ',
            t('journal.entry', { caught: e.caught, smallest: e.smallest.size, largest: e.largest.size, average: Math.round(e.totalSize / e.caught) }),
          ]),
        )
      : [el('p', { className: 'muted', textContent: t('journal.none') })]),
  ];
}

/**
 * Where the player is. Changing spots and locations and going to town come
 * with Phase 8 (R11.8).
 * @param {GameState} state
 */
export function mapPane(state) {
  const loc = content.locations[state.location];
  const spot = state.spot ? loc.spots.find((/** @type {{ id: string }} */ s) => s.id === state.spot) : null;
  return [
    el('p', { className: 'name', textContent: t(loc.name) }),
    el('p', { textContent: spot ? t(spot.name) : t('map.shore') }),
    el('p', { className: 'muted', textContent: t('map.later') }),
  ];
}

/**
 * The bucket as a grid: a slot per stack, then an empty slot for each fish
 * there is still room for (D57). Identical twins share a slot (D50).
 * @param {GameState} state
 * @param {number} size  The bucket's size (the bucketSize value).
 */
export function bucketPane(state, size) {
  const fish = state.bucket.reduce((n, b) => n + b.count, 0);
  return [
    el('p', { className: 'muted', textContent: t('bucket.count', { count: fish, size }) }),
    el('div', { className: 'grid' }, [...state.bucket.map((b) => slot({ kind: 'fish', fish: b.fish }, b.count)), ...empties(size - fish)]),
  ];
}

/** @typedef {'equipment' | 'consumables' | 'stuff'} BagTab */
export const BAG_TABS = /** @type {BagTab[]} */ (['equipment', 'consumables', 'stuff']);

/**
 * The bag, in tabs (R8.1): a grid of slots. Dragging and equipping come with
 * 5.1 and 5.2.
 * @param {GameState} state
 * @param {BagTab} tab
 * @param {(tab: BagTab) => void} onTab
 */
export function bagPane(state, tab, onTab) {
  const items = state.bags.filter((b) => bagTab(b.id) === tab);
  // Whole rows of four, and at least one row.
  const shown = Math.max(4, Math.ceil(items.length / 4) * 4);
  return [
    el(
      'div',
      { className: 'tabs', role: 'tablist' },
      BAG_TABS.map((name) => {
        const b = el('button', { type: 'button', id: `tab-${name}`, className: 'tab', textContent: t(`bag.${name}`), onclick: () => onTab(name) });
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', String(name === tab));
        return b;
      }),
    ),
    el('div', { className: 'grid' }, [...items.map((b) => slot({ kind: 'item', id: b.id }, b.count)), ...empties(shown - items.length)]),
  ];
}

/**
 * The menu: back to the title screen, settings, and the dev bench with ?dev.
 * @param {{ onMainMenu: () => void, onSettings: () => void, onDev: (() => void) | null }} actions
 */
export function menuPane({ onMainMenu, onSettings, onDev }) {
  return [
    el('div', { className: 'menu-list' }, [
      el('button', { type: 'button', id: 'mainMenu', textContent: t('menu.mainMenu'), onclick: onMainMenu }),
      el('button', { type: 'button', id: 'openSettings', textContent: t('menu.settings'), onclick: onSettings }),
      ...(onDev ? [el('button', { type: 'button', id: 'openBench', textContent: t('menu.dev'), onclick: onDev })] : []),
    ]),
  ];
}

/**
 * Settings (D81): for now, the theme.
 * @param {import('../settings.js').Settings} settings
 * @param {(next: import('../settings.js').Settings) => void} onChange
 */
export function settingsPane(settings, onChange) {
  return [
    el('h3', { textContent: t('settings.theme') }),
    el(
      'div',
      { className: 'choices' },
      /** @type {const} */ (['dark', 'light']).map((theme) =>
        el('label', {}, [
          el('input', {
            type: 'radio',
            name: 'theme',
            id: `theme-${theme}`,
            value: theme,
            checked: settings.theme === theme,
            onchange: () => onChange({ ...settings, theme }),
          }),
          el('span', { textContent: t(`settings.${theme}`) }),
        ]),
      ),
    ),
  ];
}
