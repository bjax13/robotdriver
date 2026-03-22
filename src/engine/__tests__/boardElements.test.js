import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import { dealHands, setProgram, activateRound } from '../activation.js';
import { CARD_TYPES } from '../cards.js';

describe('board elements', () => {
  it('robot on gear rotates', () => {
    const board = createBoard(5, 5);
    board.gears = { '2,2': 'R' };
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 0 }],
      antenna: { col: 0, row: 0 },
    });
    state = dealHands(state);
    state = setProgram(state, 'r1', [
      CARD_TYPES.TURN_RIGHT,
      CARD_TYPES.TURN_RIGHT,
      CARD_TYPES.TURN_RIGHT,
      CARD_TYPES.TURN_RIGHT,
      CARD_TYPES.TURN_RIGHT,
    ]);
    state = activateRound(state);
    expect(state.robots[0].col).toBe(2);
    expect(state.robots[0].row).toBe(2);
    expect(state.robots[0].direction).toBe(180);
  });

  it('robot on pit reboots', () => {
    const board = createBoard(5, 5);
    board.pits = { '3,2': true };
    board.rebootCol = 0;
    board.rebootRow = 0;
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2 }],
      antenna: { col: 0, row: 0 },
    });
    state = dealHands(state);
    state = setProgram(state, 'r1', [
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
    ]);
    state = activateRound(state);
    expect(state.robots[0].col).toBe(2);
    expect(state.robots[0].row).toBe(2);
    expect(state.robots[0].registers).toEqual([]);
  });

  it('conveyor moves robot', () => {
    const board = createBoard(5, 5);
    board.conveyors = { '2,2': { direction: 90, express: false } };
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2 }],
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
    state = activateRound(state);
    expect(state.robots[0].col).toBe(3);
    expect(state.robots[0].row).toBe(2);
  });

  it('checkpoint advances and winner is set', () => {
    const board = createBoard(6, 5);
    board.checkpoints = [{ col: 4, row: 2 }, { col: 5, row: 2 }];
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2 }],
      antenna: { col: 0, row: 0 },
    });
    state = dealHands(state);
    state = setProgram(state, 'r1', [
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
    ]);
    state = activateRound(state);
    expect(state.robots[0].nextCheckpoint).toBe(2);
    expect(state.winner).toBe('r1');
  });

  it('three checkpoints in order sets winner when all visited', () => {
    const board = createBoard(6, 5);
    board.checkpoints = [
      { col: 2, row: 2 },
      { col: 3, row: 2 },
      { col: 4, row: 2 },
    ];
    let state = createInitialState({
      board,
      robots: [{ col: 0, row: 2, direction: 90 }],
      antenna: { col: 0, row: 0 },
    });
    state = dealHands(state);
    state = setProgram(state, 'r1', [
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
    ]);
    state = activateRound(state);
    expect(state.robots[0].nextCheckpoint).toBe(3);
    expect(state.winner).toBe('r1');
  });
});
