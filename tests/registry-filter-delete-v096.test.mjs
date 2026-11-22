import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deleteRegistrySystem} from '../src/registry-delete.mjs';

const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-registry-v096.css',import.meta.url),'utf8');
const original=()=>({
 id:'legend-ots',version:42,
 systems:[
  {id:'system-one',name:'Crew Debit',description:'test',devices:[{id:'a'}],deviceRuns:[{id:'run'}],guideDraft:{stages:{}},guideReview:{checks:{a:true}},endpointProfiles:[{id:'ep'}]},
  {id:'system-two',name:'QControl',devices:[{id:'b'}],deviceRuns:[]}
 ],
 issues:[{id:'issue-a',systemId:'system-one'},{id:'issue-b',systemId:'system-two'},{id:'issue-c',systemId:null}],
 tasks:[{id:'task-one',label:'Other scheduled work',systemId:'system-one'}],
 members:[{id:'m1',name:'Assigned employee'}],
 activityLog:[{action:'existing'}]
});

test('Deleting a system removes the entire embedded device, guide and checklist record',()=>{
 const project=original();
 const next=deleteRegistrySystem(project,'system-one');
 assert.deepEqual(next.systems.map(s=>s.id),['system-two']);
 assert.equal(next.systems[0],project.systems[1]);
 assert.equal(project.systems.length,2,'The input project is immutable');
 assert.equal(project.systems[0].devices.length,1);
 assert.notEqual(next,project);
});

test('Linked issue records are deleted, unrelated issues remain unchanged',()=>{
 const project=original(),next=deleteRegistrySystem(project,'system-one');
 assert.deepEqual(next.issues.map(issue=>issue.id),['issue-b','issue-c']);
 assert.strictEqual(next.issues[0],project.issues[1]);
 assert.deepEqual(project.issues.map(issue=>issue.id),['issue-a','issue-b','issue-c']);
});

test('Independent Weekly Tracker, team and project metadata are never silently deleted',()=>{
 const project=original(),next=deleteRegistrySystem(project,'system-one');
 assert.strictEqual(next.tasks,project.tasks);
 assert.strictEqual(next.members,project.members);
 assert.strictEqual(next.activityLog,project.activityLog);
 assert.equal(next.version,42);
 assert.equal(next.id,project.id);
});

test('Deletion rejects stale or missing system IDs without altering project',()=>{
 const project=original();
 assert.throws(()=>deleteRegistrySystem(project,'missing'),/System no longer exists/);
 assert.throws(()=>deleteRegistrySystem(project,''),/System no longer exists/);
 assert.deepEqual(project.systems.map(s=>s.id),['system-one','system-two']);
});

test('All four filter types use identical styled menu primitives and native values',()=>{
 assert.match(app,/const DeviceTypeFilter =/);
 assert.match(app,/const RegistryDropdownFilter =/);
 assert.match(app,/className=\{'nb-type-filter nb96-dropdown-filter'/);
 assert.match(app,/className="nb-type-filter-trigger"/);
 assert.match(app,/className="nb-type-filter-menu" role="listbox"/);
 assert.match(app,/className=\{'nb-type-filter-option'/);
 for(const title of ['Platform','Connection','Deployment owner']){
  assert.match(app,new RegExp('<RegistryDropdownFilter label="'+title+'"'));
 }
 assert.match(app,/placeholder="All platforms"/);
 assert.match(app,/placeholder="All connections"/);
 assert.match(app,/placeholder="All owners"/);
 assert.match(app,/\{value:'WiFi',label:'Wi-Fi'(?:,icon:Wifi)?\}/);
 assert.match(app,/\{value:'Wired',label:'Wired'(?:,icon:Cable)?\}/);
 assert.match(app,/assignmentRoster\.people\.map\(\(person:any\)=>\(\{value:person\.id,label:person\.name\}\)\)/);
});

test('Dropdowns allow clearing and keyboard dismissal, preserving the same filter state',()=>{
 assert.match(app,/const choose=\(next:string\)=>\{onChange\(next\);setOpen\(false\);\}/);
 assert.match(app,/onClick=\{\(\)=>choose\(''\)\}/);
 assert.match(app,/aria-selected=\{value===item\.value\}/);
 assert.match(app,/event\.key==='Escape'/);
 assert.match(app,/document\.addEventListener\('pointerdown',outside\)/);
 assert.match(app,/setActiveFilters\(prev=>\[\.\.\.prev\.filter/);
 assert.match(app,/value=\{systemOwnerFilter\} onChange=\{setSystemOwnerFilter\}/);
});

test('Admin card pencil offers delete only after explicit confirmation',()=>{
 assert.match(app,/const SystemRegistryCard = \(\{[^\n]*onDeleteSystem/);
 assert.match(app,/\{isAdmin && <button className="nb-card-edit-icon"/);
 assert.match(app,/setConfirmDelete\(true\)/);
 assert.match(app,/\{confirmDelete&&<div className="nb96-delete-confirm"/);
 assert.match(app,/Delete “\{sys\.name\}” permanently\?/);
 assert.match(app,/Delete system<\/button>/);
 assert.match(app,/Yes, delete system/);
 assert.match(app,/if\(!isAdmin\|\|deletingSystem\|\|descriptionSaving\|\|!confirmDelete\)return/);
 assert.match(app,/await onDeleteSystem\(sys\.id\)/);
 assert.match(app,/Keep system/);
});

test('All system deletion entry points share the same data-cleanup helper',()=>{
 assert.match(app,/import \{deleteRegistrySystem\} from '\.\/src\/registry-delete\.mjs'/);
 assert.match(app,/onDeleteSystem=\{async\(id:string\)=>\{if\(!isAdmin\)throw Error\('Administrator sign-in required'\);await handleAction\(prev=>deleteRegistrySystem\(prev,id\)\);\}\}/);
 assert.match(app,/onDeleteSystem=\{async\(systemId:string\)=>\{if\(!isAdmin\)throw Error\('Administrator sign-in required'\);await handleAction\(prev=>deleteRegistrySystem\(prev,systemId\)\);closeGuide\(\);\}\}/);
 assert.match(app,/onSystemDelete=\{\(id:string\)=>\{if\(!isAdmin\)return Promise\.reject\(Error\('Administrator sign-in required'\)\);return handleAction\(p=>deleteRegistrySystem\(p,id\)\);\}\}/);
});

test('Registry styling extends Device Type without modifying other pages',()=>{
 assert.match(css,/\.nb-registry-page \.nb96-dropdown-filter/);
 assert.match(css,/\.nb96-dropdown-option-text/);
 assert.match(css,/\.nb-registry-page \.nb96-delete-confirm/);
 assert.match(css,/\.nb96-delete-confirm-button/);
 assert.match(app,/import '\.\/nbdt-registry-v096\.css'/);
});
