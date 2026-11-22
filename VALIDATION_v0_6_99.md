# Validation — NBDT v0.6.99

Base: `80ccd0079087213dea4d7ed6b46d1a18397c13f4` (v0.6.98).

## Passed

- `npm run build`: runtime-symbol preflight and production Vite build passed.
- `npm run check:syntax`: no syntax errors.
- `node --test tests/signin-v099.test.mjs`: 4/4 new behavioral tests passed.
- `npm run smoke:signin`: real Chromium production checks passed for credential-free welcome entry, deferred workspace loading, deep links, unchanged administrator form, saved Assignment names, pause/resume behavior, reduced motion and responsive geometry.
- Actual scene screenshots at animation times 0 ms and 20,000 ms were byte-for-byte identical. The trolley's measured position advanced during the delivery phase.
- Browser checks passed at 390 × 844, 1366 × 768, 1671 × 941, 3440 × 1440 and 5120 × 1440. No horizontal overflow or runtime errors were observed. Portrait rendering uses the vertical scene composition.
- `npm run smoke:production`: all six production routes passed (Overview, Weekly Tracker, System Registry, Issue Tracker, Configuration Report, Assignment), including actual Overview water movement. The smoke script now enters through the welcome button and recognizes the current Overview heading and versioned water animation name.
- `src/access-control-v047.tsx`, `src/poc-auth.mjs` and `src/assignment-roster.mjs` are byte-for-byte unchanged from the base commit. Welcome entry writes only its own session flag, not a POC identity.
- A fresh welcome visit did not create or modify the workspace IndexedDB database. The existing workspace initializes it after entry.

## Existing baseline failures, reproduced before changes

The complete legacy `npm test` suite is not green in the supplied base commit. A separate worktree at the base SHA reproduced 23 failures / 580 tests (557 passed). The changed tree has the exact same 23 failures / 584 tests (561 passed, including the four added tests). No new failed test names were introduced. These older tests assert superseded markup, CSS versions and historical Registry/Tracker layouts; they were not rewritten to hide failures.

`npm run lint` reports 10 TypeScript errors in both the base and changed tree, with the same diagnostic messages. They concern existing SystemInfo metadata fields, a Registry visual-type annotation and Configuration Report option value types. No new sign-in file has a TypeScript diagnostic. Existing application behavior and types were deliberately kept outside this welcome-screen change.

The build retains the prior CSS warning for the `.nb-status-n/a` selector and the large deferred workspace chunk. The welcome entry itself is split from that workspace chunk.

## Asset and loading measurements

- Shared transparent artwork atlas: 554,728 bytes; SHA-256 `54a5d8ab0d27af2187a96a4f184a5cdd59a0038c0582da0af83969009343da3f`.
- Initial entry JavaScript including React, icons and welcome logic: approximately 79.4 KB gzip.
- Welcome stylesheet: approximately 2.4 KB gzip.
- Existing workspace JavaScript: approximately 347.6 KB gzip, deferred until entry.
- 24 CSS/Web Animations share a single clock; there is no per-frame React state update. Team changes occur once per 20-second cycle while bubbles are hidden.

## Functional limits

This version deliberately provides a welcome-page bypass, not real SSO. Existing Guest/Admin/Super Admin behavior remains controlled by the existing POC module. Team labels use the browser-local saved Assignment directory, with the initial roster as fallback; cross-user server synchronization is not added. `/signin` opens the welcome page again within an already-entered tab.

Browser verification used a headless Chromium executable supplied through the optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` and `PLAYWRIGHT_CHROMIUM_ARGS` variables. Normal installations use the project's Playwright browser. The alternate test executable is not a project dependency or part of the delivery archives.
