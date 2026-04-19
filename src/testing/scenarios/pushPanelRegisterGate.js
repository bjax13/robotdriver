import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const pushPanelRegisterGate = {
  id: "push-panel-register-gate",
  title: "Push panel fires only on listed registers",
  module: "boardElements",
  description:
    "Panel configured for register 1 fires on the first activation (index 0) but not on the second (index 1).",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  buildState: () => {
    // East-facing wall push panel is mounted on this cell's west edge.
    const walls = [{ col: 2, row: 2, edge: "W" }];
    const board = createBoard(7, 7, walls);
    board.pushPanels = {
      "2,2": { registers: [1], direction: 90 },
    };
    return createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 0 }],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    {
      label: "Register 2 (no push)",
      apply: (s) => runBoardElementStep(s, 1, "push_panels").state,
    },
    {
      label: "Register 1 (push east)",
      apply: (s) => runBoardElementStep(s, 0, "push_panels").state,
    },
  ],
  assert: (s) => {
    const r = s.robots[0];
    const ok = r.col === 3 && r.row === 2;
    return ok ? { ok: true } : { ok: false, reason: `expected robot at (3,2), got (${r.col},${r.row})` };
  },
};
