import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import {
  dealHands,
  setProgram,
  activateRound,
  activateRegister,
  activateRegisterWithEvents,
  getHandDrawCount,
} from '../activation.js';
import { CARD_TYPES } from '../cards.js';

describe('activation', () => {
  it('deals 9 cards to each robot', () => {
    const state = createInitialState({ robots: [{ col: 0, row: 0 }] });
    const after = dealHands(state);
    expect(after.robots[0].hand).toHaveLength(9);
    expect(after.robots[0].deck.length).toBeLessThan(state.robots[0].deck.length);
  });

  it('deals fewer cards when damaged; locked registers merge on setProgram', () => {
    const five = [
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.TURN_LEFT,
      CARD_TYPES.TURN_RIGHT,
      CARD_TYPES.BACK,
    ];
    let state = createInitialState({ robots: [{ col: 0, row: 0, damage: 2 }] });
    state = { ...state, robots: [{ ...state.robots[0], registers: five }] };
    expect(getHandDrawCount(state.robots[0])).toBe(7);
    state = dealHands(state);
    expect(state.robots[0].hand).toHaveLength(7);
    const pick = state.robots[0].hand.slice(0, 3);
    state = setProgram(state, 'r1', pick);
    expect(state.robots[0].registers).toEqual([
      pick[0],
      pick[1],
      pick[2],
      five[3],
      five[4],
    ]);
  });

  it('setProgram places 5 cards in registers', () => {
    let state = createInitialState({ robots: [{ col: 1, row: 1 }] });
    state = dealHands(state);
    const five = state.robots[0].hand.slice(0, 5);
    state = setProgram(state, 'r1', five);
    expect(state.robots[0].registers).toEqual(five);
    expect(state.robots[0].hand).toHaveLength(0);
  });

  it('activateRound executes all 5 registers and updates position', () => {
    let state = createInitialState({
      robots: [{ col: 2, row: 2 }],
      antenna: { col: 0, row: 0 },
    });
    state = dealHands(state);
    state = setProgram(state, 'r1', [
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.TURN_RIGHT,
      CARD_TYPES.MOVE2,
      CARD_TYPES.U_TURN,
    ]);
    const before = state.robots[0];
    state = activateRound(state);
    const after = state.robots[0];
    expect(after.col).not.toBe(before.col);
    expect(after.row).not.toBe(before.row);
    expect(after.col).toBe(4);
    expect(after.row).toBe(4);
    expect(after.direction).toBe(0);
  });

  it('activateRegisterWithEvents orders robot actions by antenna priority', () => {
    let state = createInitialState({
      robots: [
        { col: 1, row: 0, direction: 90 },
        { col: 0, row: 5, direction: 90 },
      ],
      antenna: { col: 0, row: 0 },
    });
    state = {
      ...state,
      robots: state.robots.map((r) => ({
        ...r,
        registers: [
          CARD_TYPES.MOVE1,
          CARD_TYPES.MOVE1,
          CARD_TYPES.MOVE1,
          CARD_TYPES.MOVE1,
          CARD_TYPES.MOVE1,
        ],
        hand: [],
      })),
    };
    const { events } = activateRegisterWithEvents(state, 0);
    const robotEvents = events.filter((e) => e.kind === 'robot_action');
    expect(robotEvents).toHaveLength(2);
    expect(robotEvents[0].robotId).toBe('r1');
    expect(robotEvents[0].priorityInRegister).toBe(1);
    expect(robotEvents[1].robotId).toBe('r2');
    expect(robotEvents[1].priorityInRegister).toBe(2);
    expect(events[events.length - 1].kind).toBe('board_resolve');
  });

  it('activateRegisterWithEvents emits laser_hit when a beam hits another robot', () => {
    let state = createInitialState({
      board: createBoard(6, 3),
      robots: [
        { col: 1, row: 1, direction: 90 },
        { col: 3, row: 1, direction: 0 },
      ],
      antenna: { col: 0, row: 0 },
    });
    const five = Array(5).fill(CARD_TYPES.POWER_UP);
    state = {
      ...state,
      robots: state.robots.map((r) => ({ ...r, registers: five, hand: [] })),
    };
    const { events } = activateRegisterWithEvents(state, 0);
    const laserEvents = events.filter((e) => e.kind === 'laser_hit');
    expect(laserEvents.length).toBeGreaterThanOrEqual(1);
    expect(
      laserEvents.some((e) => e.shooterId === 'r1' && e.targetId === 'r2')
    ).toBe(true);
    expect(events[events.length - 1].kind).toBe('board_resolve');
  });

  it('activateRegisterWithEvents emits laser_hit for wall-mounted laser', () => {
    let state = createInitialState({
      board: createBoard(6, 3, [], [{ col: 5, row: 1, direction: 270 }]),
      robots: [
        { col: 2, row: 1, direction: 0 },
        { col: 4, row: 1, direction: 0 },
      ],
      antenna: { col: 0, row: 0 },
    });
    const five = Array(5).fill(CARD_TYPES.POWER_UP);
    state = {
      ...state,
      robots: state.robots.map((r) => ({ ...r, registers: five, hand: [] })),
    };
    const { events } = activateRegisterWithEvents(state, 0);
    const laserEvents = events.filter((e) => e.kind === 'laser_hit');
    expect(
      laserEvents.some(
        (e) => e.shooterId.startsWith('wall:') && e.targetId === 'r2'
      )
    ).toBe(true);
  });

  it('Again repeats previous register', () => {
    let state = createInitialState({
      robots: [{ col: 5, row: 2 }],
      antenna: { col: 0, row: 0 },
    });
    state = dealHands(state);
    state = setProgram(state, 'r1', [
      CARD_TYPES.TURN_RIGHT,
      CARD_TYPES.AGAIN,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
    ]);
    state = activateRound(state);
    expect(state.robots[0].direction).toBe(270);
    expect(state.robots[0].col).toBe(2);
  });
});
