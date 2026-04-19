import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import { dealHands, setProgram, activateRound, activateRegister } from '../activation.js';
import { CARD_TYPES } from '../cards.js';
import { resolvePushPanels, resolveConveyors, resolveGears } from '../boardElements.js';
import { runBoardElementStep } from '../postRegisterBoard.js';

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

  it('resolveGears applies +90° for R (clockwise) gear', () => {
    const board = createBoard(5, 5);
    board.gears = { '3,3': 'R' };
    const state = createInitialState({
      board,
      robots: [{ col: 3, row: 3, direction: 180 }],
      antenna: { col: 0, row: 0 },
    });
    const updates = resolveGears(state);
    expect(updates.get('r1')).toEqual({ direction: 270 });
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

  it('express belts resolve before normal belts in the same conveyor step', () => {
    const board = createBoard(10, 5);
    board.conveyors = {
      '1,2': { direction: 90, express: true },
      '2,2': { direction: 90, express: true },
      '8,2': { direction: 90, express: false },
    };
    let state = createInitialState({
      board,
      robots: [
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
    state = activateRegister(state, 0);
    expect(state.robots[0].col).toBe(3);
    expect(state.robots[0].row).toBe(2);
    expect(state.robots[1].col).toBe(9);
    expect(state.robots[1].row).toBe(2);
  });

  it('two express starters: iteration order decides who captures the merge tile first', () => {
    const board = createBoard(8, 5);
    board.conveyors = {
      '2,2': { direction: 90, express: true },
      '1,2': { direction: 90, express: true },
    };
    let state = createInitialState({
      board,
      robots: [
        { col: 2, row: 2 },
        { col: 1, row: 2 },
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
    state = activateRegister(state, 0);
    expect(state.robots.find((r) => r.id === 'r1')?.col).toBe(3);
    expect(state.robots.find((r) => r.id === 'r2')?.col).toBe(2);
  });

  it('three consecutive express tiles chain three spaces along belt direction', () => {
    const board = createBoard(8, 5);
    board.conveyors = {
      '1,2': { direction: 90, express: true },
      '2,2': { direction: 90, express: true },
      '3,2': { direction: 90, express: true },
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
    expect(state.robots[0].col).toBe(4);
    expect(state.robots[0].row).toBe(2);
  });

  it('express merge: first resolved robot claims the tile; second express toward same cell stops', () => {
    const board = createBoard(6, 5);
    board.conveyors = {
      '2,2': { direction: 90, express: true },
      '4,2': { direction: 270, express: true },
    };
    let state = createInitialState({
      board,
      robots: [
        { col: 2, row: 2, direction: 0 },
        { col: 4, row: 2, direction: 0 },
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
    state = activateRegister(state, 0);
    expect(state.robots[0].col).toBe(3);
    expect(state.robots[0].row).toBe(2);
    expect(state.robots[1].col).toBe(4);
    expect(state.robots[1].row).toBe(2);
  });

  it('express resolves before normal: express robot claims merge cell so normal belt cannot enter it', () => {
    const board = createBoard(8, 5);
    board.conveyors = {
      '1,2': { direction: 90, express: true },
      '3,2': { direction: 270, express: false },
    };
    let state = createInitialState({
      board,
      robots: [
        { col: 1, row: 2, direction: 0 },
        { col: 3, row: 2, direction: 0 },
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
    state = activateRegister(state, 0);
    expect(state.robots[0].col).toBe(2);
    expect(state.robots[0].row).toBe(2);
    expect(state.robots[1].col).toBe(3);
    expect(state.robots[1].row).toBe(2);
  });

  it('post-register order: conveyors run before push panels on the same register', () => {
    const board = createBoard(8, 5);
    board.conveyors = { '2,2': { direction: 90, express: false } };
    board.pushPanels = { '3,2': { registers: [1], direction: 90 } };
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
    state = {
      ...state,
      robots: state.robots.map((r) => ({
        ...r,
        deck: [],
        discard: [],
        hand: [],
      })),
    };
    state = activateRegister(state, 0);
    expect(state.robots[0].col).toBe(4);
    expect(state.robots[0].row).toBe(2);
  });

  describe('conveyor depth — multi-tile express, merge conflicts, express vs normal order', () => {
    /**
     * Express chains must follow each tile's arrow (merge / corner tiles), not only straight runs.
     */
    it('express chain follows corners: three express tiles east then south lands two steps past the bend', () => {
      const board = createBoard(8, 8);
      board.conveyors = {
        '1,3': { direction: 90, express: true },
        '2,3': { direction: 180, express: true },
        '2,4': { direction: 90, express: true },
      };
      let state = createInitialState({
        board,
        robots: [{ col: 1, row: 3 }],
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
      expect(state.robots[0].row).toBe(4);
    });

    it('four consecutive straight express tiles move four cells in belt direction', () => {
      const board = createBoard(10, 5);
      board.conveyors = {
        '0,2': { direction: 90, express: true },
        '1,2': { direction: 90, express: true },
        '2,2': { direction: 90, express: true },
        '3,2': { direction: 90, express: true },
      };
      let state = createInitialState({
        board,
        robots: [{ col: 0, row: 2 }],
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
      expect(state.robots[0].col).toBe(4);
      expect(state.robots[0].row).toBe(2);
    });

    /**
     * Merge conflict: two express belts feed one cell. Implementation resolves express robots in
     * `Object.entries(board.conveyors)` insertion order; first mover claims the merge tile.
     */
    it('two express robots racing into one merge tile: earlier conveyor entry wins (r1 before r2)', () => {
      const board = createBoard(8, 8);
      board.conveyors = {
        '1,2': { direction: 90, express: true },
        '2,3': { direction: 0, express: true },
      };
      const state = createInitialState({
        board,
        robots: [
          { col: 1, row: 2 },
          { col: 2, row: 3 },
        ],
        antenna: { col: 0, row: 0 },
      });
      const cellToRobotId = new Map([
        ['1,2', 'r1'],
        ['2,3', 'r2'],
      ]);
      const { updates } = resolveConveyors(state, cellToRobotId);
      expect(updates.get('r1')).toEqual({ col: 2, row: 2 });
      expect(updates.get('r2')).toBeUndefined();
    });

    it('same merge conflict with conveyor map order swapped: second-listed belt reaches merge first', () => {
      const board = createBoard(8, 8);
      board.conveyors = {
        '2,3': { direction: 0, express: true },
        '1,2': { direction: 90, express: true },
      };
      const state = createInitialState({
        board,
        robots: [
          { col: 1, row: 2 },
          { col: 2, row: 3 },
        ],
        antenna: { col: 0, row: 0 },
      });
      const cellToRobotId = new Map([
        ['1,2', 'r1'],
        ['2,3', 'r2'],
      ]);
      const { updates } = resolveConveyors(state, cellToRobotId);
      expect(updates.get('r2')).toEqual({ col: 2, row: 2 });
      expect(updates.get('r1')).toBeUndefined();
    });

    /**
     * Rules intent: all express movement completes before any normal belt step (resolveConveyors).
     */
    it('express phase runs before normal: express robot ends on cell that would be taken if normal ran first', () => {
      const board = createBoard(8, 5);
      board.conveyors = {
        '1,2': { direction: 90, express: true },
        '3,2': { direction: 270, express: false },
      };
      let state = createInitialState({
        board,
        robots: [
          { col: 1, row: 2 },
          { col: 3, row: 2 },
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
      const { state: after } = runBoardElementStep(state, 0, 'conveyors');
      const r1 = after.robots.find((r) => r.id === 'r1');
      const r2 = after.robots.find((r) => r.id === 'r2');
      expect(r1).toMatchObject({ col: 2, row: 2 });
      expect(r2).toMatchObject({ col: 3, row: 2 });
    });
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

  describe('checkpoint sequencing (2016 next-flag / applyCheckpoints)', () => {
    it('does not advance nextCheckpoint or set winner when robot is only on a later flag', () => {
      const board = createBoard(8, 5);
      board.checkpoints = [
        { col: 2, row: 2 },
        { col: 6, row: 2 },
      ];
      const state = createInitialState({
        board,
        robots: [{ col: 6, row: 2, direction: 0 }],
        antenna: { col: 0, row: 0 },
      });
      expect(state.robots[0].nextCheckpoint ?? 0).toBe(0);

      const { state: after } = runBoardElementStep(state, 0, 'checkpoints');

      expect(after.robots[0].nextCheckpoint ?? 0).toBe(0);
      expect(after.winner).toBeUndefined();
    });

    it('does not advance when robot is on an earlier flag while a later one is expected', () => {
      const board = createBoard(8, 5);
      board.checkpoints = [
        { col: 2, row: 2 },
        { col: 6, row: 2 },
      ];
      let state = createInitialState({
        board,
        robots: [{ col: 2, row: 2, direction: 0 }],
        antenna: { col: 0, row: 0 },
      });
      state = {
        ...state,
        robots: state.robots.map((r) =>
          r.id === 'r1' ? { ...r, nextCheckpoint: 1 } : r
        ),
      };

      const { state: after } = runBoardElementStep(state, 0, 'checkpoints');

      expect(after.robots[0].nextCheckpoint).toBe(1);
      expect(after.winner).toBeUndefined();
    });
  });
});
