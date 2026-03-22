/**
 * Board utilities: wall queries, bounds checking.
 * Walls are stored as edges: "col,row-edge" for N/E/S/W edges of each cell.
 */

/** @param {number} col
 *  @param {number} row
 *  @param {import('./types').WallEdge} edge
 *  @returns {string}
 */
export function wallKey(col, row, edge) {
  return `${col},${row}-${edge}`;
}

/**
 * @param {import('./types').Board} board
 * @param {number} col
 * @param {number} row
 * @returns {boolean}
 */
export function inBounds(board, col, row) {
  return col >= 0 && col < board.width && row >= 0 && row < board.height;
}

/**
 * Check if there is a wall blocking movement from (col, row) toward the given direction.
 * Direction: 0=N, 90=E, 180=S, 270=W.
 * @param {import('./types').Board} board
 * @param {number} col
 * @param {number} row
 * @param {number} direction
 * @returns {boolean} true if movement in that direction is blocked
 */
export function hasWall(board, col, row, direction) {
  const edge = directionToEdge(direction);
  return !!board.walls[wallKey(col, row, edge)];
}

function directionToEdge(direction) {
  const map = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
  return map[direction];
}

/**
 * Create a board with optional walls.
 * @param {number} width
 * @param {number} height
 * @param {{ col: number, row: number, edge: import('./types').WallEdge }[]} [wallList]
 * @returns {import('./types').Board}
 */
export function createBoard(width, height, wallList = []) {
  const walls = {};
  for (const { col, row, edge } of wallList) {
    walls[wallKey(col, row, edge)] = true;
  }
  return { width, height, walls };
}

/**
 * @param {import('./types').Board} board
 * @param {number} col
 * @param {number} row
 * @returns {boolean}
 */
export function isConveyor(board, col, row) {
  return !!(board.conveyors && board.conveyors[`${col},${row}`]);
}

/** @param {number} col @param {number} row @returns {string} */
function cellKey(col, row) {
  return `${col},${row}`;
}

export function isPit(board, col, row) {
  if (!board.pits) return false;
  const key = cellKey(col, row);
  return board.pits instanceof Set ? board.pits.has(key) : !!board.pits[key];
}
