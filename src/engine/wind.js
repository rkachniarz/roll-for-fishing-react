// @ts-check
// The wind's direction (D176): a hexflower like the weather's maps, laid out
// as a compass. Where a cell sits on the flower is where the wind comes from;
// the outer ring is a steady wind, the inner ring the same direction
// unsettled, the centre a wind with no set direction. It drifts a cell at a
// time, so the wind veers and backs by 30° and never swings round at once;
// moves off the flower's edge stay put. The bias of its 2d6 table makes the
// prevailing wind: Gdynia's, turned for our sea lying due east.
//
// Only the direction lives here: how strong the wind is stays the weather's
// (src/engine/weather.js). The map is content/rules/wind.json.

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
 * One half-hour step of drift.
 * @param {number} cell
 * @param {Dice} dice  The `wind` stream.
 * @returns {number}  The cell it moves to, or the same one.
 */
export function stepWind(cell, dice) {
  const wind = content.rules.wind;
  if (dice.roll12() > wind.changeOn) return cell;
  const way = wind.steps[dice.roll2d6() - 2];
  if (way === 'stay') return cell;
  return wind.cells[cell].changeSet[DIRECTIONS.indexOf(way)];
}
