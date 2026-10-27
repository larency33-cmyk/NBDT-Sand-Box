import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {quickSaveMilestone,quickDeleteMilestone} from '../src/tracker-actions.mjs';
const tracker=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../weekly-tracker-milestones-v042.css',import.meta.url),'utf8');
const project={members:[],issues:[],tasks:[
 {id:'ms-a',label:'Kick-off',startWeek:4,isMilestone:true,version:2},
 {id:'ms-b',label:'Review',startWeek:4,isMilestone:true},
 {id:'task',label:'Actual assignment',startWeek:4,memberId:'staff',isMilestone:false}
]};
test('existing milestone updates in-place with a stable identity and unchanged assignment',()=>{
 const next=quickSaveMilestone(project,{...project.tasks[0],label:'Kick-off complete'},'ms-a');
 assert.equal(next.tasks.length,3);
 assert.equal(next.tasks.find(t=>t.id==='ms-a').label,'Kick-off complete');
 assert.equal(next.tasks.find(t=>t.id==='ms-a').version,3);
 assert.equal(next.tasks.find(t=>t.id==='task').label,'Actual assignment');
 assert.equal(project.tasks[0].label,'Kick-off');
});
test('milestone deletion affects only the milestone record and is immutable',()=>{
 const next=quickDeleteMilestone(project,'ms-b');
 assert.deepEqual(next.tasks.map(t=>t.id),['ms-a','task']);
 assert.equal(project.tasks.length,3);
 assert.throws(()=>quickDeleteMilestone(project,'task'),/Milestone no longer exists/);
 assert.throws(()=>quickDeleteMilestone(project,'bad-id'),/Milestone no longer exists/);
});
test('creating milestone in selected project week preserves multiple existing milestones',()=>{
 const next=quickSaveMilestone(project,{label:'Shipyard handover',startWeek:4,date:'2026-10-28',description:''},'ms-c');
 assert.deepEqual(next.tasks.filter(t=>t.isMilestone&&t.startWeek===4).map(t=>t.id),['ms-a','ms-b','ms-c']);
 assert.equal(next.tasks.find(t=>t.id==='ms-c').isMilestone,true);
});
test('milestone UI offers modal rename/delete and compact multi-milestone hover tray',()=>{
 assert.match(tracker,/onMilestoneDelete/);
 assert.match(tracker,/setMilestoneDraft/);
 assert.match(tracker,/role="dialog" aria-modal="true" aria-labelledby="nb42-milestone-title"/);
 assert.match(tracker,/Delete milestone “/);
 assert.match(tracker,/onClick=\{deleteMilestone\}/);
 assert.match(tracker,/nb-milestone-multiple/);
 assert.match(tracker,/nb-milestone-more/);
 assert.match(css,/\.nb-milestone-stack\.nb-milestone-expanded/);
 assert.match(css,/\.nb-week-head:hover \.nb-milestone-stack\.nb-milestone-multiple/);
 assert.match(css,/z-index:80 !important/);
 assert.match(css,/position:absolute !important/);
});
test('only current footer week has blue fill; selection of other weeks draws a thin stroke',()=>{
 assert.match(css,/\.nb-week-wide-selected:not\(\.nb-week-wide-current\)/);
 assert.match(css,/background:#fff !important/);
 assert.match(css,/border:1\.5px solid #1680ee !important/);
 assert.match(css,/\.nb-week-wide-current\.nb-week-wide-selected/);
 assert.match(index,/weekly-tracker-milestones-v042\.css/);
 assert.match(index,/quickDeleteMilestone\(prev,id\)/);
});
