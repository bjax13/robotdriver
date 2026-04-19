import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const checkpointLaterFlagIgnored = {
  id: "checkpoint-later-flag-ignored",
  title: "Later checkpoint does not count until prior flags are done (2016 next-flag)",
  module: "scenario / postRegisterBoard / applyCheckpoints",
  description:
    "Only the cell at checkpoints[nextCheckpoint] advances progress. Standing on a later flag first leaves nextCheckpoint unchanged and does not declare a winner.",
  parityIds: ["PC-PRB-002"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  initialTraceLabel: "start (robot on 2nd flag only, nextCheckpoint 0)",
  buildState: () => {
    const board = createBoard(8, 5);
    board.checkpoints = [
      { col: 2, row: 2 },
      { col: 6, row: 2 },
    ];
    return createInitialState({
      board,
      robots: [{ col: 6, row: 2, direction: 0 }],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    {
      label: "Resolve checkpoints step",
      apply: (s) => runBoardElementStep(s, 0, "checkpoints").state,
    },
  ],
  assert: (s) => {
    const nc = s.robots[0].nextCheckpoint ?? 0;
    if (nc !== 0) {
      return { ok: false, reason: `expected nextCheckpoint 0 (still need 1st flag), got ${nc}` };
    }
    if (s.winner !== undefined) {
      return { ok: false, reason: `expected no winner, got ${s.winner}` };
    }
    return { ok: true };
  },
};
