import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorThenPushPanel = {
  id: "conveyor-then-push-panel",
  title: "Conveyors resolve before push panels on the same register",
  module: "boardElements / postRegisterBoard",
  description:
    "Matches POST_REGISTER_STEPS in postRegisterBoard.js: the conveyor step runs first, then push panels. A robot rides a belt onto the push tile; the panel (configured for register 1 / index 0) then shoves them east one more space. If push panels ran first, the robot would still be on (2,2) and would not be pushed from (3,2).",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  initialTraceLabel:
    "Robot on (2,2) east conveyor; push panel on (3,2) fires on register 1 only",
  buildState: () => {
    const board = createBoard(8, 5);
    board.conveyors = { "2,2": { direction: 90, express: false } };
    board.pushPanels = { "3,2": { registers: [1], direction: 90 } };
    return createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 0 }],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    {
      label: "Conveyors — move east from (2,2) onto push panel cell (3,2)",
      apply: (s) => runBoardElementStep(s, 0, "conveyors").state,
    },
    {
      label:
        "Push panels (register index 0 → rules register 1) — shove east to (4,2)",
      apply: (s) => runBoardElementStep(s, 0, "push_panels").state,
    },
  ],
  assert: (s) => {
    const r = s.robots[0];
    const ok = r.col === 4 && r.row === 2;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected robot at (4,2) after belt then panel; got (${r.col},${r.row})`,
        };
  },
};
