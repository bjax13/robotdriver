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
 * @param {{ col: number, row: number } | null | undefined} [antenna] - blocks beam after this cell if no robot there (robot on antenna square is hit first)
 * @returns {import('./types').Robot | null}
 */
export function raycast(board, robots, col, row, direction, excludeId, antenna) {
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
    if (antenna != null && antenna.col === c && antenna.row === r) return null;
    c += dCol;
    r += dRow;
  }
  return null;
}

/**
 * Each non-rebooted robot fires forward; one entry per shooter that scores a hit.
 * @param {import('./types').Board} board
 * @param {import('./types').Robot[]} robots
 * @param {{ col: number, row: number } | null | undefined} [antenna]
 * @returns {{ shooterId: string, targetId: string }[]}
 */
export function listLaserHits(board, robots, antenna) {
  const hits = [];
  for (const robot of robots) {
    if (robot.rebooted) continue;
    if (robot.powerDownThisRound) continue;
    const hit = raycast(board, robots, robot.col, robot.row, robot.direction, robot.id, antenna);
    if (hit) hits.push({ shooterId: robot.id, targetId: hit.id });
  }
  return hits;
}

/**
 * Stable id for event log / dedupe (not a robot id).
 * @param {number} col
 * @param {number} row
 * @param {number} direction
 */
export function boardLaserShooterId(col, row, direction) {
  return `wall:${col},${row}:${direction}`;
}

/**
 * Wall-mounted beams: same geometry as a robot laser originating at (col,row) facing direction.
 * @param {import('./types').Board} board
 * @param {import('./types').Robot[]} robots
 * @param {{ col: number, row: number } | null | undefined} [antenna]
 * @returns {{ shooterId: string, targetId: string }[]}
 */
export function listBoardLaserHits(board, robots, antenna) {
  const emitters = board.boardLasers;
  if (!emitters?.length) return [];
  const hits = [];
  for (const em of emitters) {
    const hit = raycast(board, robots, em.col, em.row, em.direction, undefined, antenna);
    if (hit) {
      hits.push({
        shooterId: boardLaserShooterId(em.col, em.row, em.direction),
        targetId: hit.id,
      });
    }
  }
  return hits;
}

/**
 * Robot lasers then wall lasers (Robo Rally: factory beams in same laser step).
 * @param {import('./types').Board} board
 * @param {import('./types').Robot[]} robots
 * @param {{ col: number, row: number } | null | undefined} [antenna]
 */
export function listAllLaserHits(board, robots, antenna) {
  return [...listLaserHits(board, robots, antenna), ...listBoardLaserHits(board, robots, antenna)];
}

/**
 * Cell centers along the beam from (col,row) through the first hit or edge, for rendering.
 * Path excludes the shooter cell; includes the struck cell when a robot is hit.
 *
 * `stopReason`: `'wall'` / `'edge'` — beam stops in an empty cell before a wall or board edge (UI draws to the
 * far side of that cell). `'robot'` / `'antenna'` — stop at cell center. `'none'` — no beam cells (e.g. wall
 * flush with emitter).
 *
 * @param {{ col: number, row: number } | null | undefined} [antenna]
 * @returns {{ path: { col: number, row: number }[], hitRobotId: string | null, stopReason: 'robot'|'antenna'|'wall'|'edge'|'none' }}
 */
export function traceLaserPath(board, robots, col, row, direction, excludeId, antenna) {
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
    if (hasWall(board, c - dCol, r - dRow, direction)) {
      return { path, hitRobotId: null, stopReason: 'wall' };
    }
    path.push({ col: c, row: r });
    const hit = cellToRobot.get(`${c},${r}`);
    if (hit) return { path, hitRobotId: hit.id, stopReason: 'robot' };
    if (antenna != null && antenna.col === c && antenna.row === r) {
      return { path, hitRobotId: null, stopReason: 'antenna' };
    }
    c += dCol;
    r += dRow;
  }
  return {
    path,
    hitRobotId: null,
    stopReason: path.length === 0 ? 'none' : 'edge',
  };
}
