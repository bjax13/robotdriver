import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { runBoardElementStep } from "../../engine/postRegisterBoard.js";

/**
 * West: two express tiles (0,2)→(1,2); merge cell (2,2) is the **second** express step from the start.
 * North: two normal tiles (2,0)→(2,1) so the north arm’s **second** belt movement also targets (2,2).
 *
 * Resolution: wave 1 — express moves one, normal moves one. Wave 2 — both second movements
 * target (2,2) with the same priority → destination tie → **neither** enters the merge cell
 * (unlike the “both one square out” case where wave‑1 express can claim the cell before normal).
 */
function buildBoard() {
  const board = createBoard(8, 6);
  board.conveyors = {
    "0,2": { direction: 90, express: true },
    "1,2": { direction: 90, express: true },
    "2,0": { direction: 180, express: false },
    "2,1": { direction: 180, express: false },
  };
  return board;
}

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const conveyorExpressNormalMergeSecondTile = {
  id: "conveyor-express-normal-merge-second-tile",
  title: "Express vs normal T merge (2nd movement tie on merge cell)",
  module: "boardElements",
  description:
    "r1 rides two express tiles toward empty merge (2,2); r2 rides two normal tiles south toward the same cell. After the first movement wave, both are one step short. The second movement wave resolves express and normal together — same destination → neither moves into (2,2). Compare conveyor-express-before-normal (both bots one step from merge: express wave claims the tile first).",
  parityIds: ["PC-BEL-001"],
  testEvidence: "src/engine/__tests__/boardElements.test.js",
  initialTraceLabel:
    "Before conveyors — r1 on express at (0,2); r2 on normal at (2,0); merge (2,2) is floor",
  buildState: () =>
    createInitialState({
      board: buildBoard(),
      robots: [
        { col: 0, row: 2, direction: 90 },
        { col: 2, row: 0, direction: 180 },
      ],
      antenna: { col: 0, row: 0 },
    }),
  steps: [
    {
      label:
        "Conveyors — wave 2 destination tie: neither bot enters merge cell (2,2)",
      apply: (s) => runBoardElementStep(s, 0, "conveyors").state,
    },
  ],
  assert: (s) => {
    const r1 = s.robots.find((r) => r.id === "r1");
    const r2 = s.robots.find((r) => r.id === "r2");
    const ok =
      r1 &&
      r2 &&
      r1.col === 1 &&
      r1.row === 2 &&
      r2.col === 2 &&
      r2.row === 1;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected tie: r1 (1,2) r2 (2,1), merge (2,2) empty; got r1 (${r1?.col},${r1?.row}) r2 (${r2?.col},${r2?.row})`,
        };
  },
};
