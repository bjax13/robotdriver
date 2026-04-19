import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorExpressTwoTiles = {
  id: "conveyor-express-two-tiles",
  title: "Two express belts in a row move two cells",
  module: "boardElements",
  description:
    "Two consecutive express tiles in the same direction chain: one step per belt tile during the conveyors step.",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  buildState: () => {
    const board = createBoard(10, 6);
    board.conveyors = {
      "1,1": { direction: 90, express: true },
      "2,1": { direction: 90, express: true },
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
    const ok = r.col === 3 && r.row === 1;
    return ok ? { ok: true } : { ok: false, reason: `expected robot at (3,1), got (${r.col},${r.row})` };
  },
};
