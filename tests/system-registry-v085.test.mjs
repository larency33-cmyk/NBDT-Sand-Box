import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialAssignmentRoster,systemMatchesAssignmentOwner,resolveAssignmentOwner} from '../src/assignment-roster.mjs';

const ui=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../redesign.css',import.meta.url),'utf8');

test('System Registry owner dropdown uses only Assignment people and no Legacy Team options',()=>{
 const selected=ui.match(/<select aria-label="Deployment owner"[^]*?<\/select>/)?.[0];
 assert.ok(selected,'Registry dropdown must exist');
 assert.match(selected,/value=\{systemOwnerFilter\}/);
 assert.match(selected,/assignmentRoster\.people\.map/);
 assert.match(selected,/value=\{person\.id\}/);
 assert.doesNotMatch(selected,/project\.members\.map|Legacy:|assignment:\s*\+/);
 assert.match(ui,/systemMatchesAssignmentOwner\(assignmentRoster,s\.name,systemOwnerFilter\)/);
});

test('System Registry and Issue Tracker owner filter states stay independent',()=>{
 assert.match(ui,/const \[systemOwnerFilter, setSystemOwnerFilter\] = useState/);
 assert.match(ui,/const \[assigneeFilter, setAssigneeFilter\] = useState/);
 assert.match(ui,/setSystemOwnerFilter\(''\);setDeviceTypeFilter\(''\)/);
 assert.match(ui,/i\.assigneeId === assigneeFilter/);
});

test('Assignment ownership filter includes shared assignments, does not use legacy assignee IDs',()=>{
 const roster={
   people:[{id:'person-rob',name:'Rob'},{id:'person-isaac',name:'Isaac'}],
   items:[{id:'a',name:'CREW DEBIT KIOSK',personId:'person-rob'}, {id:'b',name:'Crew Debit Kiosk',personId:'person-isaac'}]
 };
 assert.equal(systemMatchesAssignmentOwner(roster,'Crew Debit Kiosk',''),true);
 assert.equal(systemMatchesAssignmentOwner(roster,'CREW DEBIT KIOSK','person-rob'),true);
 assert.equal(systemMatchesAssignmentOwner(roster,'Crew Debit Kiosk','person-isaac'),true);
 assert.equal(systemMatchesAssignmentOwner(roster,'Other system','person-rob'),false);
 assert.equal(systemMatchesAssignmentOwner(roster,'Crew Debit Kiosk','legacy-person'),false);
 assert.equal(resolveAssignmentOwner(roster,'CREW DEBIT KIOSK').status,'shared');
 assert.equal(systemMatchesAssignmentOwner({...roster,items:[]},'Crew Debit Kiosk','person-rob'),false);
});

test('Existing Assignment roster names can be filtered, including shared support assignments',()=>{
 const roster=initialAssignmentRoster();
 const person=roster.people.find(p=>p.name==='ROB ISIP');
 assert.ok(person);
 assert.equal(systemMatchesAssignmentOwner(roster,'NextGen TV / Genaral - Support',person.id),true);
 assert.equal(systemMatchesAssignmentOwner(roster,'not-in-assignment',person.id),false);
});

test('Registry grid keeps three fixed columns on desktop even for a single result',()=>{
 const rule=css.slice(css.lastIndexOf('/* v0.6.85'));
 assert.match(rule,/\.nb-registry-page \.nb-registry-grid\s*\{\s*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(rule,/@media \(max-width:1040px\)[^]*?repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(rule,/@media \(max-width:680px\)[^]*?grid-template-columns:minmax\(0,1fr\)/);
 assert.equal(rule.includes('auto-fit,'),false);
});
