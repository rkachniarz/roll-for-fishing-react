// @ts-check
// Wiring: input -> engine -> scene and page. For now this is the Phase 1 feel
// trial (DEV_PLAN.md, Phase 1): one lake, one kind of fish, the cast and the
// strike. Nothing is saved yet.
//
//   ?dev          shows the timing panel
//   ?seed=N       replays the same bites and rolls
//   ?wait=MS      fixes the time from cast to bite (used by tools/verify.mjs)

import { createRng, deriveSeed, randomSeed } from './rng.js';
import { diceFor } from './dice.js';
import { TIMING, idleCast, startCast, strike, tickCast } from './engine/cast.js';
import { createScene, fitCanvas } from './scene/scene.js';

const params = new URLSearchParams(location.search);
const DEV = params.has('dev');
const seed = params.has('seed') ? Number(params.get('seed')) >>> 0 : randomSeed();

/** @type {typeof TIMING} */
const timing = { ...TIMING };
if (params.has('wait')) timing.biteDelayMin = timing.biteDelayMax = Number(params.get('wait'));

// One stream per consumer (D4): more cosmetic draws never shift the dice.
const timingDice = diceFor(createRng(deriveSeed(seed, 'cast-timing')));
const fishingDice = diceFor(createRng(deriveSeed(seed, 'fishing')));
const scenery = createRng(deriveSeed(seed, 'scenery'));

/** The trial's only fish: a d20 + 2 against 12 lands it a little over half the time. */
const trialFish = { skill: 2, difficulty: 12 };

const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
const canvas = /** @type {HTMLCanvasElement} */ ($('scene'));
const scene = await createScene(canvas, () => scenery.next());

/** @type {import('./engine/cast.js').Cast} */
let cast = idleCast();
/** The cast whose outcome has been logged, so each is logged once. */
let loggedCastAt = -1;
let lastActAt = -Infinity;
const stats = { casts: 0, caught: 0, early: 0, reactions: /** @type {number[]} */ ([]), fast: 0, ok: 0, bad: 0, late: 0 };

// ---------- Sizing ----------

function fit() {
  const wide = window.innerWidth >= 900;
  const width = wide ? window.innerWidth - 360 - 3 * 16 : window.innerWidth - 2 * 16;
  const height = wide ? window.innerHeight - 2 * 16 : window.innerHeight * 0.62;
  // Less the wrapper's border, so the canvas itself gets the whole multiple.
  fitCanvas(canvas, width - 4, height - 4);
}
fit();
window.addEventListener('resize', fit);

// ---------- Input: one action, meaning cast or strike by phase ----------

/**
 * @param {number} now  The event's timestamp (same clock as performance.now()).
 * @param {{ x: number, y: number } | null} point  Where on the water, if tapped.
 */
function act(now, point) {
  // A double tap on the splash shouldn't strike and then instantly recast.
  if (cast.phase === 'done' && now - lastActAt < 500) return;
  lastActAt = now;
  if (cast.phase === 'idle' || cast.phase === 'done') {
    scene.aimAt(point);
    cast = startCast(now, timingDice, timing);
    stats.casts++;
  } else {
    cast = strike(cast, now, fishingDice, trialFish, timing);
  }
  render();
}

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  act(e.timeStamp, scene.toScene(e.clientX, e.clientY));
});

window.addEventListener('keydown', (e) => {
  if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return;
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return;
  e.preventDefault();
  act(e.timeStamp, null);
});

// ---------- The frame loop ----------

scene.app.ticker.add(() => {
  const now = performance.now();
  let next = tickCast(cast, now, timing);
  // The reaction is timed from when the splash is on screen, not from when
  // the engine scheduled it, which can be most of a frame earlier.
  if (cast.phase === 'waiting' && next.phase === 'bite') next = { ...next, biteAt: now };
  if (next !== cast) {
    cast = next;
    render();
  }
  scene.update(cast, now);
});

// ---------- The page around the scene ----------

const STATUS = {
  idle: 'Tap the water to cast.',
  waiting: 'Watch the bobber…',
  bite: 'Splash! Strike now!',
  done: 'Tap to cast again.',
};

/** @param {number} ms */
const seconds = (ms) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`);

/** @param {import('./engine/cast.js').Outcome} outcome */
function describe(outcome) {
  const roll = outcome.rolls[0];
  const sum = roll
    ? `d20: ${roll.result}` +
      roll.mods.map((m) => ` ${m.value < 0 ? '−' : '+'} ${Math.abs(m.value)} ${m.label}`).join('') +
      ` = ${roll.total}, needed ${trialFish.difficulty}${roll.result === 20 ? ' (natural 20!)' : ''}.`
    : '';
  const strikeText = outcome.reactionMs !== undefined ? `${outcome.grade} strike (${seconds(outcome.reactionMs)}). ` : '';
  switch (outcome.result) {
    case 'caught':
      return { headline: 'Caught it!', detail: strikeText + sum, good: true };
    case 'escaped':
      return { headline: 'It got away.', detail: strikeText + sum, good: false };
    case 'missed':
      return { headline: 'Too slow.', detail: 'The fish was gone before you struck.', good: false };
    case 'too-early':
      return { headline: 'Too early!', detail: 'You pulled the line out before anything bit.', good: false };
  }
}

function render() {
  document.body.dataset.phase = cast.phase;
  $('status').textContent = STATUS[cast.phase];

  const result = $('result');
  if (cast.phase !== 'done') {
    result.hidden = true;
    return;
  }
  const { headline, detail, good } = describe(cast.outcome);
  result.hidden = false;
  result.className = `result ${good ? 'caught' : 'lost'}`;
  result.innerHTML = '';
  const h = document.createElement('p');
  h.className = 'headline';
  h.textContent = headline;
  const d = document.createElement('p');
  d.className = 'detail';
  d.textContent = detail;
  result.append(h, d);

  if (loggedCastAt !== cast.castAt) {
    loggedCastAt = cast.castAt;
    record(cast.outcome, headline);
  }
}

/**
 * @param {import('./engine/cast.js').Outcome} outcome
 * @param {string} headline
 */
function record(outcome, headline) {
  if (outcome.result === 'caught') stats.caught++;
  if (outcome.result === 'too-early') stats.early++;
  if (outcome.grade) stats[outcome.grade]++;
  if (outcome.reactionMs !== undefined) stats.reactions.push(outcome.reactionMs);

  const avg = stats.reactions.length
    ? seconds(stats.reactions.reduce((a, b) => a + b, 0) / stats.reactions.length)
    : '–';
  $('stats').textContent =
    `Casts ${stats.casts} · caught ${stats.caught} · average strike ${avg} · ` +
    `fast ${stats.fast} / ok ${stats.ok} / bad ${stats.bad} / too slow ${stats.late} / early ${stats.early}`;

  const li = document.createElement('li');
  li.textContent = outcome.reactionMs !== undefined ? `${headline} (${seconds(outcome.reactionMs)})` : headline;
  const log = $('log');
  log.prepend(li);
  while (log.children.length > 8) log.lastElementChild?.remove();
}

// ---------- ?dev: try other reaction windows (DEV_PLAN.md, 1.4) ----------

if (DEV) {
  const panel = $('devPanel');
  panel.hidden = false;
  /** @type {[keyof typeof TIMING, string][]} */
  const fields = [
    ['fastMs', 'Fast below (ms)'],
    ['okMs', 'OK below (ms)'],
    ['lateMs', 'Gone at (ms)'],
    ['biteDelayMin', 'Bite after, min (ms)'],
    ['biteDelayMax', 'Bite after, max (ms)'],
  ];
  /** @type {Record<string, Partial<typeof TIMING>>} */
  const presets = {
    Tight: { fastMs: 350, okMs: 700 },
    Default: { fastMs: TIMING.fastMs, okMs: TIMING.okMs },
    Lenient: { fastMs: 600, okMs: 1200 },
  };
  /** @type {Record<string, HTMLInputElement>} */
  const inputs = {};
  for (const [key, label] of fields) {
    const l = document.createElement('label');
    l.textContent = label;
    l.htmlFor = `dev-${key}`;
    const input = document.createElement('input');
    input.type = 'number';
    input.id = `dev-${key}`;
    input.value = String(timing[key]);
    input.addEventListener('change', () => (timing[key] = Number(input.value)));
    inputs[key] = input;
    $('devFields').append(l, input);
  }
  for (const [name, values] of Object.entries(presets)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = name;
    b.addEventListener('click', () => {
      Object.assign(timing, values);
      for (const [key] of fields) inputs[key].value = String(timing[key]);
    });
    $('devPresets').append(b);
  }
  $('devSeed').textContent = `Seed ${seed} - replay with ?dev&seed=${seed}`;
  console.log(`Roll for Fishing: seed ${seed}`);
}

render();
