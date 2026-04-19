import { createBoard } from "../../engine/board.js";
import { createInitialState, applyMove } from "../../engine/gameState.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const uturnFourSteps = {
  id: "uturn-four-steps",
  title: "U-turn four times",
  module: "movement",
  description:
    "Each U-turn rotates 180°. Four in a row (720°) returns the robot to its original facing; position is unchanged.",
  parityIds: ["PC-MOV-002"],
  testEvidence: "src/engine/__tests__/movement.test.js",
  buildState: () => {
    const board = createBoard(6, 6);
    return createInitialState({
      board,
      robots: [{ col: 2, row: 2, direction: 0 }],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [1, 2, 3, 4].map((n) => ({
    label: `U-turn (${n}/4)`,
    apply: (s) => applyMove(s, "r1", "uturn"),
  })),
  assert: (s) => {
    const r = s.robots[0];
    const pos = r.col === 2 && r.row === 2;
    const dir = r.direction === 0;
    const ok = pos && dir;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected still at (2,2) facing N (0), got (${r.col},${r.row}) dir ${r.direction}`,
        };
  },
};
