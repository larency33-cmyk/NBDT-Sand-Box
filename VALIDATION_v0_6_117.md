# Validation — NBDT v0.6.117

- Base: `NBDT_v0.6.116_FULL.zip` / GitHub `e8f496c3989d2f0241d0ed1b02c88ff3fb420099`.
- `npm run check:syntax`: **passed** (0 TSX syntax errors in checked entry files).
- `node --test tests/assignment-insertion-visual-v117.test.mjs tests/assignment-visual-hierarchy-v116.test.mjs tests/assignment-one-column-navigation-v115.test.mjs`: **14/14 passed**.
- `npm test`: **640 passed, 23 failed, 663 total**. All 23 failed test names exactly match the v0.6.116 baseline; 0 newly failing tests.
- `npm run build`: preflight passed (14 TSX symbols), Vite executable unavailable (`sh: vite: not found`). Production build not verified.
- Chromium static CSS preview (not full app boot): 1734×862, 1366×768, 900×700. Computed style checks: avatars **28×28px**, header radius **12px 12px 10px 10px**, task label **12.5px** weight **400**, empty-slot background `rgb(245,248,252)`. First measured row height **49px**; variable-height rows with long names are permitted to expand.
- Chromium isolated before/after CSS marker checked: 3px blue line `rgb(8,118,249)`, before top `-2px`, after bottom `-2px`.
- Unit tests exercise actual insertion-boundary helper on cross-owner moves, same-owner upward/downward moves, distant empty slots, head drops and self/invalid drops, plus DnD cleanup markers.
- Scope: no persistent data migration. Team name initials, one-step navigation and existing edit/move handlers remain unchanged.

Status: source checks and isolated visual CSS verified; production build and authenticated app operation unavailable in this environment.
