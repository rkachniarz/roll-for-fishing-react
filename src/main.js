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
import { MISS_LIMIT, cancelBuff, castLine, chooseTreasure, releaseFish, strikeLine, tick, tickBuffs, travel, useAbility, valuesFor } from './engine/game.js';
import { abilityStatus, activePerks } from './engine/abilities.js';
import { createActionBar } from './ui/actionbar.js';
import { className, classes, generateName, rollStats } from './engine/character.js';
import { clock } from './engine/time.js';
import { weatherWords } from './engine/weather.js';
import { GAME_VALUES } from './engine/values.js';
import { deleteSave, exportGame, importGame, lastSlot, listSlots, saveGame } from './save.js';
import { completionShown, spotKnown } from './engine/knowledge.js';
import { createAudio } from './audio.js';
import { applySettings, loadSettings, saveSettings, showDice } from './settings.js';
import { createScene } from './scene/scene.js';
import { waterAt } from './engine/features.js';
import { championClass, championDebuffs, championsHere } from './engine/champions.js';
import { createBench } from './dev.js';
import { createBuffBar } from './ui/buffbar.js';
import { flyIcon } from './ui/flight.js';
import { createLog } from './ui/log.js';
import { bagTab, fishName, hoursText, itemName, link, rarityColour } from './ui/links.js';
import { bagPane, bucketPane, journalPane, mapPane, menuPane, playerPane, settingsPane, shopPane } from './ui/panels.js';
import { floatText } from './ui/floater.js';
import { bindTip, hideTip } from './ui/tooltip.js';
import { iconName, paintIcon, weatherIcon } from './scene/icons.js';
import { equip, fits, hookFish, isTiny, moveEquipped, moveInBags, quickEquip, unequip, EQUIPMENT_SLOTS } from './engine/equipment.js';
import { setupDrag } from './ui/drag.js';
import { showError } from './ui/errors.js';
import { arrive, choose, openSlide } from './engine/events.js';
import { hasPerk, owedLevels, settlePerks, takePerk } from './engine/perks.js';
import { eventWords, sayEventText } from './ui/event-words.js';
import { useItem } from './engine/buffs.js';
import { addToStew, atAquarium, atStew, eatFish, eatStew, fromAquarium, letGo, takeFromStew, toAquarium, trade } from './engine/barter.js';
import { diveStrike, endDive } from './engine/dive.js';
import { conditionBuffs, indoors } from './engine/conditions.js';
import { showMenu } from './ui/menu.js';

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

/** The button row and log beside the scene on a wide screen, before UI_WIDE. */
const HUD_WIDTH = 360;
/**
 * The page's text and boxes on a wide screen, against a phone's (D121): the
 * owner played a 1080p monitor at 125% browser zoom.
 */
const UI_WIDE = 1.25;
/** On a phone, the room kept under the scene for the log, at least. */
const LOG_MIN = 150;

function fit() {
  const wide = window.innerWidth >= 900;
  const ui = wide ? UI_WIDE : 1;
  const hudWidth = Math.round(HUD_WIDTH * ui);
  const gutter = wide ? 16 : 2;
  const width = wide ? window.innerWidth - hudWidth - 3 * gutter : window.innerWidth - 2 * gutter;
  // On a phone the row's buttons are an eighth of the width, square, and the
  // spacer above the scene is as tall again (D94). The action bar is on the
  // scene (D120), so it takes no room.
  const height = wide ? window.innerHeight - 2 * gutter : window.innerHeight - 2 * gutter - width / 4 - 22 - LOG_MIN;
  // Less the wrapper's border, so the canvas itself gets the whole multiple.
  // On a phone the scene widens to fill the width (D93).
  scene.fit(width - 4, height - 4);
  const box = canvas.getBoundingClientRect();
  const sceneWidth = box.width + 4;
  const root = document.documentElement.style;
  root.setProperty('--gutter', `${gutter}px`);
  root.setProperty('--ui', String(ui));
  root.setProperty('--hud', `${hudWidth}px`);
  root.setProperty('--scene', `${sceneWidth}px`);
  root.setProperty('--scene-height', `${box.height + 4}px`);
  // The row's icons, like the scene, at a whole number of device pixels per
  // icon pixel (D10).
  const dpr = window.devicePixelRatio || 1;
  const square = (wide ? hudWidth : sceneWidth) / 8;
  // The button row's squares, eight across with 3 px between (D94); the
  // action bar on the scene uses the same (D120).
  root.setProperty('--button', `${((wide ? hudWidth : sceneWidth) - 21) / 8}px`);
  // Icons are 32 pixels square (D98).
  const k = Math.max(1, Math.floor(((square - 10) * dpr) / 32));
  root.setProperty('--icon', `${(32 * k) / dpr}px`);
  // The weather's icon is smaller, as in the sketch, leaving room for the words.
  root.setProperty('--icon-small', `${(32 * Math.max(1, Math.floor((k * 3) / 4))) / dpr}px`);
  // A slot's icon: the nearest whole number of device pixels to 32 CSS px at
  // the page's scale, so it stays sharp; a tooltip's is twice that (D119).
  const s = Math.max(1, Math.round(ui * dpr));
  root.setProperty('--slot-icon', `${(32 * s) / dpr}px`);
  root.setProperty('--tip-icon', `${(64 * s) / dpr}px`);
  // The slot fits its icon, with room for the border and the count.
  root.setProperty('--slot', `${Math.max(52, Math.ceil((32 * s) / dpr) + 20)}px`);
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
  // Whatever the last dice held back happens now: the game never waits for them (R7.6).
  finishDice();
  const changed = out.state !== state;
  const ended = out.cast.phase === 'done' && cast.phase !== 'done';
  // The line whips out (9.2); not again for the recast after a missed splash.
  if (out.events.some((e) => e.type === 'cast') && !out.events.some((e) => e.type === 'recast')) audio.play('cast');
  state = out.state;
  cast = out.cast;
  if (cast.landing && out.events.some((e) => e.type === 'cast')) scene.aimAt(cast.landing);
  // One cast in a hundred flies way off (D85): said over where it landed.
  if (cast.landing && out.events.some((e) => e.type === 'wild-cast')) {
    floatText({ text: t('float.wild'), tone: 'wild', at: scene.toClient(cast.landing), scale: scene.pixelScale() });
  }
  if (ended) floatStrike();
  if (out.events.some((e) => e.type === 'no-rod')) showError($('errors'), t('error.noRod'));
  if (out.events.some((e) => e.type === 'no-water')) showError($('errors'), t('error.noWater'));
  // The roll first, then what came of it.
  const roll = ended ? describeRoll() : null;
  const landing = cast.landing;
  const reveal = () => {
    if (roll) log.add(roll, 'roll');
    logEvents(out.events);
    playOutcome(out.events);
  };
  const flights = () => {
    for (const e of out.events) {
      if ((e.type === 'caught' || (e.type === 'found' && !e.alt)) && landing) {
        const thing = e.type === 'caught' ? { kind: /** @type {const} */ ('fish'), id: e.fish.species } : { kind: /** @type {const} */ ('item'), id: e.item };
        flyIcon({
          icon: iconName(thing),
          rarity: e.type === 'caught' ? e.fish.rarity : content.items[e.item].rarity,
          from: scene.toClient(landing),
          to: $(e.type === 'caught' ? 'bucket' : 'bag'),
          scale: scene.pixelScale(),
        });
      }
    }
    promptPlayer();
  };
  // While a cast is in progress, only the checkpoint is saved (D74).
  if (out.checkpoint) save(out.checkpoint);
  else if (changed && cast.phase !== 'waiting' && cast.phase !== 'bite') save(state);
  render();
  if (roll && cast.phase === 'done' && showDice(settings, reducedMotion.matches)) rollDice(cast.outcome.rolls[0], reveal, flights);
  else {
    reveal();
    flights();
  }
}

// ---------- Sound (9.2) ----------

const audio = createAudio(settings.sound);

/**
 * What came of a cast, heard as the log shows it: the best news wins.
 * @param {GameEvent[]} events
 */
function playOutcome(events) {
  const has = (/** @type {string} */ type) => events.some((e) => e.type === type);
  if (has('level-up')) audio.play('level');
  else if (has('caught')) audio.play('catch');
  else if (has('found')) audio.play('found');
  else if (has('escaped')) audio.play('escape');
}

// ---------- The dice on the desk (D99) ----------

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * The dice being shown: what happens when they land (the log, the score) and
 * when they go (the catch's flight, any dialog).
 * @type {{ settled: number, gone: number, landed: (() => void) | null, after: (() => void) | null } | null}
 */
let diceShow = null;

/**
 * Rolls the fight's d20 over the scene, every die of it, each to rest on
 * what the engine rolled; and the fish's, once its roll shows (6.8, D107).
 * @param {import('./engine/cast.js').Roll} roll
 * @param {() => void} landed
 * @param {() => void} after
 */
function rollDice(roll, landed, after) {
  const now = performance.now();
  const crit = roll.result === 20;
  const values = [...(roll.dropped ?? []).map((value) => ({ value, kept: false })), { value: roll.result, kept: true, crit }];
  // A roll still hidden throws no fish dice.
  const theirs = cast.line.kind === 'fish' ? cast.rolls.find((r) => r.kind === 'resistance' && r.visible) : undefined;
  const fishValues = theirs
    ? [...(theirs.dropped ?? []).map((value) => ({ value, kept: false, fish: true })), { value: theirs.result, kept: true, crit: theirs.result === 20, fish: true }]
    : [];
  const out = scene.rollDice([...values, ...fishValues], now);
  audio.play('dice');
  const kept = out.points[values.length - 1];
  const fishKept = out.points[out.points.length - 1];
  diceShow = {
    settled: out.settled,
    gone: out.gone,
    landed: () => {
      landed();
      floatText({ text: String(roll.total), tone: crit || roll.crit ? 'crit' : 'roll', at: scene.toClient(kept), scale: scene.pixelScale() });
      if (theirs) floatText({ text: String(theirs.total), tone: 'fish', at: scene.toClient(fishKept), scale: scene.pixelScale() });
    },
    after,
  };
  document.body.dataset.dice = '';
}

/** @param {number} now */
function updateDice(now) {
  if (!diceShow) return;
  if (diceShow.landed && now >= diceShow.settled) {
    const landed = diceShow.landed;
    diceShow.landed = null;
    landed();
  }
  if (now >= diceShow.gone) finishDice();
}

/** Ends the show now, doing whatever it still held back. */
function finishDice() {
  if (!diceShow) return;
  const { landed, after } = diceShow;
  diceShow = null;
  delete document.body.dataset.dice;
  scene.clearDice();
  landed?.();
  after?.();
}

/** Ends the show now without what it held back: the game it belonged to is gone. */
function dropDice() {
  if (!diceShow) return;
  diceShow = null;
  delete document.body.dataset.dice;
  scene.clearDice();
}

/** Whatever waits for the player: a full bucket first, then two treasures, then an open event. */
function promptPlayer() {
  // While the dice roll, the show asks again when they go (D99).
  if (diceShow) return;
  if (state?.pendingCatch) openRelease();
  else if (state?.pendingTreasure) openTreasure();
  else if (state?.event) openEvent();
}

// ---------- Two treasures: keep one (Fence, D106) ----------

/** The full bucket's dialog, with the two treasures as its choices. */
function openTreasure() {
  const dialog = /** @type {HTMLDialogElement} */ ($('release'));
  if (dialog.open || !state?.pendingTreasure) return;
  // The choices as they stand now; a click acts on the state as it is then,
  // since buffs and cooldowns run on while the dialog is open.
  const s = state;
  // As with the bucket: the tap that ended the cast mustn't also choose.
  const openedAt = performance.now();
  $('releaseTitle').textContent = t('treasure.title');
  $('releaseText').textContent = t('treasure.text');
  $('releaseList').replaceChildren(
    ...s.pendingTreasure.map((id) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = t(content.items[id].name);
      b.style.color = rarityColour(content.items[id].rarity);
      b.addEventListener('click', () => {
        if (performance.now() - openedAt < 400 || !state?.pendingTreasure) return;
        const out = chooseTreasure(state, id);
        state = out.state;
        logEvents(out.events);
        save(state);
        dialog.close();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        render();
        promptPlayer();
      });
      return b;
    }),
  );
  dialog.showModal();
}

// ---------- A full bucket: let one go (D59) ----------

function openRelease() {
  const dialog = /** @type {HTMLDialogElement} */ ($('release'));
  if (dialog.open || !state?.pendingCatch) return;
  // The choices as they stand now; a click acts on the state as it is then.
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
      if (performance.now() - openedAt < 400 || !state?.pendingCatch) return;
      const out = releaseFish(state, choice);
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
  const say = (/** @type {string[]} */ keys) => sayEventText(keys, words, state?.flags);
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
          // A choice that opened a barter window (R18.2).
          if (state.shop) pane = 'shop';
        }
        render();
      });
      return b;
    }),
  );
  if (!dialog.open) {
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
  // Under the water, a fish is struck at; in town, a place is gone to (R20.3, R17.1).
  if (state.dive || content.locations[state.location]?.town) {
    if (point) actInView(point);
    return;
  }
  // A double tap on the splash shouldn't strike and then instantly recast.
  if (cast.phase === 'done' && now - lastActAt < 500) return;
  lastActAt = now;
  if (cast.phase === 'idle' || (cast.phase === 'done' && !pausing())) {
    // No casting with the game menu open; a strike still lands, so opening
    // it mid-cast never costs a fish (D94).
    if (menuOpen()) return;
    apply(castLine(state, now, { aim: point, bounds: waterAt(state.location, state.spot), extra: extraSources() }));
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
  if (!e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && /^[1-9]$/.test(e.key) && !(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
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
    const why = !status.working ? 'notYet' : status.waiting ? 'waiting' : status.cooldown ? 'notReady' : status.armed ? 'armed' : 'notLit';
    showError($('errors'), t(`error.ability.${why}`));
    return;
  }
  const out = useAbility(state, id, extraSources());
  if (out.state === state) return;
  state = out.state;
  const dive = out.events.find((e) => e.type === 'dive-started');
  if (dive) diveEndsAt = performance.now() + dive.seconds * 1000;
  // Mid-cast the checkpoint stays the save (D74); the cast saves it when it ends.
  if (cast.phase !== 'waiting' && cast.phase !== 'bite') save(state);
  logEvents(out.events);
  render();
  promptPlayer();
}

/** The bar, from the state. */
function renderActions() {
  if (!state) return;
  actionBar.update(activePerks(state).map((id) => abilityStatus(/** @type {GameState} */ (state), id)));
}

// ---------- The frame loop ----------

let buffSavedAt = 0;
scene.app.ticker.add((ticker) => {
  const now = performance.now();
  if (state) {
    const out = tick(state, cast, now);
    // The reaction is timed from when the splash is on screen, not from when
    // the engine scheduled it, which can be most of a frame earlier (D16).
    if (cast.phase === 'waiting' && out.cast.phase === 'bite') {
      out.cast = { ...out.cast, biteAt: now };
      audio.play('splash');
    }
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
    buffBar.update(shownBuffs());
    renderActions();
    // The dive's breath runs out (R20.3).
    if (state.dive) updateDive(now);
  }
  scene.update(cast, now);
  updateDice(now);
});

/** The cold and the night, worked out when the state changes (R19.2, R19.3). */
/** @type {import('./engine/state.js').Buff[]} */
let conditions = [];

/** Every buff for the bar: the state's, with game time left (R19.5), the class fish's, the cold's. */
function shownBuffs() {
  if (!state) return [];
  const time = state.time;
  return [
    ...state.buffs.map((b) => (b.until !== undefined ? { ...b, gameLeft: b.until - time } : b)),
    ...championDebuffs(state),
    ...conditions,
  ];
}

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
      return e.alt ? tParts('log.found-choice', { item: itemLink(e.item), alt: itemLink(e.alt) }) : tParts('log.found', { item: itemLink(e.item) });
    case 'greedy':
      return e.alt ? tParts('log.greedy-choice', { item: itemLink(e.item), alt: itemLink(e.alt) }) : tParts('log.greedy', { item: itemLink(e.item) });
    case 'kept':
      return tParts('log.kept', { item: itemLink(e.item) });
    case 'bent':
      return tParts('log.bent', { fish: fishLink(e.from), bent: fishLink(e.fish), size: e.fish.size, xp: e.xp });
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
      if (e.alt) return tParts('log.gutted-choice', { fish: fishLink(e.fish), item: itemLink(e.item), alt: itemLink(e.alt) });
      return e.item ? tParts('log.gutted', { fish: fishLink(e.fish), item: itemLink(e.item) }) : tParts('log.gutted-empty', { fish: fishLink(e.fish) });
    case 'weather':
      return [t('log.weather', { description: t(e.weather.description) })];
    case 'season':
      return [t('log.season', { season: t(content.weather[e.season].name), description: t(e.weather.description) })];
    case 'buff-ended':
      return [t('log.buff-ended', { buff: buffName(e.buff) })];
    case 'buff-gained':
      return [t('log.buff-gained', { buff: buffName(e.buff) })];
    case 'waited':
      return [t('log.waited', { hours: hoursText(e.minutes) })];
    case 'ate-stew':
      return [t('log.ate-stew', { hours: hoursText(Math.max(30, e.minutes)) })];
    case 'used':
      return tParts('log.used', { item: itemLink(e.item) });
    case 'traded-away': {
      const parts = tParts('log.traded-away', { item: itemLink(e.item) });
      return e.count > 1 ? [...parts, ` ×${e.count}`] : parts;
    }
    case 'traded-fish': {
      const parts = tParts('log.traded-fish', { fish: fishLink(e.fish) });
      return e.count > 1 ? [...parts, ` ×${e.count}`] : parts;
    }
    case 'stewed':
    case 'ate-fish':
    case 'to-aquarium':
    case 'twin':
      return tParts(`log.${e.type}`, { fish: fishLink(e.fish) });
    case 'dive-started':
      return [t('log.dive-started', { seconds: e.seconds })];
    case 'dive-caught':
    case 'dive-escaped':
      return tParts(`log.${e.type}`, { fish: fishLink(e.fish), player: e.player, total: e.total, required: e.required });
    case 'slept':
    case 'time-slip':
    case 'dive-ended':
      return [t(`log.${e.type}`)];
    case 'feature-appeared':
    case 'feature-hit':
    case 'feature-moved':
    case 'feature-gone': {
      const name = t(content.features[e.feature].name);
      return [t(`log.${e.type}`, { feature: name, Feature: name.charAt(0).toUpperCase() + name.slice(1) })];
    }
    case 'released':
      return tParts('log.released', { fish: fishLink(e.fish) });
    case 'champion-appeared':
    case 'champion-hit':
    case 'champion-caught':
    case 'champion-knight':
      return tParts(`log.${e.type}`, { fish: fishLink(e.fish) });
    case 'champion-spell': {
      const spell = championClass(e.fish.champion).spells.find((/** @type {{ id: string }} */ s) => s.id === e.spell);
      return tParts('log.champion-spell', { fish: fishLink(e.fish), spell: t(spell.name) });
    }
    case 'champion-weather':
      return tParts('log.champion-weather', { fish: fishLink(e.fish), description: t(e.weather.description) });
    case 'champion-stole':
      return e.alt
        ? tParts('log.champion-stole-choice', { fish: fishLink(e.fish), item: itemLink(e.item), alt: itemLink(e.alt) })
        : tParts('log.champion-stole', { fish: fishLink(e.fish), item: itemLink(e.item) });
    case 'champion-recovered':
      return tParts('log.champion-recovered', { item: itemLink(e.item) });
    case 'event-gained':
    case 'event-lost': {
      const parts = tParts(`log.${e.type}`, { item: itemLink(e.item) });
      return e.count > 1 ? [...parts, ` ×${e.count}`] : parts;
    }
    case 'event-xp':
      return [t('log.event-xp', { xp: e.xp })];
    case 'event-lost-fish': {
      const parts = tParts('log.event-lost-fish', { fish: fishLink(e.fish) });
      return e.count > 1 ? [...parts, ` ×${e.count}`] : parts;
    }
    case 'place-opened':
    case 'place-closed':
      return [t(`log.${e.type}${e.by ? '-' + e.by : ''}`, { place: t(content.locations[e.location].name) })];
    case 'spot-learned': {
      const where = content.locations[e.location].spots.find((/** @type {{ id: string }} */ s) => s.id === e.spot);
      return [t('log.spot-learned', { spot: t(where.name) })];
    }
    case 'moved': {
      const where = content.locations[e.location].spots.find((/** @type {{ id: string }} */ s) => s.id === e.spot);
      return [t('log.travel', { spot: t(where?.name ?? content.locations[e.location].name) })];
    }
    case 'rift':
    case 'polished':
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

/**
 * A buff's name for the log: a content buff's, a perk's, a fish's eaten raw
 * (sushi-…), the stew's.
 * @param {string} id
 */
function buffName(id) {
  if (content.buffs?.[id]) return t(content.buffs[id].name);
  if (content.perks[id]) return t(content.perks[id].name);
  if (id.startsWith('sushi-') && content.fish[id.slice(6)]) return t(content.fish[id.slice(6)].name);
  if (id === 'perpetual-stew') return t(content.rules.stew.name);
  return id;
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
    // The fish's own roll stays hidden until something reveals it (R5.2, D107).
    needed: cast.line.kind === 'fish' && cast.rolls.some((r) => r.kind === 'resistance' && r.visible) ? cast.line.required : '?',
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
$('actions').setAttribute('aria-label', t('hud.actions'));
bindTip($('weather'), () => (state ? { title: t(weatherWords(state.weather).name), lines: [] } : null));

function renderHud() {
  if (!state) return;
  const now = clock(state.time);
  $('timeOfDay').textContent = t(`time.${now.partOfDay}`);
  $('seasonDay').textContent = t('hud.seasonDay', { weekday: t(`weekday.${now.weekday}`), season: t(content.weather[now.season].name), day: now.day });
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

/** @typedef {'player' | 'journal' | 'map' | 'bucket' | 'menu' | 'settings' | 'dev' | 'shop'} Pane */
/** @type {Pane | null} */
let pane = null;
/** The bag opens over the log, alongside any pane (D83). */
let bagOpen = false;
/** @type {import('./ui/panels.js').BagTab} */
let bagTabShown = 'equipment';

/** The game menu, or the settings opened from it, is over the scene. */
function menuOpen() {
  return pane === 'menu' || pane === 'settings';
}

/** @param {Pane} name */
function togglePane(name) {
  pane = pane === name ? null : name;
  leftShop();
  hideTip();
  renderPane();
}

/** The barter window closed: the state forgets it (R18.2). */
function leftShop() {
  if (pane === 'shop' || !state?.shop) return;
  state = { ...state, shop: null };
  if (!lineOut()) save(state);
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
  leftShop();
  hideTip();
  renderPane();
}
$('paneClose').setAttribute('aria-label', t('hud.close'));
$('paneClose').addEventListener('click', () => {
  pane = null;
  leftShop();
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
  const fresh = body.dataset.shown !== pane;
  if (fresh) {
    body.dataset.shown = pane;
    queueMicrotask(() => (body.scrollTop = 0));
  }
  if (pane === 'shop' && !s.shop) {
    pane = null;
    box.hidden = true;
    return;
  }
  $('paneTitle').textContent =
    pane === 'player' ? s.character.name : pane === 'shop' ? t(content.vendors[/** @type {string} */ (s.shop)].name) : pane === 'dev' || pane === 'settings' ? t(`menu.${pane}`) : t(`hud.${pane}`);
  switch (pane) {
    case 'player':
      body.replaceChildren(...playerPane(s, valuesFor(s, extraSources()).flat, learnPerk));
      break;
    case 'journal':
      body.replaceChildren(...journalPane(s, completionShown(s, valuesFor(s, extraSources()))));
      break;
    case 'map':
      body.replaceChildren(...mapPane(s, travelTo, completionShown(s, valuesFor(s, extraSources()))));
      break;
    case 'bucket':
      body.replaceChildren(...bucketPane(s, valuesFor(s, extraSources()).flat.bucketSize));
      break;
    case 'shop':
      body.replaceChildren(
        ...shopPane(s, /** @type {string} */ (s.shop), {
          trade: (offer) => changeState(trade(/** @type {GameState} */ (state), /** @type {string} */ (s.shop), offer)),
          stew: (i) => changeState(addToStew(/** @type {GameState} */ (state), i)),
          unstew: (i) => changeState(takeFromStew(/** @type {GameState} */ (state), i)),
          eat: () => changeState(eatStew(/** @type {GameState} */ (state))),
          toTank: (i) => changeState(toAquarium(/** @type {GameState} */ (state), i)),
          fromTank: (i) => changeState(fromAquarium(/** @type {GameState} */ (state), i)),
        }),
      );
      break;
    case 'menu':
      body.replaceChildren(
        ...menuPane({ onMainMenu: toTitle, onSettings: () => togglePane('settings'), onDev: bench ? () => togglePane('dev') : null, onExport: exportSave }),
      );
      break;
    case 'settings':
      // Built once when opened; a cast ending mustn't replace a slider being dragged.
      if (!fresh && body.hasChildNodes()) break;
      body.replaceChildren(
        ...settingsPane(settings, (change) => {
          settings = { ...settings, ...change };
          saveSettings(storage, settings);
          applySettings(settings);
          audio.setVolume(settings.sound);
          // The inputs already show the change: rebuilding them would take
          // the keyboard off the slider after one step.
        }, showDice(settings, reducedMotion.matches)),
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

/**
 * Going to another spot from the map pane (D101): only between casts, as
 * with equipment, so a cast keeps its checkpoint (D74).
 * @param {string} location
 * @param {string} spot
 */
function travelTo(location, spot) {
  if (!state) return;
  if (lineOut()) {
    showError($('errors'), t('error.busyTravel'));
    return;
  }
  if (state.dive) {
    showError($('errors'), t('error.busyDive'));
    return;
  }
  const out = travel(state, location, spot);
  if (out.error) showError($('errors'), t(`error.${out.error}`));
  if (out.state === state) return;
  state = out.state;
  const where = content.locations[location].spots.find((/** @type {{ id: string }} */ s) => s.id === spot);
  log.add(t('log.travel', { spot: t(where.name) }));
  logEvents(out.events);
  save(state);
  render();
  promptPlayer();
}

/**
 * A Tiny fish from the bucket onto the hook (R13.4, D41): only between casts,
 * as with equipment.
 * @param {number} index  Into the bucket.
 */
function hookFromBucket(index) {
  if (!state) return;
  if (lineOut()) {
    showError($('errors'), t('error.busy'));
    return;
  }
  const out = hookFish(state, index);
  if (out.fish) log.add(tParts('log.hooked', { fish: fishLink(out.fish) }));
  changeItems(out);
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
  const id = spot.kind === 'bag' && spot.index !== null ? state.bags[spot.index]?.id : null;
  // A potion is drunk (R18.8); anything else goes into its slot.
  if (id && content.items[id]?.use) changeState(useItem(state, id));
  else if (spot.kind === 'bag' && spot.index !== null) changeItems(quickEquip(state, spot.index));
  else if (spot.kind === 'equip') {
    const stack = state.equipped[spot.key];
    if (stack) bagTabShown = bagTab(stack.id);
    changeItems(unequip(state, spot.key));
  }
});

// ---------- Drawing it all ----------

function render() {
  document.body.dataset.phase = cast.phase;
  document.body.dataset.place = state && content.locations[state.location]?.town ? 'town' : state?.dive ? 'dive' : 'water';
  $('status').textContent = state && content.locations[state.location]?.town ? t('status.town') : t(pausing() ? 'status.pause' : `status.${cast.phase}`);
  if (!state) {
    renderPane();
    return;
  }
  conditions = conditionBuffs(state, valuesFor(state, extraSources()).flat.warmth);
  buffBar.update(shownBuffs());
  renderActions();
  scene.setView(viewFor(state));
  scene.setFeatures([
    ...state.features.map((f) => ({ ...f, kind: content.features[f.id].kind, species: content.features[f.id].fish?.[0]?.id })),
    // Class fish (D114): a big fish with its class's aura.
    ...championsHere(state).map((c) => ({ id: `champion-${c.class}`, kind: 'champion', aura: championClass(c.class).aura, species: c.fish.species, x: c.x, y: c.y, uses: 1, born: c.born })),
  ]);
  // The bobber slot is cosmetic: it only changes how the bobber looks (D83).
  const bobber = state.equipped.bobber;
  scene.setBobber(bobber ? (content.items[bobber.id]?.bobber ?? null) : null);
  const now = clock(state.time);
  // The spot's placeholder look until it's painted (4.2). The page notes which
  // it painted, for tools/verify.mjs: the scene moves, so pictures can't be compared.
  const look = content.locations[state.location].spots?.find((/** @type {{ id: string }} */ s) => s.id === state.spot)?.look ?? null;
  scene.setSpot(look);
  document.body.dataset.spotLook = JSON.stringify(look);
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

// ---------- The town, the dive, barter, a fish's options (R17-R21, D123) ----------

/**
 * The town's places as buildings, placeholders until CR-5: where each stands
 * in the play area, its size and colours. The room is inside the inn.
 * @type {Record<string, { x: number, w: number, h: number, colour: string, roof: string }>}
 */
const BUILDINGS = {
  inn: { x: 24, w: 84, h: 64, colour: '#b07a4a', roof: '#7a3b2e' },
  alchemist: { x: 152, w: 60, h: 52, colour: '#7a6a9a', roof: '#3e3560' },
};

/** The dive's fish on screen, by their place among the swimmers: index into state.dive.fish. */
/** @type {number[]} */
let diveMap = [];
/** When the dive's breath runs out (performance.now()). */
let diveEndsAt = 0;
/**
 * The dice over and under a fish struck at in the dive (R20.3), until they go.
 * @type {{ index: number, until: number, els: HTMLElement[] }[]}
 */
let diveBadges = [];
/** How long a struck fish's dice stay. */
const DIVE_DICE_MS = 1600;

/**
 * What the scene shows in the water's place (R17.1, R17.5, R20.3).
 * @param {GameState} s
 * @returns {import('./scene/views.js').View | null}
 */
function viewFor(s) {
  if (s.dive) {
    diveMap = [];
    /** @type {{ key: string, species: string }[]} */
    const fish = [];
    s.dive.fish.forEach((f, i) => {
      // A fish caught is gone once its dice are.
      if (f.struck && f.caught && !diveBadges.some((b) => b.index === i)) return;
      diveMap.push(i);
      fish.push({ key: `dive-${i}`, species: f.fish.species });
    });
    return { kind: 'dive', fish };
  }
  if (!content.locations[s.location]?.town) return null;
  if (s.spot === 'room') {
    return { kind: 'room', tank: hasPerk(s, 'aquarium') ? (s.aquarium ?? []).map((f, i) => ({ key: `tank-${i}-${f.species}-${f.size}`, species: f.species })) : null };
  }
  const buildings = Object.entries(BUILDINGS)
    .filter(([id]) => spotKnown(s, s.location, id))
    .map(([id, b]) => ({ id, ...b }));
  const part = clock(s.time).partOfDay;
  return { kind: 'town', buildings, here: s.spot, night: part === 'night' || part === 'evening' };
}

/**
 * A tap or click in a view: a building is gone to (or its dialogue opened
 * again, if the player is there); a fish in the dive is struck at.
 * @param {{ x: number, y: number }} point
 */
function actInView(point) {
  if (!state) return;
  const hit = scene.viewHit(point);
  if (state.dive) {
    if (hit?.kind === 'fish') strikeInDive(diveMap[hit.index]);
    return;
  }
  if (hit?.kind === 'building') visit(hit.id);
  else if (state.spot === 'room') visit('room');
}

/**
 * Goes to a place in town, or, already there, opens its dialogue again.
 * @param {string} spot
 */
function visit(spot) {
  if (!state || state.event) return;
  if (state.spot !== spot) {
    travelTo(state.location, spot);
    return;
  }
  const next = structuredClone(state);
  if (!arrive(next).length) return;
  state = next;
  save(state);
  render();
  promptPlayer();
}

/**
 * Strikes at a fish in the dive: its dice show over and under it (R20.3).
 * @param {number} index  Into state.dive.fish.
 */
function strikeInDive(index) {
  if (!state?.dive || index === undefined) return;
  const out = diveStrike(state, index);
  if (out.state === state) return;
  state = out.state;
  const f = /** @type {import('./engine/dive.js').DiveFish} */ (state.dive?.fish[index]);
  const die = (/** @type {string} */ cls, /** @type {string} */ text) => {
    const el = document.createElement('span');
    el.className = `dive-die ${cls} ${f.caught ? 'caught' : 'missed'}`;
    el.textContent = text;
    $('sceneWrap').append(el);
    return el;
  };
  diveBadges.push({ index, until: performance.now() + DIVE_DICE_MS, els: [die('player', String(f.playerRoll)), die('fish', String(f.fishRoll))] });
  audio.play('dice');
  logEvents(out.events);
  if (out.events.some((e) => e.type === 'dive-caught')) audio.play('catch');
  save(state);
  render();
  promptPlayer();
}

/**
 * The dive, each frame: its dice follow their fish, the breath counts down,
 * and at the end the player comes up.
 * @param {number} now
 */
function updateDive(now) {
  if (!state?.dive) return;
  const timer = $('diveTimer');
  timer.hidden = false;
  timer.textContent = t('dive.time', { seconds: Math.max(0, Math.ceil((diveEndsAt - now) / 1000)) });
  let gone = false;
  const wrap = $('sceneWrap').getBoundingClientRect();
  const scale = scene.pixelScale();
  for (const b of diveBadges) {
    const at = scene.viewFishAt(diveMap.indexOf(b.index));
    if (!at) continue;
    const above = scene.toClient({ x: at.x, y: at.y - at.h / 2 - 8 });
    const below = scene.toClient({ x: at.x, y: at.y + at.h / 2 + 8 });
    for (const [el, p] of /** @type {[HTMLElement, { x: number, y: number }][]} */ ([[b.els[0], above], [b.els[1], below]])) {
      el.style.left = `${p.x - wrap.left}px`;
      el.style.top = `${p.y - wrap.top}px`;
      el.style.fontSize = `${Math.max(10, Math.round(6 * scale))}px`;
    }
  }
  for (const b of diveBadges.filter((b) => now >= b.until)) {
    for (const el of b.els) el.remove();
    gone = true;
  }
  diveBadges = diveBadges.filter((b) => now < b.until);
  if (gone) render();
  if (now >= diveEndsAt && !state.pendingCatch) finishDive();
}

/** Up for air: the dive ends. */
function finishDive() {
  if (!state?.dive) return;
  for (const b of diveBadges) for (const el of b.els) el.remove();
  diveBadges = [];
  $('diveTimer').hidden = true;
  const out = endDive(state);
  state = out.state;
  logEvents(out.events);
  save(state);
  render();
}

/**
 * Takes what a barter, stew or fish option returned: the new state, the
 * log, the save.
 * @param {{ state: GameState, events: GameEvent[] }} out
 */
function changeState(out) {
  if (!state || out.state === state) return;
  state = out.state;
  logEvents(out.events);
  if (!lineOut()) save(state);
  hideTip();
  render();
  promptPlayer();
}

/**
 * A fish's options (R21.1), at the pointer: Release, except in town; Hook as bait for
 * a Tiny fish; Eat with Sushi enjoyer; into the stew at the inn; into the
 * aquarium in the room.
 * @param {number} index  Into the bucket.
 * @param {{ x: number, y: number }} at
 */
function fishMenu(index, at) {
  if (!state) return;
  const stack = state.bucket[index];
  if (!stack) return;
  const s = state;
  /** @type {import('./ui/menu.js').MenuOption[]} */
  const options = [];
  if (!indoors(s)) options.push({ label: t('fishMenu.release'), onClick: () => changeState(letGo(/** @type {GameState} */ (state), index)) });
  if (isTiny(stack.fish)) options.push({ label: t('fishMenu.hook'), onClick: () => hookFromBucket(index) });
  if (hasPerk(s, 'sushi-enjoyer')) options.push({ label: t('fishMenu.eat'), onClick: () => changeState(eatFish(/** @type {GameState} */ (state), index)) });
  if (atStew(s)) options.push({ label: t('fishMenu.stew'), onClick: () => changeState(addToStew(/** @type {GameState} */ (state), index)) });
  if (atAquarium(s)) options.push({ label: t('fishMenu.aquarium'), onClick: () => changeState(toAquarium(/** @type {GameState} */ (state), index)) });
  options.push({ label: t('fishMenu.cancel'), onClick: () => {} });
  hideTip();
  showMenu(at, fishName(stack.fish), rarityColour(stack.fish.rarity), options);
}

// Right-click, or a long-press on a phone (which fires contextmenu too), on a fish in the bucket.
document.addEventListener(
  'contextmenu',
  (e) => {
    const node = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest?.('[data-fish]'));
    if (!node) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    fishMenu(Number(node.dataset.fish), { x: e.clientX, y: e.clientY });
  },
  true,
);
// Where a long-press doesn't fire contextmenu (iOS): most of a second held.
{
  let timer = 0;
  document.addEventListener('pointerdown', (e) => {
    const node = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest?.('[data-fish]'));
    if (!node || e.pointerType === 'mouse') return;
    const at = { x: e.clientX, y: e.clientY };
    timer = window.setTimeout(() => fishMenu(Number(node.dataset.fish), at), 600);
  });
  for (const type of ['pointerup', 'pointercancel', 'pointermove', 'contextmenu']) document.addEventListener(type, () => window.clearTimeout(timer));
}

// The pointer is a fish hook over water that can be fished, and over a fish
// in the dive (R20.4); a hand over a place in town.
const HOOK = [
  '......kk....',
  '.....kwwk...',
  '.....kwwk...',
  '......kk....',
  '......kg....',
  '......kg....',
  '......kg....',
  '......kg....',
  '......kg....',
  '.k....kg....',
  '.kk...kg....',
  '.kgk..kg....',
  '..kgkkkg....',
  '...kgggk....',
  '....kkk.....',
];
const hookCursor = (() => {
  const c = document.createElement('canvas');
  c.width = 24;
  c.height = 30;
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const colours = /** @type {Record<string, string>} */ ({ k: '#1b2b34', g: '#c9d3d8', w: '#f4f4f4' });
  HOOK.forEach((row, y) =>
    [...row].forEach((k, x) => {
      if (k === '.') return;
      ctx.fillStyle = colours[k];
      ctx.fillRect(x * 2, y * 2, 2, 2);
    }),
  );
  // The hotspot is the hook's point.
  return `url(${c.toDataURL()}) 2 20, crosshair`;
})();
canvas.addEventListener('pointermove', (e) => {
  if (!state || e.pointerType !== 'mouse') return;
  const p = scene.toScene(e.clientX, e.clientY);
  let cursor = 'default';
  if (state.dive) cursor = scene.viewHit(p)?.kind === 'fish' ? hookCursor : 'default';
  else if (content.locations[state.location]?.town) cursor = scene.viewHit(p) ? 'pointer' : 'default';
  else {
    const w = waterAt(state.location, state.spot);
    if (p.x >= w.x0 && p.x <= w.x1 && p.y >= w.y0 && p.y <= w.y1) cursor = hookCursor;
  }
  if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor;
});

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
  dialog.showModal();
}

// ---------- The title screen: new game, load game (D80) ----------

/**
 * The game as a file to keep (9.3): the same text as its slot, downloaded.
 */
function exportSave() {
  if (!state) return;
  const file = exportGame(state, new Date());
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([file.text], { type: 'application/json' })), download: file.name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/**
 * Picks a save file (9.3) and, if it reads, asks which slot it goes in.
 */
function pickSaveFile() {
  const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    const loaded = importGame(await file.text());
    if (!loaded.state) alert(t('title.importBroken', { error: loaded.error ?? '' }));
    else openTitle('import', loaded.state);
  });
  input.click();
}

/**
 * @param {'main' | 'new' | 'load' | 'import'} view
 * @param {GameState} [imported]  For 'import': the game from a file, to put in a slot.
 */
function openTitle(view = 'main', imported) {
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
      // A dive under way when the game was left is over: up for air (R20.3).
      if (state.dive) {
        state = endDive(state).state;
        save(state);
      }
      // A barter window left open opens again (R18.2).
      pane = state.shop ? 'shop' : null;
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
      button(t('title.import'), pickSaveFile, 'titleImport'),
    );
  } else {
    $('titlePrompt').textContent =
      view === 'import' ? t('title.pickImport', { name: imported?.character.name ?? '' }) : t(view === 'new' ? 'title.pickNew' : 'title.pickLoad');
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
      } else if (view === 'import' && imported) {
        b.onclick = () => {
          const taken = saved.state
            ? t('title.importOverwrite', { slot: saved.slot, name: saved.state.character.name, imported: imported.character.name })
            : saved.error
              ? t('title.importOverwriteBroken', { slot: saved.slot, imported: imported.character.name })
              : null;
          if (taken && !confirm(taken)) return;
          saveGame(storage, saved.slot, imported);
          play({ slot: saved.slot, state: imported });
        };
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
      dialog.showModal();
  }
}

/** Back to the title screen from the menu, between casts. The game is already saved. */
function toTitle() {
  if (!state || cast.phase === 'waiting' || cast.phase === 'bite') return;
  // Dice still rolling would land their lines in the next game's log.
  dropDice();
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

// Escape doesn't close these: each waits for a choice. Added once, here, not
// each time one opens.
for (const id of ['release', 'event', 'create', 'title']) $(id).addEventListener('cancel', (e) => e.preventDefault());

render();
openTitle();
