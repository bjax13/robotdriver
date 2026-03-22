import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import { mulberry32 } from '../random.js';
import { placeRandomCheckpoints, chooseInitialFacing } from '../scenario.js';

describe('placeRandomCheckpoints', () => {
  it('places distinct checkpoints excluding row 0 and given cells', () => {
    const board = createBoard(10, 10);
    const excludeCells = new Set(['0,0', '2,0']);
    const rand = mulberry32(999);
    placeRandomCheckpoints(board, 3, rand, {
      excludeCells,
      excludeStartRow: true,
    });

    expect(board.checkpoints).toHaveLength(3);
    const keys = board.checkpoints.map((p) => `${p.col},${p.row}`);
    expect(new Set(keys).size).toBe(3);
    for (const p of board.checkpoints) {
      expect(p.row).toBeGreaterThanOrEqual(1);
      expect(excludeCells.has(`${p.col},${p.row}`)).toBe(false);
    }
  });

  it('is deterministic for the same seed', () => {
    const run = () => {
      const b = createBoard(10, 10);
      placeRandomCheckpoints(b, 3, mulberry32(42), {
        excludeCells: new Set(['0,0']),
        excludeStartRow: true,
      });
      return b.checkpoints;
    };
    expect(run()).toEqual(run());
  });
});

describe('createInitialState nextCheckpoint', () => {
  it('initializes nextCheckpoint to 0', () => {
    const state = createInitialState({
      robots: [{ col: 0, row: 0 }],
      antenna: { col: 0, row: 0 },
    });
    expect(state.robots[0].nextCheckpoint).toBe(0);
  });
});

describe('chooseInitialFacing', () => {
  it('prefers direction with best dot toward target (tie N→E→S→W)', () => {
    const board = createBoard(5, 5);
    // (1,1) → (3,3): E and S tie at +2; E comes first in order
    expect(chooseInitialFacing(board, 1, 1, 3, 3)).toBe(90);
  });

  it('skips east when first step is walled and picks next best (tie N before S)', () => {
    const board = createBoard(5, 5, [{ col: 2, row: 2, edge: 'E' }]);
    // (2,2) → (4,2): E ideal but blocked. N and S tie at dot 0 with (2,0); N listed first.
    expect(chooseInitialFacing(board, 2, 2, 4, 2)).toBe(0);
  });

  it('faces south when target is south and path clear', () => {
    const board = createBoard(5, 5);
    expect(chooseInitialFacing(board, 2, 1, 2, 4)).toBe(180);
  });
});
