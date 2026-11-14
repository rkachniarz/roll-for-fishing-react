// @ts-check
// What the panes over the scene show (docs/spec.md, R16.4): the character,
// the journal, the map, the bucket, the bag and the menu. Each is drawn afresh
// from the state; none changes it except through the callbacks it is given.

import { content } from '../generated/content.js';
import { t } from '../strings.js';
import { levelFor } from '../engine/state.js';
import { className } from '../engine/character.js';
import { iconName, paintIcon } from '../scene/icons.js';
import { bagTab, effectsText, hoursText, link, rarityColour, slot } from './links.js';
import { bowlOf, canTrade, costStatus, offersFor } from '../engine/barter.js';
import { vendorStatus } from '../engine/schedule.js';
import { bindTip } from './tooltip.js';
import { EQUIPMENT_SLOTS } from '../engine/equipment.js';
import { offers, owedLevels } from '../engine/perks.js';
import { completion, knownKey, locationList, placeOpen, spotKnown } from '../engine/knowledge.js';
import { setPieces } from '../engine/events.js';

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

/**
 * The perk card picked but not yet learnt, kept while the pane is redrawn;
 * `for` is whose choice it was, so another game doesn't find it picked.
 */
let picked = '';
let pickedFor = '';

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
    const whose = `${state.seed}/${state.character.name}/${owed}`;
    if (pickedFor !== whose || !choice.includes(picked)) picked = '';
    pickedFor = whose;
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
export function journalPane(state, showCompletion = false) {
  /** @type {HTMLElement[]} */
  const places = [];
  for (const loc of Object.values(content.locations)) {
    if (loc.retired) continue;
    // What the player knows of here, found first (R4.4, R4.5): the location's
    // list, and anything else found here (a rift fish).
    const list = locationList(loc.id);
    const fish = [...new Set([...list.fish, ...Object.keys(state.book.fish)])].filter((id) => state.known[knownKey(loc.id, 'fish', id)]);
    const items = [...new Set([...list.items, ...Object.keys(state.found)])].filter((id) => state.known[knownKey(loc.id, 'item', id)]);
    if (!fish.length && !items.length) continue;
    const found = (/** @type {'fish' | 'item'} */ kind, /** @type {string} */ id) => state.known[knownKey(loc.id, kind, id)] === 'found';
    const byName = (/** @type {'fish' | 'item'} */ kind) => (/** @type {string} */ a, /** @type {string} */ b) =>
      Number(found(kind, b)) - Number(found(kind, a)) || t((kind === 'fish' ? content.fish : content.items)[a].name).localeCompare(t((kind === 'fish' ? content.fish : content.items)[b].name));
    places.push(
      el('h3', { textContent: placeName(state, loc.id, showCompletion) }),
      el('div', { className: 'grid collection' }, [
        ...fish.sort(byName('fish')).map((id) => speciesSlot(state, id, found('fish', id))),
        ...items.sort(byName('item')).map((id) => (found('item', id) ? slot({ kind: 'item', id }, state.found[id] ?? 1) : unknownItemSlot(id))),
      ]),
    );
  }
  // Sets with a piece found (8.7): how many of their pieces.
  const sets = Object.values(content.sets ?? {})
    .filter((s) => !s.retired)
    .map((s) => ({ s, pieces: setPieces(s.id) }))
    .filter(({ pieces }) => pieces.some((id) => state.found[id]))
    .map(({ s, pieces }) =>
      el('p', { textContent: t('journal.set', { set: t(s.name), found: pieces.filter((id) => state.found[id]).length, total: pieces.length }) }),
    );
  // Class fish caught (D114), by class.
  const champions = Object.entries(state.book.champions ?? {})
    .map(([id, n]) => {
      const name = content.rules.champions.classes.find((/** @type {{ id: string }} */ c) => c.id === id)?.name;
      return name ? `${t(name)}${n > 1 ? ` ×${n}` : ''}` : '';
    })
    .filter(Boolean);
  return [
    el('dl', { className: 'stats' }, [
      el('dt', { textContent: t('journal.casts') }),
      el('dd', { textContent: String(state.book.casts) }),
      el('dt', { textContent: t('journal.catches') }),
      el('dd', { textContent: String(state.book.catches) }),
      ...(champions.length ? [el('dt', { textContent: t('journal.champions') }), el('dd', { textContent: champions.join(', ') })] : []),
    ]),
    ...(places.length ? places : [el('p', { className: 'muted', textContent: t('journal.none') })]),
    ...(sets.length ? [el('h3', { textContent: t('journal.sets') }), ...sets] : []),
  ];
}

/**
 * An item known to be somewhere but not found yet (R4.5): its silhouette.
 * @param {string} id
 */
function unknownItemSlot(id) {
  const art = paintIcon(iconName({ kind: 'item', id }));
  art.className = 'icon';
  const b = el('button', { type: 'button', className: 'slot unknown' }, [art]);
  const tip = { title: t('journal.unknownItem'), lines: [{ text: t('journal.heard') }] };
  b.setAttribute('aria-label', tip.title);
  bindTip(b, tip);
  return b;
}

/**
 * A species in the collection (R4.3): its icon and its records on a tap, or,
 * if it has only been seen or heard of here, its silhouette and no name.
 * @param {GameState} state
 * @param {string} id
 * @param {boolean} foundHere
 */
function speciesSlot(state, id, foundHere) {
  const fish = content.fish[id];
  const e = foundHere ? state.book.fish[id] : undefined;
  const art = paintIcon(iconName({ kind: 'fish', id }));
  art.className = 'icon';
  const b = el('button', { type: 'button', className: e ? 'slot' : 'slot unknown' }, [art]);
  /** @type {import('./tooltip.js').Tip} */
  const tip = e
    ? {
        title: t(fish.name),
        colour: rarityColour(fish.rarity),
        icon: iconName({ kind: 'fish', id }),
        lines: [{ text: t('journal.entry', { caught: e.caught, smallest: e.smallest.size, largest: e.largest.size, average: Math.round(e.totalSize / e.caught) }) }],
      }
    : { title: t('journal.unknown'), lines: [{ text: t(state.book.fish[id] ? 'journal.heard' : 'journal.gotAway') }] };
  b.style.borderColor = tip.colour ?? '';
  b.setAttribute('aria-label', tip.title);
  bindTip(b, tip);
  return b;
}

/**
 * A location's name, with how much of it has been found once that shows
 * (R5.3).
 * @param {GameState} state
 * @param {string} location
 * @param {boolean} showCompletion
 */
function placeName(state, location, showCompletion) {
  const place = t(content.locations[location].name);
  if (!showCompletion) return t('journal.place', { place });
  const { found, total } = completion(state, location);
  return t('journal.placeShown', { place, percent: total ? Math.floor((100 * found) / total) : 0 });
}

/**
 * Every location's known spots to go to, the one the player is at pressed
 * (D101): a plain list until the real map (CR-7). A spot shows once the player
 * knows of it (R11.8).
 * @param {GameState} state
 * @param {(location: string, spot: string) => void} onTravel
 * @param {boolean} [showCompletion]  Each location's completion shows (R5.3).
 */
export function mapPane(state, onTravel, showCompletion = false) {
  /** @type {HTMLElement[]} */
  const out = [];
  for (const loc of Object.values(content.locations)) {
    // Only the places on the map (8.2).
    if (!placeOpen(state, loc.id)) continue;
    out.push(el('p', { className: 'name', textContent: placeName(state, loc.id, showCompletion) }));
    // Somewhere an event holds the player: no other location (R10.8, 7.6).
    const held = Boolean(state.locked) && state.locked !== loc.id;
    // Only the spots the player knows of (R11.8, D58).
    const known = (loc.spots ?? []).filter((/** @type {{ id: string }} */ spot) => spotKnown(state, loc.id, spot.id));
    const spots = known.map((/** @type {{ id: string, name: string }} */ spot) => {
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
export function bucketPane(state, size) {
  const fish = state.bucket.reduce((n, b) => n + b.count, 0);
  return [
    el('p', { className: 'muted', textContent: t('bucket.count', { count: fish, size }) }),
    el('div', { className: 'grid' }, [...state.bucket.map((b, i) => fishSlot(b.fish, b.count, i)), ...empties(size - fish)]),
  ];
}

/**
 * A fish in the bucket, with its options on right-click or long-press (R21.1):
 * `data-fish` is its place in the bucket.
 * @param {import('../engine/fish.js').FishInstance} fish
 * @param {number} count
 * @param {number} index
 */
function fishSlot(fish, count, index) {
  const b = slot({ kind: 'fish', fish }, count, t('tip.options'));
  b.dataset.fish = String(index);
  return b;
}

/**
 * A vendor's barter window (R18.2), the stew's pot (R18.7) or the aquarium
 * (R17.5), by the kind of vendor.
 * @param {GameState} state
 * @param {string} id  The vendor.
 * @param {{ trade: (offer: string) => void, stew: (index: number) => void, unstew: (index: number) => void, eat: () => void,
 *   toTank: (index: number) => void, fromTank: (index: number) => void }} on
 */
export function shopPane(state, id, on) {
  const vendor = content.vendors[id];
  if (vendor.kind === 'stew') return stewPane(state, on);
  if (vendor.kind === 'aquarium') return aquariumPane(state, on);
  if (vendorStatus(state, id) !== 'open') return [el('p', { className: 'muted', textContent: t('shop.closed') })];
  const list = offersFor(state, id);
  if (!list.length) return [el('p', { className: 'muted', textContent: t('shop.none') })];
  return list.map((offer) => {
    const gives = offer.gives.item
      ? slot({ kind: 'item', id: offer.gives.item }, offer.gives.count ?? 1)
      : el('span', { className: 'slot buff-slot', textContent: '▲' });
    const name = offer.gives.item
      ? link({ kind: 'item', id: offer.gives.item })
      : el('span', { className: 'muted', textContent: t(content.buffs[/** @type {string} */ (offer.gives.buff)].name) });
    const costs = offer.costs.map((c) => {
      const { have, need, met } = costStatus(state, c);
      const what = c.item
        ? link({ kind: 'item', id: c.item })
        : el('span', {
            textContent: c.fish && c.fish !== 'any' ? t(content.fish[c.fish].name) : c.rarity ? t('shop.fishAtLeast', { rarity: t(`rarity.${c.rarity}`) }) : t('shop.anyFish'),
          });
      return el('li', { className: met ? 'cost met' : 'cost short' }, [what, ' ', el('span', { className: 'cost-count', textContent: t('shop.have', { have, need }) })]);
    });
    const ok = canTrade(state, id, offer.id);
    const button = el('button', { type: 'button', className: 'trade-button', textContent: t('shop.trade'), disabled: !ok });
    button.addEventListener('click', () => on.trade(offer.id));
    return el('div', { className: 'offer' }, [el('div', { className: 'offer-head' }, [gives, name]), el('ul', { className: 'costs' }, costs), button]);
  });
}

/**
 * The perpetual stew (R18.7, R19.4): the bucket on one side, the pot on the
 * other, and what a bowl would give now.
 * @param {GameState} state
 * @param {{ stew: (index: number) => void, unstew: (index: number) => void, eat: () => void }} on
 */
function stewPane(state, on) {
  const pot = state.stewPot ?? [];
  const bowl = bowlOf(pot);
  const eat = el('button', { type: 'button', className: 'trade-button', textContent: t('stew.eat'), disabled: !pot.length });
  eat.addEventListener('click', on.eat);
  return [
    el('p', { className: 'muted', textContent: t('stew.bucket') }),
    el('div', { className: 'grid' }, state.bucket.map((b, i) => clickSlot(slot({ kind: 'fish', fish: b.fish }, b.count), () => on.stew(i)))),
    el('p', { className: 'muted', textContent: t('stew.pot') }),
    pot.length
      ? el('div', { className: 'grid' }, pot.map((f, i) => clickSlot(slot({ kind: 'fish', fish: f }), () => on.unstew(i))))
      : el('p', { className: 'muted', textContent: t('stew.empty') }),
    ...(pot.length ? [el('p', { className: 'tip-good', textContent: t('stew.bowl', { hours: hoursText(Math.max(30, bowl.minutes)), effects: effectsText(bowl.effects) }) })] : []),
    eat,
  ];
}

/**
 * The aquarium (R17.5): the bucket, and the fish in the tank.
 * @param {GameState} state
 * @param {{ toTank: (index: number) => void, fromTank: (index: number) => void }} on
 */
function aquariumPane(state, on) {
  const tank = state.aquarium ?? [];
  return [
    el('p', { className: 'muted', textContent: t('aquarium.bucket') }),
    el('div', { className: 'grid' }, state.bucket.map((b, i) => clickSlot(slot({ kind: 'fish', fish: b.fish }, b.count), () => on.toTank(i)))),
    el('p', { className: 'muted', textContent: t('aquarium.tank', { count: tank.length, size: content.rules.stew.aquarium }) }),
    el('div', { className: 'grid' }, tank.map((f, i) => clickSlot(slot({ kind: 'fish', fish: f }), () => on.fromTank(i)))),
  ];
}

/**
 * A slot that does something on a click, its tooltip still on hover.
 * @param {HTMLButtonElement} b
 * @param {() => void} onClick
 */
function clickSlot(b, onClick) {
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return b;
}

/** @typedef {'equipment' | 'consumables' | 'stuff' | 'junk'} BagTab */
export const BAG_TABS = /** @type {BagTab[]} */ (['equipment', 'consumables', 'stuff', 'junk']);

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
 * Settings (D81): the theme, the font (D132), whether the dice are shown (D99), the sound's
 * volume (9.2).
 * @param {import('../settings.js').Settings} settings
 * @param {(change: Partial<import('../settings.js').Settings>) => void} onChange  Only what changed.
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
            onchange: () => onChange({ theme }),
          }),
          el('span', { textContent: t(`settings.${theme}`) }),
        ]),
      ),
    ),
    el('h3', { textContent: t('settings.font') }),
    el(
      'div',
      { className: 'choices' },
      /** @type {const} */ (['clear', 'pixel']).map((font) =>
        el('label', {}, [
          el('input', {
            type: 'radio',
            name: 'font',
            id: `font-${font}`,
            value: font,
            checked: settings.font === font,
            onchange: () => onChange({ font }),
          }),
          el('span', { textContent: t(`settings.${font}`) }),
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
          onchange: (/** @type {Event} */ e) => onChange({ dice: /** @type {HTMLInputElement} */ (e.target).checked }),
        }),
        el('span', { textContent: t('settings.showDice') }),
      ]),
    ]),
    el('h3', { textContent: t('settings.sound') }),
    el('div', { className: 'choices' }, [
      el('label', {}, [
        el('input', {
          type: 'range',
          id: 'sound-volume',
          min: '0',
          max: '100',
          step: '10',
          value: String(settings.sound),
          onchange: (/** @type {Event} */ e) => onChange({ sound: Number(/** @type {HTMLInputElement} */ (e.target).value) }),
        }),
        el('span', { textContent: t('settings.volume') }),
      ]),
    ]),
  ];
}
