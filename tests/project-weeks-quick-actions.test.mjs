import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectWeekDate,weekIndexFromDate,currentWeekIndex,projectDateRange} from '../src/schedule.mjs';
import {weekIndexFromIso} from '../src/navigation.mjs';
import {quickCreateAssignment,quickSetTaskStatus} from '../src/tracker-actions.mjs';
const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const view=ui.slice(ui.indexOf('export function Tracker('),ui.indexOf('export function Report('));
const input={members:[{id:'H',name:'Homesh'},{id:'J',name:'Jorge'}],issues:[],tasks:[{id:'shared',label:'Terminal testing',memberId:'H',helperIds:['J'],status:'Planned',startWeek:1,duration:2,version:2}]};
test('28 March project start means Week 1 is 28 March – 3 April, regardless of ISO weeks',()=>{
 assert.deepEqual(projectDateRange('2026-03-28',0),{from:'2026-03-28',to:'2026-04-03'});
 assert.deepEqual(projectDateRange('2026-03-28',1),{from:'2026-04-04',to:'2026-04-10'});
 assert.equal(projectWeekDate('2026-03-28',3),'2026-04-18');
 assert.equal(weekIndexFromDate('2026-03-28','2026-03-28'),0);
 assert.equal(weekIndexFromDate('2026-03-28','2026-04-03'),0);
 assert.equal(weekIndexFromDate('2026-03-28','2026-04-04'),1);
 assert.equal(weekIndexFromIso('2026-03-28','1'),0);
 assert.equal(weekIndexFromIso('2026-03-28','2'),1);
});
test('the project-relative current week follows timezone and never uses Monday alignment',()=>{
 const now=new Date('2026-04-04T00:30:00Z');
 assert.equal(currentWeekIndex('2026-03-28','Europe/Paris',now),1);
 assert.equal(currentWeekIndex('2026-03-28','America/Los_Angeles',now),0);
 assert.equal(weekIndexFromDate('2026-03-28','2026-03-27'),-1);
});
test('quick status changes update the unique task once and keep owner/helper relationship',()=>{
 const out=quickSetTaskStatus(input,'shared',{status:'Completed'},new Date('2026-04-01T09:00:00Z'));
 assert.equal(out.tasks.length,1);
 assert.equal(out.tasks[0].status,'Completed');
 assert.deepEqual(out.tasks[0].helperIds,['J']);
 assert.equal(out.tasks[0].completedAt,'2026-04-01T09:00:00.000Z');
 assert.equal(input.tasks[0].status,'Planned');
});
test('manual Blocked requires a reason, and unresolved linked issues prevent fake Done',()=>{
 assert.throws(()=>quickSetTaskStatus(input,'shared',{status:'Blocked'}),/reason/i);
 const blocked=quickSetTaskStatus(input,'shared',{status:'Blocked',blockReason:'Waiting for VLAN approval'});
 assert.equal(blocked.tasks[0].blockReason,'Waiting for VLAN approval');
 const linked={...input,issues:[{id:'issue1',status:'Open'}],tasks:[{...input.tasks[0],blockerIds:['issue1']}]};
 assert.throws(()=>quickSetTaskStatus(linked,'shared',{status:'Completed'}),/Resolve linked/);
});
test('inline Add assignment uses selected person and week with default Planned',()=>{
 const next=quickCreateAssignment(input,{label:'  Printer checks  ',memberId:'H',startWeek:6},'new1');
 assert.equal(next.tasks.length,2);
 assert.deepEqual(next.tasks[1],{id:'new1',label:'Printer checks',memberId:'H',startWeek:6,duration:1,status:'Planned',description:'',helperIds:[],checklist:[],version:1});
 assert.throws(()=>quickCreateAssignment(input,{label:'   ',memberId:'H',startWeek:6},'new2'),/title/i);
 assert.throws(()=>quickCreateAssignment(input,{label:'ok',memberId:'X',startWeek:6},'new2'),/employee/i);
});
test('tracker has only Overview and List, no Week mode, and never shows ISO labels in footer',()=>{
 assert.ok(view.includes("['Overview','List']"));
 assert.ok(!view.includes("['Overview','Week','List']"));
 assert.ok(view.includes('const weekIso=(w:number)=>`Week ${w+1}`'));
 assert.ok(view.includes('Project weeks</strong>'));
 assert.ok(view.includes('onQuickTaskSave'));
 assert.ok(view.includes('onQuickTaskCreate'));
 assert.ok(view.includes('nb-quick-add-form'));
 assert.ok(index.includes('quickSetTaskStatus'));
 assert.ok(index.includes("url.searchParams.set('week',String(w+1))"));
});
