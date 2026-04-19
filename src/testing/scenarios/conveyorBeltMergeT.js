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
    "2,1": { direction: 180, express: false },
    "2,2": { direction: 180, express: false },
    "2,3": { direction: 180, express: false },
  };
  return board;
}

const conveyors = (s) => runBoardElementStep(s, 0, "conveyors").state;

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorBeltMergeT = {
  id: "conveyor-belt-merge-t",
  title: "Two belts merge into one (T junction)",
  module: "boardElements",
  description:
    "A belt from the west and a belt from the north both feed the same tile; the merged conveyor continues south (normal belts, one cell per conveyors step). The board draws chevrons along both incoming arms and the outgoing run so the join is visible.",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  initialTraceLabel:
    "Before step 1 — robot on the west arm; north and west feeds into shared tile (2,2)",
  buildState: () =>
    createInitialState({
      board: buildBoard(),
      robots: [{ col: 1, row: 2, direction: 90 }],
      antenna: { col: 0, row: 0 },
    }),
  steps: [
    {
      label: "Conveyors — onto merge tile (2,2)",
      apply: conveyors,
    },
    {
      label: "Conveyors — off merge onto south continuation",
      apply: conveyors,
    },
  ],
  assert: (s) => {
    const r1 = s.robots.find((r) => r.id === "r1");
    const ok = r1 && r1.col === 2 && r1.row === 3;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected r1 at merge exit (2,3); got (${r1?.col},${r1?.row})`,
        };
  },
};
