# Validation — v0.6.113

Scope: only System Registry → All owners dropdown scrollbar. The owner list is sourced from Assignment. The global scrollbar-hide behavior remains intact for other controls.

- `node --test tests/registry-owner-scrollbar-v113.test.mjs`: **4/4 passed**.
- `npm run check:syntax`: **passed**, zero syntax errors in four checked entry points.
- `node scripts/check-symbols.cjs`: **passed**, 14 TSX files.
- Full `npm test`: **622 passed, 23 failed, 645 total**. Previous v0.6.112 baseline has the *same 23 failing test names*; **no additional regressions**.
- Isolated Chromium CSS verification (real imported redesign.css, v045 global hiding and registry-v096 rules): **passed** at 1440×900 and 390×844. The All owners menu has a constrained 358px client height, scrollHeight > clientHeight; computed `scrollbar-width: thin`, `scrollbar-color: rgb(155,183,217) rgb(238,244,251)`, `::-webkit-scrollbar` display:block and width:7px. A control menu (Platform) retains `scrollbar-width:none` and `::-webkit-scrollbar` display:none. Setting owner scrollTop moves the list. Chromium headless screenshots do not reliably render OS-native scroll thumbs, so the visual thumb appearance on Windows was not independently confirmed.
- `npm run build`: **not completed** in this environment: the preflight passes but Vite package is absent (`vite: not found`). Production app was not run.

Status: syntax and static/browser CSS checks passed; production build not verified.
