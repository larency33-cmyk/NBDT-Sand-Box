import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialAssignmentRoster} from '../src/assignment-roster.mjs';
import {syncTrackerTeam,unlinkedTrackerTasks,reassignUnlinkedTrackerTask,reorderTrackerMember} from '../src/tracker-team.mjs';

const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-tracker-v090.css',import.meta.url),'utf8');
const roster=initialAssignmentRoster();
const original=()=>({
 id:'legend-ots',
 members:[{id:'m0',name:'TEAM LEAD',isTeamLead:true},{id:'m1',name:'HOMESH'},{id:'m2',name:'JORGE'},{id:'m3',name:'APPLE / NILSON'},{id:'m5',name:'RONNY'}],
 trackerMembers:[{id:'m0',name:'TEAM LEAD',isTeamLead:true},
  {id:'m1',name:'HOMESHWAR HALKORI',assignmentPersonId:'assignment-person-1',position:'ITO',startDate:'2027-01-30'},
  {id:'tracker-assignment-person-2',name:'SERGIU BURIU',assignmentPersonId:'assignment-person-2',position:'ITO',startDate:'2027-01-30'},
  {id:'m5',name:'RONNY TAPERA',assignmentPersonId:'assignment-person-6',position:'ITO',startDate:'2027-02-13'}],
 trackerTeamSynced:true,
 trackerNotOnSite:{'m0:0':true,'m5:1':true},
 tasks:[
  {id:'lead-task',memberId:'m0',label:'Lead historical task',startWeek:0,duration:1,status:'Completed',version:2,helperIds:[],description:'Original note'},
  {id:'jorge-task',memberId:'m2',label:'Old Jorge task',startWeek:1,duration:1,status:'Blocked',version:3,helperIds:[],description:'History'},
  {id:'ronny-task',memberId:'m5',label:'Current task',startWeek:1,duration:1,status:'Planned',version:1,helperIds:[]}
 ],
 issues:[{id:'issue-1',assigneeId:'m2'}],systems:[]
});

test('Weekly Tracker people are exactly the Assignment roster, neither Team Lead nor Unassigned',()=>{
 const next=syncTrackerTeam(original(),roster);
 assert.equal(next.trackerMembers.length,roster.people.length);
 assert.deepEqual(new Set(next.trackerMembers.map(member=>member.assignmentPersonId)),new Set(roster.people.map(person=>person.id)));
 assert.deepEqual(new Set(next.trackerMembers.map(member=>member.name)),new Set(roster.people.map(person=>person.name)));
 assert.equal(next.trackerMembers.some(member=>member.name==='TEAM LEAD'||member.name==='Unassigned'),false);
 assert.equal(next.trackerMembers.find(member=>member.assignmentPersonId===roster.people[0].id)?.id,'m1');
 assert.equal(next.trackerMembers.find(member=>member.assignmentPersonId===roster.people[5].id)?.id,'m5');
 assert.strictEqual(syncTrackerTeam(next,roster),next,'No infinite synchronization commits');
});

test('Changing Assignment membership is authoritative: removal and addition update roster exactly',()=>{
 const first=syncTrackerTeam(original(),roster);
 const reduced={...roster,people:roster.people.filter(person=>person.id!=='assignment-person-6')};
 const removed=syncTrackerTeam(first,reduced);
 assert.equal(removed.trackerMembers.length,reduced.people.length);
 assert.equal(removed.trackerMembers.some(member=>member.name==='RONNY TAPERA'),false);
 assert.equal(removed.trackerLegacyOwnerNames.m5,'RONNY TAPERA');
 assert.ok(removed.tasks.some(task=>task.id==='ronny-task'));
 const withNew={...reduced,people:[...reduced.people,{id:'assignment-person-added',name:'ADDED ENGINEER',position:'ITSS',startDate:'2027-04-01'}]};
 const next=syncTrackerTeam(removed,withNew);
 assert.equal(next.trackerMembers.length,withNew.people.length);
 assert.equal(next.trackerMembers.at(-1).name,'ADDED ENGINEER');
 assert.equal(next.trackerMembers.at(-1).position,'ITSS');
 assert.equal(next.trackerMembers.at(-1).startDate,'2027-04-01');
});

test('Assignment can be empty: zero people in Tracker, no artificial fallback',()=>{
 const base=original();
 const next=syncTrackerTeam(base,{...roster,people:[]});
 assert.deepEqual(next.trackerMembers,[]);
 assert.equal(unlinkedTrackerTasks(next).length,3);
 assert.equal(next.trackerTeamSynced,true);
 assert.strictEqual(next.members,base.members,'Global membership is preserved for other modules');
});

test('Legacy Team Lead and old Unassigned task records are retained, but not displayed as people',()=>{
 const base=original();
 const next=syncTrackerTeam(base,roster);
 assert.strictEqual(next.tasks,base.tasks);
 assert.strictEqual(next.issues,base.issues);
 assert.strictEqual(next.members,base.members);
 assert.equal(next.trackerLegacyOwnerNames.m0,'TEAM LEAD');
 assert.equal(next.trackerLegacyOwnerNames.m2,'JORGE');
 assert.deepEqual(unlinkedTrackerTasks(next).map(task=>task.id),['lead-task','jorge-task']);
 assert.equal(next.trackerNotOnSite['m0:0'],true,'Historical status remains stored');
});

test('Orphan recovery accepts only Assignment people and retains status, week, notes and task ID',()=>{
 const first=syncTrackerTeam(original(),roster);
 const member=first.trackerMembers.find(person=>person.name==='HOMESHWAR HALKORI');
 const recovered=reassignUnlinkedTrackerTask(first,'lead-task',member.id);
 assert.deepEqual(unlinkedTrackerTasks(recovered).map(task=>task.id),['jorge-task']);
 const old=first.tasks[0],task=recovered.tasks[0];
 assert.equal(task.id,old.id);assert.equal(task.memberId,member.id);
 assert.equal(task.status,old.status);assert.equal(task.startWeek,old.startWeek);
 assert.equal(task.description,old.description);assert.equal(task.version,old.version+1);
 assert.equal(first.tasks[0].memberId,'m0','Original project is immutable');
 assert.strictEqual(recovered.issues,first.issues);
});

test('Orphan recovery refuses invalid employee ID and already assigned tasks',()=>{
 const project=syncTrackerTeam(original(),roster);
 assert.throws(()=>reassignUnlinkedTrackerTask(project,'lead-task','m0'),/current Assignment person/);
 assert.throws(()=>reassignUnlinkedTrackerTask(project,'unknown',project.trackerMembers[0].id),/Task not found/);
 assert.throws(()=>reassignUnlinkedTrackerTask(project,'ronny-task',project.trackerMembers[0].id),/already belongs/);
 assert.deepEqual(project.tasks.map(task=>task.memberId),['m0','m2','m5']);
});

test('Manual row ordering remains compatible, without any synthetic Team Lead',()=>{
 const base=syncTrackerTeam(original(),roster);
 const reordered=reorderTrackerMember(base,base.trackerMembers[4].id,base.trackerMembers[0].id,'before');
 assert.equal(reordered.trackerMembers[0].id,base.trackerMembers[4].id);
 assert.equal(syncTrackerTeam(reordered,roster),reordered);
 assert.strictEqual(reordered.tasks,base.tasks);
});

test('The Tracker matrix and person filter render only the Assignment-projected members',()=>{
 assert.match(app,/members:synchronized\.trackerMembers/);
 assert.match(app,/syncTrackerTeam\(displayProject,assignmentRoster\)/);
 assert.match(ui,/const people=project\.members\.filter/);
 assert.match(ui,/\{project\.members\.map\(\(m:any\)=>\<option/);
 assert.doesNotMatch(ui,/const unassignedPerson=/);
 assert.doesNotMatch(ui,/hasOrphans\?\[unassignedPerson\]/);
 assert.doesNotMatch(ui,/selected\.id===UNASSIGNED_MEMBER_ID\?/);
 assert.doesNotMatch(ui,/\|\|'Team Lead'/);
 assert.match(ui,/\{people\.length\} people/);
});

test('Counts and rows exclude historic owners who are not in Assignment',()=>{
 assert.match(ui,/const linkedTasks=tasks\.filter/);
 assert.match(ui,/const at=\(id:string,w:number\)=>linkedTasks\.filter/);
 assert.match(ui,/const currentWeekTasks=linkedTasks\.filter/);
 assert.match(ui,/const visibleRangeTasks=linkedTasks\.filter/);
 assert.match(ui,/const closestScheduledWeek=linkedTasks\.length/);
 assert.match(ui,/const selectedPerson=people\.find/);
});

test('Only admins see recovery button and all recovery dropdown options come from Assignment',()=>{
 assert.match(ui,/isAdmin&&unlinkedTasks\.length>0&&<button/);
 assert.match(ui,/Tasks to reassign \(\{unlinkedTasks\.length\}\)/);
 assert.match(ui,/showUnlinkedTasks&&createPortal/);
 assert.match(ui,/unlinkedTasks\.map/);
 assert.match(ui,/onQuickTaskReassign\(taskId,personId\)/);
 assert.match(ui,/project\.members\.map\(\(member:any\)=><option/);
 assert.match(app,/reassignUnlinkedTrackerTask\(syncTrackerTeam\(prev,assignmentRosterRef\.current\),taskId,personId\)/);
 assert.match(css,/\.nb93-unlinked-dialog/);
});
