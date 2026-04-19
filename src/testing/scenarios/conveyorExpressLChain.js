import {
  advanceExpressBeltsOneStep,
  advanceExpressBeltsTwoSteps,
} from "../../engine/boardElements.js";
import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

const EXPRESS_TILES_ON_CHAIN = 13;

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorExpressLChain = {
  id: "conveyor-express-l-chain",
  title: "Express chain: straights + corners (open Z — E, S, E, N)",
  module: "boardElements",
  description:
    "Thirteen express tiles in one open path (no loop): three east, three south, four east, three north. The stepped gallery uses advanceExpressBeltsTwoSteps so each animation step moves up to two belt cells (the yellow 2× visualization). A final runBoardElementStep(conveyors) runs resolveConveyors as in a real register (here the robot is already off the belt, so it is a no-op).",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  initialTraceLabel:
    "Before belt motion — robot on the west end of the top horizontal run; path drops south, runs east again, then climbs north to an empty exit cell",
  buildState: () => {
    const board = createBoard(10, 8);
    board.conveyors = {
      "1,2": { direction: 90, express: true },
      "2,2": { direction: 90, express: true },
      "3,2": { direction: 90, express: true },
      "4,2": { direction: 180, express: true },
      "4,3": { direction: 180, express: true },
      "4,4": { direction: 180, express: true },
      "4,5": { direction: 90, express: true },
      "5,5": { direction: 90, express: true },
      "6,5": { direction: 90, express: true },
      "7,5": { direction: 90, express: true },
      "8,5": { direction: 0, express: true },
      "8,4": { direction: 0, express: true },
      "8,3": { direction: 0, express: true },
    };
    return createInitialState({
      board,
      robots: [{ col: 1, row: 2, direction: 0 }],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    ...Array.from({ length: Math.floor(EXPRESS_TILES_ON_CHAIN / 2) }, (_, i) => ({
      label: `Gallery express 2× — step ${i + 1} of ${Math.floor(EXPRESS_TILES_ON_CHAIN / 2)} (up to two belt cells along the chain)`,
      apply: (s) => advanceExpressBeltsTwoSteps(s),
    })),
    ...(EXPRESS_TILES_ON_CHAIN % 2 === 1
      ? [
          {
            label: "Gallery express — one belt cell (odd chain length)",
            apply: (s) => advanceExpressBeltsOneStep(s),
          },
        ]
      : []),
    {
      label:
        "Register conveyors — resolveConveyors (same call as post-register; robot already on exit floor)",
      apply: (s) => runBoardElementStep(s, 0, "conveyors").state,
    },
  ],
  assert: (s) => {
    const r = s.robots[0];
    const ok = r.col === 8 && r.row === 2;
    return ok
      ? { ok: true }
      : { ok: false, reason: `expected robot at (8,2), got (${r.col},${r.row})` };
  },
};
