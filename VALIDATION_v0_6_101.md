# NBDT v0.6.101 validation

- `node scripts/check-syntax.cjs`: PASS (existing basic syntax checks for entry/workspace code).
- `node --test tests/signin-v099.test.mjs tests/signin-v101.test.mjs`: PASS (7/7).
- Full node test suite: 588 tests, 565 pass, 23 fail — 23 failures also documented as pre-existing in v0.6.100. No new regression identified in these static/unit tests.
- Browser/production build: NOT independently run in this environment because npm packages are unavailable and local browser navigation is restricted. Existing browser smoke test and production build should still run in GitHub CI/Vercel.
- The SSO-labeled button is still a placeholder for future corporate OIDC, as in v0.6.100.
- Responsive CSS covers desktop/laptop/compact-height/mobile/ultrawide layouts. Exact across-device rendering requires an interactive browser verification.
