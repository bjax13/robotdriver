import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import "./App.css";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CELL_SIZE,
  HALF_CELL_SIZE,
  drawCheckpoints,
  drawGrid,
  drawRobot,
  drawSpawnMarkers,
  drawStartSlotLabels,
  drawWalls,
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

function buildDemoBoardAndRobots() {
  const board = createBoard(GRID_COLS, GRID_ROWS, DEMO_WALLS);
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

function App() {
  const canvasRef = useRef(null);
  const [gameState, dispatch] = useReducer(gameReducer, initialState);
  const [selectedRobotId, setSelectedRobotId] = useState("r1");
  const [programDrafts, setProgramDrafts] = useState({});
  const [activationSession, setActivationSession] = useState(null);
  const [autoplaySeed, setAutoplaySeed] = useState("");
  const [autoStep, setAutoStep] = useState(false);
  const [autoStepMs, setAutoStepMs] = useState(800);

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

  const clearActivationSession = useCallback(() => {
    setActivationSession(null);
    setAutoStep(false);
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
    drawCheckpoints(context, displayState.board, CELL_SIZE);
    drawStartSlotLabels(context, displayState.board, CELL_SIZE);
    drawSpawnMarkers(context, displayState.robots, CELL_SIZE);
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
    if (!autoStep || !allRobotsProgrammed) return undefined;
    if (activationSession && activationSession.completedCount >= 5) return undefined;
    const id = setInterval(() => {
      goNextRef.current();
    }, Math.max(200, autoStepMs));
    return () => clearInterval(id);
  }, [autoStep, autoStepMs, allRobotsProgrammed, activationSession?.completedCount]);

  const selectedRobot = gameState.robots.find((r) => r.id === selectedRobotId);
  const hand = selectedRobot?.hand || [];
  const unlockedSlots = selectedRobot ? getUnlockedRegisterCount(selectedRobot) : 0;
  const handDrawCount = selectedRobot ? getHandDrawCount(selectedRobot) : 9;
  const lockedRegs = selectedRobot?.registers ?? [];
  const lockedCount = 5 - unlockedSlots;

  const canProgram =
    !!selectedRobot &&
    !selectedRobot.rebooted &&
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
    const seedStr = autoplaySeed.trim();
    const seed0 = seedStr ? hashStringToSeed(seedStr) : (Date.now() & 0xffffffff) >>> 0;
    const rand = mulberry32(seed0 >>> 0);
    let next = gameState;
    for (const r of gameState.robots) {
      if (r.rebooted) continue;
      const need = getUnlockedRegisterCount(r);
      const h = r.hand || [];
      if (need === 0) {
        if ((r.registers?.length ?? 0) === 5) {
          next = setProgram(next, r.id, []);
        }
        continue;
      }
      if (h.length < need) continue;
      const picks = pickProgram(next, r.id, rand);
      if (picks.length !== need) continue;
      next = setProgram(next, r.id, picks);
    }
    dispatch({ type: "MERGE_STATE", payload: next });
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

  const log = activationSession?.log ?? [];

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
          <canvas ref={canvasRef} />
          <div
            style={{
              minWidth: 280,
              maxWidth: 420,
              maxHeight: 280,
              overflowY: "auto",
              border: "1px solid #ccc",
              padding: 8,
              fontSize: 12,
              textAlign: "left",
            }}
          >
            <strong>Event log</strong> (execution order)
            {log.length === 0 && (
              <div style={{ color: "#666", marginTop: 8 }}>Step registers to record events.</div>
            )}
            <ol style={{ margin: "8px 0 0 0", paddingLeft: 18 }}>
              {log.map((entry, i) => (
                <li key={`${entry.globalOrder}-${i}`} style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>#{entry.globalOrder}</span>{" "}
                  Reg {entry.registerIndex + 1}
                  {entry.kind === "robot_action" && (
                    <>
                      {" "}
                      · P{entry.priorityInRegister} · {entry.robotId} ·{" "}
                      {CARD_LABELS[entry.card] || entry.card} → {entry.action}
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
        {displayState.winner && (
          <p data-testid="winner">Winner: {displayState.winner}</p>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 8, alignItems: "center" }}>
          <span>Robot:</span>
          {gameState.robots.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedRobotId(r.id)}
              style={{
                fontWeight: selectedRobotId === r.id ? "bold" : "normal",
              }}
            >
              {r.id}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 8 }}>
          <button type="button" onClick={onDeal}>
            Deal Hand
          </button>
          <button type="button" onClick={onCommitProgram} disabled={!canProgram}>
            Commit program ({selectedRobotId})
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
        {activationSession && (
          <p style={{ padding: "0 8px", fontSize: 14 }}>
            Stepping: register {activationSession.completedCount} / 5 complete (viewing after{" "}
            {activationSession.completedCount === 0 ? "0" : activationSession.completedCount} register
            {activationSession.completedCount === 1 ? "" : "s"})
          </p>
        )}
        <div style={{ padding: 8 }}>
          <span style={{ marginRight: 8 }}>
            Registers ({selectedRobotId}) — damage {selectedRobot?.damage ?? 0}, draw {handDrawCount},{" "}
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
      </header>
    </div>
  );
}

export default App;
