/**
 * Push resolution: when a robot moves into an occupied cell, push the chain.
 * Chain pushes one space each; wall or off-board stops entire push.
 */

import { inBounds } from './board.js';
import { directionDelta } from './movement.js';
import { getPassabilityForRobot, wallBlocks } from './movementPassability.js';

/**
 * Build chain of robots from (startCol, startRow) going in direction.
 * @param {Map<string, import('./types').Robot>} cellToRobot - "col,row" -> robot
 * @param {number} startCol
 * @param {number} startRow
 * @param {number} direction
 * @returns {import('./types').Robot[]}
 */
export function getPushChain(cellToRobot, startCol, startRow, direction) {
  const chain = [];
  const { dCol, dRow } = directionDelta(direction);
  let c = startCol;
  let r = startRow;
  while (true) {
    const key = `${c},${r}`;
    const robot = cellToRobot.get(key);
    if (!robot) break;
    chain.push(robot);
    c += dCol;
    r += dRow;
  }
  return chain;
}

/**
 * Check if the front of the chain can move (no wall, in bounds).
 * @param {import('./types').Board} board
 * @param {import('./types').Robot[]} chain
 * @param {number} direction
 * @param {(robot: import('./types').Robot) => Object|undefined} [resolvePassability] - returns MovementPassability or undefined; default getPassabilityForRobot
 * @returns {{ canPush: boolean, frontCol?: number, frontRow?: number }}
 */
export function canPushChain(board, chain, direction, resolvePassability = getPassabilityForRobot) {
  if (chain.length === 0) return { canPush: true };
  const { dCol, dRow } = directionDelta(direction);
  const front = chain[chain.length - 1];
  const frontCol = front.col + dCol;
  const frontRow = front.row + dRow;
  if (!inBounds(board, frontCol, frontRow)) return { canPush: false };
  const pass = resolvePassability(front);
  if (wallBlocks(board, front.col, front.row, direction, front, pass)) return { canPush: false };
  return { canPush: true, frontCol, frontRow };
}

/**
 * Execute push: move chain one space. Caller must have verified canPushChain.
 * Returns new positions for all robots in chain. Pusher's new position is chain[0].oldPos.
 * @param {import('./types').Robot[]} chain
 * @param {number} direction
 * @returns {Map<string, { col: number, row: number, direction: number }>} robotId -> new position
 */
export function applyPush(chain, direction) {
  const { dCol, dRow } = directionDelta(direction);
  const updates = new Map();
  for (let i = chain.length - 1; i >= 0; i--) {
    const robot = chain[i];
    const newCol = robot.col + dCol;
    const newRow = robot.row + dRow;
    updates.set(robot.id, { col: newCol, row: newRow, direction: robot.direction });
  }
  return updates;
}
