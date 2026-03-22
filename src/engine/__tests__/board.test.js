import { createBoard, inBounds, hasWall, wallKey } from '../board.js';

describe('board', () => {
  describe('createBoard', () => {
    it('creates empty board', () => {
      const board = createBoard(4, 3);
      expect(board.width).toBe(4);
      expect(board.height).toBe(3);
      expect(Object.keys(board.walls)).toHaveLength(0);
    });

    it('creates board with walls', () => {
      const board = createBoard(3, 3, [
        { col: 1, row: 1, edge: 'N' },
        { col: 1, row: 1, edge: 'E' },
      ]);
      expect(board.walls[wallKey(1, 1, 'N')]).toBe(true);
      expect(board.walls[wallKey(1, 1, 'E')]).toBe(true);
    });
  });

  describe('inBounds', () => {
    const board = createBoard(4, 3);
    it('returns true for valid cells', () => {
      expect(inBounds(board, 0, 0)).toBe(true);
      expect(inBounds(board, 3, 2)).toBe(true);
    });
    it('returns false for out of bounds', () => {
      expect(inBounds(board, -1, 0)).toBe(false);
      expect(inBounds(board, 4, 0)).toBe(false);
      expect(inBounds(board, 0, -1)).toBe(false);
      expect(inBounds(board, 0, 3)).toBe(false);
    });
  });

  describe('hasWall', () => {
    it('returns true when wall exists', () => {
      const board = createBoard(3, 3, [{ col: 1, row: 1, edge: 'E' }]);
      expect(hasWall(board, 1, 1, 90)).toBe(true);
    });
    it('returns false when no wall', () => {
      const board = createBoard(3, 3);
      expect(hasWall(board, 1, 1, 90)).toBe(false);
    });
  });
});
