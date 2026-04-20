import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/**
 * T junction: west arm and north arm both feed (2,2); belt continues south.
 *
 *   (2,1) 180↓
 *        ┌──┐
 * (1,2)→ │  │ (2,2) merge → (2,3) …
 *        └──┘
 */
function buildBoard() {
  const board = createBoard(6, 5);
  board.conveyors = {
    "1,2": { direction: 90, express: false },
    "2,2": { direction: 180, express: false },
    "2,1": { direction: 180, express: false },
    "2,3": { direction: 180, express: false },
  };
  return board;
}

const conveyors = (s) => runBoardElementStep(s, 0, "conveyors").state;

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorBeltMergeT = {
  id: "conveyor-belt-merge-t",
  title: "Two bots on a normal T merge (same-priority tie)",
  module: "boardElements",
  description:
    "Two robots on the west and north arms both try to enter merge tile (2,2) in the same conveyors phase. Same-priority belts arriving at the same destination cancel each other’s move—both remain on their incoming belts (Robo Rally merge rule).",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  initialTraceLabel:
    "Before conveyors — r1 on west arm and r2 on north arm both target merge tile (2,2)",
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
        "Conveyors — simultaneous merge tie: neither enters (2,2); both stay on arms",
      apply: conveyors,
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
          reason: `expected tie: r1 still (1,2) and r2 still (2,1); got r1 (${r1?.col},${r1?.row}) r2 (${r2?.col},${r2?.row})`,
        };
  },
};
