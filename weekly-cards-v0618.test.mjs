import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url);
const source=readFileSync(new URL('src/workspace.tsx',base),'utf8');
const tracker=source.slice(source.indexOf('export function Tracker('),source.indexOf('export function Report('));
const head=tracker.slice(tracker.indexOf('<thead>'),tracker.indexOf('</thead>'));
const css=readFileSync(new URL('weekly-tracker-approved-v016.css',base),'utf8');
const latest=css.slice(css.indexOf('/* v0.6.18 — Uniform weekly assignments'));

test('week top header has no date or arrow, yet still permits choosing a week',()=>{
 assert.match(head,/className="nb-week-header-label"/);
 assert.match(head,/aria-pressed={selectedWeek===w}/);
 assert.doesNotMatch(head,/nb-week-head-select/);
 assert.doesNotMatch(head,/weekRange\(project.startDate,w\)/);
 assert.match(tracker.slice(tracker.indexOf('<footer')),/weekRange\(project.startDate,w\)/);
});
test('header week panels are more contrasted, including their current-week state',()=>{
 assert.match(latest,/#e4f0ff/);
 assert.match(latest,/#dcecff/);
 assert.match(latest,/\.nb-week-head\s*\{/);
});
test('all employee-week cells have a uniform size even when no tasks exist',()=>{
 assert.match(latest,/--nb-uniform-task-height:\s*174px/);
 assert.match(latest,/tbody tr\.nb-no-assignments \.nb-week-cell/);
 assert.match(latest,/height:var\(--nb-uniform-task-height\)!important/);
 assert.match(latest,/tbody tr \{height:180px!important/);
 assert.match(tracker,/list\.slice\(0,4\)/);
 assert.match(tracker,/list\.length>4/);
});
test('task cards and bottom week buttons have visible outlines and subtle shadows',()=>{
 assert.match(latest,/--nb-card-shadow/);
 assert.match(latest,/border-radius:8px!important/);
 assert.match(latest,/\.nb-week-wide-card\s*\{/);
 assert.match(latest,/box-shadow:0 3px 10px/);
 assert.match(tracker,/nb-weeks-prev/);
 assert.match(tracker,/nb-weeks-next/);
});
