# NBDT Hub 0.6.103 — validation

- Source: complete v0.6.102 release archive, with only the nine paths listed in the delta manifest modified/added.
- Target alignment: button bottom = top edge of visible landscape SVG (the cloud region begins at y=0) minus 30 CSS px; headline/subtitle center = midpoint between logo bottom and final button top. Measured in a standalone browser layout preview using the production stylesheet and the actual original PNG assets:
  - Desktop 1759×863: 29.997 px gap; logo/headline/subtitle/button/footer each 362.45 px wide.
  - Desktop 1280×720: 29.998 px gap; all five elements 302.39 px wide.
  - Small landscape 950×500: space-saving fallback (42.3 px gap), preventing overlapping text in a restricted viewport.
  - Mobile ≤720 px: original compact portrait spacing preserved, because the vertically stacked scene contains artwork above its clouds; the cloud proximity rule would otherwise overlap that artwork.
- These measurements are of an HTML/CSS stand-in containing matching root SVG geometry, not of a fully booted React/Vite app. Pixel-art scene components and animation timing were not edited.
- `node --test tests/signin-v101.test.mjs tests/signin-v102.test.mjs tests/signin-v103.test.mjs`: **9/9 passed**.
- `npm run check:syntax`: **passed**.
- `node scripts/check-symbols.cjs`: **passed** (14 TSX files).
- `npm test`: **571 passed, 23 failed / 594**. The 23 failures match the pre-existing v0.6.102 failing test names.
- `npm run build`: blocked by unavailable dependencies: `vite: not found` (symbol preflight passes).
- Production runtime/login navigation were **not** browser-tested in this environment. The original `onEnter` action is preserved verbatim.
