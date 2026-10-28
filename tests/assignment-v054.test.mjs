import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialAssignmentRoster,addAssignmentPerson,editAssignmentPerson,addAssignment,moveAssignment,resolveAssignmentOwner,assignmentRows,projectWithAssignmentOwners} from '../src/assignment-roster.mjs';
const file=relative=>readFileSync(new URL(relative,import.meta.url),'utf8');

test('New owner can be added without changing the original 13 employees and 108 assignments',()=>{
 const original=initialAssignmentRoster();
 const updated=addAssignmentPerson(original,{name:'New Colleague',position:'ITSS',startDate:'2027-04-10'});
 assert.equal(original.people.length,13);assert.equal(original.items.length,108);
 assert.equal(updated.people.length,14);assert.equal(updated.items.length,108);
 const newPerson=updated.people.at(-1);assert.notEqual(newPerson.id,updated.people[0].id);
 assert.deepEqual([newPerson.name,newPerson.position,newPerson.startDate],['New Colleague','ITSS','2027-04-10']);
 const populated=addAssignment(updated,newPerson.id,'New Unique Service');
 assert.equal(resolveAssignmentOwner(populated,'New Unique Service').label,'New Colleague');
});

test('Editing team member preserves ID and existing assignments, and immediately changes global Owner name',()=>{
 const original=initialAssignmentRoster();
 const target=original.people[7];
 const renamed=editAssignmentPerson(original,target.id,{name:'Claudio Test',position:'ITO',startDate:'2027-05-15'});
 assert.equal(renamed.people[7].id,target.id);
 assert.equal(original.people[7].name,'CLAUDIO MONTEIRO');
 assert.equal(renamed.items.length,original.items.length);
 assert.deepEqual(renamed.items,original.items);
 assert.equal(resolveAssignmentOwner(renamed,'Digital Signage').label,'Claudio Test');
 const display=projectWithAssignmentOwners({systems:[{id:'sys',name:'Digital Signage'}],tasks:[]},renamed);
 assert.equal(display.systems[0].assignmentOwnerLabel,'Claudio Test');
});

test('Person validations stop duplicate names and invalid dates without touching the saved roster',()=>{
 const original=initialAssignmentRoster();
 const data={name:' HOMESHWAR   HALKORI ',position:'ITO',startDate:'2027-02-18'};
 assert.throws(()=>addAssignmentPerson(original,data),/already exists/i);
 assert.throws(()=>addAssignmentPerson(original,{name:'Test',position:'',startDate:'2027-01-05'}),/position/i);
 assert.throws(()=>addAssignmentPerson(original,{name:'Test',position:'ITO',startDate:'2027-02-31'}),/valid start date/i);
 assert.throws(()=>editAssignmentPerson(original,'not-found',{name:'Test',position:'ITO',startDate:'2027-02-03'}),/not found/i);
 assert.equal(original.people.length,13);
});

test('Drag transfer to newly created owner keeps identity and updates ownership',()=>{
 let roster=initialAssignmentRoster();const item=roster.items.find(item=>item.name==='Digital Signage');
 roster=addAssignmentPerson(roster,{name:'Added Owner',position:'ITO',startDate:'2027-03-20'});
 const target=roster.people.at(-1);
 roster=moveAssignment(roster,item.id,target.id,0);
 assert.equal(roster.items.find(i=>i.id===item.id).personId,target.id);
 assert.equal(resolveAssignmentOwner(roster,'Digital Signage').label,'Added Owner');
 assert.equal(assignmentRows(roster),13);
});

test('Assignment UI has header editing, add-person column and enhanced drag target UX',()=>{
 const component=file('../src/assignment-page-v052.tsx');
 assert.match(component,/Edit team member/);
 assert.match(component,/Add new team member/);
 assert.match(component,/addAssignmentPerson/);
 assert.match(component,/editAssignmentPerson/);
 assert.match(component,/onDragOver=/);
 assert.match(component,/DragOverlay dropAnimation=/);
 assert.match(component,/nb54-horizontal-rail/);
 assert.doesNotMatch(component,/All positions/);
});

test('Navigation places Assignment after Configuration Report and removes Collab Hub menu button',()=>{
 const source=file('../index.tsx');
 const nav=source.slice(source.indexOf('<nav aria-label="Main navigation"'),source.indexOf('</nav>',source.indexOf('<nav aria-label="Main navigation"')));
 assert.ok(nav.indexOf("setActiveTab('config-report')")<nav.indexOf("setActiveTab('assignment')"));
 assert.doesNotMatch(nav,/Collab Hub/);
 assert.match(nav,/setActiveTab\('assignment'\)/);
});

test('Assignment provides a custom horizontal scrollbar even though app hides native scrollbars',()=>{
 const css=file('../nbdt-assignment-v052.css');
 assert.match(css,/nb54-horizontal-rail/);
 assert.match(css,/nb54-horizontal-thumb/);
 assert.match(css,/scrollbar-width:none!important/);
 assert.match(css,/nb54-person-actions/);
 assert.match(css,/nb54-new-person/);
 assert.match(css,/nb54-land/);
});
