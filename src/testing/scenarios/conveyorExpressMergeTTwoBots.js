import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/**
 * Express T junction: west and north arms merge, then a longer express run continues.
 * Same-priority express into the same final cell in one phase → destination tie (neither moves).
 */
function buildBoard() {
  const board = createBoard(8, 7);
  board.conveyors = {
    "1,2": { direction: 90, express: true },
    "2,2": { direction: 180, express: true },
    "2,1": { direction: 180, express: true },
    "2,3": { direction: 180, express: true },
    "2,4": { direction: 90, express: true },
    "3,4": { direction: 90, express: true },
    "4,4": { direction: 90, express: true },
    "5,4": { direction: 90, express: true },
    "6,4": { direction: 180, express: true },
  };
  return board;
}

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorExpressMergeTTwoBots = {
  id: "conveyor-express-merge-t-two-bots",
  title: "Two bots on an express T merge (same-phase destination tie)",
  module: "boardElements",
  description:
    "Both robots ride express belts that merge onto the same downstream express path. After full express-chain simulation, both would finish on the same grid cell in this phase—so neither moves (same priority). Compare conveyor-belt-merge-t (normal belts, same tie).",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  initialTraceLabel:
    "Before conveyors — r1 on west express arm, r2 on north express arm; paths merge",
  buildState: () =>
    createInitialState({
      board: buildBoard(),
      robots: [
        { col: 1, row: 2, direction: 90 },
        { col: 2, row: 1, direction: 180 },
      ],
      antenna: { col: 0, row: 0 },
    }),
  steps: [
    {
      label:
        "Conveyors — express destination tie: both remain on their starting belt cells",
      apply: (s) => runBoardElementStep(s, 0, "conveyors").state,
    },
  ],
  assert: (s) => {
    const r1 = s.robots.find((r) => r.id === "r1");
    const r2 = s.robots.find((r) => r.id === "r2");
    const ok =
      r1 &&
      r2 &&
      r1.col === 1 &&
      r1.row === 2 &&
      r2.col === 2 &&
      r2.row === 1;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected tie: r1 (1,2) r2 (2,1); got r1 (${r1?.col},${r1?.row}) r2 (${r2?.col},${r2?.row})`,
        };
  },
};
