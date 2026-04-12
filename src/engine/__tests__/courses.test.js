import { loadCourse, DIZZY_HIGHWAY } from '../courses.js';

describe('loadCourse', () => {
  it('loads DIZZY_HIGHWAY with expected board shape', () => {
    const board = loadCourse(DIZZY_HIGHWAY);
    expect(board.width).toBe(10);
    expect(board.height).toBe(10);
    expect(board.checkpoints).toEqual([{ col: 8, row: 5 }]);
    expect(board.rebootCol).toBe(0);
    expect(board.rebootRow).toBe(0);
    expect(Object.keys(board.walls).length).toBe(3);
  });

  it('maps course features onto board fields', () => {
    const board = loadCourse({
      width: 4,
      height: 4,
      walls: [{ col: 0, row: 0, edge: 'S' }],
      conveyors: [{ col: 1, row: 1, direction: 0, express: true }],
      gears: [{ col: 2, row: 2, type: 'L' }],
      checkpoints: [{ col: 3, row: 3 }],
      pits: [{ col: 1, row: 2 }],
      reboot: [{ col: 0, row: 1 }],
      boardLasers: [{ col: 3, row: 0, direction: 180 }],
    });
    expect(board.conveyors['1,1'].express).toBe(true);
    expect(board.conveyors['1,1'].direction).toBe(0);
    expect(board.gears['2,2']).toBe('L');
    expect(board.pits['1,2']).toBe(true);
    expect(board.boardLasers).toHaveLength(1);
    expect(board.rebootCol).toBe(0);
    expect(board.rebootRow).toBe(1);
  });
});
