import { advanceExpressBeltsTwoSteps } from "../../engine/boardElements.js";
import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";

function buildLoopBoard() {
  const board = createBoard(14, 14);
  board.conveyors = {
    "7,6": { direction: 90, express: true },
    "8,6": { direction: 90, express: true },
    "9,6": { direction: 90, express: true },
    "10,6": { direction: 180, express: true },
    "10,7": { direction: 180, express: true },
    "10,8": { direction: 180, express: true },
    "10,9": { direction: 180, express: true },
    "10,10": { direction: 270, express: true },
    "9,10": { direction: 270, express: true },
    "8,10": { direction: 270, express: true },
    "7,10": { direction: 270, express: true },
    "6,10": { direction: 0, express: true },
    "6,9": { direction: 0, express: true },
    "6,8": { direction: 0, express: true },
    "6,7": { direction: 0, express: true },
    "6,6": { direction: 90, express: true },
  };
  return board;
}

/** One lap = 16 belt tiles in 8 gallery steps (2 express cells per step, matching 2× belts). */
function stepLabel(i) {
  const n = i + 1;
  if (i === 0) return "Express 1/8 — two tiles east along north edge";
  if (n === 2) return "Express 2/8 — past northeast corner, south on east edge";
  if (n === 4) return "Express 4/8 — past southeast corner, west on south edge";
  if (n === 6) return "Express 6/8 — past southwest corner, north on west edge";
  if (n === 8) return "Express 8/8 — lap complete (16 cells), heading preserved";
  return `Express ${n}/8 — two express tiles per step (yellow 2× chain)`;
}

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorBeltLoop = {
  id: "conveyor-belt-loop",
  title: "Express belt loop — 4×4 inner square (four tiles per side)",
  module: "boardElements",
  description:
    "Sixteen **express** belts (yellow tile, double chevrons, “2×”) wrap a 4×4 empty interior. **Gallery:** each step calls advanceExpressBeltsTwoSteps (two express grid moves per click, matching the 2× visualization); advanceExpressBeltsOneStep is single-tile debug stepping. **Register conveyors phase:** resolveConveyors repeats movement waves until nothing moves — wave 1 moves express one tile then normal one tile; wave 2+ moves all belt types one tile together with simultaneous destination ties. One conveyors phase can traverse the full ring in those waves (not one gallery click). Stepped helpers preserve heading on straight runs; resolveConveyors may align heading to the final belt arrow (see boardElements Jest). Compare conveyor-belt-loop-normal (gray belts, one cell per wave on normal-only chains).",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  initialTraceLabel:
    "Step 0 — robot on north edge; yellow express tiles (double arrows / 2×)",
  buildState: () =>
    createInitialState({
      board: buildLoopBoard(),
      robots: [{ col: 7, row: 6, direction: 180 }],
      antenna: { col: 0, row: 0 },
    }),
  steps: Array.from({ length: 8 }, (_, i) => ({
    label: stepLabel(i),
    apply: (s) => advanceExpressBeltsTwoSteps(s),
  })),
  assert: (s) => {
    const r = s.robots[0];
    if (r.col !== 7 || r.row !== 6) {
      return {
        ok: false,
        reason: `expected robot back at (7,6), got (${r.col},${r.row})`,
      };
    }
    if (r.direction !== 180) {
      return {
        ok: false,
        reason: `expected direction 180° (south, preserved after full loop), got ${r.direction}`,
      };
    }
    return { ok: true };
  },
};
