import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const laserMixedPaths = {
  id: "laser-mixed-paths",
  title: "Lasers: walls, edge, robot hit, antenna",
  module: "lasers",
  description:
    "Row-separated examples on one board: robot beam stopped by wall with empty cells in front of the barrier; board laser stopped by wall; arrow north until the top edge; beam stopped on empty priority antenna; and one robot scoring hit on another.",
  parityIds: ["PC-LSR-001"],
  testEvidence: "src/engine/__tests__/lasers.test.js",
  initialTraceLabel:
    "Before lasers — Blue east into wall; Gold north to edge; Green east vs Purple; Orange east to antenna; factory beam east",
  buildState: () => {
    const walls = [
      { col: 4, row: 2, edge: "E" },
      { col: 6, row: 4, edge: "E" },
    ];
    const boardLasers = [{ col: 0, row: 4, direction: 90 }];
    const board = createBoard(12, 8, walls, boardLasers);
    return createInitialState({
      board,
      robots: [
        { col: 1, row: 2, direction: 90 },
        { col: 10, row: 6, direction: 0 },
        { col: 3, row: 3, direction: 90 },
        { col: 8, row: 3, direction: 0 },
        { col: 4, row: 5, direction: 90 },
      ],
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
    const byId = Object.fromEntries(s.robots.map((r) => [r.id, r]));
    const dmg = byId.r4?.damage ?? 0;
    const ok = dmg >= 1;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected r4 (target) damaged by r3 beam, got damage ${dmg}`,
        };
  },
};
