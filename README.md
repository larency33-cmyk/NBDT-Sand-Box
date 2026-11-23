# NBDT — Newbuild Deployment Tool

**Current package: v0.6.110 (Search systems border + approved dropdown status icons).** Restores a continuous thin blue outline around the System Registry search field by stopping the inner white input background from covering the top/bottom border. The All statuses dropdown now displays the approved bare status glyphs (solid green completed check, open blue in-progress ring, grey not-started outline) with no circular badge background or blanket-blue legacy override. No changes to progress computation, stored data or filtering logic. See `RELEASE_NOTES_v0_6_110_RU.md` and `VALIDATION_v0_6_110.md`.

**Current package: v0.6.109 (System Registry status icons aligned to approved mockup).** Replaced the outlined stage-complete symbol with a green filled circle/white check and the in-progress dot symbol with a partially traced circular ring. Applied consistently to overall badges, stage chips and the status filter. No change to the underlying saved progress or filtering behavior. See `RELEASE_NOTES_v0_6_109_RU.md`.

**Current package: v0.6.108 (System Registry progress overview).** Each Registry card now shows a derived overall Completed/In progress/Not started badge, a 0/4–4/4 completion bar and four Base / Ready / Deploy / Lessons indicators, styled to match the approved mockup. A sixth All statuses filter composes with the existing filters and Clear filters. Stage completion requires accepted, valid Guide reviews; Lessons completion requires all lesson reviews confirmed for the current project. No new stored status flags or fake demo progress. See `RELEASE_NOTES_v0_6_108_RU.md` and `VALIDATION_v0_6_108.md`.

**Current package: v0.6.107 (System Registry description editing and header deletion).** Editing a system card preloads the exact description shown in the card, even when that text comes from the legacy generated fallback. The red trash icon appears **to the left of the pencil only while editing**; it opens a separate irreversible-deletion warning dialog. The old Delete system button has been removed from the description editor. Deletion still uses the existing admin-only system/linked-issue cleanup helper, leaving unrelated Tracker and Assignment data intact. See `RELEASE_NOTES_v0_6_107_RU.md` and `VALIDATION_v0_6_107.md`.

**Current package: v0.6.106.** The corporate SSO button is raised by 80% of its measured gap from the subtitle, leaving 20%. The Deliver stage includes 3 additional cart passes per 10 original trips (+30% average appearances) without changing the standard 20s scene clock. Existing artwork, corporate footer and SSO handler remain intact. See `RELEASE_NOTES_v0_6_106_RU.md` and `VALIDATION_v0_6_106.md`.

**Current package: v0.6.105 (logo 80%-gap refinement).** Starting from the current v0.6.104 welcome layout, the NBDT logo moves downward by **80% of the measured distance** between its bottom edge and the headline. The original v0.6.104 gap is the 100% reference; approximately 20% remains. For safety, unusually short (≤520px height) windows keep their existing spacing. All other elements — headline, subtitle, working SSO button, panorama and Royal Caribbean Group branding — are unchanged. See `RELEASE_NOTES_v0_6_105_RU.md` and `VALIDATION_v0_6_105.md`.

**Current package: v0.6.104 (NBDT logo vertical spacing refinement).** Only the NBDT logo is visually moved downward toward the headline on regular desktop displays, with a smaller/zero offset on mobile and short screens. Its dimensions, all text positions, the SSO button and its behavior, Royal Caribbean Group branding, scene and animations are preserved. See `RELEASE_NOTES_v0_6_104_RU.md` and `VALIDATION_v0_6_104.md`.

**Current package: v0.6.103 (30px cloud clearance and centered hero copy).** The corporate SSO button now aligns 30 CSS pixels above the highest visible SVG cloud while the two text lines sit vertically centered between the NBDT logo and button. Widths of the text, logo, button and corporate footer remain matched. The process illustration and authentication flow are unchanged. See `RELEASE_NOTES_v0_6_103_RU.md` and `VALIDATION_v0_6_103.md`.

**Current package: v0.6.102 (welcome layout alignment).** The NBDT logo, headline/subtitle, corporate SSO button and the supplied Royal Caribbean Group image now share one responsive centered column. Only the helper line below the SSO button was removed. The button remains functional with its original handler, and extra vertical space separates it from the subtitle and the pixel clouds. The Configure → Deliver → Deploy illustration, animations and existing entry behavior are unchanged. See `RELEASE_NOTES_v0_6_102_RU.md` and `VALIDATION_v0_6_102.md`.

**Previous v0.6.101 (corporate footer + ambient animation).** The supplied transparent Royal Caribbean Group PNG replaced the text footer. Viewport-aware layout, seamless rightward clouds, animated rack LEDs and subtle water reflections were introduced. See `RELEASE_NOTES_v0_6_101_RU.md`.

**Current package: v0.6.100 (welcome artwork polish + faster team names).** Detailed pixel coworkers and the transport trolley now follow the accepted artwork, including the miniature N/ship mark on the packaging. Layered pixel mountains, coastline and gently moving clouds restore the richer backdrop. Team names rotate every 8 seconds (2.5× faster); delivery remains a calm 20-second cycle. The combined decorative timeline repeats seamlessly every 40 seconds. Portrait sky layers are clipped separately so they cannot cover the preceding phase labels. Existing welcome entry and administrator login are unchanged. See `RELEASE_NOTES_v0_6_100_RU.md` and `VALIDATION_v0_6_100.md`.

**Previous v0.6.99 (NBDT welcome screen + pixel deployment animation).** A responsive welcome page introduces the team with the approved NBDT logo and a synchronized 20-second Configure → Deliver → Deploy scene. The SSO-labelled button currently continues into the existing workspace without credentials and without granting an administrator role. Existing administrator login, credentials and authorization are unchanged. The workspace loads only after entry; same-tab entry is remembered. Open `/signin` to review the welcome page again. Team bubbles use this browser's saved Assignment roster, falling back to the initial roster on a fresh browser. See `RELEASE_NOTES_v0_6_99_RU.md` and `VALIDATION_v0_6_99.md`.

**Previous v0.6.98 (independent checklist marks).** Later-stage checklist tasks can be marked before earlier-stage checklists are complete; stage acceptance rules are preserved.

**Previous v0.6.97 (Wi-Fi and Wired filter icons).** In System Registry → All connections, Wi-Fi shows a wireless signal glyph and Wired shows a cable glyph. When selected, the same glyph appears in the filter trigger. The neutral All connections icon, styling and filtering behavior stay unchanged. See `RELEASE_NOTES_v0_6_97_RU.md`.

**Previous v0.6.96 (unified System Registry dropdowns + confirmed system deletion).** Platform, Connection and Owner filters now use the same icon/checkmark custom menu as Device Type without changing filter behavior. Admins can click a system card pencil, then **Delete system** and confirm before the selected record, its embedded device/configuration guide history and its linked Issues are removed. Independent Assignment and Weekly Tracker data remain untouched. See `RELEASE_NOTES_v0_6_96_RU.md`.

**Previous v0.6.95 (Vercel build fix for Reassign).** Resolved the duplicate `reassignError` / `setReassignError` state declarations that blocked the v0.6.94 production build. The standard task **Reassign** action and historical task reassignment now use separate error states. Production preflight catches TS2451/TS2300 duplicate declarations, Node.js is pinned to 24.x (matching Vercel project settings), and GitHub Actions verifies `npm run build` on pushes to main. See `RELEASE_NOTES_v0_6_95_RU.md`.

**Previous v0.6.94 (Weekly Tracker task Reassign).** A task's three-dot menu now offers **Reassign** alongside Edit, Move and Delete. Admins select an up-to-date person from Assignment and any valid project week using an accessible date-labeled picker. Reassignment updates the existing task atomically without changing its ID, status, notes or checklist; multiweek schedules move intact. See `RELEASE_NOTES_v0_6_94_RU.md`.

**Previous v0.6.93 (Assignment-only Weekly Tracker people).** The Assignment roster is now the *exclusive* source for all displayed Weekly Tracker employees: no synthetic Team Lead, no Unassigned person row, no legacy aliases. Team counts, filter choices, rows and task counts reflect the active Assignment team. Historic tasks keep their saved data and can be reassigned via an admin-only **Tasks to reassign** dialog without adding fake employees. Manual row order, Not on site, Excel task import and task action menu remain intact. See `RELEASE_NOTES_v0_6_93_RU.md`.

**Previous v0.6.92 (stable Not on site gray card after task removal).** Weekly Tracker off-site cells now retain the same muted gray card styling whether the employee has other-week assignments or none. CSS precedence fixes override the old alternating white/blue card rules, including current-week, selected and hover states. The stored Not on site flag, task assignments and all other Tracker functionality remain unchanged. See `RELEASE_NOTES_v0_6_92_RU.md`.

**Previous v0.6.91 (opaque employee drag card, exact insertion indicator, visible task menu).** Dragging Weekly Tracker employees now uses a solid floating preview and a blue between-row insertion line: top half inserts before the target, bottom half inserts after, with matching keyboard order behavior. Task three-dot menus are rendered above the scroll-clipped drawer, preserving Edit, Move and Delete. All assignments and Not on site statuses remain unchanged. See `RELEASE_NOTES_v0_6_91_RU.md`.

**Previous v0.6.90 (Assignment-synced Tracker roster, draggable rows, Not on site).** Weekly Tracker now displays Team Lead plus Assignment roster people with canonical names, positions and joining dates, while keeping other pages' original member list unchanged. Admins can reorder whole employee rows by dragging the name cell and mark individual employee-week cells **Not on site** without altering assignments. Existing tasks remain intact; ambiguous legacy owners appear under Unassigned with an original owner note. See `RELEASE_NOTES_v0_6_90_RU.md`.

**Previous v0.6.89 (Weekly Tracker Excel multi-task paste).** The existing Weekly Tracker **Add assignment** form now accepts either one task (Enter still adds it) or a pasted bulleted/multiline list from an Excel cell. It recognizes individual task names, previews the count and first entries, then creates up to 100 tasks atomically for the chosen person and week using the same defaults as a single assignment. No other task editing, movement, status, or storage behavior is changed. See `RELEASE_NOTES_v0_6_89_RU.md`.

**Previous v0.6.88 (Guide Documentation CTA).** The Documentation link **inside System Configuration Guide only** now has a FileText icon, a small external-link icon, a clear blue emphasis, and hover/focus states. It keeps the same safe URL and new-tab behavior. The **external** System Registry Documentation button and all other Guide actions remain unchanged. See `RELEASE_NOTES_v0_6_88_RU.md`.

**Previous v0.6.87 (Registry header Clear filters).** The System Registry Export action has been removed. An icon-labeled **Clear filters** control now appears in its place in the top-right heading **only** when search or Registry filters are active; it clears search, Device Type, Platform, Connection and Owner together. No extra reset button appears beneath the filter row. Other sections' exports and existing card/Assignment behavior are unchanged. See `RELEASE_NOTES_v0_6_87_RU.md`.

**Previous v0.6.86 (editable Registry Owner).** Every System Registry card now shows **Owner** with an Assignment team member name or **Not assigned**. Admins/Super Admins can change a system's Owner directly on the card using a dropdown sourced only from Assignment; guests see read-only text. Choosing a person updates the authoritative Assignment roster and the existing owner filters, while choosing **Not assigned** clears that system's Assignment entries. Shared owner rows are consolidated to the chosen person. No legacy assignee metadata is written. See `RELEASE_NOTES_v0_6_86_RU.md`.

**Previous v0.6.85 (Registry fixed card widths & Assignment-only owners).** System Registry now keeps stable three-column card sizing when searching/filtering to one or two systems (responsive two/one columns on narrower screens). The All owners dropdown uses only live Assignment roster members, with matching based on Assignment system ownership; legacy project-member options are gone. Issue Tracker team filtering is unchanged. See `RELEASE_NOTES_v0_6_85_RU.md`.

**Previous v0.6.84 (User account display & clean Applications).** Guide → Access & management now shows the imported **User account** instead of the internally managed Owner; deployment Owner remains on System Registry cards. Standalone and trailing spreadsheet `false` placeholders are discarded by the Excel importer and suppressed in existing detail cards and Applications, including edit mode. No ownership or task assignments are changed. See `RELEASE_NOTES_v0_6_84_RU.md`.

**Previous v0.6.83:** reliable Excel merged-cell import. Fixed the failure where an Endpoint or Naming Convention heading followed by blank Excel cells was silently discarded: the subsequent hardware model was incorrectly treated as Description and the naming value was unrecognized. Imports now reconcile HTML and plain-text clipboard variants, keep the actual model, description and naming pattern separate, and preserve other sections. See `RELEASE_NOTES_v0_6_83_RU.md`.

All changes from v0.6.59 are retained, including `Not Started` for legacy Cyber status, simplified Cyber editing, added-system highlight, Assignment column insertion, and the automatic ownership reference. The interface is React + Vite. POC credentials and roles remain browser-local; corporate deployment needs server-side authorization.

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


### v0.6.59 — Assignment / Configuration Report
- Assignment: кнопка CSV Export удалена.
- Configuration Report: сохранение новой системы больше не меняет поиск, фильтры или сортировку; добавленная строка подсвечивается трижды.
- Columns picker удалён; доступна сортировка нажатием заголовка.
- Исправлен фон между верхними кнопками экспорта/импорта.
- Контроль запуска Report (Admin/Guest) добавлен к офлайн-тестам; полноценная Vite/Chromium проверка остаётся обязательной в GitHub release gate.
