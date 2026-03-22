/**
 * Movement: step forward/backward, turns.
 * Supports pushing: moving into occupied cell pushes chain; wall/OOB stops all.
 */

import { inBounds, hasWall, isConveyor } from './board.js';
import { getPushChain, canPushChain, applyPush } from './push.js';

/**
 * Get (col, row) delta for one step in the given direction.
 * @param {number} direction - 0=N, 90=E, 180=S, 270=W
 * @returns {{ dCol: number, dRow: number }}
 */
export function directionDelta(direction) {
  const map = {
    0: { dCol: 0, dRow: -1 },
    90: { dCol: 1, dRow: 0 },
    180: { dCol: 0, dRow: 1 },
    270: { dCol: -1, dRow: 0 },
  };
  return map[direction];
}

/**
 * Build cell -> robot map from robots, applying any updates.
 * @param {import('./types').Robot[]} robots
 * @param {Map<string, { col: number, row: number, direction: number }>} updates
 * @returns {Map<string, import('./types').Robot>}
 */
function cellToRobotMapWithUpdates(robots, updates) {
  const map = new Map();
  for (const r of robots) {
    if (r.rebooted) continue;
    const pos = updates.get(r.id) || { col: r.col, row: r.row };
    map.set(`${pos.col},${pos.row}`, { ...r, ...pos });
  }
  return map;
}

/**
 * Execute forward movement for a robot. Supports pushing.
 * When moving into occupied cell: push chain. Wall or OOB in chain path stops entire move.
 * Conveyor→occupied non-conveyor: no push, stop on conveyor (per rules).
 * @param {import('./types').Board} board
 * @param {import('./types').Robot} robot
 * @param {import('./types').Robot[]} allRobots
 * @param {number} steps - 1, 2, or 3
 * @returns {{ updates: Map<string, { col: number, row: number, direction: number }> }}
 */
export function stepForwardWithPush(board, robot, allRobots, steps) {
  const updates = new Map();
  let col = robot.col;
  let row = robot.row;
  const { direction } = robot;
  const { dCol, dRow } = directionDelta(direction);

  for (let s = 0; s < steps; s++) {
    if (hasWall(board, col, row, direction)) break;
    const nextCol = col + dCol;
    const nextRow = row + dRow;
    if (!inBounds(board, nextCol, nextRow)) break;

    const nextKey = `${nextCol},${nextRow}`;
    const cellMap = cellToRobotMapWithUpdates(allRobots, updates);
    const occupant = cellMap.get(nextKey);

    if (occupant) {
      if (isConveyor(board, col, row) && !isConveyor(board, nextCol, nextRow)) {
        break;
      }
      const chain = getPushChain(cellMap, nextCol, nextRow, direction);
      const { canPush } = canPushChain(board, chain, direction);
      if (!canPush) break;
      const pushUpdates = applyPush(chain, direction);
      for (const [id, pos] of pushUpdates) {
        updates.set(id, pos);
      }
      col = nextCol;
      row = nextRow;
    } else {
      col = nextCol;
      row = nextRow;
    }
    updates.set(robot.id, { col, row, direction });
  }

  return { updates };
}

/**
 * Execute forward movement for a robot. Stops at walls or out-of-bounds.
 * Does not handle pushing (occupied cells block).
 * @param {import('./types').Board} board
 * @param {import('./types').Robot} robot
 * @param {Set<string>} occupied - Set of "col,row" for cells occupied by other robots
 * @param {number} steps - 1, 2, or 3
 * @returns {{ col: number, row: number, direction: number }}
 */
export function stepForward(board, robot, occupied, steps) {
  let { col, row, direction } = robot;
  const { dCol, dRow } = directionDelta(direction);

  for (let i = 0; i < steps; i++) {
    if (hasWall(board, col, row, direction)) break;
    const nextCol = col + dCol;
    const nextRow = row + dRow;
    if (!inBounds(board, nextCol, nextRow)) break;
    const nextKey = `${nextCol},${nextRow}`;
    if (occupied.has(nextKey)) break;
    col = nextCol;
    row = nextRow;
  }

  return { col, row, direction };
}

/**
 * Execute backward movement (one space).
 * Robot keeps its facing; only position changes.
 * @param {import('./types').Board} board
 * @param {import('./types').Robot} robot
 * @param {Set<string>} occupied
 * @returns {{ col: number, row: number, direction: number }}
 */
export function stepBackward(board, robot, occupied) {
  const oppositeDir = (robot.direction + 180) % 360;
  const virtual = { ...robot, direction: oppositeDir };
  const result = stepForward(board, virtual, occupied, 1);
  return { ...result, direction: robot.direction };
}

/**
 * @param {number} direction
 * @param {'left'|'right'|'uturn'} turn
 * @returns {number}
 */
export function turn(direction, turn) {
  if (turn === 'left') return (direction - 90 + 360) % 360;
  if (turn === 'right') return (direction + 90) % 360;
  if (turn === 'uturn') return (direction + 180) % 360;
  return direction;
}
