// @ts-check
// Wiring: input -> engine -> scene and page. The engine (src/engine/) decides
// everything; this file feeds it taps and frame times, draws what it returns,
// and saves (DEV_PLAN 3.1). The page is laid out as the owner's phone sketch
// (D79): the scene, a row of buttons that open panes over it, and the log.
// It opens on the title screen, with three save slots (D80).
//
//   ?dev          puts the dev bench in the menu
//   ?seed=N       a new game from seed N (an existing save still wins)
//   ?wait=MS      fixes the time from cast to bite (used by tools/verify.mjs)

import { createRng, deriveSeed, randomSeed } from './rng.js';
import { diceFor } from './dice.js';
import { content } from './generated/content.js';
import { t, tParts } from './strings.js';
import { newGame, levelFor } from './engine/state.js';
import { MISS_LIMIT, cancelBuff, castLine, releaseFish, strikeLine, tick, tickBuffs, useAbility, valuesFor } from './engine/game.js';
import { abilityStatus, activePerks } from './engine/abilities.js';
import { createActionBar } from './ui/actionbar.js';
import { className, classes, generateName, rollStats } from './engine/character.js';
import { clock } from './engine/time.js';
import { weatherWords } from './engine/weather.js';
import { GAME_VALUES } from './engine/values.js';
import { deleteSave, lastSlot, listSlots, saveGame } from './save.js';
import { applySettings, loadSettings, saveSettings } from './settings.js';
import { WATER, createScene } from './scene/scene.js';
import { createBench } from './dev.js';
import { createBuffBar } from './ui/buffbar.js';
import { flyIcon } from './ui/flight.js';
import { createLog } from './ui/log.js';
import { bagTab, fishName, itemName, link, rarityColour } from './ui/links.js';
import { bagPane, bucketPane, journalPane, mapPane, menuPane, playerPane, settingsPane } from './ui/panels.js';
import { floatText } from './ui/floater.js';
import { hideTip, showTip } from './ui/tooltip.js';
import { iconName, paintIcon, weatherIcon } from './scene/icons.js';
import { equip, fits, moveEquipped, moveInBags, quickEquip, unequip, EQUIPMENT_SLOTS } from './engine/equipment.js';
import { setupDrag } from './ui/drag.js';
import { showError } from './ui/errors.js';
import { arrive, choose, openSlide } from './engine/events.js';
import { owedLevels, settlePerks, takePerk } from './engine/perks.js';
import { eventWords, sayEventText } from './ui/event-words.js';

/** @typedef {import('./engine/state.js').GameState} GameState */
/** @typedef {import('./engine/game.js').GameCast} GameCast */
/** @typedef {import('./engine/game.js').GameEvent} GameEvent */

const params = new URLSearchParams(location.search);
const DEV = params.has('dev');
const seedParam = params.has('seed') ? Number(params.get('seed')) >>> 0 : null;

// ---------- Sources of game values that are never saved ----------

/** ?dev bench overrides: game value -> how much to add. */
const devOverrides = /** @type {Record<string, number>} */ ({});

/** @returns {import('./engine/values.js').Source[]} */
function extraSources() {
  const extra = [];
  if (params.has('wait')) {
    const ms = Number(params.get('wait'));
    extra.push({
      label: '?wait',
      effects: [
        { value: 'biteDelayMin', add: ms - /** @type {number} */ (GAME_VALUES.biteDelayMin.base) },
        { value: 'biteDelayMax', add: ms - /** @type {number} */ (GAME_VALUES.biteDelayMax.base) },
      ],
    });
  }
  const dev = Object.entries(devOverrides).filter(([, add]) => add !== 0);
  if (dev.length) extra.push({ label: 'dev', effects: dev.map(([value, add]) => ({ value, add })) });
  return extra;
}

// ---------- The scene ----------

const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
const canvas = /** @type {HTMLCanvasElement} */ ($('scene'));
// Cosmetic only (D4): its own stream, so screenshots with ?seed are repeatable.
const scenery = createRng(deriveSeed(seedParam ?? randomSeed(), 'scenery'));
const scene = await createScene(canvas, () => scenery.next());

/** The button row and log beside the scene on a wide screen. */
const HUD_WIDTH = 360;
/** On a phone, the room kept under the scene for the log, at least. */
const LOG_MIN = 150;

function fit() {
  const wide = window.innerWidth >= 900;
  const gutter = wide ? 16 : 2;
  const width = wide ? window.innerWidth - HUD_WIDTH - 3 * gutter : window.innerWidth - 2 * gutter;
  // On a phone the row's buttons are an eighth of the width, square, and the
  // spacer above the scene is as tall again (D94); the action bar, when there
  // is one, is another row like it (D96).
  const actions = document.getElementById('actions')?.hidden === false ? (width - 21) / 8 + 6 : 0;
  const height = wide ? window.innerHeight - 2 * gutter : window.innerHeight - 2 * gutter - width / 4 - 22 - actions - LOG_MIN;
  // Less the wrapper's border, so the canvas itself gets the whole multiple.
  // On a phone the scene widens to fill the width (D93).
  scene.fit(width - 4, height - 4);
  const box = canvas.getBoundingClientRect();
  const sceneWidth = box.width + 4;
  const root = document.documentElement.style;
  root.setProperty('--gutter', `${gutter}px`);
  root.setProperty('--scene', `${sceneWidth}px`);
  root.setProperty('--scene-height', `${box.height + 4}px`);
  // The row's icons, like the scene, at a whole number of device pixels per
  // icon pixel (D10).
  const dpr = window.devicePixelRatio || 1;
  const square = (wide ? HUD_WIDTH : sceneWidth) / 8;
  // Icons are 32 pixels square (D98).
  const k = Math.max(1, Math.floor(((square - 10) * dpr) / 32));
  root.setProperty('--icon', `${(32 * k) / dpr}px`);
  // The weather's icon is smaller, as in the sketch, leaving room for the words.
  root.setProperty('--icon-small', `${(32 * Math.max(1, Math.floor((k * 3) / 4))) / dpr}px`);
}
fit();
window.addEventListener('resize', fit);

// ---------- The game ----------

const storage = window.localStorage;
let settings = loadSettings(storage);
applySettings(settings);
/** The save slot being played (D80). */
let slot = 1;
/** @param {GameState} s */
const save = (s) => saveGame(storage, slot, s);
/** @type {GameState | null} */
let state = null;
/** @type {GameCast} */
let cast = /** @type {GameCast} */ ({ phase: 'idle' });
let lastActAt = -Infinity;
const log = createLog($('log'));

/** The pause after a first missed splash, before the line counts as cast again (D64). */
function pausing() {
  return (
    cast.phase === 'done' &&
    cast.outcome.result === 'missed' &&
    !cast.reeledIn &&
    state !== null &&
    state.missStreak < MISS_LIMIT
  );
}

/** The line is out, or about to go out again: no changing equipment (D83). */
function lineOut() {
  return cast.phase === 'waiting' || cast.phase === 'bite' || pausing();
}

/**
 * Takes what the engine returned: the new state and cast, the log, the save.
 * @param {{ state: GameState, cast: GameCast, checkpoint?: GameState, events: GameEvent[] }} out
 */
function apply(out) {
  const changed = out.state !== state;
  const ended = out.cast.phase === 'done' && cast.phase !== 'done';
  state = out.state;
  cast = out.cast;
  if (cast.landing && out.events.some((e) => e.type === 'cast')) scene.aimAt(cast.landing);
  // One cast in a hundred flies way off (D85): said over where it landed.
  if (cast.landing && out.events.some((e) => e.type === 'wild-cast')) {
    floatText({ text: t('float.wild'), tone: 'wild', at: scene.toClient(cast.landing), scale: scene.pixelScale() });
  }
  if (ended) floatStrike();
  // The roll first, then what came of it.
  const roll = ended ? describeRoll() : null;
  if (roll) log.add(roll, 'roll');
  logEvents(out.events);
  if (out.events.some((e) => e.type === 'no-rod')) showError($('errors'), t('error.noRod'));
  for (const e of out.events) {
    if ((e.type === 'caught' || e.type === 'found') && cast.landing) {
      const thing = e.type === 'caught' ? { kind: /** @type {const} */ ('fish'), id: e.fish.species } : { kind: /** @type {const} */ ('item'), id: e.item };
      flyIcon({
        icon: iconName(thing),
        rarity: e.type === 'caught' ? e.fish.rarity : content.items[e.item].rarity,
        from: scene.toClient(cast.landing),
        to: $(e.type === 'caught' ? 'bucket' : 'bag'),
        scale: scene.pixelScale(),
      });
    }
  }
  // While a cast is in progress, only the checkpoint is saved (D74).
  if (out.checkpoint) save(out.checkpoint);
  else if (changed && cast.phase !== 'waiting' && cast.phase !== 'bite') save(state);
  render();
  promptPlayer();
}

/** Whatever waits for the player: a full bucket first, then an open event. */
function promptPlayer() {
  if (state?.pendingCatch) openRelease();
  else if (state?.event) openEvent();
}

// ---------- A full bucket: let one go (D59) ----------

function openRelease() {
  const dialog = /** @type {HTMLDialogElement} */ ($('release'));
  if (dialog.open || !state?.pendingCatch) return;
  const s = state;
  // The tap or key that struck the fish mustn't also let one go: on a phone,
  // the tap's click lands on the first choice as the dialog opens under it.
  const openedAt = performance.now();
  $('releaseTitle').textContent = t('release.title');
  $('releaseText').textContent = t('release.text');
  /**
   * @param {import('./engine/fish.js').FishInstance} fish
   * @param {number | 'new'} choice
   * @param {string} [note]
   */
  const option = (fish, choice, note) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = t('release.fish', { fish: fishName(fish), size: fish.size }) + (note ? ` (${note})` : '');
    b.style.color = rarityColour(fish.rarity);
    b.addEventListener('click', () => {
      if (performance.now() - openedAt < 400) return;
      const out = releaseFish(s, choice);
      state = out.state;
      logEvents(out.events);
      save(state);
      dialog.close();
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      render();
      promptPlayer();
    });
    return b;
  };
  $('releaseList').replaceChildren(
    option(/** @type {import('./engine/fish.js').FishInstance} */ (s.pendingCatch), 'new', t('release.new')),
    ...s.bucket.map((b, i) => option(b.fish, i, b.count > 1 ? `×${b.count}` : undefined)),
  );
  dialog.addEventListener('cancel', (e) => e.preventDefault());
  dialog.showModal();
}

// ---------- Events (R10, D84) ----------

/**
 * The open event's slide, as WoW's gossip window: the title, room for a
 * picture, the text, and the choices the player can take.
 */
function openEvent() {
  const dialog = /** @type {HTMLDialogElement} */ ($('event'));
  const slide = state ? openSlide(state) : null;
  if (!slide) {
    if (dialog.open) dialog.close();
    return;
  }
  // The key or tap that ended the cast mustn't also pick a choice.
  const openedAt = performance.now();
  const words = eventWords(state);
  const say = (/** @type {string[]} */ keys) => sayEventText(keys, words);
  $('eventTitle').textContent = say(slide.title);
  const art = $('eventArt');
  art.hidden = !slide.art;
  art.replaceChildren(...(slide.art ? [Object.assign(document.createElement('img'), { src: `assets/events/${slide.art}.png`, alt: '' })] : []));
  $('eventText').replaceChildren(
    ...say(slide.text).split('\n\n').map((p) => Object.assign(document.createElement('p'), { textContent: p })),
  );
  $('eventChoices').replaceChildren(
    ...slide.choices.map((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = say(c.text);
      b.addEventListener('click', () => {
        if (!state || performance.now() - openedAt < 400) return;
        const out = choose(state, c.index);
        state = out.state;
        logEvents(out.events);
        save(state);
        if (state.event) openEvent();
        else {
          dialog.close();
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        }
        render();
      });
      return b;
    }),
  );
  if (!dialog.open) {
    dialog.addEventListener('cancel', (e) => e.preventDefault());
    dialog.showModal();
  }
}

/**
 * One action: cast, strike, or pull the line out during the pause.
 * @param {number} now  The event's timestamp (same clock as performance.now()).
 * @param {{ x: number, y: number } | null} point  Where on the water, if tapped.
 */
function act(now, point) {
  if (!state) return;
  // A double tap on the splash shouldn't strike and then instantly recast.
  if (cast.phase === 'done' && now - lastActAt < 500) return;
  lastActAt = now;
  if (cast.phase === 'idle' || (cast.phase === 'done' && !pausing())) {
    // No casting with the game menu open; a strike still lands, so opening
    // it mid-cast never costs a fish (D94).
    if (menuOpen()) return;
    apply(castLine(state, now, { aim: point, bounds: WATER, extra: extraSources() }));
  } else {
    apply(strikeLine(state, cast, now));
  }
}

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  act(e.timeStamp, scene.toScene(e.clientX, e.clientY));
});

window.addEventListener('keydown', (e) => {
  if (document.querySelector('dialog[open]')) return;
  if (e.key === 'Escape') {
    closePane();
    return;
  }
  const target = e.target;
  // 1, 2, 3…: the action bar, as in WoW (D96).
  if (!e.repeat && /^[1-9]$/.test(e.key) && !(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
    const id = state ? activePerks(state)[Number(e.key) - 1] : undefined;
    if (id) {
      e.preventDefault();
      useFromBar(id);
    }
    return;
  }
  if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return;
  if (target instanceof HTMLInputElement || target instanceof HTMLButtonElement || target instanceof HTMLSelectElement) return;
  e.preventDefault();
  act(e.timeStamp, null);
});

// ---------- The buff bar (R12.3-R12.7) ----------

const buffBar = createBuffBar($('buffBar'), (id) => {
  if (!state) return;
  state = cancelBuff(state, id);
  // Mid-cast, the resolved cast will save it (D74).
  if (cast.phase !== 'waiting' && cast.phase !== 'bite') save(state);
  render();
});

// ---------- The action bar (D96) ----------

const actionBar = createActionBar($('actions'), useFromBar);

/**
 * The player uses an ability, from the bar or its key.
 * @param {string} id
 */
function useFromBar(id) {
  if (!state) return;
  const status = abilityStatus(state, id);
  if (!status.usable) {
    const why = !status.working ? 'notYet' : status.cooldown ? 'notReady' : status.armed ? 'armed' : 'notLit';
    showError($('errors'), t(`error.ability.${why}`));
    return;
  }
  const out = useAbility(state, id, extraSources());
  if (out.state === state) return;
  state = out.state;
  // Mid-cast the checkpoint stays the save (D74); the cast saves it when it ends.
  if (cast.phase !== 'waiting' && cast.phase !== 'bite') save(state);
  logEvents(out.events);
  if (out.events.some((e) => e.type === 'bucket-full')) openRelease();
  render();
}

/** The bar, from the state; the layout makes room when it comes or goes. */
function renderActions() {
  if (!state) return;
  const before = !$('actions').hidden;
  const shown = actionBar.update(activePerks(state).map((id) => abilityStatus(/** @type {GameState} */ (state), id)));
  if (shown !== before) fit();
}

// ---------- The frame loop ----------

let buffSavedAt = 0;
scene.app.ticker.add((ticker) => {
  const now = performance.now();
  if (state) {
    const out = tick(state, cast, now);
    // The reaction is timed from when the splash is on screen, not from when
    // the engine scheduled it, which can be most of a frame earlier (D16).
    if (cast.phase === 'waiting' && out.cast.phase === 'bite') out.cast = { ...out.cast, biteAt: now };
    if (out.cast !== cast || out.state !== state) apply(out);

    // Timed buffs run down while the game is open (D32). The ticker stops in a
    // background tab, so a hidden game costs nothing.
    const buffs = tickBuffs(state, ticker.deltaMS);
    if (buffs.state !== state) {
      state = buffs.state;
      logEvents(buffs.events);
      const idle = cast.phase === 'idle' || cast.phase === 'done';
      if (idle && (buffs.events.length || now - buffSavedAt > 5000)) {
        save(state);
        buffSavedAt = now;
      }
    }
  }
  if (state) {
    buffBar.update(state.buffs);
    renderActions();
  }
  scene.update(cast, now);
});

// ---------- The log (R16.5) ----------

/** @param {import('./engine/fish.js').FishInstance} fish */
const fishLink = (fish) => link({ kind: 'fish', fish });
/** @param {string} id */
const itemLink = (id) => link({ kind: 'item', id });

/**
 * The log line for an event, or null for none.
 * @param {GameEvent} e
 * @returns {(string | Node)[] | null}
 */
function describeEvent(e) {
  switch (e.type) {
    case 'caught': {
      const parts = tParts('log.caught', { fish: fishLink(e.fish), size: e.fish.size, xp: e.fish.xp });
      return e.seenBefore ? [...parts, ' ' + t('log.seenBefore')] : parts;
    }
    case 'escaped':
      return tParts('log.escaped', { fish: fishLink(e.fish) });
    case 'missed':
      return e.fish ? tParts('log.missed', { fish: fishLink(e.fish) }) : [t('log.missedSomething')];
    case 'found':
      return tParts('log.found', { item: itemLink(e.item) });
    case 'bait-saved':
      return tParts('log.bait-saved', { bait: itemLink(e.bait) });
    case 'bait-eaten':
    case 'bait-lost':
      return tParts(`log.${e.type}`, { bait: itemLink(e.bait), fish: fishLink(e.fish) });
    case 'level-up':
      return [t('log.level-up', { level: e.level })];
    case 'perk':
      return [t('log.perk', { perk: t(content.perks[e.perk].name) })];
    case 'perk-owed':
      return [t('log.perk-owed')];
    case 'ability':
      return [t('log.ability', { ability: t(content.perks[e.perk].name) })];
    case 'lit':
      return [t('log.lit', { ability: t(content.perks[e.perk].name) })];
    case 'gutted':
      return e.item ? tParts('log.gutted', { fish: fishLink(e.fish), item: itemLink(e.item) }) : tParts('log.gutted-empty', { fish: fishLink(e.fish) });
    case 'weather':
      return [t('log.weather', { description: t(e.weather.description) })];
    case 'season':
      return [t('log.season', { season: t(content.weather[e.season].name), description: t(e.weather.description) })];
    case 'buff-ended':
      return [t('log.buff-ended', { buff: e.buff })];
    case 'feature-appeared':
    case 'feature-hit':
    case 'feature-moved':
    case 'feature-gone': {
      const name = t(content.features[e.feature].name);
      return [t(`log.${e.type}`, { feature: name, Feature: name.charAt(0).toUpperCase() + name.slice(1) })];
    }
    case 'released':
      return tParts('log.released', { fish: fishLink(e.fish) });
    case 'event-gained':
    case 'event-lost': {
      const parts = tParts(`log.${e.type}`, { item: itemLink(e.item) });
      return e.count > 1 ? [...parts, ` ×${e.count}`] : parts;
    }
    case 'event-xp':
      return [t('log.event-xp', { xp: e.xp })];
    case 'bucket-full':
    case 'too-early':
    case 'empty':
    case 'reeled-in':
    case 'recast':
      return [t(`log.${e.type}`)];
    default:
      return null;
  }
}

/** @param {GameEvent[]} events  In the order they happened. */
function logEvents(events) {
  for (const e of events) {
    const line = describeEvent(e);
    if (line) log.add(line);
  }
}

/** The visible roll (R2.6, R5), for the log; null if there was none. */
function describeRoll() {
  if (cast.phase !== 'done') return null;
  const roll = cast.outcome.rolls[0];
  if (!roll) return null;
  // The roll goes in as a mark, so the die that didn't count can be put
  // before it, struck through.
  const MARK = '\u0001';
  const text = t('log.roll', {
    roll: MARK,
    mods: roll.mods.map((m) => ` ${m.value < 0 ? '−' : '+'} ${Math.abs(m.value)} ${modName(m.label)}`).join(''),
    total: roll.total,
    // The fish's own roll stays hidden until something reveals it (R5.2).
    needed: '?',
  });
  const [before, after] = text.split(MARK);
  /** @type {(string | Node)[]} */
  const dice = [String(roll.result)];
  for (const d of [...(roll.dropped ?? [])].reverse()) dice.unshift(Object.assign(document.createElement('s'), { textContent: String(d) }), ' ');
  const crit = roll.result === 20 ? t('log.natural20') : roll.crit ? t('log.critical') : '';
  return [before, ...dice, after + crit];
}

/**
 * A roll modifier's name for the log: an item's or a perk's name for its id,
 * anything else as it is ('skill', 'fast reaction').
 * @param {string} label
 */
function modName(label) {
  const named = content.items[label] ?? content.perks[label];
  return named ? t(named.name) : label;
}

/** How the strike went, floating up from the bobber (D82): only when the player struck. */
function floatStrike() {
  if (cast.phase !== 'done' || !cast.landing) return;
  const { result, grade } = cast.outcome;
  const tone = result === 'too-early' ? 'early' : grade === 'fast' || grade === 'ok' || grade === 'bad' ? grade : null;
  if (!tone) return;
  floatText({ text: t(`float.${tone}`), tone, at: scene.toClient(cast.landing), scale: scene.pixelScale() });
}

// ---------- The button row, the time and the weather (R16.4) ----------

/** @type {Record<string, string>} */
const BAR_ICONS = { player: 'ui/portrait', journal: 'ui/journal', map: 'ui/map', bucket: 'ui/bucket', bag: 'ui/bag', menu: 'ui/menu' };
for (const [id, icon] of Object.entries(BAR_ICONS)) {
  const button = $(id);
  const art = paintIcon(icon);
  art.className = 'icon';
  button.append(art);
  button.setAttribute('aria-label', t(`hud.${id}`));
  button.title = t(`hud.${id}`);
  button.addEventListener('click', (e) => {
    if (id === 'bag') toggleBag();
    else togglePane(/** @type {Pane} */ (id));
    // A click shouldn't leave the keyboard on the button: Space casts (R16.3).
    if (e.detail > 0) button.blur();
  });
}
$('weather').setAttribute('aria-label', t('hud.weather'));
$('weather').addEventListener('click', () => {
  if (state) showTip($('weather'), { title: t(weatherWords(state.weather).name), lines: [] });
});

function renderHud() {
  if (!state) return;
  const now = clock(state.time);
  $('timeOfDay').textContent = t(`time.${now.partOfDay}`);
  $('seasonDay').textContent = t('hud.seasonDay', { season: t(content.weather[now.season].name), day: now.day });
  // The exact time isn't shown (R16.4); the checks read it from here.
  $('world').dataset.clock = `${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')}`;
  const icon = weatherIcon(state.weather, now.partOfDay === 'night' || now.partOfDay === 'evening');
  const weather = $('weather');
  if (weather.dataset.icon !== icon) {
    const art = paintIcon(icon);
    art.className = 'icon';
    weather.replaceChildren(art);
    weather.dataset.icon = icon;
  }

  const xp = state.character.xp;
  const curve = content.rules.levels.xp;
  const level = levelFor(xp);
  const next = curve[level + 1];
  $('xpFill').style.width = next === undefined ? '100%' : `${(100 * (xp - curve[level])) / (next - curve[level])}%`;
  $('xp').title = next === undefined ? t('player.maxLevel', { xp }) : t('hud.xp', { xp, next });
}

// ---------- The panes over the scene (R16.4) ----------

/** @typedef {'player' | 'journal' | 'map' | 'bucket' | 'menu' | 'settings' | 'dev'} Pane */
/** @type {Pane | null} */
let pane = null;
/** The bag opens over the log, alongside any pane (D83). */
let bagOpen = false;
/** @type {import('./ui/panels.js').BagTab} */
let bagTabShown = 'equipment';

/** @param {Pane} name */
/** The game menu, or the settings opened from it, is over the scene. */
function menuOpen() {
  return pane === 'menu' || pane === 'settings';
}

function togglePane(name) {
  pane = pane === name ? null : name;
  hideTip();
  renderPane();
}

function toggleBag() {
  bagOpen = !bagOpen;
  hideTip();
  renderPane();
}

/** Escape closes the pane over the scene first, then the bag. */
function closePane() {
  if (pane) pane = null;
  else if (bagOpen) bagOpen = false;
  else return;
  hideTip();
  renderPane();
}
$('paneClose').setAttribute('aria-label', t('hud.close'));
$('paneClose').addEventListener('click', () => {
  pane = null;
  hideTip();
  renderPane();
});
$('bagClose').setAttribute('aria-label', t('hud.close'));
$('bagClose').addEventListener('click', toggleBag);
// Dropped on the bag button, an equipped item goes back to the bags.
$('bag').dataset.drop = 'bag:pane';

function renderPane() {
  renderBag();
  const box = $('pane');
  box.hidden = !pane || !state;
  box.classList.toggle('pane-center', menuOpen());
  for (const b of document.querySelectorAll('[data-pane]')) {
    const name = b.getAttribute('data-pane');
    b.setAttribute('aria-pressed', String(name === 'bag' ? bagOpen && Boolean(state) : name === pane));
  }
  if (!pane || !state) return;
  const s = state;
  const body = $('paneBody');
  // Another pane starts at its top, not where the last one was scrolled to.
  if (body.dataset.shown !== pane) {
    body.dataset.shown = pane;
    queueMicrotask(() => (body.scrollTop = 0));
  }
  $('paneTitle').textContent = pane === 'player' ? s.character.name : pane === 'dev' || pane === 'settings' ? t(`menu.${pane}`) : t(`hud.${pane}`);
  switch (pane) {
    case 'player':
      body.replaceChildren(...playerPane(s, valuesFor(s, extraSources()).flat, learnPerk));
      break;
    case 'journal':
      body.replaceChildren(...journalPane(s));
      break;
    case 'map':
      body.replaceChildren(...mapPane(s));
      break;
    case 'bucket':
      body.replaceChildren(...bucketPane(s, valuesFor(s, extraSources()).flat.bucketSize));
      break;
    case 'menu':
      body.replaceChildren(
        ...menuPane({ onMainMenu: toTitle, onSettings: () => togglePane('settings'), onDev: bench ? () => togglePane('dev') : null }),
      );
      break;
    case 'settings':
      body.replaceChildren(
        ...settingsPane(settings, (next) => {
          settings = next;
          saveSettings(storage, settings);
          applySettings(settings);
          renderPane();
        }),
      );
      break;
    case 'dev':
      // Put back only if it isn't there, so a field being typed in keeps focus.
      if (body.firstChild !== benchRoot) body.replaceChildren(benchRoot);
      bench?.refresh();
      break;
  }
}

function renderBag() {
  const box = $('bagPane');
  box.hidden = !bagOpen || !state;
  if (box.hidden || !state) return;
  $('bagTitle').textContent = t('hud.bag');
  $('bagBody').replaceChildren(
    ...bagPane(state, bagTabShown, (tab) => {
      bagTabShown = tab;
      hideTip();
      renderBag();
    }),
  );
}

// ---------- Moving items: drag and drop, right-click (R8.1, R8.7; D83) ----------

/**
 * Takes what an equipment move returned: an error in red, or the new state,
 * saved. Only between casts, so a cast keeps its checkpoint (D74).
 * @param {{ state: GameState, error?: string }} out
 */
function changeItems(out) {
  if (out.error) showError($('errors'), t(`error.${out.error}`));
  if (out.state === state) return;
  state = out.state;
  save(state);
  hideTip();
  render();
}

/** @param {string} where  "bag:3", "bag:end", "bag:pane" or "equip:rod". */
const parseSpot = (where) => {
  const [kind, key] = where.split(':');
  return { kind, key, index: kind === 'bag' && /^\d+$/.test(key) ? Number(key) : null };
};

/**
 * @param {string} fromSpot
 * @param {string} toSpot
 */
function moveItem(fromSpot, toSpot) {
  if (!state || fromSpot === toSpot) return;
  if (lineOut()) {
    showError($('errors'), t('error.busy'));
    return;
  }
  const from = parseSpot(fromSpot);
  const to = parseSpot(toSpot);
  if (from.kind === 'bag' && from.index !== null) {
    if (to.kind === 'equip') changeItems(equip(state, from.index, to.key));
    // Onto the bag's background: it stays where it was.
    else if (to.key !== 'pane') changeItems(moveInBags(state, from.index, to.index));
  } else if (from.kind === 'equip') {
    const stack = state.equipped[from.key];
    if (to.kind === 'equip') changeItems(moveEquipped(state, from.key, to.key));
    else {
      // Show the tab it lands in.
      if (stack) bagTabShown = bagTab(stack.id);
      changeItems(unequip(state, from.key, to.index));
    }
  }
}

setupDrag({
  onDrop: moveItem,
  // While dragging, the slots it fits light up.
  targetsFor: (fromSpot) => {
    if (!state) return [];
    const from = parseSpot(fromSpot);
    const id = from.kind === 'bag' ? state.bags[from.index ?? -1]?.id : state.equipped[from.key]?.id;
    if (!id) return [];
    return EQUIPMENT_SLOTS.filter((s) => fits(id, s.key) && s.key !== from.key).map((s) => `equip:${s.key}`);
  },
});

// Right-click (desktop): a bag item into its slot, an equipped item back to
// the bags, as WoW's. A long-press on a phone also fires contextmenu; there it
// starts a drag instead (drag.js).
let lastPointer = 'mouse';
document.addEventListener('pointerdown', (e) => (lastPointer = e.pointerType), true);
document.addEventListener('contextmenu', (e) => {
  const node = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest?.('[data-drag]'));
  if (!node) return;
  e.preventDefault();
  if (lastPointer !== 'mouse' || !state) return;
  if (lineOut()) {
    showError($('errors'), t('error.busy'));
    return;
  }
  const spot = parseSpot(/** @type {string} */ (node.dataset.drag));
  if (spot.kind === 'bag' && spot.index !== null) changeItems(quickEquip(state, spot.index));
  else if (spot.kind === 'equip') {
    const stack = state.equipped[spot.key];
    if (stack) bagTabShown = bagTab(stack.id);
    changeItems(unequip(state, spot.key));
  }
});

// ---------- Drawing it all ----------

function render() {
  document.body.dataset.phase = cast.phase;
  $('status').textContent = t(pausing() ? 'status.pause' : `status.${cast.phase}`);
  if (!state) {
    renderPane();
    return;
  }
  buffBar.update(state.buffs);
  renderActions();
  scene.setFeatures(state.features.map((f) => ({ ...f, kind: content.features[f.id].kind })));
  // The bobber slot is cosmetic: it only changes how the bobber looks (D83).
  const bobber = state.equipped.bobber;
  scene.setBobber(bobber ? (content.items[bobber.id]?.bobber ?? null) : null);
  const now = clock(state.time);
  scene.setWorld({ hour: now.hour, minute: now.minute, season: now.season, sun: now.sun, weather: state.weather });
  renderHud();
  // A perk to choose: the character button glows, as WoW's does for a talent
  // point, without stopping the game (D96).
  const owed = owedLevels(state).length > 0;
  $('player').classList.toggle('badge', owed);
  $('player').setAttribute('aria-label', owed ? `${t('hud.player')}: ${t('hud.perkOwed')}` : t('hud.player'));
  renderPane();
}

/**
 * The player learns a perk from the character pane (D96).
 * @param {string} id
 */
function learnPerk(id) {
  if (!state) return;
  const next = takePerk(state, id);
  if (next === state) return;
  state = next;
  // Mid-cast the checkpoint stays the save (D74); the perk is saved when the
  // cast ends, and a reload before then only offers the choice again.
  if (cast.phase !== 'waiting' && cast.phase !== 'bite') save(state);
  logEvents([{ type: 'perk', perk: id }]);
  render();
}

// ---------- Character creation (DEV_PLAN 3.3) ----------

/** @param {number} chosen  The slot the new game goes in. */
function openCreation(chosen) {
  const seed = seedParam ?? randomSeed();
  const dice = diceFor(createRng(deriveSeed(seed, 'character')));
  const dialog = /** @type {HTMLDialogElement} */ ($('create'));
  const nameInput = /** @type {HTMLInputElement} */ ($('createName'));
  const list = classes();
  let gender = /** @type {'m' | 'f'} */ (dice.getRandomNumber(0, 1) ? 'f' : 'm');
  let classId = list[dice.getRandomNumber(0, list.length - 1)].id;
  let stats = rollStats(classId, dice);

  $('createTitle').textContent = t('create.title');
  $('createNameLabel').textContent = t('create.name');
  $('createRerollName').textContent = t('create.rerollName');
  $('createGenderLabel').textContent = t('create.gender');
  $('createClassLabel').textContent = t('create.class');
  $('createStatsLabel').textContent = t('create.stats');
  $('createRerollStats').textContent = t('create.rerollStats');
  $('createStart').textContent = t('create.start');
  nameInput.value = generateName(dice);

  /**
   * @param {HTMLElement} box
   * @param {string} name
   * @param {{ value: string, label: string, detail?: string }[]} options
   * @param {string} selected
   * @param {(value: string) => void} onChange
   */
  function radios(box, name, options, selected, onChange) {
    box.replaceChildren(
      ...options.map((o) => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = o.value;
        input.checked = o.value === selected;
        input.addEventListener('change', () => onChange(o.value));
        const text = document.createElement('span');
        text.textContent = o.label;
        label.append(input, text);
        if (o.detail) {
          const small = document.createElement('small');
          small.textContent = o.detail;
          label.append(small);
        }
        return label;
      }),
    );
  }

  const statKeys = /** @type {const} */ (['fishingSkill', 'fishFind', 'treasureFind']);
  function draw() {
    radios($('createGender'), 'gender', [{ value: 'm', label: t('create.gender.m') }, { value: 'f', label: t('create.gender.f') }], gender, (v) => {
      gender = /** @type {'m' | 'f'} */ (v);
      draw();
    });
    radios(
      $('createClass'),
      'class',
      list.map((c) => ({
        value: c.id,
        label: t(c.name[gender]),
        detail: c.description ? t(c.description) : undefined,
      })),
      classId,
      (v) => {
        classId = v;
        stats = rollStats(classId, dice);
        draw();
      },
    );
    $('createStats').replaceChildren(
      ...statKeys.flatMap((k) => {
        const name = document.createElement('span');
        name.textContent = t(`value.${k}`);
        const value = document.createElement('strong');
        value.textContent = String(stats[k]);
        return [name, value];
      }),
    );
  }
  draw();

  $('createRerollName').onclick = () => (nameInput.value = generateName(dice));
  $('createRerollStats').onclick = () => {
    stats = rollStats(classId, dice);
    draw();
  };
  $('createForm').onsubmit = (e) => {
    e.preventDefault();
    const name = nameInput.value.trim() || generateName(dice);
    slot = chosen;
    state = newGame({ seed, character: { name, gender, classId, stats, luck: 0, xp: 0, perks: {} }, month: new Date().getMonth() });
    // The player arrives at the start: a welcome, if there is one (D89).
    arrive(state);
    save(state);
    log.clear();
    cast = /** @type {GameCast} */ ({ phase: 'idle' });
    dialog.close();
    // Give the keyboard back to the game: Space and Enter cast (R2.1).
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    render();
    promptPlayer();
  };
  dialog.addEventListener('cancel', (e) => e.preventDefault());
  dialog.showModal();
}

// ---------- The title screen: new game, load game (D80) ----------

/** @param {'main' | 'new' | 'load'} view */
function openTitle(view = 'main') {
  const dialog = /** @type {HTMLDialogElement} */ ($('title'));
  $('titleName').textContent = t('title.name');
  /** @param {string} text @param {() => void} onclick @param {string} [id] */
  const button = (text, onclick, id) => Object.assign(document.createElement('button'), { type: 'button', textContent: text, onclick, ...(id ? { id } : {}) });
  /** @param {() => void} next */
  const leave = (next) => {
    dialog.close();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    next();
  };

  /** @param {import('./save.js').Loaded & { slot: number }} saved */
  const play = (saved) =>
    leave(() => {
      slot = saved.slot;
      // A character from before perks, or one that levelled up with an old
      // version, gets what its level gives at once (D96).
      const settled = settlePerks(saved.state);
      state = settled.state;
      if (settled.taken.length) save(state);
      cast = /** @type {GameCast} */ ({ phase: 'idle' });
      log.clear();
      logEvents([...settled.taken.map((id) => ({ type: 'perk', perk: id })), ...(owedLevels(state).length ? [{ type: 'perk-owed' }] : [])]);
      render();
      promptPlayer();
    });

  if (view === 'main') {
    $('titlePrompt').textContent = '';
    // Continue: the game played last, if it's still there.
    const last = listSlots(storage).find((s) => s.slot === lastSlot(storage) && s.state);
    $('titleMenu').replaceChildren(
      ...(last ? [button(t('title.continue'), () => play(last), 'titleContinue')] : []),
      button(t('title.new'), () => openTitle('new'), 'titleNew'),
      button(t('title.load'), () => openTitle('load'), 'titleLoad'),
    );
  } else {
    $('titlePrompt').textContent = t(view === 'new' ? 'title.pickNew' : 'title.pickLoad');
    const slots = listSlots(storage).map((saved) => {
      const b = button('', () => {}, `slot-${saved.slot}`);
      b.className = 'slot-choice';
      const head = document.createElement('strong');
      head.textContent = t('title.slot', { slot: saved.slot });
      const line = document.createElement('span');
      if (saved.state) {
        const c = saved.state.character;
        const when = clock(saved.state.time);
        line.textContent = t('title.game', {
          name: c.name,
          level: levelFor(c.xp),
          className: t(className(c.classId, c.gender)),
          season: t(content.weather[when.season].name),
          day: when.day,
        });
      } else line.textContent = saved.error ? t('title.broken', { error: saved.error }) : t('title.empty');
      b.append(head, line);
      if (view === 'load') {
        b.disabled = !saved.state;
        b.onclick = () => play(saved);
      } else {
        b.onclick = () => {
          const taken = saved.state
            ? t('title.overwrite', { slot: saved.slot, name: saved.state.character.name })
            : saved.error
              ? t('title.overwriteBroken', { slot: saved.slot })
              : null;
          if (taken && !confirm(taken)) return;
          leave(() => {
            deleteSave(storage, saved.slot);
            openCreation(saved.slot);
          });
        };
      }
      return b;
    });
    $('titleMenu').replaceChildren(...slots, button(t('title.back'), () => openTitle('main'), 'titleBack'));
  }
  if (!dialog.open) {
    dialog.addEventListener('cancel', (e) => e.preventDefault());
    dialog.showModal();
  }
}

/** Back to the title screen from the menu, between casts. The game is already saved. */
function toTitle() {
  if (!state || cast.phase === 'waiting' || cast.phase === 'bite') return;
  save(state);
  state = null;
  cast = /** @type {GameCast} */ ({ phase: 'idle' });
  pane = null;
  bagOpen = false;
  log.clear();
  render();
  openTitle();
}

// ---------- ?dev: the bench, opened from the menu (DEV_PLAN 3.4) ----------

const benchRoot = document.createElement('div');
benchRoot.className = 'dev';
benchRoot.id = 'devBench';
const bench = DEV
  ? createBench(benchRoot, {
      getState: () => state,
      // Only between casts, so a cast in progress keeps its checkpoint (D74).
      setState: (/** @type {GameState} */ next) => {
        if (cast.phase === 'waiting' || cast.phase === 'bite') return;
        // A new level from the bench gives its level-1 perk as a cast would (D96).
        const settled = settlePerks(next);
        state = settled.state;
        logEvents(settled.taken.map((id) => ({ type: 'perk', perk: id })));
        save(state);
        render();
        promptPlayer();
      },
      overrides: devOverrides,
      extraSources,
      onChange: render,
    })
  : null;

// ---------- Start ----------

render();
openTitle();
