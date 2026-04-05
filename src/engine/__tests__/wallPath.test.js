import { createBoard } from '../board.js';
import { createInitialState, applyMove } from '../gameState.js';
import { forwardMoveWouldEnterOccupied, stepForward, stepForwardWithPush } from '../movement.js';
import { wallEastOf } from '../testFixtures.js';

describe('wall and path parity (push only when entering occupied)', () => {
  it('forwardMoveWouldEnterOccupied is false when path is clear', () => {
    const board = createBoard(10, 10);
    const robot = { id: 'r1', col: 1, row: 2, direction: 90 };
    const occ = new Set(['9,9']);
    expect(forwardMoveWouldEnterOccupied(board, robot, occ, 3)).toBe(false);
  });

  it('forwardMoveWouldEnterOccupied is true when path hits another robot', () => {
    const board = createBoard(10, 10);
    const robot = { id: 'r1', col: 1, row: 2, direction: 90 };
    const occ = new Set(['3,2']);
    expect(forwardMoveWouldEnterOccupied(board, robot, occ, 3)).toBe(true);
  });

  it('applyMove with distant robot matches solo robot for clear move3', () => {
    const board = createBoard(10, 10);
    const solo = createInitialState({
      board,
      robots: [{ col: 1, row: 2, direction: 90 }],
      antenna: { col: 0, row: 0 },
    });
    const multi = createInitialState({
      board,
      robots: [
        { col: 1, row: 2, direction: 90 },
        { col: 9, row: 9, direction: 0 },
      ],
      antenna: { col: 0, row: 0 },
    });
    const a = applyMove(solo, 'r1', 'move3').robots[0];
    const b = applyMove(multi, 'r1', 'move3').robots[0];
    expect({ col: a.col, row: a.row, direction: a.direction }).toEqual({
      col: b.col,
      row: b.row,
      direction: b.direction,
    });
  });

  it('stepForward matches stepForwardWithPush on empty path with far robot', () => {
    const board = createBoard(10, 10);
    const r1 = { id: 'r1', col: 1, row: 2, direction: 90 };
    const r2 = { id: 'r2', col: 9, row: 9, direction: 0 };
    const occ = new Set(['9,9']);
    const sf = stepForward(board, r1, occ, 3);
    const { updates } = stepForwardWithPush(board, r1, [r1, r2], 3);
    expect(updates.get('r1')).toEqual({ ...sf, direction: 90 });
  });

  it('stops at wall on move2 same as stepForward', () => {
    const board = createBoard(6, 5, [{ col: 2, row: 2, edge: 'E' }]);
    const r1 = { id: 'r1', col: 1, row: 2, direction: 90 };
    const r2 = { id: 'r2', col: 5, row: 4, direction: 0 };
    const solo = createInitialState({ board, robots: [r1], antenna: { col: 0, row: 0 } });
    const multi = createInitialState({ board, robots: [r1, r2], antenna: { col: 0, row: 0 } });
    const a = applyMove(solo, 'r1', 'move2').robots[0];
    const b = applyMove(multi, 'r1', 'move2').robots[0];
    expect(a.col).toBe(b.col);
    expect(a.row).toBe(b.row);
  });

  describe('wall phasing parity (per-robot passability)', () => {
    it('applyMove solo vs multi matches when phased robot crosses a wall', () => {
      const board = createBoard(10, 10, wallEastOf(1, 2));
      const attrs = {
        col: 1,
        row: 2,
        direction: 90,
        energy: 1,
        wallPhasing: true,
      };
      const solo = createInitialState({
        board,
        robots: [{ ...attrs }],
        antenna: { col: 0, row: 0 },
      });
      const multi = createInitialState({
        board,
        robots: [{ ...attrs }, { col: 9, row: 9, direction: 0 }],
        antenna: { col: 0, row: 0 },
      });
      const a = applyMove(solo, 'r1', 'move2').robots[0];
      const b = applyMove(multi, 'r1', 'move2').robots[0];
      expect({ col: a.col, row: a.row, direction: a.direction }).toEqual({
        col: b.col,
        row: b.row,
        direction: b.direction,
      });
      expect(a.col).toBe(3);
    });
  });
});
