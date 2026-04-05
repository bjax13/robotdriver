import { createBoard } from '../board.js';
import { createInitialState, applyMove } from '../gameState.js';
import {
  dealHands,
  setProgram,
  activateRegisterWithEvents,
} from '../activation.js';
import { CARD_TYPES } from '../cards.js';
import {
  stepForward,
  forwardMoveWouldEnterOccupied,
} from '../movement.js';
import { wallBlocks, getPassabilityForRobot } from '../movementPassability.js';
import { wallEastOf } from '../testFixtures.js';

describe('movementPassability', () => {
  describe('wallBlocks', () => {
    it('matches hasWall when passability is undefined', () => {
      const board = createBoard(5, 5, wallEastOf(1, 2));
      const robot = { id: 'r1', col: 1, row: 2, direction: 90 };
      expect(wallBlocks(board, 1, 2, 90, robot, undefined)).toBe(true);
      expect(wallBlocks(board, 0, 2, 90, robot, undefined)).toBe(false);
    });

    it('defers to custom isWallBlocking when provided', () => {
      const board = createBoard(5, 5, wallEastOf(1, 2));
      const robot = { id: 'r1', col: 1, row: 2, direction: 90 };
      const pass = {
        isWallBlocking: () => false,
      };
      expect(wallBlocks(board, 1, 2, 90, robot, pass)).toBe(false);
    });
  });

  describe('getPassabilityForRobot', () => {
    it('returns undefined without wallPhasing or energy', () => {
      expect(getPassabilityForRobot({ id: 'r1', energy: 0 })).toBeUndefined();
      expect(getPassabilityForRobot({ id: 'r1', energy: 1 })).toBeUndefined();
      expect(getPassabilityForRobot({ id: 'r1', wallPhasing: true, energy: 0 })).toBeUndefined();
    });

    it('returns passability that ignores walls when wallPhasing and energy >= 1', () => {
      const robot = { id: 'r1', wallPhasing: true, energy: 1 };
      const pass = getPassabilityForRobot(robot);
      const board = createBoard(5, 5, wallEastOf(1, 2));
      expect(wallBlocks(board, 1, 2, 90, robot, pass)).toBe(false);
    });
  });

  describe('forward path parity with wall phasing', () => {
    it('forwardMoveWouldEnterOccupied stays false through wall when phasing', () => {
      const board = createBoard(10, 10, wallEastOf(1, 2));
      const robot = {
        id: 'r1',
        col: 1,
        row: 2,
        direction: 90,
        wallPhasing: true,
        energy: 1,
      };
      expect(forwardMoveWouldEnterOccupied(board, robot, new Set(), 2)).toBe(false);
    });

    it('stepForward crosses wall when phasing; blocked without', () => {
      const board = createBoard(10, 10, wallEastOf(1, 2));
      const occ = new Set();
      const normal = { id: 'r1', col: 1, row: 2, direction: 90 };
      const phased = { ...normal, wallPhasing: true, energy: 1 };

      expect(stepForward(board, normal, occ, 2)).toEqual({
        col: 1,
        row: 2,
        direction: 90,
      });
      expect(stepForward(board, phased, occ, 2)).toEqual({
        col: 3,
        row: 2,
        direction: 90,
      });
    });
  });

  describe('applyMove integration', () => {
    it('move3 crosses walls for wall-phasing robot with energy', () => {
      const board = createBoard(10, 10, wallEastOf(1, 2));
      const state = createInitialState({
        board,
        robots: [{ col: 1, row: 2, direction: 90, energy: 1, wallPhasing: true }],
        antenna: { col: 0, row: 0 },
      });
      const next = applyMove(state, 'r1', 'move3');
      expect(next.robots[0]).toMatchObject({ col: 4, row: 2, direction: 90 });
    });
  });

  describe('activateRegisterWithEvents', () => {
    it('executes move through wall when robot has wall phasing and energy', () => {
      const board = createBoard(10, 10, wallEastOf(1, 2));
      let state = createInitialState({
        board,
        robots: [{ col: 1, row: 2, direction: 90, energy: 1, wallPhasing: true }],
        antenna: { col: 0, row: 0 },
      });
      state = dealHands(state);
      state = setProgram(state, 'r1', [
        CARD_TYPES.MOVE1,
        CARD_TYPES.MOVE1,
        CARD_TYPES.MOVE1,
        CARD_TYPES.MOVE1,
        CARD_TYPES.MOVE1,
      ]);

      const { state: after, events } = activateRegisterWithEvents(state, 0);
      expect(after.robots[0]).toMatchObject({ col: 2, row: 2, direction: 90 });

      const actions = events.filter((e) => e.kind === 'robot_action');
      expect(actions).toHaveLength(1);
      expect(actions[0].action).toBe('move1');
      expect(events.some((e) => e.kind === 'board_resolve')).toBe(true);
    });
  });
});
