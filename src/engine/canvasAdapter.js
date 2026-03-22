/**
 * Maps grid coordinates to pixel positions for canvas drawing.
 * Cell (0,0) maps to center of top-left cell.
 */

/** @param {number} col
 *  @param {number} row
 *  @param {number} cellSize
 *  @returns {{ x: number, y: number }}
 */
export function toPixelCenter(col, row, cellSize) {
  const half = cellSize / 2;
  return {
    x: col * cellSize + half,
    y: row * cellSize + half,
  };
}

/**
 * Convert engine wall edges to the format expected by drawWalls (pixel segments).
 * Each wall edge becomes a line segment.
 * @param {import('./types').Board} board
 * @param {number} cellSize
 * @returns {{ x: number, y: number, length: number, horizontal: boolean }[]}
 */
export function boardToWallSegments(board, cellSize) {
  const segments = [];
  const seen = new Set();

  for (const key of Object.keys(board.walls)) {
    if (!board.walls[key]) continue;
    const match = key.match(/^(\d+),(\d+)-(N|E|S|W)$/);
    if (!match) continue;
    const col = parseInt(match[1], 10);
    const row = parseInt(match[2], 10);
    const edge = match[3];

    // Each edge is shared between two cells; only emit once
    const edgeId = edge === 'N' ? `v-${col}-${row}` :
      edge === 'S' ? `v-${col}-${row + 1}` :
      edge === 'W' ? `h-${col}-${row}` :
      `h-${col + 1}-${row}`;
    if (seen.has(edgeId)) continue;
    seen.add(edgeId);

    if (edge === 'N' || edge === 'S') {
      segments.push({
        x: col * cellSize,
        y: (edge === 'N' ? row : row + 1) * cellSize,
        length: cellSize,
        horizontal: true,
      });
    } else {
      segments.push({
        x: (edge === 'W' ? col : col + 1) * cellSize,
        y: row * cellSize,
        length: cellSize,
        horizontal: false,
      });
    }
  }

  return segments;
}
