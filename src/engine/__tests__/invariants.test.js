import { createBoard } from '../board.js';
import {
  activateRegisterWithEvents,
  activateRound,
  dealHands,
  setProgram,
} from '../activation.js';
import { CARD_TYPES } from '../cards.js';
import { applyMove, createInitialState, getOccupiedCells } from '../gameState.js';
import { minimalTwoRobotState } from '../testFixtures.js';

function collectPositions(robots) {
  return robots.filter((r) => !r.rebooted).map((r) => `${r.col},${r.row}`);
}

/** @param {{ robots: { col: number; row: number; rebooted?: boolean; id: string }[] }} state */
function assertUniqueOccupancy(state) {
  const keys = collectPositions(state.robots);
  expect(new Set(keys).size).toBe(keys.length);
}

/** @param {object[]} events */
function assertRobotActionsReferenceLiveRobots(events, state) {
  const ids = new Set(state.robots.map((r) => r.id));
  const actions = events.filter((e) => e.kind === 'robot_action');
  for (const e of actions) {
    expect(ids.has(e.robotId)).toBe(true);
  }
}

function assertWinnerMatchesCheckpointCompletion(state) {
  if (!state.winner || !state.board.checkpoints?.length) return;
  const w = state.robots.find((r) => r.id === state.winner);
  expect(w).toBeDefined();
  expect((w?.nextCheckpoint ?? 0) >= state.board.checkpoints.length).toBe(true);
}

function assertActivationInvariants(state, events) {
  assertUniqueOccupancy(state);
  assertRobotActionsReferenceLiveRobots(events, state);
  assertWinnerMatchesCheckpointCompletion(state);
}

describe('state invariants after applyMove', () => {
  it('keeps the same number of robots and unique occupied cells', () => {
    const state = minimalTwoRobotState();
    const next = applyMove(state, 'r1', 'move2');
    expect(next.robots).toHaveLength(state.robots.length);
    const keys = collectPositions(next.robots);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('solo and two-robot states preserve id set after the same move', () => {
    const board = createBoard(10, 10);
    const solo = createInitialState({
      board,
      robots: [{ col: 1, row: 2, direction: 90 }],
      antenna: { col: 0, row: 0 },
    });
    const duo = createInitialState({
      board,
      robots: [
        { col: 1, row: 2, direction: 90 },
        { col: 9, row: 9, direction: 0 },
      ],
      antenna: { col: 0, row: 0 },
    });

    const a = applyMove(solo, 'r1', 'move1');
    const b = applyMove(duo, 'r1', 'move1');

    expect(a.robots.map((r) => r.id).sort()).toEqual(['r1']);
    expect(b.robots.map((r) => r.id).sort()).toEqual(['r1', 'r2']);
    expect(collectPositions(a.robots).length).toBe(1);
    expect(collectPositions(b.robots).length).toBe(2);
  });

  it('getOccupiedCells matches robot positions for active robots', () => {
    const state = minimalTwoRobotState();
    const occ = getOccupiedCells(state.robots);
    expect(occ.has('1,2')).toBe(true);
    expect(occ.has('8,8')).toBe(true);
    expect(occ.size).toBe(2);
  });
});

describe('state invariants after activateRegisterWithEvents / activateRound', () => {
  it('maintains occupancy, valid robot_action ids, and winner/checkpoint consistency after one register', () => {
    const board = createBoard(
      8,
      5,
      [],
      [{ col: 7, row: 2, direction: 270 }]
    );
    board.conveyors = {
      '1,2': { direction: 90, express: true },
      '2,2': { direction: 90, express: true },
    };
    board.checkpoints = [{ col: 3, row: 2 }];
    let state = createInitialState({
      board,
      robots: [
        { col: 1, row: 2, direction: 90 },
        { col: 5, row: 2, direction: 180 },
      ],
      antenna: { col: 0, row: 0 },
    });
    state = {
      ...state,
      robots: state.robots.map((r) => ({
        ...r,
        registers: Array(5).fill(CARD_TYPES.POWER_UP),
        hand: [],
      })),
    };
    const { state: after, events } = activateRegisterWithEvents(state, 0);
    assertActivationInvariants(after, events);
  });

  it('maintains invariants across a full round with conveyors, merge contention, laser damage, and checkpoint win', () => {
    const board = createBoard(10, 5);
    board.conveyors = {
      '2,2': { direction: 90, express: true },
      '1,2': { direction: 90, express: true },
      '8,2': { direction: 90, express: false },
    };
    board.checkpoints = [{ col: 4, row: 2 }];
    board.boardLasers = [{ col: 9, row: 2, direction: 270 }];
    let state = createInitialState({
      board,
      robots: [
        { col: 2, row: 2 },
        { col: 1, row: 2 },
        { col: 8, row: 2 },
      ],
      antenna: { col: 0, row: 0 },
    });
    state = dealHands(state);
    state = setProgram(state, 'r1', [
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.TURN_LEFT,
    ]);
    state = setProgram(state, 'r2', [
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.TURN_LEFT,
    ]);
    state = setProgram(state, 'r3', [
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
    ]);
    const after = activateRound(state);
    assertUniqueOccupancy(after);
    assertWinnerMatchesCheckpointCompletion(after);
  });
});

describe('activation invariants under stress', () => {
  it('holds occupancy, robot_action ids, and winner/checkpoint linkage per register', () => {
    const board = createBoard(8, 5);
    board.gears = { '2,3': 'R' };
    board.checkpoints = [{ col: 5, row: 2 }];
    board.conveyors = { '3,2': { direction: 90, express: false } };
    let state = createInitialState({
      board,
      robots: [
        { col: 2, row: 2, direction: 90 },
        { col: 6, row: 4, direction: 0 },
      ],
      antenna: { col: 0, row: 0 },
    });
    state = dealHands(state);
    state = setProgram(state, 'r1', [
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.TURN_RIGHT,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
    ]);
    state = setProgram(state, 'r2', [
      CARD_TYPES.POWER_UP,
      CARD_TYPES.POWER_UP,
      CARD_TYPES.POWER_UP,
      CARD_TYPES.POWER_UP,
      CARD_TYPES.POWER_UP,
    ]);

    for (let reg = 0; reg < 5; reg++) {
      const { state: next, events } = activateRegisterWithEvents(state, reg);
      assertActivationInvariants(next, events);
      state = next;
    }
  });

  it('survives a full round with pits, reboot, conveyors, and checkpoints', () => {
    const board = createBoard(8, 5);
    board.pits = { '7,3': true };
    board.rebootCol = 0;
    board.rebootRow = 0;
    board.checkpoints = [
      { col: 3, row: 2 },
      { col: 6, row: 2 },
    ];
    board.conveyors = {
      '2,2': { direction: 90, express: true },
      '3,2': { direction: 90, express: false },
    };
    let state = createInitialState({
      board,
      robots: [
        { col: 1, row: 2, direction: 90 },
        { col: 5, row: 2, direction: 180 },
      ],
      antenna: { col: 0, row: 0 },
    });
    state = dealHands(state);
    state = setProgram(state, 'r1', [
      CARD_TYPES.MOVE3,
      CARD_TYPES.MOVE2,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
    ]);
    state = setProgram(state, 'r2', [
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.MOVE2,
      CARD_TYPES.MOVE1,
    ]);

    state = activateRound(state);
    assertUniqueOccupancy(state);
    assertWinnerMatchesCheckpointCompletion(state);
  });
});
