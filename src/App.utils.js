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
 * @param {CanvasRenderingContext2D} context
 * @param {{ width: number, height: number, checkpoints?: { col: number, row: number }[] }} board
 * @param {number} cellSize
 */
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
 * Forward laser beams from each active robot (for UI); same geometry as engine raycast.
 * @param {CanvasRenderingContext2D} context
 * @param {{ width: number, height: number, walls: object }} board
 * @param {{ col: number, row: number, direction: number, id: string, rebooted?: boolean }[]} robots
 * @param {number} cellSize
 */
export function drawLaserBeams(context, board, robots, cellSize) {
  context.save();
  context.strokeStyle = "rgba(239, 68, 68, 0.55)";
  context.lineWidth = 3;
  context.lineCap = "round";
  context.setLineDash([4, 4]);
  for (const robot of robots) {
    if (robot.rebooted) continue;
    const { path } = traceLaserPath(
      board,
      robots,
      robot.col,
      robot.row,
      robot.direction,
      robot.id
    );
    if (path.length === 0) continue;
    const start = toPixelCenter(robot.col, robot.row, cellSize);
    context.beginPath();
    context.moveTo(start.x, start.y);
    for (const cell of path) {
      const p = toPixelCenter(cell.col, cell.row, cellSize);
      context.lineTo(p.x, p.y);
    }
    context.stroke();
  }
  context.restore();
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
