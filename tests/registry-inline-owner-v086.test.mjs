import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialAssignmentRoster,resolveAssignmentOwner,systemMatchesAssignmentOwner,setSystemAssignmentOwner} from '../src/assignment-roster.mjs';

const ui=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-registry-v082.css',import.meta.url),'utf8');

test('Every Registry card shows a compact Owner row, including Not assigned',()=>{
 assert.match(ui,/className="nb52-owner-in-registry nb86-owner-in-registry"/);
 assert.match(ui,/<User size=\{12\} aria-hidden="true"\/>/);
 assert.match(ui,/owner\.label\|\|'Not assigned'/);
 assert.doesNotMatch(ui,/sys\.assignmentOwnerLabel&&<div className="nb52-owner-in-registry"/);
 assert.match(css,/\.nb86-owner-in-registry/);
});

test('Only authenticated admins can edit Owner in a dropdown sourced from Assignment',()=>{
 assert.match(ui,/\{isAdmin\?<select aria-label=\{`Owner for \$\{sys\.name\}`\}/);
 assert.match(ui,/\(assignmentRoster\?\.people\|\|\[\]\)\.map/);
 assert.match(ui,/<option value="">Not assigned<\/option>/);
 assert.match(ui,/onAssignOwner=\{\(systemName:string,personId:string\)=>changeAssignment/);
 assert.match(ui,/setSystemAssignmentOwner\(current,systemName,personId\)/);
 assert.match(ui,/<strong className=\{owner\.label\?'':'nb86-owner-unassigned'\}/);
 assert.match(ui,/const \[ownerSaving,setOwnerSaving\]=useState\(false\)/);
 assert.match(ui,/catch\(error:any\)\{setOwnerError/);
});

test('Assigning an initially unassigned system stores an Assignment entry and updates lookup/filter',()=>{
 const base=initialAssignmentRoster();
 const person=base.people.find(p=>p.name==='ROB ISIP');
 const name='Unassigned Registry Sample';
 assert.equal(resolveAssignmentOwner(base,name).status,'none');
 const next=setSystemAssignmentOwner(base,name,person.id);
 assert.notStrictEqual(next,base);
 assert.deepEqual(resolveAssignmentOwner(next,name).personIds,[person.id]);
 assert.equal(systemMatchesAssignmentOwner(next,name,person.id),true);
 assert.equal(systemMatchesAssignmentOwner(base,name,person.id),false);
 assert.equal(next.items.length,base.items.length+1);
});

test('Reassignment replaces only the named system owner and keeps other systems intact',()=>{
 const base=initialAssignmentRoster();
 const personA=base.people[0],personB=base.people[1];
 const sample='Test Registry Owner Switch';
 const withOwner=setSystemAssignmentOwner(base,sample,personA.id);
 const next=setSystemAssignmentOwner(withOwner,sample,personB.id);
 assert.deepEqual(resolveAssignmentOwner(next,sample).personIds,[personB.id]);
 assert.equal(systemMatchesAssignmentOwner(next,sample,personA.id),false);
 assert.deepEqual(resolveAssignmentOwner(next,'OHC – Print Shop'),resolveAssignmentOwner(base,'OHC – Print Shop'));
 assert.equal(next.items.length,withOwner.items.length);
 assert.equal(setSystemAssignmentOwner(next,sample,personB.id),next);
});

test('Not assigned removes matching Assignment rows but retains every unrelated entry',()=>{
 const base=initialAssignmentRoster();
 const name='Registry Temporary Owner';
 const assigned=setSystemAssignmentOwner(base,name,base.people[0].id);
 const next=setSystemAssignmentOwner(assigned,name,'');
 assert.equal(resolveAssignmentOwner(next,name).status,'none');
 assert.equal(next.items.length,base.items.length);
 assert.deepEqual(next.items.map(item=>item.id),base.items.map(item=>item.id));
 assert.equal(setSystemAssignmentOwner(next,name,''),next);
});

test('Shared ownership becomes exactly one selected owner without duplicate system assignments',()=>{
 const base=initialAssignmentRoster();
 const name='Shared Registry Sample';
 const first=base.people[0].id,second=base.people[1].id;
 const roster={...base,items:[...base.items,
   {id:'shared-owner-1',personId:first,name,order:99},
   {id:'shared-owner-2',personId:second,name:'  SHARED   REGISTRY   SAMPLE ',order:99}]};
 assert.equal(resolveAssignmentOwner(roster,name).status,'shared');
 const next=setSystemAssignmentOwner(roster,name,second);
 assert.deepEqual(resolveAssignmentOwner(next,name).personIds,[second]);
 assert.equal(next.items.filter(item=>item.name.trim().toLowerCase().includes('shared registry sample')).length,1);
 assert.equal(next.items.some(item=>item.id==='shared-owner-2'),true);
 assert.equal(next.items.some(item=>item.id==='shared-owner-1'),false);
});

test('Invalid selections cannot alter Assignment roster',()=>{
 const roster=initialAssignmentRoster();
 assert.throws(()=>setSystemAssignmentOwner(roster,'Example','unknown-person'),/Assignment team member/);
 assert.throws(()=>setSystemAssignmentOwner(roster,'  ',roster.people[0].id),/system name/i);
});

test('Registry CSV uses Assignment owners and Not assigned, never legacy project members',()=>{
 assert.match(ui,/resolveAssignmentOwner\(assignmentRoster,s\.name\)\.label\|\|'Not assigned'/);
 assert.doesNotMatch(ui,/resolveAssignmentOwner\(assignmentRoster,s\.name\)\.label\|\|project\.members/);
});
