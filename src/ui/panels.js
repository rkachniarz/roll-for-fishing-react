// @ts-check
// What the panes over the scene show (docs/spec.md, R16.4): the character,
// the journal, the map, the bucket, the bag and the menu. Each is drawn afresh
// from the state; none changes it except through the callbacks it is given.

import { content } from '../generated/content.js';
import { t } from '../strings.js';
import { levelFor } from '../engine/state.js';
import { className } from '../engine/character.js';
import { iconName, paintIcon } from '../scene/icons.js';
import { bagTab, fishName, rarityColour, slot } from './links.js';
import { showTip } from './tooltip.js';
import { EQUIPMENT_SLOTS, isTiny } from '../engine/equipment.js';
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
  const byName = (/** @type {string} */ a, /** @type {string} */ b) => t(content.fish[a].name).localeCompare(t(content.fish[b].name));
  const caught = Object.keys(state.book.fish).sort(byName);
  // Known of but not landed yet: a fish that got away (R4.3). Learning of
  // fish in other ways comes with 8.5.
  const seen = [...new Set(Object.values(state.escaped).flat().map((f) => f.species))].filter((id) => !state.book.fish[id] && content.fish[id]).sort(byName);
  const treasure = Object.keys(state.found)
    .filter((id) => content.items[id]?.category === 'treasure')
    .sort((a, b) => t(content.items[a].name).localeCompare(t(content.items[b].name)));
  return [
    el('dl', { className: 'stats' }, [
      el('dt', { textContent: t('journal.casts') }),
      el('dd', { textContent: String(state.book.casts) }),
      el('dt', { textContent: t('journal.catches') }),
      el('dd', { textContent: String(state.book.catches) }),
    ]),
    el('h3', { textContent: t('journal.fish') }),
    caught.length || seen.length
      ? el('div', { className: 'grid collection' }, [...caught.map((id) => speciesSlot(state, id)), ...seen.map((id) => speciesSlot(state, id))])
      : el('p', { className: 'muted', textContent: t('journal.none') }),
    el('h3', { textContent: t('journal.treasure') }),
    treasure.length
      ? el('div', { className: 'grid collection' }, treasure.map((id) => slot({ kind: 'item', id }, state.found[id])))
      : el('p', { className: 'muted', textContent: t('journal.noTreasure') }),
  ];
}

/**
 * A species in the collection (R4.3): its icon and its records on a tap, or,
 * if it has only been seen, its silhouette and no name.
 * @param {GameState} state
 * @param {string} id
 */
function speciesSlot(state, id) {
  const fish = content.fish[id];
  const e = state.book.fish[id];
  const art = paintIcon(iconName({ kind: 'fish', id }));
  art.className = 'icon';
  const b = el('button', { type: 'button', className: e ? 'slot' : 'slot unknown' }, [art]);
  /** @type {import('./tooltip.js').Tip} */
  const tip = e
    ? {
        title: t(fish.name),
        colour: rarityColour(fish.rarity),
        lines: [{ text: t('journal.entry', { caught: e.caught, smallest: e.smallest.size, largest: e.largest.size, average: Math.round(e.totalSize / e.caught) }) }],
      }
    : { title: t('journal.unknown'), lines: [{ text: t('journal.gotAway') }] };
  b.style.borderColor = tip.colour ?? '';
  b.setAttribute('aria-label', tip.title);
  b.addEventListener('click', () => showTip(b, tip));
  return b;
}

/**
 * Every location's spots to go to, the one the player is at pressed (D101): a
 * plain list until the real map, with spots learned about before they show
 * (8.1).
 * @param {GameState} state
 * @param {(location: string, spot: string) => void} onTravel
 */
export function mapPane(state, onTravel) {
  /** @type {HTMLElement[]} */
  const out = [];
  for (const loc of Object.values(content.locations)) {
    if (loc.retired) continue;
    out.push(el('p', { className: 'name', textContent: t(loc.name) }));
    // Somewhere an event holds the player: no other location (R10.8, 7.6).
    const held = Boolean(state.locked) && state.locked !== loc.id;
    const spots = (loc.spots ?? []).map((/** @type {{ id: string, name: string }} */ spot) => {
      const here = state.location === loc.id && state.spot === spot.id;
      const b = el('button', { type: 'button', className: 'map-spot', textContent: t(spot.name), disabled: here || held });
      b.setAttribute('aria-pressed', String(here));
      b.addEventListener('click', () => onTravel(loc.id, spot.id));
      return b;
    });
    out.push(el('div', { className: 'map-spots' }, spots));
  }
  if (state.locked) out.push(el('p', { className: 'muted', textContent: t('map.locked') }));
  out.push(el('p', { className: 'muted', textContent: t('map.later') }));
  return out;
}

/**
 * The bucket as a grid: a slot per stack, then an empty slot for each fish
 * there is still room for (D57). Identical twins share a slot (D50). Under
 * it, a button for each Tiny fish to put it on the hook (R13.4, D41).
 * @param {GameState} state
 * @param {number} size  The bucket's size (the bucketSize value).
 * @param {(index: number) => void} [onHook]
 */
export function bucketPane(state, size, onHook = () => {}) {
  const fish = state.bucket.reduce((n, b) => n + b.count, 0);
  const hooks = state.bucket.flatMap((b, i) => {
    if (!isTiny(b.fish)) return [];
    const button = el('button', { type: 'button', className: 'map-spot', textContent: t('bucket.hook', { fish: fishName(b.fish) }) });
    button.addEventListener('click', () => onHook(i));
    return [button];
  });
  return [
    el('p', { className: 'muted', textContent: t('bucket.count', { count: fish, size }) }),
    el('div', { className: 'grid' }, [...state.bucket.map((b) => slot({ kind: 'fish', fish: b.fish }, b.count)), ...empties(size - fish)]),
    ...(hooks.length ? [el('div', { className: 'map-spots bucket-hooks' }, hooks)] : []),
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
export function menuPane({ onMainMenu, onSettings, onDev, onExport }) {
  return [
    el('div', { className: 'menu-list' }, [
      el('button', { type: 'button', id: 'mainMenu', textContent: t('menu.mainMenu'), onclick: onMainMenu }),
      el('button', { type: 'button', id: 'openSettings', textContent: t('menu.settings'), onclick: onSettings }),
      el('button', { type: 'button', id: 'exportSave', textContent: t('menu.export'), onclick: onExport }),
      ...(onDev ? [el('button', { type: 'button', id: 'openBench', textContent: t('menu.dev'), onclick: onDev })] : []),
    ]),
  ];
}

/**
 * Settings (D81): the theme, and whether the dice are shown (D99).
 * @param {import('../settings.js').Settings} settings
 * @param {(next: import('../settings.js').Settings) => void} onChange
 * @param {boolean} diceShown  The box's tick: the setting, or what the device's "reduce motion" chose.
 */
export function settingsPane(settings, onChange, diceShown) {
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
    el('h3', { textContent: t('settings.dice') }),
    el('div', { className: 'choices' }, [
      el('label', {}, [
        el('input', {
          type: 'checkbox',
          id: 'show-dice',
          checked: diceShown,
          onchange: (/** @type {Event} */ e) => onChange({ ...settings, dice: /** @type {HTMLInputElement} */ (e.target).checked }),
        }),
        el('span', { textContent: t('settings.showDice') }),
      ]),
    ]),
  ];
}
