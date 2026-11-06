// @ts-check
// What the panes over the scene show (docs/spec.md, R16.4): the character,
// the journal, the map, the bucket, the bag and the menu. Each is drawn afresh
// from the state; none changes it except through the callbacks it is given.

import { content } from '../generated/content.js';
import { t } from '../strings.js';
import { levelFor } from '../engine/state.js';
import { className } from '../engine/character.js';
import { paintIcon } from '../scene/icons.js';
import { bagTab, slot } from './links.js';
import { EQUIPMENT_SLOTS } from '../engine/equipment.js';
import { offers, owedLevels } from '../engine/perks.js';

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
 * An equipment slot (D83): the item in it, or its name when empty. Both take
 * drops; a full one can be dragged off.
 * @param {GameState} state
 * @param {string} key
 */
function equipSlot(state, key) {
  const stack = state.equipped[key];
  /** @type {HTMLElement} */
  let node;
  if (stack) {
    node = slot({ kind: 'item', id: stack.id }, stack.count);
    node.dataset.drag = `equip:${key}`;
  } else {
    node = el('span', { className: 'slot empty equip-empty' }, [el('span', { className: 'slot-name', textContent: t(`slot.${key}`) })]);
    node.setAttribute('aria-label', `${t(`slot.${key}`)}: ${t('slot.none')}`);
  }
  node.dataset.drop = `equip:${key}`;
  node.dataset.slot = key;
  return node;
}

/**
 * The character: portrait, level and XP, and the paper doll as WoW's (D29,
 * D83): the hat and trinkets down the left, the rod, line, bobber and bait
 * down the right, the stats between them.
 * @param {GameState} state
 * @param {Record<string, number>} values  The game values' totals (valuesFor().flat).
 * @param {(id: string) => void} [onTakePerk]  The player learns a perk on offer (D96).
 */
export function playerPane(state, values, onTakePerk = () => {}) {
  const c = state.character;
  const level = levelFor(c.xp);
  const curve = content.rules.levels.xp;
  const next = curve[level + 1];
  const portrait = paintIcon('ui/portrait');
  portrait.className = 'portrait';
  const fill = el('div', { className: 'xp-fill' });
  fill.style.width = next === undefined ? '100%' : `${(100 * (c.xp - curve[level])) / (next - curve[level])}%`;
  const statKeys = ['fishingSkill', 'fishFind', 'treasureFind'];
  const column = (/** @type {string[]} */ keys) => el('div', { className: 'doll-column' }, keys.map((k) => equipSlot(state, k)));
  const left = ['hat', ...EQUIPMENT_SLOTS.filter((s) => s.kind === 'trinket').map((s) => s.key)];
  const right = EQUIPMENT_SLOTS.map((s) => s.key).filter((k) => !left.includes(k));
  const { choice, taken } = perksSection(state, onTakePerk);
  return [
    // A perk to choose is why the pane was opened: it comes first (D96).
    ...(choice ? [choice] : []),
    el('div', { className: 'who' }, [
      portrait,
      el('div', {}, [
        el('p', { className: 'name', textContent: c.name }),
        el('p', { textContent: t('player.level', { level, className: t(className(c.classId, c.gender)) }) }),
      ]),
    ]),
    el('div', { className: 'xp-bar' }, [fill]),
    el('p', { className: 'muted', textContent: next === undefined ? t('player.maxLevel', { xp: c.xp }) : t('player.xp', { xp: c.xp, next }) }),
    el('div', { className: 'doll', id: 'doll' }, [
      column(left),
      el('div', { className: 'doll-middle' }, [
        el('h3', { textContent: t('player.stats') }),
        el('dl', { className: 'stats' }, statKeys.flatMap((k) => [el('dt', { textContent: t(`value.${k}`) }), el('dd', { textContent: String(values[k]) })])),
      ]),
      column(right),
    ]),
    ...taken,
  ];
}

/**
 * A perk as a card: its name, passive or active (with the cooldown), and what
 * it does.
 * @param {string} id
 * @param {keyof HTMLElementTagNameMap} [tag]
 */
function perkCard(id, tag = 'div') {
  const p = content.perks[id];
  const cooldown = p.cooldown?.casts
    ? t(p.cooldown.minusLevel ? 'perk.cooldownMinusLevel' : 'perk.cooldown', { casts: p.cooldown.casts })
    : '';
  return el(tag, { className: `perk perk-${p.kind}` }, [
    el('span', { className: 'perk-name', textContent: t(p.name) }),
    el('span', { className: 'perk-kind', textContent: [t(`perk.${p.kind}`), cooldown].filter(Boolean).join(' · ') }),
    el('span', { className: 'perk-text', textContent: t(p.description) }),
  ]);
}

/** The perk card picked but not yet learnt, kept while the pane is redrawn. */
let picked = '';

/**
 * The perks (D96): the choice for the lowest owed level, if there is one, as
 * cards to pick from and a button to learn the picked one; then every perk
 * taken, by level.
 * @param {GameState} state
 * @param {(id: string) => void} onTakePerk
 */
function perksSection(state, onTakePerk) {
  /** @type {HTMLElement | null} */
  let choiceBox = null;
  const [owed] = owedLevels(state);
  if (owed !== undefined) {
    const choice = offers(state, owed);
    if (!choice.includes(picked)) picked = '';
    const learn = el('button', { type: 'button', id: 'learnPerk', className: 'learn', textContent: t('perk.learn'), disabled: !picked });
    learn.addEventListener('click', () => {
      const id = picked;
      picked = '';
      if (id) onTakePerk(id);
    });
    const cards = choice.map((id) => {
      const card = perkCard(id, 'button');
      Object.assign(card, { type: 'button' });
      card.dataset.perk = id;
      card.setAttribute('aria-pressed', String(id === picked));
      card.addEventListener('click', () => {
        picked = id;
        for (const c of cards) c.setAttribute('aria-pressed', String(c === card));
        learn.disabled = false;
      });
      return card;
    });
    choiceBox = el('section', { className: 'perk-choice', id: 'perkChoice' }, [el('h3', { textContent: t('perk.choose', { level: owed }) }), ...cards, learn]);
  }
  const taken = Object.entries(state.character.perks)
    .map(([level, id]) => ({ level: Number(level), id }))
    .filter(({ id }) => content.perks[id])
    .sort((a, b) => a.level - b.level);
  return {
    choice: choiceBox,
    taken: [
      el('h3', { textContent: t('perk.taken') }),
      taken.length
      ? el('ul', { className: 'perks', id: 'perksTaken' }, taken.map(({ id }) => el('li', {}, [perkCard(id)])))
      : el('p', { className: 'muted', textContent: t('perk.none') }),
    ],
  };
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
 * The bag, in tabs (R8.1): a grid of slots. Each stack can be dragged by its
 * place in state.bags; an empty slot takes a drop at the end (D83).
 * @param {GameState} state
 * @param {BagTab} tab
 * @param {(tab: BagTab) => void} onTab
 */
export function bagPane(state, tab, onTab) {
  const items = state.bags.map((b, i) => ({ ...b, i })).filter((b) => bagTab(b.id) === tab);
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
    el('div', { className: 'grid' }, [
      ...items.map((b) => {
        const node = slot({ kind: 'item', id: b.id }, b.count);
        node.dataset.drag = `bag:${b.i}`;
        node.dataset.drop = `bag:${b.i}`;
        return node;
      }),
      ...empties(shown - items.length).map((node) => {
        node.dataset.drop = 'bag:end';
        return node;
      }),
    ]),
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
