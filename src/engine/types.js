/**
 * Robo Rally engine types (JSDoc).
 * All coordinates use integer grid: (col, row).
 * Direction: 0=North/Up, 90=East/Right, 180=South/Down, 270=West/Left.
 */

/** @typedef {'N'|'E'|'S'|'W'} WallEdge */

/**
 * Wall edges are stored as "col,row-edge" e.g. "2,3-N" means north edge of cell (2,3)
 * @typedef {Record<string, boolean>} WallEdges
 */

/**
 * @typedef {Object} Conveyor
 * @property {number} direction - 0,90,180,270
 * @property {boolean} [express] - double arrow
 * @property {boolean} [rotating] - curved
 */

/**
 * @typedef {Object} Board
 * @property {number} width - Number of columns
 * @property {number} height - Number of rows
 * @property {WallEdges} walls - Map of "col,row-edge" -> true
 * @property {Record<string, Conveyor>} [conveyors] - "col,row" -> conveyor
 * @property {Record<string, 'L'|'R'>} [gears] - "col,row" -> L/R
 * @property {Record<string, { registers: number[], direction: number }>} [pushPanels] - "col,row" -> config
 * @property {Set<string>} [pits] - "col,row"
 * @property {{ col: number, row: number }[]} [checkpoints]
 * @property {number} [rebootCol]
 * @property {number} [rebootRow]
 */

/**
 * @typedef {Object} Robot
 * @property {string} id
 * @property {number} col
 * @property {number} row
 * @property {number} direction - 0, 90, 180, or 270
 * @property {boolean} [rebooted]
 * @property {string[]} [deck]
 * @property {string[]} [discard]
 * @property {string[]} [hand]
 * @property {(string|null)[]} [registers] - 5 slots, card type or null
 * @property {number} [energy]
 * @property {number} [nextCheckpoint] - index of next board.checkpoints[] to complete (0-based)
 */

/**
 * @typedef {Object} GameState
 * @property {Board} board
 * @property {Robot[]} robots
 * @property {{ col: number, row: number } | null} [antenna]
 * @property {number} [antennaDirection]
 * @property {'programming'|'activation'} [phase]
 * @property {number} [currentRegister] - 0-4 during activation
 * @property {string} [winner] - robot id when checkpoints completed
 */

export const DIRECTIONS = {
  NORTH: 0,
  EAST: 90,
  SOUTH: 180,
  WEST: 270,
};
