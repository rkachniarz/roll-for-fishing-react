// @ts-check
// Champions: class fish (D114, the owner's idea). Now and then, in place of a
// surface feature, a large fish from the spot's own table comes up with a
// class: a Witch, a Knight, a Shaman, a Rogue or a Cleric. It stays on its
// spot until it is caught, and while it lives, every cast there feels it:
//
//   witch   casts a spell on the water, a new one every 15-20 casts
//   knight  half the time, comes to a fish's aid: advantage on its roll
//   shaman  calls up wild weather from any season, now and again
//   rogue   steals what comes up (not junk) and carries it; slips away after
//           every cast, and is harder to catch
//   cleric  every fish's roll is higher
//
// Their numbers are in content/rules/champions.json. Effects are game values,
// as items' are (values.js); a champion's are on the cast only at its own spot.
// Caught, it goes into the bucket like any fish, worth more; let go, it is an
// ordinary fish in the pool.
//
// Everything here draws from the `champions` stream (D4), so a game without
// champions draws nothing from it.

import { content } from '../generated/content.js';
import { locationTable, pick } from './tables.js';
import { rollFish, sizeBands } from './fish.js';
import { weatherAt } from './weather.js';

/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */
/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {import('./state.js').PoolFish} PoolFish */

/**
 * @typedef {Object} Champion  One on the water at its spot.
 * @property {string} class     A class id from rules/champions.json.
 * @property {PoolFish} fish    Rolled when it appeared; `champion` set to its class.
 * @property {number} x
 * @property {number} y
 * @property {number} born      The cast it appeared after.
 * @property {string} [spell]   A witch's spell now.
 * @property {number} [spellLeft]  Casts until the witch casts another.
 * @property {number} [weatherLeft]  Casts until the shaman calls up the weather again.
 * @property {string[]} [stolen]  What a rogue has stolen, item ids: the player's when it's caught.
 */

/** The rules. */
export function championRules() {
  return content.rules.champions;
}

/** @param {string} id */
export function championClass(id) {
  return championRules().classes.find((/** @type {{ id: string }} */ c) => c.id === id);
}

/**
 * The key for where the player is: a location, or location/spot. The escaped
 * pools (R3.6) and the champions are kept per spot.
 * @param {{ location: string, spot: string | null }} state
 */
export function poolKey(state) {
  return state.spot ? `${state.location}/${state.spot}` : state.location;
}

/**
 * The champions on the water where the player is.
 * @param {GameState} state
 * @returns {Champion[]}
 */
export function championsHere(state) {
  return state.champions?.[poolKey(state)] ?? [];
}

/**
 * Their effects on a cast here: each class's own, and a witch's spell.
 * @param {GameState} state
 * @returns {import('./values.js').Source[]}
 */
export function championSources(state) {
  return championsHere(state).flatMap((c) => {
    const def = championClass(c.class);
    const spell = c.spell ? def.spells.find((/** @type {{ id: string }} */ s) => s.id === c.spell) : null;
    return [
      ...(def.effects?.length ? [{ label: c.class, effects: def.effects }] : []),
      ...(spell ? [{ label: spell.id, effects: spell.effects }] : []),
    ];
  });
}

/**
 * The champion a cast landed by, if any: the nearest within the radius.
 * @param {Champion[]} champions
 * @param {{ x: number, y: number } | null} landing
 * @returns {Champion | null}
 */
export function championAt(champions, landing) {
  if (!landing) return null;
  const radius = championRules().radius;
  let best = null;
  let bestDistance = Infinity;
  for (const c of champions) {
    const d = Math.hypot(c.x - landing.x, c.y - landing.y);
    if (d <= radius && d < bestDistance) {
      best = c;
      bestDistance = d;
    }
  }
  return best;
}

/**
 * A surface feature is about to appear: a champion may come up in its place.
 * Changes `state` (a copy the caller owns).
 * @param {GameState} state
 * @param {Dice} dice  The `champions` stream.
 * @param {{ x0: number, y0: number, x1: number, y1: number }} water
 * @param {{ only?: string }} [options]  only: this class, for certain (the ?dev bench).
 * @returns {import('./game.js').GameEvent[]}  Empty if none did.
 */
export function maybeChampion(state, dice, water, { only } = {}) {
  const rules = championRules();
  const here = championsHere(state);
  if (here.length >= rules.max || (!only && dice.roll100() > rules.chance)) return [];
  const free = rules.classes.filter((/** @type {{ id: string }} */ c) => (!only || c.id === only) && !here.some((h) => h.class === c.id));
  if (!free.length) return [];
  const def = free[dice.getRandomNumber(0, free.length - 1)];
  const species = pick(
    locationTable({ location: state.location, spot: state.spot }, 'fish').filter((e) => e.id),
    dice,
  );
  if (!species?.id) return [];
  const minBand = sizeBands().findIndex((/** @type {{ id: string }} */ b) => b.id === rules.minBand);
  const rolled = rollFish(species.id, { fishSizeBand: 0, fishDifficulty: 0, fishXp: 0 }, dice, { minBand });
  /** @type {Champion} */
  const champion = {
    class: def.id,
    fish: { ...rolled, xp: rolled.xp * rules.xpFactor, champion: def.id },
    x: dice.getRandomNumber(water.x0, water.x1),
    y: dice.getRandomNumber(water.y0, water.y1),
    born: state.book.casts,
  };
  if (def.spells) castSpell(champion, def, dice);
  // The shaman calls up its first weather straight away (updateChampions).
  if (def.weathers) champion.weatherLeft = 0;
  if (def.moves) champion.stolen = [];
  const key = poolKey(state);
  state.champions = { ...state.champions, [key]: [...here, champion] };
  /** @type {import('./game.js').GameEvent[]} */
  const events = [{ type: 'champion-appeared', fish: champion.fish }];
  if (champion.spell) events.push({ type: 'champion-spell', fish: champion.fish, spell: champion.spell });
  return events;
}

/**
 * A witch's next spell: a different one from the last, for 15-20 casts.
 * @param {Champion} champion
 * @param {any} def
 * @param {Dice} dice
 */
function castSpell(champion, def, dice) {
  const others = def.spells.filter((/** @type {{ id: string }} */ s) => s.id !== champion.spell);
  champion.spell = others[dice.getRandomNumber(0, others.length - 1)].id;
  champion.spellLeft = dice.getRandomNumber(def.spellCasts.min, def.spellCasts.max);
}

/**
 * After every cast at a spot, its champions act: the witch's spell runs down
 * and she casts another, the shaman calls up the weather, the rogue slips
 * away. Champions elsewhere wait for the player to come back. Changes `state`.
 * @param {GameState} state
 * @param {Dice} dice  The `champions` stream.
 * @param {{ x0: number, y0: number, x1: number, y1: number }} water
 * @param {{ moveOnly?: boolean }} [options]  moveOnly: a cast pulled out before
 *   the bite (D85): the rogue still slips away, nothing else counts it.
 * @returns {import('./game.js').GameEvent[]}
 */
export function updateChampions(state, dice, water, { moveOnly = false } = {}) {
  /** @type {import('./game.js').GameEvent[]} */
  const events = [];
  for (const c of championsHere(state)) {
    const def = championClass(c.class);
    if (def.moves && c.born !== state.book.casts) {
      c.x = dice.getRandomNumber(water.x0, water.x1);
      c.y = dice.getRandomNumber(water.y0, water.y1);
    }
    if (moveOnly) continue;
    if (def.spells && c.born !== state.book.casts) {
      c.spellLeft = (c.spellLeft ?? 1) - 1;
      if (c.spellLeft <= 0) {
        castSpell(c, def, dice);
        events.push({ type: 'champion-spell', fish: c.fish, spell: c.spell });
      }
    }
    if (def.weathers) {
      if ((c.weatherLeft ?? 0) <= 0) {
        const pickW = def.weathers[dice.getRandomNumber(0, def.weathers.length - 1)];
        state.weather = weatherAt(pickW.season, pickW.cell, dice);
        c.weatherLeft = dice.getRandomNumber(def.weatherCasts.min, def.weatherCasts.max);
        events.push({ type: 'champion-weather', fish: c.fish, weather: state.weather });
      } else c.weatherLeft--;
    }
  }
  return events;
}

/**
 * A champion caught: off the water. Changes `state`.
 * @param {GameState} state
 * @param {Champion} champion
 */
export function removeChampion(state, champion) {
  const key = poolKey(state);
  const left = (state.champions[key] ?? []).filter((c) => c !== champion);
  const champions = { ...state.champions };
  if (left.length) champions[key] = left;
  else delete champions[key];
  state.champions = champions;
}

/**
 * The champion a cast went out to, if it's still there.
 * @param {GameState} state
 * @param {{ class: string, born: number } | null | undefined} ref
 */
export function findChampion(state, ref) {
  if (!ref) return null;
  return championsHere(state).find((c) => c.class === ref.class && c.born === ref.born) ?? null;
}

/**
 * The champions here as debuffs for the buff bar: they can't be cancelled,
 * and a witch's spell shows its casts left.
 * @param {GameState} state
 * @returns {(import('./state.js').Buff & { label: string[] })[]}
 */
export function championDebuffs(state) {
  return championsHere(state).map((c) => {
    const def = championClass(c.class);
    const spell = c.spell ? def.spells.find((/** @type {{ id: string }} */ s) => s.id === c.spell) : null;
    return {
      id: `champion-${c.class}`,
      source: c.class,
      debuff: true,
      effects: [...(def.effects ?? []), ...(spell?.effects ?? [])],
      ...(spell ? { casts: c.spellLeft } : {}),
      // String keys: the class, then the spell or what it does.
      label: [def.name, ...(spell ? [spell.name] : def.note ? [def.note] : [])],
    };
  });
}
