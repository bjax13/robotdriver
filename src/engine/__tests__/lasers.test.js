import { createBoard } from '../board.js';
import { raycast, traceLaserPath, listLaserHits } from '../lasers.js';

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

describe('traceLaserPath', () => {
  it('matches raycast robot target and includes struck cell', () => {
    const board = createBoard(6, 3);
    const robots = [
      { id: 'r1', col: 1, row: 1, direction: 90 },
      { id: 'r2', col: 4, row: 1, direction: 0 },
    ];
    const hit = raycast(board, robots, 1, 1, 90, 'r1');
    const { path, hitRobotId } = traceLaserPath(board, robots, 1, 1, 90, 'r1');
    expect(hit?.id).toBe(hitRobotId);
    expect(path[path.length - 1]).toEqual({ col: 4, row: 1 });
  });

  it('stops before first cell when wall blocks, same as raycast null', () => {
    const board = createBoard(6, 3, [{ col: 1, row: 1, edge: 'E' }]);
    const robots = [
      { id: 'r1', col: 1, row: 1, direction: 90 },
      { id: 'r2', col: 3, row: 1, direction: 0 },
    ];
    expect(raycast(board, robots, 1, 1, 90, 'r1')).toBeNull();
    const { path, hitRobotId } = traceLaserPath(board, robots, 1, 1, 90, 'r1');
    expect(hitRobotId).toBeNull();
    expect(path).toEqual([]);
  });
});

describe('listLaserHits', () => {
  it('lists shooter and target for each scoring beam', () => {
    const board = createBoard(6, 3);
    const robots = [
      { id: 'r1', col: 1, row: 1, direction: 90 },
      { id: 'r2', col: 4, row: 1, direction: 0 },
    ];
    const hits = listLaserHits(board, robots);
    expect(hits).toEqual([{ shooterId: 'r1', targetId: 'r2' }]);
  });
});
