/**
 * Shared test builders for the engine (import from tests only; not a Jest suite).
 *
 * ## Testing stack (lowest layer first)
 *
 * 1. **Pure movement + board** — `movement.js`, `board.js`, `movementPassability.js`, `push.js`.
 *    Prefer adding new locomotion rules here with small boards and no full `GameState`.
 *
 * 2. **State reducers** — `gameState.js` `applyMove`, `boardElements.js`.
 *    Assert the full `robots` array when pushes or interactions matter.
 *
 * 3. **Activation** — `activation.js` `activateRegisterWithEvents`: priority order,
 *    `robot_action` events, then `board_resolve`. Use for register-level and phase flow.
 *
 * 4. **Cross-cutting invariants** — `__tests__/invariants.test.js`: after `applyMove` and
 *    after each `activateRegisterWithEvents` / full `activateRound`, assert no two active
 *    robots share a cell, every emitted `robot_action` names a robot still in state, and
 *    when `winner` is set the winner’s `nextCheckpoint` has cleared every flag. Use this to
 *    catch subtle corruption when wiring new board or activation behavior.
 *
 * When a rule branches on “other robots present” or per-robot traits, add **parity** tests
 * (solo vs multi-robot) like `__tests__/wallPath.test.js`.
 */

import { createBoard } from './board.js';
import { createInitialState } from './gameState.js';

/** @returns {import('./types').Board} */
export function emptyBoard5x5() {
  return createBoard(5, 5);
}

/**
 * Two robots far apart; common baseline for parity tests.
 * @param {Parameters<typeof createInitialState>[0]} [overrides]
 */
export function minimalTwoRobotState(overrides = {}) {
  return createInitialState({
    robots: [
      { col: 1, row: 2, direction: 90 },
      { col: 8, row: 8, direction: 0 },
    ],
    antenna: { col: 0, row: 0 },
    ...overrides,
  });
}

/** Wall on the east edge of (col, row), blocking step east from that cell. */
export function wallEastOf(col, row) {
  return [{ col, row, edge: 'E' }];
}
