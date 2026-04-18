import { createBoard } from "../../engine/board.js";
import { createInitialState, applyMove } from "../../engine/gameState.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const pushChain = {
  id: "push-chain",
  title: "Push chain moves three robots",
  module: "push",
  description: "Move 1 east pushes a line of robots without overlapping cells.",
  parityIds: ["PC-PSH-001"],
  testEvidence: "src/engine/__tests__/push.test.js",
  buildState: () => {
    const board = createBoard(8, 6);
    return createInitialState({
      board,
      robots: [
        { col: 1, row: 0, direction: 90 },
        { col: 2, row: 0, direction: 90 },
        { col: 3, row: 0, direction: 90 },
      ],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    {
      label: "Lead robot Move 1 east",
      apply: (s) => applyMove(s, "r1", "move1"),
    },
  ],
  assert: (s) => {
    const [a, b, c] = s.robots;
    const ok =
      a.col === 2 &&
      a.row === 0 &&
      b.col === 3 &&
      b.row === 0 &&
      c.col === 4 &&
      c.row === 0;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected positions (2,0)(3,0)(4,0), got (${a.col},${a.row}) (${b.col},${b.row}) (${c.col},${c.row})`,
        };
  },
};
