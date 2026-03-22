import { createBoard } from '../board.js';
import { getTopStartSlots, slotToCell } from '../startLine.js';

describe('startLine', () => {
  it('getTopStartSlots lists even columns on row 0 with 1-based slots', () => {
    const board = createBoard(10, 8);
    expect(getTopStartSlots(board)).toEqual([
      { col: 0, row: 0, slot: 1 },
      { col: 2, row: 0, slot: 2 },
      { col: 4, row: 0, slot: 3 },
      { col: 6, row: 0, slot: 4 },
      { col: 8, row: 0, slot: 5 },
    ]);
  });

  it('slotToCell maps 1-based slot to top-row cells', () => {
    const board = createBoard(10, 8);
    expect(slotToCell(board, 1)).toEqual({ col: 0, row: 0 });
    expect(slotToCell(board, 3)).toEqual({ col: 4, row: 0 });
    expect(slotToCell(board, 0)).toBeNull();
    expect(slotToCell(board, 6)).toBeNull();
  });
});
