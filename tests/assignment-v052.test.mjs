import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialAssignmentRoster,assignmentKey,resolveAssignmentOwner,assignmentRows,addAssignment,editAssignment,removeAssignment,moveAssignment,projectWithAssignmentOwners} from '../src/assignment-roster.mjs';
import {readAppRoute,sectionPath} from '../src/navigation.mjs';
const file=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const roster=initialAssignmentRoster();
test('Assignment imports 13 accurate people, positions, joining dates and Project 0–12 system columns',()=>{
 assert.equal(roster.people.length,13);
 assert.deepEqual(roster.people.map(p=>p.name),['HOMESHWAR HALKORI','SERGIU BURIU','DODY WAHYUDI','APPLE ESQUIVEL','ELVAN PRESTIN','RONNY TAPERA','ROB ISIP','CLAUDIO MONTEIRO','DARON FRANKLYN','ODDI A FERREIRA','NILSON PIANAR CALONA','NADEEM ESSOP','NISHANT TONDWALKAR']);
 assert.deepEqual(roster.people.map(p=>p.startDate),['2027-01-30','2027-01-30','2027-01-30','2027-02-13','2027-02-13','2027-02-13','2027-02-13','2027-02-27','2027-02-27','2027-02-27','2027-02-27','2027-03-13','2027-03-13']);
 assert.deepEqual(roster.people.map(p=>p.position),['ITO','ITO','ITO','ITO','ITO','ITO','ITO','ITSS','ITSS','ITO','ITSS','ITSS','ITSS']);
 assert.equal(assignmentRows(roster),13);
 assert.equal(roster.items.find(i=>i.personId===roster.people[0].id)?.name,'NextGen / General - Support');
 assert.equal(roster.items.find(i=>i.personId===roster.people[8].id&&i.order===12)?.name,'Up to date');
});
test('Exact full system title match: no loose/fuzzy/partial assignment',()=>{
 const digital=resolveAssignmentOwner(roster,'Digital Signage');
 assert.equal(digital.status,'unique');assert.deepEqual(digital.names,['CLAUDIO MONTEIRO']);
 assert.equal(resolveAssignmentOwner(roster,' digital    signage ').names[0],'CLAUDIO MONTEIRO');
 assert.equal(resolveAssignmentOwner(roster,'Digital Signage 2').status,'none');
 assert.equal(resolveAssignmentOwner(roster,'CREW DEBIT KIOSK').status,'none');
 assert.equal(resolveAssignmentOwner(roster,'').status,'none');
 assert.equal(assignmentKey('  OHC - On the Go '),'ohc - on the go');
});
test('Duplicate systems share named owners instead of arbitrarily selecting one',()=>{
 const same=resolveAssignmentOwner(roster,'OHC - SPMS');
 assert.equal(same.status,'shared');assert.deepEqual(same.names,['SERGIU BURIU','DODY WAHYUDI']);
 assert.equal(resolveAssignmentOwner(roster,'NextGen TV / Genaral - Support').names.length,9);
});
test('Add, edit, delete and drag preserves all assignments and expands rows as needed',()=>{
 let current=roster,person=roster.people[0].id;
 for(let i=0;i<14;i++)current=addAssignment(current,person,'New system '+i);
 assert.equal(assignmentRows(current),15); // 1 existing and 14 new
 const added=current.items.find(i=>i.name==='New system 0');
 current=editAssignment(current,added.id,'Updated system');assert.equal(resolveAssignmentOwner(current,'Updated system').label,roster.people[0].name);
 current=moveAssignment(current,added.id,roster.people[1].id,1);
 assert.equal(resolveAssignmentOwner(current,'Updated system').label,roster.people[1].name);
 assert.equal(current.items.find(i=>i.id===added.id).order,1);
 current=removeAssignment(current,added.id);assert.equal(resolveAssignmentOwner(current,'Updated system').status,'none');
 assert.equal(new Set(current.items.map(i=>i.id)).size,current.items.length);
});
test('Projection changes owner across existing reports, guides and tracker labels without rewriting stored project',()=>{
 const original={systems:[{id:'s1',name:'Digital Signage',reportOwnerName:'Manual'},{id:'s2',name:'CREW DEBIT KIOSK',reportOwnerName:'Manual'}],tasks:[{id:'t1',label:'Digital Signage',memberId:'existing'},{id:'t2',label:'Not listed',memberId:'existing'}]};
 const display=projectWithAssignmentOwners(original,roster);
 assert.equal(display.systems[0].assignmentOwnerLabel,'CLAUDIO MONTEIRO');
 assert.equal(display.systems[0].reportOwnerName,'Manual');
 assert.equal(display.systems[1].assignmentOwnerLabel,undefined);
 assert.equal(display.tasks[0].assignmentOwnerLabel,'CLAUDIO MONTEIRO');
 assert.equal(display.tasks[0].memberId,'existing');
 const switched=moveAssignment(roster,roster.items.find(i=>i.name==='Digital Signage').id,roster.people[0].id);
 assert.equal(projectWithAssignmentOwners(original,switched).systems[0].assignmentOwnerLabel,'HOMESHWAR HALKORI');
 assert.equal(original.systems[0].assignmentOwnerLabel,undefined);
});
test('Assignment route and role-based editing / navigation exist',()=>{
 assert.equal(readAppRoute('https://demo.test/projects/legend-ots/assignment').tab,'assignment');
 assert.equal(sectionPath('hero-ots','assignment'),'/projects/hero-ots/assignment');
 const app=file('../index.tsx'),component=file('../src/assignment-page-v052.tsx'),css=file('../nbdt-assignment-v052.css');
 assert.match(app,/activeTab==='assignment' && <AssignmentPage/);
 assert.match(app,/if\(!isAdmin\) return Promise.reject/);
 assert.match(app,/Owner: resolvedOwner.label \|\|/);
 assert.match(component,/isAdmin&&<button className="nb52-pencil"/);
 assert.match(component,/DndContext sensors=\{sensors\}/);
 assert.match(component,/nb52-column-plus/);
 assert.match(css,/scrollbar-width:none/);
 assert.match(css,/position:sticky/);
});
