import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validDate,mondayOf,projectWeekDate,weekIndexFromDate,todayInTimezone,currentWeekIndex,shiftISODate,projectDateRange} from '../src/schedule.mjs';
import {weekRange,dueDate} from '../src/model.mjs';
import {weekIndexFromIso} from '../src/navigation.mjs';
const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../redesign.css',import.meta.url),'utf8');

test('project start is validated strictly including leap dates',()=>{
 assert.equal(validDate('2026-01-30'),true);
 assert.equal(validDate('2026-02-30'),false);
 assert.equal(validDate('2028-02-29'),true);
 assert.equal(validDate('2026-02-29'),false);
 assert.equal(validDate('2026-1-30'),false);
});
test('Friday Jan 30 is the first day of project Week 1, which runs Friday to Thursday',()=>{
 assert.equal(projectWeekDate('2026-01-30',0),'2026-01-30');
 assert.equal(projectWeekDate('2026-01-30',1),'2026-02-06');
 assert.deepEqual(projectDateRange('2026-01-30',0),{from:'2026-01-30',to:'2026-02-05'});
 assert.equal(weekIndexFromIso('2026-01-30','1'),0);
 assert.equal(weekIndexFromIso('2026-01-30','2'),1);
 assert.match(weekRange('2026-01-30',0),/30 Jan - 5 Feb 2026/);
});
test('current week is calculated from project timezone not machine locale',()=>{
 const date=new Date('2026-10-21T20:45:00Z');
 assert.equal(todayInTimezone('Europe/Paris',date),'2026-10-21');
 assert.equal(currentWeekIndex('2026-01-30','Europe/Paris',date),37);
 assert.equal(weekIndexFromDate('2026-01-30','2026-10-21'),37);
});
test('project weeks span year boundaries without resetting numbering',()=>{
 assert.equal(projectWeekDate('2026-12-31',0),'2026-12-31');
 assert.equal(projectWeekDate('2026-12-31',1),'2027-01-07');
 assert.equal(weekIndexFromIso('2026-12-31','1'),0);
 assert.equal(weekIndexFromIso('2026-12-31','2'),1);
 assert.equal(shiftISODate('2026-12-31',7),'2027-01-07');
});
test('explicit due dates remain preserved when project start moves; generated deadlines follow anchor',()=>{
 const task={startWeek:0,duration:1};
 assert.equal(dueDate('2026-01-30',task),'2026-02-05');
 assert.equal(dueDate('2026-02-06',{...task,dueDate:'2026-05-01'}),'2026-05-01');
});
test('weekly tracker has no upper week calendar or Master Timeline',()=>{
 const tracker=ui.slice(ui.indexOf('export function Tracker('),ui.indexOf('export function Report('));
 assert.ok(tracker.includes('Project start'));
 assert.ok(tracker.includes('type="date"'));
 assert.ok(!tracker.includes('type="week"'));
 assert.ok(!tracker.includes('onTimeline'));
 assert.ok(!tracker.includes('Master Timeline'));
 assert.ok(!index.includes('Master Timeline'));
});
test('footer weeks have real left/right arrows and shortcut to current week',()=>{
 assert.match(ui,/aria-label="Previous project week"/);
 assert.match(ui,/aria-label="Next project week"/);
 assert.ok(ui.includes('navigateWeek(-1)'));
 assert.ok(ui.includes('navigateWeek(1)'));
 assert.ok(ui.includes('setWeek(clampWeekViewport(currentWeek))'));
 assert.ok(ui.includes('nb-week-day-today')); 
});
test('approved weekly header keeps week number and milestone controls but not a redundant date/arrow',()=>{
 const start=ui.indexOf('<thead>',ui.indexOf('export function Tracker('));
 const snippet=ui.slice(start,ui.indexOf('</thead>',start));
 assert.ok(snippet.includes('nb-week-milestones'));
 assert.ok(snippet.includes('nb-week-head-title'));
 assert.ok(snippet.includes('nb-week-header-label'));
 assert.ok(!snippet.includes('nb-week-head-select'));
 assert.ok(!snippet.includes('weekRange(project.startDate,w)')); 
 assert.ok(snippet.indexOf('nb-week-head-title')<snippet.indexOf('nb-week-milestones')); 
 assert.ok(snippet.includes('nb-milestone-add'));
 assert.ok(snippet.includes('milestoneTone(ms)'));
 assert.ok(css.includes('.nb-ms-critical'));
 assert.ok(css.includes('.nb-ms-review'));
 assert.ok(css.includes('.nb-ms-complete'));
});
test('current week and avatar alignment use explicit, accessible visual states',()=>{
 assert.ok(ui.includes('nb-current-week-column'));
 assert.ok(ui.includes('nb-current-week-cell'));
 assert.ok(ui.includes('todayInTimezone'));
 assert.ok(css.includes('.nb-week-grid .nb-avatar{display:flex'));
 assert.ok(css.includes('justify-content:center!important'));
});

test('milestones are first-class project events and backups accept ownerless milestones',async()=>{
 const {validateTask,validateImport}=await import('../src/extended-model.mjs');
 const members=[{id:'person1',name:'Person One'}];
 const milestone={id:'m1',label:'Network Freeze',startWeek:1,duration:1,status:'Planned',description:'',memberId:'milestones',isMilestone:true,date:'2026-02-02'};
 assert.deepEqual(validateTask(milestone,members),[]);
 const incoming={members,systems:[],tasks:[milestone]};
 assert.deepEqual(validateImport({},incoming),[]);
 const editor=readFileSync(new URL('../src/enhancements.tsx',import.meta.url),'utf8');
 assert.ok(editor.includes('aria-label="Milestone editor"'));
 assert.ok(editor.includes("memberId:'milestones'"));
 assert.ok(editor.includes('weekIndexFromDate(project.startDate,value)'));
});
