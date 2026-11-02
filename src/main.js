// @ts-check
// Wiring: input -> engine -> scene and page. The engine (src/engine/) decides
// everything; this file feeds it taps and frame times, draws what it returns,
// and saves (DEV_PLAN 3.1). The panel is plain until the owner's layout sketch
// (Q-38).
//
//   ?dev          shows the dev bench
//   ?seed=N       a new game from seed N (an existing save still wins)
//   ?wait=MS      fixes the time from cast to bite (used by tools/verify.mjs)

import { createRng, deriveSeed, randomSeed } from './rng.js';
import { diceFor } from './dice.js';
import { content } from './generated/content.js';
import { t } from './strings.js';
import { newGame, levelFor } from './engine/state.js';
import { MISS_LIMIT, castLine, strikeLine, tick, tickBuffs } from './engine/game.js';
import { classes, className, generateName, rollStats } from './engine/character.js';
import { fishNameKeys } from './engine/fish.js';
import { clock } from './engine/time.js';
import { weatherWords } from './engine/weather.js';
import { GAME_VALUES } from './engine/values.js';
import { deleteSave, loadGame, saveGame } from './save.js';
import { WATER, createScene, fitCanvas } from './scene/scene.js';
import { createBench } from './dev.js';

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

function fit() {
  const wide = window.innerWidth >= 900;
  const width = wide ? window.innerWidth - 360 - 3 * 16 : window.innerWidth - 2 * 16;
  const height = wide ? window.innerHeight - 2 * 16 : window.innerHeight * 0.62;
  // Less the wrapper's border, so the canvas itself gets the whole multiple.
  fitCanvas(canvas, width - 4, height - 4);
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
/** @type {string[]} */
const logLines = [];

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
  state = out.state;
  cast = out.cast;
  if (cast.landing && out.events.some((e) => e.type === 'cast')) scene.aimAt(cast.landing);
  for (const e of out.events) {
    const line = describeEvent(e);
    if (line) log(line);
  }
  // While a cast is in progress, only the checkpoint is saved (D74).
  if (out.checkpoint) saveGame(storage, out.checkpoint);
  else if (changed && cast.phase !== 'waiting' && cast.phase !== 'bite') saveGame(storage, state);
  render();
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
  if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return;
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return;
  if (/** @type {HTMLDialogElement} */ ($('create')).open) return;
  e.preventDefault();
  act(e.timeStamp, null);
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
      for (const e of buffs.events) log(describeEvent(e) ?? '');
      const idle = cast.phase === 'idle' || cast.phase === 'done';
      if (idle && (buffs.events.length || now - buffSavedAt > 5000)) {
        saveGame(storage, state);
        buffSavedAt = now;
      }
    }
  }
  scene.update(cast, now);
});

// ---------- Text ----------

/** @param {import('./engine/fish.js').FishInstance} fish */
const fishName = (fish) => fishNameKeys(fish).map((k) => t(k)).join(' ');
/** @param {string} id */
const itemName = (id) => t(content.items[id].name);

/**
 * The log line for an event, or null for none.
 * @param {GameEvent} e
 */
function describeEvent(e) {
  switch (e.type) {
    case 'caught':
      return t('log.caught', { fish: fishName(e.fish), size: e.fish.size, xp: e.fish.xp }) + (e.seenBefore ? ' ' + t('log.seenBefore') : '');
    case 'escaped':
      return t('log.escaped', { fish: fishName(e.fish) });
    case 'missed':
      return e.fish ? t('log.missed', { fish: fishName(e.fish) }) : t('log.missedSomething');
    case 'found': {
      const item = content.items[e.item];
      return t('log.found', { item: t(item.name), flavor: item.flavor ? t(item.flavor) : '' }).trim();
    }
    case 'bait-saved':
      return t('log.bait-saved', { bait: itemName(e.bait) });
    case 'bait-eaten':
    case 'bait-lost':
      return t(`log.${e.type}`, { bait: itemName(e.bait), fish: fishName(e.fish) });
    case 'level-up':
      return t('log.level-up', { level: e.level });
    case 'weather':
      return t('log.weather', { description: t(e.weather.description) });
    case 'season':
      return t('log.season', { season: t(content.weather[e.season].name), description: t(e.weather.description) });
    case 'buff-ended':
      return t('log.buff-ended', { buff: e.buff });
    case 'too-early':
    case 'empty':
    case 'reeled-in':
    case 'recast':
      return t(`log.${e.type}`);
    default:
      return null;
  }
}

/** @param {string} line */
function log(line) {
  if (!line) return;
  logLines.unshift(line);
  logLines.length = Math.min(logLines.length, 12);
}

/** @param {number} ms */
const duration = (ms) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`);

/** The result box: what came up, and the visible roll (R2.6, R5). */
function describeResult() {
  if (cast.phase !== 'done') return null;
  const { outcome, line } = cast;
  const strikeText =
    outcome.reactionMs !== undefined && outcome.grade !== 'late'
      ? t('result.strike', { grade: t(`grade.${outcome.grade}`), time: duration(outcome.reactionMs) }) + ' '
      : '';
  const roll = outcome.rolls[0];
  const rollText = roll
    ? t('result.roll', {
        roll: roll.result,
        mods: roll.mods.map((m) => ` ${m.value < 0 ? '−' : '+'} ${Math.abs(m.value)} ${m.label}`).join(''),
        total: roll.total,
        // The fish's own roll stays hidden until something reveals it (R5.2).
        needed: '?',
      }) + (roll.result === 20 ? t('result.natural20') : '')
    : '';
  switch (outcome.result) {
    case 'caught':
    case 'escaped':
      return { headline: t(`result.${outcome.result}`), detail: strikeText + rollText, good: outcome.result === 'caught' };
    case 'landed':
      return line.kind === 'item'
        ? { headline: t('result.landed'), detail: strikeText + itemName(line.id), good: true }
        : { headline: t('result.empty'), detail: strikeText, good: false };
    default:
      return { headline: t(`result.${outcome.result}`), detail: '', good: false };
  }
}

function render() {
  document.body.dataset.phase = cast.phase;
  $('status').textContent = t(pausing() ? 'status.pause' : `status.${cast.phase}`);

  const result = $('result');
  const r = describeResult();
  result.hidden = !r;
  if (r) {
    result.className = `result ${r.good ? 'caught' : 'lost'}`;
    const h = document.createElement('p');
    h.className = 'headline';
    h.textContent = r.headline;
    const d = document.createElement('p');
    d.className = 'detail';
    d.textContent = r.detail;
    result.replaceChildren(h, ...(r.detail ? [d] : []));
  }

  const list = $('log');
  list.replaceChildren(
    ...logLines.map((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      return li;
    }),
  );

  if (!state) return;
  const c = state.character;
  $('who').textContent = t('panel.character', {
    name: c.name,
    className: t(className(c.classId, c.gender)),
    level: levelFor(c.xp),
    xp: c.xp,
  });
  const time = clock(state.time);
  $('where').textContent = t('panel.world', {
    location: t(content.locations[state.location].name),
    season: t(content.weather[time.season].name),
    day: time.day,
    clock: `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`,
    weather: t(weatherWords(state.weather).name),
  });
  bench?.refresh();
}

// ---------- Character creation (DEV_PLAN 3.3) ----------

/** @param {string | null} notice  Shown on the page while creating, e.g. why the save couldn't load. */
function openCreation(notice) {
  const seed = seedParam ?? randomSeed();
  const dice = diceFor(createRng(deriveSeed(seed, 'character')));
  const dialog = /** @type {HTMLDialogElement} */ ($('create'));
  const nameInput = /** @type {HTMLInputElement} */ ($('createName'));
  const list = classes();
  let gender = /** @type {'m' | 'f'} */ (dice.getRandomNumber(0, 1) ? 'f' : 'm');
  let classId = list[0].id;
  let stats = rollStats(classId, dice);

  $('notice').hidden = !notice;
  $('notice').textContent = notice ?? '';
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
    logLines.length = 0;
    $('notice').hidden = true;
    dialog.close();
    // Give the keyboard back to the game: Space and Enter cast (R2.1).
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    render();
  };
  dialog.addEventListener('cancel', (e) => e.preventDefault());
  dialog.showModal();
}

$('newGame').textContent = t('panel.newGame');
$('newGame').addEventListener('click', () => {
  if (cast.phase === 'waiting' || cast.phase === 'bite') return;
  if (!confirm(t('panel.confirmNewGame'))) return;
  deleteSave(storage);
  state = null;
  cast = /** @type {GameCast} */ ({ phase: 'idle' });
  render();
  openCreation(null);
});

// ---------- ?dev: the bench (DEV_PLAN 3.4) ----------

const bench = DEV
  ? createBench(/** @type {HTMLElement} */ ($('devBench')), {
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
if (DEV) $('devPanel').hidden = false;

// ---------- Start ----------

const loaded = loadGame(storage);
if (loaded.state) {
  state = loaded.state;
  render();
} else {
  render();
  openCreation(loaded.error ? t('panel.badSave', { error: loaded.error }) : null);
}
