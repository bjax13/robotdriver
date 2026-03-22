/**
 * Course definitions. Load board layout from JSON-compatible config.
 */

import { createBoard } from './board.js';

/**
 * Parse course JSON into a board config.
 * @param {Object} course
 * @param {number} course.width
 * @param {number} course.height
 * @param {{ col: number, row: number, edge: string }[]} [course.walls]
 * @param {{ col: number, row: number, direction: number, express?: boolean }[]} [course.conveyors]
 * @param {{ col: number, row: number, type: 'L'|'R' }[]} [course.gears]
 * @param {{ col: number, row: number }[]} [course.checkpoints]
 * @param {{ col: number, row: number }[]} [course.pits]
 * @param {{ col: number, row: number }[]} [course.reboot]
 * @returns {import('./types').Board}
 */
export function loadCourse(course) {
  const board = createBoard(course.width, course.height, course.walls || []);

  if (course.conveyors?.length) {
    board.conveyors = {};
    for (const c of course.conveyors) {
      board.conveyors[`${c.col},${c.row}`] = {
        direction: c.direction,
        express: c.express ?? false,
      };
    }
  }

  if (course.gears?.length) {
    board.gears = {};
    for (const g of course.gears) {
      board.gears[`${g.col},${g.row}`] = g.type;
    }
  }

  if (course.checkpoints?.length) {
    board.checkpoints = course.checkpoints;
  }

  if (course.pits?.length) {
    board.pits = {};
    for (const p of course.pits) {
      board.pits[`${p.col},${p.row}`] = true;
    }
  }

  if (course.reboot?.[0]) {
    board.rebootCol = course.reboot[0].col;
    board.rebootRow = course.reboot[0].row;
  }

  return board;
}

/** Dizzy Highway - simplified starter course */
export const DIZZY_HIGHWAY = {
  width: 10,
  height: 10,
  walls: [
    { col: 0, row: 0, edge: 'E' },
    { col: 0, row: 1, edge: 'E' },
    { col: 0, row: 2, edge: 'E' },
  ],
  checkpoints: [{ col: 8, row: 5 }],
  reboot: [{ col: 0, row: 0 }],
};
