# NBDT — Newbuild Deployment Tool

Clean GitHub source package based on **v0.6.16** (approved Weekly Tracker). The visual layout and application logic are unchanged from v0.6.16; only repository housekeeping and obsolete reference-dependent tests were updated.

## Requirements

- Node.js 22.12+ and npm
- Network access to install dependencies from npm

## Local development

```bash
npm install
npm run dev
```

Vite prints a local URL (typically http://localhost:5173).

## Checks and production build

```bash
npm test
npm run check:syntax
npm run lint
npm run build
```

The production build is written to `dist/` and must **not** be committed. The Vercel project can be imported from the repository root and uses the settings in `vercel.json` (Vite / `dist`).

## Repository layout

- `index.html`, `index.tsx` — application entry point
- `src/` — application pages, local data store and date/navigation logic
- `redesign.css`, `weekly-tracker-approved-v016.css` — app styles
- `package.json`, `vite.config.ts`, `tsconfig.json`, `vercel.json` — dependencies and build/deployment configuration
- `tests/`, `scripts/` — automated tests and development checks

## Important data limitation

The current application stores project data in the **browser's IndexedDB**. Data does **not** automatically synchronize across computers/users. Back up any important browser-local data before switching domain, browser, or clearing site storage. The UI's Edit mode is not a replacement for server-side authentication.

## Cleanup note

Old screenshots, historical reports, isolated verification artifacts, the obsolete `package-lock.original.json`, and a Windows-only launcher were excluded from this GitHub distribution. They were not required by the app. Test assertions that previously required screenshots now check source-controlled styling instead. No source data or task records were intentionally changed.
