/**
 * Deck operations: shuffle, draw, create.
 */

import { DEFAULT_DECK } from './cards.js';
import { mulberry32 } from './random.js';

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
 * @param {string[]} arr
 * @param {() => number} rand - returns [0,1)
 */
function shuffleWithRand(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
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
 * @param {number} [seed] - if provided, shuffle is deterministic (per-robot uniqueness).
 * @returns {string[]}
 */
export function createDeck(seed) {
  const cards = [...DEFAULT_DECK];
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return shuffleWithRand(cards, mulberry32(seed >>> 0));
  }
  return shuffle(cards);
}
