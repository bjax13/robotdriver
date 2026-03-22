# Robo Rally Rules Reference

> Rules compiled for implementing a Robo Rally engine in robotdriver.
> Sources: Wizards of the Coast (2017), UltraBoardGames, OfficialGameRules.org

---

## Overview

**Robo Rally** is a strategy racing game for 2–6 players where you program robots to navigate a hazardous factory floor and reach checkpoints in order. Robots can push each other, get shot by lasers, and fall into pits. **First robot to reach all checkpoints wins.**

---

## Game Structure

### Round Phases (repeat each round until someone wins)

1. **Upgrade Phase** – Spend energy cubes to buy upgrades
2. **Programming Phase** – All players simultaneously select 5 cards for registers 1–5
3. **Activation Phase** – Execute registers 1–5 in order; board elements fire after each register

---

## Priority

- **Priority antenna** – Determines turn order during activation.
- Closest robot to antenna acts first, then next-closest, etc.
- Ties: use direction the antenna points (clockwise).

---

## Programming Phase

- Draw **9 cards** from deck (shuffle if fewer remain).
- Select **5 cards** and place in order on registers 1–5.
- 30-second timer; unplayed cards are randomly placed if time runs out.

---

## Programming Card Types

| Card | Effect |
|------|--------|
| **Move 1** | Move 1 space forward |
| **Move 2** | Move 2 spaces forward |
| **Move 3** | Move 3 spaces forward |
| **Turn Right** | Rotate 90° right, stay in place |
| **Turn Left** | Rotate 90° left, stay in place |
| **U-Turn** | Rotate 180° |
| **Back Up** | Move 1 space backward (no rotation) |
| **Power Up** | Gain 1 energy cube |
| **Again** | Repeat previous register (cannot be in register 1) |

---

## Activation Phase (per register)

1. **Player actions** – By priority order, each robot executes its card for that register.
2. **Board elements** – Conveyors, gears, push panels, lasers, pits resolve after all player actions.

Board elements affect only robots that **end the register** on them.

---

## Board Elements (resolve after each register)

### Conveyor Belts
- **Single arrow**: move 1 space in arrow direction.
- **Double arrow**: move 2 spaces (activate before single-arrow belts).
- **Curved/rotating**: rotate 90° in curve direction when moving onto belt **by the belt itself**.
- Cannot push another robot off a belt; stop on last belt space instead.
- Robot off belt → belt no longer affects it.

### Push Panels
- Push robot 1 space in facing direction.
- Activate only on registers matching the number on the panel (e.g. "2, 4" → registers 2 and 4).

### Gears
- **Red**: rotate 90° left.
- **Green**: rotate 90° right.

### Board Lasers
- Fire from red/white pointer along path.
- Hit first robot in path (no firing through walls, antenna, or multiple robots).
- Each hit: target takes 1 SPAM damage card.

### Pits
- Land on pit → immediately reboot (destroyed).

### Energy Spaces
- End move on cube → take it.
- Empty energy space at end of register 5: may take 1 cube from bank.

### Checkpoints
- Land on checkpoint (in order) to complete it.
- First to complete all checkpoints wins.

### Walls
- Block movement and line-of-sight for lasers.

### Priority Antenna
- Blocks movement and laser line-of-sight (acts like a wall).

---

## Robot Interactions

### Robot Lasers
- Fire in facing direction.
- Blocked by walls, antenna, other robots (hit first robot in line).
- Each hit: 1 SPAM damage.

### Pushing
- Enter occupied space → push that robot in your movement direction.
- Pushed robot keeps its facing.
- Can push into pits (target reboots) or off board (target reboots).
- Cannot push through walls; both stop if pusher hits wall.
- Chain pushing: A pushes B, B pushes C, etc., one space each.
- Conveyor into occupied non-belt space: pusher stops on last conveyor space (no push).

---

## Falling Off Board
- Move or get pushed off board → reboot immediately (same as pit).

---

## Damage & Reboots

- **Damage cards** (SPAM, Worm, Virus, Trojan Horse) go into deck → dilute programming.
- **Reboot**: Cancel remaining registers, take more SPAM, respawn at reboot token.
- Reboot token placement varies by course.

---

## Coordinate System Notes (for engine)

- **Directions**: 0° (up), 90° (right), 180° (down), 270° (left) — matches common `direction` use.
- **Grid**: Discrete cells; robots occupy one cell; facing matters.
- **Register order**: Resolve all register-N moves first (by priority), then board elements for that register.

---

## Example Racing Courses (Setup Reference)

| Course | Boards | Difficulty |
|--------|--------|------------|
| Dizzy Highway | Start A, 5B | Starter |
| Risky Crossing | Start A, 5A | Beginner |
| High Octane | Start A, 4B | Beginner |
| Twister | Start A, 6B | Intermediate (checkpoints on conveyors) |
| Death Trap | Start A, 2A | Advanced |

---

## Engine Implementation Checklist

- [ ] Grid/board representation (cells, walls)
- [ ] Robot: position (x, y), direction (0/90/180/270)
- [ ] Programming deck + hand + 5 registers per robot
- [ ] Priority calculation (distance to antenna)
- [ ] Card execution: Move 1–3, Turn L/R, U-Turn, Back Up
- [ ] Push resolution (chain, walls, pits, off-board)
- [ ] Board elements: conveyors, gears, push panels, lasers, pits
- [ ] Damage and reboot flow
- [ ] Checkpoint tracking and win condition
- [ ] Upgrade phase (optional for MVP)
