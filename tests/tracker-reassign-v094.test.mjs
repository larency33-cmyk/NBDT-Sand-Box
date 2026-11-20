import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {quickReassignTask} from '../src/tracker-actions.mjs';

const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-tracker-v090.css',import.meta.url),'utf8');
const team=[
 {id:'member-ronny',name:'RONNY TAPERA',assignmentPersonId:'assignment-person-6',position:'ITO'},
 {id:'member-nilson',name:'NILSON PIANAR CALONA',assignmentPersonId:'assignment-person-11',position:'ITSS'},
 {id:'member-sergiu',name:'SERGIU BURIU',assignmentPersonId:'assignment-person-2',position:'ITO'}
];
const oldTask={
 id:'digital-signage',label:'Digital Signage',description:'Configure signage',
 memberId:team[0].id,startWeek:2,duration:1,status:'Completed',
 completedAt:'2026-11-20T11:00:00Z',
 dueDate:'2026-11-22',blockReason:'',checklist:[{id:'one',completed:true}],
 helperIds:[team[1].id],moveHistory:[{sourceWeek:2}],version:8,systemId:''
};
const project=(task=oldTask)=>({
 trackerMembers:team,members:[{id:'old',name:'OLD TEAM LEAD'}],
 tasks:[JSON.parse(JSON.stringify(task)),{id:'other-task',memberId:team[1].id,startWeek:3,duration:1,label:'Other Task',status:'Planned'}],
 systems:[],issues:[{id:'issue-one'}],trackerNotOnSite:{[team[0].id+':2']:true}
});

test('Reassigning to another Assignment person in the same week keeps the task and its content',()=>{
 const input=project();
 const result=quickReassignTask(input,'digital-signage',{memberId:team[1].id,startWeek:2});
 const task=result.tasks[0];
 assert.equal(task.id,'digital-signage');
 assert.equal(task.memberId,team[1].id);
 assert.equal(task.startWeek,2);
 assert.equal(task.status,'Completed');
 assert.equal(task.description,'Configure signage');
 assert.equal(task.completedAt,oldTask.completedAt);
 assert.equal(task.dueDate,'2026-11-22');
 assert.deepEqual(task.checklist,oldTask.checklist);
 assert.deepEqual(task.moveHistory,oldTask.moveHistory);
 assert.deepEqual(task.helperIds,[]);
 assert.equal(task.version,9);
 assert.strictEqual(result.tasks[1],input.tasks[1]);
 assert.strictEqual(result.issues,input.issues);
 assert.strictEqual(result.trackerNotOnSite,input.trackerNotOnSite);
 assert.equal(input.tasks[0].memberId,team[0].id,'Original project not mutated');
});

test('Reassigning to a different week shifts an explicit due date and preserves status',()=>{
 const next=quickReassignTask(project(),'digital-signage',{memberId:team[2].id,startWeek:10});
 const task=next.tasks[0];
 assert.equal(task.memberId,team[2].id);
 assert.equal(task.startWeek,10);
 assert.equal(task.dueDate,'2027-01-17','Due date moves eight weeks');
 assert.equal(task.status,'Completed');
 assert.equal(task.completedAt,oldTask.completedAt);
 assert.equal(task.id,oldTask.id);
});

test('Same person with another week and another person with same week are both valid',()=>{
 const a=quickReassignTask(project(),'digital-signage',{memberId:team[0].id,startWeek:5});
 assert.equal(a.tasks[0].memberId,team[0].id);
 assert.equal(a.tasks[0].startWeek,5);
 const b=quickReassignTask(project(),'digital-signage',{memberId:team[2].id,startWeek:2});
 assert.equal(b.tasks[0].memberId,team[2].id);
 assert.equal(b.tasks[0].startWeek,2);
 assert.equal(quickReassignTask(project(),'digital-signage',{memberId:team[0].id,startWeek:2}).tasks[0].version,8,'Unchanged destination is no-op');
});

test('A four-week task moves as one record, keeping duration and its full history',()=>{
 const task={...oldTask,duration:4,startWeek:10,dueDate:'2027-02-10'};
 const original=project(task);
 const result=quickReassignTask(original,'digital-signage',{memberId:team[2].id,startWeek:515});
 assert.equal(result.tasks.length,original.tasks.length);
 assert.equal(result.tasks[0].startWeek,515);
 assert.equal(result.tasks[0].duration,4);
 assert.equal(result.tasks[0].id,original.tasks[0].id);
 assert.deepEqual(result.tasks[0].checklist,original.tasks[0].checklist);
 assert.equal(result.tasks[0].status,'Completed');
 assert.throws(()=>quickReassignTask(original,'digital-signage',{memberId:team[2].id,startWeek:517}),/week.*outside/i);
});

test('For one-week tasks every project week is available, including Week 520',()=>{
 const changed=quickReassignTask(project(),'digital-signage',{memberId:team[1].id,startWeek:519});
 assert.equal(changed.tasks[0].startWeek,519);
 assert.equal(changed.tasks[0].duration,1);
 assert.throws(()=>quickReassignTask(project(),'digital-signage',{memberId:team[1].id,startWeek:520}),/outside/);
});

test('Only current Assignment people can become task owners',()=>{
 const p=project();
 for(const wrong of ['old','fake-member','',null]){
  assert.throws(()=>quickReassignTask(p,'digital-signage',{memberId:wrong,startWeek:5}),/person from Assignment/);
 }
 assert.throws(()=>quickReassignTask(p,'missing',{memberId:team[1].id,startWeek:5}),/Task no longer exists/);
 assert.throws(()=>quickReassignTask(p,'digital-signage',{memberId:team[1].id,startWeek:2.5}),/week.*outside/);
 assert.throws(()=>quickReassignTask(p,'digital-signage',{memberId:team[1].id,startWeek:-1}),/week.*outside/);
});

test('Task action menu adds Reassign without removing Edit, Move or Delete',()=>{
 const anchor=ui.indexOf('menuOpen&&menuPosition&&createPortal(');
 const stop=ui.indexOf('</div>,document.body)',anchor);
 assert.ok(anchor>=0&&stop>anchor);
 const menu=ui.slice(anchor,stop);
 for(const label of ['Edit','Reassign','Move to previous week','Move to next week','Delete'])
  assert.ok(menu.includes('> '+label+'</button>'),label);
 assert.match(menu,/onOpenReassign\(task,sourceWeek\)/);
 assert.match(ui,/if\(!isAdmin\)\{onRequireEdit\(\);return;\}/);
});

test('Destination UI is restricted to the current Assignment-projected people',()=>{
 assert.match(app,/quickReassignTask\(syncTrackerTeam\(prev,assignmentRosterRef\.current\),taskId,\{memberId,startWeek\}\)/);
 assert.match(app,/if\(!isAdmin\)throw Error\('Admin sign-in required to reassign a task\.'/);
 assert.match(ui,/setReassignMember\(project\.members\.some/);
 assert.match(ui,/project\.members\.map\(\(member:any\)=><option/);
 assert.match(ui,/Names are synchronized exclusively with Assignment/);
 assert.match(ui,/role="dialog" aria-modal="true" aria-labelledby="nb94-transfer-title"/);
});

test('Week selector allows the entire valid 520-week range with navigation and date preview',()=>{
 assert.match(ui,/521-\(reassignTask\.duration\|\|1\)/);
 assert.match(ui,/weekRange\(project\.startDate,index\)/);
 assert.match(ui,/weekRange\(project\.startDate,reassignWeek\)/);
 assert.match(ui,/aria-label="Previous project week"/);
 assert.match(ui,/aria-label="Next project week"/);
 assert.match(ui,/reassignWeek>=520-\(reassignTask\.duration\|\|1\)/);
 assert.match(ui,/Its entire schedule will move together/);
});

test('Dialog saves through existing project persistence and retains validation, cancel and failure states',()=>{
 assert.match(ui,/await onQuickTaskTransfer\(reassignTask\.id,reassignMember,reassignWeek\)/);
 assert.match(ui,/setQuickNotice\(\x60Reassigned to/);
 assert.match(ui,/setReassignError\(error\?\.message\|\|/);
 assert.match(ui,/setReassignTask\(null\)/);
 assert.match(ui,/if\(event\.key==='Escape'\)/);
 assert.match(css,/\.nb94-transfer-backdrop\{/);
 assert.match(css,/z-index:21100/);
 assert.match(css,/\.nb94-transfer-dialog\{/);
 assert.match(css,/@media\(max-width:600px\)/);
});
