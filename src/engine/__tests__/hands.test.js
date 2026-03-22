import { createInitialState } from '../gameState.js';
import { dealHands } from '../activation.js';

describe('per-robot hands', () => {
  it('deals separate hand arrays to each robot', () => {
    const state = createInitialState({
      robots: [{ col: 0, row: 0 }, { col: 1, row: 0 }],
      robotDeckSeedBase: 0x111,
    });
    const after = dealHands(state);
    const h0 = after.robots[0].hand;
    const h1 = after.robots[1].hand;
    expect(h0).not.toBe(h1);
    expect(h0.length).toBe(9);
    expect(h1.length).toBe(9);
    expect(h0.join()).not.toBe(h1.join());
  });

  it('seeded decks produce stable distinct hands across robots', () => {
    const a = dealHands(
      createInitialState({ robots: [{ col: 0, row: 0 }, { col: 1, row: 0 }], robotDeckSeedBase: 42 })
    );
    const b = dealHands(
      createInitialState({ robots: [{ col: 0, row: 0 }, { col: 1, row: 0 }], robotDeckSeedBase: 42 })
    );
    expect(a.robots[0].hand).toEqual(b.robots[0].hand);
    expect(a.robots[1].hand).toEqual(b.robots[1].hand);
    expect(a.robots[0].hand.join()).not.toBe(a.robots[1].hand.join());
  });
});
