import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorExpressLChain = {
  id: "conveyor-express-l-chain",
  title: "Express chain follows corners (east → south → east)",
  module: "boardElements",
  description:
    "Express movement follows each belt tile's arrow: here three express tiles form an L (east, then south, then east). The robot rides the full chain in one conveyors step — not only straight multi-tile runs.",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  initialTraceLabel:
    "Before conveyors — robot on first express tile; bend and second leg visible ahead",
  buildState: () => {
    const board = createBoard(8, 8);
    board.conveyors = {
      "1,3": { direction: 90, express: true },
      "2,3": { direction: 180, express: true },
      "2,4": { direction: 90, express: true },
    };
    return createInitialState({
      board,
      robots: [{ col: 1, row: 3, direction: 0 }],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    {
      label: "Conveyors — express chain turns with each tile; robot exits at east end of bend",
      apply: (s) => runBoardElementStep(s, 0, "conveyors").state,
    },
  ],
  assert: (s) => {
    const r = s.robots[0];
    const ok = r.col === 3 && r.row === 4;
    return ok
      ? { ok: true }
      : { ok: false, reason: `expected robot at (3,4), got (${r.col},${r.row})` };
  },
};
