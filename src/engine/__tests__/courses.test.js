import { loadCourse, DIZZY_HIGHWAY } from '../courses.js';
import { validateCourse, CourseValidationError } from '../courseValidation.js';

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

describe('validateCourse', () => {
  it('accepts DIZZY_HIGHWAY', () => {
    expect(validateCourse(DIZZY_HIGHWAY)).toEqual({ ok: true });
  });
});

describe('loadCourse validation', () => {
  it('throws when width is missing', () => {
    expect(() => loadCourse({ height: 10 })).toThrow(CourseValidationError);
    expect(() => loadCourse({ height: 10 })).toThrow(/width/i);
  });

  it('throws when height is zero', () => {
    expect(() =>
      loadCourse({
        width: 4,
        height: 0,
      })
    ).toThrow(CourseValidationError);
  });

  it('throws when height is negative or non-integer', () => {
    expect(() => loadCourse({ width: 4, height: -1 })).toThrow(CourseValidationError);
    expect(() => loadCourse({ width: 4, height: 2.5 })).toThrow(CourseValidationError);
  });

  it('throws when a wall cell is out of bounds', () => {
    expect(() =>
      loadCourse({
        width: 2,
        height: 2,
        walls: [{ col: 9, row: 0, edge: 'N' }],
      })
    ).toThrow(CourseValidationError);
  });

  it('throws when wall edge is invalid', () => {
    expect(() =>
      loadCourse({
        width: 4,
        height: 4,
        walls: [{ col: 0, row: 0, edge: 'X' }],
      })
    ).toThrow(CourseValidationError);
  });

  it('throws when conveyor direction is invalid', () => {
    expect(() =>
      loadCourse({
        width: 4,
        height: 4,
        conveyors: [{ col: 1, row: 1, direction: 45 }],
      })
    ).toThrow(CourseValidationError);
  });

  it('throws when gear type is invalid', () => {
    expect(() =>
      loadCourse({
        width: 4,
        height: 4,
        gears: [{ col: 1, row: 1, type: 'Z' }],
      })
    ).toThrow(CourseValidationError);
  });

  it('throws when board laser col is out of bounds', () => {
    expect(() =>
      loadCourse({
        width: 3,
        height: 3,
        boardLasers: [{ col: 10, row: 0, direction: 180 }],
      })
    ).toThrow(CourseValidationError);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['number', 1],
    ['string', 'x'],
  ])('throws when course is %s', (_label, bad) => {
    expect(() => loadCourse(bad)).toThrow(CourseValidationError);
  });
});
