import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import { raycast } from '../lasers.js';

describe('raycast walls', () => {
  it('does not hit robot behind a wall', () => {
    const board = createBoard(6, 3, [
      { col: 2, row: 1, edge: 'E' },
    ]);
    const robots = [
      { id: 'r1', col: 1, row: 1, direction: 90 },
      { id: 'r2', col: 3, row: 1, direction: 0 },
    ];
    const hit = raycast(board, robots, 1, 1, 90, 'r1');
    expect(hit).toBeNull();
  });

  it('hits first robot in line when no wall', () => {
    const board = createBoard(6, 3);
    const robots = [
      { id: 'r1', col: 1, row: 1, direction: 90 },
      { id: 'r2', col: 4, row: 1, direction: 0 },
    ];
    const hit = raycast(board, robots, 1, 1, 90, 'r1');
    expect(hit?.id).toBe('r2');
  });
});
