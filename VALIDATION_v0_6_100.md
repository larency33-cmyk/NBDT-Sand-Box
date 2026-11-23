# Validation — NBDT v0.6.100

Base commit: `789516103b8b05072fb9243ff15307ad76d33253` (v0.6.99).

## Passed

- Production Vite build and runtime-symbol preflight.
- Syntax checks and five welcome/model unit tests.
- Real Chromium welcome checks: entry without credentials, deferred workspace loading, preserved deep links, existing administrator form, saved Assignment names, pause/resume and reduced motion.
- Actual name rotation observed at 8 seconds. All three name-fade animations have an 8000 ms duration; delivery retains its 20000 ms duration.
- Complete page screenshots at 0 and 40000 ms were byte-for-byte identical. The 40-second common boundary aligns delivery, 8-second name fades and cloud drift. Captures use the integer page origin to avoid fractional SVG clip resampling in Chromium screenshots.
- The shipment moves forward and uses the detailed trolley sprite. All four people use the new artwork, with independently clipped head and arm layers.
- Responsive checks: 390 × 844, 1366 × 768, 1671 × 941, 3440 × 1440 and 5120 × 1440. No horizontal overflow or JavaScript runtime errors. Separate portrait sky clips keep clouds away from preceding phase labels.
- All six production workspace routes passed: Overview, Weekly Tracker, System Registry, Issue Tracker, Configuration Report and Assignment.
- `src/access-control-v047.tsx`, `src/poc-auth.mjs`, `src/assignment-roster.mjs` and `src/start-v099.tsx` are byte-for-byte unchanged from the base.

## Loading and artwork

The existing static atlas is retained. The additional transparent character/trolley atlas is 139201 bytes; SHA-256 `e4e2bc5409e119dfe04b8dc13b7f5b5a8f137db2b66232ebff516fda12f81706`. Both image files total 693929 bytes. Each is requested once and reused for SVG crops. Background depth uses a few native stepped SVG paths; no rendering library or dependency was added.

The initial JavaScript chunk, including React and welcome logic, is approximately 79.9 KB gzip; the welcome CSS is approximately 2.5 KB gzip. The existing workspace remains a separate deferred chunk. React updates the name group at 8-second boundaries, not on every animation frame. One shared clock and the existing visibility/pause handling remain in use.

## Existing baseline issues

The full legacy suite contains the same 23 failed tests as the supplied baseline: 585 total, 562 passed, 23 failed. No new failed test names were introduced. The additional v0.6.100 cadence test passed.

Type checking reports the same 10 existing diagnostics in Registry/Report/SystemInfo code as the baseline. No new diagnostics were introduced. These unrelated issues are documented in the prior validation report and were not altered for this visual refinement.

The existing `.nb-status-n/a` CSS warning and the large deferred workspace chunk warning remain. Both builds succeed.
