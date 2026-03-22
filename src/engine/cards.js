/**
 * Programming card definitions and execution.
 */

export const CARD_TYPES = {
  MOVE1: 'move1',
  MOVE2: 'move2',
  MOVE3: 'move3',
  TURN_LEFT: 'turnLeft',
  TURN_RIGHT: 'turnRight',
  U_TURN: 'uturn',
  BACK: 'back',
  POWER_UP: 'powerUp',
  AGAIN: 'again',
  SPAM: 'spam',
};

/** @typedef {keyof typeof CARD_TYPES} CardType */

/**
 * Card id to action for applyMove.
 * @param {string} cardType
 * @returns {'move1'|'move2'|'move3'|'back'|'turnLeft'|'turnRight'|'uturn'|'powerUp'|'again'}
 */
export function cardToAction(cardType) {
  const map = {
    [CARD_TYPES.MOVE1]: 'move1',
    [CARD_TYPES.MOVE2]: 'move2',
    [CARD_TYPES.MOVE3]: 'move3',
    [CARD_TYPES.TURN_LEFT]: 'turnLeft',
    [CARD_TYPES.TURN_RIGHT]: 'turnRight',
    [CARD_TYPES.U_TURN]: 'uturn',
    [CARD_TYPES.BACK]: 'back',
    [CARD_TYPES.POWER_UP]: 'powerUp',
    [CARD_TYPES.AGAIN]: 'again',
    [CARD_TYPES.SPAM]: null,
  };
  return map[cardType] ?? null;
}

/**
 * Default deck composition (simplified - equal counts for testing).
 * Real Robo Rally has varying counts per card type.
 */
export const DEFAULT_DECK = [
  ...Array(6).fill(CARD_TYPES.MOVE1),
  ...Array(4).fill(CARD_TYPES.MOVE2),
  ...Array(2).fill(CARD_TYPES.MOVE3),
  ...Array(6).fill(CARD_TYPES.TURN_LEFT),
  ...Array(6).fill(CARD_TYPES.TURN_RIGHT),
  ...Array(2).fill(CARD_TYPES.U_TURN),
  ...Array(2).fill(CARD_TYPES.BACK),
  ...Array(2).fill(CARD_TYPES.POWER_UP),
  ...Array(2).fill(CARD_TYPES.AGAIN),
];
