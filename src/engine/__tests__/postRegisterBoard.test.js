import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import {
  runPostRegisterBoardElements,
  runBoardElementStep,
  POST_REGISTER_STEPS,
} from '../postRegisterBoard.js';
import { activateRegisterWithEvents } from '../activation.js';
import { CARD_TYPES } from '../cards.js';

describe('postRegisterBoard', () => {
  it('full pipeline matches chaining individual steps', () => {
    const board = createBoard(6, 5);
    board.gears = { '2,2': 'R' };
    board.conveyors = { '1,2': { direction: 90, express: false } };
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 0 }],
      antenna: { col: 0, row: 0 },
    });
    state = {
      ...state,
      robots: [
        {
          ...state.robots[0],
          registers: [
            CARD_TYPES.TURN_LEFT,
            CARD_TYPES.TURN_LEFT,
            CARD_TYPES.TURN_LEFT,
            CARD_TYPES.TURN_LEFT,
            CARD_TYPES.TURN_LEFT,
          ],
          hand: [],
        },
      ],
    };

    const full = runPostRegisterBoardElements(state, 0).state;
    let step = state;
    for (const st of POST_REGISTER_STEPS) {
      step = runBoardElementStep(step, 0, st).state;
    }
    expect(step.robots[0].col).toBe(full.robots[0].col);
    expect(step.robots[0].row).toBe(full.robots[0].row);
    expect(step.robots[0].direction).toBe(full.robots[0].direction);
    expect(step.robots[0].damage).toBe(full.robots[0].damage);
  });

  it('matches activateRegisterWithEvents board phase after robot actions', () => {
    const board = createBoard(6, 3);
    board.gears = { '2,1': 'L' };
    let state = createInitialState({
      board,
      robots: [
        { col: 2, row: 1, direction: 90 },
        { col: 5, row: 2, direction: 0 },
      ],
      antenna: { col: 0, row: 0 },
    });
    state = {
      ...state,
      robots: state.robots.map((r) => ({
        ...r,
        registers: Array(5).fill(CARD_TYPES.POWER_UP),
        hand: [],
      })),
    };

    const { state: afterActivation } = activateRegisterWithEvents(state, 0);
    const afterBoardOnly = runPostRegisterBoardElements(state, 0).state;

    expect(afterActivation.robots.map((r) => ({ col: r.col, row: r.row, direction: r.direction }))).toEqual(
      afterBoardOnly.robots.map((r) => ({ col: r.col, row: r.row, direction: r.direction }))
    );
    expect(afterActivation.robots.map((r) => r.damage)).toEqual(
      afterBoardOnly.robots.map((r) => r.damage)
    );
  });
});
