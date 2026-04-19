# AGENTS.md

## Cursor Cloud specific instructions

This is **RobotDriver**, a client-side Robo Rally board game built with Create React App (React 18, `react-scripts 5.0.1`). There is no backend, database, or Docker dependency — the entire game engine runs in the browser.

### Rules references

- [`docs/rulebook-edition.md`](docs/rulebook-edition.md) — pinned edition + citation policy
- [`docs/parity-checklist.md`](docs/parity-checklist.md) — parity checklist (stub; grows with coverage)

### Running the app

- `npm start` — dev server on port 3000 with hot reload
- Testing gallery — `http://localhost:3000/testing` (visual engine rule scenarios; `/testing/:id` per scenario); how to add scenarios: [`src/testing/README.md`](src/testing/README.md)
- Golden traces (activation ordering, laser/board audit stream) — [`docs/golden-trace-v0.md`](docs/golden-trace-v0.md); fixtures in [`src/engine/__fixtures__/golden/`](src/engine/__fixtures__/golden/); see **Reference example (golden trace v0)** in [`src/testing/README.md`](src/testing/README.md)
- `npm test` — Jest tests; use `CI=true npm test` for non-interactive mode
- `npm run build` — production build
- `npx eslint src/` — lint (0 errors, 7 pre-existing warnings)

### Engine rule tests ↔ parity checklist

Rule behavior and regression coverage are tracked in [`docs/parity-checklist.md`](docs/parity-checklist.md) (PC-* rows). When you add or extend a rule, link the test file (and optional visual `/testing/:id` URL) in that row.

**Example (autoplay vs damage):** [`PC-AUTO-001`](docs/parity-checklist.md) — [`src/engine/__tests__/autoplay.test.js`](src/engine/__tests__/autoplay.test.js) asserts `pickProgram` returns at most `getUnlockedRegisterCount` cards, returns `[]` if `hand.length` is below that (so draw limits cannot be bypassed), and that after `dealHands` the dealt hand size matches `getHandDrawCount` while pick count matches unlocked slots for typical damage values. Locked registers apply only when the robot already has **five** register slots (`getLockedRegisterCount`); build that state before asserting damage-related unlock counts.

### Notes

- ESLint is configured via `react-app` and `react-app/jest` presets in `package.json` (no separate `.eslintrc`).
- The `punycode` deprecation warning during tests is a Node 22 issue with Jest's transitive dependencies; it does not affect test results.
- CRA's `babel-preset-react-app` emits a warning about `@babel/plugin-proposal-private-property-in-object`; this is cosmetic and does not affect builds.

### Demo media (antenna vs lasers)

Static page (needs dev server): `http://localhost:3000/antenna-laser-demo.html`

Checked-in assets for sharing on mobile (open the raw file URL on GitHub for the branch you care about):

- `docs/demos/antenna-laser-demo.png` — full-page screenshot of that demo
- `docs/demos/antenna-laser-demo.mp4` — short H.264 clip (same content, easy to play on a phone)
