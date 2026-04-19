import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import {
  dealHands,
  getHandDrawCount,
  getLockedRegisterCount,
  getUnlockedRegisterCount,
} from '../activation.js';
import { pickProgram } from '../autoplay.js';
import { CARD_TYPES } from '../cards.js';

describe('pickProgram', () => {
  it('prefers a card that reduces distance to next checkpoint', () => {
    const board = createBoard(8, 5);
    board.checkpoints = [{ col: 5, row: 2 }];
    const fiveRegs = [
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
    ];
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 90, damage: 4 }],
      antenna: { col: 0, row: 0 },
    });
    state = {
      ...state,
      robots: [
        {
          ...state.robots[0],
          registers: fiveRegs,
          hand: [
            CARD_TYPES.TURN_RIGHT,
            CARD_TYPES.MOVE1,
            CARD_TYPES.MOVE1,
            CARD_TYPES.MOVE1,
            CARD_TYPES.MOVE1,
          ],
        },
      ],
    };
    const rand = () => 0.99;
    const picks = pickProgram(state, 'r1', rand);
    expect(picks).toHaveLength(1);
    expect(picks[0]).toBe(CARD_TYPES.MOVE1);
  });

  it('uses wall-aware distance: favors a move that stays on a reachable path', () => {
    const board = createBoard(6, 3, [
      { col: 1, row: 1, edge: 'E' },
      { col: 2, row: 1, edge: 'E' },
    ]);
    board.checkpoints = [{ col: 4, row: 1 }];
    let state = createInitialState({
      board,
      robots: [{ col: 0, row: 1, direction: 90 }],
      antenna: { col: 0, row: 0 },
    });
    state = dealHands(state);
    state = {
      ...state,
      robots: [
        {
          ...state.robots[0],
          registers: Array(5).fill(CARD_TYPES.MOVE1),
          hand: [
            CARD_TYPES.MOVE1,
            CARD_TYPES.TURN_LEFT,
            CARD_TYPES.TURN_LEFT,
            CARD_TYPES.TURN_LEFT,
            CARD_TYPES.TURN_LEFT,
          ],
        },
      ],
    };
    const rand = () => 0;
    const picks = pickProgram(state, 'r1', rand);
    expect(picks[0]).toBe(CARD_TYPES.MOVE1);
  });

  it('never returns more picks than unlocked registers (damage locks high registers)', () => {
    const board = createBoard(8, 5);
    board.checkpoints = [{ col: 6, row: 2 }];
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 90, damage: 4 }],
      antenna: { col: 0, row: 0 },
    });
    state = {
      ...state,
      robots: [
        {
          ...state.robots[0],
          registers: Array(5).fill(CARD_TYPES.MOVE1),
          hand: [
            CARD_TYPES.MOVE1,
            CARD_TYPES.MOVE1,
            CARD_TYPES.MOVE1,
            CARD_TYPES.MOVE1,
            CARD_TYPES.MOVE1,
          ],
        },
      ],
    };
    const robot = state.robots[0];
    expect(getHandDrawCount(robot)).toBe(5);
    expect(getLockedRegisterCount(robot)).toBe(4);
    expect(getUnlockedRegisterCount(robot)).toBe(1);

    const picks = pickProgram(state, 'r1', () => 0);
    expect(picks).toHaveLength(1);
  });

  it('returns no picks when the hand has fewer cards than unlocked registers require', () => {
    const board = createBoard(8, 5);
    board.checkpoints = [{ col: 6, row: 2 }];
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 90, damage: 2 }],
      antenna: { col: 0, row: 0 },
    });
    state = {
      ...state,
      robots: [
        {
          ...state.robots[0],
          registers: Array(5).fill(CARD_TYPES.MOVE1),
          hand: [CARD_TYPES.MOVE1],
        },
      ],
    };
    expect(getHandDrawCount(state.robots[0])).toBe(7);
    expect(getUnlockedRegisterCount(state.robots[0])).toBe(3);
    expect(pickProgram(state, 'r1', () => 0)).toEqual([]);
  });

  it('returns no picks when all registers are locked (cannot bypass by a full hand)', () => {
    const board = createBoard(8, 5);
    board.checkpoints = [{ col: 6, row: 2 }];
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 90, damage: 9 }],
      antenna: { col: 0, row: 0 },
    });
    state = {
      ...state,
      robots: [
        {
          ...state.robots[0],
          registers: Array(5).fill(CARD_TYPES.MOVE1),
          hand: Array(9).fill(CARD_TYPES.MOVE1),
        },
      ],
    };
    expect(getUnlockedRegisterCount(state.robots[0])).toBe(0);
    expect(pickProgram(state, 'r1', () => 0)).toEqual([]);
  });
});

describe('pickProgram vs damage draw limits and locked registers', () => {
  const fiveRegs = () => Array(5).fill(CARD_TYPES.MOVE1);

  it('returns no picks when hand is smaller than unlocked register count (cannot cheat past draw cap)', () => {
    const board = createBoard(6, 4);
    board.checkpoints = [{ col: 5, row: 2 }];
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 90, damage: 2 }],
      antenna: { col: 0, row: 0 },
    });
    state = {
      ...state,
      robots: [
        {
          ...state.robots[0],
          registers: fiveRegs(),
          hand: [CARD_TYPES.MOVE1, CARD_TYPES.MOVE1],
        },
      ],
    };
    const robot = state.robots[0];
    expect(getHandDrawCount(robot)).toBe(7);
    expect(getUnlockedRegisterCount(robot)).toBe(3);
    expect(robot.hand.length).toBeLessThan(getUnlockedRegisterCount(robot));

    const picks = pickProgram(state, 'r1', () => 0);
    expect(picks).toEqual([]);
  });

  it('never fills more registers than getUnlockedRegisterCount even with an oversized hand', () => {
    const board = createBoard(6, 4);
    board.checkpoints = [{ col: 5, row: 2 }];
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 90, damage: 3 }],
      antenna: { col: 0, row: 0 },
    });
    state = {
      ...state,
      robots: [
        {
          ...state.robots[0],
          registers: fiveRegs(),
          hand: Array(25).fill(CARD_TYPES.MOVE1),
        },
      ],
    };
    expect(getUnlockedRegisterCount(state.robots[0])).toBe(2);

    const picks = pickProgram(state, 'r1', () => 0);
    expect(picks).toHaveLength(2);
  });

  it('after dealHands, pick count matches unlocked slots for damage 0-4 (hand size tied to getHandDrawCount)', () => {
    const board = createBoard(8, 6);
    board.checkpoints = [{ col: 6, row: 3 }];
    for (let damage = 0; damage <= 4; damage += 1) {
      let state = createInitialState({
        board,
        robots: [{ col: 2, row: 2, direction: 90, damage }],
        antenna: { col: 0, row: 0 },
        robotDeckSeedBase: 700 + damage,
      });
      state = {
        ...state,
        robots: [{ ...state.robots[0], registers: fiveRegs() }],
      };
      state = dealHands(state);
      const robot = state.robots[0];
      expect(robot.hand).toHaveLength(getHandDrawCount(robot));
      const unlocked = getUnlockedRegisterCount(robot);
      expect(unlocked).toBe(5 - damage);
      expect(robot.hand.length).toBeGreaterThanOrEqual(unlocked);

      const picks = pickProgram(state, 'r1', () => 0);
      expect(picks).toHaveLength(unlocked);
    }
  });

  it('at damage 5 all registers are locked so pickProgram returns nothing despite a non-empty hand', () => {
    let state = createInitialState({
      robots: [{ col: 0, row: 0, damage: 5 }],
      robotDeckSeedBase: 800,
    });
    state = {
      ...state,
      robots: [{ ...state.robots[0], registers: fiveRegs() }],
    };
    state = dealHands(state);
    const robot = state.robots[0];
    expect(getHandDrawCount(robot)).toBe(4);
    expect(getUnlockedRegisterCount(robot)).toBe(0);
    expect(robot.hand.length).toBeGreaterThan(0);

    expect(pickProgram(state, 'r1', () => 0)).toEqual([]);
  });

  it('invariant: for damage 0-4, draw count is at least the number of unlocked registers', () => {
    for (let damage = 0; damage <= 4; damage += 1) {
      const robot = { damage, registers: fiveRegs() };
      expect(getHandDrawCount(robot)).toBeGreaterThanOrEqual(
        getUnlockedRegisterCount(robot)
      );
    }
  });
});
