# NBDT Hub v0.6.111 — validation

Source: v0.6.110, GitHub `larency33-cmyk/NBDT-Sand-Box` branch `main`.

## Results

- `node --test tests/guide-excel-description-v111.test.mjs tests/registry-excel-v082.test.mjs tests/guide-excel-import-v083.test.mjs tests/guide-excel-import-v075.test.mjs`: **34/34 passed**.
- `npm run check:syntax`: **passed** for index/workspace/enhancements/vite config.
- `node scripts/check-symbols.cjs`: **passed**, 14 TSX files.
- `npm test`: **612 passed, 23 failed, 635 total**. The **23 failed test titles are identical** to the baseline v0.6.110 test log; no regressions in the importer suite.
- `npm run build`: **not available** because the Vite CLI is not installed (`sh: vite: not found`); production-app smoke test not run.

## Behavioral coverage

1. Plain TSV full paragraph below the hardware banner populates Description exactly.
2. Decorated banner variants (symbols, icon, whitespace, `and` / `&` / omitted `and`) are recognized as a heading rather than content.
3. Banner and paragraph in one cell are separated without losing the paragraph.
4. Realistic Excel HTML clipboard tables are parsed independently and alongside plain text.
5. A merged HTML text cell holding heading plus multiline paragraph preserves the paragraph.
6. Missing description remains missing; no artificial fallback banner is saved.
7. Re-import of a previously corrupted saved Description updates that field without removing Lessons Learned.
8. Explicit labelled descriptions continue to work.

**Scope:** `src/guide-excel-import.mjs` only for runtime behavior; new tests, metadata and release notes. No visual changes.
