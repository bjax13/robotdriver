import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const gearRotateRight = {
  id: "gear-rotate-right",
  title: "Green gear rotates clockwise",
  module: "boardElements",
  description:
    "Four gear resolutions on an R gear: 90° clockwise each time, completing a full turn.",
  parityIds: ["PC-BEL-002"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  buildState: () => {
    const board = createBoard(6, 6);
    board.gears = { "2,2": "R" };
    return createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 0 }],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [1, 2, 3, 4].map((n) => ({
    label: `Resolve gears (${n}/4)`,
    apply: (s) => runBoardElementStep(s, 0, "gears").state,
  })),
  assert: (s) => {
    const r = s.robots[0];
    const ok = r.direction === 0;
    return ok
      ? { ok: true }
      : { ok: false, reason: `expected direction 0 (N) after four CW quarter turns, got ${r.direction}` };
  },
};
