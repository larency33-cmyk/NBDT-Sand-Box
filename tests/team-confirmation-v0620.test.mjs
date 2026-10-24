import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {removeMember} from '../src/members.mjs';
const base=new URL('../',import.meta.url);
const source=readFileSync(new URL('src/workspace.tsx',base),'utf8');
const css=readFileSync(new URL('weekly-tracker-approved-v016.css',base),'utf8');
const tracker=source.slice(source.indexOf('export function Tracker('),source.indexOf('export function Report('));
test('clicking trash does not mutate project before explicit modal confirmation',()=>{
 const open=tracker.slice(tracker.indexOf('const deleteMember='),tracker.indexOf('const memberPendingDeletion='));
 assert.match(open,/setMemberToDelete\(m.id\)/);
 assert.doesNotMatch(open,/onMemberDelete\(/);
 assert.match(tracker,/role="alertdialog" aria-modal="true"/);
 assert.match(tracker,/memberDialogRef/);
 assert.match(tracker,/Cancel — keep employee/);
 assert.match(tracker,/Yes, permanently delete/);
 assert.match(tracker,/onMemberDelete\(id\)/);
 assert.match(tracker,/event.key==='Escape'/);
 assert.match(tracker,/event.key==='Tab'/);
});
test('employee buttons are in their own row under names, not next to them',()=>{
 const row=tracker.slice(tracker.indexOf('<div className="nb-person-cell">'),tracker.indexOf('{weeks.map(w=>{',tracker.indexOf('<div className="nb-person-cell">')));
 assert.match(row,/className="nb-person-meta"/);
 assert.match(row,/className="nb-person-copy"/);
 assert.match(row,/className="nb-member-actions"/);
 assert.ok(row.indexOf('nb-person-copy')<row.indexOf('nb-member-actions'));
 assert.match(css,/\.nb-person-meta \{[^}]*flex-direction:column!important/s);
 assert.match(css,/\.nb-person-meta \.nb-member-actions \{[^}]*margin:0!important/s);
});
test('header color reaches bottom edge; no fade tail or pseudo-element',()=>{
 const block=css.slice(css.indexOf('/* v0.6.20 — solid week headers'));
 assert.match(block,/background:#e3efff!important/);
 assert.match(block,/background:#dcecff!important/);
 assert.match(block,/\.nb-week-head::after \{content:none!important;display:none!important\}/);
 assert.doesNotMatch(block,/rgba\(227,239,255,0\)/);
});
test('deleting an employee removes only their owned-task history, without deleting other employees tasks',()=>{
 const project={members:[{id:'a',name:'A'},{id:'b',name:'B'}],tasks:[
  {id:'mine',memberId:'a',helperIds:['b'],startWeek:0,duration:8},
  {id:'theirs',memberId:'b',helperIds:['a'],startWeek:1},
  {id:'milestone',memberId:'milestones',isMilestone:true,startWeek:2}
 ],systems:[{id:'s1',assigneeId:'a'}]};
 const actual=removeMember(project,'a');
 assert.deepEqual(actual.tasks.map(t=>t.id),['theirs','milestone']);
 assert.deepEqual(actual.tasks[0].helperIds,[]);
 assert.equal(actual.systems[0].assigneeId,'');
 assert.equal(project.tasks.length,3);
 assert.equal(project.members.length,2);
});
