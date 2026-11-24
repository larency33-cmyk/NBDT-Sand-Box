# Validation v0.6.121

Scope: purely CSS layout changes in Assignment employee headers.

- Equal 4px white gaps between neighboring pastel owner cards and to the left of the first card.
- Separate fixed grid rows for initials, up-to-two-line name, role and date. The Move column control remains bottom-positioned outside the text grid.
- No state, persistence, drag/drop or navigation modifications.
- Static source checks included in `tests/assignment-gutters-dates-v121.test.mjs`.

Production build and interactive browser verification need to be performed with installed Vite/Chromium.
