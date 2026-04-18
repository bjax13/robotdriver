# AGENTS.md

## Cursor Cloud specific instructions

This is **RobotDriver**, a client-side Robo Rally board game built with Create React App (React 18, `react-scripts 5.0.1`). There is no backend, database, or Docker dependency — the entire game engine runs in the browser.

### Rules references

- [`docs/rulebook-edition.md`](docs/rulebook-edition.md) — pinned edition + citation policy
- [`docs/parity-checklist.md`](docs/parity-checklist.md) — parity checklist (stub; grows with coverage)

### Running the app

- `npm start` — dev server on port 3000 with hot reload
- `npm test` — Jest tests (126 tests across 23 suites); use `CI=true npm test` for non-interactive mode
- `npm run build` — production build
- `npx eslint src/` — lint (0 errors, 7 pre-existing warnings)

### Notes

- ESLint is configured via `react-app` and `react-app/jest` presets in `package.json` (no separate `.eslintrc`).
- The `punycode` deprecation warning during tests is a Node 22 issue with Jest's transitive dependencies; it does not affect test results.
- CRA's `babel-preset-react-app` emits a warning about `@babel/plugin-proposal-private-property-in-object`; this is cosmetic and does not affect builds.

### Demo media (antenna vs lasers)

Static page (needs dev server): `http://localhost:3000/antenna-laser-demo.html`

Checked-in assets for sharing on mobile (open the raw file URL on GitHub for the branch you care about):

- `docs/demos/antenna-laser-demo.png` — full-page screenshot of that demo
- `docs/demos/antenna-laser-demo.mp4` — short H.264 clip (same content, easy to play on a phone)
