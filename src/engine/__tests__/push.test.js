import { createBoard } from '../board.js';
import { stepForwardWithPush } from '../movement.js';
import { createInitialState } from '../gameState.js';
import { activateRegisterWithEvents } from '../activation.js';
import { CARD_TYPES } from '../cards.js';

describe('push', () => {
  describe('stepForwardWithPush', () => {
    it('pushes one robot when moving into occupied cell', () => {
      const board = createBoard(5, 5);
      const r1 = { id: 'r1', col: 1, row: 2, direction: 90 };
      const r2 = { id: 'r2', col: 2, row: 2, direction: 0 };
      const { updates } = stepForwardWithPush(board, r1, [r1, r2], 1);
      expect(updates.get('r1')).toEqual({ col: 2, row: 2, direction: 90 });
      expect(updates.get('r2')).toEqual({ col: 3, row: 2, direction: 0 });
    });

    it('chain push: A pushes B pushes C', () => {
      const board = createBoard(6, 5);
      const r1 = { id: 'r1', col: 1, row: 2, direction: 90 };
      const r2 = { id: 'r2', col: 2, row: 2, direction: 0 };
      const r3 = { id: 'r3', col: 3, row: 2, direction: 180 };
      const { updates } = stepForwardWithPush(board, r1, [r1, r2, r3], 1);
      expect(updates.get('r1')).toEqual({ col: 2, row: 2, direction: 90 });
      expect(updates.get('r2')).toEqual({ col: 3, row: 2, direction: 0 });
      expect(updates.get('r3')).toEqual({ col: 4, row: 2, direction: 180 });
    });

    it('stops when push chain hits wall', () => {
      const board = createBoard(5, 5, [
        { col: 2, row: 2, edge: 'E' }, // wall between (2,2) and (3,2)
      ]);
      const r1 = { id: 'r1', col: 1, row: 2, direction: 90 };
      const r2 = { id: 'r2', col: 2, row: 2, direction: 0 };
      const { updates } = stepForwardWithPush(board, r1, [r1, r2], 1);
      expect(updates.size).toBe(0);
    });

    it('stops when push chain would go off board', () => {
      const board = createBoard(4, 5);
      const r1 = { id: 'r1', col: 1, row: 2, direction: 90 };
      const r2 = { id: 'r2', col: 2, row: 2, direction: 0 };
      const r3 = { id: 'r3', col: 3, row: 2, direction: 0 };
      const { updates } = stepForwardWithPush(board, r1, [r1, r2, r3], 1);
      expect(updates.size).toBe(0);
    });

    it('allows chain front to step onto a pit cell (pit resolution runs later in post-register pits)', () => {
      const board = createBoard(6, 5);
      board.pits = { '4,2': true };
      const r1 = { id: 'r1', col: 2, row: 2, direction: 90 };
      const r2 = { id: 'r2', col: 3, row: 2, direction: 0 };
      const { updates } = stepForwardWithPush(board, r1, [r1, r2], 1);
      expect(updates.get('r1')).toEqual({ col: 3, row: 2, direction: 90 });
      expect(updates.get('r2')).toEqual({ col: 4, row: 2, direction: 0 });
    });

    it('allows chain front onto reboot token coordinates like any other in-bounds cell', () => {
      const board = createBoard(7, 5);
      board.rebootCol = 5;
      board.rebootRow = 2;
      const r1 = { id: 'r1', col: 3, row: 2, direction: 90 };
      const r2 = { id: 'r2', col: 4, row: 2, direction: 0 };
      const { updates } = stepForwardWithPush(board, r1, [r1, r2], 1);
      expect(updates.get('r1')).toEqual({ col: 4, row: 2, direction: 90 });
      expect(updates.get('r2')).toEqual({ col: 5, row: 2, direction: 0 });
    });
  });

  describe('integration: programmed push + post-register pits', () => {
    it('reboots robot pushed onto pit after the register board phase', () => {
      const board = createBoard(6, 5);
      board.pits = { '4,2': true };
      board.rebootCol = 0;
      board.rebootRow = 0;
      let state = createInitialState({
        board,
        robots: [
          { col: 2, row: 2, direction: 90 },
          { col: 3, row: 2, direction: 0 },
        ],
        antenna: { col: 0, row: 0 },
      });
      state = {
        ...state,
        robots: [
          {
            ...state.robots[0],
            registers: Array(5).fill(CARD_TYPES.MOVE1),
            hand: [],
          },
          {
            ...state.robots[1],
            spawnCol: 0,
            spawnRow: 0,
            registers: Array(5).fill(CARD_TYPES.POWER_UP),
            hand: [],
          },
        ],
      };
      const { state: after } = activateRegisterWithEvents(state, 0);
      const r2 = after.robots.find((x) => x.id === 'r2');
      expect(r2?.col).toBe(0);
      expect(r2?.row).toBe(0);
      expect(r2?.registers).toEqual([]);
    });

    it('keeps registers when pushed onto reboot square without falling in a pit', () => {
      const board = createBoard(7, 5);
      board.rebootCol = 5;
      board.rebootRow = 2;
      let state = createInitialState({
        board,
        robots: [
          { col: 3, row: 2, direction: 90 },
          { col: 4, row: 2, direction: 0 },
        ],
        antenna: { col: 0, row: 0 },
      });
      state = {
        ...state,
        robots: [
          {
            ...state.robots[0],
            registers: Array(5).fill(CARD_TYPES.MOVE1),
            hand: [],
          },
          {
            ...state.robots[1],
            registers: Array(5).fill(CARD_TYPES.POWER_UP),
            hand: [],
          },
        ],
      };
      const { state: after } = activateRegisterWithEvents(state, 0);
      const front = after.robots.find((x) => x.id === 'r2');
      expect(front?.col).toBe(5);
      expect(front?.row).toBe(2);
      expect((front?.registers ?? []).length).toBe(5);
    });
  });

  describe('conveyor vs push panel order (POST_REGISTER_STEPS)', () => {
    it('conveys onto merge tile before push panel fires on that register', () => {
      const board = createBoard(8, 5);
      board.conveyors = {
        '1,2': { direction: 90, express: true },
        '2,2': { direction: 90, express: true },
      };
      board.pushPanels = {
        '3,2': { registers: [2], direction: 90 },
      };
      let state = createInitialState({
        board,
        robots: [{ col: 1, row: 2, direction: 0 }],
        antenna: { col: 0, row: 0 },
      });
      state = {
        ...state,
        robots: [
          {
            ...state.robots[0],
            registers: [
              CARD_TYPES.TURN_LEFT,
              CARD_TYPES.TURN_LEFT,
              CARD_TYPES.TURN_LEFT,
              CARD_TYPES.TURN_LEFT,
              CARD_TYPES.TURN_LEFT,
            ],
            hand: [],
          },
        ],
      };
      const { state: after } = activateRegisterWithEvents(state, 1);
      expect(after.robots[0].col).toBe(4);
      expect(after.robots[0].row).toBe(2);
    });
  });
});
