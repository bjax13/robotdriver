# Golden trace format (v0)

Machine-readable regression artifacts for activation ordering and laser resolution. Human summary: [`rulebook-edition.md`](rulebook-edition.md).

## Files

- [`golden-trace-v0.schema.json`](golden-trace-v0.schema.json) — JSON Schema (draft-07).
- Checked-in fixtures under `src/engine/__fixtures__/golden/` — frozen expected event streams:
  - [`trace-v0-priority-laser.json`](../src/engine/__fixtures__/golden/trace-v0-priority-laser.json) — antenna priority + robot laser.
  - [`trace-v0-mix-conveyor-laser-checkpoint.json`](../src/engine/__fixtures__/golden/trace-v0-mix-conveyor-laser-checkpoint.json) — conveyor chain, stacked laser audit (robot + wall), checkpoint in one register.

## Top-level shape

- `version`: `"0"` (string).
- `scenarioId`: stable slug for the scenario (not necessarily a code symbol).
- `seed`: non-negative integer; reserved for scenarios that replay from RNG (v0 fixtures often use `0` when the trace is fully determined by explicit programs).
- `events`: ordered array of normalized events.

## Normalization rules

1. **Source** — Events are produced by `activateRegisterWithEvents` (see [`src/engine/activation.js`](../src/engine/activation.js)), then passed through `normalizeActivationEventsToGoldenV0` in [`src/engine/goldenTraceV0.js`](../src/engine/goldenTraceV0.js).

2. **Ordering** — Events appear in emission order. Each normalized row gets a monotonic `step` starting at `0` (array index in the normalized list).

3. **Register** — Copied from engine `registerIndex` (`0`–`4`).

4. **Types** — Enum aligned with engine `kind`:
   - `robot_action`
   - `laser_hit`
   - `board_resolve`
   - `power_down_heal`
   - `unknown_event` — used when the engine emits a `kind` not yet mapped in [`goldenTraceV0.js`](../src/engine/goldenTraceV0.js) (`payload.kind` carries the raw kind string).

5. **Payload whitelist** — Only fields listed in the schema for each `type` may appear. Omit optional fields when unused.

6. **Numbers** — Integers only at v0 (no floats). Directions use `0 | 90 | 180 | 270` elsewhere in the engine; trace payloads mirror emitted ids and strings (`card`, `action`, `robotId`, etc.).

7. **Equality** — Tests compare normalized arrays with deep equality (`toEqual`). Future versions may add sorting rules if multiple producers exist; v0 has a single producer.
