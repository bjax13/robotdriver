import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorExpressOneTile = {
  id: "conveyor-express-one-tile",
  title: "Single express belt moves one cell",
  module: "boardElements",
  description:
    "One express conveyor tile pushes the robot one step along its arrow—the end of that belt—not two arbitrary spaces.",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  buildState: () => {
    const board = createBoard(10, 6);
    board.conveyors = {
      "1,1": { direction: 90, express: true },
    };
    return createInitialState({
      board,
      robots: [{ col: 1, row: 1, direction: 0 }],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    {
      label: "Resolve conveyors",
      apply: (s) => runBoardElementStep(s, 0, "conveyors").state,
    },
  ],
  assert: (s) => {
    const r = s.robots[0];
    const ok = r.col === 2 && r.row === 1;
    return ok ? { ok: true } : { ok: false, reason: `expected robot at (2,1), got (${r.col},${r.row})` };
  },
};
