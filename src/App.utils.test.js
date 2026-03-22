import { CELL_SIZE, checkCollisionWithWalls } from "./App.utils";

describe("Collision Detection Tests", () => {
  const walls = [
    { x: 30, y: 0, length: CELL_SIZE, horizontal: false },
    { x: 60, y: 30, length: CELL_SIZE, horizontal: true },
  ];

  test("Collision with horizontal wall moving down", () => {
    expect(
      checkCollisionWithWalls(75, 45, walls, 180, true)
    ).toBeTruthy();
  });

  test("Collision with horizontal wall moving up", () => {
    expect(
      checkCollisionWithWalls(75, 15, walls, 0, true)
    ).toBeTruthy();
  });

  test("Collision with vertical wall moving right", () => {
    expect(
      checkCollisionWithWalls(45, 15, walls, 90, true)
    ).toBeTruthy();
  });

  test("Collision with vertical wall moving left", () => {
    expect(
      checkCollisionWithWalls(15, 15, walls, 270, true)
    ).toBeTruthy();
  });

  test("No collision when moving away from wall", () => {
    expect(checkCollisionWithWalls(45, 45, walls, 180, false)).toBeFalsy();
  });
});
