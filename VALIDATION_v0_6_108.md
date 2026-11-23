# NBDT Hub 0.6.108 — validation

## Source
Base: complete v0.6.107 archive. Only System Registry visual/layout and derived read model were updated.

## Automated checks
- `node --test tests/registry-progress-v108.test.mjs` — 11/11 passed.
- `npm run check:syntax` — 0 syntax errors.
- `node scripts/check-symbols.cjs` — preflight passed, 14 TSX files.
- `npm test` — 619 tests: 596 passed, 23 failed; all failures match the 23 historical failures in the v0.6.107 suite. Existing Registry filter contract tests were updated to reflect the intentionally added sixth filter and its clear behavior.
- `npm run build` — not verified. The project-local `vite` binary is missing and the npm registry is unavailable from this environment.

## Layout inspection
Headless Chromium static sample, using source CSS (not an app boot):
- 1747x863: 3 columns, no horizontal overflow.
- 1280x800: 3 columns, no horizontal overflow.
- 390x844: 1 column with collapsed sidebar sample, no horizontal overflow.

## Status rules
- Guide review acceptance + validated required checks -> Completed for Base, Ready or Deploy.
- Some saved checks but not accepted -> In progress.
- Missing/stale guide review, no valid checks -> Not started.
- Lessons Learned: all current-project reviews confirmed -> Completed; some started -> In progress; all pending/no lessons -> Not started.
- Overall completed requires all four completed. Filter composes with existing filters. No persistent schema changes or backfilled fake statuses.

## Caveat
Full actual-app browser execution and production bundle remain unverified until dependencies are installed and built in CI or a development machine.
