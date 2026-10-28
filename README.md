# NBDT — Newbuild Deployment Tool

**Current package: v0.6.57 (Assignment employee-column insertion).** Admin and Super Admin can drag a column by its **Move column** handle and drop it in the left or right half of another employee header to insert it before or after that person. Neighboring columns shift without exchanging owners or individual system assignments. Guest access, all v0.6.55 crash-prevention gates, and the rest of v0.6.56 are retained. See `RELEASE_NOTES_v0_6_57_RU.md`.

The interface is React + Vite. POC account credentials and roles remain browser-local; use this only for demonstrations. A corporate deployment needs a server-side authentication and authorization system. The core features of Weekly Tracker, System Registry, Issue Tracker and Configuration Report remain unchanged.

## Assignment column ordering (v0.6.57)

- Sign in as Admin or Super Admin; open **Assignment**.
- Grab the **Move column** handle below the employee's start date, drag it onto the **left half** of a different employee header to insert **before**, or onto the **right half** to insert **after**. Other columns shift to make room; no two-person swap occurs.
- A blue vertical insertion guide shows the exact boundary, from header through all project rows, and the drag preview says **Insert before/after**. Dropping outside a header or onto an unchanged position cancels without modifying data.
- This is only a display-order change, **not an ownership transfer**: employee IDs and system-to-owner relationships remain untouched. Ownership changes still use per-system drag handles.
- The updated ordering saves in the same browser-local Assignment roster. Export CSV uses the saved order. The separate **Add person** column stays at the right end.

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

## Mandatory release gate: prevent blank screens

Two real outages established this policy: **v0.6.52** rendered blank because the `Users` icon was not imported; **v0.6.54** rendered blank because `people` and `rowCount` were used in `useEffect` dependencies before their `const` declarations. Unit tests and syntax-only tests missed those runtime failures.

**Never describe a new ZIP as production-verified until all release gates pass:**

```bash
npm install --no-audit --no-fund
npm run check:syntax
npm test
npm run build
npx playwright install chromium
npm run smoke:production
```

1. `npm run build` runs `scripts/check-symbols.cjs` *before* Vite. It now fails for undefined symbols (`TS2304`/`TS2552`), use-before-declaration (`TS2448`/`TS2454`) and syntax errors in all TSX sources. This gate also runs as part of Vercel's configured build command.
2. `npm test` now exercises the compiled **Assignment** render function in Guest and Admin modes and runs a deliberately broken TSX fixture to confirm the preflight fails.
3. `npm run smoke:production` starts the **actual built Vite application** in Chromium and visits Overview, Weekly Tracker, System Registry, Issue Tracker, Configuration Report and Assignment. It fails on JavaScript page errors, missing headings or the React error fallback. This is required because isolated component tests alone are insufficient.
4. `.github/workflows/release-gate.yml` automatically executes all these checks on pull requests and pushes to `main`. Configure GitHub branch protection to **require** this check before merging; without branch protection, it cannot block direct pushes or Vercel deployments.
5. A `NBDTRenderBoundary` now displays an error screen with a Reload button if a React render fails, instead of silently leaving a blank page.

**If installation, Vite build or Chromium tests cannot run, report the release as UNVERIFIED, do not claim the site was tested.** A passing source preflight is useful but not equivalent to a real production boot. Never clear or reset user IndexedDB as a debugging shortcut.

The production build is written to `dist/` and must **not** be committed. The Vercel project can be imported from the repository root and uses `vercel.json` (Vite / `dist`).

## Repository layout

- `index.html`, `index.tsx` — application entry point
- `src/` — application pages, local data store and date/navigation logic
- `redesign.css`, `weekly-tracker-approved-v016.css`, `weekly-tracker-corporate-v026.css` — app styles; corporate palette loaded last on Weekly Tracker only
- `package.json`, `vite.config.ts`, `tsconfig.json`, `vercel.json` — dependencies and build/deployment configuration
- `tests/`, `scripts/` — automated tests and development checks

## Important data limitation

The current application stores project data in the **browser's IndexedDB**. Data does **not** automatically synchronize across computers/users. Back up any important browser-local data before switching domain, browser, or clearing site storage. The local POC login/roles are not a replacement for server-side authentication.

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

## Update v0.6.24
Weekly Tracker task actions now live in the assignment drawer: Edit, Move to next week, Delete. The separate TaskEditor page has been removed. Week drawer headers share the same fixed project-week color palette as the matrix. See `RELEASE_NOTES_v0_6_24_RU.md`.

## Update v0.6.25
Drawer task menu now supports Move to previous week (disabled on Week 1). Inline Edit changes **Task title only**; all other task fields are preserved.

## v0.6.26 — Calm Corporate Weekly Tracker

- Softer blue, lavender, apricot and mint header palette, tied to stable project week numbers.
- Current week has a distinct blue border and subtle blue task-card fill.
- Non-current assignment cards remain almost white with light blue-gray borders.
- Bottom navigation preserves its existing measured column alignment.
- Only visual styles changed; no sidebar, task data or workflow changes.
- See `RELEASE_NOTES_v0_6_26_RU.md` for verification notes.

## v0.6.30 — Approved Configuration Report reconstruction

- Configuration Report now follows the approved premium-blue reference structure: four KPIs, System readiness, filters, progress table and page navigation.
- Obsolete legacy aggregate reports and their UI/import/export pipeline have been removed. When old project data is loaded, the retired `configReportRows` field is omitted from the current in-memory model; the browser storage is updated on the next regular save.
- Export data writes the current System Registry device-readiness counts and metadata. Import report updates existing systems' **Owner** and **Cyber** metadata only (admin mode, validated matching, confirmation required). It does not import aggregate completion numbers.
- The original sidebar and Weekly Tracker remain unchanged.
- See `RELEASE_NOTES_v0_6_30_RU.md`.

## v0.6.31 — Configuration Report visual parity

- Rebuilt the report-only visual presentation against `Premium blue configuration report dashboard(3).png`: larger typography, 141px KPI tiles, clear ring gauges, single readiness surface, a 5-control toolbar, 65px table rows, per-stage blue/purple/teal progress and compact pagination.
- Report header now shows only the two main actions from the reference: Export data and Import report. Report edit/Cyber permissions remain available from **Columns → Unlock report editing / Edit Cyber statuses**, with the existing authorization check.
- The search field includes a proper magnifier icon, and sortable table headers expose keyboard-accessible controls with `aria-sort`. The column-picker and filter logic are retained.
- This is a **visual/layout change**, not replacement of actual device inventory with sample numbers from the reference. With two real systems and no devices the report will truthfully show two rows and no metric percentages.
- No changes to Weekly Tracker, the navigation sidebar, System Registry, or Issue Tracker.


## Configuration Guide · v0.6.41
- Technical cards (Device, Network, Access & management) and Applications edit inline with their own pencil, Save, and Cancel. New technical values are stored in the same Guide snapshot that drives the Registry readout.
- The System Registry pencil changes only the standalone Description, leaving Guide data untouched.
- Lessons Learned stores `lessonsLearnedItems: [{id,text,checked}]`, supports long multiline descriptions and independent completion checkboxes. Legacy string notes are displayed as one lesson until edited.
- Configuration checklist offers an independent, saveable guide-level verification (`guideReview`) when no physical device is selected. `Save checks` persists pending progress, `Accept … and continue` verifies each stage in sequence; later stages stay locked until prerequisites are accepted. Actual device runs continue using `deviceRuns` and do not mix with guide-level verification. Changes to checklist steps invalidate old guide-level verification.
- Readable stages use connected chevron shapes, not rotated-square arrows.
- This project is still a local-browser sandbox (IndexedDB), not a multi-user remote service; export backups before switching browsers or clearing storage.


## v0.6.42 — Weekly Tracker milestones and week selection

- The actual current project week is the only footer week card with a blue tint. A clicked non-current week has a fine blue border on a white background. The selected and current week states remain independent.
- Two or more milestones in one top week header show the first milestone and an explicit `+N more` count at rest. Hover/focus opens a visually continuous, vertically expandable overlay above the assignment cards without changing the table or footer geometry. Long lists scroll inside the overlay.
- Editing a milestone opens a compact dialog to rename or delete with confirmation. Creating also uses the same light dialog. Existing milestones are stored and deleted through the project's original IndexedDB action flow; ordinary tasks are not affected.
- All other pages and approved UI patterns remain unchanged. See `RELEASE_NOTES_v0_6_42_RU.md`.

## v0.6.43 — seamless Milestone expansion

Multiple Milestones expand the entire week header as a single themed card; the border encompasses the whole open list. The current week always uses blue palette variables and all other weeks inherit their existing color. Milestone buttons and status chips use matching tones. The table, task cells and lower navigation do not move.


## v0.6.44 — Weekly Tracker project start calendar

- Project start date uses a compact, accessible inline calendar panel rather than the browser-native date input. Navigate months or years freely, use Today/Saved date, and pick a date without changing project data.
- **Apply date** commits the new date exactly once. Cancel, Escape, close, and outside click discard the pending selection. No browser OK prompt occurs while browsing years or months.
- The existing shift rules are unchanged: assignments remain in project weeks; milestone dates shift; manually set task due dates remain.
- The picker shows commit errors without losing draft selection and is responsive on mobile.
- See `RELEASE_NOTES_v0_6_44_RU.md`.


## v0.6.45 — Unified headers, continuous System Registry

- Weekly Tracker, System Registry, Issue Tracker and Configuration Report share one 32px / 770 heading standard, common spacing, color and alignment. Removed the breadcrumb above Weekly Tracker and Issue Tracker.
- System Registry now renders the complete filtered list as a continuous grid: no 6-item pagination, page numbers, or previous/next controls. Filtering, export and inline description editing remain intact.
- Native scrollbar chrome is hidden across application scrollports without disabling actual vertical/horizontal scrolling.
- Corrected the tracker-only sidebar override (223px) so the expanded menu remains 232px on all desktop routes (72px when collapsed).
- See `RELEASE_NOTES_v0_6_45_RU.md` for technical details and verification limitations.

## v0.6.47 — Guest / Admin / Super Admin (POC)

The site starts in **Guest** role with read-only browsing. Use **Sign in** (upper-right) for the local-only proof-of-concept. Test Super Admin: username `superadmin`, password `NBDT-POC-2026!`. Under **Administration**, create and disable Admin accounts or reset their passwords. Admins can edit project records via existing contextual pencils, without any global Edit mode. For first tests, stay in the same browser profile: accounts are stored in localStorage and project data in IndexedDB. **Not secure authentication and not multi-user:** never use this local auth for production. See `RELEASE_NOTES_v0_6_47_RU.md` for migration/security details.

## v0.6.50 — Issue Tracker heading frame fix

The Issue Tracker title now shares the same `width: 100%; max-width: var(--content-max); margin-inline: auto` layout frame as its filter toolbar, summary, and issue board. This removes the header's leftward jump on wide/zoomed-out screens without arbitrary pixel offsets. See `RELEASE_NOTES_v0_6_50_RU.md`.


## v0.6.51 — Fixed system-page controls with independent list scrolling

- **System Registry:** the page title, Export/Add system, search and filters, and the "Showing all … systems" count stay visible; scroll only the system cards below them. Pagination remains removed.
- **Configuration Report:** the title, Import/Export actions, four KPI indicators, readiness heading, tabs, search and filters stay visible. Only the table scrolls; table column headings remain sticky while scrolling through system records.
- Scrollbar chrome stays hidden on both screens, but mouse wheel, touch gestures, keyboard focus/scroll and table horizontal scrolling still work.
- Only these two overview routes change; Guide pages, Weekly Tracker, Issue Tracker, app state and persistence are untouched.
- See `RELEASE_NOTES_v0_6_51_RU.md`.
