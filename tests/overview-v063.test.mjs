import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveProjectActivity,deriveAssignmentActivity,mergeActivity,MAX_ACTIVITY_ENTRIES} from '../src/activity-log.mjs';
const index=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const overview=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8').split('export function Overview(')[1];
const css=readFileSync(new URL('../nbdt-overview-v063.css',import.meta.url),'utf8');
const empty={name:'Legend OTS',startDate:'2026-09-28',systems:[],issues:[],tasks:[],members:[]};

test('new Overview uses report icons, compact dates, the blue active week and no demo footer',()=>{
 assert.match(overview,/Icon:Settings2/);assert.match(overview,/Icon:Rocket/);
 assert.match(overview,/Icon:Layers3/);assert.match(overview,/Icon:ShieldCheck/);
 assert.match(overview,/nb63-project-start/);assert.match(overview,/nb63-current-week/);
 assert.match(css,/\.nb63-current-week\{/);assert.match(css,/#0662e7/);
 assert.doesNotMatch(overview,/reference demonstration subtotals/);
 assert.doesNotMatch(index,/activeTab==='overview' && <><Overview.*<DataTools/);
});
test('issues and configuration attention are separate groups but retain the two-row dashboard',()=>{
 assert.match(overview,/nb63-attention-split/);assert.match(overview,/nb63-attention-issues/);
 assert.match(overview,/nb63-attention-progress/);assert.match(overview,/openIssues\.map/);
 assert.match(overview,/setupRows\.length/);assert.match(css,/grid-template-columns:1fr 1fr/);
});
test('configuration report edits are captured via central project write',()=>{
 const old={...empty,systems:[{id:'s1',name:'Crew Debit',cyberStatus:'Review',reportMetrics:{total:100,base:30,ready:2,deployed:0}}]};
 const changed={...old,systems:[{...old.systems[0],cyberStatus:'Approved',reportMetrics:{total:100,base:55,ready:2,deployed:0}}]};
 const entries=deriveProjectActivity(old,changed);
 assert.equal(entries.length,1);assert.match(entries[0].detail,/Cyber: Review → Approved/);
 assert.match(entries[0].detail,/Base: 30 → 55/);
});
test('system created, guide edited and lessons changed are recorded without sensitive values',()=>{
 const created=deriveProjectActivity(empty,{...empty,systems:[{id:'x',name:'POS – Mobility'}]});
 assert.equal(created[0].title,'System added');
 const oldSys={id:'x',name:'POS – Mobility',serviceAccount:'old secret',lessonsLearnedItems:[]};
 const nextSys={...oldSys,serviceAccount:'new secret',publishedGuide:{technical:{os:'Windows'}},lessonsLearnedItems:[{id:'1',text:'some lesson',checked:false}]};
 const events=deriveProjectActivity({...empty,systems:[oldSys]},{...empty,systems:[nextSys]});
 assert.match(events[0].detail,/lesson/);assert.match(events[0].detail,/Configuration guide/);
 assert.doesNotMatch(events[0].detail,/secret/);
});
test('issues, tasks, milestones and project dates produce human-readable activity',()=>{
 const old={...empty,issues:[{id:'a',title:'Crash',status:'Open',severity:'High'}],tasks:[{id:'t',label:'Deploy kiosk',status:'Planned'}]};
 const updated={...old,startDate:'2026-10-05',issues:[{...old.issues[0],status:'Investigating'}],tasks:[{...old.tasks[0],status:'Completed'}, {id:'m',label:'Launch',isMilestone:true}]};
 const items=deriveProjectActivity(old,updated);
 assert.ok(items.some(e=>e.title==='Project start changed'));
 assert.ok(items.some(e=>e.title==='Issue updated'&&e.detail.includes('Investigating')));
 assert.ok(items.some(e=>e.title==='Task updated'&&e.detail.includes('Completed')));
 assert.ok(items.some(e=>e.title==='Task added'&&e.detail==='Launch'));
});
test('Assignment owner moves and roster changes enter activity feed',()=>{
 const a={people:[{id:'p1',name:'Apple',position:'ITO',startDate:'2027-01-01'},{id:'p2',name:'Rob',position:'ITO',startDate:'2027-02-01'}],items:[{id:'i',name:'POS',personId:'p1'}]};
 const b={...a,items:[{...a.items[0],personId:'p2'}]};
 const entries=deriveAssignmentActivity(a,b);
 assert.equal(entries[0].title,'System owner changed');assert.match(entries[0].detail,/Apple → Rob/);
 const edited={...a,people:a.people.map(p=>p.id==='p1'?{...p,startDate:'2027-03-01'}:p)};
 assert.equal(deriveAssignmentActivity(a,edited)[0].title,'Team member edited');
});
test('activity list is bounded and never changes an earlier saved record',()=>{
 const original=[{id:'old',title:'Previously saved',at:'2026-10-01'}];
 const merged=mergeActivity(original,[{title:'System added',section:'Systems',detail:'Crew Debit'}]);
 assert.equal(original.length,1);assert.equal(merged[1],original[0]);
 assert.equal(mergeActivity(Array.from({length:MAX_ACTIVITY_ENTRIES},(_,i)=>({id:i})),[{title:'New'}]).length,MAX_ACTIVITY_ENTRIES);
});
test('all project saves and assignment saves append changes only after successful write',()=>{
 assert.match(index,/const changes=deriveProjectActivity\(previous,updated\)/);
 assert.match(index,/activityLog:changes\.length\?mergeActivity/);
 assert.match(index,/await commitRecord\(ASSIGNMENT_STORAGE_KEY,JSON\.stringify\(next\)\)/);
 assert.match(index,/deriveAssignmentActivity\(previous,next\)/);
 assert.match(overview,/activityItems=Array\.isArray\(project\.activityLog\)/);
});
