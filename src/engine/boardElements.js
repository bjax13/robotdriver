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
 * runs {@link resolveConveyors}, which applies repeated belt “movement waves” (see there).
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
 * One express-tile step from static occupancy (no mutation). Matches
 * {@link advanceExpressBeltsOneStep} motion + corner heading rules.
 * @returns {{ nextC: number, nextR: number, direction?: number } | null}
 */
function tryExpressOneStepFromOcc(board, occ, robot) {
  const key = `${robot.col},${robot.row}`;
  const convHere = board.conveyors[key];
  if (!convHere?.express) return null;
  if (occ.get(key) !== robot.id) return null;

  const direction = convHere.direction;
  let c = robot.col;
  let r = robot.row;
  let moved = false;

  if (!hasWall(board, c, r, direction)) {
    const { dCol, dRow } = directionDelta(direction);
    const nextC = c + dCol;
    const nextR = r + dRow;
    if (inBounds(board, nextC, nextR)) {
      const nextKey = `${nextC},${nextR}`;
      const blocking = occ.get(nextKey);
      if (!blocking || blocking === robot.id) {
        c = nextC;
        r = nextR;
        moved = true;
      }
    }
  }

  if (!moved) return null;

  const beltFacing = board.conveyors[`${c},${r}`]?.direction;
  const cornerDelta =
    beltFacing !== undefined ? (beltFacing - direction + 360) % 360 : null;
  const shouldTurnOnCorner = cornerDelta === 90 || cornerDelta === 270;
  const patch = { nextC: c, nextR: r };
  if (shouldTurnOnCorner) {
    patch.direction =
      cornerDelta === 90
        ? (robot.direction + 90) % 360
        : (robot.direction + 270) % 360;
  }
  return patch;
}

/**
 * One normal conveyor step from static occupancy.
 * @returns {{ nextC: number, nextR: number } | null}
 */
function tryNormalOneStepFromOcc(board, occ, robot) {
  const key = `${robot.col},${robot.row}`;
  const convHere = board.conveyors[key];
  if (!convHere || convHere.express) return null;
  if (occ.get(key) !== robot.id) return null;

  const direction = convHere.direction;
  const { dCol, dRow } = directionDelta(direction);
  if (hasWall(board, robot.col, robot.row, direction)) return null;
  const nextC = robot.col + dCol;
  const nextR = robot.row + dRow;
  if (!inBounds(board, nextC, nextR)) return null;
  const nextKey = `${nextC},${nextR}`;
  if (occ.get(nextKey)) return null;
  return { nextC, nextR };
}

/**
 * Resolve conveyors using **movement waves** per register (Robo Rally–style timing):
 *
 * - **Wave 1:** (a) every robot on an **express** tile moves **one** belt space (ties among
 *   express-only proposals cancel); then (b) every robot on a **normal** tile moves **one**
 *   space (ties among normal-only proposals cancel). Occupancy updates between (a) and (b).
 * - **Wave 2+:** one step for every robot still on **any** conveyor (express or normal),
 *   all proposals resolved **together** — any destination with more than one claimant
 *   cancels **all** moves onto that cell (express vs normal have the **same** priority here).
 *
 * Waves repeat until no robot moves in a full cycle. Express and normal each have a per-register
 * step budget capped by the number of express vs normal conveyor tiles on the board (same spirit
 * as the legacy express chain cap). Conveyor into an occupied cell still blocks; heading follows
 * belt arrows at the resting tile when on a conveyor.
 *
 * @param {import('./types').GameState} state
 * @param {Map<string, string>} cellToRobotId - "col,row" -> robotId (updated to match result)
 * @returns {{ updates: Map<string, { col: number, row: number }> }}
 */
export function resolveConveyors(state, cellToRobotId) {
  const board = state.board;
  if (!board.conveyors) return { updates: new Map() };

  const maxWaves =
    4 + Object.keys(board.conveyors).length + state.robots.filter((r) => !r.rebooted).length;

  /** @type {Map<string, { col: number, row: number, direction: number }>} */
  const pos = new Map();
  for (const r of state.robots) {
    if (r.rebooted) continue;
    pos.set(r.id, { col: r.col, row: r.row, direction: r.direction });
  }

  let occ = new Map(cellToRobotId);

  const maxExpressTileCount = Object.values(board.conveyors).filter((c) => c.express).length;
  const maxNormalTileCount = Object.values(board.conveyors).filter((c) => c && !c.express).length;
  /** Remaining express grid steps this register (same cap as legacy full-chain slide). */
  const expressRemaining = new Map();
  /** Remaining normal-belt steps this register (capped like express — chains need multiple waves). */
  const normalRemaining = new Map();
  for (const [id, p] of pos) {
    const k = `${p.col},${p.row}`;
    const conv = board.conveyors[k];
    if (conv?.express) expressRemaining.set(id, maxExpressTileCount);
    else if (conv && !conv.express) normalRemaining.set(id, maxNormalTileCount);
  }

  let movedInCycle = true;
  let wave = 0;

  while (movedInCycle && wave < maxWaves) {
    wave += 1;
    movedInCycle = false;

    if (wave === 1) {
      const snapA = new Map(occ);
      /** @type {{ id: string, nextC: number, nextR: number, direction?: number }[]} */
      const expProps = [];
      for (const [id, p] of pos) {
        if ((expressRemaining.get(id) ?? 0) <= 0) continue;
        const robot = { id, col: p.col, row: p.row, direction: p.direction };
        const t = tryExpressOneStepFromOcc(board, snapA, robot);
        if (!t) continue;
        expProps.push({
          id,
          nextC: t.nextC,
          nextR: t.nextR,
          direction: t.direction,
        });
      }

      const expDest = new Map();
      for (const pr of expProps) {
        const dk = `${pr.nextC},${pr.nextR}`;
        const list = expDest.get(dk) ?? [];
        list.push(pr.id);
        expDest.set(dk, list);
      }
      const expCancelled = new Set();
      for (const [, ids] of expDest) {
        if (ids.length > 1) for (const id of ids) expCancelled.add(id);
      }

      for (const pr of expProps) {
        if (expCancelled.has(pr.id)) continue;
        const p = pos.get(pr.id);
        if (!p) continue;
        occ.delete(`${p.col},${p.row}`);
        occ.set(`${pr.nextC},${pr.nextR}`, pr.id);
        p.col = pr.nextC;
        p.row = pr.nextR;
        if (pr.direction !== undefined) p.direction = pr.direction;
        expressRemaining.set(pr.id, (expressRemaining.get(pr.id) ?? 0) - 1);
        movedInCycle = true;
      }

      const snapB = new Map(occ);
      /** @type {{ id: string, nextC: number, nextR: number }[]} */
      const normProps = [];
      for (const [id, p] of pos) {
        if ((normalRemaining.get(id) ?? 0) <= 0) continue;
        const robot = { id, col: p.col, row: p.row, direction: p.direction };
        const t = tryNormalOneStepFromOcc(board, snapB, robot);
        if (!t) continue;
        normProps.push({ id, nextC: t.nextC, nextR: t.nextR });
      }

      const normDest = new Map();
      for (const pr of normProps) {
        const dk = `${pr.nextC},${pr.nextR}`;
        const list = normDest.get(dk) ?? [];
        list.push(pr.id);
        normDest.set(dk, list);
      }
      const normCancelled = new Set();
      for (const [, ids] of normDest) {
        if (ids.length > 1) for (const id of ids) normCancelled.add(id);
      }

      for (const pr of normProps) {
        if (normCancelled.has(pr.id)) continue;
        const p = pos.get(pr.id);
        if (!p) continue;
        occ.delete(`${p.col},${p.row}`);
        occ.set(`${pr.nextC},${pr.nextR}`, pr.id);
        p.col = pr.nextC;
        p.row = pr.nextR;
        const beltDir = board.conveyors[`${pr.nextC},${pr.nextR}`]?.direction;
        if (beltDir !== undefined) p.direction = beltDir;
        normalRemaining.set(pr.id, (normalRemaining.get(pr.id) ?? 0) - 1);
        movedInCycle = true;
      }
    } else {
      const snap = new Map(occ);
      /** @type {{ id: string, nextC: number, nextR: number, direction?: number, kind: 'E'|'N' }[]} */
      const allProps = [];

      for (const [id, p] of pos) {
        const robot = { id, col: p.col, row: p.row, direction: p.direction };
        const k = `${p.col},${p.row}`;
        const conv = board.conveyors[k];
        if (!conv) continue;

        if (conv.express) {
          if ((expressRemaining.get(id) ?? 0) <= 0) continue;
          const t = tryExpressOneStepFromOcc(board, snap, robot);
          if (t) allProps.push({ id, nextC: t.nextC, nextR: t.nextR, direction: t.direction, kind: 'E' });
        } else {
          if ((normalRemaining.get(id) ?? 0) <= 0) continue;
          const t = tryNormalOneStepFromOcc(board, snap, robot);
          if (t) allProps.push({ id, nextC: t.nextC, nextR: t.nextR, kind: 'N' });
        }
      }

      const destMap = new Map();
      for (const pr of allProps) {
        const dk = `${pr.nextC},${pr.nextR}`;
        const list = destMap.get(dk) ?? [];
        list.push(pr.id);
        destMap.set(dk, list);
      }

      const cancelled = new Set();
      for (const [, ids] of destMap) {
        if (ids.length > 1) for (const id of ids) cancelled.add(id);
      }

      for (const pr of allProps) {
        if (cancelled.has(pr.id)) continue;
        const p = pos.get(pr.id);
        if (!p) continue;
        occ.delete(`${p.col},${p.row}`);
        occ.set(`${pr.nextC},${pr.nextR}`, pr.id);
        p.col = pr.nextC;
        p.row = pr.nextR;
        if (pr.kind === 'E' && pr.direction !== undefined) p.direction = pr.direction;
        if (pr.kind === 'N') {
          const beltDir = board.conveyors[`${pr.nextC},${pr.nextR}`]?.direction;
          if (beltDir !== undefined) p.direction = beltDir;
        }
        if (pr.kind === 'E') expressRemaining.set(pr.id, (expressRemaining.get(pr.id) ?? 0) - 1);
        else normalRemaining.set(pr.id, (normalRemaining.get(pr.id) ?? 0) - 1);
        movedInCycle = true;
      }
    }
  }

  const updates = new Map();
  for (const r of state.robots) {
    if (r.rebooted) continue;
    const end = pos.get(r.id);
    if (!end) continue;
    const beltDir = board.conveyors[`${end.col},${end.row}`]?.direction;
    const dir = beltDir !== undefined ? beltDir : end.direction;
    const patch = { col: end.col, row: end.row, direction: dir };
    const moved = end.col !== r.col || end.row !== r.row;
    const turned = dir !== r.direction;
    if (moved || turned || beltDir !== undefined) {
      updates.set(r.id, patch);
    }
  }

  cellToRobotId.clear();
  for (const [k, v] of occ) cellToRobotId.set(k, v);

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
