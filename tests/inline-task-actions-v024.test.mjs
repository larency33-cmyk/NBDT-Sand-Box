import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {quickEditTask,quickDeleteTask,quickMoveTaskToNextWeek,quickSaveMilestone} from '../src/tracker-actions.mjs';
import {weekHeaderTone} from '../src/week-palette.mjs';
const make=()=>({members:[{id:'a',name:'Homesh'},{id:'b',name:'Apple'}],systems:[{id:'sys',name:'POS'}],issues:[],tasks:[{id:'t1',label:'POS Setup',description:'',memberId:'a',helperIds:['b'],status:'Blocked',blockReason:'Waiting',startWeek:2,duration:3,version:1,checklist:[{id:'ch',label:'Step',completed:true}]}]});
const occurrences=(p,w)=>p.tasks.filter(t=>!t.isMilestone&&t.startWeek<=w&&w<t.startWeek+t.duration).map(t=>t.id);
test('Edit updates the same record, preserves helpers and unrelated project state',()=>{
 const original=make();const after=quickEditTask(original,'t1',{label:'New POS name',description:'Done',memberId:'a',systemId:'sys',duration:2});
 assert.equal(after.tasks[0].id,'t1');assert.equal(after.tasks[0].label,'New POS name');assert.equal(after.tasks[0].duration,2);assert.deepEqual(after.tasks[0].helperIds,['b']);assert.equal(original.tasks[0].label,'POS Setup');
});
test('Delete removes only the selected task and never deletes a milestone',()=>{
 const original=make();original.tasks.push({id:'m',isMilestone:true,label:'Freeze',startWeek:4});
 const after=quickDeleteTask(original,'t1');assert.deepEqual(after.tasks.map(t=>t.id),['m']);assert.throws(()=>quickDeleteTask(original,'m'));
});
test('Move in a single-week task removes the old week and makes a new week-bound task',()=>{
 const p=make();p.tasks[0].duration=1;p.tasks[0].status='Planned';
 const after=quickMoveTaskToNextWeek(p,'t1',2,'moved','tail');
 assert.equal(occurrences(after,2).length,0);assert.deepEqual(occurrences(after,3),['moved']);assert.equal(after.tasks[0].status,'Planned');assert.equal(after.tasks[0].moveHistory[0].sourceWeek,3);
});
test('Move from a multi-week legacy task keeps earlier and later weekly history and replaces the next week occurrence',()=>{
 const p=make();p.tasks[0].startWeek=1;p.tasks[0].duration=5;
 const after=quickMoveTaskToNextWeek(p,'t1',3,'moved','continuation');
 assert.deepEqual(occurrences(after,1),['t1']);assert.deepEqual(occurrences(after,2),['t1']);assert.deepEqual(occurrences(after,3),[]);assert.deepEqual(occurrences(after,4),['moved']);assert.deepEqual(occurrences(after,5),['continuation']);
 assert.equal(after.tasks.find(t=>t.id==='moved').status,'Blocked');assert.equal(after.tasks.find(t=>t.id==='moved').blockReason,'Waiting');
});
test('Move on final project week, outside a task span, or with conflicting ids is rejected',()=>{
 const p=make();assert.throws(()=>quickMoveTaskToNextWeek(p,'t1',519,'new','tail'));
 assert.throws(()=>quickMoveTaskToNextWeek(p,'t1',10,'new','tail'));
 assert.throws(()=>quickMoveTaskToNextWeek(p,'t1',2,'t1','tail'));
});
test('Milestone creation and editing work without a TaskEditor page',()=>{
 const p=make();const m=quickSaveMilestone(p,{label:'A milestone',startWeek:2},'m1');assert.equal(m.tasks.at(-1).memberId,'milestones');
 const edited=quickSaveMilestone(m,{label:'Updated',startWeek:2},'m1');assert.equal(edited.tasks.length,2);assert.equal(edited.tasks.at(-1).label,'Updated');
});
test('The drawer uses the exact week palette and provides all three actions without the old editor',()=>{
 const src=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
 const enhanced=readFileSync(new URL('../src/enhancements.tsx',import.meta.url),'utf8');
 const entry=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
 const css=readFileSync(new URL('../weekly-tracker-task-actions-v024.css',import.meta.url),'utf8');
 assert.match(src,/Move to next week/);assert.match(src,/role="menuitem"/);assert.match(src,/nb-inline-task-editor/);
 assert.match(src,/weekHeaderTone\(selected\.week\)/);assert.equal(weekHeaderTone(2),'blue');assert.equal(weekHeaderTone(3),'violet');
 assert.doesNotMatch(enhanced,/export function TaskEditor/);assert.doesNotMatch(entry,/<TaskEditor/);
 assert.match(css,/nb-week-tone-blue/);assert.match(css,/nb-week-tone-violet/);assert.match(css,/nb-week-tone-orchid/);assert.match(css,/nb-week-tone-mint/);
});
