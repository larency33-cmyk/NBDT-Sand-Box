import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getLessonReview, setLessonReview, lessonReviewCounts} from '../src/lesson-review.mjs';
const src=readFileSync(new URL('../src/lessons-learned-section.tsx',import.meta.url),'utf8');
const guide=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-lessons-v079.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');

const sample={id:'l-a',vessel:'Legend of the Seas',lessonLearned:'AMOS Servers',issueProfile:'Description: Wrong time zone',detailsCorrectiveAction:'Corrective Action: Change timezone',resolvedBy:'Shipboard IT'};

test('v0.6.79 overrides v0.6.78 styles while retaining the orange Lessons Learned frame',()=>{
  assert.ok(app.indexOf("import './nbdt-lessons-v078.css';")<app.indexOf("import './nbdt-lessons-v079.css';"));
  assert.match(css,/\.nb41-guide-page \.nb79-lessons\{[\s\S]*?border-left:5px solid #ff730f/);
  assert.match(css,/\.nb41-guide-page \.nb79-ship-header\{[\s\S]*?background:linear-gradient/);
  assert.match(css,/\.nb41-guide-page \.nb79-lesson-table\{[\s\S]*?min-width:1000px/);
});

test('five actual columns, matching source table plus Current Ship Review, with dedicated width',()=>{
  for(const name of ['Lesson Learned','Issue Profile','Details / Corrective Action','Resolved By','Current Ship Review'])assert.ok(src.includes(name));
  assert.match(src,/nb78-lesson-table nb79-lesson-table/);
  assert.match(src,/nb78-review-col/);
  for(const width of ['15%','19%','33%','10%','23%'])assert.ok(css.includes('width:'+width),width);
  assert.match(src,/nb79-ship-header/);
});

test('three screenshot-matched pills, large checkbox and editable interaction for admin',()=>{
  assert.match(src,/className="nb78-confirm-checkbox" type="checkbox"/);
  assert.match(src,/onChange=\{e=>startReview\(e\.target\.checked\?'confirmed':'pending'\)\}/);
  assert.match(src,/onClick=\{\(\)=>startReview\(\)\}/);
  for(const state of ['pending','in-progress','confirmed'])assert.match(css,new RegExp('\\.nb78-review-status--'+state));
  assert.match(css,/width:23px;height:23px/);
  assert.match(src,/Not yet reviewed for this ship\./);
  assert.match(src,/Save review/);
  assert.match(src,/onReviewSave\(lesson\.id,\{status:reviewStatus,reviewedBy,note:reviewNote\}\)/);
});

test('header displays review counts in mockup order, without interfering with project-specific saved values',()=>{
  assert.match(guide,/nb78-review-summary nb79-review-summary/);
  assert.match(guide,/nb79-review-summary-dot/);
  const summary=guide.match(/<span className="nb78-review-summary nb79-review-summary"[^>]*>(.*?)<\/span>\}/);
  assert.ok(summary,'review summary exists');
  assert.ok(summary[1].indexOf('confirmed')<summary[1].indexOf('.pending') && summary[1].indexOf('.pending')<summary[1].indexOf("['in-progress']"));
  const progress=setLessonReview({...sample,id:'l-b'},'current',{status:'in-progress',reviewedBy:'IT',note:'Testing'});
  const complete=setLessonReview({...sample,id:'l-c'},'current',{status:'confirmed',reviewedBy:'Jody',note:'Verified'});
  assert.deepEqual(lessonReviewCounts([sample,progress,complete],'current'),{pending:1,'in-progress':1,confirmed:1});
  assert.deepEqual(lessonReviewCounts([sample,progress,complete],'other'),{pending:3,'in-progress':0,confirmed:0});
  assert.equal(getLessonReview(complete,'current').reviewedBy,'Jody');
});

test('responsive styling preserves summary and horizontally scrollable source table',()=>{
  assert.match(css,/max-width:750px[\s\S]*?display:inline-flex !important/);
  assert.match(css,/\.nb41-guide-page \.nb79-lessons \.nb74-lessons-body/);
  assert.match(css,/\.nb41-guide-page \.nb79-lesson-table \.nb78-review-meta/);
});
