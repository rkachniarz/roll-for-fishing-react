// @ts-check
// The words an event's text can use (docs/events.md, D88): `{name}`,
// `{class}`, `{season}`… The list of names is PLACEHOLDERS in
// tools/event-text.mjs, which `npm run content` checks event text against; a
// test checks this file fills every one.

import { t } from '../strings.js';
import { content } from '../generated/content.js';
import { levelFor } from '../engine/state.js';
import { clock } from '../engine/time.js';
import { className } from '../engine/character.js';

/** @param {string} s */
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
/** @param {string} s */
const upperFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Every placeholder's text for this game, now.
 * @param {import('../engine/state.js').GameState} state
 * @returns {Record<string, string | number>}
 */
export function eventWords(state) {
  const c = state.character;
  const now = clock(state.time);
  const location = t(content.locations[state.location].name);
  const season = t(content.weather[now.season].name);
  const time = t(`time.${now.partOfDay}`);
  const weather = t(content.weather[state.weather.season].weathers[state.weather.cell].name);
  return {
    name: c.name,
    class: t(className(c.classId, c.gender)),
    level: levelFor(c.xp),
    location: lowerFirst(location),
    Location: upperFirst(location),
    season: lowerFirst(season),
    Season: upperFirst(season),
    time: lowerFirst(time),
    Time: upperFirst(time),
    weather: lowerFirst(weather),
    Weather: upperFirst(weather),
  };
}

/**
 * Event text from its parts' string keys (events.js, textNow), with the
 * placeholders filled, counters too (`{#cat-trust}`, 7.7). A condition that
 * shows nothing can leave two spaces or a space at an end; those are tidied,
 * and paragraph breaks kept.
 * @param {string[]} keys
 * @param {Record<string, string | number>} words
 * @param {Record<string, boolean | number | string>} [counters]  The state's flags.
 */
export function sayEventText(keys, words, counters = {}) {
  return keys
    .map((k) => t(k, words).replace(/\{#([a-z0-9-]+)\}/g, (_, name) => String(Number(counters[name]) || 0)))
    .join('')
    .split('\n\n')
    .map((p) => p.replace(/\s+/g, ' ').replace(/ ([.,;:!?])/g, '$1').trim())
    .filter((p) => p)
    .join('\n\n');
}
