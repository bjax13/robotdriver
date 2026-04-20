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
    const cornerDelta =
      moved && beltFacing !== undefined ? (beltFacing - direction + 360) % 360 : null;
    const shouldTurnOnCorner = cornerDelta === 90 || cornerDelta === 270;
    const patch = {};
    if (moved) {
      patch.col = c;
      patch.row = r;
    }
    if (shouldTurnOnCorner) {
      patch.direction =
        cornerDelta === 90
          ? (robot.direction + 90) % 360
          : (robot.direction + 270) % 360;
    }
    if (Object.keys(patch).length > 0) updates.set(robotId, patch);
  }

  const nextState = applyRobotPatches(state, updates);
  return nextState;
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
 * Simulate sliding along express tiles; updates a clone of occupancy so this robot can
 * traverse its own path while other robots stay at phase-start positions.
 * @param {import('./types').GameState['board']} board
 * @param {Map<string, string>} occ
 * @param {string} robotId
 * @param {number} startCol
 * @param {number} startRow
 * @param {number} maxSteps
 */
function simulateExpressChain(board, occ, robotId, startCol, startRow, maxSteps) {
  let c = startCol;
  let r = startRow;
  let moved = 0;
  const startKey = `${startCol},${startRow}`;
  if (occ.get(startKey) !== robotId) {
    return { endCol: startCol, endRow: startRow, moved: 0 };
  }

  while (moved < maxSteps) {
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
    const blocking = occ.get(nextKey);
    if (blocking && blocking !== robotId) break;

    occ.delete(`${c},${r}`);
    c = nextC;
    r = nextR;
    occ.set(`${c},${r}`, robotId);
    moved++;
  }

  return { endCol: c, endRow: r, moved };
}

/**
 * Resolve conveyors: express first, then normal.
 * Express: move along consecutive express tiles (same phase), one grid step per tile,
 * following each tile's direction until leaving the express belt chain (Robo Rally style).
 * Normal: one step along that belt's direction (existing single-step behavior).
 * Conveyor into occupied cell: stop.
 *
 * **Same-priority destination ties:** if two or more robots (all express in the express
 * phase, or all normal in the normal phase) would finish the phase on the same grid cell,
 * none of those moves occur — each stays on its belt (Robo Rally merge rule).
 * Express still runs before normal; a robot placed by express can block or be blocked in
 * the normal phase using post-express occupancy.
 * @param {import('./types').GameState} state
 * @param {Map<string, string>} cellToRobotId - "col,row" -> robotId (updated to match result)
 * @returns {{ updates: Map<string, { col: number, row: number }> }}
 */
export function resolveConveyors(state, cellToRobotId) {
  const board = state.board;
  if (!board.conveyors) return { updates: new Map() };

  const updates = new Map();

  const maxExpressSteps = Object.values(board.conveyors).filter((c) => c.express).length;

  /** @type {{ col: number, row: number, robotId: string }[]} */
  const expressStarters = [];
  for (const [key, conv] of Object.entries(board.conveyors)) {
    const [col, row] = key.split(',').map(Number);
    const robotId = cellToRobotId.get(key);
    if (!robotId || !conv.express) continue;
    expressStarters.push({ col, row, robotId });
  }

  const initialOcc = new Map(cellToRobotId);

  /** @type {{ robotId: string, startCol: number, startRow: number, endCol: number, endRow: number, moved: number }[]} */
  const expressPlans = [];
  for (const { col: startCol, row: startRow, robotId } of expressStarters) {
    const occ = new Map(initialOcc);
    const { endCol, endRow, moved } = simulateExpressChain(
      board,
      occ,
      robotId,
      startCol,
      startRow,
      maxExpressSteps
    );
    expressPlans.push({ robotId, startCol, startRow, endCol, endRow, moved });
  }

  /** @type {Map<string, string[]>} */
  const expressDestRobots = new Map();
  for (const p of expressPlans) {
    if (p.moved <= 0) continue;
    const dk = `${p.endCol},${p.endRow}`;
    const list = expressDestRobots.get(dk) ?? [];
    list.push(p.robotId);
    expressDestRobots.set(dk, list);
  }

  const expressCancelled = new Set();
  for (const [, ids] of expressDestRobots) {
    if (ids.length > 1) {
      for (const id of ids) expressCancelled.add(id);
    }
  }

  /** post-express occupancy */
  const afterExpress = new Map(initialOcc);
  for (const p of expressPlans) {
    if (p.moved <= 0) continue;
    if (expressCancelled.has(p.robotId)) continue;
    afterExpress.delete(`${p.startCol},${p.startRow}`);
    afterExpress.set(`${p.endCol},${p.endRow}`, p.robotId);
  }

  /** @type {Map<string, Record<string, number>>} */
  const expressPatches = new Map();
  for (const p of expressPlans) {
    const startBeltDir = board.conveyors[`${p.startCol},${p.startRow}`]?.direction;
    const endBeltDir = board.conveyors[`${p.endCol},${p.endRow}`]?.direction;
    const patch = {};
    if (p.moved > 0 && !expressCancelled.has(p.robotId)) {
      patch.col = p.endCol;
      patch.row = p.endRow;
      if (endBeltDir !== undefined) patch.direction = endBeltDir;
    } else {
      patch.col = p.startCol;
      patch.row = p.startRow;
      if (startBeltDir !== undefined) patch.direction = startBeltDir;
    }
    expressPatches.set(p.robotId, patch);
  }

  /** Normal belts: robots currently on a normal conveyor tile after express phase. */
  /** @type {{ col: number, row: number, robotId: string, direction: number }[]} */
  const normals = [];
  for (const [key, conv] of Object.entries(board.conveyors)) {
    if (conv.express) continue;
    const robotId = afterExpress.get(key);
    if (!robotId) continue;
    const [col, row] = key.split(',').map(Number);
    normals.push({ col, row, robotId, direction: conv.direction });
  }

  /** @type {{ robotId: string, startCol: number, startRow: number, endCol: number, endRow: number, moved: number }[]} */
  const normalPlans = [];
  for (const { col, row, robotId, direction } of normals) {
    const occ = new Map(afterExpress);
    const startKey = `${col},${row}`;
    if (occ.get(startKey) !== robotId) continue;

    let moved = 0;
    let c = col;
    let r = row;
    const { dCol, dRow } = directionDelta(direction);
    if (!hasWall(board, c, r, direction)) {
      const nextC = c + dCol;
      const nextR = r + dRow;
      if (inBounds(board, nextC, nextR)) {
        const nextKey = `${nextC},${nextR}`;
        if (!occ.get(nextKey)) {
          occ.delete(`${c},${r}`);
          c = nextC;
          r = nextR;
          occ.set(nextKey, robotId);
          moved = 1;
        }
      }
    }
    normalPlans.push({ robotId, startCol: col, startRow: row, endCol: c, endRow: r, moved });
  }

  /** @type {Map<string, string[]>} */
  const normalDestRobots = new Map();
  for (const p of normalPlans) {
    if (p.moved <= 0) continue;
    const dk = `${p.endCol},${p.endRow}`;
    const list = normalDestRobots.get(dk) ?? [];
    list.push(p.robotId);
    normalDestRobots.set(dk, list);
  }

  const normalCancelled = new Set();
  for (const [, ids] of normalDestRobots) {
    if (ids.length > 1) {
      for (const id of ids) normalCancelled.add(id);
    }
  }

  for (const p of normalPlans) {
    const startBeltDir = board.conveyors[`${p.startCol},${p.startRow}`]?.direction;
    const endBeltDir = board.conveyors[`${p.endCol},${p.endRow}`]?.direction;
    const patch = {};
    if (p.moved > 0 && !normalCancelled.has(p.robotId)) {
      patch.col = p.endCol;
      patch.row = p.endRow;
      if (endBeltDir !== undefined) patch.direction = endBeltDir;
    } else {
      patch.col = p.startCol;
      patch.row = p.startRow;
      if (startBeltDir !== undefined) patch.direction = startBeltDir;
    }
    updates.set(p.robotId, patch);
  }

  // Robots that did not get a normal-belt patch still use express-only resolution
  for (const [robotId, patch] of expressPatches) {
    if (!updates.has(robotId)) updates.set(robotId, patch);
  }

  // Keep caller's cell map in sync with final positions
  cellToRobotId.clear();
  for (const [k, v] of afterExpress) cellToRobotId.set(k, v);
  for (const p of normalPlans) {
    if (p.moved <= 0 || normalCancelled.has(p.robotId)) continue;
    cellToRobotId.delete(`${p.startCol},${p.startRow}`);
    cellToRobotId.set(`${p.endCol},${p.endRow}`, p.robotId);
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
