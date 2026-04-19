import { createBoard } from "../../engine/board.js";
import { createInitialState, applyMove } from "../../engine/gameState.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const pushChainWallBlock = {
  id: "push-chain-wall",
  title: "Push chain stops at wall",
  module: "push",
  description:
    "A three-robot line pushes east until the head sits in the last cell before an east-facing wall segment. Another forward push cannot compress the chain through the barrier; everyone stays put.",
  parityIds: ["PC-PSH-001"],
  testEvidence: "src/engine/__tests__/push.test.js",
  initialTraceLabel:
    "Start — Blue/Green/Gold eastbound on row 0; east wall blocks exit from column 5 toward column 6",
  buildState: () => {
    const walls = [{ col: 5, row: 0, edge: "E" }];
    const board = createBoard(8, 6, walls);
    return createInitialState({
      board,
      robots: [
        { col: 2, row: 0, direction: 90 },
        { col: 3, row: 0, direction: 90 },
        { col: 4, row: 0, direction: 90 },
      ],
      antenna: { col: 0, row: 0 },
    });
  },
  steps: [
    {
      label:
        "Blue forward 1 — train pushes east; Gold reaches column 5 (last clear cell before wall)",
      apply: (s) => applyMove(s, "r1", "move1"),
    },
    {
      label:
        "Blue forward 1 — wall blocks the chain; no robot moves",
      apply: (s) => applyMove(s, "r1", "move1"),
    },
  ],
  assert: (s) => {
    const [a, b, c] = s.robots;
    const ok =
      a.col === 3 &&
      a.row === 0 &&
      b.col === 4 &&
      b.row === 0 &&
      c.col === 5 &&
      c.row === 0;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected blocked stack (3,0)(4,0)(5,0), got (${a.col},${a.row}) (${b.col},${b.row}) (${c.col},${c.row})`,
        };
  },
};
