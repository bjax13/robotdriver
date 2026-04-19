/**
 * Post-register board resolution: pits, conveyors, gears, push panels, lasers, checkpoints.
 * Same order as activation after programmed movement.
 */

import { resolveConveyors, resolveGears, resolvePushPanels } from './boardElements.js';
import { isPit } from './board.js';
import { listAllLaserHits } from './lasers.js';
import { addDamage, rebootRobot, SPAM_CARDS_PER_HIT, MAX_DAMAGE } from './damage.js';

/** @typedef {'pits_pre'|'conveyors'|'gears'|'push_panels'|'pits_post'|'lasers'|'checkpoints'} PostRegisterStep */

export const POST_REGISTER_STEPS = /** @type {PostRegisterStep[]} */ ([
  'pits_pre',
  'conveyors',
  'gears',
  'push_panels',
  'pits_post',
  'lasers',
  'checkpoints',
]);

/**
 * Full pipeline in engine order (matches activation).
 * @param {import('./types').GameState} state
 * @param {number} registerIndex
 * @returns {{ state: import('./types').GameState, laserHits: { shooterId: string, targetId: string }[] }}
 */
export function runPostRegisterBoardElements(state, registerIndex) {
  let s = state;
  /** @type { { shooterId: string, targetId: string }[] } */
  let laserHits = [];
  for (const step of POST_REGISTER_STEPS) {
    const r = runBoardElementStep(s, registerIndex, step);
    s = r.state;
    if (step === 'lasers') laserHits = r.laserHits;
  }
  return { state: s, laserHits };
}

/**
 * Run a single post-register step (for dev / manual testing).
 * @param {import('./types').GameState} state
 * @param {number} registerIndex
 * @param {PostRegisterStep} step
 * @returns {{ state: import('./types').GameState, laserHits: { shooterId: string, targetId: string }[] }}
 */
export function runBoardElementStep(state, registerIndex, step) {
  let s = state;
  /** @type { { shooterId: string, targetId: string }[] } */
  let laserHits = [];

  const cellToRobotId = () => {
    const m = new Map();
    for (const r of s.robots) {
      if (r.rebooted) continue;
      m.set(`${r.col},${r.row}`, r.id);
    }
    return m;
  };

  const applyUpdates = (updates, keys = ['col', 'row', 'direction']) => {
    if (updates.size === 0) return;
    const robots = s.robots.map((r) => {
      const u = updates.get(r.id);
      if (!u) return r;
      const next = { ...r };
      for (const k of keys) if (u[k] !== undefined) next[k] = u[k];
      return next;
    });
    s = { ...s, robots };
  };

  switch (step) {
    case 'pits_pre':
    case 'pits_post':
      s = applyPits(s);
      break;
    case 'conveyors': {
      const { updates: convUpdates } = resolveConveyors(s, cellToRobotId());
      applyUpdates(convUpdates, ['col', 'row', 'direction']);
      break;
    }
    case 'gears': {
      const gearUpdates = resolveGears(s);
      applyUpdates(gearUpdates, ['direction']);
      break;
    }
    case 'push_panels': {
      const panelUpdates = resolvePushPanels(s, registerIndex);
      applyUpdates(panelUpdates, ['col', 'row']);
      break;
    }
    case 'lasers': {
      const laserResult = applyRobotLasers(s);
      s = laserResult.state;
      laserHits = laserResult.laserHits;
      break;
    }
    case 'checkpoints':
      s = applyCheckpoints(s);
      break;
    default:
      break;
  }
  return { state: s, laserHits };
}

function applyPits(state) {
  if (!state.board.pits) return state;
  const fallbackCol = state.board.rebootCol ?? 0;
  const fallbackRow = state.board.rebootRow ?? 0;
  const robots = state.robots.map((r) => {
    if (r.rebooted) return r;
    if (!isPit(state.board, r.col, r.row)) return r;
    const rc = r.spawnCol ?? fallbackCol;
    const rr = r.spawnRow ?? fallbackRow;
    return rebootRobot(r, rc, rr, 1);
  });
  return { ...state, robots };
}

/**
 * @returns {{ state: import('./types').GameState, laserHits: { shooterId: string, targetId: string }[] }}
 */
function applyRobotLasers(state) {
  const laserHits = listAllLaserHits(state.board, state.robots, state.antenna);
  if (laserHits.length === 0) return { state, laserHits: [] };
  const damaged = new Map();
  for (const h of laserHits) {
    damaged.set(h.targetId, (damaged.get(h.targetId) ?? 0) + 1);
  }
  const robots = state.robots.map((r) => {
    const count = damaged.get(r.id);
    if (!count) return r;
    const nextDamage = Math.min(MAX_DAMAGE, (r.damage ?? 0) + count);
    return addDamage({ ...r, damage: nextDamage }, count * SPAM_CARDS_PER_HIT);
  });
  return { state: { ...state, robots }, laserHits };
}

function applyCheckpoints(state) {
  if (!state.board.checkpoints) return state;
  const robots = state.robots.map((r) => {
    if (r.rebooted) return r;
    const nextCp = r.nextCheckpoint ?? 0;
    const cp = state.board.checkpoints[nextCp];
    if (!cp) return r;
    if (r.col === cp.col && r.row === cp.row) {
      return {
        ...r,
        nextCheckpoint: nextCp + 1,
        spawnCol: cp.col,
        spawnRow: cp.row,
      };
    }
    return r;
  });
  const winner = robots.find((r) => r.nextCheckpoint >= (state.board.checkpoints?.length ?? 0));
  return { ...state, robots, winner: winner?.id };
}
