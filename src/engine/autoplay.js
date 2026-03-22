/**
 * Goal-directed program selection from current hand (greedy by Manhattan distance).
 */

import { applyMove } from './gameState.js';
import { cardToAction } from './cards.js';
import { getUnlockedRegisterCount } from './activation.js';

/**
 * @param {import('./types').Robot} robot
 * @param {import('./types').Board} board
 * @returns {number}
 */
function manhattanToNextCheckpoint(robot, board) {
  const idx = robot.nextCheckpoint ?? 0;
  const cp = board.checkpoints?.[idx];
  if (!cp) return 0;
  return Math.abs(robot.col - cp.col) + Math.abs(robot.row - cp.row);
}

/**
 * @param {import('./types').GameState} state
 * @returns {import('./types').GameState}
 */
function shallowCloneState(state) {
  return {
    ...state,
    robots: state.robots.map((r) => ({ ...r })),
  };
}

/**
 * Apply one programming card for simulation (movement/turns only).
 * @param {import('./types').GameState} state
 * @param {string} robotId
 * @param {string} card
 * @returns {import('./types').GameState}
 */
function simApplyProgrammingCard(state, robotId, card) {
  const action = cardToAction(card);
  if (!action || action === 'powerUp' || action === 'again') {
    return shallowCloneState(state);
  }
  return applyMove(state, robotId, action);
}

/**
 * Pick cards for unlocked registers only (caller merges with setProgram).
 * @param {import('./types').GameState} state
 * @param {string} robotId
 * @param {() => number} rng
 * @returns {string[]}
 */
export function pickProgram(state, robotId, rng) {
  const robot = state.robots.find((r) => r.id === robotId);
  if (!robot || robot.rebooted) return [];

  const unlocked = getUnlockedRegisterCount(robot);
  if (unlocked === 0) return [];

  const hand = robot.hand || [];
  if (hand.length < unlocked) return [];

  const board = state.board;
  const picks = [];
  let workHand = [...hand];
  let workState = shallowCloneState(state);

  for (let s = 0; s < unlocked; s++) {
    let bestDist = Infinity;
    const bestIndices = [];
    for (let i = 0; i < workHand.length; i++) {
      const after = simApplyProgrammingCard(workState, robotId, workHand[i]);
      const r = after.robots.find((x) => x.id === robotId);
      const dist = r ? manhattanToNextCheckpoint(r, board) : Infinity;
      if (dist < bestDist) {
        bestDist = dist;
        bestIndices.length = 0;
        bestIndices.push(i);
      } else if (dist === bestDist) {
        bestIndices.push(i);
      }
    }
    const pickI = bestIndices[Math.floor(rng() * bestIndices.length)];
    const card = workHand[pickI];
    picks.push(card);
    workHand.splice(pickI, 1);
    workState = simApplyProgrammingCard(workState, robotId, card);
  }

  return picks;
}
