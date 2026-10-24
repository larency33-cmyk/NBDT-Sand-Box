import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {memberInitial, renameMember, addMember, removeMember, cleanMemberName, UNASSIGNED_MEMBER_ID} from '../src/members.mjs';

const fixture=()=>({members:[{id:'m0',name:'TEAM LEAD'},{id:'m1',name:'JORGE'}],tasks:[
 {id:'t1',memberId:'m0',helperIds:['m1'],label:'Prepare WiFi',startWeek:0,duration:1},
 {id:'t2',memberId:'m1',helperIds:['m0'],label:'Printer checks',startWeek:1,duration:1}
],systems:[{id:'s1',assigneeId:'m0'},{id:'s2',assigneeId:'m1'}]});

test('rename preserves member identity, task and system references, updates initial, and cleans whitespace',()=>{
 const input=fixture(),after=renameMember(input,'m0','  Коля   Пример ');
 assert.equal(after.members[0].name,'Коля Пример');
 assert.equal(memberInitial(after.members[0].name),'К');
 assert.equal(after.members[0].id,'m0');
 assert.equal(after.tasks[0].memberId,'m0');
 assert.equal(after.systems[0].assigneeId,'m0');
 assert.equal(input.members[0].name,'TEAM LEAD');
});
test('new team member is appended with a new stable ID',()=>{
 const after=addMember(fixture(),'m2','  Maria  ');
 assert.equal(after.members.length,3);
 assert.deepEqual(after.members[2],{id:'m2',name:'Maria'});
 assert.equal(memberInitial('émilie'),'É');
});
test('invalid names, duplicate names and missing person are blocked',()=>{
 assert.throws(()=>cleanMemberName(' '),/Name/);
 assert.throws(()=>cleanMemberName('x'.repeat(81)),/Name/);
 assert.throws(()=>addMember(fixture(),'m2',' jorge '),/exists/);
 assert.throws(()=>renameMember(fixture(),'m0','Jorge'),/exists/);
 assert.throws(()=>renameMember(fixture(),'nobody','Hi'),/no longer exists/);
 assert.throws(()=>addMember(fixture(),UNASSIGNED_MEMBER_ID,'test'),/Invalid/);
});
test('remove member preserves tasks, clears only deleted membership and system ownership',()=>{
 const old=fixture(),after=removeMember(old,'m0');
 assert.deepEqual(after.members,[{id:'m1',name:'JORGE'}]);
 assert.equal(after.tasks.length,2);
 assert.deepEqual(after.tasks[0],{...old.tasks[0],memberId:'',helperIds:['m1']});
 assert.deepEqual(after.tasks[1],{...old.tasks[1],helperIds:[]});
 assert.equal(after.systems[0].assigneeId,'');
 assert.equal(after.systems[1].assigneeId,'m1');
 assert.equal(old.tasks[0].memberId,'m0');
});

test('UI gives edit-only pencil and remove actions, inline create under employee and 15-percent header fade',()=>{
 const src=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
 const style=readFileSync(new URL('../weekly-tracker-approved-v016.css',import.meta.url),'utf8');
 assert.match(src,/isAdmin&&m\.id!==UNASSIGNED_MEMBER_ID/);
 assert.match(src,/onClick=\{\(\)=>startMemberRename\(m\)\}/);
 assert.match(src,/onClick=\{\(\)=>deleteMember\(m\)\}/);
 assert.match(src,/nb-member-create-table-row/);
 assert.match(src,/onMemberCreate\(newMemberName\)/);
 assert.match(src,/onMemberDelete\(m\.id\)/);
 assert.match(src,/memberInitial\(m\.name\)/);
 assert.match(style,/height:17%/);
 assert.match(style,/border-bottom:0!important/);
});

test('main application gates write callbacks behind Edit mode and queued IndexedDB commit',()=>{
 const source=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
 assert.match(source,/onMemberRename=\{async\(id:string,name:string\)/);
 assert.match(source,/onMemberCreate=\{async\(name:string\)/);
 assert.match(source,/onMemberDelete=\{async\(id:string\)/);
 assert.match(source,/handleAction\(prev=>removeMember\(prev,id\)\)/);
});
