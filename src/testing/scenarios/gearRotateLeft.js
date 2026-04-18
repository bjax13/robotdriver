import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const gearRotateLeft = {
  id: "gear-rotate-left",
  title: "Red gear rotates counterclockwise",
  module: "boardElements",
  description: "A robot on an L gear turns 90° counterclockwise.",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  buildState: () => {
    const board = createBoard(6, 6);
    board.gears = { "2,2": "L" };
    return createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 0 }],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    {
      label: "Resolve gears",
      apply: (s) => runBoardElementStep(s, 0, "gears").state,
    },
  ],
  assert: (s) => {
    const r = s.robots[0];
    const ok = r.direction === 270;
    return ok ? { ok: true } : { ok: false, reason: `expected direction 270 (W), got ${r.direction}` };
  },
};
