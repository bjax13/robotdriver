import { sortRobotsByPriority, distanceToAntenna } from '../priority.js';

describe('priority', () => {
  const antenna = { col: 0, row: 0 };

  describe('distanceToAntenna', () => {
    it('returns Manhattan distance', () => {
      expect(distanceToAntenna(0, 0, antenna)).toBe(0);
      expect(distanceToAntenna(2, 1, antenna)).toBe(3);
      expect(distanceToAntenna(1, 1, antenna)).toBe(2);
    });
  });

  describe('sortRobotsByPriority', () => {
    it('sorts by distance: closest first', () => {
      const r1 = { id: 'r1', col: 2, row: 2, direction: 0 };
      const r2 = { id: 'r2', col: 0, row: 1, direction: 90 };
      const r3 = { id: 'r3', col: 1, row: 0, direction: 180 };
      const sorted = sortRobotsByPriority([r1, r2, r3], antenna);
      expect(sorted[0].id).toBe('r2');
      expect(sorted[1].id).toBe('r3');
      expect(sorted[2].id).toBe('r1');
    });

    it('handles equidistant robots with tie-break', () => {
      const r1 = { id: 'r1', col: 1, row: 0, direction: 0 };
      const r2 = { id: 'r2', col: 0, row: 1, direction: 90 };
      const sorted = sortRobotsByPriority([r1, r2], antenna);
      expect(sorted).toHaveLength(2);
    });
  });
});
