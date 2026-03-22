/**
 * Shortest path length on the grid for autoplay scoring (walls + pits; no robots).
 */

import { inBounds, hasWall, isPit } from './board.js';
import { directionDelta } from './movement.js';

const CARDINAL_DIRS = [0, 90, 180, 270];

/**
 * Minimum number of single-cell moves from (col,row) to (goalCol,goalRow),
 * respecting walls and not entering pit cells. Ignores robot occupancy.
 * @param {import('./types').Board} board
 * @param {number} col
 * @param {number} row
 * @param {number} goalCol
 * @param {number} goalRow
 * @returns {number} Infinity if unreachable or start invalid
 */
export function shortestGridDistance(board, col, row, goalCol, goalRow) {
  if (col === goalCol && row === goalRow) return 0;
  if (!inBounds(board, col, row)) return Infinity;
  if (isPit(board, col, row)) return Infinity;

  const w = board.width;
  const h = board.height;
  const visited = new Uint8Array(w * h);
  const idx = (c, r) => r * w + c;
  const q = [];
  let head = 0;

  visited[idx(col, row)] = 1;
  q.push(col, row, 0);

  while (head < q.length) {
    const c = q[head++];
    const r = q[head++];
    const dist = q[head++];

    if (c === goalCol && r === goalRow) return dist;

    for (const dir of CARDINAL_DIRS) {
      if (hasWall(board, c, r, dir)) continue;
      const { dCol, dRow } = directionDelta(dir);
      const nc = c + dCol;
      const nr = r + dRow;
      if (!inBounds(board, nc, nr)) continue;
      if (isPit(board, nc, nr)) continue;
      const i = idx(nc, nr);
      if (visited[i]) continue;
      visited[i] = 1;
      q.push(nc, nr, dist + 1);
    }
  }

  return Infinity;
}
