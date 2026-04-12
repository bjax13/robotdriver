import { traceLaserPath } from "./engine/lasers.js";
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
 * Standard and express conveyor belts (engine: direction 0–270, express = 2 steps).
 * @param {CanvasRenderingContext2D} context
 * @param {{ width: number, height: number, conveyors?: Record<string, { direction: number, express?: boolean }> }} board
 * @param {number} cellSize
 */
export function drawConveyors(context, board, cellSize) {
  const conveyors = board.conveyors;
  if (!conveyors) return;

  const half = cellSize / 2;
  const baseScale = Math.max(8, cellSize * 0.22);

  for (const [key, conv] of Object.entries(conveyors)) {
    const [col, row] = key.split(",").map(Number);
    if (col < 0 || row < 0 || col >= board.width || row >= board.height) continue;

    const cx = col * cellSize + half;
    const cy = row * cellSize + half;
    const forward = boardDirectionUnit(conv.direction);
    const perp = { ux: -forward.uy, uy: forward.ux };
    const express = !!conv.express;
    const spacing = express ? baseScale * 0.45 : 0;

    context.save();
    context.fillStyle = express ? "rgba(234, 179, 8, 0.45)" : "rgba(100, 116, 139, 0.35)";
    context.beginPath();
    context.rect(
      col * cellSize + 2,
      row * cellSize + 2,
      cellSize - 4,
      cellSize - 4
    );
    context.fill();

    context.fillStyle = express ? "#a16207" : "#475569";
    if (express) {
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
      context.fillStyle = "#92400e";
      context.font = `bold ${Math.round(cellSize * 0.22)}px sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "bottom";
      context.fillText("2×", cx, row * cellSize + cellSize - 3);
    } else {
      drawBeltChevron(context, cx, cy, forward, perp, baseScale);
    }
    context.restore();
  }
}

/**
 * Wall push panels: arrow in push direction; tiny register list.
 * @param {CanvasRenderingContext2D} context
 * @param {{ width: number, height: number, pushPanels?: Record<string, number[] | { registers: number[], direction?: number }> }} board
 * @param {number} cellSize
 */
export function drawPushPanels(context, board, cellSize) {
  const pushPanels = board.pushPanels;
  if (!pushPanels) return;

  const half = cellSize / 2;
  const scale = Math.max(7, cellSize * 0.18);

  for (const [key, config] of Object.entries(pushPanels)) {
    const cfg = Array.isArray(config) ? { registers: config, direction: 180 } : config;
    const [col, row] = key.split(",").map(Number);
    if (col < 0 || row < 0 || col >= board.width || row >= board.height) continue;

    const cx = col * cellSize + half;
    const cy = row * cellSize + half;
    const dir = cfg.direction ?? 180;
    const forward = boardDirectionUnit(dir);
    const perp = { ux: -forward.uy, uy: forward.ux };

    context.save();
    context.strokeStyle = "#7c3aed";
    context.fillStyle = "rgba(124, 58, 237, 0.2)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(cx, cy, scale * 1.1, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    const tipX = cx + forward.ux * scale * 1.2;
    const tipY = cy + forward.uy * scale * 1.2;
    context.beginPath();
    context.moveTo(tipX, tipY);
    context.lineTo(
      cx + forward.ux * scale * 0.2 + perp.ux * scale * 0.65,
      cy + forward.uy * scale * 0.2 + perp.uy * scale * 0.65
    );
    context.lineTo(
      cx + forward.ux * scale * 0.2 - perp.ux * scale * 0.65,
      cy + forward.uy * scale * 0.2 - perp.uy * scale * 0.65
    );
    context.closePath();
    context.fillStyle = "#6d28d9";
    context.fill();

    const regLabel = (cfg.registers ?? []).join(",");
    if (regLabel) {
      context.fillStyle = "#4c1d95";
      context.font = `${Math.round(cellSize * 0.2)}px monospace`;
      context.textAlign = "center";
      context.textBaseline = "top";
      context.fillText(`R${regLabel}`, cx, row * cellSize + 2);
    }
    context.restore();
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
 * Forward laser beams from each active robot (for UI); same geometry as engine raycast.
 * @param {CanvasRenderingContext2D} context
 * @param {{ width: number, height: number, walls: object }} board
 * @param {{ col: number, row: number, direction: number, id: string, rebooted?: boolean }[]} robots
 * @param {number} cellSize
 * @param {{ col: number, row: number } | null | undefined} [antenna]
 */
export function drawLaserBeams(context, board, robots, cellSize, antenna) {
  context.save();
  context.lineWidth = 3;
  context.lineCap = "round";
  context.setLineDash([4, 4]);
  for (const robot of robots) {
    if (robot.rebooted) continue;
    if (robot.powerDownThisRound) continue;
    const { path } = traceLaserPath(
      board,
      robots,
      robot.col,
      robot.row,
      robot.direction,
      robot.id,
      antenna
    );
    if (path.length === 0) continue;
    context.strokeStyle = "rgba(239, 68, 68, 0.55)";
    const start = toPixelCenter(robot.col, robot.row, cellSize);
    context.beginPath();
    context.moveTo(start.x, start.y);
    for (const cell of path) {
      const p = toPixelCenter(cell.col, cell.row, cellSize);
      context.lineTo(p.x, p.y);
    }
    context.stroke();
  }
  const emitters = board.boardLasers;
  if (emitters?.length) {
    context.strokeStyle = "rgba(249, 115, 22, 0.65)";
    for (const em of emitters) {
      const { path } = traceLaserPath(
        board,
        robots,
        em.col,
        em.row,
        em.direction,
        undefined,
        antenna
      );
      if (path.length === 0) continue;
      const start = toPixelCenter(em.col, em.row, cellSize);
      context.beginPath();
      context.moveTo(start.x, start.y);
      for (const cell of path) {
        const p = toPixelCenter(cell.col, cell.row, cellSize);
        context.lineTo(p.x, p.y);
      }
      context.stroke();
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
