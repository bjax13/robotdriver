import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import { dealHands, setProgram, activateRound, activateRegister } from '../activation.js';
import { CARD_TYPES } from '../cards.js';
import { resolvePushPanels, resolveConveyors } from '../boardElements.js';

describe('board elements', () => {
  it('robot on right gear rotates clockwise each register', () => {
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

  it('robot on left gear rotates counterclockwise each register', () => {
    const board = createBoard(5, 5);
    board.gears = { '2,2': 'L' };
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 0 }],
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

  it('single express conveyor tile moves one space (end of that belt)', () => {
    const board = createBoard(6, 5);
    board.conveyors = { '1,2': { direction: 90, express: true } };
    let state = createInitialState({
      board,
      robots: [{ col: 1, row: 2 }],
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
    expect(state.robots[0].col).toBe(2);
    expect(state.robots[0].row).toBe(2);
  });

  it('two consecutive express tiles chain to two spaces along belt direction', () => {
    const board = createBoard(6, 5);
    board.conveyors = {
      '1,2': { direction: 90, express: true },
      '2,2': { direction: 90, express: true },
    };
    let state = createInitialState({
      board,
      robots: [{ col: 1, row: 2 }],
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

  it('resolvePushPanels fires only when register index matches panel registers', () => {
    const board = createBoard(5, 5);
    board.pushPanels = { '2,2': { registers: [2], direction: 90 } };
    const state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 0 }],
      antenna: { col: 0, row: 0 },
    });
    expect(resolvePushPanels(state, 0).size).toBe(0);
    const onReg2 = resolvePushPanels(state, 1);
    expect(onReg2.get('r1')).toEqual({ col: 3, row: 2 });
  });

  it('resolvePushPanels does not move when a wall blocks the push direction', () => {
    const board = createBoard(5, 5, [{ col: 2, row: 2, edge: 'E' }]);
    board.pushPanels = { '2,2': { registers: [1], direction: 90 } };
    const state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 0 }],
      antenna: { col: 0, row: 0 },
    });
    expect(resolvePushPanels(state, 0).size).toBe(0);
  });

  it('conveyor uses board walls only; wallPhasing does not bypass belt blockage', () => {
    const board = createBoard(6, 5, [{ col: 2, row: 2, edge: 'E' }]);
    board.conveyors = { '2,2': { direction: 90, express: false } };
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 0, energy: 2, wallPhasing: true }],
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
    const after = activateRegister(state, 0);
    expect(after.robots[0].col).toBe(2);
    expect(after.robots[0].row).toBe(2);
  });

  it('resolveConveyors also ignores wallPhasing (geometry-only walls)', () => {
    const board = createBoard(6, 5, [{ col: 2, row: 2, edge: 'E' }]);
    board.conveyors = { '2,2': { direction: 90, express: false } };
    const state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 0, energy: 2, wallPhasing: true }],
      antenna: { col: 0, row: 0 },
    });
    const cellToRobotId = new Map([['2,2', 'r1']]);
    const { updates } = resolveConveyors(state, cellToRobotId);
    expect(updates.size).toBe(0);
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
