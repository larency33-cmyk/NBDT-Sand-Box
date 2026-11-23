# Validation — NBDT v0.6.118

- Base: `NBDT_v0.6.117_FULL.zip`, GitHub `763586111fd781cf1d69d1965171fecba3df01c7`.
- `npm run check:syntax`: **passed**.
- `node --test tests/assignment-owner-headers-v118.test.mjs tests/assignment-insertion-visual-v117.test.mjs tests/assignment-visual-hierarchy-v116.test.mjs`: **16/16 passed**.
- `npm test`: **645 passed, 23 failed, 668 total**. The 23 failing test names exactly match the v0.6.117 baseline: **0 new test regressions**.
- `npm run build`: symbol preflight passed (14 TSX files); Vite unavailable (`sh: 1: vite: not found`). Production bundle and authenticated app boot unverified.
- Isolated Chromium CSS check at widths 1734, 1280 and 900: header names `13.5px`, initials circles `33.59375×33.59375px` (CSS 33.6px, pixel rounding), initials `15.6px`, every border-right matches its own header background (`#edf5ff`, `#f2efff`, `#ebfaf8`, `#fff7ed`, `#fff0f6`), no inset shadow; header row computed ~124px. This uses a simplified fixture with the actual project CSS, not a full React app runtime.
- Existing rounded corners, one-person navigation, seven-visible-column viewport, editable task cards, exact DnD insertion feedback and user data were not modified. Normal task row height remains minimum 49px.
