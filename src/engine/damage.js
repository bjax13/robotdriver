/**
 * Damage: SPAM cards, reboot flow.
 */

import { CARD_TYPES } from './cards.js';
import { shuffle } from './deck.js';

export const SPAM_CARDS_PER_HIT = 1;

/** Max damage tokens (matches draw cap 9 − damage). */
export const MAX_DAMAGE = 9;

/**
 * Add SPAM damage to robot's discard. These get shuffled into deck when drawing.
 * @param {import('./types').Robot} robot
 * @param {number} count
 * @returns {import('./types').Robot}
 */
export function addDamage(robot, count) {
  const spam = Array(count).fill(CARD_TYPES.SPAM);
  return {
    ...robot,
    discard: [...(robot.discard || []), ...spam],
  };
}

/**
 * When executing SPAM register: draw from deck, execute that card instead.
 * @param {string[]} deck
 * @param {string[]} discard
 * @returns {{ card: string, deck: string[], discard: string[] }}
 */
export function drawForSpam(deck, discard) {
  let d = [...deck];
  let disc = [...discard];
  if (d.length === 0) {
    d = shuffle(disc);
    disc = [];
  }
  const card = d.length > 0 ? d.pop() : CARD_TYPES.MOVE1;
  return { card, deck: d, discard: disc };
}

/**
 * Reboot robot: move to reboot token, clear registers, add SPAM.
 * @param {import('./types').Robot} robot
 * @param {number} rebootCol
 * @param {number} rebootRow
 * @param {number} [spamCount=1]
 * @returns {import('./types').Robot}
 */
export function rebootRobot(robot, rebootCol, rebootRow, spamCount = 1) {
  const spam = Array(spamCount).fill(CARD_TYPES.SPAM);
  return {
    ...robot,
    col: rebootCol,
    row: rebootRow,
    direction: 90,
    rebooted: false,
    registers: [],
    discard: [...(robot.discard || []), ...spam],
  };
}
