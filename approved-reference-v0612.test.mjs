import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const source=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const tracker=source.slice(source.indexOf('export function Tracker('),source.indexOf('export function Report('));
const css=readFileSync(new URL('../redesign.css',import.meta.url),'utf8');
const approved=css.slice(css.indexOf('v0.6.12 — USER-APPROVED WEEKLY TRACKER REFERENCE'));

test('the approved mockup reference is bundled for subsequent revisions',()=>{
 assert.ok(existsSync(new URL('../design_references/approved_weekly_tracker_v0612.png',import.meta.url)));
});
test('four top headers show a week number, its project date range, select arrow and then milestones',()=>{
 const head=tracker.slice(tracker.indexOf('<thead>'),tracker.indexOf('</thead>'));
 assert.ok(head.includes('<strong>{weekIso(w)}</strong><small>{weekRange(project.startDate,w)}</small>'));
 assert.ok(head.includes('className="nb-week-head-select"'));
 assert.ok(head.includes('onClick={()=>selectWeek(w)}'));
 assert.ok(head.indexOf('nb-week-head-top') < head.indexOf('nb-week-milestones'));
 assert.ok(head.includes('nb-milestone-chip'));
});
test('bottom four cards and the table share precisely the same first-column width and four-week tracks',()=>{
 assert.match(approved,/--nb-employee-width:255px;/);
 assert.match(approved,/thead th:first-child\{\s*width:var\(--nb-employee-width\)!important/);
 assert.match(approved,/grid-template-columns:var\(--nb-employee-width\) repeat\(4,minmax\(0,1fr\)\)!important/);
 assert.match(approved,/nb-week-wide-card\{\s*margin:0!important/);
 assert.match(approved,/padding:7px 21px 12px!important/);
});
test('task statuses use distinct accessible chips, and selection/current week are separately represented',()=>{
 for(const status of ['planned','in-progress','completed','blocked'])
  assert.ok(approved.includes('nb-status-'+status));
 assert.ok(tracker.includes('selectedWeek===w'));
 assert.ok(tracker.includes('currentWeek===w'));
 assert.ok(tracker.includes('day.date===todayDate'));
});
test('the approved layout preserves quick edit, arrow navigation and two-view tracker',()=>{
 assert.ok(tracker.includes("['Overview','List']"));
 assert.ok(tracker.includes('onQuickTaskCreate({label,memberId:selected.id,startWeek:selected.week})'));
 assert.ok(tracker.includes('onClick={()=>navigateWeek(1)}'));
 assert.ok(tracker.includes('onClick={()=>navigateWeek(-1)}'));
 assert.ok(tracker.includes('nb-overlay-panel'));
});
