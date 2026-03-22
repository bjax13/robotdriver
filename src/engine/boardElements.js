/**
 * Board elements: conveyors, gears, push panels, pits.
 * Resolve after each register during activation.
 */

import { inBounds, hasWall } from './board.js';
import { directionDelta } from './movement.js';

/**
 * Resolve conveyors: express first (2 spaces), then normal (1 space).
 * Robots that end on conveyor move. Conveyor into occupied non-belt: stop.
 * @param {import('./types').GameState} state
 * @param {Map<string, string>} cellToRobotId - "col,row" -> robotId
 * @returns {{ updates: Map<string, { col: number, row: number }> }}
 */
export function resolveConveyors(state, cellToRobotId) {
  const board = state.board;
  if (!board.conveyors) return { updates: new Map() };

  const updates = new Map();
  const express = [];
  const normal = [];

  for (const [key, conv] of Object.entries(board.conveyors)) {
    const [col, row] = key.split(',').map(Number);
    const robotId = cellToRobotId.get(key);
    if (!robotId) continue;
    if (conv.express) express.push({ col, row, robotId, ...conv });
    else normal.push({ col, row, robotId, ...conv });
  }

  for (const list of [express, normal]) {
    const steps = list[0]?.express ? 2 : 1;
    for (const { col, row, robotId, direction } of list) {
      const { dCol, dRow } = directionDelta(direction);
      let c = col;
      let r = row;
      let moved = 0;
      for (let s = 0; s < steps; s++) {
        if (hasWall(board, c, r, direction)) break;
        const nextC = c + dCol;
        const nextR = r + dRow;
        if (!inBounds(board, nextC, nextR)) break;
        const nextKey = `${nextC},${nextR}`;
        if (cellToRobotId.get(nextKey)) break;
        c = nextC;
        r = nextR;
        moved++;
      }
      if (moved > 0) {
        updates.set(robotId, { col: c, row: r });
        cellToRobotId.delete(`${col},${row}`);
        cellToRobotId.set(`${c},${r}`, robotId);
      }
    }
  }
  return { updates };
}

/**
 * Resolve gears: rotate robots on red (L) or green (R) gears.
 * @param {import('./types').GameState} state
 * @returns {Map<string, { direction: number }>}
 */
export function resolveGears(state) {
  const board = state.board;
  if (!board.gears) return new Map();
  const updates = new Map();
  for (const robot of state.robots) {
    if (robot.rebooted) continue;
    const gear = board.gears[`${robot.col},${robot.row}`];
    if (!gear) continue;
    const dir = robot.direction;
    const newDir = gear === 'L' ? (dir - 90 + 360) % 360 : (dir + 90) % 360;
    updates.set(robot.id, { direction: newDir });
  }
  return updates;
}

/**
 * Resolve push panels for given register. Panel pushes in its facing direction.
 * @param {import('./types').GameState} state
 * @param {number} registerIndex - 1-based in rules, we use 0-based
 * @returns {Map<string, { col: number, row: number }>}
 */
export function resolvePushPanels(state, registerIndex) {
  const board = state.board;
  if (!board.pushPanels) return new Map();
  const reg = registerIndex + 1;
  const updates = new Map();
  for (const [key, config] of Object.entries(board.pushPanels)) {
    const cfg = Array.isArray(config) ? { registers: config, direction: 180 } : config;
    if (!cfg.registers.includes(reg)) continue;
    const [col, row] = key.split(',').map(Number);
    const robot = state.robots.find((r) => !r.rebooted && r.col === col && r.row === row);
    if (!robot) continue;
    const dir = cfg.direction ?? 180;
    const { dCol, dRow } = directionDelta(dir);
    const nextCol = col + dCol;
    const nextRow = row + dRow;
    if (inBounds(board, nextCol, nextRow) && !hasWall(board, col, row, dir)) {
      updates.set(robot.id, { col: nextCol, row: nextRow });
    }
  }
  return updates;
}
