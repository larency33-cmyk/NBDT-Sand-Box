# NBDT Hub v0.6.120 validation

- `npm run check:syntax`: success.
- `node --test tests/assignment*.test.mjs`: 46 passed, 0 failed.
- `npm test`: 648 passed, 23 failed, total 671. Failures match the previously known 23 failures; no new known failures.
- `npm run build`: preflight passed; cannot proceed (`vite: not found`).
- Chromium screenshot: unavailable (headless browser timed out); not claiming actual browser validation.
- Structural check: each staff header has `nb120-header-card`, white parent `th`, 4 px margin either side, and pastel background painted on the nested card only.
- Retained drag/column navigation logic; 13.5px staff names and 33.6px initial badges stay unchanged.
