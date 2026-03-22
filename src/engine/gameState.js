/**
 * Game state and reducers for Phases 1-3.
 * Provides applyMove for robot movement; supports pushing when multiple robots.
 */

import { createBoard } from './board.js';
import { createDeck } from './deck.js';
import { stepForward, stepBackward, stepForwardWithPush, turn } from './movement.js';

/**
 * Build set of occupied cells from robots, excluding given robotId.
 * @param {import('./types').Robot[]} robots
 * @param {string} [excludeId]
 * @returns {Set<string>}
 */
export function getOccupiedCells(robots, excludeId) {
  const set = new Set();
  for (const r of robots) {
    if (r.id !== excludeId && !r.rebooted) set.add(`${r.col},${r.row}`);
  }
  return set;
}

/**
 * @param {import('./types').GameState} state
 * @param {string} robotId
 * @param {'move1'|'move2'|'move3'|'back'|'turnLeft'|'turnRight'|'uturn'} action
 * @returns {import('./types').GameState}
 */
export function applyMove(state, robotId, action) {
  const robot = state.robots.find((r) => r.id === robotId);
  if (!robot) return state;

  const activeRobots = state.robots.filter((r) => !r.rebooted);
  const occupied = getOccupiedCells(activeRobots, robotId);

  if (action === 'move1' || action === 'move2' || action === 'move3') {
    const steps = parseInt(action.replace('move', ''), 10);
    const hasOthers = activeRobots.some((r) => r.id !== robotId);
    if (hasOthers) {
      const { updates } = stepForwardWithPush(state.board, robot, activeRobots, steps);
      const robots = state.robots.map((r) => {
        const u = updates.get(r.id);
        return u ? { ...r, ...u } : r;
      });
      return { ...state, robots };
    }
  }

  let next;
  if (action === 'move1' || action === 'move2' || action === 'move3') {
    const steps = parseInt(action.replace('move', ''), 10);
    next = stepForward(state.board, robot, occupied, steps);
  } else if (action === 'back') {
    const hasOthers = activeRobots.some((r) => r.id !== robotId);
    if (hasOthers) {
      const oppositeDir = (robot.direction + 180) % 360;
      const virtual = { ...robot, direction: oppositeDir };
      const { updates } = stepForwardWithPush(state.board, virtual, activeRobots, 1);
      const robots = state.robots.map((r) => {
        const u = updates.get(r.id);
        if (u && r.id === robotId) return { ...r, ...u, direction: robot.direction };
        return u ? { ...r, ...u } : r;
      });
      return { ...state, robots };
    }
    next = stepBackward(state.board, robot, occupied);
  } else if (action === 'turnLeft') {
    next = { ...robot, direction: turn(robot.direction, 'left') };
  } else if (action === 'turnRight') {
    next = { ...robot, direction: turn(robot.direction, 'right') };
  } else if (action === 'uturn') {
    next = { ...robot, direction: turn(robot.direction, 'uturn') };
  } else {
    return state;
  }

  const robots = state.robots.map((r) =>
    r.id === robotId ? { ...r, ...next } : r
  );
  return { ...state, robots };
}

/**
 * Create initial game state with robots that have decks.
 * @param {Object} options
 * @param {number} [options.width=10]
 * @param {number} [options.height=10]
 * @param {{ col: number, row: number }} [options.antenna]
 * @param {{ col: number, row: number, direction?: number }[]} [options.robots]
 * @returns {import('./types').GameState}
 */
export function createInitialState(options = {}) {
  const width = options.width ?? 10;
  const height = options.height ?? 10;
  const board = options.board ?? createBoard(width, height, options.walls || []);
  const antenna = options.antenna ?? { col: 0, row: 0 };
  const robotSpecs = options.robots ?? [{ col: 0, row: 0, direction: 90 }];

  const robots = robotSpecs.map((spec, i) => ({
    id: `r${i + 1}`,
    col: spec.col,
    row: spec.row,
    direction: spec.direction ?? 90,
    nextCheckpoint: 0,
    deck: createDeck(),
    discard: [],
    hand: [],
    registers: [],
    energy: 0,
  }));

  return {
    board,
    robots,
    antenna,
    antennaDirection: options.antennaDirection ?? 90,
    phase: 'programming',
  };
}
