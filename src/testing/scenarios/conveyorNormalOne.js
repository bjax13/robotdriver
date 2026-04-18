import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorNormalOne = {
  id: "conveyor-normal-one",
  title: "Normal conveyor moves one cell",
  module: "boardElements",
  description: "A robot on a non-express belt moves one space in the belt direction.",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  buildState: () => {
    const board = createBoard(10, 6);
    board.conveyors = {
      "2,2": { direction: 180, express: false },
    };
    return createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 0 }],
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
    const ok = r.col === 2 && r.row === 3;
    return ok ? { ok: true } : { ok: false, reason: `expected robot at (2,3), got (${r.col},${r.row})` };
  },
};
