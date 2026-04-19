import { traceLaserPath } from "./engine/lasers.js";
import { directionDelta } from "./engine/movement.js";
import { toPixelCenter } from "./engine/canvasAdapter.js";

export const CANVAS_WIDTH = 300;
export const CANVAS_HEIGHT = 300;
export const CELL_SIZE = 30;
export const HALF_CELL_SIZE = CELL_SIZE / 2;

export function drawGrid(context, gridWidth, gridHeight, cellSize) {
  for (let x = 0; x <= gridWidth; x += cellSize) {
    context.moveTo(x, 0);
    context.lineTo(x, gridHeight);
  }
  for (let y = 0; y <= gridHeight; y += cellSize) {
    context.moveTo(0, y);
    context.lineTo(gridWidth, y);
  }
  context.strokeStyle = "black";
  context.stroke();
}

export const ROBOT_BODY_COLORS = [
  "#1d4ed8",
  "#15803d",
  "#a16207",
  "#7c3aed",
  "#b91c1c",
  "#0e7490",
];

export const ROBOT_TIP_COLORS = [
  "#fca5a5",
  "#86efac",
  "#fde047",
  "#d8b4fe",
  "#fecaca",
  "#67e8f9",
];

/** Short label for UI / event log (matches body color order). */
export const ROBOT_COLOR_LABELS = [
  "Blue",
  "Green",
  "Gold",
  "Purple",
  "Red",
  "Teal",
];

/**
 * Color index matches board drawing order (robots array index).
 * @param {{ id: string }[]} robots
 * @param {string} robotId
 */
export function getRobotColorIndex(robots, robotId) {
  const i = robots.findIndex((r) => r.id === robotId);
  return i < 0 ? 0 : i % ROBOT_BODY_COLORS.length;
}

export function getRobotDisplayLabel(robots, robotId) {
  const idx = getRobotColorIndex(robots, robotId);
  const color = ROBOT_COLOR_LABELS[idx];
  return `${color} (${robotId})`;
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {number} colorIndex - per-robot palette slot
 */
export function drawRobot(context, x, y, size, direction, colorIndex = 0) {
  const angle = (Math.PI / 180) * direction; // Convert degrees to radians
  const bi = colorIndex % ROBOT_BODY_COLORS.length;
  const ti = colorIndex % ROBOT_TIP_COLORS.length;

  // Calculate the vertices of the triangle
  const topX = x + size * Math.sin(angle);
  const topY = y - size * Math.cos(angle);
  const rightX = x + size * Math.sin(angle + 2.0944); // 120 degrees in radians
  const rightY = y - size * Math.cos(angle + 2.0944);
  const leftX = x + size * Math.sin(angle - 2.0944); // -120 degrees in radians
  const leftY = y - size * Math.cos(angle - 2.0944);

  // Draw main body of the robot (excluding the tip)
  context.beginPath();
  context.moveTo(rightX, rightY);
  context.lineTo(leftX, leftY);
  context.lineTo(x, y); // Center point
  context.closePath();
  context.fillStyle = ROBOT_BODY_COLORS[bi];
  context.fill();

  // Draw the tip of the robot
  context.beginPath();
  context.moveTo(topX, topY);
  context.lineTo((rightX + x) / 2, (rightY + y) / 2); // Midpoint of right side
  context.lineTo((leftX + x) / 2, (leftY + y) / 2); // Midpoint of left side
  context.closePath();
  context.fillStyle = ROBOT_TIP_COLORS[ti];
  context.fill();
}

export function drawWalls(context, walls) {
  walls.forEach((wall) => {
    context.beginPath();
    if (wall.horizontal) {
      context.moveTo(wall.x, wall.y);
      context.lineTo(wall.x + wall.length, wall.y);
    } else {
      context.moveTo(wall.x, wall.y);
      context.lineTo(wall.x, wall.y + wall.length);
    }
    context.strokeStyle = "Blue"; // Set wall color
    context.lineWidth = 2; // Set wall thickness
    context.stroke();
  });
}

/**
 * Unit vector for board direction (0=N, 90=E) in canvas coords (y down).
 * @param {number} directionDeg
 * @returns {{ ux: number, uy: number }}
 */
function boardDirectionUnit(directionDeg) {
  const rad = (Math.PI / 180) * directionDeg;
  return { ux: Math.sin(rad), uy: -Math.cos(rad) };
}

/**
 * Pixel center of the wall edge the push panel mounts on (opposite the push direction).
 * @param {number} col
 * @param {number} row
 * @param {number} directionDeg - push direction (0=N, 90=E, …)
 * @param {number} cellSize
 * @returns {{ x: number, y: number }}
 */
function pushPanelMountPoint(col, row, directionDeg, cellSize) {
  const left = col * cellSize;
  const top = row * cellSize;
  const half = cellSize / 2;
  const d = ((directionDeg % 360) + 360) % 360;
  if (d === 0) return { x: left + half, y: top + cellSize }; // south edge → push north
  if (d === 90) return { x: left, y: top + half }; // west → push east
  if (d === 180) return { x: left + half, y: top }; // north → push south
  if (d === 270) return { x: left + cellSize, y: top + half }; // east → push west
  const back = boardDirectionUnit((directionDeg + 180) % 360);
  return { x: left + half + back.ux * half, y: top + half + back.uy * half };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r
 */
function fillRoundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(Math.max(0, r), w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.fill();
}

function strokeRoundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(Math.max(0, r), w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.stroke();
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {number} cx
 * @param {number} cy
 * @param {{ ux: number, uy: number }} forward
 * @param {{ ux: number, uy: number }} perp
 * @param {number} scale
 */
function drawBeltChevron(context, cx, cy, forward, perp, scale) {
  const { ux, uy } = forward;
  const tipX = cx + ux * scale;
  const tipY = cy + uy * scale;
  const wing = scale * 0.55;
  context.beginPath();
  context.moveTo(tipX, tipY);
  context.lineTo(
    cx + ux * scale * 0.2 + perp.ux * wing,
    cy + uy * scale * 0.2 + perp.uy * wing
  );
  context.lineTo(
    cx + ux * scale * 0.2 - perp.ux * wing,
    cy + uy * scale * 0.2 - perp.uy * wing
  );
  context.closePath();
  context.fill();
}

/**
 * Scrolling chevron strip (looping tread). `phase` in [0,1) shifts the pattern along the belt.
 * @param {CanvasRenderingContext2D} context
 * @param {number} cx
 * @param {number} cy
 * @param {{ ux: number, uy: number }} forward
 * @param {{ ux: number, uy: number }} perp
 * @param {number} scale
 * @param {number} phase
 */
function drawBeltChevronStrip(context, cx, cy, forward, perp, scale, phase) {
  const pitch = scale * 0.58;
  const wrapped = ((phase % 1) + 1) % 1;
  const offset = wrapped * pitch;
  const span = scale * 2.8;
  const kMin = Math.ceil(-span / pitch - 4);
  const kMax = Math.floor(span / pitch + 4);
  const chevScale = scale * 0.68;
  for (let k = kMin; k <= kMax; k++) {
    const along = k * pitch - offset;
    const px = cx + forward.ux * along;
    const py = cy + forward.uy * along;
    drawBeltChevron(context, px, py, forward, perp, chevScale);
  }
}

/**
 * Directions that feed into (col,row) from a neighbor belt pointing this way onto our cell.
 * @param {{ conveyors?: Record<string, { direction: number }> }} board
 */
function conveyorFeedIns(board, col, row) {
  const c = board.conveyors;
  if (!c) return [];
  const out = [];
  if (c[`${col - 1},${row}`]?.direction === 90) out.push(90);
  if (c[`${col + 1},${row}`]?.direction === 270) out.push(270);
  if (c[`${col},${row - 1}`]?.direction === 180) out.push(180);
  if (c[`${col},${row + 1}`]?.direction === 0) out.push(0);
  return out;
}

/**
 * Quarter-circle arc for a 90° turn. `feedIn` / `exitDir` are board directions (0=N…).
 * @returns {{ cx: number, cy: number, r: number, startAngle: number, endAngle: number, counterclockwise: boolean } | null}
 */
function beltCornerArc(feedIn, exitDir, cellLeft, cellTop, inner) {
  const S = inner;
  const L = cellLeft;
  const T = cellTop;
  const MW = { x: L, y: T + S / 2 };
  const ME = { x: L + S, y: T + S / 2 };
  const MN = { x: L + S / 2, y: T };
  const MS = { x: L + S / 2, y: T + S };
  const TL = { x: L, y: T };
  const TR = { x: L + S, y: T };
  const BL = { x: L, y: T + S };
  const BR = { x: L + S, y: T + S };

  const delta = ((exitDir - feedIn + 360) % 360);
  if (delta !== 90 && delta !== 270) return null;

  /** Entry/exit midpoints for each turn; centers are cell inner corners equidistant to both. */
  /** @type {Record<string, { c: {x:number,y:number}, p1: {x:number,y:number}, p2: {x:number,y:number}, ccw: boolean }>} */
  const turns = {
    // ∆=+90° (clockwise around the obstacle in typical loop layouts)
    "90_180": { c: BL, p1: MW, p2: MS, ccw: false },
    "180_270": { c: TL, p1: MN, p2: MW, ccw: false },
    "270_0": { c: TR, p1: ME, p2: MN, ccw: false },
    "0_90": { c: BR, p1: MS, p2: ME, ccw: false },
    // ∆=+270° mod 360 (= left turn)
    "90_0": { c: TL, p1: MW, p2: MN, ccw: true },
    "180_90": { c: TR, p1: MN, p2: ME, ccw: true },
    "270_180": { c: BR, p1: ME, p2: MS, ccw: true },
    "0_270": { c: BL, p1: MS, p2: MW, ccw: true },
  };
  const spec = turns[`${feedIn}_${exitDir}`];
  if (!spec) return null;
  const { c, p1, p2, ccw } = spec;
  const r = Math.hypot(p1.x - c.x, p1.y - c.y);
  const startAngle = Math.atan2(p1.y - c.y, p1.x - c.x);
  const endAngle = Math.atan2(p2.y - c.y, p2.x - c.x);
  return { cx: c.x, cy: c.y, r, startAngle, endAngle, counterclockwise: ccw };
}

/**
 * Chevrons along a circular arc (two parallel arcs when `laneOffsets` has two values).
 * @param {number} phase - scroll phase 0..1
 * @param {number | number[]} laneOffsets - perpendicular offset(s) from arc radius
 */
function drawBeltArcChevronStrip(context, arc, baseScale, phase, laneOffsets) {
  const { cx, cy, r, startAngle, endAngle } = arc;
  let sweep = endAngle - startAngle;
  while (sweep <= -Math.PI) sweep += 2 * Math.PI;
  while (sweep > Math.PI) sweep -= 2 * Math.PI;

  const offsets = Array.isArray(laneOffsets) ? laneOffsets : [laneOffsets];
  const pitch = baseScale * 0.52;
  const chevScale = baseScale * 0.62;
  const wrapped = ((phase % 1) + 1) % 1;
  const shift = wrapped * pitch;

  for (const off of offsets) {
    const rr = r + off;
    const arcLen = Math.abs(sweep) * rr;
    const span = arcLen + pitch * 8;
    const kMin = Math.ceil(-span / pitch - 4);
    const kMax = Math.floor(span / pitch + 4);
    for (let k = kMin; k <= kMax; k++) {
      const along = k * pitch - shift;
      let u = arcLen > 1e-6 ? along / arcLen : 0;
      const ang = startAngle + sweep * u;
      const dpx = -Math.sin(ang) * sweep;
      const dpy = Math.cos(ang) * sweep;
      const mag = Math.hypot(dpx, dpy) || 1;
      const forward = { ux: dpx / mag, uy: dpy / mag };
      const perp = { ux: -forward.uy, uy: forward.ux };
      const px = cx + rr * Math.cos(ang);
      const py = cy + rr * Math.sin(ang);
      drawBeltChevron(context, px, py, forward, perp, chevScale);
    }
  }
}

/**
 * Standard and express conveyor belts (engine: direction 0–270, express = 2 steps).
 * @param {CanvasRenderingContext2D} context
 * @param {{ width: number, height: number, conveyors?: Record<string, { direction: number, express?: boolean }> }} board
 * @param {number} cellSize
 * @param {number} [beltPhase] - If set (0–1 loop), chevrons scroll along the arrow; omit for a static single chevron.
 */
export function drawConveyors(context, board, cellSize, beltPhase) {
  const conveyors = board.conveyors;
  if (!conveyors) return;

  const half = cellSize / 2;
  const baseScale = Math.max(8, cellSize * 0.22);
  const animate = beltPhase !== undefined && beltPhase !== null;

  for (const [key, conv] of Object.entries(conveyors)) {
    const [col, row] = key.split(",").map(Number);
    if (col < 0 || row < 0 || col >= board.width || row >= board.height) continue;

    const cx = col * cellSize + half;
    const cy = row * cellSize + half;
    const forward = boardDirectionUnit(conv.direction);
    const perp = { ux: -forward.uy, uy: forward.ux };
    const express = !!conv.express;
    const spacing = express ? baseScale * 0.45 : 0;
    const inset = 2;
    const cellLeft = col * cellSize + inset;
    const cellTop = row * cellSize + inset;
    const cellInner = cellSize - inset * 2;

    context.save();
    context.fillStyle = express ? "rgba(234, 179, 8, 0.45)" : "rgba(100, 116, 139, 0.35)";
    context.beginPath();
    context.rect(cellLeft, cellTop, cellInner, cellInner);
    context.fill();

    context.fillStyle = express ? "#a16207" : "#475569";

    const feeds = conveyorFeedIns(board, col, row);
    const feedIn = feeds.length === 1 ? feeds[0] : null;
    const exitDir = conv.direction;
    const cornerArc =
      feedIn !== null && feedIn !== exitDir
        ? beltCornerArc(feedIn, exitDir, cellLeft, cellTop, cellInner)
        : null;

    const drawStraight = () => {
      if (animate) {
        const phase = /** @type {number} */ (beltPhase);
        context.save();
        context.beginPath();
        context.rect(cellLeft, cellTop, cellInner, cellInner);
        context.clip();
        if (express) {
          drawBeltChevronStrip(
            context,
            cx - perp.ux * spacing,
            cy - perp.uy * spacing,
            forward,
            perp,
            baseScale,
            phase
          );
          drawBeltChevronStrip(
            context,
            cx + perp.ux * spacing,
            cy + perp.uy * spacing,
            forward,
            perp,
            baseScale,
            phase
          );
        } else {
          drawBeltChevronStrip(context, cx, cy, forward, perp, baseScale, phase);
        }
        context.restore();
      } else if (express) {
        drawBeltChevron(
          context,
          cx - perp.ux * spacing,
          cy - perp.uy * spacing,
          forward,
          perp,
          baseScale
        );
        drawBeltChevron(
          context,
          cx + perp.ux * spacing,
          cy + perp.uy * spacing,
          forward,
          perp,
          baseScale
        );
      } else {
        drawBeltChevron(context, cx, cy, forward, perp, baseScale);
      }
    };

    /** Two or more neighboring belts feed this tile — draw chevrons on each incoming arm plus outgoing. */
    const drawMerge = () => {
      const phaseVal = animate ? /** @type {number} */ (beltPhase) : 0;
      const hubDist = cellInner * 0.26;
      const hubX = cx - forward.ux * hubDist;
      const hubY = cy - forward.uy * hubDist;
      const incScale = baseScale * 0.88;

      /** @param {number} fd */
      const entryMidForFeed = (fd) => {
        const L = cellLeft;
        const T = cellTop;
        const S = cellInner;
        if (fd === 90) return { x: L, y: T + S / 2 };
        if (fd === 270) return { x: L + S, y: T + S / 2 };
        if (fd === 180) return { x: L + S / 2, y: T };
        if (fd === 0) return { x: L + S / 2, y: T + S };
        return { x: cx, y: cy };
      };

      context.save();
      context.beginPath();
      context.rect(cellLeft, cellTop, cellInner, cellInner);
      context.clip();

      const sortedFeeds = [...feeds].sort((a, b) => a - b);
      for (const fd of sortedFeeds) {
        const em = entryMidForFeed(fd);
        const inf = boardDirectionUnit(fd);
        const inPerp = { ux: -inf.uy, uy: inf.ux };
        const midX = (em.x + hubX) / 2;
        const midY = (em.y + hubY) / 2;
        drawBeltChevronStrip(context, midX, midY, inf, inPerp, incScale, phaseVal);
      }

      if (animate) {
        if (express) {
          drawBeltChevronStrip(
            context,
            cx - perp.ux * spacing,
            cy - perp.uy * spacing,
            forward,
            perp,
            baseScale,
            phaseVal
          );
          drawBeltChevronStrip(
            context,
            cx + perp.ux * spacing,
            cy + perp.uy * spacing,
            forward,
            perp,
            baseScale,
            phaseVal
          );
        } else {
          drawBeltChevronStrip(
            context,
            cx,
            cy,
            forward,
            perp,
            baseScale,
            phaseVal
          );
        }
      } else if (express) {
        drawBeltChevron(
          context,
          cx - perp.ux * spacing,
          cy - perp.uy * spacing,
          forward,
          perp,
          baseScale
        );
        drawBeltChevron(
          context,
          cx + perp.ux * spacing,
          cy + perp.uy * spacing,
          forward,
          perp,
          baseScale
        );
      } else {
        drawBeltChevron(context, cx, cy, forward, perp, baseScale);
      }
      context.restore();
    };

    const drawCorner = () => {
      const arc = /** @type {NonNullable<typeof cornerArc>} */ (cornerArc);
      const phase = animate ? /** @type {number} */ (beltPhase) : 0;
      context.save();
      context.beginPath();
      context.rect(cellLeft, cellTop, cellInner, cellInner);
      context.clip();
      const lanes = express ? [-spacing, spacing] : [0];
      drawBeltArcChevronStrip(context, arc, baseScale, phase, lanes);
      context.strokeStyle = express ? "rgba(113, 63, 18, 0.42)" : "rgba(51, 65, 85, 0.4)";
      context.lineWidth = Math.max(1.5, cellSize * 0.055);
      context.beginPath();
      context.arc(
        arc.cx,
        arc.cy,
        arc.r,
        arc.startAngle,
        arc.endAngle,
        arc.counterclockwise
      );
      context.stroke();
      context.restore();
    };

    if (feeds.length >= 2) {
      drawMerge();
    } else if (cornerArc) {
      drawCorner();
    } else {
      drawStraight();
    }

    if (express) {
      context.fillStyle = "#92400e";
      context.font = `bold ${Math.round(cellSize * 0.22)}px sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "bottom";
      context.fillText("2×", cx, row * cellSize + cellSize - 3);
    }

    context.restore();
  }
}

/**
 * Wall push panels: bracket on the mounting edge, arrow points into the cell (push direction).
 * @param {CanvasRenderingContext2D} context
 * @param {{ width: number, height: number, pushPanels?: Record<string, number[] | { registers: number[], direction?: number }> }} board
 * @param {number} cellSize
 */
export function drawPushPanels(context, board, cellSize) {
  const pushPanels = board.pushPanels;
  if (!pushPanels) return;

  const half = cellSize / 2;
  const plateDepth = Math.max(9, cellSize * 0.19);
  const plateSpan = cellSize * 0.76;
  const plateR = Math.min(5, cellSize * 0.07);
  const accentR = plateR * 0.65;
  const arrowLen = Math.max(7, cellSize * 0.13);
  const arrowHalfW = arrowLen * 0.42;

  for (const [key, config] of Object.entries(pushPanels)) {
    const cfg = Array.isArray(config) ? { registers: config, direction: 180 } : config;
    const [col, row] = key.split(",").map(Number);
    if (col < 0 || row < 0 || col >= board.width || row >= board.height) continue;

    const dir = cfg.direction ?? 180;
    const forward = boardDirectionUnit(dir);
    const perp = { ux: -forward.uy, uy: forward.ux };
    const mount = pushPanelMountPoint(col, row, dir, cellSize);

    context.save();
    context.translate(mount.x, mount.y);
    context.rotate(Math.atan2(forward.uy, forward.ux));

    // Metal plate hugging the wall (local +x = into the cell, away from mount)
    context.fillStyle = "rgba(148, 163, 184, 0.7)";
    context.strokeStyle = "#64748b";
    context.lineWidth = 1.5;
    fillRoundRect(context, 0, -plateSpan / 2, plateDepth, plateSpan, plateR);
    strokeRoundRect(context, 0, -plateSpan / 2, plateDepth, plateSpan, plateR);

    // Violet actuator pad
    context.fillStyle = "rgba(124, 58, 237, 0.42)";
    fillRoundRect(
      context,
      plateDepth * 0.12,
      (-plateSpan * 0.78) / 2,
      plateDepth * 0.76,
      plateSpan * 0.78,
      accentR
    );

    // Rivet dots (optional depth cue)
    context.fillStyle = "rgba(71, 85, 105, 0.85)";
    const rivetInset = plateSpan * 0.38;
    const rivetX = plateDepth * 0.48;
    context.beginPath();
    context.arc(rivetX, -rivetInset, Math.max(1.5, cellSize * 0.035), 0, Math.PI * 2);
    context.arc(rivetX, rivetInset, Math.max(1.5, cellSize * 0.035), 0, Math.PI * 2);
    context.fill();

    // Push arrow — tip reaches further into free space
    const tipX = plateDepth + arrowLen * 1.05;
    const baseX = plateDepth + arrowLen * 0.22;
    context.beginPath();
    context.moveTo(tipX, 0);
    context.lineTo(baseX, arrowHalfW);
    context.lineTo(baseX, -arrowHalfW);
    context.closePath();
    context.fillStyle = "#5b21b6";
    context.fill();

    context.restore();

    const regLabel = (cfg.registers ?? []).join(",");
    if (regLabel) {
      const cx = col * cellSize + half + forward.ux * (cellSize * 0.28) + perp.ux * (cellSize * 0.08);
      const cy = row * cellSize + half + forward.uy * (cellSize * 0.28) + perp.uy * (cellSize * 0.08);
      context.fillStyle = "#4c1d95";
      context.font = `${Math.round(cellSize * 0.18)}px monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(`R${regLabel}`, cx, cy);
    }
  }
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {{ width: number, height: number, checkpoints?: { col: number, row: number }[] }} board
 * @param {number} cellSize
 */
/**
 * Left (L) / right (R) gears: robots on the cell rotate 90° CCW / CW after each register.
 * @param {CanvasRenderingContext2D} context
 * @param {{ width: number, height: number, gears?: Record<string, 'L'|'R'> }} board
 * @param {number} cellSize
 */
export function drawGears(context, board, cellSize) {
  const gears = board.gears;
  if (!gears) return;

  const half = cellSize / 2;
  const radius = Math.max(6, cellSize * 0.24);

  for (const [key, type] of Object.entries(gears)) {
    if (type !== "L" && type !== "R") continue;
    const [col, row] = key.split(",").map(Number);
    if (col < 0 || row < 0 || col >= board.width || row >= board.height) continue;

    const cx = col * cellSize + half;
    const cy = row * cellSize + half;
    const isL = type === "L";

    context.save();
    context.translate(cx, cy);

    context.fillStyle = isL ? "rgba(185, 28, 28, 0.18)" : "rgba(22, 163, 74, 0.18)";
    context.beginPath();
    context.arc(0, 0, radius + 2, 0, Math.PI * 2);
    context.fill();

    const start = isL ? Math.PI * 0.65 : Math.PI * 0.35;
    const end = isL ? Math.PI * 1.35 : -Math.PI * 0.35;
    context.strokeStyle = isL ? "#991b1b" : "#166534";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.beginPath();
    context.arc(0, 0, radius, start, end, false);
    context.stroke();

    const prevAngle = isL ? end - 0.15 : end + 0.15;
    const tipX = radius * Math.cos(end);
    const tipY = radius * Math.sin(end);
    const px = radius * Math.cos(prevAngle);
    const py = radius * Math.sin(prevAngle);
    const dx = tipX - px;
    const dy = tipY - py;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const perpX = -uy;
    const perpY = ux;
    const wing = Math.max(3, cellSize * 0.12);
    const back = Math.max(4, cellSize * 0.16);

    context.beginPath();
    context.moveTo(tipX, tipY);
    context.lineTo(tipX - ux * back + perpX * wing, tipY - uy * back + perpY * wing);
    context.lineTo(tipX - ux * back - perpX * wing, tipY - uy * back - perpY * wing);
    context.closePath();
    context.fillStyle = isL ? "#991b1b" : "#166534";
    context.fill();

    context.restore();
  }
}

export function drawCheckpoints(context, board, cellSize) {
  const cps = board.checkpoints;
  if (!cps?.length) return;

  const half = cellSize / 2;
  const r = Math.max(4, cellSize * 0.2);

  cps.forEach((cp, i) => {
    const x = cp.col * cellSize + half;
    const y = cp.row * cellSize + half;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fillStyle = "rgba(220, 38, 38, 0.35)";
    context.fill();
    context.strokeStyle = "#b91c1c";
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = "#7f1d1d";
    context.font = `bold ${Math.round(cellSize * 0.45)}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(i + 1), x, y);
  });
}

/**
 * Pit cells — drawn after the grid so wall strokes on edges stay visible above the void fill.
 * Matches engine storage: plain object `"col,row"` → truthy, or Set of keys.
 * @param {CanvasRenderingContext2D} context
 * @param {{ width: number, height: number, pits?: Record<string, unknown>|Set<string> }} board
 * @param {number} cellSize
 */
export function drawPits(context, board, cellSize) {
  const pits = board.pits;
  if (!pits) return;

  const keys =
    pits instanceof Set ? [...pits] : Object.keys(pits).filter((k) => pits[k]);

  const inset = Math.max(2, cellSize * 0.08);
  const rr = Math.max(2, cellSize * 0.12);

  for (const key of keys) {
    const [col, row] = key.split(",").map(Number);
    if (!Number.isFinite(col) || !Number.isFinite(row)) continue;
    if (col < 0 || row < 0 || col >= board.width || row >= board.height) continue;

    const left = col * cellSize + inset;
    const top = row * cellSize + inset;
    const w = cellSize - 2 * inset;
    const h = cellSize - 2 * inset;
    if (w <= 0 || h <= 0) continue;

    context.fillStyle = "rgba(15, 23, 42, 0.92)";
    fillRoundRect(context, left, top, w, h, rr);

    const cx = col * cellSize + cellSize / 2;
    const cy = row * cellSize + cellSize / 2;
    context.fillStyle = "rgba(2, 6, 23, 0.95)";
    context.beginPath();
    context.ellipse(cx, cy, w * 0.36, h * 0.36, 0, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = "#64748b";
    context.lineWidth = 1;
    strokeRoundRect(context, left, top, w, h, rr);
  }
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {{ width: number }} board
 * @param {number} cellSize
 */
/**
 * @param {CanvasRenderingContext2D} context
 * @param {{ spawnCol?: number, spawnRow?: number, rebooted?: boolean }[]} robots
 * @param {number} cellSize
 */
export function drawSpawnMarkers(context, robots, cellSize) {
  const half = cellSize / 2;
  const s = Math.max(3, cellSize * 0.12);
  context.strokeStyle = "#0369a1";
  context.lineWidth = 2;
  for (const r of robots) {
    if (r.rebooted) continue;
    const sc = r.spawnCol;
    const sr = r.spawnRow;
    if (sc === undefined || sr === undefined) continue;
    const x = sc * cellSize + half;
    const y = sr * cellSize + half;
    context.beginPath();
    context.moveTo(x - s, y);
    context.lineTo(x, y - s);
    context.lineTo(x + s, y);
    context.lineTo(x, y + s);
    context.closePath();
    context.stroke();
  }
}

/**
 * Priority antenna marker (turn order + laser line-of-sight block when cell is empty).
 * Same diamond + “A” as `public/antenna-laser-demo.html`. Draw before {@link drawLaserBeams} so beams paint on top.
 * @param {CanvasRenderingContext2D} context
 * @param {{ col: number, row: number } | null | undefined} antenna
 * @param {number} cellSize
 */
export function drawPriorityAntenna(context, antenna, cellSize) {
  if (!antenna) return;
  const { col, row } = antenna;
  const half = cellSize / 2;
  const x = col * cellSize + half;
  const y = row * cellSize + half;
  const s = cellSize * 0.22;

  context.save();
  context.strokeStyle = "#0f172a";
  context.fillStyle = "rgba(251, 191, 36, 0.35)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x - s, y);
  context.lineTo(x, y - s * 1.2);
  context.lineTo(x + s, y);
  context.lineTo(x, y + s * 1.2);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "#0f172a";
  context.font = `bold ${Math.round(cellSize * 0.38)}px system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "bottom";
  context.fillText("A", x, y + cellSize * 0.42);
  context.restore();
}

/**
 * Pixel where the dashed beam should end inside the last cell when stopping on a wall or board edge
 * (empty termination square — not a robot hit).
 * @param {number} col
 * @param {number} row
 * @param {number} direction - beam travel direction (same as shooter facing)
 * @param {number} cellSize
 * @param {'robot'|'antenna'|'wall'|'edge'|'none'} stopReason
 */
export function laserBeamTerminationPixel(col, row, direction, cellSize, stopReason) {
  const half = cellSize / 2;
  const cx = col * cellSize + half;
  const cy = row * cellSize + half;
  if (stopReason === "robot" || stopReason === "antenna" || stopReason === "none") {
    return { x: cx, y: cy };
  }
  const inset = Math.max(2.5, cellSize * 0.08);
  const { dCol, dRow } = directionDelta(direction);
  return {
    x: cx + dCol * (half - inset),
    y: cy + dRow * (half - inset),
  };
}

/**
 * Forward laser beams from each active robot (for UI); same geometry as engine raycast.
 * Beams extend into the termination cell toward the wall or edge (not past it); round caps disabled so dashes
 * do not overshoot board bounds.
 * @param {CanvasRenderingContext2D} context
 * @param {{ width: number, height: number, walls: object }} board
 * @param {{ col: number, row: number, direction: number, id: string, rebooted?: boolean }[]} robots
 * @param {number} cellSize
 * @param {{ col: number, row: number } | null | undefined} [antenna]
 */
export function drawLaserBeams(context, board, robots, cellSize, antenna) {
  context.save();
  context.lineWidth = 3;
  context.lineCap = "butt";
  context.setLineDash([4, 4]);

  /** @param {number} sx @param {number} sy @param {string|undefined} excludeId @param {number} beamDir */
  function strokeBeam(sx, sy, excludeId, beamDir) {
    const { path, stopReason } = traceLaserPath(board, robots, sx, sy, beamDir, excludeId, antenna);
    if (path.length === 0) return;
    const start = toPixelCenter(sx, sy, cellSize);
    context.beginPath();
    context.moveTo(start.x, start.y);
    for (let i = 0; i < path.length; i++) {
      const cell = path[i];
      const last = i === path.length - 1;
      const p = last
        ? laserBeamTerminationPixel(cell.col, cell.row, beamDir, cellSize, stopReason)
        : toPixelCenter(cell.col, cell.row, cellSize);
      context.lineTo(p.x, p.y);
    }
    context.stroke();
  }

  context.strokeStyle = "rgba(239, 68, 68, 0.55)";
  for (const robot of robots) {
    if (robot.rebooted) continue;
    if (robot.powerDownThisRound) continue;
    strokeBeam(robot.col, robot.row, robot.id, robot.direction);
  }

  const emitters = board.boardLasers;
  if (emitters?.length) {
    context.strokeStyle = "rgba(249, 115, 22, 0.65)";
    for (const em of emitters) {
      strokeBeam(em.col, em.row, undefined, em.direction);
    }
  }
  context.restore();
}

/**
 * Visual origin for each wall-mounted laser: housing + wedge pointing along the beam direction.
 * @param {CanvasRenderingContext2D} context
 * @param {{ boardLasers?: { col: number, row: number, direction: number }[] }} board
 * @param {number} cellSize
 */
export function drawBoardLaserEmitters(context, board, cellSize) {
  const emitters = board.boardLasers;
  if (!emitters?.length) return;

  const housingR = Math.max(6, cellSize * 0.2);
  const tipDist = housingR + Math.max(6, cellSize * 0.22);
  const baseHalf = Math.max(3, cellSize * 0.12);
  const back = housingR * 0.35;

  for (const em of emitters) {
    const { x, y } = toPixelCenter(em.col, em.row, cellSize);
    const rad = (Math.PI / 180) * em.direction;
    const fx = Math.sin(rad);
    const fy = -Math.cos(rad);
    const px = -fy;
    const py = fx;

    context.save();
    context.lineJoin = "round";

    context.beginPath();
    context.arc(x, y, housingR, 0, Math.PI * 2);
    context.fillStyle = "rgba(255, 247, 237, 0.95)";
    context.fill();
    context.strokeStyle = "#c2410c";
    context.lineWidth = 2;
    context.stroke();

    const baseX = x - fx * back;
    const baseY = y - fy * back;
    context.beginPath();
    context.moveTo(baseX + px * baseHalf, baseY + py * baseHalf);
    context.lineTo(x + fx * tipDist, y + fy * tipDist);
    context.lineTo(baseX - px * baseHalf, baseY - py * baseHalf);
    context.closePath();
    context.fillStyle = "#f97316";
    context.fill();
    context.strokeStyle = "#9a3412";
    context.lineWidth = 1.5;
    context.stroke();

    context.restore();
  }
}

export function drawStartSlotLabels(context, board, cellSize) {
  const pad = 4;
  context.fillStyle = "rgba(0,0,0,0.45)";
  context.font = `bold ${Math.round(cellSize * 0.28)}px sans-serif`;
  context.textAlign = "left";
  context.textBaseline = "top";

  for (let col = 0; col < board.width; col += 2) {
    const slot = col / 2 + 1;
    const x = col * cellSize + pad;
    const y = pad;
    context.fillText(String(slot), x, y);
  }
}

export const checkCollisionWithWalls = (
  nextX,
  nextY,
  walls,
  direction,
  isMovingForward
) => {
  for (let wall of walls) {
    if (wall.horizontal) {
      // Check collision with horizontal wall
      if (isMovingForward) {
        if (
          direction === 180 &&
          nextY - HALF_CELL_SIZE === wall.y &&
          nextX < wall.x + wall.length &&
          nextX + HALF_CELL_SIZE > wall.x
        ) {
          // Moving down and colliding with horizontal wall
          return true;
        } else if (
          direction === 0 &&
          nextY + HALF_CELL_SIZE === wall.y &&
          nextX < wall.x + wall.length &&
          nextX + HALF_CELL_SIZE > wall.x
        ) {
          // Moving up and colliding with horizontal wall
          return true;
        }
      } else {
        if (
          direction === 180 &&
          nextY + HALF_CELL_SIZE === wall.y &&
          nextX < wall.x + wall.length &&
          nextX + HALF_CELL_SIZE > wall.x
        ) {
          // Moving down and colliding with horizontal wall
          return true;
        } else if (
          direction === 0 &&
          nextY - HALF_CELL_SIZE === wall.y &&
          nextX < wall.x + wall.length &&
          nextX + HALF_CELL_SIZE > wall.x
        ) {
          // Moving up and colliding with horizontal wall
          return true;
        }
      }
    } else {
      // Check collision with vertical wall
      if (isMovingForward) {
        if (
          direction === 90 &&
          nextX - HALF_CELL_SIZE === wall.x &&
          nextY < wall.y + wall.length &&
          nextY + HALF_CELL_SIZE > wall.y
        ) {
          // Moving right and colliding with vertical wall
          return true;
        } else if (
          direction === 270 &&
          nextX + HALF_CELL_SIZE === wall.x &&
          nextY < wall.y + wall.length &&
          nextY + HALF_CELL_SIZE > wall.y
        ) {
          // Moving left and colliding with vertical wall
          return true;
        }
      } else {
        if (
          direction === 90 &&
          nextX + HALF_CELL_SIZE === wall.x &&
          nextY < wall.y + wall.length &&
          nextY + HALF_CELL_SIZE > wall.y
        ) {
          // Moving right and colliding with vertical wall
          return true;
        } else if (
          direction === 270 &&
          nextX - HALF_CELL_SIZE === wall.x &&
          nextY < wall.y + wall.length &&
          nextY + HALF_CELL_SIZE > wall.y
        ) {
          // Moving left and colliding with vertical wall
          return true;
        }
      }
    }
  }
  return false; // No collision
};
