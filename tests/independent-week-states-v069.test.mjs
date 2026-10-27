import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {moveWeekViewport,clampWeekViewport} from '../src/week-navigation.mjs';
import {weekIndexFromDate, projectWeekDate, currentWeekIndex, projectWeekDays} from '../src/schedule.mjs';

const ui=fs.readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../redesign.css',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const tracker=ui.slice(ui.indexOf('export function Tracker('),ui.indexOf('\nexport function Report('));
const ux=css.slice(css.indexOf('v0.6.9 — WEEK NAVIGATION UX'));

test('project weeks still start precisely on project date, independent of ISO',()=>{
 assert.equal(projectWeekDate('2026-03-28',0),'2026-03-28');
 assert.equal(projectWeekDate('2026-03-28',1),'2026-04-04');
 assert.equal(weekIndexFromDate('2026-03-28','2026-04-03'),0);
 assert.equal(weekIndexFromDate('2026-03-28','2026-04-04'),1);
});
test('viewport arrows never imply a selected week or a moving today',()=>{
 let visibleStartWeek=0, selectedWeek=2, currentWeek=0;
 visibleStartWeek=moveWeekViewport(visibleStartWeek,1);
 assert.deepEqual([visibleStartWeek,selectedWeek,currentWeek],[1,2,0]);
 visibleStartWeek=moveWeekViewport(visibleStartWeek,8);
 assert.equal(visibleStartWeek,2);
 assert.equal(selectedWeek,2);
 assert.equal(currentWeek,0);
 assert.equal(moveWeekViewport(516,1),516);
});
test('selection is distinct from the viewport and footer selection does not shift window',()=>{
 assert.match(tracker,/\[selectedWeek,setSelectedWeek\]=useState/);
 assert.match(tracker,/const selectWeek=\(w:number\)=>\{/);
 assert.match(tracker,/setSelectedWeek\(next\)/);
 assert.match(tracker,/onClick=\{\(\)=>selectWeek\(w\)\}/);
 assert.match(tracker,/\(w===selectedWeek\?'nb-week-wide-selected/);
 assert.match(tracker,/aria-pressed=\{w===selectedWeek\}/);
 assert.doesNotMatch(tracker,/onClick=\{\(\)=>setWeek\(w\)\}/);
 assert.match(tracker,/const next=moveWeekViewport\(week,direction\)/);
 assert.match(tracker,/setWeek\(next\)/);
});
test('today action restores both viewport and selection',()=>{
 assert.match(tracker,/selectWeek\(currentWeek\);setWeek\(clampWeekViewport\(currentWeek\)\)/);
 assert.match(tracker,/selectWeek\(currentWeek\);setWeek\(clampWeekViewport\(currentWeek\)\)/);
 assert.match(tracker,/className="nb-go-today nb-today-action"/);
 assert.equal(currentWeekIndex('2026-10-19','Europe/Paris',new Date('2026-10-24T08:00:00Z')),0);
 assert.equal(currentWeekIndex('2026-10-19','Europe/Paris',new Date('2026-10-26T08:00:00Z')),1);
 assert.equal(clampWeekViewport(519),516);
});
test('selected and four-week range summaries have distinct semantics and safe out-of-view navigation',()=>{
 assert.match(tracker,/const currentWeekTasks=tasks.filter\(\(t:any\)=>t.startWeek<=selectedWeek/);
 assert.match(tracker,/const visibleRangeTasks=tasks.filter\(\(t:any\)=>t.startWeek<week\+4/);
 assert.match(tracker,/Viewing Weeks \{week\+1\}/);
 assert.match(tracker,/Show selected Week \{selectedWeek\+1\}/);
 assert.match(tracker,/selectedWeek<week\|\|selectedWeek>=week\+4/);
 assert.match(tracker,/totalMilestones\} milestones in view/);
});
test('current week and current day use actual date, not first visible column',()=>{
 assert.match(tracker,/const actualCurrentWeek=weekIndexFromDate\(project.startDate,todayDate\)/);
 assert.match(tracker,/currentWeek===w\?'nb-current-week-column'/);
 assert.match(tracker,/currentWeek===w\?' nb-current-week-cell'/);
 assert.match(tracker,/day.date===todayDate\?'nb-week-day-today'/);
 assert.match(tracker,/currentWeek>=week&&currentWeek<week\+4/);
 const days=projectWeekDays('2026-10-19',0);
 assert.equal(days.length,7);
 assert.equal(days[5].date,'2026-10-24');
});
test('active week fills only real current week; selection is outline-only',()=>{
 assert.match(ux,/\.nb-week-wide-card\.nb-week-wide-selected:not\(\.nb-week-wide-current\)/);
 assert.match(ux,/\.nb-week-wide-card\.nb-week-wide-current\{/);
 assert.match(ux,/\.nb-week-grid tbody td\.nb-current-week-cell\{/);
 assert.match(ux,/\.nb-week-card-scroller\{[^}]*overflow-x:hidden!important/s);
});
test('selected week deep links survive without the removed Share view toolbar button',()=>{
 assert.match(tracker,/url.searchParams.set\('selectedWeek',String\(next\+1\)\)/);
 assert.doesNotMatch(tracker,/>Share view<\/B>/);
 assert.match(app,/url.searchParams.delete\('selectedWeek'\)/);
 assert.match(tracker,/anchorChanged\?null:new URLSearchParams\(location.search\).get\('selectedWeek'\)/);
});

test('deep link to final Week 520 is presented in a valid four-week viewport without losing the selected week',()=>{
 assert.match(app,/const focusedWeekIndex = clampWeekViewport\(currentStartWeek - 1\)/);
 assert.match(app,/setWeek=\{\(w:number\)=>\{const start=clampWeekViewport\(w\)/);
 assert.match(tracker,/legacyWeek>clampWeekViewport\(legacyWeek\)\?legacyWeek:week/);
 assert.deepEqual(Array.from({length:4},(_,i)=>clampWeekViewport(519)+i),[516,517,518,519]);
});
