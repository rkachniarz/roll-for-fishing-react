// @ts-check
// The ?dev bench (docs/spec.md, R9.5; DEV_PLAN 3.4): every game value, the
// world, the character and the inventory, for tuning by hand (D27). Game value
// changes are overrides added on top of everything else and never saved;
// changes to the world, character and inventory are made to the saved game.
//
// Development only: none of this is reachable without ?dev.

import { content } from './generated/content.js';
import { t } from './strings.js';
import { GAME_VALUES } from './engine/values.js';
import { valuesFor } from './engine/game.js';
import { diceFrom, levelFor } from './engine/state.js';
import { weatherAt } from './engine/weather.js';
import { clock, TIME } from './engine/time.js';

/** @typedef {import('./engine/state.js').GameState} GameState */

/**
 * @param {HTMLElement} root
 * @param {Object} api
 * @param {() => GameState | null} api.getState
 * @param {(state: GameState) => void} api.setState  Ignored while a cast is in progress.
 * @param {Record<string, number>} api.overrides  Game value -> amount added; read by the page for every cast.
 * @param {() => import('./engine/values.js').Source[]} api.extraSources
 * @param {() => void} api.onChange
 */
export function createBench(root, { getState, setState, overrides, extraSources, onChange }) {
  /** @param {(s: GameState) => GameState} change */
  const edit = (change) => {
    const s = getState();
    if (s) setState(change(structuredClone(s)));
  };

  /** @template {keyof HTMLElementTagNameMap} K @param {K} tag @param {Record<string, any>} [props] @param {(Node | string)[]} [kids] */
  function el(tag, props = {}, kids = []) {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...kids);
    return node;
  }
  /** @param {string} text @param {() => void} onclick */
  const button = (text, onclick) => el('button', { type: 'button', textContent: text, onclick });
  /** @param {string} title @param {(Node | string)[]} kids */
  const section = (title, kids) => el('section', { className: 'bench-section' }, [el('h3', { textContent: title }), ...kids]);

  // ---------- Seed ----------
  const seedLine = el('p', { className: 'dev-seed' });

  // ---------- Game values ----------
  /** @type {Record<string, HTMLInputElement>} */
  const valueInputs = {};
  const presets = el('div', { className: 'dev-presets' }, [
    button('Tight strikes', () => setOverride({ reactionFast: 350, reactionOk: 700 })),
    button('Default', () => setOverride({ reactionFast: 450, reactionOk: 900 })),
    button('Lenient strikes', () => setOverride({ reactionFast: 600, reactionOk: 1200 })),
    button('Clear overrides', () => {
      for (const k of Object.keys(overrides)) delete overrides[k];
      onChange();
    }),
  ]);
  const valueGrid = el('div', { className: 'dev-fields' });
  for (const name of Object.keys(GAME_VALUES)) {
    const input = el('input', { type: 'number', id: `dev-${name}` });
    input.addEventListener('change', () => setOverride({ [name]: Number(input.value) }));
    valueInputs[name] = input;
    valueGrid.append(el('label', { htmlFor: input.id, textContent: `${t(`value.${name}`)} (${name})` }), input);
  }

  /**
   * Sets values to these totals, by changing their overrides.
   * @param {Record<string, number>} totals
   */
  function setOverride(totals) {
    const s = getState();
    if (!s) return;
    const now = valuesFor(s, extraSources()).flat;
    for (const [name, total] of Object.entries(totals)) overrides[name] = (overrides[name] ?? 0) + total - now[name];
    onChange();
  }

  // ---------- World ----------
  const locationSelect = el('select');
  for (const loc of Object.values(content.locations)) locationSelect.append(el('option', { value: loc.id, textContent: t(loc.name) }));
  const spotSelect = el('select');
  locationSelect.addEventListener('change', () => edit((s) => ({ ...s, location: locationSelect.value, spot: null })));
  spotSelect.addEventListener('change', () => edit((s) => ({ ...s, spot: spotSelect.value || null })));

  const seasonSelect = el('select');
  for (const season of Object.values(content.weather).sort((a, b) => a.order - b.order)) {
    seasonSelect.append(el('option', { value: season.id, textContent: t(season.name) }));
  }
  const cellSelect = el('select');
  seasonSelect.addEventListener('change', fillCells);
  function fillCells() {
    const season = content.weather[seasonSelect.value];
    cellSelect.replaceChildren(
      ...season.weathers.map((/** @type {{ name: string }} */ w, i) => el('option', { value: String(i), textContent: `${i}: ${t(w.name)}` })),
    );
  }
  const setWeather = button('Set weather', () =>
    edit((s) => {
      const { dice, commit } = diceFrom(s);
      return { ...s, weather: weatherAt(seasonSelect.value, Number(cellSelect.value), dice.weather), streams: commit() };
    }),
  );
  /** @param {number} minutes */
  const later = (minutes) =>
    edit((s) => {
      const time = s.time + minutes;
      const season = clock(time).season;
      if (season === s.weather.season) return { ...s, time };
      // Crossing into another season takes the weather with it, as a cast would.
      const { dice, commit } = diceFrom(s);
      return { ...s, time, weather: weatherAt(season, s.weather.cell, dice.weather), streams: commit() };
    });
  const clockLine = el('p');

  const featureSelect = el('select', { id: 'dev-feature' });
  for (const f of Object.values(content.features)) featureSelect.append(el('option', { value: f.id, textContent: `${f.kind}: ${t(f.name)}` }));
  const spawnFeature = button('Spawn in the middle', () =>
    edit((s) => {
      const def = content.features[featureSelect.value];
      s.features.push({ id: def.id, x: 128, y: 100, uses: def.uses, castsLeft: def.lifetime, born: s.book.casts });
      return s;
    }),
  );
  const featuresLine = el('p');

  // ---------- Character ----------
  const xpInput = el('input', { type: 'number', min: '0', id: 'dev-xp' });
  xpInput.addEventListener('change', () => edit((s) => ({ ...s, character: { ...s.character, xp: Math.max(0, Number(xpInput.value)) } })));
  const luckInput = el('input', { type: 'number', id: 'dev-luck' });
  luckInput.addEventListener('change', () => edit((s) => ({ ...s, character: { ...s.character, luck: Number(luckInput.value) } })));
  const statsLine = el('p');

  // ---------- Inventory ----------
  const itemSelect = el('select');
  for (const item of Object.values(content.items).sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id))) {
    itemSelect.append(el('option', { value: item.id, textContent: `${item.category}: ${t(item.name)}${item.slot ? ` [${item.slot}]` : ''}` }));
  }
  const addItem = button('Add to bags', () =>
    edit((s) => {
      const stack = s.bags.find((b) => b.id === itemSelect.value);
      if (stack) stack.count++;
      else s.bags.push({ id: itemSelect.value, count: 1 });
      return s;
    }),
  );
  const equipItem = button('Equip', () =>
    edit((s) => {
      const slot = content.items[itemSelect.value].slot;
      if (slot) s.equipped = { ...s.equipped, [slot]: itemSelect.value };
      return s;
    }),
  );
  const inventoryLine = el('p');

  // ---------- Buffs ----------
  const buffsLine = el('p');
  let buffCount = 0;
  const addBuff = (/** @type {'casts' | 'ms' | 'debuff'} */ kind) =>
    edit((s) => {
      buffCount++;
      const buff = { id: `test-buff-${buffCount}`, source: 'dev', effects: [{ value: 'fishFind', add: 20 }] };
      if (kind === 'casts') s.buffs.push({ ...buff, casts: 3 });
      else if (kind === 'ms') s.buffs.push({ ...buff, ms: 120_000 });
      else s.buffs.push({ ...buff, id: `test-debuff-${buffCount}`, effects: [{ value: 'fishFind', add: -10 }], ms: 90_000, debuff: true });
      return s;
    });

  root.append(
    section('Seed', [seedLine]),
    section('Game values (overrides, not saved)', [presets, valueGrid]),
    section('World', [
      el('div', { className: 'dev-row' }, ['Location ', locationSelect, ' spot ', spotSelect]),
      el('div', { className: 'dev-row' }, [seasonSelect, cellSelect, setWeather]),
      el('div', { className: 'dev-row' }, [
        button('+1 hour', () => later(60)),
        button('+6 hours', () => later(360)),
        button('+1 day', () => later(24 * 60)),
        button('+1 season', () => later(TIME.seasonDays * 24 * 60)),
      ]),
      clockLine,
      el('div', { className: 'dev-row' }, ['Surface feature ', featureSelect, spawnFeature, button('Clear', () => edit((s) => ({ ...s, features: [] })))]),
      featuresLine,
    ]),
    section('Character', [el('div', { className: 'dev-fields' }, [el('label', { htmlFor: 'dev-xp', textContent: 'XP' }), xpInput, el('label', { htmlFor: 'dev-luck', textContent: 'Luck' }), luckInput]), statsLine]),
    section('Inventory', [
      el('div', { className: 'dev-row' }, [itemSelect, addItem, equipItem]),
      inventoryLine,
      button('Empty bucket', () => edit((s) => ({ ...s, bucket: [] }))),
    ]),
    section('Buffs', [el('div', { className: 'dev-row' }, [button('+ Fish Find buff, 3 casts', () => addBuff('casts')), button('+ Fish Find buff, 2 min', () => addBuff('ms')), button('+ debuff, 90 s', () => addBuff('debuff'))]), buffsLine]),
  );

  return {
    /** Shows the state as it is now. */
    refresh() {
      const s = getState();
      if (!s) return;
      seedLine.textContent = `Seed ${s.seed}. A new game from it: ?dev&seed=${s.seed} with no save (New game first).`;

      const values = valuesFor(s, extraSources());
      for (const [name, input] of Object.entries(valueInputs)) {
        if (document.activeElement !== input) input.value = String(values.flat[name]);
        input.classList.toggle('overridden', Boolean(overrides[name]));
      }

      locationSelect.value = s.location;
      const spots = content.locations[s.location].spots ?? [];
      spotSelect.replaceChildren(
        el('option', { value: '', textContent: '(no spot)' }),
        ...spots.map((/** @type {{ id: string, name: string }} */ sp) => el('option', { value: sp.id, textContent: t(sp.name) })),
      );
      spotSelect.value = s.spot ?? '';
      if (!seasonSelect.value || cellSelect.options.length === 0) {
        seasonSelect.value = s.weather.season;
        fillCells();
      }
      const c = clock(s.time);
      clockLine.textContent =
        `Year ${c.year}, ${c.season} day ${c.day}, ${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')} (${c.partOfDay}). ` +
        `Weather: ${s.weather.season} #${s.weather.cell}, temperature ${s.weather.temperature}, wind ${s.weather.wind}, ` +
        `clouds ${s.weather.clouds}, precipitation ${s.weather.precipitation}.`;

      featuresLine.textContent = s.features.length
        ? s.features.map((f) => `${f.id} at ${f.x},${f.y}: ${f.uses} uses, ${f.castsLeft} casts left`).join('; ')
        : 'No surface features.';

      if (document.activeElement !== xpInput) xpInput.value = String(s.character.xp);
      if (document.activeElement !== luckInput) luckInput.value = String(s.character.luck);
      statsLine.textContent = `Level ${levelFor(s.character.xp)}. Stats: skill ${s.character.stats.fishingSkill}, fish find ${s.character.stats.fishFind}, treasure find ${s.character.stats.treasureFind}. Casts ${s.book.casts}, catches ${s.book.catches}.`;

      const fish = s.bucket.reduce((n, b) => n + b.count, 0);
      const items = s.bags.map((b) => `${t(content.items[b.id].name)}${b.count > 1 ? ` ×${b.count}` : ''}`).join(', ');
      const pools = Object.entries(s.escaped).map(([k, v]) => `${k}: ${v.length}`).join(', ');
      inventoryLine.textContent =
        `Equipped: rod ${s.equipped.rod}, bait ${s.equipped.bait ?? '(none)'}. Bucket: ${fish} fish in ${s.bucket.length} stacks. ` +
        `Bags: ${items || '(empty)'}. Escaped pools: ${pools || '(none)'}.`;

      buffsLine.textContent = s.buffs.length
        ? s.buffs.map((b) => `${b.id}: ${b.casts !== undefined ? `${b.casts} casts` : `${Math.ceil((b.ms ?? 0) / 1000)} s`}`).join(', ')
        : 'No buffs.';
    },
  };
}
