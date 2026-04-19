# QA report: `http://localhost:3000/` (run 2026-04-19)

- **Date:** 2026-04-19  
- **Branch:** `main` @ `c897d90` (`feat(testing): add express conveyor visual scenarios for gallery`)  
- **Target:** React app (Create React App), dev server `npm start`  
- **Scope:** `/testing` gallery headless summary, new express scenarios, `/` course load + Deal Hand smoke  
- **Tier:** Standard (fixes only where severity warrants; low → deferred)

## Metadata

| Field | Value |
|--------|--------|
| Pages / routes visited | `/`, `/testing`, `/testing/conveyor-express-l-chain` |
| Screenshots | `testing-gallery-2026-04-18.png`, `conveyor-express-l-chain-pass.png`, `game-deal-hand-2026-04-19.png` |
| Browser | Cursor IDE browser (MCP), tab `ca3951` |
| Duration | ~10 min |

## Summary

| Metric | Value |
|--------|--------|
| Issues found | 1 (new this run) |
| Fixes applied | 0 |
| Deferred | 1 (`ISSUE-003` low) |
| **Health score** | **~93 / 100** |

### PR one-liner

QA on `main` after conveyor gallery scenarios: Testing **21 / 21** passing; Game **Load course** + **Deal Hand** OK; console shows React Router v7 future-flag warnings as `error`-level logs (defer silencing).

---

## What we verified

1. **`/testing`** — Summary line **21 / 21 passing**. Rows include new scenarios *Express chain follows corners* and *Two express belts race into one tile (merge contention)* (parity **PC-BEL-001**). Evidence: full-page screenshot `screenshots/testing-gallery-2026-04-18.png`.

2. **`/testing/conveyor-express-l-chain`** — Scenario page loads; stepped runner shows **PASS — scenario assertion OK** after animation (express L-chain). Evidence: `screenshots/conveyor-express-l-chain-pass.png`.

3. **`/` (Game)** — **Load course** clicked; **Deal Hand** clicked. Program cards appear (e.g. Move 1, Move 2, turns); **Autoplay programs** becomes clickable. Evidence: `screenshots/game-deal-hand-2026-04-19.png`.

---

## ISSUE-003 — React Router v7 future-flag warnings logged as console errors

- **Severity:** Low (developer console noise; not user-visible breakage)  
- **Category:** Console  

**What happens:** On each navigation, the dev bundle logs two **React Router** “Future Flag Warning” messages. The browser surfaces them with `method: error`, so automated console health counts them as errors even though they are upstream deprecation/opt-in notices.

**Repro:** Open devtools console on `http://localhost:3000/` or `/testing`; reload. See warnings for `v7_startTransition` and `v7_relativeSplatPath`.

**Fix status:** **deferred** (optional: opt in to future flags where the router is created, or suppress in prod only).

---

## Top 3 follow-ups

1. Optionally clear **ISSUE-003** by configuring Router future flags per React Router v6 → v7 upgrade docs.  
2. Keep screenshots under `.gstack/qa-reports/screenshots/` for regression compares.  
3. Re-run `/qa` after router upgrade or major UI churn.

---

## Console health

- **App-breaking errors:** none observed during clicks tested.  
- **Noise:** React Router future-flag warnings (×2 per full load), CRA “Download React DevTools”, Cursor browser shim warning.

---

## Baseline

Updated `baseline.json` alongside this report for `--regression` mode.
