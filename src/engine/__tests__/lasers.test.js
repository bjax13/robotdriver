import { createBoard } from '../board.js';
import {
  raycast,
  traceLaserPath,
  listLaserHits,
  listBoardLaserHits,
  listAllLaserHits,
  boardLaserShooterId,
} from '../lasers.js';

describe('raycast antenna', () => {
  it('does not hit robot behind priority antenna (empty antenna cell blocks)', () => {
    const board = createBoard(8, 3);
    const antenna = { col: 3, row: 1 };
    const robots = [
      { id: 'r1', col: 1, row: 1, direction: 90 },
      { id: 'r2', col: 5, row: 1, direction: 0 },
    ];
    expect(raycast(board, robots, 1, 1, 90, 'r1', antenna)).toBeNull();
  });

  it('still hits robot standing on antenna square', () => {
    const board = createBoard(8, 3);
    const antenna = { col: 3, row: 1 };
    const robots = [
      { id: 'r1', col: 1, row: 1, direction: 90 },
      { id: 'r2', col: 3, row: 1, direction: 0 },
    ];
    expect(raycast(board, robots, 1, 1, 90, 'r1', antenna)?.id).toBe('r2');
  });
});

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
    const { path, hitRobotId, stopReason } = traceLaserPath(board, robots, 1, 1, 90, 'r1');
    expect(hit?.id).toBe(hitRobotId);
    expect(stopReason).toBe('robot');
    expect(path[path.length - 1]).toEqual({ col: 4, row: 1 });
  });

  it('stops before first cell when wall blocks, same as raycast null', () => {
    const board = createBoard(6, 3, [{ col: 1, row: 1, edge: 'E' }]);
    const robots = [
      { id: 'r1', col: 1, row: 1, direction: 90 },
      { id: 'r2', col: 3, row: 1, direction: 0 },
    ];
    expect(raycast(board, robots, 1, 1, 90, 'r1')).toBeNull();
    const { path, hitRobotId, stopReason } = traceLaserPath(board, robots, 1, 1, 90, 'r1');
    expect(hitRobotId).toBeNull();
    expect(stopReason).toBe('wall');
    expect(path).toEqual([]);
  });

  it('path ends on antenna cell when beam is blocked there', () => {
    const board = createBoard(6, 3);
    const antenna = { col: 3, row: 1 };
    const robots = [
      { id: 'r1', col: 1, row: 1, direction: 90 },
      { id: 'r2', col: 5, row: 1, direction: 0 },
    ];
    expect(raycast(board, robots, 1, 1, 90, 'r1', antenna)).toBeNull();
    const { path, hitRobotId, stopReason } = traceLaserPath(board, robots, 1, 1, 90, 'r1', antenna);
    expect(hitRobotId).toBeNull();
    expect(stopReason).toBe('antenna');
    expect(path).toEqual([{ col: 2, row: 1 }, { col: 3, row: 1 }]);
  });

  it('reports wall stop after crossing empty cells (termination cell has no robot)', () => {
    const board = createBoard(8, 3, [{ col: 4, row: 1, edge: 'E' }]);
    const robots = [{ id: 'r1', col: 1, row: 1, direction: 90 }];
    const { path, hitRobotId, stopReason } = traceLaserPath(board, robots, 1, 1, 90, 'r1');
    expect(hitRobotId).toBeNull();
    expect(stopReason).toBe('wall');
    expect(path).toEqual([
      { col: 2, row: 1 },
      { col: 3, row: 1 },
      { col: 4, row: 1 },
    ]);
  });

  it('reports edge stop on last in-bounds cell before leaving board', () => {
    const board = createBoard(6, 8);
    const robots = [{ id: 'r1', col: 3, row: 6, direction: 0 }];
    const { path, hitRobotId, stopReason } = traceLaserPath(board, robots, 3, 6, 0, 'r1');
    expect(hitRobotId).toBeNull();
    expect(stopReason).toBe('edge');
    expect(path[path.length - 1]).toEqual({ col: 3, row: 0 });
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

describe('listBoardLaserHits', () => {
  it('hits first robot in beam from emitter cell', () => {
    const board = createBoard(6, 3, [], [{ col: 5, row: 1, direction: 270 }]);
    const robots = [
      { id: 'r1', col: 2, row: 1, direction: 0 },
      { id: 'r2', col: 4, row: 1, direction: 0 },
    ];
    const hits = listBoardLaserHits(board, robots);
    expect(hits).toEqual([
      {
        shooterId: boardLaserShooterId(5, 1, 270),
        targetId: 'r2',
      },
    ]);
  });

  it('returns empty when a wall blocks the beam', () => {
    const board = createBoard(6, 3, [{ col: 4, row: 1, edge: 'E' }], [
      { col: 5, row: 1, direction: 270 },
    ]);
    const robots = [
      { id: 'r1', col: 2, row: 1, direction: 0 },
      { id: 'r2', col: 3, row: 1, direction: 0 },
    ];
    expect(listBoardLaserHits(board, robots)).toEqual([]);
  });
});

describe('listAllLaserHits', () => {
  it('includes robot beams then board beams', () => {
    const board = createBoard(8, 3, [], [{ col: 7, row: 1, direction: 270 }]);
    const robots = [
      { id: 'r1', col: 1, row: 1, direction: 90 },
      { id: 'r2', col: 3, row: 1, direction: 0 },
      { id: 'r3', col: 5, row: 1, direction: 0 },
    ];
    const hits = listAllLaserHits(board, robots);
    expect(hits).toEqual([
      { shooterId: 'r1', targetId: 'r2' },
      { shooterId: boardLaserShooterId(7, 1, 270), targetId: 'r3' },
    ]);
  });

  it('omits hits blocked by antenna between shooter and target', () => {
    const board = createBoard(8, 3);
    const antenna = { col: 3, row: 1 };
    const robots = [
      { id: 'r1', col: 1, row: 1, direction: 90 },
      { id: 'r2', col: 5, row: 1, direction: 0 },
    ];
    expect(listAllLaserHits(board, robots, antenna)).toEqual([]);
  });
});
