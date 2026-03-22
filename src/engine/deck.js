/**
 * Deck operations: shuffle, draw, create.
 */

import { DEFAULT_DECK } from './cards.js';

/** @param {number} n
 *  @returns {number} random int [0, n)
 */
function randomInt(n) {
  return Math.floor(Math.random() * n);
}

/** Fisher-Yates shuffle
 *  @param {T[]} arr
 *  @returns {T[]}
 *  @template T
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Draw n cards from deck. If deck has fewer, shuffle discard into deck first.
 * @param {string[]} deck
 * @param {string[]} discard
 * @param {number} n
 * @returns {{ deck: string[], discard: string[], drawn: string[] }}
 */
export function draw(deck, discard, n) {
  let d = [...deck];
  let disc = [...discard];
  const drawn = [];

  for (let i = 0; i < n; i++) {
    if (d.length === 0) {
      d = shuffle(disc);
      disc = [];
    }
    if (d.length === 0) break;
    drawn.push(d.pop());
  }

  return { deck: d, discard: disc, drawn };
}

/**
 * Create a fresh shuffled deck from default composition.
 * @returns {string[]}
 */
export function createDeck() {
  return shuffle([...DEFAULT_DECK]);
}
