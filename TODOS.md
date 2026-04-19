# Follow-ups (post–Bundle A)

| # | Task | Unblocks |
|---|------|----------|
| 1 | Expand parity checklist rows beyond the stub in [`docs/parity-checklist.md`](docs/parity-checklist.md) | Rule coverage visibility; links tests/traces per PC-id |
| 2 | **(shipped)** Second v0 trace: [`trace-v0-mix-conveyor-laser-checkpoint.json`](src/engine/__fixtures__/golden/trace-v0-mix-conveyor-laser-checkpoint.json) (conveyor + robot/wall lasers + checkpoint, one register). **Next (optional):** a third trace for full five-register round or seeded RNG (`seed` in fixture) | See `PC-GTR-001` in [`docs/parity-checklist.md`](docs/parity-checklist.md) |
| 3 | Optional Playwright (or similar) smoke test: invalid course JSON shows the [`src/App.js`](src/App.js) validation banner | End-to-end guard for silent UI failures |
