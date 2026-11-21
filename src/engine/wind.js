// @ts-check
// The wind's direction (D176): a hexflower like the weather's maps, laid out
// as a compass. Where a cell sits on the flower is where the wind comes from;
// the outer ring is a steady wind, the inner ring the same direction
// unsettled, the centre a wind with no set direction. It drifts a cell at a
// time, so the wind veers and backs by 30° and never swings round at once;
// moves off the flower's edge stay put.
//
// The 2d6 table is even-handed; what makes the prevailing wind is each
// season's share of each direction, from the seasonal wind roses off Gdynia
// (content/rules/wind.json). A move towards a direction that blows less often
// is kept only on a d100 against the ratio of the two shares, so over a long
// run the wind blows from each direction as often as the season's rose says.
//
// Only the direction lives here: how strong the wind is stays the weather's
// (src/engine/weather.js).

import { content } from '../generated/content.js';
import { DIRECTIONS } from './hexmap.js';

/** @typedef {ReturnType<import('../dice.js').diceFor>} Dice */

/** The cell a new game starts in. */
export function windStart() {
  return content.rules.wind.start;
}

/**
 * The bearing the wind blows from, in degrees, or null when it has no set direction.
 * @param {number} cell
 * @returns {number | null}
 */
export function windFrom(cell) {
  return content.rules.wind.cells[cell]?.from ?? null;
}

/**
 * How settled the wind is: the outer ring steady, the inner unsettled, the centre variable.
 * @param {number} cell
 * @returns {'steady' | 'unsettled' | 'variable'}
 */
export function windKind(cell) {
  return cell === 0 ? 'variable' : cell <= 6 ? 'unsettled' : 'steady';
}

/**
 * How much of the time the wind sits in a cell, in a season: its direction's share, split evenly between the
 * cells that blow from it (an outer corner and the inner cell beside it), or the variable share for the centre.
 * @param {number} cell
 * @param {string} season
 */
export function windShare(cell, season) {
  const wind = content.rules.wind;
  const from = windFrom(cell);
  if (from === null) return wind.variable;
  const shares = wind.seasons[season] ?? Object.values(wind.seasons)[0];
  const cells = wind.cells.filter((/** @type {{ from: number | null }} */ c) => c.from === from).length;
  return shares[Math.round(from / 30) % 12] / cells;
}

/**
 * One half-hour step of drift.
 * @param {number} cell
 * @param {string} season  The season's rose decides which moves are kept.
 * @param {Dice} dice  The `wind` stream.
 * @returns {number}  The cell it moves to, or the same one.
 */
export function stepWind(cell, season, dice) {
  const wind = content.rules.wind;
  if (dice.roll12() > wind.changeOn) return cell;
  const way = wind.steps[dice.roll2d6() - 2];
  if (way === 'stay') return cell;
  const to = wind.cells[cell].changeSet[DIRECTIONS.indexOf(way)];
  if (to === cell) return cell;
  const ratio = windShare(to, season) / windShare(cell, season);
  return ratio >= 1 || dice.roll100() <= 100 * ratio ? to : cell;
}
