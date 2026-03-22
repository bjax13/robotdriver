import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import { dealHands, setProgram, activateRound } from '../activation.js';
import { CARD_TYPES } from '../cards.js';

describe('damage', () => {
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
  });
});
