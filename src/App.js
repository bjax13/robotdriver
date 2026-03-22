import React, { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import "./App.css";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CELL_SIZE,
  HALF_CELL_SIZE,
  drawCheckpoints,
  drawGears,
  drawGrid,
  drawRobot,
  drawLaserBeams,
  drawSpawnMarkers,
  drawStartSlotLabels,
  drawWalls,
  getRobotColorIndex,
  getRobotDisplayLabel,
} from "./App.utils";
import {
  createBoard,
  createInitialState,
  toPixelCenter,
  boardToWallSegments,
  applyMove,
  dealHands,
  setProgram,
  activateRound,
  activateRegisterWithEvents,
  CARD_TYPES,
  mulberry32,
  placeRandomCheckpoints,
  chooseInitialFacing,
  slotToCell,
  pickProgram,
  getUnlockedRegisterCount,
  getHandDrawCount,
  MAX_DAMAGE,
  declarePowerDown,
  powerDownChance,
} from "./engine";

const GRID_COLS = CANVAS_WIDTH / CELL_SIZE;
const GRID_ROWS = CANVAS_HEIGHT / CELL_SIZE;

/** Seeded placement for the three flags (checkpoints). */
const DEMO_BOARD_SEED = 0xbad5eed;

const DEMO_WALLS = [
  { col: 0, row: 0, edge: "E" },
  { col: 0, row: 1, edge: "E" },
  { col: 0, row: 2, edge: "E" },
  { col: 2, row: 1, edge: "N" },
  { col: 3, row: 1, edge: "N" },
  { col: 4, row: 1, edge: "N" },
  { col: 2, row: 2, edge: "N" },
  { col: 3, row: 2, edge: "N" },
  { col: 4, row: 2, edge: "N" },
];

/** Factory wall lasers (same geometry as robot beams). */
const DEMO_BOARD_LASERS = [{ col: 9, row: 0, direction: 270 }];

function buildDemoBoardAndRobots() {
  const board = createBoard(GRID_COLS, GRID_ROWS, DEMO_WALLS, DEMO_BOARD_LASERS);
  const excludeCells = new Set(["0,0", "2,0", "4,0"]);
  const rand = mulberry32(DEMO_BOARD_SEED >>> 0);
  placeRandomCheckpoints(board, 3, rand, {
    excludeCells,
    excludeStartRow: true,
  });

  const cp0 = board.checkpoints[0];
  const robotSpecs = [1, 2, 3].map((slotNum) => {
    const cell = slotToCell(board, slotNum);
    if (!cell) {
      throw new Error(`Invalid start slot ${slotNum} for board width ${board.width}`);
    }
    return {
      col: cell.col,
      row: cell.row,
      direction: chooseInitialFacing(board, cell.col, cell.row, cp0.col, cp0.row),
    };
  });

  return { board, robotSpecs };
}

const { board: initialBoard, robotSpecs: initialRobotSpecs } = buildDemoBoardAndRobots();

const initialState = createInitialState({
  board: initialBoard,
  robots: initialRobotSpecs,
  antenna: { col: 5, row: 5 },
  robotDeckSeedBase: 0xc0ffee,
});

const CARD_LABELS = {
  [CARD_TYPES.MOVE1]: "Move 1",
  [CARD_TYPES.MOVE2]: "Move 2",
  [CARD_TYPES.MOVE3]: "Move 3",
  [CARD_TYPES.TURN_LEFT]: "Left",
  [CARD_TYPES.TURN_RIGHT]: "Right",
  [CARD_TYPES.U_TURN]: "U-Turn",
  [CARD_TYPES.BACK]: "Back",
  [CARD_TYPES.POWER_UP]: "Power",
  [CARD_TYPES.AGAIN]: "Again",
};

const ACTION_LABELS = {
  move1: "Move 1",
  move2: "Move 2",
  move3: "Move 3",
  turnLeft: "Turn left",
  turnRight: "Turn right",
  uturn: "U-turn",
  back: "Back up",
  powerUp: "Power up",
};

/**
 * Same triangle rendering as the board, for labels and the event log.
 * @param {{ colorIndex: number, size?: number }} props
 */
function DamagePips({ damage, maxDamage }) {
  const d = Math.min(Math.max(damage ?? 0, 0), maxDamage);
  return (
    <span
      style={{ display: "inline-flex", gap: 3, alignItems: "center" }}
      role="img"
      aria-label={`Damage ${d} of ${maxDamage}`}
    >
      {Array.from({ length: maxDamage }, (_, i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: i < d ? "#dc2626" : "#e2e8f0",
            boxSizing: "border-box",
            border: "1px solid #cbd5e1",
          }}
        />
      ))}
    </span>
  );
}

function RobotSwatch({ colorIndex, size = 26 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const c = size / 2;
    const half = size * 0.38;
    drawRobot(ctx, c, c, half, 0, colorIndex);
  }, [colorIndex, size]);
  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      aria-hidden
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    />
  );
}

function gameReducer(state, action) {
  switch (action.type) {
    case "MOVE":
      return applyMove(state, action.robotId, action.payload);
    case "DEAL":
      return dealHands(state);
    case "SET_PROGRAM":
      return setProgram(state, action.robotId, action.payload);
    case "ACTIVATE":
      return activateRound(state);
    case "MERGE_STATE":
      return action.payload;
    default:
      return state;
  }
}

function hashStringToSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

const EMPTY_EVENT_LOG = [];

/**
 * If greedy pick fails, fill registers from hand using RNG (avoids repeating last round's program).
 * @param {string[]} hand
 * @param {number} need
 * @param {() => number} rand
 */
function randomPicksFromHand(hand, need, rand) {
  if (hand.length < need) return [];
  const pool = [...hand];
  const picks = [];
  for (let i = 0; i < need; i++) {
    const j = Math.floor(rand() * pool.length);
    picks.push(pool[j]);
    pool.splice(j, 1);
  }
  return picks;
}

/**
 * Fill unlocked registers using greedy pickProgram.
 * @param {*} state
 * @param {string} seedStr
 * @param {number} [rngMix] - XOR into PRNG seed so each round/button press varies (bots get new plans).
 * @param {{ allowAutoPowerDown?: boolean }} [opts]
 */
function applyAutoplayProgramsToState(state, seedStr, rngMix, opts = {}) {
  const allowAutoPowerDown = opts.allowAutoPowerDown !== false;
  const trimmed = typeof seedStr === "string" ? seedStr.trim() : "";
  const base = trimmed ? hashStringToSeed(trimmed) : 0;
  const mix =
    rngMix !== undefined && rngMix !== null
      ? rngMix >>> 0
      : (Date.now() ^ (Math.imul(17, state.robots.length + 1))) >>> 0;
  const posMix = state.robots.reduce(
    (acc, r) =>
      (acc +
        Math.imul(r.col, 131) +
        Math.imul(r.row, 17) +
        (r.nextCheckpoint ?? 0) * 3 +
        (r.direction | 0)) >>>
      0,
    0
  );
  const seed0 = (base ^ mix ^ posMix) >>> 0;
  const rand = mulberry32(seed0);
  let next = state;
  for (const r of state.robots) {
    const cur = next.robots.find((x) => x.id === r.id);
    if (!cur || cur.rebooted) continue;
    if (cur.powerDownThisRound) continue;
    if (
      allowAutoPowerDown &&
      (cur.damage ?? 0) > 0 &&
      rand() < powerDownChance(cur.damage)
    ) {
      next = declarePowerDown(next, r.id);
      continue;
    }
    const need = getUnlockedRegisterCount(cur);
    const h = cur.hand || [];
    if (need === 0) {
      if ((cur.registers?.length ?? 0) === 5) {
        next = setProgram(next, r.id, []);
      }
      continue;
    }
    if (h.length < need) continue;
    let picks = pickProgram(next, r.id, rand);
    if (picks.length !== need) {
      picks = randomPicksFromHand(h, need, rand);
    }
    if (picks.length !== need) continue;
    next = setProgram(next, r.id, picks);
  }
  return next;
}

function App() {
  const canvasRef = useRef(null);
  const eventLogRef = useRef(null);
  const [gameState, dispatch] = useReducer(gameReducer, initialState);
  const [selectedRobotId, setSelectedRobotId] = useState("r1");
  const [programDrafts, setProgramDrafts] = useState({});
  const [activationSession, setActivationSession] = useState(null);
  const [autoplaySeed, setAutoplaySeed] = useState("");
  const [autoStep, setAutoStep] = useState(false);
  const [autoDealBetweenRounds, setAutoDealBetweenRounds] = useState(false);
  const [autoPowerDownBots, setAutoPowerDownBots] = useState(true);
  const [autoStepMs, setAutoStepMs] = useState(800);
  const [dismissedWinnerId, setDismissedWinnerId] = useState(null);
  const wrapHandledSessionRef = useRef(null);
  const autoplayRngMixRef = useRef(1);

  const program = programDrafts[selectedRobotId] ?? [];

  const setProgramForSelected = useCallback((next) => {
    setProgramDrafts((d) => {
      const cur = d[selectedRobotId] ?? [];
      const val = typeof next === "function" ? next(cur) : next;
      return { ...d, [selectedRobotId]: val };
    });
  }, [selectedRobotId]);

  const displayState =
    activationSession?.snapshots?.[activationSession.completedCount] ?? gameState;

  const allRobotsProgrammed = gameState.robots.every(
    (r) => !r.rebooted && (r.registers?.length ?? 0) === 5
  );

  const mergeSessionTipToGame = useCallback(() => {
    if (activationSession && activationSession.completedCount > 0) {
      dispatch({
        type: "MERGE_STATE",
        payload: activationSession.snapshots[activationSession.completedCount],
      });
    }
  }, [activationSession]);

  const clearActivationSession = useCallback((options = {}) => {
    const preserveAutoStep = options.preserveAutoStep ?? false;
    setActivationSession(null);
    if (!preserveAutoStep) setAutoStep(false);
  }, []);

  const goNextRegister = useCallback(() => {
    setActivationSession((session) => {
      const base =
        session ?? {
          snapshots: [structuredClone(gameState)],
          completedCount: 0,
          log: [],
          nextGlobalOrder: 1,
        };
      if (base.completedCount >= 5) return base;

      const { state: next, events } = activateRegisterWithEvents(
        base.snapshots[base.completedCount],
        base.completedCount
      );

      let nextOrder = base.nextGlobalOrder;
      const newLog = [...base.log];
      for (const ev of events) {
        newLog.push({ globalOrder: nextOrder++, ...ev });
      }

      const snapshots = [
        ...base.snapshots.slice(0, base.completedCount + 1),
        next,
      ];

      return {
        snapshots,
        completedCount: base.completedCount + 1,
        log: newLog,
        nextGlobalOrder: nextOrder,
      };
    });
  }, [gameState]);

  const goPrevRegister = useCallback(() => {
    setActivationSession((session) => {
      if (!session || session.completedCount < 1) return session;
      const completedCount = session.completedCount - 1;
      const snapshots = session.snapshots.slice(0, completedCount + 1);
      const log = session.log.filter((e) => e.registerIndex < completedCount);
      const nextGlobalOrder =
        log.reduce((m, e) => Math.max(m, e.globalOrder), 0) + 1 || 1;
      return {
        ...session,
        snapshots,
        completedCount,
        log,
        nextGlobalOrder,
      };
    });
  }, []);

  const repeatLastRegister = useCallback(() => {
    setActivationSession((session) => {
      if (!session || session.completedCount < 1) return session;
      const regIdx = session.completedCount - 1;
      const { state: next, events } = activateRegisterWithEvents(
        session.snapshots[regIdx],
        regIdx
      );
      const snapshots = [
        ...session.snapshots.slice(0, session.completedCount),
        next,
      ];
      const log = session.log.filter((e) => e.registerIndex !== regIdx);
      let nextOrder = log.reduce((m, e) => Math.max(m, e.globalOrder), 0) + 1 || 1;
      const newLog = [...log];
      for (const ev of events) {
        newLog.push({ globalOrder: nextOrder++, ...ev });
      }
      return {
        ...session,
        snapshots,
        log: newLog,
        nextGlobalOrder: nextOrder,
      };
    });
  }, []);

  const move = useCallback(
    (action) => {
      dispatch({ type: "MOVE", robotId: selectedRobotId, payload: action });
    },
    [selectedRobotId]
  );

  const handleKeyPress = useCallback(
    (event) => {
      switch (event.key) {
        case "ArrowUp":
          move("move1");
          break;
        case "ArrowDown":
          move("back");
          break;
        case "ArrowLeft":
          move("turnLeft");
          break;
        case "ArrowRight":
          move("turnRight");
          break;
        default:
          break;
      }
    },
    [move]
  );

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(context, canvas.width, canvas.height, CELL_SIZE);
    const walls = boardToWallSegments(displayState.board, CELL_SIZE);
    drawWalls(context, walls);
    drawGears(context, displayState.board, CELL_SIZE);
    drawCheckpoints(context, displayState.board, CELL_SIZE);
    drawStartSlotLabels(context, displayState.board, CELL_SIZE);
    drawSpawnMarkers(context, displayState.robots, CELL_SIZE);
    drawLaserBeams(context, displayState.board, displayState.robots, CELL_SIZE);
    displayState.robots.forEach((robot, index) => {
      const { x, y } = toPixelCenter(robot.col, robot.row, CELL_SIZE);
      drawRobot(context, x, y, HALF_CELL_SIZE, robot.direction, index);
    });
  }, [displayState]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      redrawCanvas();
    }
  }, [redrawCanvas]);

  const goNextRef = useRef(goNextRegister);
  goNextRef.current = goNextRegister;

  useEffect(() => {
    if (!autoStep || !allRobotsProgrammed || gameState.winner) return undefined;
    if (activationSession && activationSession.completedCount >= 5) return undefined;
    const id = setInterval(() => {
      goNextRef.current();
    }, Math.max(200, autoStepMs));
    return () => clearInterval(id);
  }, [
    autoStep,
    autoStepMs,
    allRobotsProgrammed,
    activationSession?.completedCount,
    gameState.winner,
  ]);

  useEffect(() => {
    if (!activationSession) {
      wrapHandledSessionRef.current = null;
      return;
    }
    if (activationSession.completedCount !== 5) return;
    if (!autoDealBetweenRounds || !autoStep) return;
    if (wrapHandledSessionRef.current === activationSession) return;
    wrapHandledSessionRef.current = activationSession;

    const merged = activationSession.snapshots[5];
    if (merged.winner) {
      dispatch({ type: "MERGE_STATE", payload: merged });
      clearActivationSession({ preserveAutoStep: true });
      return;
    }
    const afterDeal = dealHands(merged);
    autoplayRngMixRef.current = (autoplayRngMixRef.current + 1) >>> 0;
    const next = applyAutoplayProgramsToState(afterDeal, autoplaySeed, autoplayRngMixRef.current, {
      allowAutoPowerDown: autoPowerDownBots,
    });
    dispatch({ type: "MERGE_STATE", payload: next });
    clearActivationSession({ preserveAutoStep: true });
    setProgramDrafts({});
  }, [
    activationSession,
    autoDealBetweenRounds,
    autoStep,
    autoplaySeed,
    autoPowerDownBots,
    clearActivationSession,
  ]);

  const selectedRobot = gameState.robots.find((r) => r.id === selectedRobotId);
  const hand = selectedRobot?.hand || [];
  const unlockedSlots = selectedRobot ? getUnlockedRegisterCount(selectedRobot) : 0;
  const handDrawCount = selectedRobot ? getHandDrawCount(selectedRobot) : 9;
  const lockedRegs = selectedRobot?.registers ?? [];
  const lockedCount = 5 - unlockedSlots;

  const canProgram =
    !!selectedRobot &&
    !selectedRobot.rebooted &&
    !selectedRobot.powerDownThisRound &&
    ((lockedRegs.length === 5 && unlockedSlots === 0 && program.length === 0) ||
      (unlockedSlots > 0 &&
        hand.length >= unlockedSlots &&
        program.length === unlockedSlots));

  useEffect(() => {
    setProgramDrafts((d) => {
      const cur = d[selectedRobotId] ?? [];
      if (cur.length <= unlockedSlots) return d;
      return { ...d, [selectedRobotId]: cur.slice(0, unlockedSlots) };
    });
  }, [selectedRobotId, unlockedSlots]);

  const addToProgram = (card) => {
    if (program.length >= unlockedSlots) return;
    const inHand = hand.filter((c) => c === card).length;
    const inProgram = program.filter((c) => c === card).length;
    if (inProgram < inHand) setProgramForSelected([...program, card]);
  };

  const removeFromProgram = (idx) => {
    setProgramForSelected(program.filter((_, i) => i !== idx));
  };

  const onDeal = () => {
    mergeSessionTipToGame();
    clearActivationSession();
    dispatch({ type: "DEAL" });
  };

  const onCommitProgram = () => {
    dispatch({ type: "SET_PROGRAM", robotId: selectedRobotId, payload: program });
    setProgramForSelected([]);
  };

  const onRunRound = () => {
    mergeSessionTipToGame();
    clearActivationSession();
    dispatch({ type: "ACTIVATE" });
  };

  const onAutoplayPrograms = () => {
    mergeSessionTipToGame();
    clearActivationSession();
    autoplayRngMixRef.current = (autoplayRngMixRef.current + 1) >>> 0;
    const next = applyAutoplayProgramsToState(gameState, autoplaySeed, autoplayRngMixRef.current, {
      allowAutoPowerDown: autoPowerDownBots,
    });
    dispatch({ type: "MERGE_STATE", payload: next });
    setProgramDrafts({});
  };

  const onDeclarePowerDown = () => {
    mergeSessionTipToGame();
    clearActivationSession();
    dispatch({ type: "MERGE_STATE", payload: declarePowerDown(gameState, selectedRobotId) });
    setProgramDrafts({});
  };

  const onSaveSteppedRound = () => {
    if (!activationSession || activationSession.completedCount < 1) return;
    dispatch({
      type: "MERGE_STATE",
      payload: activationSession.snapshots[activationSession.completedCount],
    });
    clearActivationSession();
  };

  const log = activationSession?.log ?? EMPTY_EVENT_LOG;
  const lastLogOrder = log.length > 0 ? log[log.length - 1].globalOrder : -1;

  useLayoutEffect(() => {
    const el = eventLogRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [log.length, lastLogOrder]);

  const winnerId = displayState.winner;
  useEffect(() => {
    if (!winnerId) setDismissedWinnerId(null);
  }, [winnerId]);

  const showWinModal = Boolean(winnerId && dismissedWinnerId !== winnerId);

  return (
    <div className="App">
      {showWinModal && (
        <div
          className="winModalBackdrop"
          role="presentation"
          onClick={() => setDismissedWinnerId(winnerId)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDismissedWinnerId(winnerId);
          }}
        >
          <div
            className="winModalPanel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="win-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="win-modal-title" className="winModalTitle">
              Win
            </h2>
            <p className="winModalBody">First to the final flag:</p>
            <div className="winModalWinner">
              <RobotSwatch colorIndex={getRobotColorIndex(gameState.robots, winnerId)} size={40} />
              <span className="winModalWinnerLabel">
                {getRobotDisplayLabel(gameState.robots, winnerId)}
              </span>
            </div>
            <button type="button" className="winModalDismiss" onClick={() => setDismissedWinnerId(winnerId)}>
              Dismiss
            </button>
          </div>
        </div>
      )}
      <header className="App-header">
        <div className="gameMain">
        <div className="gameTopRow">
          <canvas ref={canvasRef} />
          <div ref={eventLogRef} className="eventLogPanel">
            <strong>Event log</strong> (execution order)
            {log.length === 0 && (
              <div style={{ color: "#94a3b8", marginTop: 8 }}>Step registers to record events.</div>
            )}
            <ol style={{ margin: "8px 0 0 0", paddingLeft: 18 }}>
              {log.map((entry, i) => (
                <li key={`${entry.globalOrder}-${i}`} style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>#{entry.globalOrder}</span>{" "}
                  Reg {entry.registerIndex + 1}
                  {entry.kind === "robot_action" && (
                    <>
                      {" "}
                      · P{entry.priorityInRegister} ·{" "}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          verticalAlign: "middle",
                        }}
                      >
                        <RobotSwatch
                          colorIndex={getRobotColorIndex(gameState.robots, entry.robotId)}
                          size={22}
                        />
                        <span style={{ fontWeight: 600 }}>
                          {getRobotDisplayLabel(gameState.robots, entry.robotId)}
                        </span>
                      </span>
                      {" "}
                      · {CARD_LABELS[entry.card] || entry.card} →{" "}
                      {ACTION_LABELS[entry.action] || entry.action}
                    </>
                  )}
                  {entry.kind === "laser_hit" && (
                    <>
                      {" "}
                      · Laser{" "}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          flexWrap: "wrap",
                          verticalAlign: "middle",
                        }}
                      >
                        {entry.shooterId.startsWith("wall:") ? (
                          <span style={{ fontWeight: 600 }}>Wall laser</span>
                        ) : (
                          <>
                            <RobotSwatch
                              colorIndex={getRobotColorIndex(
                                gameState.robots,
                                entry.shooterId
                              )}
                              size={20}
                            />
                            <span>
                              {getRobotDisplayLabel(gameState.robots, entry.shooterId)}
                            </span>
                          </>
                        )}
                        <span aria-hidden>→</span>
                        <RobotSwatch
                          colorIndex={getRobotColorIndex(
                            gameState.robots,
                            entry.targetId
                          )}
                          size={20}
                        />
                        <span>
                          {getRobotDisplayLabel(gameState.robots, entry.targetId)}
                        </span>
                      </span>
                      {" "}
                      (+1 damage)
                    </>
                  )}
                  {entry.kind === "power_down_heal" && (
                    <>
                      {" "}
                      · Power down complete —{" "}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <RobotSwatch
                          colorIndex={getRobotColorIndex(gameState.robots, entry.robotId)}
                          size={20}
                        />
                        {getRobotDisplayLabel(gameState.robots, entry.robotId)} healed to full
                      </span>
                    </>
                  )}
                  {entry.kind === "board_resolve" && (
                    <> · board: {entry.details}</>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="statusBand" aria-live="polite">
          {displayState.winner ? (
            <p data-testid="winner" className="statusBandInner">
              <span>Winner:</span>
              <RobotSwatch
                colorIndex={getRobotColorIndex(gameState.robots, displayState.winner)}
                size={28}
              />
              <span>{getRobotDisplayLabel(gameState.robots, displayState.winner)}</span>
            </p>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 8, alignItems: "center" }}>
          <span>Robot:</span>
          {gameState.robots.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedRobotId(r.id)}
              style={{
                fontWeight: selectedRobotId === r.id ? "bold" : "normal",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RobotSwatch colorIndex={getRobotColorIndex(gameState.robots, r.id)} size={24} />
              {r.id}
              {r.powerDownThisRound ? (
                <span style={{ fontSize: 10, color: "#fbbf24", marginLeft: 2 }} title="Powering down">
                  PD
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="hudRow" style={{ paddingTop: 4 }}>
          <span style={{ fontSize: 12, color: "#94a3b8", marginRight: 4 }}>Damage:</span>
          {displayState.robots.map((r) => (
            <div
              key={r.id}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <RobotSwatch colorIndex={getRobotColorIndex(gameState.robots, r.id)} size={20} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{r.id}</span>
              {r.powerDownThisRound ? (
                <span style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700 }} title="Power down">
                  PD
                </span>
              ) : null}
              <DamagePips damage={r.damage} maxDamage={MAX_DAMAGE} />
              <span style={{ fontSize: 11, color: "#64748b" }}>
                {Math.min(r.damage ?? 0, MAX_DAMAGE)}/{MAX_DAMAGE}
              </span>
            </div>
          ))}
        </div>
        {(displayState.board.checkpoints?.length ?? 0) > 0 && (
          <div className="hudRow" style={{ paddingTop: 0 }}>
            <span style={{ fontSize: 12, color: "#94a3b8", marginRight: 4 }}>Flags:</span>
            {displayState.robots.map((r) => {
              const n = displayState.board.checkpoints.length;
              const nextCp = r.nextCheckpoint ?? 0;
              const done = Math.max(0, Math.min(nextCp, n));
              return (
                <div
                  key={r.id}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                  aria-label={`${r.id} flags: ${done} of ${n}`}
                >
                  <RobotSwatch colorIndex={getRobotColorIndex(gameState.robots, r.id)} size={20} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{r.id}</span>
                  <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                    {displayState.board.checkpoints.map((_, i) => (
                      <span
                        key={i}
                        title={`Flag ${i + 1}`}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          fontSize: 11,
                          lineHeight: "16px",
                          textAlign: "center",
                          boxSizing: "border-box",
                          border: "2px solid #b91c1c",
                          background: nextCp > i ? "rgba(220, 38, 38, 0.35)" : "transparent",
                          color: "#fecaca",
                          fontWeight: 700,
                        }}
                      >
                        {nextCp > i ? "✓" : i + 1}
                      </span>
                    ))}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    {done}/{n}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 8 }}>
          <button type="button" onClick={onDeal}>
            Deal Hand
          </button>
          <button type="button" onClick={onCommitProgram} disabled={!canProgram}>
            Commit program ({selectedRobotId})
          </button>
          <button
            type="button"
            onClick={onDeclarePowerDown}
            disabled={
              !selectedRobot ||
              selectedRobot.rebooted ||
              !!selectedRobot.powerDownThisRound
            }
            title="No program moves this round; heal to full damage after 5 registers (still on board / conveyors / lasers)"
          >
            Power down ({selectedRobotId})
          </button>
          <button type="button" onClick={onRunRound} disabled={!allRobotsProgrammed}>
            Run round (instant)
          </button>
          <button
            type="button"
            onClick={goNextRegister}
            disabled={!allRobotsProgrammed || (activationSession?.completedCount ?? 0) >= 5}
          >
            Next register
          </button>
          <button
            type="button"
            onClick={goPrevRegister}
            disabled={!activationSession || activationSession.completedCount < 1}
          >
            Previous register
          </button>
          <button
            type="button"
            onClick={repeatLastRegister}
            disabled={!activationSession || activationSession.completedCount < 1}
          >
            Repeat last register
          </button>
          <button
            type="button"
            onClick={onSaveSteppedRound}
            disabled={!activationSession || activationSession.completedCount < 1}
          >
            Save stepped state to game
          </button>
          <button type="button" onClick={clearActivationSession}>
            Reset stepping
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: 8, alignItems: "center" }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={autoStep}
              onChange={(e) => setAutoStep(e.target.checked)}
            />
            Auto-advance registers
          </label>
          <label
            style={{ display: "flex", gap: 6, alignItems: "center", opacity: autoStep ? 1 : 0.55 }}
            title={autoStep ? "" : "Turn on auto-advance registers first"}
          >
            <input
              type="checkbox"
              checked={autoDealBetweenRounds}
              disabled={!autoStep}
              onChange={(e) => setAutoDealBetweenRounds(e.target.checked)}
            />
            Auto deal &amp; program between rounds
          </label>
          <label
            style={{ display: "flex", gap: 6, alignItems: "center" }}
            title="When Autoplay programs runs (button or auto chain), damaged bots may power down; odds double per damage token"
          >
            <input
              type="checkbox"
              checked={autoPowerDownBots}
              onChange={(e) => setAutoPowerDownBots(e.target.checked)}
            />
            Autoplay power-down rolls
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            Interval ms
            <input
              type="number"
              min={200}
              step={100}
              value={autoStepMs}
              onChange={(e) => setAutoStepMs(Number(e.target.value) || 800)}
              style={{ width: 72 }}
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 8, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Autoplay seed (optional)"
            value={autoplaySeed}
            onChange={(e) => setAutoplaySeed(e.target.value)}
            style={{ width: 160 }}
          />
          <button
            type="button"
            onClick={onAutoplayPrograms}
            disabled={
              !gameState.robots.some((r) => {
                if (r.rebooted) return false;
                const u = getUnlockedRegisterCount(r);
                if (u === 0) return (r.registers?.length ?? 0) === 5;
                return (r.hand?.length ?? 0) >= u;
              })
            }
          >
            Autoplay programs (all robots with hands)
          </button>
        </div>
        <p className="steppingLine">
          {activationSession
            ? `Stepping: register ${activationSession.completedCount} / 5 complete (viewing after ${
                activationSession.completedCount === 0 ? "0" : activationSession.completedCount
              } register${activationSession.completedCount === 1 ? "" : "s"})`
            : "\u00a0"}
        </p>
        <div style={{ padding: 8 }}>
          <span style={{ marginRight: 8 }}>
            Registers ({selectedRobotId}) — damage {selectedRobot?.damage ?? 0}/{MAX_DAMAGE}, draw{" "}
            {handDrawCount},{" "}
            {unlockedSlots} unlocked:
          </span>
          {program.map((c, i) => (
            <button key={i} type="button" onClick={() => removeFromProgram(i)}>
              {CARD_LABELS[c] || c}
            </button>
          ))}
          {lockedCount > 0 && lockedRegs.length === 5 && (
            <span style={{ marginLeft: 8, color: "#64748b" }}>
              Locked:{" "}
              {lockedRegs.slice(unlockedSlots).map((c, i) => (
                <span key={`L${i}`} style={{ marginLeft: 4 }}>
                  {CARD_LABELS[c] || c}
                </span>
              ))}
            </span>
          )}
        </div>
        <div style={{ padding: 8 }}>
          <span style={{ marginRight: 8 }}>Hand ({selectedRobotId}):</span>
          {hand.map((c, i) => (
            <button key={i} type="button" onClick={() => addToProgram(c)}>
              {CARD_LABELS[c] || c}
            </button>
          ))}
        </div>
        <div>
          <button type="button" onClick={() => move("move1")}>
            Forward
          </button>
          <button type="button" onClick={() => move("back")}>
            Backward
          </button>
          <button type="button" onClick={() => move("turnLeft")}>
            Turn Left
          </button>
          <button type="button" onClick={() => move("turnRight")}>
            Turn Right
          </button>
          <button type="button" onClick={() => move("uturn")}>
            U-Turn
          </button>
        </div>
        </div>
      </header>
    </div>
  );
}

export default App;
