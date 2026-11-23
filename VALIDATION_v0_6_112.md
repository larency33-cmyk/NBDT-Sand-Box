# Validation — v0.6.112

Changed scope: only System Registry search ranking; no system data mutations and no changes to filtering criteria.

- New tests: `node --test tests/registry-search-priority-v112.test.mjs`: **6 passed, 0 failed**.
- `npm run check:syntax`: **passed**, 0 syntax errors in inspected TSX/TS source.
- `node scripts/check-symbols.cjs`: **passed**, runtime-symbol preflight across 14 TSX files.
- Full suite `npm test`: **618 passed, 23 failed, 641 total**. Baseline v0.6.111 in same environment: **612 passed, 23 failed, 635 total**. Same exact 23 failing test names; **no new failures**.
- `npm run build`: the symbol preflight passed, but **full production build not verified** because the Vite executable is absent in this environment (`vite: not found`).
- Search changes group case-insensitive name matches first; description/technical metadata-only matches follow; no-query order and all other filter conditions are unchanged.

Status: functional unit tests and syntax passed; production build not verified.
