import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import { dealHands } from '../activation.js';
import { pickProgram } from '../autoplay.js';
import { CARD_TYPES } from '../cards.js';

describe('pickProgram', () => {
  it('prefers a card that reduces distance to next checkpoint', () => {
    const board = createBoard(8, 5);
    board.checkpoints = [{ col: 5, row: 2 }];
    const fiveRegs = [
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
      CARD_TYPES.MOVE1,
    ];
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 90, damage: 4 }],
      antenna: { col: 0, row: 0 },
    });
    state = {
      ...state,
      robots: [
        {
          ...state.robots[0],
          registers: fiveRegs,
          hand: [
            CARD_TYPES.TURN_RIGHT,
            CARD_TYPES.MOVE1,
            CARD_TYPES.MOVE1,
            CARD_TYPES.MOVE1,
            CARD_TYPES.MOVE1,
          ],
        },
      ],
    };
    const rand = () => 0.99;
    const picks = pickProgram(state, 'r1', rand);
    expect(picks).toHaveLength(1);
    expect(picks[0]).toBe(CARD_TYPES.MOVE1);
  });
});
