# NBDT — Newbuild Deployment Tool

Clean GitHub source package, **v0.6.23** (Overview-only Weekly Tracker + classic sidebar). The wide, labeled navigation from before v0.6.16 is restored while the four-week tracker keeps the approved rounded-card layout, 16px gutters, independent week selection, and bottom cards aligned to the rendered table header widths.

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

## v0.6.17 changes

- Restored the original full-width labeled sidebar on Weekly Tracker, instead of the 82px icon-only navigation introduced by v0.6.16. The built-in Collapse toggle still works.
- Refined row spacing, status density and gentle column alternation to match the accepted tracker reference.
- Kept the single ResizeObserver-based measured alignment between week columns and the bottom Week 1–4 cards. The arrows remain inside the first/last cards and Today stays beneath Project weeks.
- Both ZIPs use paths relative to the GitHub repository root. Unchanged files are omitted from the changed-only ZIP.

## v0.6.18 — Weekly Tracker UI

- Top week headings display only the project-week number. The date range and navigation arrows remain in the footer only; the heading text is still a keyboard-accessible week selector.
- Every employee × week task card, including empty cards, has a consistent 174px visual height and a lightly outlined, rounded surface with a restrained shadow.
- Top week header backgrounds are one shade darker; the current week retains its distinct blue accent.
- Bottom week buttons use clearer outlines/shadows, retain measured alignment with their table columns, and continue to host Previous/Next. Today remains under Project weeks.
- All changes are limited to the Weekly Tracker; wide classic sidebar and other pages are untouched.

## v0.6.19 — Team management and fading headers

- Week column headers smoothly fade over the bottom 15–17%, with no hard bottom frame; weekly dates remain in the lower navigation.
- Edit mode shows inline rename (pencil), removal (trash) and **Add team member** directly at the bottom of the Employee column. Changes persist through the project's IndexedDB save queue.
- Renaming retains the member's ID, linked tasks and system ownership; avatar initials follow the newly entered name, including Unicode names.
- Removal always requires confirmation. Assigned tasks are preserved (orphaned owners appear under **Unassigned**), helper references to the removed member are cleared, and system ownership becomes unassigned.
- The Team Lead/member list is still read-only when Edit mode is off. Existing weekly navigation and footer alignment are unchanged.


## v0.6.20
- Employee edit-mode controls now sit below names.
- Employee deletion requires a separate explicit confirmation; owned task history is permanently deleted.
- Week header fade-out was removed; headers use a solid blue fill.


## v0.6.21 — Weekly Tracker header refresh
Only the Weekly Tracker Overview uses `weekly-tracker-premium-v021.css`. Header colors are stable by project week ID, and current-week emphasis is independent of header color. The sidebar and all other screens retain v0.6.20 styling.


## v0.6.22 — Project-week drawer & spacing
- The Weekly Tracker assignment drawer has four compact status summaries, a separate milestones section, and universally numbered assignment cards (no per-task category icons or redundant Owner labels).
- Status changes, blocked-reason capture, more/edit controls and inline assignment creation use the existing persistence workflow. In view mode, Edit mode is requested through the existing authorization flow.
- The gap between the milestone header and the first assignment row matches the 6px horizontal column gutter.
- Weekday labels spread equally over all seven tracks within **every** footer week card. A legacy middle-card padding rule was explicitly neutralized.
- The original sidebar and all other app pages were left unchanged.

## v0.6.23
Weekly Tracker now uses Overview only. The List switch and implementation were removed, duplicate header date text is gone, upper week labels align left, and the sidebar and project-week navigation are preserved.
