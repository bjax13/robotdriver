import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import { dealHands, setProgram, activateRound } from '../activation.js';
import { CARD_TYPES } from '../cards.js';
import { addDamage, drawForSpam, rebootRobot } from '../damage.js';

function multisetEqual(a, b) {
  const count = (items) =>
    items.reduce((m, x) => {
      m.set(x, (m.get(x) ?? 0) + 1);
      return m;
    }, new Map());
  const ca = count(a);
  const cb = count(b);
  if (ca.size !== cb.size) return false;
  for (const [k, v] of ca) {
    if (cb.get(k) !== v) return false;
  }
  return true;
}

describe('damage', () => {
  describe('addDamage', () => {
    it('appends SPAM cards to discard', () => {
      const robot = { id: 'r1', discard: [CARD_TYPES.MOVE1] };
      const next = addDamage(robot, 2);
      expect(next.discard).toEqual([
        CARD_TYPES.MOVE1,
        CARD_TYPES.SPAM,
        CARD_TYPES.SPAM,
      ]);
      expect(next).not.toBe(robot);
      expect(robot.discard).toHaveLength(1);
    });

    it('treats missing discard as empty', () => {
      const robot = { id: 'r1' };
      const next = addDamage(robot, 1);
      expect(next.discard).toEqual([CARD_TYPES.SPAM]);
    });

    it('adds nothing when count is zero', () => {
      const robot = { id: 'r1', discard: [CARD_TYPES.BACK] };
      expect(addDamage(robot, 0).discard).toEqual([CARD_TYPES.BACK]);
    });
  });

  describe('drawForSpam', () => {
    it('pops from deck when non-empty', () => {
      const { card, deck, discard } = drawForSpam(
        [CARD_TYPES.MOVE1, CARD_TYPES.MOVE2, CARD_TYPES.TURN_LEFT],
        [CARD_TYPES.BACK],
      );
      expect(card).toBe(CARD_TYPES.TURN_LEFT);
      expect(deck).toEqual([CARD_TYPES.MOVE1, CARD_TYPES.MOVE2]);
      expect(discard).toEqual([CARD_TYPES.BACK]);
    });

    it('reshuffles discard into deck when deck is empty', () => {
      const pile = [
        CARD_TYPES.MOVE1,
        CARD_TYPES.MOVE2,
        CARD_TYPES.TURN_LEFT,
        CARD_TYPES.BACK,
      ];
      const { card, deck, discard } = drawForSpam([], pile);
      expect(discard).toEqual([]);
      expect(deck).toHaveLength(pile.length - 1);
      expect(multisetEqual([card, ...deck], pile)).toBe(true);
    });

    it('falls back to MOVE1 when deck and discard are both empty', () => {
      const { card, deck, discard } = drawForSpam([], []);
      expect(card).toBe(CARD_TYPES.MOVE1);
      expect(deck).toEqual([]);
      expect(discard).toEqual([]);
    });
  });

  describe('rebootRobot', () => {
    it('moves to reboot square, resets heading and registers, appends SPAM', () => {
      const robot = {
        id: 'r1',
        col: 5,
        row: 3,
        direction: 0,
        rebooted: true,
        registers: [CARD_TYPES.MOVE1, CARD_TYPES.SPAM],
        discard: [CARD_TYPES.TURN_LEFT],
      };
      const next = rebootRobot(robot, 2, 4);
      expect(next.col).toBe(2);
      expect(next.row).toBe(4);
      expect(next.direction).toBe(90);
      expect(next.rebooted).toBe(false);
      expect(next.registers).toEqual([]);
      expect(next.discard).toEqual([
        CARD_TYPES.TURN_LEFT,
        CARD_TYPES.SPAM,
      ]);
    });

    it('appends multiple SPAM when spamCount provided', () => {
      const robot = { id: 'r1', col: 0, row: 0, discard: [] };
      const next = rebootRobot(robot, 1, 1, 3);
      expect(next.discard).toEqual([
        CARD_TYPES.SPAM,
        CARD_TYPES.SPAM,
        CARD_TYPES.SPAM,
      ]);
    });

    it('handles missing discard', () => {
      const robot = { id: 'r1', col: 0, row: 0 };
      const next = rebootRobot(robot, 9, 8);
      expect(next.discard).toEqual([CARD_TYPES.SPAM]);
    });
  });

  it('robot hit by laser receives SPAM in discard', () => {
    const board = createBoard(6, 5);
    let state = createInitialState({
      board,
      robots: [{ col: 0, row: 2 }, { col: 3, row: 2 }],
      antenna: { col: 0, row: 0 },
    });
    state = dealHands(state);
    state = setProgram(state, 'r1', [
      CARD_TYPES.TURN_RIGHT,
      CARD_TYPES.TURN_RIGHT,
      CARD_TYPES.TURN_RIGHT,
      CARD_TYPES.TURN_RIGHT,
      CARD_TYPES.TURN_RIGHT,
    ]);
    state = setProgram(state, 'r2', [
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.TURN_LEFT,
    ]);
    const before = state.robots[1].discard.length;
    state = activateRound(state);
    expect(state.robots[1].discard.length).toBeGreaterThan(before);
    expect(state.robots[1].damage ?? 0).toBeGreaterThanOrEqual(1);
  });
});
