import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseClipboardAssignments,quickCreateAssignment,quickCreateAssignments} from '../src/tracker-actions.mjs';

const tracker=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../weekly-tracker-task-actions-v024.css',import.meta.url),'utf8');
const make=()=>({members:[{id:'homesh',name:'Homesh'},{id:'jorge',name:'Jorge'}],systems:[],issues:[],tasks:[{id:'old',label:'Existing task',memberId:'jorge',startWeek:2,duration:1,status:'Completed'}]});

test('Excel one-cell bullet text becomes separate assignments in the original order',()=>{
 const pasted="• Get IP's DC01 and DC04\n• Test connection with DC04\n• Test script with DC04\n• Validate version of applications to be deployed";
 assert.deepEqual(parseClipboardAssignments(pasted),[
  "Get IP's DC01 and DC04",'Test connection with DC04','Test script with DC04','Validate version of applications to be deployed'
 ]);
});

test('Accept Windows clipboard newlines, blank rows, unicode markers and inline bullet points',()=>{
 assert.deepEqual(parseClipboardAssignments('• Install image\r\n\r\n● Configure BIOS\r\n▪ Validate Intune'),['Install image','Configure BIOS','Validate Intune']);
 assert.deepEqual(parseClipboardAssignments('• Install image • Configure BIOS • Verify security'),['Install image','Configure BIOS','Verify security']);
 assert.deepEqual(parseClipboardAssignments('1. Setup device\n2) Validate networking'),['Setup device','Validate networking']);
 assert.deepEqual(parseClipboardAssignments('Prepare device\nInstall drivers\nVerify network'),['Prepare device','Install drivers','Verify network']);
 assert.deepEqual(parseClipboardAssignments('• Setup Windows\n  including required updates\n• Test Apps'),['Setup Windows including required updates','Test Apps']);
 assert.deepEqual(parseClipboardAssignments('Single task'),['Single task']);
 assert.deepEqual(parseClipboardAssignments('   \n'),[]);
});

test('Atomic batch uses exactly the same defaults and destination as individual quick-add',()=>{
 const project=make();
 const labels=['Configure endpoint','Validate app','Test DC04'];
 const bulk=quickCreateAssignments(project,{labels,memberId:'homesh',startWeek:8},['new-1','new-2','new-3']);
 assert.equal(project.tasks.length,1,'Original project must remain unchanged');
 assert.equal(bulk.tasks.length,4);
 assert.deepEqual(bulk.tasks.map(task=>task.id),['old','new-1','new-2','new-3']);
 const single=quickCreateAssignment(project,{label:labels[0],memberId:'homesh',startWeek:8},'new-1').tasks[1];
 for(const task of bulk.tasks.slice(1)){
  assert.equal(task.memberId,'homesh');assert.equal(task.startWeek,8);
  assert.equal(task.duration,1);assert.equal(task.status,'Planned');
  assert.deepEqual(task.helperIds,[]);assert.deepEqual(task.checklist,[]);
  assert.equal(task.version,1);
 }
 assert.deepEqual(bulk.tasks[1],single);
});

test('Failure in any batch row prevents all inserts; overlong text is never truncated',()=>{
 const project=make();
 assert.throws(()=>quickCreateAssignments(project,{labels:['Valid','X'.repeat(161)],memberId:'homesh',startWeek:8},['new-1','new-2']),/Task 2: Task title must be 1–160/);
 assert.throws(()=>quickCreateAssignments(project,{labels:['Valid','Also valid'],memberId:'missing',startWeek:8},['a','b']),/Selected employee/);
 assert.throws(()=>quickCreateAssignments(project,{labels:['Valid','Other'],memberId:'homesh',startWeek:8},['a','a']),/unique/);
 assert.throws(()=>quickCreateAssignments(project,{labels:[],memberId:'homesh',startWeek:8},[]),/1 and 100/);
 assert.throws(()=>quickCreateAssignments(project,{labels:Array(101).fill('Task'),memberId:'homesh',startWeek:8},Array.from({length:101},(_,i)=>String(i))),/1 and 100/);
 assert.deepEqual(project.tasks.map(task=>task.id),['old']);
});

test('Existing single-task and editing workflows are preserved',()=>{
 assert.match(tracker,/labels.length===1\?\{\.\.\.context,label:labels\[0\]\}/);
 assert.match(tracker,/onQuickTaskCreate\(/);
 assert.match(tracker,/Add assignment<\/button>/);
 assert.match(tracker,/Add task/);
 assert.match(app,/quickCreateAssignment\(prev,data,crypto\.randomUUID\(\)\)/);
 assert.match(app,/quickCreateAssignments\(prev,data,ids\)/);
 assert.match(tracker,/QuickAssignmentRow/);
});

test('Bulk quick-add has preview, keyboard support and meaningful errors',()=>{
 assert.match(tracker,/parseClipboardAssignments\(newAssignment\)/);
 assert.match(tracker,/<textarea id="nb-quick-new-task"/);
 assert.match(tracker,/nb89-bulk-preview/);
 assert.match(tracker,/separate tasks detected/);
 assert.match(tracker,/newAssignmentList\.slice\(0,8\)/);
 assert.match(tracker,/e\.currentTarget\.form\?\.requestSubmit\(\)/);
 assert.match(tracker,/Task \$\{invalid\+1\} exceeds 160 characters/);
 assert.match(css,/textarea#nb-quick-new-task/);
 assert.match(css,/\.nb89-bulk-preview/);
});

test('No changes to Assignment page or unrelated project records',()=>{
 const project=make();project.extra='preserved';
 const batch=quickCreateAssignments(project,{labels:['A','B'],memberId:'homesh',startWeek:0},['a','b']);
 assert.equal(batch.extra,'preserved');
 assert.deepEqual(batch.tasks[0],project.tasks[0]);
 assert.equal(batch.members,project.members);
});
