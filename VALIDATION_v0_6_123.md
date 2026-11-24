# Validation v0.6.123

- Six focused tests cover current-project review statuses, missing lessons, legacy text, no data, invalid records and navigation wiring.
- Statistics use the same normalization and current project review flags as System Registry.
- All changes are read-only; no database migration or new saved status field.
- Existing old test expectations are retained except the Overview route assertion, now updated to Systems instead of Assignment.
- Production build and browser smoke test require installed Vite dependencies.
