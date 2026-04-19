import { createBoard } from "../../engine/board.js";
import { createInitialState, applyMove } from "../../engine/gameState.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const pushChain = {
  id: "push-chain",
  title: "Push chain moves three robots",
  module: "push",
  description:
    "Blue leads forward so the line advances. Green moves forward next; only Green and Gold shift, leaving a one-cell gap before Blue. Gold then backs twice: first push hits only Green (Blue is not adjacent in the chain), second push links all three west.",
  parityIds: ["PC-PSH-001"],
  testEvidence: "src/engine/__tests__/push.test.js",
  initialTraceLabel:
    "Start — Blue r1, Green r2, Gold r3 (col 1–3), all facing east",
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
      label:
        "Blue forward 1 — push chain east: Blue, Green, and Gold each move one cell",
      apply: (s) => applyMove(s, "r1", "move1"),
    },
    {
      label:
        "Green forward 1 — Green and Gold move east; Blue stays (gap at column 3)",
      apply: (s) => applyMove(s, "r2", "move1"),
    },
    {
      label:
        "Gold back 1 — Green and Gold move west; Blue still out of chain (gap)",
      apply: (s) => applyMove(s, "r3", "back"),
    },
    {
      label:
        "Gold back 2 — push chain west: Blue, Green, and Gold each move one cell",
      apply: (s) => applyMove(s, "r3", "back"),
    },
  ],
  assert: (s) => {
    const [a, b, c] = s.robots;
    const ok =
      a.col === 1 &&
      a.row === 0 &&
      b.col === 2 &&
      b.row === 0 &&
      c.col === 3 &&
      c.row === 0;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected positions (1,0)(2,0)(3,0), got (${a.col},${a.row}) (${b.col},${b.row}) (${c.col},${c.row})`,
        };
  },
};
