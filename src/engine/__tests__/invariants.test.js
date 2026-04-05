import { createBoard } from '../board.js';
import { applyMove, createInitialState, getOccupiedCells } from '../gameState.js';
import { minimalTwoRobotState } from '../testFixtures.js';

function collectPositions(robots) {
  return robots.filter((r) => !r.rebooted).map((r) => `${r.col},${r.row}`);
}

describe('state invariants after applyMove', () => {
  it('keeps the same number of robots and unique occupied cells', () => {
    const state = minimalTwoRobotState();
    const next = applyMove(state, 'r1', 'move2');
    expect(next.robots).toHaveLength(state.robots.length);
    const keys = collectPositions(next.robots);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('solo and two-robot states preserve id set after the same move', () => {
    const board = createBoard(10, 10);
    const solo = createInitialState({
      board,
      robots: [{ col: 1, row: 2, direction: 90 }],
      antenna: { col: 0, row: 0 },
    });
    const duo = createInitialState({
      board,
      robots: [
        { col: 1, row: 2, direction: 90 },
        { col: 9, row: 9, direction: 0 },
      ],
      antenna: { col: 0, row: 0 },
    });

    const a = applyMove(solo, 'r1', 'move1');
    const b = applyMove(duo, 'r1', 'move1');

    expect(a.robots.map((r) => r.id).sort()).toEqual(['r1']);
    expect(b.robots.map((r) => r.id).sort()).toEqual(['r1', 'r2']);
    expect(collectPositions(a.robots).length).toBe(1);
    expect(collectPositions(b.robots).length).toBe(2);
  });

  it('getOccupiedCells matches robot positions for active robots', () => {
    const state = minimalTwoRobotState();
    const occ = getOccupiedCells(state.robots);
    expect(occ.has('1,2')).toBe(true);
    expect(occ.has('8,8')).toBe(true);
    expect(occ.size).toBe(2);
  });
});
