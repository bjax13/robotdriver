import { createBoard } from "../../engine/board.js";
import { createInitialState, applyMove } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const pitFallSpawn = {
  id: "pit-fall-spawn",
  title: "Pit fall returns robot to archive spawn",
  module: "movementPassability / damage",
  description:
    "Stepping onto a pit during movement is resolved in pits_pre: robot returns to its spawn square and receives reboot SPAM.",
  parityIds: ["PC-MPV-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  buildState: () => {
    const board = createBoard(6, 6);
    board.pits = { "2,2": true };
    board.rebootCol = 0;
    board.rebootRow = 0;
    return createInitialState({
      board,
      robots: [{ col: 2, row: 1, direction: 180 }],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    {
      label: "Move onto pit",
      apply: (s) => applyMove(s, "r1", "move1"),
    },
    {
      label: "Resolve pits (pre)",
      apply: (s) => runBoardElementStep(s, 0, "pits_pre").state,
    },
  ],
  assert: (s) => {
    const r = s.robots[0];
    const spam = (r.discard || []).length >= 1;
    const ok = r.col === 2 && r.row === 1 && spam;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected robot at spawn (2,1) with SPAM in discard, got (${r.col},${r.row}) discard ${(r.discard || []).length}`,
        };
  },
};
