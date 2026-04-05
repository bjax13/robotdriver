/**
 * Optional wall blocking for movement (power-ups, “break base”, etc.).
 * Default behavior matches board geometry via hasWall when passability is undefined.
 */

import { hasWall } from './board.js';

/**
 * @typedef {Object} MovementPassability
 * @property {(board: import('./types').Board, col: number, row: number, direction: number, robot: import('./types').Robot) => boolean} isWallBlocking
 *   Return true if movement from (col, row) in direction is blocked for this robot.
 */

/**
 * Whether the robot is blocked by a wall when leaving (col, row) toward direction.
 * @param {import('./types').Board} board
 * @param {number} col
 * @param {number} row
 * @param {number} direction
 * @param {import('./types').Robot} robot - robot whose traits apply (may differ from geometry robot when moving backward)
 * @param {MovementPassability|undefined} passability
 * @returns {boolean}
 */
export function wallBlocks(board, col, row, direction, robot, passability) {
  if (passability?.isWallBlocking) {
    return passability.isWallBlocking(board, col, row, direction, robot);
  }
  return hasWall(board, col, row, direction);
}

/**
 * Resolve passability from robot state. Extend here as power-ups are added.
 * @param {import('./types').Robot} robot
 * @returns {MovementPassability|undefined}
 */
export function getPassabilityForRobot(robot) {
  if (robot.wallPhasing && (robot.energy ?? 0) >= 1) {
    return {
      isWallBlocking: () => false,
    };
  }
  return undefined;
}
