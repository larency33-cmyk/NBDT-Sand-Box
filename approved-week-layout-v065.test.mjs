import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectWeekDays,projectDateRange} from '../src/schedule.mjs';
const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const tracker=ui.slice(ui.indexOf('export function Tracker('),ui.indexOf('export function Report('));
const css=readFileSync(new URL('../redesign.css',import.meta.url),'utf8');
const v065=css.slice(css.indexOf('/* =======================================================================\n   v0.6.5'));

test('approved v0.6.18 keeps week labels and milestones at top, dates only in bottom navigation',()=>{
 const head=tracker.slice(tracker.indexOf('<thead>'),tracker.indexOf('</thead>'));
 const footer=tracker.slice(tracker.indexOf('<footer className="nb-week-footer'));
 assert.ok(head.includes('nb-week-milestones'));
 assert.ok(head.includes('No milestone'));
 assert.ok(head.includes('nb-week-head-title'));
 assert.ok(head.includes('nb-week-header-label'));
 assert.ok(!head.includes('weekRange(project.startDate,w)'));
 assert.ok(!head.includes('nb-week-head-select'));
 assert.ok(head.indexOf('nb-week-head-title') < head.indexOf('nb-week-milestones'));
 assert.ok(head.includes('nb-milestone-add'));
 assert.ok(footer.includes('weekRange(project.startDate,w)'));
});
test('bottom navigation has exactly four wide week cards aligned to four main week columns',()=>{
 assert.ok(tracker.includes('className="nb-week-card-grid"'));
 assert.ok(tracker.includes('weeks.map(w=>{'));
 assert.ok(tracker.includes('nb-week-wide-card'));
 assert.ok(v065.includes('grid-template-columns:var(--nb-employee-width,220px) repeat(4,minmax(0,1fr))'));
 assert.ok(v065.includes('--nb-employee-width:220px'));
 assert.ok(v065.includes('thead th:first-child{width:var(--nb-employee-width)!important}'));
 assert.ok(tracker.includes('ref={tableScrollRef} onScroll={syncWeekScroll}'));
 assert.ok(tracker.includes('ref={weekFooterScrollRef}'));
 assert.ok(!tracker.includes("syncWeekScroll('footer')"));
});
test('project week day strip is real calendar arithmetic, not fixed Monday-first labels',()=>{
 assert.deepEqual(projectWeekDays('2026-03-28',0).map(d=>d.short),['Sat','Sun','Mon','Tue','Wed','Thu','Fri']);
 assert.deepEqual(projectDateRange('2026-03-28',0),{from:'2026-03-28',to:'2026-04-03'});
 assert.deepEqual(projectWeekDays('2026-09-28',3).map(d=>d.short),['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);
 assert.equal(projectWeekDays('2026-09-28',3)[3].date,'2026-10-22');
});
test('only the actual calendar date is accented in its project week',()=>{
 assert.ok(tracker.includes('day.date===todayDate'));
 assert.ok(tracker.includes('className={\'nb-week-day \'+(day.date===todayDate?\'nb-week-day-today\':\'\')}'));
 assert.ok(tracker.includes('todayInTimezone(project.timezone||\'Europe/Paris\')'));
 assert.ok(v065.includes('.nb-week-day-today{background:#0066f5!important'));
});
test('week bands alternate and the current week remains distinctly accented',()=>{
 assert.ok(v065.includes('thead th:nth-child(2n+1)'));
 assert.ok(v065.includes('tbody td:nth-child(2n+1)'));
 assert.ok(v065.includes('tbody td:nth-child(2n)'));
 assert.ok(v065.includes('.nb-week-grid .nb-current-week-column'));
});
test('overlay quick assignment panel remains a body portal separate from week grid',()=>{
 assert.ok(tracker.includes('{selected&&createPortal('));
 assert.ok(tracker.includes('document.body)}'));
 assert.ok(tracker.includes('nb-quick-overlay-backdrop'));
 assert.ok(tracker.includes('onQuickTaskCreate({label,memberId:selected.id,startWeek:selected.week})'));
});
