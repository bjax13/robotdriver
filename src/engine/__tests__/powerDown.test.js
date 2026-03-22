import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import {
  declarePowerDown,
  powerDownChance,
  dealHands,
  activateRegisterWithEvents,
  activateRound,
} from '../activation.js';
import { CARD_TYPES } from '../cards.js';
import { listLaserHits } from '../lasers.js';

describe('powerDownChance', () => {
  it('is zero with no damage', () => {
    expect(powerDownChance(0)).toBe(0);
  });

  it('doubles with each damage step until capped', () => {
    expect(powerDownChance(1)).toBe(1 / 128);
    expect(powerDownChance(2)).toBe(1 / 64);
    expect(powerDownChance(3)).toBe(1 / 32);
    expect(powerDownChance(9)).toBe(1);
  });
});

describe('declarePowerDown', () => {
  it('sets five null registers, discards hand, sets flag', () => {
    let state = createInitialState({
      robots: [{ col: 1, row: 1, damage: 2 }],
      antenna: { col: 0, row: 0 },
    });
    state = dealHands(state);
    expect(state.robots[0].hand.length).toBeGreaterThan(0);
    state = declarePowerDown(state, 'r1');
    const r = state.robots[0];
    expect(r.powerDownThisRound).toBe(true);
    expect(r.hand).toEqual([]);
    expect(r.registers).toEqual([null, null, null, null, null]);
    expect(r.discard.length).toBeGreaterThan(0);
  });
});

describe('activation power down', () => {
  it('skips robot_action for powered-down robot; heals after register 5', () => {
    const board = createBoard(6, 4);
    board.checkpoints = [{ col: 4, row: 2 }];
    let state = createInitialState({
      board,
      robots: [
        { col: 1, row: 2, direction: 90, damage: 3 },
        { col: 2, row: 2, direction: 90 },
      ],
      antenna: { col: 0, row: 0 },
    });
    state = dealHands(state);
    state = declarePowerDown(state, 'r1');
    const five = Array(5).fill(CARD_TYPES.MOVE1);
    state = {
      ...state,
      robots: [
        state.robots[0],
        { ...state.robots[1], registers: five, hand: [] },
      ],
    };

    const allEvents = [];
    for (let reg = 0; reg < 5; reg++) {
      const { state: next, events } = activateRegisterWithEvents(state, reg);
      state = next;
      allEvents.push(...events);
    }

    expect(state.robots[0].damage).toBe(0);
    expect(state.robots[0].powerDownThisRound).toBeFalsy();
    expect(state.robots[0].registers).toEqual([]);
    const r1Moves = allEvents.filter(
      (e) => e.kind === 'robot_action' && e.robotId === 'r1'
    );
    expect(r1Moves).toHaveLength(0);
    expect(allEvents.some((e) => e.kind === 'power_down_heal' && e.robotId === 'r1')).toBe(
      true
    );
  });
});

describe('lasers and power down', () => {
  it('powered-down robot does not shoot', () => {
    const board = createBoard(6, 3);
    const robots = [
      { id: 'r1', col: 1, row: 1, direction: 90, powerDownThisRound: true },
      { id: 'r2', col: 4, row: 1, direction: 0 },
    ];
    expect(listLaserHits(board, robots)).toEqual([]);
  });
});
