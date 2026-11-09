// @ts-check
// The button row's words and pictures (R16.4) and the log's links (R16.5).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tParts } from '../src/strings.js';
import { ICONS, iconKeys, weatherIcon } from '../src/scene/icons.js';
import { content } from '../src/generated/content.js';

test('a line can hold a link where its placeholder was', () => {
  const link = { link: 'Large Roach' };
  assert.deepEqual(tParts('log.found', { item: link }), ['You caught: ', link]);
  assert.deepEqual(tParts('log.caught', { fish: link, size: 23, xp: 5 }), ['You caught: ', link, ' (23 cm). +5 XP.']);
});

test('the weather picks its icon: wet first, then cloud, then wind', () => {
  const w = (/** @type {Partial<{ temperature: number, wind: number, clouds: number, precipitation: number }>} */ x) => ({ temperature: 8, wind: 0, clouds: 0, precipitation: 0, ...x });
  assert.equal(weatherIcon(w({}), false), 'weather/clear-day');
  assert.equal(weatherIcon(w({}), true), 'weather/clear-night');
  assert.equal(weatherIcon(w({ clouds: 2 }), false), 'weather/partly-day');
  assert.equal(weatherIcon(w({ clouds: 4, wind: 5 }), false), 'weather/overcast');
  assert.equal(weatherIcon(w({ wind: 4 }), false), 'weather/wind');
  assert.equal(weatherIcon(w({ precipitation: 1, clouds: 1 }), false), 'weather/clear-day');
  assert.equal(weatherIcon(w({ precipitation: 3 }), false), 'weather/rain');
  assert.equal(weatherIcon(w({ precipitation: 4 }), false), 'weather/storm');
  assert.equal(weatherIcon(w({ precipitation: 3, temperature: 1 }), false), 'weather/snow');
});

test('every icon is at most 32×32, with rows of one width and keys it has colours for (D98)', () => {
  for (const [name, rows] of Object.entries(ICONS)) {
    assert.ok(rows.length <= 32, name);
    assert.equal(new Set(rows.map((r) => r.length)).size, 1, name);
    assert.ok(rows[0].length <= 32, name);
    const keys = iconKeys(name);
    for (const key of new Set(rows.join(''))) assert.ok(key === '.' || key in keys, `${name}: no colour for "${key}"`);
  }
});

test('every icon a fish or item names exists', () => {
  for (const entity of [...Object.values(content.fish), ...Object.values(content.items)]) {
    if (entity.icon) assert.ok(ICONS[entity.icon], `${entity.id}: no icon "${entity.icon}"`);
  }
});
