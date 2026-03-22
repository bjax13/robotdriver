/**
 * Activation phase: execute registers in priority order.
 * Board elements run after each register (Phase 4).
 */

import { draw } from './deck.js';
import { resolveConveyors, resolveGears, resolvePushPanels } from './boardElements.js';
import { isPit } from './board.js';
import { listLaserHits } from './lasers.js';
import { addDamage, rebootRobot, drawForSpam, SPAM_CARDS_PER_HIT } from './damage.js';
import { cardToAction, CARD_TYPES } from './cards.js';
import { applyMove } from './gameState.js';
import { sortRobotsByPriority } from './priority.js';

/** Max damage tokens (matches draw cap 9 − damage). */
export const MAX_DAMAGE = 9;

/**
 * Locked high registers (last N) keep last round's cards when damage > 0 and registers are full.
 * @param {import('./types').Robot} robot
 * @returns {number} 0–5
 */
export function getLockedRegisterCount(robot) {
  if ((robot.registers?.length ?? 0) !== 5) return 0;
  const d = Math.min(robot.damage ?? 0, MAX_DAMAGE);
  return Math.min(d, 5);
}

/**
 * @param {import('./types').Robot} robot
 * @returns {number}
 */
export function getUnlockedRegisterCount(robot) {
  return 5 - getLockedRegisterCount(robot);
}

/**
 * Cards drawn this programming phase: 9 minus damage (min 0).
 * @param {import('./types').Robot} robot
 * @returns {number}
 */
export function getHandDrawCount(robot) {
  const d = Math.min(robot.damage ?? 0, MAX_DAMAGE);
  return Math.max(0, 9 - d);
}

/**
 * Deal cards to each robot's hand (count from damage). Does not clear registers.
 * @param {import('./types').GameState} state
 * @returns {import('./types').GameState}
 */
export function dealHands(state) {
  const robots = state.robots.map((r) => {
    if (r.rebooted) return r;
    const n = getHandDrawCount(r);
    const { deck, discard, drawn } = draw(r.deck || [], r.discard || [], n);
    return { ...r, deck, discard, hand: drawn };
  });
  return { ...state, robots };
}

/**
 * Place picked cards into unlocked registers; locked slots keep previous register cards.
 * @param {import('./types').GameState} state
 * @param {string} robotId
 * @param {string[]} pickedCards - length must equal getUnlockedRegisterCount(robot)
 * @returns {import('./types').GameState}
 */
export function setProgram(state, robotId, pickedCards) {
  const robot = state.robots.find((r) => r.id === robotId);
  if (!robot) return state;

  const locked = getLockedRegisterCount(robot);
  const unlocked = 5 - locked;
  if (pickedCards.length !== unlocked) return state;

  const regs = robot.registers || [];
  const merged = [];
  for (let i = 0; i < 5; i++) {
    if (i < unlocked) merged[i] = pickedCards[i];
    else merged[i] = regs[i];
  }

  const hand = [...(robot.hand || [])];
  const toDiscard = [];
  for (const card of pickedCards) {
    const idx = hand.indexOf(card);
    if (idx >= 0) hand.splice(idx, 1);
  }
  toDiscard.push(...hand);

  const robots = state.robots.map((r) => {
    if (r.id !== robotId) return r;
    return {
      ...r,
      hand: [],
      discard: [...(r.discard || []), ...toDiscard],
      registers: merged,
    };
  });
  return { ...state, robots };
}

/**
 * Resolve the card for a robot at given register. Handles Again (repeat previous).
 * @param {(string|null)[]} registers
 * @param {number} registerIndex
 * @returns {string|null} card type to execute
 */
function getCardForRegister(registers, registerIndex) {
  const card = registers[registerIndex];
  if (card === CARD_TYPES.AGAIN) {
    if (registerIndex === 0) return null;
    return getCardForRegister(registers, registerIndex - 1);
  }
  return card;
}

/**
 * @typedef {Object} ActivationRobotEvent
 * @property {'robot_action'} kind
 * @property {number} registerIndex
 * @property {number} priorityInRegister - 1-based index in full priority order for this register
 * @property {string} robotId
 * @property {string} card - resolved card type (after Again / Spam draw)
 * @property {string|null} action - movement/power action from cardToAction
 */

/**
 * @typedef {Object} ActivationBoardEvent
 * @property {'board_resolve'} kind
 * @property {number} registerIndex
 * @property {string} details
 */

/**
 * @typedef {Object} ActivationLaserEvent
 * @property {'laser_hit'} kind
 * @property {number} registerIndex
 * @property {string} shooterId
 * @property {string} targetId
 */

/**
 * Execute one register for all robots in priority order; returns state and audit events.
 * @param {import('./types').GameState} state
 * @param {number} registerIndex
 * @returns {{ state: import('./types').GameState, events: (ActivationRobotEvent|ActivationLaserEvent|ActivationBoardEvent)[] }}
 */
export function activateRegisterWithEvents(state, registerIndex) {
  /** @type {(ActivationRobotEvent|ActivationLaserEvent|ActivationBoardEvent)[]} */
  const events = [];
  if (!state.antenna) return { state, events };

  const activeRobots = state.robots.filter((r) => !r.rebooted && r.registers);
  const ordered = sortRobotsByPriority(
    activeRobots,
    state.antenna,
    state.antennaDirection ?? 90
  );

  let s = { ...state, currentRegister: registerIndex };

  for (let i = 0; i < ordered.length; i++) {
    const robot = ordered[i];
    const priorityInRegister = i + 1;
    const r = s.robots.find((x) => x.id === robot.id);
    const regs = r?.registers;
    if (!regs) continue;
    let card = getCardForRegister(regs, registerIndex);
    if (!card) continue;

    if (card === CARD_TYPES.SPAM) {
      const { card: drawn, deck, discard } = drawForSpam(r.deck || [], r.discard || []);
      const robots = s.robots.map((x) =>
        x.id === robot.id ? { ...x, deck, discard } : x
      );
      s = { ...s, robots };
      card = drawn;
    }

    const action = cardToAction(card);
    if (!action) continue;
    if (action === 'powerUp') {
      const robots = s.robots.map((x) =>
        x.id === robot.id ? { ...x, energy: (x.energy || 0) + 1 } : x
      );
      s = { ...s, robots };
    } else {
      s = applyMove(s, robot.id, action);
    }

    events.push({
      kind: 'robot_action',
      registerIndex,
      priorityInRegister,
      robotId: robot.id,
      card,
      action,
    });
  }

  const boardResult = resolveBoardElements(s, registerIndex);
  s = boardResult.state;
  for (const hit of boardResult.laserHits) {
    events.push({
      kind: 'laser_hit',
      registerIndex,
      shooterId: hit.shooterId,
      targetId: hit.targetId,
    });
  }
  events.push({
    kind: 'board_resolve',
    registerIndex,
    details: 'conveyors, gears, push panels, pits, checkpoints',
  });

  return { state: s, events };
}

/**
 * Execute one register for all robots in priority order.
 * @param {import('./types').GameState} state
 * @param {number} registerIndex
 * @returns {import('./types').GameState}
 */
export function activateRegister(state, registerIndex) {
  return activateRegisterWithEvents(state, registerIndex).state;
}

/**
 * Board elements: conveyors, gears, push panels, pits, lasers, checkpoints.
 * @param {import('./types').GameState} state
 * @param {number} registerIndex
 * @returns {{ state: import('./types').GameState, laserHits: { shooterId: string, targetId: string }[] }}
 */
function resolveBoardElements(state, registerIndex) {
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

  s = applyPits(s);
  const { updates: convUpdates } = resolveConveyors(s, cellToRobotId());
  applyUpdates(convUpdates, ['col', 'row']);

  const gearUpdates = resolveGears(s);
  applyUpdates(gearUpdates, ['direction']);

  const panelUpdates = resolvePushPanels(s, registerIndex);
  applyUpdates(panelUpdates, ['col', 'row']);

  s = applyPits(s);
  const laserResult = applyRobotLasers(s);
  s = laserResult.state;
  laserHits = laserResult.laserHits;
  s = applyCheckpoints(s);

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
  const laserHits = listLaserHits(state.board, state.robots);
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
    const nextCp = (r.nextCheckpoint ?? 0);
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

/**
 * Run full activation: registers 0 through 4.
 * @param {import('./types').GameState} state
 * @returns {import('./types').GameState}
 */
export function activateRound(state) {
  let s = state;
  for (let i = 0; i < 5; i++) {
    s = activateRegister(s, i);
  }
  return { ...s, currentRegister: undefined };
}
