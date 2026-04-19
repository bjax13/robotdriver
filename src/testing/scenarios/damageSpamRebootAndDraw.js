import { createBoard } from "../../engine/board.js";
import { createInitialState } from "../../engine/gameState.js";
import { CARD_TYPES } from "../../engine/cards.js";
import { addDamage, drawForSpam, rebootRobot } from "../../engine/damage.js";

/** Two-card pile for drawForSpam reshuffle (unique cards; multiset check stays simple). */
const DRAW_PILE = [CARD_TYPES.MOVE1, CARD_TYPES.TURN_RIGHT];

/** @type {import('../scenarioTypes.js').EngineTestScenario} */
export const damageSpamRebootAndDraw = {
  id: "damage-spam-reboot-draw",
  title: "SPAM discard, reboot square, drawForSpam reshuffle",
  module: "damage",
  description:
    "Exercises pure damage.js helpers in order: drawForSpam with an empty deck shuffles a discard pile and draws (one card remains on deck); addDamage appends laser SPAM; rebootRobot moves to the reboot token, clears registers, faces east, and appends reboot SPAM (prior discard retained).",
  parityIds: ["PC-DMG-002"],
  testEvidence: "src/engine/__tests__/damage.test.js",
  buildState: () => {
    const board = createBoard(8, 8);
    board.rebootCol = 1;
    board.rebootRow = 2;
    let state = createInitialState({
      board,
      robots: [{ col: 5, row: 5, direction: 180 }],
      antenna: { col: 0, row: 0 },
    });
    const r0 = state.robots[0];
    return {
      ...state,
      robots: [
        {
          ...r0,
          deck: [],
          discard: [],
          registers: [
            CARD_TYPES.MOVE2,
            CARD_TYPES.MOVE3,
            CARD_TYPES.BACK,
            CARD_TYPES.U_TURN,
            CARD_TYPES.POWER_UP,
          ],
        },
      ],
    };
  },
  steps: [
    {
      label: "drawForSpam (empty deck, pile shuffled into deck)",
      apply: (s) => ({
        ...s,
        robots: s.robots.map((r, i) => {
          if (i !== 0) return r;
          const out = drawForSpam([], DRAW_PILE);
          return { ...r, deck: out.deck, discard: out.discard };
        }),
      }),
    },
    {
      label: "addDamage (SPAM from hits)",
      apply: (s) => ({
        ...s,
        robots: s.robots.map((r, i) => (i === 0 ? addDamage(r, 2) : r)),
      }),
    },
    {
      label: "rebootRobot(reboot token)",
      apply: (s) => {
        const { rebootCol = 0, rebootRow = 0 } = s.board;
        return {
          ...s,
          robots: s.robots.map((r, i) =>
            i === 0 ? rebootRobot(r, rebootCol, rebootRow) : r,
          ),
        };
      },
    },
  ],
  assert: (s) => {
    const r = s.robots[0];
    const { rebootCol = -1, rebootRow = -1 } = s.board;
    const deck = r.deck || [];
    const discard = r.discard || [];
    const spamCount = discard.filter((c) => c === CARD_TYPES.SPAM).length;
    const posOk = r.col === rebootCol && r.row === rebootRow && r.direction === 90;
    const regsOk = Array.isArray(r.registers) && r.registers.length === 0;
    const discardOk = spamCount === 3;
    const deckOk = deck.length === 1 && DRAW_PILE.includes(deck[0]);
    const ok = posOk && regsOk && discardOk && deckOk;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: `expected at reboot (${rebootCol},${rebootRow}), east, no registers, 3× SPAM discard, deck of 1 from draw pile; got (${r.col},${r.row}) dir ${r.direction} registers ${(r.registers || []).length} spam ${spamCount} deckLen ${deck.length}`,
        };
  },
};
