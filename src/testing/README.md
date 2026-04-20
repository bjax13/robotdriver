# Engine test gallery (`/testing`)

Visual + headless scenarios that pin **engine rules**: same `runScenario()` drives the Pass/Fail banner on each scenario page and the summary table on `/testing`.

## Add a new rule example

1. **Create** `src/testing/scenarios/<yourScenario>.js` exporting an `EngineTestScenario` object (see `scenarioTypes.js` for fields).
2. **Register** it in `registry.js` — append to `testScenarios` and add the import.
3. **Lock it in Jest** — point `testEvidence` at a real test file; add or extend tests there.
4. **Parity row** — add an ID like `PC-*` in [`docs/parity-checklist.md`](../../docs/parity-checklist.md) with the gallery URL `http://localhost:3000/testing/<scenario-id>`.

`src/testing/__tests__/registry.test.js` runs **every** registered scenario’s `assert()` — if the scenario fails headlessly, CI fails.

## Reference example (checkpoints / post-register)

**Sequential next flag (2016-style):** only `checkpoints[nextCheckpoint]` advances progress; standing on a later checkpoint first does nothing.

| Piece | Location |
|-------|-----------|
| Scenario | [`scenarios/checkpointLaterFlagIgnored.js`](./scenarios/checkpointLaterFlagIgnored.js) |
| Registry | [`registry.js`](./registry.js) (`checkpointLaterFlagIgnored`) |
| Jest | [`../engine/__tests__/boardElements.test.js`](../engine/__tests__/boardElements.test.js) (`checkpoint sequencing`) |
| Parity | `PC-PRB-002` in [`docs/parity-checklist.md`](../../docs/parity-checklist.md) |
| URL | `/testing/checkpoint-later-flag-ignored` |

Related: [`scenarios/checkpointSequence.js`](./scenarios/checkpointSequence.js) covers touching flags **in order** through movement + checkpoint steps.

## Reference example (conveyors before push panels)

**Post-register step order:** conveyors run in the `conveyors` step; push panels run later in `push_panels` for the same activation index.

| Piece | Location |
|-------|-----------|
| Scenario | [`scenarios/conveyorThenPushPanel.js`](./scenarios/conveyorThenPushPanel.js) |
| Registry | [`registry.js`](./registry.js) (`conveyorThenPushPanel`) |
| Jest | [`../engine/__tests__/boardElements.test.js`](../engine/__tests__/boardElements.test.js) (`post-register order: conveyors run before push panels`) |
| Parity | `PC-BEL-001` in [`docs/parity-checklist.md`](../../docs/parity-checklist.md) |
| URL | `/testing/conveyor-then-push-panel` |

## Reference example (autoplay vs damage — unit tests only)

Not every rule gets a `/testing/:id` page immediately. **`PC-AUTO-001`** is covered by [`../engine/__tests__/autoplay.test.js`](../engine/__tests__/autoplay.test.js) (`pickProgram vs damage draw limits and locked registers`, plus related cases in the top-level `pickProgram` block): `pickProgram` must respect `getUnlockedRegisterCount`, refuse picks when `hand.length` is too small for unlocked slots (`getHandDrawCount` / `dealHands` alignment), and treat locked registers only when the robot already has five register cards from the prior round (`getLockedRegisterCount`). Narrative + agent-oriented summary: **Engine rule tests ↔ parity checklist** in [`AGENTS.md`](../../AGENTS.md).

| Piece | Location |
|-------|-----------|
| Jest | [`../engine/__tests__/autoplay.test.js`](../engine/__tests__/autoplay.test.js) |
| Parity | `PC-AUTO-001` in [`docs/parity-checklist.md`](../../docs/parity-checklist.md) |
| Gallery URL | *(optional later — add a scenario + registry row when a visual autoplay harness is worth it)* |

## Reference example (golden trace v0)

Headless **normalized activation traces** complement the gallery: same register replay goes through `activateRegisterWithEvents` → `normalizeActivationEventsToGoldenV0`, compared to a checked-in JSON fixture (diff-friendly regressions). Format and workflow: [`docs/golden-trace-v0.md`](../../docs/golden-trace-v0.md).

| Piece | Location |
|-------|-----------|
| Doc + schema | [`docs/golden-trace-v0.md`](../../docs/golden-trace-v0.md), [`docs/golden-trace-v0.schema.json`](../../docs/golden-trace-v0.schema.json) |
| Normalizer | [`../engine/goldenTraceV0.js`](../engine/goldenTraceV0.js) |
| Jest | [`../engine/__tests__/goldenTrace.test.js`](../engine/__tests__/goldenTrace.test.js) |
| Fixtures | [`../engine/__fixtures__/golden/trace-v0-priority-laser.json`](../engine/__fixtures__/golden/trace-v0-priority-laser.json) (priority + robot laser), [`../engine/__fixtures__/golden/trace-v0-mix-conveyor-laser-checkpoint.json`](../engine/__fixtures__/golden/trace-v0-mix-conveyor-laser-checkpoint.json) (conveyor + robot/wall lasers + checkpoint in one register) |

To add a new trace: build the board + program in a test, capture `normalizeActivationEventsToGoldenV0(events)`, paste into a new `trace-v0-*.json` under `__fixtures__/golden/`, extend `goldenTrace.test.js` with schema validation + replay `toEqual`, and keep `scenarioId` stable in the fixture.

## Reference example (lasers — ordering, first hit, stacked damage)

**Contract:** [`listAllLaserHits`](../engine/lasers.js) concatenates robot beams (`listLaserHits`, robots in array iteration order) then wall beams (`listBoardLaserHits`, emitters in `board.boardLasers` order). Post-register laser resolution walks that same list for audit events and stacks damage + SPAM per target.

| Piece | Location |
|-------|-----------|
| Source | [`../engine/lasers.js`](../engine/lasers.js) (`listAllLaserHits`, comments above `listLaserHits` / `listBoardLaserHits`) |
| Jest | [`../engine/__tests__/lasers.test.js`](../engine/__tests__/lasers.test.js) (`listAllLaserHits` — ordering / first-in-line-only / multiple beams same target; stacking damage + SPAM via `runPostRegisterBoardElements`) |
| Parity | `PC-LSR-001` in [`docs/parity-checklist.md`](../../docs/parity-checklist.md) |
| Gallery URL | *(optional — existing laser visuals:* [`laserWallBlock.js`](./scenarios/laserWallBlock.js) *,* [`laserMixedPaths.js`](./scenarios/laserMixedPaths.js)*)* |

## Reference example (push — pit reboot, reboot square, conveyor vs push panel)

**Movement push** (`stepForwardWithPush`) can place the chain front on a pit or reboot cell; **pit reboot** runs in the post-register pits steps (spawn defaults to each robot’s `spawnCol`/`spawnRow`; align with `board.rebootCol`/`rebootRow` in tests when needed). **Conveyor vs push panel** order for the same register is the same rule as [conveyors before push panels](#reference-example-conveyors-before-push-panels); additional Jest coverage lives in `push.test.js`.

| Piece | Location |
|-------|-----------|
| Jest (unit) | [`../engine/__tests__/push.test.js`](../engine/__tests__/push.test.js) (`stepForwardWithPush` — onto pit / reboot coordinates) |
| Jest (integration) | same file (`integration: programmed push + post-register pits`, `conveyor vs push panel order`) |
| Parity | `PC-PSH-001`, `PC-BEL-001` in [`docs/parity-checklist.md`](../../docs/parity-checklist.md) |
| Gallery URL | [`/testing/push-chain`](http://localhost:3000/testing/push-chain) |

## Reference example (conveyors — express vs normal, merge contention)

**Resolve order:** express belts run first (multi-step along express chains with **simultaneous** destination resolution), then normal belts one step each ([`resolveConveyors`](../engine/boardElements.js)).

**Merge / collision matrix**

| Situation | Outcome |
|-----------|---------|
| Same phase **and** same belt priority (all express or all normal), **same destination cell** after simulating each robot’s belt move | **None** of those robots move; each stays on its belt tile (destination tie). |
| Express then normal in one conveyors step | Express moves complete first (occupancy updated). Normal belts then run; an express robot already in a cell blocks a normal belt entry. |
| Destination occupied before the phase (another robot standing there) | Belt entry blocked by existing occupancy rules during simulation. |

Sliding simulation uses phase-start occupancy for **other** robots but lets each robot traverse its own chain on a per-robot occupancy copy so multi-tile express paths are consistent.

For stepped gallery helpers, `advanceExpressBeltsOneStep` / `advanceExpressBeltsTwoSteps` keep robot heading on straight runs and only apply heading changes at corner transitions.

| Piece | Location |
|-------|-----------|
| Jest | [`../engine/__tests__/boardElements.test.js`](../engine/__tests__/boardElements.test.js) (`express belts resolve before normal belts`; `same-priority normal belts into one cell`; `two express robots racing into one merge tile`) |
| Parity | `PC-BEL-001` in [`docs/parity-checklist.md`](../../docs/parity-checklist.md) |
| Gallery URLs | [`/testing/conveyor-express-two-tiles`](http://localhost:3000/testing/conveyor-express-two-tiles) *(straight two-tile chain)* · [`/testing/conveyor-express-l-chain`](http://localhost:3000/testing/conveyor-express-l-chain) *(corner chain)* · [`/testing/conveyor-express-merge-race`](http://localhost:3000/testing/conveyor-express-merge-race) *(merge contention)* · [`/testing/conveyor-express-before-normal`](http://localhost:3000/testing/conveyor-express-before-normal) *(express before normal)* |

## Reference example (activation invariants — headless stress)

After **`activateRegisterWithEvents`** or **`activateRound`**, regression tests assert: no duplicate occupied cells among active robots; every emitted `robot_action` refers to a real `robotId`; when **`winner`** is set, that robot has completed all checkpoints (`nextCheckpoint` vs `board.checkpoints.length`).

| Piece | Location |
|-------|-----------|
| Jest | [`../engine/__tests__/invariants.test.js`](../engine/__tests__/invariants.test.js) (`state invariants after activateRegisterWithEvents / activateRound`, `activation invariants under stress`) |
| Parity | tie to multiple rows (e.g. `PC-GST-001`, `PC-PRB-002`, `PC-BEL-001`) via [`docs/parity-checklist.md`](../../docs/parity-checklist.md) — invariants are cross-cutting guards |
| Gallery URL | *(none — purely headless)* |
