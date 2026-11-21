// @ts-check
// Clouds that follow the weather (12.5, D170): the rules in
// content/rules/sky.json against the weather maps, and the cloud patterns of
// src/scene/clouds.js.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content, strings as allStrings } from '../src/generated/content.js';
import { CLOUD_PATTERNS, RAMPS, SKY_W, cloudDusk, layOutSky, skySpec } from '../src/scene/clouds.js';
import { createRng } from '../src/rng.js';

const sky = content.rules.sky;
/** The English text, by key. @type {Record<string, string>} */
const strings = allStrings.en;
/** Every level a weather cell can roll. @param {number | { min: number, max: number }} level */
const levelsOf = (level) => (typeof level === 'number' ? [level] : Array.from({ length: level.max - level.min + 1 }, (_, i) => level.min + i));
/** @param {{ min?: number, max?: number }} range @param {number} level */
const holds = (range, level) => level >= (range.min ?? 0) && level <= (range.max ?? 5);

test('every weather description that names a cloud or the sky has its own case, suiting every level its weather rolls', () => {
  let named = 0;
  for (const season of Object.values(content.weather)) {
    for (const w of season.weathers) {
      for (const key of w.descriptions) {
        const text = strings[key];
        if (!/cloud|\bsky|\bskies/i.test(text)) continue;
        named++;
        const kase = sky.descriptions[key];
        assert.ok(kase, `"${text}" (${key}) names a sky but has no case in content/rules/sky.json`);
        for (const level of levelsOf(w.clouds)) assert.ok(holds(kase.levels, level), `"${text}": its weather rolls clouds ${level}, outside its case`);
      }
    }
  }
  assert.ok(named > 15, `only ${named} descriptions name a sky`);
});

test('every case is a real description, and every pattern named is drawn', () => {
  const all = [
    ...Object.values(sky.seasons).flatMap((s) => s.levels.flat()),
    ...sky.wet.patterns,
    ...sky.fog.flatMap((/** @type {{ patterns: string[] }} */ f) => f.patterns),
    ...Object.values(sky.descriptions).flatMap((/** @type {{ patterns: string[] }} */ d) => d.patterns),
  ];
  for (const id of all) assert.ok(CLOUD_PATTERNS[id], `no cloud pattern "${id}" in src/scene/clouds.js`);
  for (const key of Object.keys(sky.descriptions)) assert.ok(typeof strings[key] === 'string', `${key} is no description`);
});

test('each season lists two or three patterns (plus a helper) per cloud level, none when clear', () => {
  for (const [id, season] of Object.entries(sky.seasons)) {
    assert.deepEqual(season.levels[0], [], `${id}: a clear sky shows no clouds`);
    for (let level = 1; level <= 5; level++) {
      const n = season.levels[level].length;
      assert.ok(n >= 2 && n <= 4, `${id}, level ${level}: ${n} patterns`);
    }
    // Overcast and black fill the sky: a backdrop among them.
    for (const level of [4, 5]) assert.ok(season.levels[level].some((p) => CLOUD_PATTERNS[p].full), `${id}, level ${level}: no sky-wide pattern`);
  }
});

test('the library has every cloud type, each with two or three patterns', () => {
  /** @type {Record<string, number>} */
  const kinds = {};
  for (const p of Object.values(CLOUD_PATTERNS)) kinds[p.kind] = (kinds[p.kind] ?? 0) + 1;
  for (const kind of ['heap', 'tower', 'mass', 'layer', 'wisp', 'sheet', 'deck', 'rain', 'storm']) {
    assert.ok(kinds[kind] >= 2 && kinds[kind] <= 3, `${kind}: ${kinds[kind] ?? 0} patterns`);
  }
});

test('the cover agrees with the moonlight under cloud (rules/moon.json)', () => {
  const moon = content.rules.moon;
  sky.levels.forEach((/** @type {{ cover: number }} */ row, level) => {
    assert.ok(Math.abs(row.cover - (1 - moon.cloudCover[level])) <= 0.15, `level ${level}: cover ${row.cover}, moonlight through ${moon.cloudCover[level]}`);
  });
});

test('Downpour and Hail are black (level 5); Heavy rainfall stays overcast', () => {
  const find = (/** @type {string} */ season, /** @type {string} */ name) => content.weather[season].weathers.find((w) => strings[w.name] === name);
  assert.equal(find('summer', 'Downpour')?.clouds, 5);
  assert.equal(find('spring', 'Hail')?.clouds, 5);
  assert.equal(find('winter', 'Hail')?.clouds, 5);
  assert.equal(find('spring', 'Heavy rainfall')?.clouds, 4);
  assert.equal(content.rules['weather-scales'].clouds.length, 6);
  // Black brings a dusk; nothing else does.
  assert.ok(cloudDusk(5) > 0);
  for (let level = 0; level < 5; level++) assert.equal(cloudDusk(level), 0);
});

test('skySpec: fog hides the sky, a named sky wins over the table, rain cloud in steady rain', () => {
  const fog = skySpec({ clouds: 4, precipitation: 1, season: 'autumn', cell: 3 }, 'autumn');
  assert.equal(fog.from, 'fog');
  assert.ok(fog.patterns.every((p) => CLOUD_PATTERNS[p].kind === 'fog'));
  assert.equal(fog.veil, 0);
  // Mist at clouds 0 hides it too.
  assert.equal(skySpec({ clouds: 0, season: 'spring', cell: 3 }, 'spring').from, 'fog');
  const named = skySpec({ clouds: 2, description: 'weather.spring.weathers.5.descriptions.1' }, 'spring');
  assert.equal(named.from, 'description');
  assert.ok(named.drift < 1, 'big, still clouds hardly move');
  assert.equal(skySpec({ clouds: 4, precipitation: 3 }, 'winter').from, 'wet');
  assert.equal(skySpec({ clouds: 4, precipitation: 0 }, 'winter').from, 'table');
  assert.deepEqual(skySpec({ clouds: 0 }, 'summer').patterns, []);
});

test('every pattern paints in every band, in its ramp\'s four tones, the same for the same seed', () => {
  for (const [id, p] of Object.entries(CLOUD_PATTERNS)) {
    assert.ok(RAMPS[p.ramp], `${id}: no ramp ${p.ramp}`);
    for (const band of /** @type {const} */ (['far', 'mid', 'near'])) {
      const a = p.paint(() => createRng(5).next(), band, 110);
      const r1 = createRng(9);
      const r2 = createRng(9);
      const g1 = p.paint(() => r1.next(), band, 110);
      const g2 = p.paint(() => r2.next(), band, 110);
      assert.deepEqual(g1, g2, `${id}: not repeatable`);
      assert.equal(g1.data.length, g1.w * g1.h);
      const filled = g1.data.filter((t) => t > 0).length;
      assert.ok(filled > 3, `${id} (${band}): nearly empty`);
      assert.ok(g1.data.every((t) => t <= 4));
      if (p.full) {
        assert.equal(g1.w, SKY_W, `${id}: a backdrop spans the painting`);
        if (p.open) {
          // A deck: mostly cloud, the sky showing here and there.
          assert.ok(filled > 0.7 * g1.w * g1.h && filled < g1.w * g1.h, `${id} (${band}): ${filled} of ${g1.w * g1.h} pixels cloud`);
        } else assert.equal(filled, g1.w * g1.h, `${id}: a backdrop hides the whole sky`);
      } else assert.ok(g1.w < SKY_W && g1.h < 80, `${id} (${band}): ${g1.w}×${g1.h}`);
      assert.ok(a.w > 0);
    }
  }
});

test('layOutSky fills about the cover asked, more clouds far off, a backdrop when overcast', () => {
  const r = createRng(3);
  const rand = () => r.next();
  /** @type {Map<string, any>} */
  const cache = new Map();
  const gridOf = (/** @type {string} */ id, /** @type {any} */ band, /** @type {number} */ v) => {
    const key = `${id}:${band}:${v}`;
    if (!cache.has(key)) cache.set(key, CLOUD_PATTERNS[id].paint(rand, band, 110));
    return cache.get(key);
  };
  const scattered = layOutSky(skySpec({ clouds: 2 }, 'summer'), rand, 110, gridOf);
  assert.equal(scattered.backdrop, null);
  assert.ok(scattered.clouds.length >= 3);
  for (const c of scattered.clouds) assert.ok(c.y + c.h <= 110, 'a cloud sits over the horizon');
  const few = layOutSky(skySpec({ clouds: 1 }, 'summer'), rand, 110, gridOf);
  const area = (/** @type {{ clouds: { w: number, h: number }[] }} */ sky) => sky.clouds.reduce((n, c) => n + c.w * c.h, 0);
  assert.ok(area(few) < area(scattered), 'a few fills less than scattered');
  const overcast = layOutSky(skySpec({ clouds: 4 }, 'winter'), rand, 110, gridOf);
  assert.ok(overcast.backdrop && CLOUD_PATTERNS[overcast.backdrop].full);
  assert.deepEqual(layOutSky(skySpec({ clouds: 0 }, 'winter'), rand, 110, gridOf), { backdrop: null, clouds: [] });
});

test('a dry overcast in spring and summer is a deck with sky showing; a rainy one the grey ceiling', () => {
  for (const season of ['spring', 'summer']) {
    const dry = skySpec({ clouds: 4, precipitation: 0 }, season);
    assert.equal(dry.from, 'table');
    assert.ok(dry.patterns.some((p) => CLOUD_PATTERNS[p].open), `${season}: no deck`);
    assert.equal(dry.veil, sky.open.veil, 'the deck hides the sun by its own pixels');
    const rainy = skySpec({ clouds: 4, precipitation: 2 }, season);
    assert.equal(rainy.from, 'rainy');
    assert.ok(rainy.patterns.every((p) => CLOUD_PATTERNS[p].kind === 'sheet'));
    assert.equal(rainy.veil, sky.levels[4].veil);
    assert.equal(skySpec({ clouds: 4, precipitation: 3 }, season).from, 'wet');
  }
  // No level mixes an open backdrop with a closed one: the veil would suit only one of them.
  for (const [id, season] of Object.entries(sky.seasons)) {
    season.levels.forEach((/** @type {string[]} */ patterns, level) => {
      const full = patterns.filter((p) => CLOUD_PATTERNS[p].full);
      assert.ok(full.every((p) => CLOUD_PATTERNS[p].open) || full.every((p) => !CLOUD_PATTERNS[p].open), `${id}, level ${level}`);
    });
  }
});
