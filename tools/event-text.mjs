// The event text format (docs/decisions.md, D45, D84): one file per event in
// content/events/, read by `npm run content`.
//
//   ---
//   id: frog
//   title: A froggy encounter
//   once: true
//   ---
//
//   ## start
//   You see a frog in the shallow water, just outside your reach.
//
//   - Observe it closely -> observe
//   - Attempt to catch the frog -> lunge
//     needs: class rogue-fisher
//
//   ## lunge
//   You lunge forward and get wet, and it's like it was never there.
//
//   - Well, shit. -> end
//     lose: 1 luck
//
// The first slide is where the event starts. A choice's arrow points at a
// slide, or at `end`. The indented lines under a choice are its requirements
// (`needs:`) and effects (`gain:`, `lose:`, `set:`, `clear:`), one per line;
// the words after them are the vocabulary below, and a new word is code work
// (D42). This file only reads the text; tools/content.mjs checks that the
// classes, items and fish it names exist.

/** Requirement words, as `needs: <word> …` (D84). */
export const NEEDS = {
  class: 'class <class id>: the player is of that class',
  level: 'level <n>: the player is at least level n',
  luck: 'luck <n>: Luck is at least n (R6.7)',
  item: 'item <item id> [n]: n of the item (default 1) in the bags',
  flag: 'flag <name>: the flag is set',
  'no-flag': 'no-flag <name>: the flag is not set',
  season: 'season <season id>',
  time: 'time <part of day>: night, dawn, morning, noon, afternoon, sunset or evening',
  caught: 'caught <fish id> <n>: at least n of that fish caught, ever (R4.2)',
};

/** Effect words (D84). `gain` and `lose` take an amount and what of. */
export const EFFECTS = {
  gain: 'gain: [n] luck | xp | <item id>   (n defaults to 1)',
  lose: 'lose: [n] luck | <item id>',
  set: 'set: <flag name>',
  clear: 'clear: <flag name>',
};

export const TIMES = ['night', 'dawn', 'morning', 'noon', 'afternoon', 'sunset', 'evening'];
export const TRIGGERS = ['meter', 'needs', 'item'];

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const INT = /^-?\d+$/;

/**
 * @typedef {{ kind: 'class', id: string } | { kind: 'level' | 'luck', at: number }
 *   | { kind: 'item', id: string, count: number } | { kind: 'flag' | 'no-flag', name: string }
 *   | { kind: 'season', id: string } | { kind: 'time', part: string }
 *   | { kind: 'caught', fish: string, count: number }} Need
 * @typedef {{ kind: 'luck' | 'xp', add: number } | { kind: 'item', id: string, add: number }
 *   | { kind: 'flag', name: string, set: boolean }} Effect
 * @typedef {{ text: string, to: string, needs: Need[], effects: Effect[] }} Choice
 * @typedef {{ text: string, choices: Choice[] }} Slide
 * @typedef {{ id: string, title: string, once: boolean, trigger: string, needs: Need[],
 *   art?: string, first: string, slides: Record<string, Slide> }} GameEventData
 */

/**
 * @param {string} words  What follows `needs:`.
 * @returns {Need | string}  The requirement, or what is wrong with it.
 */
function parseNeed(words) {
  const [word, ...args] = words.trim().split(/\s+/);
  const n = (/** @type {string | undefined} */ s, fallback = NaN) => (s === undefined ? fallback : INT.test(s) ? Number(s) : NaN);
  switch (word) {
    case 'class':
    case 'season':
      if (args.length !== 1) return `"${word}" takes one id`;
      return { kind: word, id: args[0] };
    case 'level':
    case 'luck': {
      const at = n(args[0]);
      if (args.length !== 1 || Number.isNaN(at)) return `"${word}" takes a number`;
      return { kind: word, at };
    }
    case 'item': {
      const count = n(args[1], 1);
      if (args.length < 1 || args.length > 2 || Number.isNaN(count) || count < 1) return '"item" takes an item id and a count';
      return { kind: 'item', id: args[0], count };
    }
    case 'flag':
    case 'no-flag':
      if (args.length !== 1) return `"${word}" takes one flag name`;
      return { kind: word, name: args[0] };
    case 'time':
      if (args.length !== 1 || !TIMES.includes(args[0])) return `"time" takes one of ${TIMES.join(', ')}`;
      return { kind: 'time', part: args[0] };
    case 'caught': {
      const count = n(args[1]);
      if (args.length !== 2 || Number.isNaN(count) || count < 1) return '"caught" takes a fish id and a count';
      return { kind: 'caught', fish: args[0], count };
    }
    default:
      return `no requirement "${word}" (known: ${Object.keys(NEEDS).join(', ')})`;
  }
}

/**
 * @param {string} verb  gain, lose, set or clear.
 * @param {string} words
 * @returns {Effect | string}
 */
function parseEffect(verb, words) {
  const args = words.trim().split(/\s+/);
  if (verb === 'set' || verb === 'clear') {
    if (args.length !== 1 || !args[0]) return `"${verb}" takes one flag name`;
    return { kind: 'flag', name: args[0], set: verb === 'set' };
  }
  const amount = args.length === 2 && INT.test(args[0]) ? Number(args.shift()) : 1;
  if (args.length !== 1 || amount < 1) return `"${verb}" takes an amount above 0 and one thing`;
  const what = args[0];
  const add = verb === 'gain' ? amount : -amount;
  if (what === 'luck') return { kind: 'luck', add };
  if (what === 'xp') return verb === 'gain' ? { kind: 'xp', add } : "XP can't be lost";
  return { kind: 'item', id: what, add };
}

/**
 * Reads one event file.
 * @param {string} text
 * @returns {{ event: GameEventData | null, errors: string[] }}  Errors carry their line number.
 */
export function parseEvent(text) {
  /** @type {string[]} */
  const errors = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const fail = (/** @type {number} */ i, /** @type {string} */ message) => errors.push(`line ${i + 1}: ${message}`);

  // ---- Front matter ----
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (lines[i]?.trim() !== '---') return { event: null, errors: ['the file must start with front matter between --- lines'] };
  /** @type {Record<string, string>} */
  const front = {};
  /** @type {Need[]} */
  const eventNeeds = [];
  for (i++; i < lines.length && lines[i].trim() !== '---'; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('#')) continue;
    const m = /^([a-z]+):\s*(.*)$/.exec(line);
    if (!m) fail(i, `expected "key: value", got "${line}"`);
    else if (m[1] === 'needs') {
      const need = parseNeed(m[2]);
      if (typeof need === 'string') fail(i, need);
      else eventNeeds.push(need);
    } else if (!['id', 'title', 'once', 'trigger', 'art'].includes(m[1])) fail(i, `no front matter key "${m[1]}"`);
    else front[m[1]] = m[2];
  }
  if (i >= lines.length) return { event: null, errors: ['the front matter has no closing ---'] };
  i++;

  if (!front.id || !ID.test(front.id)) fail(0, 'the front matter needs an id in lowercase-with-dashes');
  if (!front.title) fail(0, 'the front matter needs a title');
  if (front.once !== undefined && front.once !== 'true' && front.once !== 'false') fail(0, '"once" is true or false');
  const trigger = front.trigger ?? 'meter';
  if (!TRIGGERS.includes(trigger)) fail(0, `"trigger" is one of ${TRIGGERS.join(', ')}`);

  // ---- Slides ----
  /** @type {Record<string, Slide>} */
  const slides = {};
  /** @type {string | null} */
  let first = null;
  /** @type {Slide | null} */
  let slide = null;
  /** @type {Choice | null} */
  let choice = null;
  /** @type {string[]} */
  let paragraph = [];
  /** @type {string[]} */
  let paragraphs = [];
  /** @type {{ to: string, line: number }[]} */
  const arrows = [];

  const endParagraph = () => {
    if (paragraph.length) paragraphs.push(paragraph.join(' '));
    paragraph = [];
  };
  const endSlide = () => {
    endParagraph();
    if (slide) {
      slide.text = paragraphs.join('\n\n');
      if (!slide.text) errors.push(`slide "${Object.keys(slides).at(-1)}" has no text`);
      if (!slide.choices.length) errors.push(`slide "${Object.keys(slides).at(-1)}" has no choices`);
    }
    paragraphs = [];
  };

  for (; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      endSlide();
      const id = heading[1].trim();
      if (!ID.test(id)) fail(i, `slide id "${id}" must be lowercase-with-dashes`);
      else if (id === 'end') fail(i, '"end" is reserved for ending the event');
      else if (slides[id]) fail(i, `two slides called "${id}"`);
      slide = { text: '', choices: [] };
      slides[id] = slide;
      first ??= id;
      choice = null;
      continue;
    }
    if (line === '') {
      endParagraph();
      continue;
    }
    if (!slide) {
      fail(i, 'text before the first slide (a slide starts with "## id")');
      continue;
    }
    if (/^[-*]\s/.test(line) && !/^\s/.test(raw)) {
      endParagraph();
      const m = /^[-*]\s+(.+?)\s*->\s*([a-z0-9-]+)$/.exec(line);
      if (!m) {
        fail(i, 'a choice is "- what the player says -> slide id" (or "-> end")');
        choice = null;
        continue;
      }
      choice = { text: m[1], to: m[2], needs: [], effects: [] };
      slide.choices.push(choice);
      arrows.push({ to: m[2], line: i });
      continue;
    }
    if (/^\s/.test(raw) && choice) {
      const m = /^([a-z]+):\s*(.*)$/.exec(line);
      if (!m) fail(i, `expected "needs:", "gain:", "lose:", "set:" or "clear:", got "${line}"`);
      else if (m[1] === 'needs') {
        const need = parseNeed(m[2]);
        if (typeof need === 'string') fail(i, need);
        else choice.needs.push(need);
      } else if (m[1] in EFFECTS) {
        const effect = parseEffect(m[1], m[2]);
        if (typeof effect === 'string') fail(i, effect);
        else choice.effects.push(effect);
      } else fail(i, `no word "${m[1]}" (known: needs, ${Object.keys(EFFECTS).join(', ')})`);
      continue;
    }
    if (slide.choices.length) {
      fail(i, "a slide's text goes before its choices");
      continue;
    }
    paragraph.push(line);
  }
  endSlide();

  if (!first) errors.push('no slides (a slide starts with "## id")');
  for (const a of arrows) if (a.to !== 'end' && !slides[a.to]) fail(a.line, `no slide "${a.to}"`);
  if (errors.length) return { event: null, errors };

  /** @type {GameEventData} */
  const event = {
    id: front.id,
    title: front.title,
    once: front.once === 'true',
    trigger,
    needs: eventNeeds,
    first: /** @type {string} */ (first),
    slides,
  };
  if (front.art) event.art = front.art;
  return { event, errors };
}
