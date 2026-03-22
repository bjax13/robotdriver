# Rotating gears — step-by-step demo

Short visual walkthrough of the **left (L)** and **right (R)** gear cells on the demo board. Gears rotate any robot that **ends a register on that cell** (after movement cards and **after conveyor movement** for that register): **L** = 90° counterclockwise, **R** = 90° clockwise (same convention as turn-left / turn-right cards).

## Video

- [`gear_demo.mp4`](./gear_demo.mp4) — ~15s screen capture of the board with both gears visible.

## Image sequence

| Step | File | What to look for |
|------|------|------------------|
| 1 | [`step-01-board-overview.png`](./step-01-board-overview.png) | Full board: grid, robots, flags, walls/lasers. |
| 2 | [`step-02-left-gear-highlight.png`](./step-02-left-gear-highlight.png) | **Left gear** (red-tinted arc + arrow): CCW rotation per register. |
| 3 | [`step-03-right-gear-highlight.png`](./step-03-right-gear-highlight.png) | **Right gear** (green-tinted arc + arrow): CW rotation per register. |
| 4 | [`step-04-both-gears.png`](./step-04-both-gears.png) | Both gears in context (lower-middle area of the 10×10 board). |

## Try it yourself

1. Run `npm start` and open [http://localhost:3000](http://localhost:3000).
2. On the demo board, gears sit at grid cells **(6, 4)** and **(7, 4)** — column 6 / 7, row 4 in zero-based coordinates (7th / 8th column, 5th row from the top).
3. **Deal hand** → assign five program cards to a robot → **Commit program** → use **Next register** (stepped) or **Run round (instant)**.
4. Move a robot onto a gear cell and advance registers; after the register’s card runs, watch the **event log** and the robot triangle’s facing when the gear step applies.

Course JSON can define gears with `loadCourse({ ..., gears: [{ col, row, type: 'L' | 'R' }, ...] })`.
