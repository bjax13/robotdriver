import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CELL_SIZE,
  HALF_CELL_SIZE,
  drawBoardLaserEmitters,
  drawCheckpoints,
  drawConveyors,
  drawGears,
  drawGrid,
  drawLaserBeams,
  drawPriorityAntenna,
  drawPushPanels,
  drawRobot,
  drawSpawnMarkers,
  drawStartSlotLabels,
  drawWalls,
} from "../App.utils.js";
import { boardToWallSegments, toPixelCenter } from "../engine/index.js";
import { testScenarios } from "./registry.js";
import { runScenario } from "./runScenario.js";

const STEP_MS = 750;
const RESULT_HOLD_MS = 1500;

export default function TestScenarioPage() {
  const { id } = useParams();
  const scenario = useMemo(() => testScenarios.find((s) => s.id === id), [id]);

  const canvasRef = useRef(null);

  const { trace, headlessResult } = useMemo(() => {
    if (!scenario) return { trace: [], headlessResult: null };
    const { trace: t, result } = runScenario(scenario);
    return { trace: t, headlessResult: result };
  }, [scenario]);

  const [stepIdx, setStepIdx] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setStepIdx(0);
    setShowResult(false);
    setPaused(false);
  }, [scenario?.id]);

  useEffect(() => {
    if (!scenario || paused || showResult) return undefined;
    const t = setTimeout(() => {
      setStepIdx((prev) => {
        if (prev < trace.length - 1) return prev + 1;
        setShowResult(true);
        return prev;
      });
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [scenario, paused, showResult, trace.length, stepIdx]);

  useEffect(() => {
    if (!showResult) return undefined;
    const t = setTimeout(() => {
      setStepIdx(0);
      setShowResult(false);
    }, RESULT_HOLD_MS);
    return () => clearTimeout(t);
  }, [showResult]);

  const displayState = trace[stepIdx]?.state;

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const state = displayState;
    if (!canvas || !state?.board) return;
    const w = state.board.width * CELL_SIZE;
    const h = state.board.height * CELL_SIZE;
    canvas.width = w;
    canvas.height = h;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(context, canvas.width, canvas.height, CELL_SIZE);
    const walls = boardToWallSegments(state.board, CELL_SIZE);
    drawWalls(context, walls);
    drawConveyors(context, state.board, CELL_SIZE);
    drawGears(context, state.board, CELL_SIZE);
    drawCheckpoints(context, state.board, CELL_SIZE);
    drawStartSlotLabels(context, state.board, CELL_SIZE);
    drawSpawnMarkers(context, state.robots, CELL_SIZE);
    drawPushPanels(context, state.board, CELL_SIZE);
    drawPriorityAntenna(context, state.antenna, CELL_SIZE);
    drawLaserBeams(context, state.board, state.robots, CELL_SIZE, state.antenna);
    drawBoardLaserEmitters(context, state.board, CELL_SIZE);
    state.robots.forEach((robot, index) => {
      const { x, y } = toPixelCenter(robot.col, robot.row, CELL_SIZE);
      drawRobot(context, x, y, HALF_CELL_SIZE, robot.direction, index);
    });
  }, [displayState]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  if (!scenario) {
    return (
      <div style={{ padding: 24 }}>
        <p>
          Unknown scenario <code>{id}</code>.{" "}
          <Link to="/testing">Back to overview</Link>
        </p>
      </div>
    );
  }

  const label = trace[stepIdx]?.label ?? "";
  const visualOk = headlessResult?.ok === true;

  const restart = () => {
    setShowResult(false);
    setStepIdx(0);
  };

  return (
    <div style={{ padding: "16px 24px", maxWidth: 960, margin: "0 auto" }}>
      <p style={{ marginTop: 0 }}>
        <Link to="/testing">Overview</Link>
      </p>
      <h1 style={{ marginTop: 8 }}>{scenario.title}</h1>
      <p style={{ color: "#475569" }}>{scenario.description}</p>
      <p style={{ fontSize: 13, color: "#64748b" }}>
        Module: <strong>{scenario.module}</strong>
        {" · "}
        Parity:{" "}
        <code>{scenario.parityIds.join(", ")}</code>
        {" · "}
        Jest:{" "}
        <code>{scenario.testEvidence}</code>
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <button type="button" onClick={() => setPaused((p) => !p)}>
          {paused ? "Resume" : "Pause"}
        </button>
        <button type="button" onClick={restart}>
          Restart
        </button>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid #cbd5e1",
          borderRadius: 6,
          display: "block",
          background: "#fafafa",
          maxWidth: "100%",
        }}
      />

      <p style={{ marginTop: 12, fontSize: 14 }}>
        Step {stepIdx + 1} / {trace.length}: <strong>{label}</strong>
      </p>

      <div
        role="alert"
        style={{
          marginTop: 16,
          padding: "12px 14px",
          borderRadius: 8,
          fontWeight: 700,
          background: showResult ? (visualOk ? "#dcfce7" : "#fee2e2") : "#f1f5f9",
          color: showResult ? (visualOk ? "#166534" : "#991b1b") : "#64748b",
          border: `1px solid ${showResult ? (visualOk ? "#86efac" : "#fecaca") : "#e2e8f0"}`,
        }}
      >
        {showResult
          ? visualOk
            ? "PASS — scenario assertion OK"
            : `FAIL — ${headlessResult?.reason ?? "assertion failed"}`
          : "Playing… final assertion runs at end of cycle"}
      </div>
    </div>
  );
}
