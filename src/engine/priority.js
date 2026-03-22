/**
 * Priority ordering by distance to antenna.
 * Closest acts first; ties broken by clockwise from antenna pointer.
 * Antenna pointer direction: 0=N, 90=E, 180=S, 270=W (optional for tie-break).
 */

/**
 * Manhattan distance from (col, row) to antenna.
 * @param {number} col
 * @param {number} row
 * @param {{ col: number, row: number }} antenna
 * @returns {number}
 */
export function distanceToAntenna(col, row, antenna) {
  return Math.abs(col - antenna.col) + Math.abs(row - antenna.row);
}

/**
 * Sort robots by priority: closest to antenna first.
 * Ties: use clockwise order from antenna (antenna at 0,0 with default pointer E = 90:
 * E then S then W then N by grid position).
 * @param {import('./types').Robot[]} robots
 * @param {{ col: number, row: number }} antenna
 * @param {number} [antennaDirection=90] - Direction antenna points (for tie-break)
 * @returns {import('./types').Robot[]}
 */
export function sortRobotsByPriority(robots, antenna, antennaDirection = 90) {
  return [...robots].sort((a, b) => {
    const distA = distanceToAntenna(a.col, a.row, antenna);
    const distB = distanceToAntenna(b.col, b.row, antenna);
    if (distA !== distB) return distA - distB;
    return tieBreakClockwise(a, b, antenna, antennaDirection);
  });
}

/**
 * When equidistant, the robot clockwise from antenna pointer goes first.
 * @param {import('./types').Robot} a
 * @param {import('./types').Robot} b
 * @param {{ col: number, row: number }} antenna
 * @param {number} antennaDirection
 * @returns {number}
 */
function tieBreakClockwise(a, b, antenna, antennaDirection) {
  const angleA = angleFromAntenna(a.col, a.row, antenna);
  const angleB = angleFromAntenna(b.col, b.row, antenna);
  const orderA = clockwiseOrder(angleA, antennaDirection);
  const orderB = clockwiseOrder(angleB, antennaDirection);
  return orderA - orderB;
}

function angleFromAntenna(col, row, antenna) {
  return Math.atan2(row - antenna.row, col - antenna.col);
}

function clockwiseOrder(angle, antennaDirection) {
  const base = (antennaDirection * Math.PI) / 180;
  let diff = angle - base;
  while (diff < 0) diff += 2 * Math.PI;
  while (diff >= 2 * Math.PI) diff -= 2 * Math.PI;
  return diff;
}
