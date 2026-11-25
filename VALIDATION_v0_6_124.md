# Validation NBDT Hub v0.6.124

- Base archive: NBDT v0.6.123.
- `node scripts/check-syntax.cjs` passed (0 syntax errors).
- `node scripts/check-symbols.cjs` passed (14 TSX preflight files).
- Six focused `tests/overview-v124.test.mjs` pass.
- Full `node --test tests/*.test.mjs` suite: 688 total, 665 passed, 23 failed; failed test names match v0.6.123 baseline exactly. Three legacy assertions referring to the replaced DOM layout were updated to verify the new panels; no other tests weakened.
- No dependencies downloaded. Full Vite build could not run (npm registry DNS unavailable).
- Chromium attempted for static screenshot but hung in the container; no E2E browser visual verification is claimed.
- All dynamic values are computed from existing `reportCounts`, `counts`, `getAttentionRows`, `effectiveStatus`, `project.activityLog` and `overviewLessonsStats`.
- Original SVG liquid animation markup and v0.6.70–0.6.71 animation CSS are unchanged.
