import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const laserWallBlock = {
  id: "laser-wall-block",
  title: "Board laser blocked by wall",
  module: "lasers",
  description:
    "A factory laser fires east across two open cells before a wall stops the beam; the robot farther east takes no damage.",
  parityIds: ["PC-LSR-001"],
  testEvidence: "src/engine/__tests__/lasers.test.js",
  buildState: () => {
    const walls = [{ col: 2, row: 2, edge: "E" }];
    const boardLasers = [{ col: 0, row: 2, direction: 90 }];
    const board = createBoard(8, 6, walls, boardLasers);
    return createInitialState({
      board,
      robots: [{ col: 5, row: 2, direction: 0 }],
      antenna: { col: 7, row: 5 },
    });
  },
  steps: [
    {
      label: "Resolve lasers",
      apply: (s) => runBoardElementStep(s, 0, "lasers").state,
    },
  ],
  assert: (s) => {
    const d = s.robots[0].damage ?? 0;
    const ok = d === 0;
    return ok ? { ok: true } : { ok: false, reason: `expected damage 0, got ${d}` };
  },
};
