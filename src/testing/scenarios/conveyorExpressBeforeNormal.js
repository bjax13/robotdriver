import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorExpressBeforeNormal = {
  id: "conveyor-express-before-normal",
  title: "Express belts resolve before normal belts",
  module: "boardElements",
  description:
    "During the conveyor step, all express movement completes before any normal belt moves. Here r1 (express east) claims (2,2); r2 on a normal belt west cannot enter that cell afterward — if normal ran first, r2 would steal the tile and block r1.",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  initialTraceLabel:
    "Before conveyors — r1 on express (yellow) east toward center; r2 on normal (gray) west toward the same cell",
  buildState: () => {
    const board = createBoard(8, 5);
    board.conveyors = {
      "1,2": { direction: 90, express: true },
      "3,2": { direction: 270, express: false },
    };
    return createInitialState({
      board,
      robots: [
        { col: 1, row: 2 },
        { col: 3, row: 2 },
      ],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    {
      label:
        "Conveyors — express phase then normal; r1 ends on merge cell, r2 stays east of it",
      apply: (s) => runBoardElementStep(s, 0, "conveyors").state,
    },
  ],
  assert: (s) => {
    const r1 = s.robots.find((r) => r.id === "r1");
    const r2 = s.robots.find((r) => r.id === "r2");
    const ok =
      r1 &&
      r2 &&
      r1.col === 2 &&
      r1.row === 2 &&
      r2.col === 3 &&
      r2.row === 2;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected r1 at (2,2) and r2 at (3,2); got r1 (${r1?.col},${r1?.row}) r2 (${r2?.col},${r2?.row})`,
        };
  },
};
