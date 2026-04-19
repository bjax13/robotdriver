import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** Same 16-tile ring as conveyor-belt-loop; normal belts move one cell per conveyors step. */
function buildLoopBoard() {
  const board = createBoard(14, 14);
  board.conveyors = {
    "7,6": { direction: 90, express: false },
    "8,6": { direction: 90, express: false },
    "9,6": { direction: 90, express: false },
    "10,6": { direction: 180, express: false },
    "10,7": { direction: 180, express: false },
    "10,8": { direction: 180, express: false },
    "10,9": { direction: 180, express: false },
    "10,10": { direction: 270, express: false },
    "9,10": { direction: 270, express: false },
    "8,10": { direction: 270, express: false },
    "7,10": { direction: 270, express: false },
    "6,10": { direction: 0, express: false },
    "6,9": { direction: 0, express: false },
    "6,8": { direction: 0, express: false },
    "6,7": { direction: 0, express: false },
    "6,6": { direction: 90, express: false },
  };
  return board;
}

const applyConveyors = (s) => runBoardElementStep(s, 0, "conveyors").state;

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorBeltLoopNormal = {
  id: "conveyor-belt-loop-normal",
  title: "Normal belt loop — 4×4 inner square (one step per conveyors phase)",
  module: "boardElements",
  description:
    "Same ring geometry as the express loop: sixteen normal (single-arrow) belts around a 4×4 empty interior. Each conveyors step carries the robot exactly one tile; sixteen steps complete one lap. Corners rotate facing with each belt tile; after a full lap the robot matches the starting arrow (east). Contrast with the express scenario, which clears the lap in a single conveyors step.",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  initialTraceLabel:
    "Before step 1 — robot on north edge; normal belts (single arrow) around the ring",
  buildState: () =>
    createInitialState({
      board: buildLoopBoard(),
      robots: [{ col: 7, row: 6, direction: 180 }],
      antenna: { col: 0, row: 0 },
    }),
  steps: Array.from({ length: 16 }, (_, i) => ({
    label:
      i === 0
        ? "Conveyors 1/16 — first belt step along the ring"
        : i === 15
          ? "Conveyors 16/16 — completes lap; facing east on start tile"
          : `Conveyors ${i + 1}/16 — one cell along normal belts`,
    apply: applyConveyors,
  })),
  assert: (s) => {
    const r = s.robots[0];
    if (r.col !== 7 || r.row !== 6) {
      return {
        ok: false,
        reason: `expected robot back at (7,6), got (${r.col},${r.row})`,
      };
    }
    if (r.direction !== 90) {
      return {
        ok: false,
        reason: `expected direction 90° (east), got ${r.direction}`,
      };
    }
    return { ok: true };
  },
};
