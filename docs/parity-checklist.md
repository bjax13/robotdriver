# Parity checklist (RobotDriver)

Status legend: **draft** (not proven) | **partial** | **green** (tests/traces linked)

Row template:

| ID | Rule / behavior | Status | Evidence (test file or golden trace) |
|----|-------------------|--------|--------------------------------------|

Modules mirror [`src/engine/`](../src/engine/). Expand rows beyond the single example in each section.

---

## activation

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-ACT-001 | Five registers execute in antenna priority order each register | draft | [`src/engine/__tests__/activation.test.js`](../src/engine/__tests__/activation.test.js) |

---

## autoplay

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-AUTO-001 | Autoplay (`pickProgram`) uses only unlocked registers; hand must cover unlocked slots (damage caps draw via `dealHands` / `getHandDrawCount`) | draft | [`autoplay.test.js`](../src/engine/__tests__/autoplay.test.js) — e.g. `pickProgram` vs `pickProgram vs damage draw limits and locked registers` (insufficient hand → `[]`, pick length ≤ `getUnlockedRegisterCount`, `dealHands` ↔ unlocked count for damage 0–4) |

---

## board

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-BRD-001 | Walls block movement per edge model (N/E/S/W on cell) | draft | [`src/engine/__tests__/board.test.js`](../src/engine/__tests__/board.test.js) · visual: `http://localhost:3000/testing/movement-walls-block` |

---

## boardElements

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-BEL-001 | Conveyors / gears / push panels resolve in documented post-register order | draft | [`src/engine/__tests__/boardElements.test.js`](../src/engine/__tests__/boardElements.test.js) · visual: `http://localhost:3000/testing/conveyor-express-one-tile`, `http://localhost:3000/testing/conveyor-express-two-tiles`, `http://localhost:3000/testing/conveyor-normal-one`, `http://localhost:3000/testing/conveyor-then-push-panel`, `http://localhost:3000/testing/gear-rotate-left`, `http://localhost:3000/testing/push-panel-register-gate` |

---

## cards

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-CRD-001 | Card types map to engine actions consistently | draft | [`src/engine/__tests__/hands.test.js`](../src/engine/__tests__/hands.test.js) |

---

## courses

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-CRS-001 | Course JSON validates before `loadCourse` builds a board | draft | [`src/engine/__tests__/courses.test.js`](../src/engine/__tests__/courses.test.js) |

---

## damage

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-DMG-001 | Laser hits apply damage and SPAM draws per engine rules | draft | [`src/engine/__tests__/damage.test.js`](../src/engine/__tests__/damage.test.js) |
| PC-DMG-002 | `addDamage`, `drawForSpam`, `rebootRobot` semantics (discard, reshuffle, reboot square) | draft | [`src/engine/__tests__/damage.test.js`](../src/engine/__tests__/damage.test.js) · visual: `http://localhost:3000/testing/damage-spam-reboot-draw` |

---

## deck

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-DCK-001 | Shuffle/draw/discard behave deterministically with seeded decks | draft | [`src/engine/__tests__/hands.test.js`](../src/engine/__tests__/hands.test.js) |

---

## gameState

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-GST-001 | `applyMove` updates occupancy and pushing consistently | draft | [`src/engine/__tests__/movement.test.js`](../src/engine/__tests__/movement.test.js) · visual: `http://localhost:3000/testing/push-chain` |

---

## lasers

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-LSR-001 | Robot beams and board lasers use same raycast / blocking semantics; `listAllLaserHits` order matches laser audit + stacked damage | draft | [`lasers.test.js`](../src/engine/__tests__/lasers.test.js) (`listAllLaserHits` ordering / first hit / stacking) · scenario doc: [`src/testing/README.md`](../src/testing/README.md) (section **Reference example (lasers — ordering, first hit, stacked damage)**) · visual: `http://localhost:3000/testing/laser-wall-block` |

---

## movement

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-MOV-001 | Step forward/back respects walls and bounds | draft | [`src/engine/__tests__/movement.test.js`](../src/engine/__tests__/movement.test.js) · visual: `http://localhost:3000/testing/movement-walls-block` |

---

## movementPassability

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-MPV-001 | Passability merges walls, pits, and robot occupancy as documented | draft | [`src/engine/__tests__/movementPassability.test.js`](../src/engine/__tests__/movementPassability.test.js) · visual: `http://localhost:3000/testing/pit-fall-spawn` |

---

## postRegisterBoard

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-PRB-001 | Post-register pipeline runs lasers then board elements in engine order | draft | [`src/engine/__tests__/postRegisterBoard.test.js`](../src/engine/__tests__/postRegisterBoard.test.js) |
| PC-PRB-002 | Checkpoints advance only when on `checkpoints[nextCheckpoint]` (later flags ignored until due; 2016 next-flag) | draft | [`src/engine/__tests__/boardElements.test.js`](../src/engine/__tests__/boardElements.test.js) · visual: `http://localhost:3000/testing/checkpoint-later-flag-ignored` |

---

## priority

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-PRIO-001 | Sort key uses Manhattan distance to antenna with stable tie-break | draft | [`src/engine/__tests__/priority.test.js`](../src/engine/__tests__/priority.test.js) · visual: `http://localhost:3000/testing/priority-tie-break` |

---

## push

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-PSH-001 | Push chains resolve without overlapping robots | draft | [`push.test.js`](../src/engine/__tests__/push.test.js) (chains; pit reboot + reboot square integration) · scenario doc: [`src/testing/README.md`](../src/testing/README.md) (section **Reference example (push — pit reboot, reboot square, conveyor vs push panel)**) · visual: `http://localhost:3000/testing/push-chain` |

---

## scenario

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-SCN-001 | Random checkpoint placement respects exclusions | draft | [`src/engine/__tests__/scenario.test.js`](../src/engine/__tests__/scenario.test.js) · visual (checkpoint order): `http://localhost:3000/testing/checkpoint-sequence` |

---

## spawn / startLine

| ID | Rule / behavior | Status | Evidence |
|----|-------------------|--------|----------|
| PC-SPN-001 | Start slots map to grid cells for a given board width | draft | [`src/engine/__tests__/startLine.test.js`](../src/engine/__tests__/startLine.test.js), [`src/engine/__tests__/spawn.test.js`](../src/engine/__tests__/spawn.test.js) |
