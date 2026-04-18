/**
 * Golden trace v0 — normalize engine activation audit events for fixtures.
 * @see ../../../docs/golden-trace-v0.md
 */

/**
 * @param {object} e
 * @returns {{ step: number, register: number, type: string, payload: object }}
 */
function normalizeOne(e, step) {
  const register =
    typeof e.registerIndex === 'number' && Number.isInteger(e.registerIndex)
      ? Math.min(4, Math.max(0, e.registerIndex))
      : 0;
  switch (e.kind) {
    case 'robot_action':
      return {
        step,
        register,
        type: 'robot_action',
        payload: {
          priorityInRegister: e.priorityInRegister,
          robotId: e.robotId,
          card: e.card,
          action: e.action,
        },
      };
    case 'laser_hit':
      return {
        step,
        register,
        type: 'laser_hit',
        payload: {
          shooterId: e.shooterId,
          targetId: e.targetId,
        },
      };
    case 'board_resolve':
      return {
        step,
        register,
        type: 'board_resolve',
        payload: {
          details: e.details,
        },
      };
    case 'power_down_heal':
      return {
        step,
        register,
        type: 'power_down_heal',
        payload: {
          robotId: e.robotId,
        },
      };
    default:
      return {
        step,
        register,
        type: 'unknown_event',
        payload: {
          kind:
            e.kind != null && String(e.kind).trim() !== ''
              ? String(e.kind)
              : 'unspecified',
        },
      };
  }
}

/**
 * @param {object[]} events - raw events from activateRegisterWithEvents
 * @returns {object[]}
 */
export function normalizeActivationEventsToGoldenV0(events) {
  let step = 0;
  const out = [];
  for (const e of events) {
    out.push(normalizeOne(e, step));
    step += 1;
  }
  return out;
}
