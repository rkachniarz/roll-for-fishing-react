// @ts-check
// The map (DEV_PLAN 12.1, CR-7): the owner's distressed paper with the lake
// drawn on it, over the whole screen. A green circle is a spot known of, the
// red one is where the player is; the name of the one under the pointer shows
// at the paper's top. With a mouse, a click goes there; on a touch screen the
// first tap names the spot and a second tap on it goes.
//
// The picture is baked by `npm run map` (tools/map.py) into
// src/generated/map-paper.js; the marks' places are content (`map` on a spot,
// or on a town). Like the scene, it is drawn at a whole number of device pixels
// per picture pixel (D10).

import { content } from '../generated/content.js';
import { MAP_PAPER, MAP_SIZE } from '../generated/map-paper.js';
import { t } from '../strings.js';
import { completion, mapMarks } from '../engine/knowledge.js';

/** @typedef {import('../engine/state.js').GameState} GameState */
/** @typedef {import('../engine/knowledge.js').MapMark} MapMark */

/** A mark's canvas, in picture pixels: the circle, and room for the ring round it. */
const MARK = 15;
/** How far from a mark a press still counts for it: picture pixels, or CSS pixels for a finger, whichever is more. */
const REACH = { picture: 9, css: 22 };
const INK = '#3b2a1c';
const LOOK = {
  known: { fill: '#3f9a42', light: '#8fd27f' },
  here: { fill: '#c23a2c', light: '#f08a6e' },
};

/**
 * One mark as pixel art: a filled circle with an ink rim and a glint, and,
 * when `ring`, a ring of ink round it (hovered or picked).
 * @param {'known' | 'here'} kind
 * @param {boolean} ring
 */
function paintMark(kind, ring) {
  const c = document.createElement('canvas');
  c.width = c.height = MARK;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const mid = (MARK - 1) / 2;
  for (let y = 0; y < MARK; y++) {
    for (let x = 0; x < MARK; x++) {
      const d = Math.hypot(x - mid, y - mid);
      let colour = null;
      if (d <= 4.2) colour = LOOK[kind].fill;
      else if (d <= 5.3) colour = INK;
      else if (ring && d > 6.2 && d <= 7.2) colour = INK;
      if (colour) {
        g.fillStyle = colour;
        g.fillRect(x, y, 1, 1);
      }
    }
  }
  g.fillStyle = LOOK[kind].light;
  g.fillRect(mid - 2, mid - 2, 1, 1);
  g.fillRect(mid - 1, mid - 3, 1, 1);
  g.fillRect(mid - 3, mid - 1, 1, 1);
  return c;
}

/** "the reedy shore" -> "The reedy shore", for the heading. @param {string} s */
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * @param {HTMLElement} root  The overlay, empty; it is filled here.
 * @param {{ onTravel: (location: string, spot: string) => void, onClose: () => void }} on
 */
export function createMap(root, on) {
  root.classList.add('map-overlay');
  const sheet = document.createElement('div');
  sheet.className = 'map-sheet';
  const paper = document.createElement('img');
  paper.className = 'map-paper';
  paper.src = MAP_PAPER;
  paper.alt = '';
  paper.draggable = false;
  const heading = document.createElement('div');
  heading.className = 'map-name';
  heading.setAttribute('aria-live', 'polite');
  const name = document.createElement('p');
  name.className = 'map-spot-name';
  const place = document.createElement('p');
  place.className = 'map-place';
  heading.append(name, place);
  const marks = document.createElement('div');
  marks.className = 'map-marks';
  const note = document.createElement('p');
  note.className = 'map-note';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'map-close';
  close.textContent = '×';
  close.setAttribute('aria-label', t('hud.close'));
  close.addEventListener('click', () => on.onClose());
  sheet.append(paper, heading, marks, note, close);
  root.replaceChildren(sheet);
  // A click on the dark round the paper closes it, as WoW's map does with Escape.
  root.addEventListener('click', (e) => {
    if (e.target === root) on.onClose();
  });

  /** @type {GameState | null} */
  let state = null;
  /** The marks as last drawn. @type {MapMark[]} */
  let shownMarks = [];
  let showCompletion = false;
  /** The mark named at the top: hovered, or picked by a first tap. @type {string | null} */
  let named = null;

  /** @param {MapMark} m */
  const keyOf = (m) => `${m.location}:${m.spot}`;

  /** @param {MapMark | undefined} m */
  function nameFor(m) {
    if (!state || !m) return { spot: '', place: '' };
    const loc = content.locations[m.location];
    const spot = m.town ? t(loc.name) : t(loc.spots.find((/** @type {{ id: string }} */ s) => s.id === m.spot).name);
    let where = m.town ? '' : t(loc.name);
    if (showCompletion) {
      const { found, total } = completion(state, m.location);
      const percent = total ? Math.floor((100 * found) / total) : 0;
      where = t('journal.placeShown', { place: t(loc.name), percent });
    }
    return { spot: capital(spot), place: where };
  }

  function renderName() {
    if (!state) return;
    const all = mapMarks(state);
    const shown = all.find((m) => keyOf(m) === named) ?? all.find((m) => m.here);
    const words = nameFor(shown);
    name.textContent = words.spot;
    place.textContent = words.place;
    for (const b of marks.querySelectorAll('button')) b.classList.toggle('named', b.dataset.mark === named);
  }

  /** @param {MapMark} m */
  function go(m) {
    if (!m.here) on.onTravel(m.location, m.spot);
  }

  /**
   * The mark nearest a pointer, if it is within reach: the circles are small
   * on a phone, and two can sit close together.
   * @param {PointerEvent | MouseEvent} e
   */
  function markAt(e) {
    const box = sheet.getBoundingClientRect();
    const scale = box.width / MAP_SIZE;
    const x = (e.clientX - box.left) / scale;
    const y = (e.clientY - box.top) / scale;
    const reach = Math.max(REACH.picture, REACH.css / scale);
    let best = null;
    let bestD = reach;
    for (const m of shownMarks) {
      const d = Math.hypot(m.x - x, m.y - y);
      if (d <= bestD) {
        best = m;
        bestD = d;
      }
    }
    return best;
  }

  /** The mark the mouse is over, named at the top. @param {PointerEvent} e */
  function hover(e) {
    if (e.pointerType !== 'mouse') return;
    const m = markAt(e);
    const key = m ? keyOf(m) : null;
    sheet.classList.toggle('pointing', Boolean(m && !m.here));
    if (key === named) return;
    named = key;
    renderName();
  }
  sheet.addEventListener('pointermove', hover);
  sheet.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    sheet.classList.remove('pointing');
    named = null;
    renderName();
  });
  sheet.addEventListener('click', (e) => {
    if (e.target === close || e.detail === 0) return;
    const m = markAt(e);
    if (!m) return;
    // A touch names the spot first; a second tap on it goes. A mouse has
    // already named it by hovering.
    if (named !== keyOf(m)) {
      named = keyOf(m);
      renderName();
      return;
    }
    go(m);
  });

  function render() {
    if (!state) return;
    const s = state;
    shownMarks = mapMarks(s);
    marks.replaceChildren(
      ...shownMarks.map((m) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `map-mark ${m.here ? 'here' : 'known'}`;
        b.dataset.mark = keyOf(m);
        b.style.setProperty('--x', String(m.x));
        b.style.setProperty('--y', String(m.y));
        const words = nameFor(m);
        b.setAttribute('aria-label', words.spot);
        if (m.here) b.setAttribute('aria-current', 'location');
        // Somewhere an event holds the player: no other location (R10.8, 7.6).
        if (s.locked && s.locked !== m.location) b.classList.add('held');
        const plain = paintMark(m.here ? 'here' : 'known', false);
        const ringed = paintMark(m.here ? 'here' : 'known', true);
        plain.className = 'plain';
        ringed.className = 'ringed';
        b.append(plain, ringed);
        b.addEventListener('focus', () => {
          named = keyOf(m);
          renderName();
        });
        // The keyboard's Enter or Space; a pointer is the sheet's, below.
        b.addEventListener('click', (e) => {
          if (e.detail === 0) go(m);
        });
        return b;
      }),
    );
    note.textContent = s.locked ? t('map.locked') : '';
    renderName();
  }

  /** The paper as big as the screen allows, less a small margin, in whole device pixels per pixel (D10). */
  function fit() {
    const margin = window.innerWidth >= 900 ? 24 : 8;
    const room = Math.min(window.innerWidth, window.innerHeight) - 2 * margin;
    const dpr = window.devicePixelRatio || 1;
    const k = Math.floor((room * dpr) / MAP_SIZE);
    const px = k >= 1 ? k / dpr : room / MAP_SIZE;
    sheet.style.setProperty('--map-px', `${px}px`);
  }
  window.addEventListener('resize', () => {
    if (!root.hidden) fit();
  });

  return {
    /**
     * @param {GameState} next
     * @param {boolean} completionShown  Each location's completion shows (R5.3).
     */
    show(next, completionShown) {
      const opening = root.hidden;
      state = next;
      showCompletion = completionShown;
      if (opening) {
        named = null;
        fit();
      }
      root.hidden = false;
      render();
    },
    hide() {
      root.hidden = true;
      state = null;
    },
  };
}
