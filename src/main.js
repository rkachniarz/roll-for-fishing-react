// @ts-check
// Wiring: input -> engine -> scene and page. The engine (src/engine/) decides
// everything; this file feeds it taps and frame times, draws what it returns,
// and saves (DEV_PLAN 3.1). The page is laid out as the owner's phone sketch
// (D79): the scene, a row of buttons that open panes over it, and the log.
//
//   ?dev          puts the dev bench in the menu
//   ?seed=N       a new game from seed N (an existing save still wins)
//   ?wait=MS      fixes the time from cast to bite (used by tools/verify.mjs)

import { createRng, deriveSeed, randomSeed } from './rng.js';
import { diceFor } from './dice.js';
import { content } from './generated/content.js';
import { t, tParts } from './strings.js';
import { newGame, levelFor } from './engine/state.js';
import { MISS_LIMIT, cancelBuff, castLine, releaseFish, strikeLine, tick, tickBuffs, valuesFor } from './engine/game.js';
import { classes, generateName, rollStats } from './engine/character.js';
import { clock } from './engine/time.js';
import { weatherWords } from './engine/weather.js';
import { GAME_VALUES } from './engine/values.js';
import { deleteSave, loadGame, saveGame } from './save.js';
import { WATER, createScene, fitCanvas } from './scene/scene.js';
import { createBench } from './dev.js';
import { createBuffBar } from './ui/buffbar.js';
import { flyIcon } from './ui/flight.js';
import { createLog } from './ui/log.js';
import { fishName, itemName, link, rarityColour } from './ui/links.js';
import { bagPane, bucketPane, journalPane, mapPane, menuPane, playerPane } from './ui/panels.js';
import { hideTip, showTip } from './ui/tooltip.js';
import { iconName, paintIcon, weatherIcon } from './scene/icons.js';

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
  const gutter = wide ? 16 : 8;
  const width = wide ? window.innerWidth - HUD_WIDTH - 3 * gutter : window.innerWidth - 2 * gutter;
  // On a phone the row's buttons are an eighth of the width, square.
  const height = wide ? window.innerHeight - 2 * gutter : window.innerHeight - 2 * gutter - width / 8 - 16 - LOG_MIN;
  // Less the wrapper's border, so the canvas itself gets the whole multiple.
  fitCanvas(canvas, width - 4, height - 4);
  const scene = canvas.getBoundingClientRect().width + 4;
  const root = document.documentElement.style;
  root.setProperty('--gutter', `${gutter}px`);
  root.setProperty('--scene', `${scene}px`);
  // The row's icons, like the scene, at a whole number of device pixels per
  // icon pixel (D10).
  const dpr = window.devicePixelRatio || 1;
  const square = (wide ? HUD_WIDTH : scene) / 8;
  root.setProperty('--icon', `${(16 * Math.max(1, Math.floor(((square - 10) * dpr) / 16))) / dpr}px`);
}
fit();
window.addEventListener('resize', fit);

// ---------- The game ----------

const storage = window.localStorage;
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
  // The strike and roll first, then what came of them.
  const roll = ended ? describeRoll() : null;
  if (roll) log.add(roll, 'roll');
  logEvents(out.events);
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
  if (out.checkpoint) saveGame(storage, out.checkpoint);
  else if (changed && cast.phase !== 'waiting' && cast.phase !== 'bite') saveGame(storage, state);
  render();
  if (state.pendingCatch) openRelease();
}

// ---------- A full bucket: let one go (D59) ----------

function openRelease() {
  const dialog = /** @type {HTMLDialogElement} */ ($('release'));
  if (dialog.open || !state?.pendingCatch) return;
  const s = state;
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
      const out = releaseFish(s, choice);
      state = out.state;
      logEvents(out.events);
      saveGame(storage, state);
      dialog.close();
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      render();
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
  if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return;
  const target = e.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLButtonElement || target instanceof HTMLSelectElement) return;
  e.preventDefault();
  act(e.timeStamp, null);
});

// ---------- The buff bar (R12.3-R12.7) ----------

const buffBar = createBuffBar($('buffBar'), (id) => {
  if (!state) return;
  state = cancelBuff(state, id);
  // Mid-cast, the resolved cast will save it (D74).
  if (cast.phase !== 'waiting' && cast.phase !== 'bite') saveGame(storage, state);
  render();
});

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
        saveGame(storage, state);
        buffSavedAt = now;
      }
    }
  }
  if (state) buffBar.update(state.buffs);
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
    case 'weather':
      return [t('log.weather', { description: t(e.weather.description) })];
    case 'season':
      return [t('log.season', { season: t(content.weather[e.season].name), description: t(e.weather.description) })];
    case 'buff-ended':
      return [t('log.buff-ended', { buff: e.buff })];
    case 'feature-appeared':
    case 'feature-hit':
    case 'feature-gone': {
      const name = t(content.features[e.feature].name);
      return [t(`log.${e.type}`, { feature: name, Feature: name.charAt(0).toUpperCase() + name.slice(1) })];
    }
    case 'released':
      return tParts('log.released', { fish: fishLink(e.fish) });
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

/** @param {number} ms */
const duration = (ms) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`);

/** The strike and the visible roll (R2.6, R5), for the log; null if there were neither. */
function describeRoll() {
  if (cast.phase !== 'done') return null;
  const { outcome } = cast;
  const parts = [];
  if (outcome.reactionMs !== undefined && outcome.grade !== 'late') {
    parts.push(t('log.strike', { grade: t(`grade.${outcome.grade}`), time: duration(outcome.reactionMs) }));
  }
  const roll = outcome.rolls[0];
  if (roll) {
    parts.push(
      t('log.roll', {
        roll: roll.result,
        mods: roll.mods.map((m) => ` ${m.value < 0 ? '−' : '+'} ${Math.abs(m.value)} ${m.label}`).join(''),
        total: roll.total,
        // The fish's own roll stays hidden until something reveals it (R5.2).
        needed: '?',
      }) + (roll.result === 20 ? t('log.natural20') : ''),
    );
  }
  return parts.length ? [parts.join(' ')] : null;
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
    togglePane(/** @type {Pane} */ (id));
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

/** @typedef {'player' | 'journal' | 'map' | 'bucket' | 'bag' | 'menu' | 'dev'} Pane */
/** @type {Pane | null} */
let pane = null;
/** @type {import('./ui/panels.js').BagTab} */
let bagTabShown = 'equipment';

/** @param {Pane} name */
function togglePane(name) {
  pane = pane === name ? null : name;
  hideTip();
  renderPane();
}

function closePane() {
  if (!pane) return;
  pane = null;
  hideTip();
  renderPane();
}
$('paneClose').setAttribute('aria-label', t('hud.close'));
$('paneClose').addEventListener('click', closePane);

function renderPane() {
  const box = $('pane');
  box.hidden = !pane || !state;
  for (const b of document.querySelectorAll('[data-pane]')) b.setAttribute('aria-pressed', String(b.getAttribute('data-pane') === pane));
  if (!pane || !state) return;
  const s = state;
  const body = $('paneBody');
  $('paneTitle').textContent = pane === 'player' ? s.character.name : pane === 'dev' ? t('menu.dev') : t(`hud.${pane}`);
  switch (pane) {
    case 'player':
      body.replaceChildren(...playerPane(s, valuesFor(s, extraSources()).flat));
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
    case 'bag':
      body.replaceChildren(
        ...bagPane(s, bagTabShown, (tab) => {
          bagTabShown = tab;
          hideTip();
          renderPane();
        }),
      );
      break;
    case 'menu':
      body.replaceChildren(...menuPane({ onNewGame: startOver, onDev: bench ? () => togglePane('dev') : null }));
      break;
    case 'dev':
      // Put back only if it isn't there, so a field being typed in keeps focus.
      if (body.firstChild !== benchRoot) body.replaceChildren(benchRoot);
      bench?.refresh();
      break;
  }
}

// ---------- Drawing it all ----------

function render() {
  document.body.dataset.phase = cast.phase;
  $('status').textContent = t(pausing() ? 'status.pause' : `status.${cast.phase}`);
  if (!state) {
    renderPane();
    return;
  }
  buffBar.update(state.buffs);
  scene.setFeatures(state.features.map((f) => ({ ...f, kind: content.features[f.id].kind })));
  const now = clock(state.time);
  scene.setWorld({ hour: now.hour, minute: now.minute, season: now.season, weather: state.weather });
  renderHud();
  renderPane();
}

// ---------- Character creation (DEV_PLAN 3.3) ----------

function openCreation() {
  const seed = seedParam ?? randomSeed();
  const dice = diceFor(createRng(deriveSeed(seed, 'character')));
  const dialog = /** @type {HTMLDialogElement} */ ($('create'));
  const nameInput = /** @type {HTMLInputElement} */ ($('createName'));
  const list = classes();
  let gender = /** @type {'m' | 'f'} */ (dice.getRandomNumber(0, 1) ? 'f' : 'm');
  let classId = list[0].id;
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
        detail: statKeys.map((k) => `${t(`value.${k}`)} ${t('create.range', c.stats[k])}`).join(' · '),
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
    state = newGame({ seed, character: { name, gender, classId, stats, luck: 0, xp: 0 } });
    saveGame(storage, state);
    cast = /** @type {GameCast} */ ({ phase: 'idle' });
    dialog.close();
    // Give the keyboard back to the game: Space and Enter cast (R2.1).
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    render();
  };
  dialog.addEventListener('cancel', (e) => e.preventDefault());
  dialog.showModal();
}

function startOver() {
  if (cast.phase === 'waiting' || cast.phase === 'bite') return;
  if (!confirm(t('menu.confirmNewGame'))) return;
  deleteSave(storage);
  state = null;
  cast = /** @type {GameCast} */ ({ phase: 'idle' });
  pane = null;
  log.clear();
  render();
  openCreation();
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
        state = next;
        saveGame(storage, state);
        render();
      },
      overrides: devOverrides,
      extraSources,
      onChange: render,
    })
  : null;

// ---------- Start ----------

const loaded = loadGame(storage);
if (loaded.state) {
  state = loaded.state;
  render();
  if (state.pendingCatch) openRelease();
} else {
  render();
  if (loaded.error) log.add([t('menu.badSave', { error: loaded.error })], 'bad');
  openCreation();
}
