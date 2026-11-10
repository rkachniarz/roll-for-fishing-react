// The event text format (docs/decisions.md, D45, D84): one file per event in
// content/events/, read by `npm run content`.
//
//   ---
//   id: frog
//   title: A froggy encounter
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
// slide, or at `end`. Counters (7.7), fish from the bucket (7.8), visitors who
// come back (`again:`, 7.10), moving and holding the player (7.6) and trading
// junk (7.9) are words like the rest. Text may hold placeholders, `{name}`, and conditional
// text, `[wind 3+: The wind howls. | All is still.]` (D88).
// The indented lines under a choice are its requirements
// (`needs:`) and effects (`gain:`, `lose:`, `set:`, `clear:`), one per line;
// the words after them are the vocabulary below, and a new word is code work
// (D42). This file only reads the text; tools/content.mjs checks that the
// classes, items and fish it names exist.

/** Requirement words, as `needs: <word> …` (D84). */
export const NEEDS = {
  class: 'class <class id>: the player is of that class',
  gender: 'gender m | f: the player is male (m) or female (f)',
  location: 'location <location id>: the player is there',
  spot: 'spot <spot id>: the player is at that spot',
  level: 'level <n>: the player is at least level n',
  luck: 'luck <n>: Luck is at least n (R6.7)',
  item: 'item <item id> [n]: n of the item (default 1) in the bags',
  flag: 'flag <name>: the flag is set',
  'no-flag': 'no-flag <name>: the flag is not set',
  season: 'season <season id>',
  time: 'time <part of day>: night, dawn, morning, noon, afternoon, sunset or evening',
  caught: 'caught <fish id> <n>: at least n of that fish caught, ever (R4.2)',
  count: 'count <name> <amount>: a counter (add:) is at that amount; 5 exactly, 5+ at least, 5- at most, 3..8 between (7.7)',
  fish: 'fish [fish id] [n]: n fish (default 1) in the bucket, of that species if given (7.8)',
  temperature: 'temperature <amount>: the temperature now; 5 exactly, 5+ at least, 5- at most, 3..8 between',
  wind: 'wind <amount>: the wind now, 0 (none) to 5 (extreme), as temperature',
  clouds: 'clouds <amount>: the clouds now, 0 (clear) to 5 (black), as temperature',
  precipitation: 'precipitation <amount>: rain or snow now, 0 (none) to 5 (extreme), as temperature',
};

/** The weather's levels a requirement can check (src/engine/weather.js). */
export const WEATHER_LEVELS = ['temperature', 'wind', 'clouds', 'precipitation'];

/**
 * Placeholders in event text (D88), filled in by src/ui/event-words.js. The
 * capitalised ones are for the start of a sentence.
 */
export const PLACEHOLDERS = {
  name: "the player's name",
  class: "the player's class, as it reads for their gender: Rogue Fisherwoman",
  level: "the player's level",
  location: 'where the player is: the Lake',
  Location: 'the same, capitalised: The Lake',
  season: 'the season: spring',
  Season: 'the same, capitalised: Spring',
  time: 'the time of day: dawn',
  Time: 'the same, capitalised: Dawn',
  weather: "the weather's name: clear and nippy",
  Weather: 'the same, capitalised: Clear and nippy',
};

/** Effect words (D84). `gain` and `lose` take an amount and what of. */
export const EFFECTS = {
  gain: 'gain: [n] luck | xp | <item id>   (n defaults to 1)',
  lose: 'lose: [n] luck | <item id> | fish [fish id] | rarest fish   (fish from the bucket: the least valuable first, 7.8)',
  set: 'set: <flag name>',
  clear: 'clear: <flag name>   (a counter too)',
  add: 'add: <counter name> <n>: the counter goes up by n, or down with -n (7.7)',
  go: 'go: <location id> [spot id]: the player is moved there (7.6)',
  lock: "lock: the player can't leave the location they are at (R10.8, 7.6)",
  unlock: 'unlock: they can leave again',
  trade: 'trade: junk <table id>: every useless junk item in the bags for a reward from the table, by their value (7.9)',
  learn: 'learn: spot | fish | item <location id> <id>: the player learns that it is there (R4.5, 8.5)',
};

/** Front matter `again:`: a visitor who comes back after so many casts or days (7.10). */
const AGAIN = /^(\d+)\s+(casts?|days?)$/;

export const TIMES = ['night', 'dawn', 'morning', 'noon', 'afternoon', 'sunset', 'evening'];
export const TRIGGERS = ['meter', 'needs', 'item', 'arrive'];

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const INT = /^-?\d+$/;

/**
 * @typedef {{ kind: 'class', id: string } | { kind: 'level' | 'luck', at: number }
 *   | { kind: 'item', id: string, count: number } | { kind: 'flag' | 'no-flag', name: string }
 *   | { kind: 'season', id: string } | { kind: 'time', part: string }
 *   | { kind: 'caught', fish: string, count: number }
 *   | { kind: 'weather', level: string, min: number | null, max: number | null }
 *   | { kind: 'gender', gender: 'm' | 'f' }
 *   | { kind: 'location' | 'spot', id: string }
 *   | { kind: 'count', name: string, min: number | null, max: number | null }
 *   | { kind: 'fish', species: string | null, count: number }} Need
 * @typedef {{ kind: 'luck' | 'xp', add: number } | { kind: 'item', id: string, add: number }
 *   | { kind: 'flag', name: string, set: boolean } | { kind: 'count', name: string, add: number }
 *   | { kind: 'fish', which: 'any' | 'species' | 'rarest', species: string | null, count: number }
 *   | { kind: 'go', location: string, spot: string | null } | { kind: 'lock', set: boolean }
 *   | { kind: 'trade', what: 'junk', table: string }
 *   | { kind: 'learn', what: 'spot' | 'fish' | 'item', location: string, id: string }} Effect
 * @typedef {string | { needs: Need[], text: string, otherwise?: string }} Part  Plain text, or text
 *   shown only when its needs are met, with what to show otherwise (D88).
 * @typedef {Part[]} Text
 * @typedef {{ text: Text, to: string, needs: Need[], effects: Effect[] }} Choice
 * @typedef {{ text: Text, choices: Choice[] }} Slide
 * @typedef {{ id: string, title: Text, once: boolean, trigger: string, needs: Need[],
 *   art?: string, again?: { casts?: number, days?: number }, first: string, slides: Record<string, Slide> }} GameEventData
 */

/**
 * @param {string} words  What follows `needs:`.
 * @returns {Need | string}  The requirement, or what is wrong with it.
 */
function parseNeed(words) {
  const [word, ...args] = words.trim().split(/\s+/);
  const n = (/** @type {string | undefined} */ s, fallback = NaN) => (s === undefined ? fallback : INT.test(s) ? Number(s) : NaN);
  switch (word) {
    case 'gender':
      if (args.length !== 1 || (args[0] !== 'm' && args[0] !== 'f')) return '"gender" takes m or f';
      return { kind: 'gender', gender: args[0] };
    case 'class':
    case 'season':
    case 'location':
    case 'spot':
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
    case 'count': {
      const range = args.length === 2 ? parseAmount(args[1]) : null;
      if (!range || !ID.test(args[0])) return '"count" takes a counter name and an amount: count cat-trust 5+';
      return { kind: 'count', name: args[0], ...range };
    }
    case 'fish': {
      // fish | fish 3 | fish roach | fish roach 3
      let species = null;
      let count = 1;
      if (args.length === 1 && INT.test(args[0])) count = Number(args[0]);
      else if (args.length >= 1) {
        species = args[0];
        if (args.length === 2) count = n(args[1]);
      }
      if (args.length > 2 || Number.isNaN(count) || count < 1) return '"fish" takes a fish id, a count, or both: fish roach 3';
      return { kind: 'fish', species, count };
    }
    case 'temperature':
    case 'wind':
    case 'clouds':
    case 'precipitation': {
      const range = args.length === 1 ? parseAmount(args[0]) : null;
      if (!range) return `"${word}" takes an amount: 3 exactly, 3+ at least, 3- at most, or 2..4 between`;
      return { kind: 'weather', level: word, ...range };
    }
    default:
      return `no requirement "${word}" (known: ${Object.keys(NEEDS).join(', ')})`;
  }
}

/**
 * Text with conditional parts (D88): `[needs: shown | otherwise]`, where the
 * needs are requirement words separated by commas, all of which must be met,
 * and `| otherwise` may be left out. `\[`, `\]` and `\|` are the characters
 * themselves. Conditions can't nest.
 * @param {string} text
 * @returns {Text | string}  The parts, or what is wrong.
 */
export function parseText(text) {
  /** @type {Text} */
  const parts = [];
  let plain = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\\' && '[]|'.includes(text[i + 1] ?? '')) {
      plain += text[++i];
      continue;
    }
    if (c === ']') return 'a "]" with no "[" before it (write \\] for the character)';
    if (c !== '[') {
      plain += c;
      continue;
    }
    // A condition: up to the next "]" that isn't escaped.
    /** @type {string[]} */
    const pieces = [''];
    let colon = -1;
    let j = i + 1;
    for (; j < text.length && text[j] !== ']'; j++) {
      if (text[j] === '\\' && '[]|'.includes(text[j + 1] ?? '')) {
        pieces[pieces.length - 1] += text[++j];
        continue;
      }
      if (text[j] === '[') return 'a "[" inside another: conditional text can\'t nest';
      if (text[j] === ':' && colon < 0) {
        colon = pieces[0].length;
        pieces[0] += ':';
        continue;
      }
      if (text[j] === '|' && colon >= 0) {
        pieces.push('');
        continue;
      }
      pieces[pieces.length - 1] += text[j];
    }
    if (j >= text.length) return 'a "[" with no "]"';
    if (colon < 0) return `"[${pieces[0]}]" needs requirements, a colon and the text: [wind 3+: The wind howls.]`;
    if (pieces.length > 2) return 'one "|" at most in a condition';
    /** @type {Need[]} */
    const needs = [];
    for (const words of pieces[0].slice(0, colon).split(',')) {
      const need = parseNeed(words);
      if (typeof need === 'string') return need;
      needs.push(need);
    }
    if (plain) parts.push(plain);
    plain = '';
    const shown = pieces[0].slice(colon + 1).trim();
    parts.push(pieces.length === 2 ? { needs, text: shown, otherwise: pieces[1].trim() } : { needs, text: shown });
    i = j;
  }
  if (plain) parts.push(plain);
  return parts;
}

/**
 * An amount for a weather requirement: `3`, `3+`, `3-` or `2..4`.
 * @param {string} text
 * @returns {{ min: number | null, max: number | null } | null}
 */
function parseAmount(text) {
  const num = '(-?\\d+)';
  let m;
  if ((m = new RegExp(`^${num}$`).exec(text))) return { min: Number(m[1]), max: Number(m[1]) };
  if ((m = new RegExp(`^${num}\\+$`).exec(text))) return { min: Number(m[1]), max: null };
  if ((m = new RegExp(`^${num}-$`).exec(text))) return { min: null, max: Number(m[1]) };
  if ((m = new RegExp(`^${num}\\.\\.${num}$`).exec(text)) && Number(m[1]) <= Number(m[2])) return { min: Number(m[1]), max: Number(m[2]) };
  return null;
}

/**
 * @param {string} verb  gain, lose, set or clear.
 * @param {string} words
 * @returns {Effect | string}
 */
function parseEffect(verb, words) {
  const args = words.trim().split(/\s+/);
  if (verb === 'lock' || verb === 'unlock') return words.trim() ? `"${verb}" takes nothing after it` : { kind: 'lock', set: verb === 'lock' };
  if (verb === 'add') {
    if (args.length !== 2 || !ID.test(args[0]) || !INT.test(args[1]) || Number(args[1]) === 0) return '"add" takes a counter name and a number: add: cat-trust 1 (or -1)';
    return { kind: 'count', name: args[0], add: Number(args[1]) };
  }
  if (verb === 'go') {
    if (args.length < 1 || args.length > 2 || !args[0]) return '"go" takes a location id and, if you like, a spot id';
    return { kind: 'go', location: args[0], spot: args[1] ?? null };
  }
  if (verb === 'learn') {
    if (args.length !== 3 || !['spot', 'fish', 'item'].includes(args[0])) return '"learn" takes spot, fish or item, a location id and an id: learn: spot river lower-river';
    return { kind: 'learn', what: /** @type {'spot' | 'fish' | 'item'} */ (args[0]), location: args[1], id: args[2] };
  }
  if (verb === 'trade') {
    if (args.length !== 2 || args[0] !== 'junk') return '"trade" takes "junk" and a table id: trade: junk junk-collector';
    return { kind: 'trade', what: 'junk', table: args[1] };
  }
  if (!words.trim()) return verb === 'set' || verb === 'clear' ? `"${verb}" needs a flag name` : `"${verb}" needs something to ${verb}: an item id, luck or xp`;
  if (verb === 'set' || verb === 'clear') {
    if (args.length !== 1 || !args[0]) return `"${verb}" takes one flag name`;
    return { kind: 'flag', name: args[0], set: verb === 'set' };
  }
  const amount = args.length >= 2 && INT.test(args[0]) ? Number(args.shift()) : 1;
  if (amount < 1) return `"${verb}" takes an amount above 0`;
  // Fish from the bucket (7.8): the least valuable, of a species, or the rarest.
  if (args[0] === 'fish' || (args[0] === 'rarest' && args[1] === 'fish')) {
    if (verb === 'gain') return 'fish can only be lost from the bucket, not gained';
    if (args[0] === 'rarest') return args.length === 2 ? { kind: 'fish', which: 'rarest', species: null, count: amount } : '"rarest fish" takes nothing after it';
    if (args.length === 1) return { kind: 'fish', which: 'any', species: null, count: amount };
    if (args.length === 2) return { kind: 'fish', which: 'species', species: args[1], count: amount };
    return '"fish" takes at most a fish id after it: lose: 3 fish roach';
  }
  if (args.length !== 1) return `"${verb}" takes an amount above 0 and one thing`;
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
    } else if (!['id', 'title', 'once', 'trigger', 'art', 'again'].includes(m[1])) fail(i, `no front matter key "${m[1]}"`);
    else if (m[1] in front) fail(i, `"${m[1]}" twice (an event has one ${m[1]})`);
    else front[m[1]] = m[2];
  }
  if (i >= lines.length) return { event: null, errors: ['the front matter has no closing ---'] };
  i++;

  if (!front.id || !ID.test(front.id)) fail(0, 'the front matter needs an id in lowercase-with-dashes');
  if (!front.title) fail(0, 'the front matter needs a title');
  if (front.once !== undefined && front.once !== 'true' && front.once !== 'false') fail(0, '"once" is true or false');
  const again = front.again !== undefined ? AGAIN.exec(front.again.trim()) : null;
  if (front.again !== undefined && !again) fail(0, '"again" is a number of casts or days: again: 50 casts, again: 3 days');
  if (again && front.once === 'true') fail(0, '"again" brings an event back, so it can\'t be "once: true"');
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
      const id = Object.keys(slides).at(-1);
      const text = parseText(paragraphs.join('\n\n'));
      if (typeof text === 'string') errors.push(`slide "${id}": ${text}`);
      else slide.text = text;
      if (!paragraphs.length) errors.push(`slide "${id}" has no text`);
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
      slide = { text: [], choices: [] };
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
      const text = parseText(m[1]);
      if (typeof text === 'string') fail(i, text);
      choice = { text: typeof text === 'string' ? [] : text, to: m[2], needs: [], effects: [] };
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

  const title = parseText(front.title);
  if (typeof title === 'string') return { event: null, errors: [`the title: ${title}`] };

  /** @type {GameEventData} */
  const event = {
    id: front.id,
    title,
    // Once per game unless it says otherwise (D87), or comes back (7.10).
    once: front.once === undefined ? !again : front.once !== 'false',
    trigger,
    needs: eventNeeds,
    first: /** @type {string} */ (first),
    slides,
  };
  if (front.art) event.art = front.art;
  if (again) event.again = again[2].startsWith('cast') ? { casts: Number(again[1]) } : { days: Number(again[1]) };
  return { event, errors };
}
