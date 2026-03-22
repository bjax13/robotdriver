import { createBoard } from '../board.js';
import { shortestGridDistance } from '../pathDistance.js';

describe('shortestGridDistance', () => {
  it('returns 0 when already at goal', () => {
    const board = createBoard(5, 5);
    expect(shortestGridDistance(board, 2, 2, 2, 2)).toBe(0);
  });

  it('counts steps on empty grid', () => {
    const board = createBoard(5, 5);
    expect(shortestGridDistance(board, 0, 0, 2, 0)).toBe(2);
    expect(shortestGridDistance(board, 0, 0, 0, 3)).toBe(3);
    expect(shortestGridDistance(board, 0, 0, 2, 2)).toBe(4);
  });

  it('goes around a wall when Manhattan would cross it', () => {
    const board = createBoard(5, 5, [
      { col: 1, row: 0, edge: 'E' },
      { col: 2, row: 0, edge: 'E' },
    ]);
    expect(shortestGridDistance(board, 0, 0, 3, 0)).toBeGreaterThan(3);
    expect(shortestGridDistance(board, 0, 0, 3, 0)).toBeLessThan(Infinity);
  });

  it('returns Infinity when goal is unreachable', () => {
    const board = createBoard(3, 3, [
      { col: 0, row: 0, edge: 'E' },
      { col: 1, row: 0, edge: 'N' },
      { col: 1, row: 0, edge: 'S' },
      { col: 1, row: 1, edge: 'E' },
      { col: 1, row: 2, edge: 'E' },
      { col: 2, row: 2, edge: 'N' },
      { col: 2, row: 1, edge: 'N' },
      { col: 2, row: 0, edge: 'W' },
    ]);
    expect(shortestGridDistance(board, 0, 0, 2, 2)).toBe(Infinity);
  });
});
