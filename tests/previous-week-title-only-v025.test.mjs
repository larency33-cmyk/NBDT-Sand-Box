import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {quickEditTask, quickMoveTaskToPreviousWeek} from '../src/tracker-actions.mjs';
const project=()=>({
 members:[{id:'a',name:'HOMESH'},{id:'b',name:'APPLE'}],systems:[{id:'sys',name:'POS'}],issues:[],
 tasks:[{id:'task',label:'POS setup',description:'Do not lose this',memberId:'a',helperIds:['b'],systemId:'sys',status:'Completed',completedAt:'2026-10-24T14:00:00Z',startWeek:2,duration:4,dueDate:'2026-11-08',checklist:[{id:'step',label:'Check',completed:true}],version:3}]
});
const weeks=(p)=>Array.from({length:8},(_,w)=>w).filter(w=>p.tasks.some(t=>t.startWeek<=w&&w<t.startWeek+t.duration));
test('Previous week from single-week assignment moves it back by exactly one project week',()=>{
 const p=project();p.tasks[0].duration=1;
 const after=quickMoveTaskToPreviousWeek(p,'task',2,'previous','continuation');
 assert.deepEqual(weeks(after),[1]);assert.equal(after.tasks.length,1);
 assert.equal(after.tasks[0].label,'POS setup');assert.equal(after.tasks[0].status,'Planned');assert.equal(after.tasks[0].checklist[0].completed,false);
 assert.equal(after.tasks[0].moveHistory[0].direction,'previous');assert.equal(after.tasks[0].moveHistory[0].sourceWeek,3);
 assert.equal(p.tasks[0].startWeek,2);
});
test('Moving a multi-week task backward preserves unrelated weeks without duplication',()=>{
 const p=project();
 const after=quickMoveTaskToPreviousWeek(p,'task',4,'previous','continuation');
 assert.deepEqual(weeks(after),[2,3,5]);
 assert.equal(after.tasks.filter(t=>t.startWeek<=3&&3<t.startWeek+t.duration).length,1);
 assert.equal(after.tasks.some(t=>t.startWeek<=4&&4<t.startWeek+t.duration),false);
 assert.equal(after.tasks.find(t=>t.id==='task').duration,1);
 assert.equal(after.tasks.find(t=>t.id==='continuation').startWeek,5);
});
test('Moving a task at start of its span back to a new week preserves later weeks',()=>{
 const p=project();const after=quickMoveTaskToPreviousWeek(p,'task',2,'previous','continuation');
 assert.deepEqual(weeks(after),[1,3,4,5]);
 assert.equal(after.tasks.length,2);assert.equal(after.tasks.find(t=>t.id==='continuation').duration,3);
});
test('No previous week before Project Week 1 and invalid moves do not mutate',()=>{
 const p=project();p.tasks[0].startWeek=0;p.tasks[0].duration=1;
 assert.throws(()=>quickMoveTaskToPreviousWeek(p,'task',0,'m','c'),/no previous project week/);
 assert.throws(()=>quickMoveTaskToPreviousWeek(p,'task',3,'m','c'),/not scheduled/);
 p.tasks[0].startWeek=2;
 assert.throws(()=>quickMoveTaskToPreviousWeek(p,'task',2,'task','c'),/unique/);
 assert.throws(()=>quickMoveTaskToPreviousWeek(p,'missing',2,'m','c'),/no longer exists/);
 assert.equal(p.tasks[0].id,'task');
});
test('Title-only edit preserves every unrelated data field and original id',()=>{
 const p=project();const old=p.tasks[0];const next=quickEditTask(p,'task',{label:'Renamed POS setup'}).tasks[0];
 assert.equal(next.label,'Renamed POS setup');
 for(const key of ['id','memberId','helperIds','description','systemId','startWeek','duration','dueDate','status','completedAt','checklist']){
  assert.deepEqual(next[key],old[key],`Changed unrelated field ${key}`);
 }
 assert.equal(next.version,old.version+1);assert.equal(old.label,'POS setup');
});
test('The inline Edit form shows only Task title and actions, and both move menu items exist',()=>{
 const src=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
 const form=src.slice(src.indexOf('editing&&isAdmin?<form'),src.indexOf('</form>:<div className="nb-quick-task-toolbar">'));
 assert.match(form,/>Task title<input/);
 for(const removed of ['>Description<','>Owner<select','>System<select','>Duration (weeks)<','>Due date<input']) assert.doesNotMatch(form,new RegExp(removed.replace(/[()]/g,'\\$&')));
 assert.match(form,/onQuickTaskEdit\(task.id,\{label:draft.label\}\)/);
 assert.match(src,/Move to previous week/);
 assert.match(src,/sourceWeek===0/);
 assert.match(src,/Move to next week/);
 assert.match(src,/sourceWeek>=519/);
 assert.match(src,/direction==='previous'/);
});
