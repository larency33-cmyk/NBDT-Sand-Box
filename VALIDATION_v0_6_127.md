# Validation v0.6.127

- Removed the v0.6.126 width and negative margin expansion, which caused a 24px overshoot on both sides.
- Direct shared parent alignment: KPI outer scope and System readiness are flex siblings, with width 100%.
- Static CSS checks and regression tests cover no inherited padding or negative bleed.
- Chromium Playwright layout probe using the real imported CSS cascade: at viewport widths 1750, 1450, 1100, 780, and 390px, KPI grid outer edges exactly matched the System readiness frame (0px delta on both sides). In v0.6.126 the desktop KPI row exceeded both sides by 24px.
- Regression checks: 675/698 tests pass; the same 23 known failures as v0.6.126, with zero additional failures.
- `npm run check:syntax` succeeds (0 errors in index/workspace/enhancements/vite config).
- Production build needs installed project dependencies; no functional code changes.
