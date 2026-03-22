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

/**
 * Each non-rebooted robot fires forward; one entry per shooter that scores a hit.
 * @param {import('./types').Board} board
 * @param {import('./types').Robot[]} robots
 * @returns {{ shooterId: string, targetId: string }[]}
 */
export function listLaserHits(board, robots) {
  const hits = [];
  for (const robot of robots) {
    if (robot.rebooted) continue;
    const hit = raycast(board, robots, robot.col, robot.row, robot.direction, robot.id);
    if (hit) hits.push({ shooterId: robot.id, targetId: hit.id });
  }
  return hits;
}

/**
 * Cell centers along the beam from (col,row) through the first hit or edge, for rendering.
 * Path excludes the shooter cell; includes the struck cell when a robot is hit.
 * @returns {{ path: { col: number, row: number }[], hitRobotId: string | null }}
 */
export function traceLaserPath(board, robots, col, row, direction, excludeId) {
  const { dCol, dRow } = directionDelta(direction);
  const cellToRobot = new Map();
  for (const r of robots) {
    if (r.rebooted) continue;
    if (r.id === excludeId) continue;
    cellToRobot.set(`${r.col},${r.row}`, r);
  }

  /** @type { { col: number, row: number }[] } */
  const path = [];
  let c = col + dCol;
  let r = row + dRow;
  while (c >= 0 && c < board.width && r >= 0 && r < board.height) {
    if (hasWall(board, c - dCol, r - dRow, direction)) break;
    path.push({ col: c, row: r });
    const hit = cellToRobot.get(`${c},${r}`);
    if (hit) return { path, hitRobotId: hit.id };
    c += dCol;
    r += dRow;
  }
  return { path, hitRobotId: null };
}
