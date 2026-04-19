/**
 * Board elements: conveyors, gears, push panels, pits.
 * Resolve after each register during activation.
 *
 * Conveyors and push panels use hasWall from board geometry only — not
 * movementPassability.js. Robot traits such as wallPhasing apply to programmed
 * movement (applyMove), not belt/panel pushes.
 */

import { inBounds, hasWall } from './board.js';
import { directionDelta } from './movement.js';

/**
 * @param {import('./types').GameState} state
 * @param {Map<string, { col?: number, row?: number, direction?: number }>} updates
 */
function applyRobotPatches(state, updates) {
  if (updates.size === 0) return state;
  const robots = state.robots.map((robot) => {
    const u = updates.get(robot.id);
    if (!u) return robot;
    const next = { ...robot };
    for (const k of ['col', 'row', 'direction']) {
      if (u[k] !== undefined) next[k] = u[k];
    }
    return next;
  });
  return { ...state, robots };
}

/**
 * Advance each robot that is standing on an **express** belt by at most one grid cell,
 * following that tile's arrow. Does not move robots on normal belts (those use
 * {@link resolveConveyors} in a full conveyors phase).
 *
 * Intended for stepped visualization in the testing gallery. A full register conveyors step
 * still runs {@link resolveConveyors}, which slides a robot along the entire express chain
 * in one resolution.
 *
 * @param {import('./types').GameState} state
 * @returns {import('./types').GameState}
 */
export function advanceExpressBeltsOneStep(state) {
  const board = state.board;
  if (!board?.conveyors) return state;

  const cellToRobotId = new Map();
  for (const r of state.robots) {
    if (!r.rebooted) cellToRobotId.set(`${r.col},${r.row}`, r.id);
  }

  const updates = new Map();

  for (const robot of state.robots) {
    if (robot.rebooted) continue;
    const key = `${robot.col},${robot.row}`;
    const convHere = board.conveyors[key];
    if (!convHere?.express) continue;

    const robotId = robot.id;
    if (cellToRobotId.get(key) !== robotId) continue;

    let c = robot.col;
    let r = robot.row;
    const direction = convHere.direction;
    let moved = false;

    if (!hasWall(board, c, r, direction)) {
      const { dCol, dRow } = directionDelta(direction);
      const nextC = c + dCol;
      const nextR = r + dRow;
      if (inBounds(board, nextC, nextR)) {
        const nextKey = `${nextC},${nextR}`;
        const blocking = cellToRobotId.get(nextKey);
        if (!blocking || blocking === robotId) {
          cellToRobotId.delete(`${c},${r}`);
          c = nextC;
          r = nextR;
          cellToRobotId.set(`${c},${r}`, robotId);
          moved = true;
        }
      }
    }

    const beltFacing = board.conveyors[`${c},${r}`]?.direction;
    const patch = {};
    if (moved) {
      patch.col = c;
      patch.row = r;
    }
    if (beltFacing !== undefined) patch.direction = beltFacing;
    if (Object.keys(patch).length > 0) updates.set(robotId, patch);
  }

  return applyRobotPatches(state, updates);
}

/**
 * Gallery helper: two express tile advances — matches “2×” express belts moving two grid cells
 * per conveyors visualization step (see {@link advanceExpressBeltsOneStep} for single-tile motion).
 * @param {import('./types').GameState} state
 * @returns {import('./types').GameState}
 */
export function advanceExpressBeltsTwoSteps(state) {
  return advanceExpressBeltsOneStep(advanceExpressBeltsOneStep(state));
}

/**
 * Resolve conveyors: express first, then normal.
 * Express: move along consecutive express tiles (same phase), one grid step per tile,
 * following each tile's direction until leaving the express belt chain (Robo Rally style).
 * Normal: one step along that belt's direction (existing single-step behavior).
 * Conveyor into occupied cell: stop.
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

  const maxExpressSteps = Object.values(board.conveyors).filter((c) => c.express).length;

  for (const [key, conv] of Object.entries(board.conveyors)) {
    const [col, row] = key.split(',').map(Number);
    const robotId = cellToRobotId.get(key);
    if (!robotId) continue;
    if (conv.express) express.push({ col, row, robotId, ...conv });
    else normal.push({ col, row, robotId, ...conv });
  }

  for (const { col: startCol, row: startRow, robotId } of express) {
    const startKey = `${startCol},${startRow}`;
    if (cellToRobotId.get(startKey) !== robotId) continue;

    let c = startCol;
    let r = startRow;
    let moved = 0;

    while (moved < maxExpressSteps) {
      const hereKey = `${c},${r}`;
      const convHere = board.conveyors?.[hereKey];
      if (!convHere?.express) break;

      const direction = convHere.direction;
      if (hasWall(board, c, r, direction)) break;
      const { dCol, dRow } = directionDelta(direction);
      const nextC = c + dCol;
      const nextR = r + dRow;
      if (!inBounds(board, nextC, nextR)) break;
      const nextKey = `${nextC},${nextR}`;
      const blocking = cellToRobotId.get(nextKey);
      if (blocking && blocking !== robotId) break;

      cellToRobotId.delete(`${c},${r}`);
      c = nextC;
      r = nextR;
      cellToRobotId.set(`${c},${r}`, robotId);
      moved++;
    }

    const beltFacing = board.conveyors?.[`${c},${r}`]?.direction;
    const patch = {};
    if (moved > 0) {
      patch.col = c;
      patch.row = r;
    }
    if (beltFacing !== undefined) patch.direction = beltFacing;
    if (Object.keys(patch).length > 0) updates.set(robotId, patch);
  }

  for (const { col, row, robotId, direction } of normal) {
    const { dCol, dRow } = directionDelta(direction);
    let c = col;
    let r = row;
    let moved = 0;
    const steps = 1;
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
    const beltFacing = board.conveyors?.[`${c},${r}`]?.direction;
    const patch = {};
    if (moved > 0) {
      patch.col = c;
      patch.row = r;
      cellToRobotId.delete(`${col},${row}`);
      cellToRobotId.set(`${c},${r}`, robotId);
    }
    if (beltFacing !== undefined) patch.direction = beltFacing;
    if (Object.keys(patch).length > 0) updates.set(robotId, patch);
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
