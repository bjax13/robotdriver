import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/**
 * Two express east (0,2)→(1,2)→(2,2), then two normal south (2,2)→(2,3)→(2,4).
 * Express phase completes first; the robot lands on the normal chain and continues
 * south in the same conveyors step.
 */
function buildBoard() {
  const board = createBoard(8, 6);
  board.conveyors = {
    "0,2": { direction: 90, express: true },
    "1,2": { direction: 90, express: true },
    "2,2": { direction: 180, express: false },
    "2,3": { direction: 180, express: false },
  };
  return board;
}

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorExpressToNormalHandoff = {
  id: "conveyor-express-to-normal-handoff",
  title: "Express chain hands off onto normal belt (same register)",
  module: "boardElements",
  description:
    "r1 starts on express at (0,2). After one conveyors step: express moves east to (2,2), then normal belts carry the robot south to (2,4) facing 180° — express-before-normal order lets the handoff complete in a single register.",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  initialTraceLabel:
    "Before conveyors — r1 on express at (0,2); normal south chain begins at merge (2,2)",
  buildState: () =>
    createInitialState({
      board: buildBoard(),
      robots: [{ col: 0, row: 2, direction: 90 }],
      antenna: { col: 0, row: 0 },
    }),
  steps: [
    {
      label:
        "Conveyors — express east then normal south; r1 ends (2,4) facing 180°",
      apply: (s) => runBoardElementStep(s, 0, "conveyors").state,
    },
  ],
  assert: (s) => {
    const r1 = s.robots.find((r) => r.id === "r1");
    const ok = r1 && r1.col === 2 && r1.row === 4 && r1.direction === 180;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected r1 at (2,4) direction 180; got (${r1?.col},${r1?.row}) dir ${r1?.direction}`,
        };
  },
};
