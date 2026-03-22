import { createBoard } from '../board.js';
import { stepForwardWithPush } from '../movement.js';

describe('push', () => {
  describe('stepForwardWithPush', () => {
    it('pushes one robot when moving into occupied cell', () => {
      const board = createBoard(5, 5);
      const r1 = { id: 'r1', col: 1, row: 2, direction: 90 };
      const r2 = { id: 'r2', col: 2, row: 2, direction: 0 };
      const { updates } = stepForwardWithPush(board, r1, [r1, r2], 1);
      expect(updates.get('r1')).toEqual({ col: 2, row: 2, direction: 90 });
      expect(updates.get('r2')).toEqual({ col: 3, row: 2, direction: 0 });
    });

    it('chain push: A pushes B pushes C', () => {
      const board = createBoard(6, 5);
      const r1 = { id: 'r1', col: 1, row: 2, direction: 90 };
      const r2 = { id: 'r2', col: 2, row: 2, direction: 0 };
      const r3 = { id: 'r3', col: 3, row: 2, direction: 180 };
      const { updates } = stepForwardWithPush(board, r1, [r1, r2, r3], 1);
      expect(updates.get('r1')).toEqual({ col: 2, row: 2, direction: 90 });
      expect(updates.get('r2')).toEqual({ col: 3, row: 2, direction: 0 });
      expect(updates.get('r3')).toEqual({ col: 4, row: 2, direction: 180 });
    });

    it('stops when push chain hits wall', () => {
      const board = createBoard(5, 5, [
        { col: 2, row: 2, edge: 'E' }, // wall between (2,2) and (3,2)
      ]);
      const r1 = { id: 'r1', col: 1, row: 2, direction: 90 };
      const r2 = { id: 'r2', col: 2, row: 2, direction: 0 };
      const { updates } = stepForwardWithPush(board, r1, [r1, r2], 1);
      expect(updates.size).toBe(0);
    });

    it('stops when push chain would go off board', () => {
      const board = createBoard(4, 5);
      const r1 = { id: 'r1', col: 1, row: 2, direction: 90 };
      const r2 = { id: 'r2', col: 2, row: 2, direction: 0 };
      const r3 = { id: 'r3', col: 3, row: 2, direction: 0 };
      const { updates } = stepForwardWithPush(board, r1, [r1, r2, r3], 1);
      expect(updates.size).toBe(0);
    });
  });
});
