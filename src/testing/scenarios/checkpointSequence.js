import { createBoard } from "../../engine/board.js";
import { createInitialState, applyMove } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const checkpointSequence = {
  id: "checkpoint-sequence",
  title: "Checkpoints must be touched in order",
  module: "scenario / postRegisterBoard",
  description:
    "After moving onto the next checkpoint cell, the checkpoints step advances nextCheckpoint; order is enforced.",
  parityIds: ["PC-SCN-001"],
  testEvidence: "src/engine/__tests__/scenario.test.js",
  buildState: () => {
    const board = createBoard(6, 6);
    board.checkpoints = [
      { col: 2, row: 2 },
      { col: 2, row: 3 },
    ];
    return createInitialState({
      board,
      robots: [{ col: 2, row: 1, direction: 180 }],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    {
      label: "Move to checkpoint 1",
      apply: (s) => applyMove(s, "r1", "move1"),
    },
    {
      label: "Resolve checkpoints",
      apply: (s) => runBoardElementStep(s, 0, "checkpoints").state,
    },
    {
      label: "Move to checkpoint 2",
      apply: (s) => applyMove(s, "r1", "move1"),
    },
    {
      label: "Resolve checkpoints again",
      apply: (s) => runBoardElementStep(s, 0, "checkpoints").state,
    },
  ],
  assert: (s) => {
    const nc = s.robots[0].nextCheckpoint ?? 0;
    const ok = nc === 2;
    return ok ? { ok: true } : { ok: false, reason: `expected nextCheckpoint 2, got ${nc}` };
  },
};
