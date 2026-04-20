import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorExpressMergeRace = {
  id: "conveyor-express-merge-race",
  title: "Two express belts race into one tile (merge contention)",
  module: "boardElements",
  description:
    "Both robots are on express belts whose chains end on the same grid cell this phase (center column). Same-priority express → destination tie: neither moves; both stay on their belts. See also conveyor-express-before-normal when express and normal priorities differ.",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  initialTraceLabel:
    "Before conveyors — r1 (left) and r2 (right) on express belts toward center column",
  buildState: () => {
    const board = createBoard(8, 5);
    board.conveyors = {
      "2,2": { direction: 90, express: true },
      "4,2": { direction: 270, express: true },
    };
    return createInitialState({
      board,
      robots: [
        { col: 2, row: 2, direction: 0 },
        { col: 4, row: 2, direction: 0 },
      ],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    {
      label:
        "Conveyors — same-phase destination tie; both robots stay put",
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
      r2.col === 4 &&
      r2.row === 2;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected tie: r1 (2,2) r2 (4,2); got r1 (${r1?.col},${r1?.row}) r2 (${r2?.col},${r2?.row})`,
        };
  },
};
