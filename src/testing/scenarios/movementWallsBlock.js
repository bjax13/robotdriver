import { createBoard } from "../../engine/board.js";
import { createInitialState, applyMove } from "../../engine/gameState.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const movementWallsBlock = {
  id: "movement-walls-block",
  title: "Walls block forward movement",
  module: "movement / board",
  description: "A robot facing a wall on the next cell does not move when playing Move 1.",
  parityIds: ["PC-MOV-001", "PC-BRD-001"],
  testEvidence: "src/engine/__tests__/movement.test.js",
  buildState: () => {
    const walls = [{ col: 1, row: 1, edge: "E" }];
    const board = createBoard(6, 6, walls);
    return createInitialState({
      board,
      robots: [{ col: 1, row: 1, direction: 90 }],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    {
      label: "Move 1 east into wall",
      apply: (s) => applyMove(s, "r1", "move1"),
    },
  ],
  assert: (s) => {
    const r = s.robots[0];
    const ok = r.col === 1 && r.row === 1 && r.direction === 90;
    return ok ? { ok: true } : { ok: false, reason: `expected robot at (1,1) facing E, got (${r.col},${r.row}) dir ${r.direction}` };
  },
};
