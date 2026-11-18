import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getLessonReview,setLessonReview,lessonReviewCounts,LESSON_REVIEW_LABELS} from '../src/lesson-review.mjs';
import {normalizeLesson,serializeLessons,groupLessons} from '../src/lessons-learned.mjs';
const guide=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const section=readFileSync(new URL('../src/lessons-learned-section.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-lessons-v078.css',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const example={id:'lesson-amos',vessel:'Legend of the Seas',lessonLearned:'AMOS Servers',issueProfile:'Description: Time zone mismatch',detailsCorrectiveAction:'Corrective action: Fix time zone',resolvedBy:'Shipboard IT',text:'AMOS Servers'};

test('historical lessons, including legacy checked flag, start Pending for the current ship',()=>{
 const old={...example,checked:true};
 assert.equal(getLessonReview(old,'legend-ots').status,'pending');
 assert.equal(getLessonReview(old,'legend-ots').reviewedBy,'');
 assert.equal(LESSON_REVIEW_LABELS.pending,'Pending review');
});
test('in progress review saves project identity, reviewer, note and timestamp without changing historical data',()=>{
 const changed=setLessonReview(example,'legend-ots',{status:'in-progress',reviewedBy:'Shipboard IT',note:'Waiting for final tests'},'2026-11-18T12:00:00.000Z');
 assert.equal(changed.currentShipReview.status,'in-progress');
 assert.equal(changed.currentShipReview.projectId,'legend-ots');
 assert.equal(changed.currentShipReview.reviewedBy,'Shipboard IT');
 assert.equal(changed.currentShipReview.note,'Waiting for final tests');
 assert.equal(changed.currentShipReview.confirmedAt,'');
 assert.equal(changed.currentShipReview.updatedAt,'2026-11-18T12:00:00.000Z');
 assert.equal(changed.issueProfile,example.issueProfile);
 assert.equal(changed.detailsCorrectiveAction,example.detailsCorrectiveAction);
 assert.equal(changed.resolvedBy,example.resolvedBy);
 assert.equal(example.currentShipReview,undefined);
});
test('confirmation requires a reviewer; status and audit dates update; reopening removes confirmation',()=>{
 assert.throws(()=>setLessonReview(example,'legend-ots',{status:'confirmed',reviewedBy:'   ',note:''}),/Enter who reviewed/);
 assert.throws(()=>setLessonReview(example,'legend-ots',{status:'in-progress',reviewedBy:'',note:''}),/Enter who reviewed/);
 const saved=setLessonReview(example,'legend-ots',{status:'confirmed',reviewedBy:'Apple',note:'Validated on current ship'},'2026-11-18T13:15:00.000Z');
 assert.equal(saved.currentShipReview.confirmedAt,'2026-11-18T13:15:00.000Z');
 assert.equal(saved.currentShipReview.status,'confirmed');
 const unchanged=setLessonReview(saved,'legend-ots',{status:'confirmed',reviewedBy:'Apple',note:'Validated on current ship'},'2026-11-19T13:15:00.000Z');
 assert.strictEqual(unchanged,saved);
 const corrected=setLessonReview(saved,'legend-ots',{status:'confirmed',reviewedBy:'Apple',note:'Checklist attached'},'2026-11-19T13:15:00.000Z');
 assert.equal(corrected.currentShipReview.confirmedAt,'2026-11-18T13:15:00.000Z');
 assert.equal(corrected.currentShipReview.updatedAt,'2026-11-19T13:15:00.000Z');
 const reopened=setLessonReview(corrected,'legend-ots',{status:'in-progress',reviewedBy:'Apple',note:'Rechecking deployment'},'2026-11-20T13:15:00.000Z');
 assert.equal(reopened.currentShipReview.confirmedAt,'');
 assert.equal(reopened.currentShipReview.status,'in-progress');
 const pending=setLessonReview(reopened,'legend-ots',{status:'pending',reviewedBy:'',note:''},'2026-11-21T13:15:00.000Z');
 assert.equal(pending.currentShipReview.status,'pending');
});
test('current-ship confirmation never transfers to another project copy',()=>{
 const confirmed=setLessonReview(example,'legend-ots',{status:'confirmed',reviewedBy:'Jody',note:'OK'},'2026-11-18T14:00:00.000Z');
 assert.equal(getLessonReview(confirmed,'legend-ots').status,'confirmed');
 assert.equal(getLessonReview(confirmed,'star-ots').status,'pending');
 assert.equal(getLessonReview(confirmed,'star-ots').reviewedBy,'');
 assert.throws(()=>setLessonReview(example,'',{status:'confirmed',reviewedBy:'Jody'}),/Project is required/);
 assert.throws(()=>setLessonReview(example,'legend-ots',{status:'completed',reviewedBy:'Jody'}),/valid review status/);
});
test('new project review is retained through existing NBDT serialisation, normalization and vessel grouping',()=>{
 const saved=setLessonReview(example,'legend-ots',{status:'confirmed',reviewedBy:'Apple',note:'Verified'},'2026-11-18T15:00:00.000Z');
 const persisted=serializeLessons([saved]);
 const restored=normalizeLesson(JSON.parse(JSON.stringify(persisted.lessonsLearnedItems))[0]);
 assert.equal(restored.currentShipReview.status,'confirmed');
 assert.equal(getLessonReview(restored,'legend-ots').reviewedBy,'Apple');
 assert.equal(groupLessons([restored])[0].vessel,'Legend of the Seas');
 assert.equal(restored.resolvedBy,'Shipboard IT');
 assert.equal(restored.text.includes('Corrective action'),true);
});
test('review counters distinguish pending, in progress, confirmed, and a newly copied project',()=>{
 const progress=setLessonReview({...example,id:'b'},'legend-ots',{status:'in-progress',reviewedBy:'Ship IT',note:''});
 const done=setLessonReview({...example,id:'c'},'legend-ots',{status:'confirmed',reviewedBy:'Apple',note:''});
 const items=[example,progress,done];
 assert.deepEqual(lessonReviewCounts(items,'legend-ots'),{'pending':1,'in-progress':1,'confirmed':1});
 assert.deepEqual(lessonReviewCounts(items,'star-ots'),{'pending':3,'in-progress':0,'confirmed':0});
});
test('Guide persists review via onUpdateSystem in the existing section and limits edits to admins',()=>{
 assert.match(guide,/const saveCurrentShipLessonReview=async\(id:string,values:any\)=>/);
 assert.match(guide,/if\(!isAdmin\|\|editingSection\|\|pending\.current\)return false/);
 assert.match(guide,/setLessonReview\(items\[idx\],project\.id,values\)/);
 assert.match(guide,/update\(\{\.\.\.sys,\.\.\.serializeLessons\(next\)\}\)/);
 assert.match(guide,/onReviewSave=\{saveCurrentShipLessonReview\}/);
 assert.match(guide,/canReview=\{isAdmin&&!editing\}/);
 assert.match(guide,/lessonReviewCounts/);
});
test('UI has a per-lesson checkbox and dedicated reviewed-by / note editor without altering old four columns',()=>{
 assert.match(section,/Current Ship Review/);
 assert.match(section,/className="nb78-confirm-checkbox" type="checkbox"/);
 assert.match(section,/Reviewed by/);
 assert.match(section,/Notes \(optional\)/);
 assert.match(section,/Save review/);
 assert.match(section,/onReviewSave\(lesson\.id,\{status:reviewStatus,reviewedBy,note:reviewNote\}\)/);
 assert.match(section,/COLUMNS\.map/);
 assert.match(section,/LESSON_REVIEW_LABELS/);
 assert.match(css,/\.nb78-review-status--confirmed/);
 assert.match(index,/import '\.\/nbdt-lessons-v078\.css';/);
});
