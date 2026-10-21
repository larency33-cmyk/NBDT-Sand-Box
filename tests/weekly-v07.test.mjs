import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const component=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../redesign.css',import.meta.url),'utf8');
const start=component.indexOf('export function Tracker(');
const end=component.indexOf('export function ', start+20);
const w=component.slice(start,end);
function has(...parts){for(const part of parts)assert.ok(w.includes(part),`Missing: ${part}`)}
test('v0.7 empty 4-week period offers truthful context and optional full matrix',()=>{
 has("const emptyWindow=view==='Overview'&&rangeTasks.length===0",'No assignments in this 4-week period','Show all people','Hide empty team matrix','nb-tracker-content-empty');
 assert.ok(styles.includes('.nb-tracker-content-empty{display:none!important}'));
});
test('v0.7 nearest scheduled work is calculated from filtered real tasks',()=>{
 has('const visibleTasks=tasks.filter(matches);','const closestScheduledWeek=visibleTasks.length?','View scheduled assignments →','setWeek(closestScheduledWeek)');
 assert.ok(!w.includes('if (!tasks.length) demoTasks'));
});
test('v0.7 summary distinguishes all four visible weeks from selected week',()=>{
 has('const rangeTasks=visibleTasks.filter','const singleWeekTasks=rangeTasks.filter','const scopeTasks=view===\'Overview\'?rangeTasks','{scopeTasks.length} unique tasks','{singleWeekTasks.length} in {selectedIsoWeek}','statusCounts');
});
test('v0.7 compact rows and separate add-assignment control do not nest buttons',()=>{
 has('nb-no-assignments','nb-week-cell-holder','className="nb-week-add"','openAssignments(m.id,w,true)','onClick={()=>openAssignments(m.id,w)}');
 assert.ok(styles.includes('height:62px!important'));
 assert.ok(styles.includes('.nb-week-cell-holder:hover .nb-week-add'));
});
test('v0.7 assignment editor preserves existing task re-use rather than cloning silently',()=>{
 has('open={assignmentPicker}','Choose existing task to help','helperIds:[...(task.helperIds||[]),selected.id]','Create new task');
});
test('v0.7 weekly preview displays task labels, status colors, helper role and keyboard access',()=>{
 has('title={t.label}','nb-status-text','nb-helper-tag','aria-label={`${m.name}: ${list.length} assignments');
 for(const x of ['nb-status-in-progress','nb-status-completed','nb-status-blocked','nb-status-planned','focus-visible','@media(hover:none)']) assert.ok(styles.includes(x),x);
});
test('v0.7 footer shows eleven ISO weeks with four-week range highlighted',()=>{
 has('Array.from({length:11}','nb-week-in-range','aria-label="Previous 4 weeks"','aria-label="Next 4 weeks"','isoWeek(d.toISOString().slice(0,10))');
});
test('v0.7 tracker does not have artificial full-page scale or fixed-height table',()=>{
 const endCss=styles.slice(styles.indexOf('/* NBDT v0.7'));
 assert.ok(endCss.includes('max-height:none!important'));
 assert.ok(!endCss.includes('transform:scale('));
});
