import {
  createBoard,
  wallKey,
} from '../board.js';
import {
  stepForward,
  stepBackward,
  turn,
  directionDelta,
} from '../movement.js';
import { createInitialState, applyMove } from '../gameState.js';

describe('movement', () => {
  const emptyOccupied = new Set();

  describe('stepForward', () => {
    it('moves one space forward when no obstacles', () => {
      const board = createBoard(5, 5);
      const robot = { id: 'r1', col: 2, row: 2, direction: 90 };
      const result = stepForward(board, robot, emptyOccupied, 1);
      expect(result).toEqual({ col: 3, row: 2, direction: 90 });
    });

    it('moves multiple steps when no obstacles', () => {
      const board = createBoard(5, 5);
      const robot = { id: 'r1', col: 0, row: 0, direction: 180 };
      const result = stepForward(board, robot, emptyOccupied, 3);
      expect(result).toEqual({ col: 0, row: 3, direction: 180 });
    });

    it('stops at wall', () => {
      const board = createBoard(5, 5, [
        { col: 1, row: 2, edge: 'E' }, // wall east of (1,2), blocks movement into (2,2) from west
      ]);
      const robot = { id: 'r1', col: 1, row: 2, direction: 90 };
      const result = stepForward(board, robot, emptyOccupied, 3);
      expect(result.col).toBe(1);
      expect(result.row).toBe(2);
    });

    it('stops at board edge', () => {
      const board = createBoard(3, 3);
      const robot = { id: 'r1', col: 1, row: 0, direction: 0 };
      const result = stepForward(board, robot, emptyOccupied, 2);
      expect(result).toEqual({ col: 1, row: 0, direction: 0 });
    });

    it('stops when blocked by another robot', () => {
      const board = createBoard(5, 5);
      const robot = { id: 'r1', col: 1, row: 2, direction: 90 };
      const occupied = new Set(['2,2']);
      const result = stepForward(board, robot, occupied, 2);
      expect(result).toEqual({ col: 1, row: 2, direction: 90 });
    });

    it('turn does not change position', () => {
      const board = createBoard(5, 5);
      const robot = { id: 'r1', col: 2, row: 2, direction: 90 };
      const result = stepForward(board, robot, emptyOccupied, 0);
      expect(result.col).toBe(2);
      expect(result.row).toBe(2);
    });
  });

  describe('stepBackward', () => {
    it('moves one space backward', () => {
      const board = createBoard(5, 5);
      const robot = { id: 'r1', col: 2, row: 2, direction: 90 };
      const result = stepBackward(board, robot, emptyOccupied);
      expect(result).toEqual({ col: 1, row: 2, direction: 90 });
    });

    it('stops at wall when moving backward', () => {
      const board = createBoard(5, 5, [
        { col: 3, row: 2, edge: 'W' }, // wall west of (3,2) blocks (3,2)->(2,2)
      ]);
      const robot = { id: 'r1', col: 3, row: 2, direction: 90 };
      const result = stepBackward(board, robot, emptyOccupied);
      expect(result.col).toBe(3);
      expect(result.row).toBe(2);
    });
  });

  describe('turn', () => {
    it('turnLeft subtracts 90', () => {
      expect(turn(90, 'left')).toBe(0);
      expect(turn(0, 'left')).toBe(270);
    });

    it('turnRight adds 90', () => {
      expect(turn(0, 'right')).toBe(90);
      expect(turn(270, 'right')).toBe(0);
    });

    it('uturn adds 180', () => {
      expect(turn(0, 'uturn')).toBe(180);
      expect(turn(90, 'uturn')).toBe(270);
    });
  });

  describe('applyMove uturn', () => {
    it('four uturns restore original heading and position', () => {
      let s = createInitialState({
        board: createBoard(6, 6),
        robots: [{ col: 2, row: 2, direction: 0 }],
        antenna: { col: 0, row: 0 },
      });
      for (let i = 0; i < 4; i += 1) {
        s = applyMove(s, 'r1', 'uturn');
      }
      expect(s.robots[0].direction).toBe(0);
      expect(s.robots[0].col).toBe(2);
      expect(s.robots[0].row).toBe(2);
    });
  });

  describe('directionDelta', () => {
    it('returns correct deltas', () => {
      expect(directionDelta(0)).toEqual({ dCol: 0, dRow: -1 });
      expect(directionDelta(90)).toEqual({ dCol: 1, dRow: 0 });
      expect(directionDelta(180)).toEqual({ dCol: 0, dRow: 1 });
      expect(directionDelta(270)).toEqual({ dCol: -1, dRow: 0 });
    });
  });
});
