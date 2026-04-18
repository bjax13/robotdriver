# QA report: `http://localhost:3000/`

- **Date:** 2026-04-18  
- **Branch:** `main`  
- **Target:** React app (Create React App), dev server `npm start`  
- **Scope:** Course loader (paste JSON, Load course, validation banners), smoke on main game surface  
- **Tier:** Standard (one fix applied, re-verified)

## Metadata

| Field | Value |
|--------|--------|
| Pages / states visited | 1 (home) + course load success and error states |
| Screenshots | `.gstack/qa-reports/screenshots/` |
| Console (app) | No errors; React DevTools download suggestion + Cursor browser shim warnings only |
| Duration | ~15 min |

## Summary

| Metric | Value |
|--------|--------|
| Issues found | 1 |
| Fixes verified | 1 (`ISSUE-001`) |
| Deferred | 0 |
| **Health score (final)** | **~94 / 100** |

### PR one-liner

QA found 1 UI hit-target issue on the course loader, fixed it (panel open + stacking), re-tested invalid JSON, width validation, and successful reload; health score landed ~94.

---

## ISSUE-001 — "Load course" click intercepted (collapsed `<details>`)

- **Severity:** Medium (Functional / automation; likely fragile for users who collapse the panel)  
- **Category:** Functional  

**What happened:** With **Load course (paste JSON)** collapsed, `browser_click` on **Load course** failed: *Click intercepted … non-interactive … 536×616* (same footprint as the board canvas).  

**Evidence:** MCP browser error before fix (no screenshot of failure; reproducible locally).  

**Fix:** Default the loader **open** (`<details open>`) and give the block **`position: relative; zIndex: 2`** so controls stay above overlapping layout in the automation viewport.  

**Fix status:** **verified**  
**Commit:** `cb55948` — `fix(qa): ISSUE-001 — course loader panel open + stacking for reliable Load clicks`  
**Files:** `src/App.js`  

**Re-test:**  

- Invalid JSON (`not valid json {`) → red `role="alert"` banner with SyntaxError-derived message. Screenshot: `screenshots/issue-001-invalid-json-after-fix.png`.  
- Valid default `DIZZY_HIGHWAY` → green **Loaded 10×10** (screenshot `screenshots/success-loaded-10x10.png`).  
- Width `4` without `robots` → validation line *width: must be at least 5…*. Screenshot: `screenshots/issue-002-width-validation.png`.

---

## Top 3 things to ship next

1. Nothing blocking from this pass.  
2. Optional: add Playwright smoke per `TODOS.md` item 3 now that loader clicks are stable.  
3. Keep parity / golden trace follow-ups as listed in `TODOS.md`.

---

## Console health

- No uncaught exceptions observed during loader tests.  
- Warnings: CRA DevTools nudge, Cursor browser dialog shim (environment noise).

---

## Baseline (`baseline.json`)

See `baseline.json` in this folder for regression mode next run.
