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

const ROBOT_BODY_COLORS = [
  "#1d4ed8",
  "#15803d",
  "#a16207",
  "#7c3aed",
  "#b91c1c",
  "#0e7490",
];

const ROBOT_TIP_COLORS = [
  "#fca5a5",
  "#86efac",
  "#fde047",
  "#d8b4fe",
  "#fecaca",
  "#67e8f9",
];

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
