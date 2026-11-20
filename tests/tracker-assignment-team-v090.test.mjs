import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {syncTrackerTeam,reorderTrackerMember,isTrackerNotOnSite,setTrackerNotOnSite} from '../src/tracker-team.mjs';
import {initialAssignmentRoster} from '../src/assignment-roster.mjs';
import {quickCreateAssignment,quickEditTask} from '../src/tracker-actions.mjs';

const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-tracker-v090.css',import.meta.url),'utf8');
const roster=initialAssignmentRoster();
const legacy=()=>({
 id:'legend-ots',
 members:[{id:'m0',name:'TEAM LEAD',isTeamLead:true},{id:'m1',name:'HOMESH'},{id:'m2',name:'JORGE'},
  {id:'m3',name:'APPLE / NILSON'},{id:'m4',name:'ELVAN'},{id:'m5',name:'RONNY'},
  {id:'m6',name:'NISHANT'},{id:'m7',name:'NADEEM'},{id:'m8',name:'ROB'},
  {id:'m9',name:'DODY'},{id:'m10',name:'DARON'},{id:'m11',name:'CLAUDIO'}],
 tasks:[{id:'old-jorge',label:'Check DC04',memberId:'m2',startWeek:0,duration:1,status:'Planned',helperIds:[]},
  {id:'old-homesh',label:'Install Windows',memberId:'m1',startWeek:0,duration:1,status:'Planned',helperIds:[]}],
 issues:[{id:'issue-1',assigneeId:'m2'}],systems:[]});

test('Weekly Tracker shows Assignment 13 members plus Team Lead, no old duplicate roster names',()=>{
 const base=legacy(),next=syncTrackerTeam(base,roster);
 assert.equal(roster.people.length,13);
 assert.equal(next.trackerMembers.length,14);
 assert.deepEqual(next.trackerMembers.slice(1).map(x=>x.name),roster.people.map(x=>x.name));
 assert.equal(next.trackerMembers[0].name,'TEAM LEAD');
 assert.equal(new Set(next.trackerMembers.map(x=>x.name)).size,14);
 assert.equal(next.trackerMembers[1].position,'ITO');
 assert.equal(next.trackerMembers[1].startDate,'2027-01-30');
 assert.equal(next.trackerMembers[1].assignmentPersonId,roster.people[0].id);
});

test('Legacy tasks, issues and names in other views are not destroyed by synchronization',()=>{
 const base=legacy(),next=syncTrackerTeam(base,roster);
 assert.strictEqual(next.members,base.members,'Original global members untouched for Issues and other views');
 assert.strictEqual(next.tasks,base.tasks);
 assert.strictEqual(next.issues,base.issues);
 assert.equal(next.tasks[0].memberId,'m2');
 assert.equal(next.trackerLegacyOwnerNames.m2,'JORGE');
 assert.equal(next.trackerLegacyOwnerNames.m3,'APPLE / NILSON');
 assert.equal(next.trackerMembers.find(x=>x.name==='HOMESHWAR HALKORI').id,'m1');
 assert.equal(next.trackerMembers.some(x=>x.name==='JORGE'),false);
 assert.equal(syncTrackerTeam(next,roster),next);
});

test('Drag reorder moves entire employee rows and persists after Assignment sync',()=>{
 const first=syncTrackerTeam(legacy(),roster);
 const from=first.trackerMembers[4].id,target=first.trackerMembers[1].id;
 const reordered=reorderTrackerMember(first,from,target);
 assert.equal(reordered.trackerMembers[1].id,from);
 assert.equal(reordered.trackerMembers[2].id,target);
 assert.strictEqual(reordered.tasks,first.tasks);
 assert.strictEqual(reordered.members,first.members);
 assert.strictEqual(syncTrackerTeam(reordered,roster),reordered);
 assert.strictEqual(reorderTrackerMember(reordered,from,from),reordered);
});

test('Assignment changes update role, joining date, new employees without breaking custom order',()=>{
 const first=syncTrackerTeam(legacy(),roster);
 const moving=first.trackerMembers[5].id;
 const reordered=reorderTrackerMember(first,moving,first.trackerMembers[1].id);
 const modified={...roster,people:[...roster.people.map(p=>p.id===roster.people[0].id?{...p,position:'ITSS',startDate:'2027-02-04'}:p),
  {id:'assignment-person-new',name:'NEW TECH',position:'ITO',startDate:'2027-04-01'}]};
 const synced=syncTrackerTeam(reordered,modified);
 assert.equal(synced.trackerMembers.length,15);
 assert.equal(synced.trackerMembers[1].id,moving);
 assert.equal(synced.trackerMembers.find(m=>m.assignmentPersonId===roster.people[0].id).position,'ITSS');
 assert.equal(synced.trackerMembers.find(m=>m.assignmentPersonId===roster.people[0].id).startDate,'2027-02-04');
 assert.equal(synced.trackerMembers.find(m=>m.name==='NEW TECH').startDate,'2027-04-01');
 assert.strictEqual(synced.tasks,reordered.tasks);
});

test('Not on site is per employee per week; it never modifies task records',()=>{
 const first=syncTrackerTeam(legacy(),roster),id=first.trackerMembers[2].id;
 const week5=setTrackerNotOnSite(first,id,5,true);
 assert.equal(isTrackerNotOnSite(week5,id,5),true);
 assert.equal(isTrackerNotOnSite(week5,id,4),false);
 assert.equal(isTrackerNotOnSite(week5,first.trackerMembers[1].id,5),false);
 assert.strictEqual(week5.tasks,first.tasks);
 assert.strictEqual(week5.members,first.members);
 assert.equal(setTrackerNotOnSite(week5,id,5,true),week5);
 const cleared=setTrackerNotOnSite(week5,id,5,false);
 assert.equal(isTrackerNotOnSite(cleared,id,5),false);
 assert.equal(isTrackerNotOnSite(week5,id,5),true);
 assert.throws(()=>setTrackerNotOnSite(first,'absent-person',4,true),/valid team member/);
 assert.throws(()=>setTrackerNotOnSite(first,id,520,true),/valid project week/);
});

test('New synced team member can receive tasks while original legacy projects remain intact',()=>{
 const first=syncTrackerTeam(legacy(),roster);
 const newMember=first.trackerMembers.find(m=>m.assignmentPersonId===roster.people[2].id);
 const inserted=quickCreateAssignment(first,{label:'Setup POS',memberId:newMember.id,startWeek:8},'new-task');
 assert.equal(inserted.tasks.at(-1).memberId,newMember.id);
 assert.equal(inserted.tasks.at(-1).status,'Planned');
 const edited=quickEditTask(first,'old-jorge',{label:'Check DC04 again'});
 assert.equal(edited.tasks[0].memberId,'m2','Legacy orphan title may be edited before reassignment');
 const reassign=quickEditTask(first,'old-jorge',{memberId:newMember.id});
 assert.equal(reassign.tasks[0].memberId,newMember.id);
});

test('Tracker UI has drag entry on name cell, week-specific styling, role and date',()=>{
 assert.match(ui,/draggable=\{movable\}/);
 assert.match(ui,/onDragStart=\{event=>/);
 assert.match(ui,/onDrop=\{event=>/);
 assert.match(ui,/onMemberReorder\(sourceId,targetId,placement\)/);
 assert.match(ui,/GripVertical/);
 assert.match(ui,/ArrowUp','ArrowDown/);
 assert.match(ui,/m\.position\|\|m\.title/);
 assert.match(ui,/Joined \{m\.startDate\}/);
 assert.match(ui,/isTrackerNotOnSite\(project,m\.id,w\)/);
 assert.match(ui,/nb90-not-on-site-content/);
 assert.match(ui,/Not on site/);
 assert.match(css,/\.nb90-offsite-week/);
 assert.match(css,/\.nb90-drop-target/);
});

test('Not on site toggle is admin-only, backed by project storage and reversible',()=>{
 assert.match(ui,/\{isAdmin&&<button type="button" disabled=\{presenceBusy\}/);
 assert.match(ui,/onWeekPresenceToggle\(memberId,w,next\)/);
 assert.match(ui,/Remove Not on site/);
 assert.match(ui,/Mark Not on site/);
 assert.match(app,/setTrackerNotOnSite\(syncTrackerTeam\(prev,assignmentRosterRef\.current\),personId,weekNumber,notOnSite\)/);
 assert.match(app,/if\(!isAdmin\)throw Error\('Admin sign-in required to change on-site presence\.'\)/);
 assert.match(app,/project=\{trackerProject\}/);
 assert.match(app,/members:synchronized\.trackerMembers/);
});

test('Weekly Tracker no longer exposes local rename/create/delete staff buttons',()=>{
 const matrix=ui.slice(ui.indexOf('<tbody>'),ui.indexOf('</tbody>',ui.indexOf('<tbody>')));
 assert.doesNotMatch(matrix,/Rename \$\{m\.name\}|Add team member|Remove \$\{m\.name\}/);
 assert.match(app,/assignmentRoster/);
 assert.match(app,/syncTrackerTeam\(prev,assignmentRosterRef\.current\)/);
});
