# Validation — v0.6.114

- Source base: v0.6.113 archive, verified against GitHub blob SHA for `src/assignment-page-v052.tsx`.
- `npm run check:syntax`: passed; core files report zero syntax errors.
- `node scripts/check-symbols.cjs`: passed; 14 TSX files passed runtime-symbol preflight.
- Assignment-focused tests (`assignment-seven-columns-v114`, `assignment-v052`, `assignment-v054`, `assignment-render-v055`, `assignment-column-swap-v056`, `runtime-release-gate-v055`): passed.
- `npm test`: **626 passed / 23 failed / 649 total**. All 23 failures are pre-existing source/snapshot assertions outside the modified Assignment navigation and are the same count as v0.6.113. Historical tests tied to the removed scrollbar and resize-hook expression were updated to validate equivalent supported functionality.
- `npm run build`: **not completed**: `vite: not found` (the package dependencies are not installed in this environment). The TypeScript symbol check that precedes Vite passed.
- Layout is tested mathematically for the 7-column desktop viewport, with 13 employees and the administrator's Add person column on two pages. Narrow windows preserve original minimum text/row dimensions. Actual production-page rendering, drag across pages in an authenticated browser and deployment smoke test **could not be verified** here: Chromium CLI did not finish starting, and required app packages are not available.
- Layout modifications are scoped to `.nb114-page`. No stored data migration; no changes to assignment-roster persistence/actions.
