/**
 * Random checkpoint placement and initial facing toward first flag.
 */

import { hasWall, inBounds, isPit } from './board.js';
import { directionDelta } from './movement.js';

const ORDERED_DIRECTIONS = [0, 90, 180, 270];

/**
 * @param {unknown[]} arr
 * @param {() => number} rand
 */
function shuffleInPlace(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * @param {import('./types').Board} board
 * @param {number} count
 * @param {() => number} rand
 * @param {Object} [options]
 * @param {Set<string>} [options.excludeCells] - keys "col,row"
 * @param {boolean} [options.excludeStartRow] - skip row 0
 */
export function placeRandomCheckpoints(board, count, rand, options = {}) {
  const excludeCells = options.excludeCells ?? new Set();
  const excludeStartRow = options.excludeStartRow ?? true;

  const candidates = [];
  for (let row = 0; row < board.height; row++) {
    if (excludeStartRow && row === 0) continue;
    for (let col = 0; col < board.width; col++) {
      const key = `${col},${row}`;
      if (excludeCells.has(key)) continue;
      candidates.push({ col, row });
    }
  }

  if (candidates.length < count) {
    board.checkpoints = candidates;
    return;
  }

  shuffleInPlace(candidates, rand);
  board.checkpoints = candidates.slice(0, count);
}

/**
 * First step is legal: no wall, in bounds, not a pit.
 * @param {import('./types').Board} board
 * @param {number} col
 * @param {number} row
 * @param {number} direction
 */
function firstStepClear(board, col, row, direction) {
  if (hasWall(board, col, row, direction)) return false;
  const { dCol, dRow } = directionDelta(direction);
  const nc = col + dCol;
  const nr = row + dRow;
  if (!inBounds(board, nc, nr)) return false;
  if (isPit(board, nc, nr)) return false;
  return true;
}

/**
 * @param {import('./types').Board} board
 * @param {number} col
 * @param {number} row
 * @param {number} targetCol
 * @param {number} targetRow
 * @returns {number} direction 0, 90, 180, or 270
 */
export function chooseInitialFacing(board, col, row, targetCol, targetRow) {
  const dc = targetCol - col;
  const dr = targetRow - row;

  let bestDir = null;
  let bestScore = -Infinity;

  for (const d of ORDERED_DIRECTIONS) {
    if (!firstStepClear(board, col, row, d)) continue;
    const { dCol, dRow } = directionDelta(d);
    const score = dc * dCol + dr * dRow;
    if (score > bestScore) {
      bestScore = score;
      bestDir = d;
    }
  }

  if (bestDir !== null) return bestDir;

  for (const d of ORDERED_DIRECTIONS) {
    if (!hasWall(board, col, row, d)) return d;
  }

  return 90;
}
