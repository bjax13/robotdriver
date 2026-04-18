import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { sortRobotsByPriority } from "../../engine/priority.js";

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const priorityTieBreak = {
  id: "priority-tie-break",
  title: "Antenna priority tie-break (clockwise)",
  module: "priority",
  description:
    "Two robots equidistant from the antenna are ordered by clockwise tie-break from the antenna pointer (default E).",
  parityIds: ["PC-PRIO-001"],
  testEvidence: "src/engine/__tests__/priority.test.js",
  buildState: () => {
    const board = createBoard(6, 6);
    return createInitialState({
      board,
      robots: [
        { id: "r1", col: 1, row: 0, direction: 0 },
        { id: "r2", col: 0, row: 1, direction: 90 },
      ],
      antenna: { col: 0, row: 0 },
      antennaDirection: 90,
    });
  },
  steps: [
    {
      label: "Evaluate priority order (no state change)",
      apply: (s) => s,
    },
  ],
  assert: (s) => {
    const sorted = sortRobotsByPriority(s.robots, s.antenna, s.antennaDirection ?? 90);
    const ok = sorted.length === 2 && sorted[0].id === "r2" && sorted[1].id === "r1";
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected order [r2, r1], got [${sorted.map((r) => r.id).join(", ")}]`,
        };
  },
};
