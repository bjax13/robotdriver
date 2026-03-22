/**
 * Laser raycast: robot and board lasers.
 * First robot in line gets hit; walls and antenna block.
 */

import { hasWall } from './board.js';
import { directionDelta } from './movement.js';

/**
 * Find first robot hit by a laser from (col, row) in direction.
 * @param {import('./types').Board} board
 * @param {import('./types').Robot[]} robots
 * @param {number} col
 * @param {number} row
 * @param {number} direction
 * @param {string} [excludeId] - shooter, don't hit self
 * @returns {import('./types').Robot | null}
 */
export function raycast(board, robots, col, row, direction, excludeId) {
  const { dCol, dRow } = directionDelta(direction);
  const cellToRobot = new Map();
  for (const r of robots) {
    if (r.rebooted) continue;
    if (r.id === excludeId) continue;
    cellToRobot.set(`${r.col},${r.row}`, r);
  }

  let c = col + dCol;
  let r = row + dRow;
  while (c >= 0 && c < board.width && r >= 0 && r < board.height) {
    if (hasWall(board, c - dCol, r - dRow, direction)) break;
    const hit = cellToRobot.get(`${c},${r}`);
    if (hit) return hit;
    c += dCol;
    r += dRow;
  }
  return null;
}
