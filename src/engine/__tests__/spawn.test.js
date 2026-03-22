import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import { dealHands, setProgram, activateRound } from '../activation.js';
import { CARD_TYPES } from '../cards.js';

describe('archive spawn', () => {
  it('initializes spawn from robot start position', () => {
    const state = createInitialState({ robots: [{ col: 3, row: 4 }] });
    expect(state.robots[0].spawnCol).toBe(3);
    expect(state.robots[0].spawnRow).toBe(4);
  });

  it('updates spawn when completing a checkpoint', () => {
    const board = createBoard(6, 5);
    board.checkpoints = [{ col: 4, row: 2 }];
    let state = createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 90 }],
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
    state = activateRound(state);
    expect(state.robots[0].nextCheckpoint).toBe(1);
    expect(state.robots[0].spawnCol).toBe(4);
    expect(state.robots[0].spawnRow).toBe(2);
  });
});
