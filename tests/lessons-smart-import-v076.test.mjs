import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseExcelLessonFlexible} from '../src/lessons-smart-import.mjs';

const mobileTitle='Mobile ACP';
const issue='DESCRIPTION\nMobile ACP - certain things still under development\n\nAPPLICATION\nMobile ACP\n\nAREA / VENUE\n\nCATEGORY\n\nAUTHOR\nSachin';
const details='A couple of things I want to highlight\n-Generic Visitors not registering movements with Mobile ACP\n-Disabled Cards work on Mobile ACP\n-No Sound with Hard Messages\n-Messages are not working in Internal Gate\n- MACP Photo not syncing with Fidelio\nThank you!';

test('Mobile ACP: three-column Excel template without a Resolved By column',()=>{
 const pasted=`${mobileTitle}\t"${issue}"\t"${details}"`;
 const {lesson,warnings}=parseExcelLessonFlexible({text:pasted});
 assert.equal(lesson.lessonLearned,mobileTitle);
 assert.equal(lesson.issueProfile,issue);
 assert.equal(lesson.detailsCorrectiveAction,details);
 assert.equal(lesson.resolvedBy,'');
 assert.match(warnings.join(' '),/Three columns/);
});

test('five columns with a non-owner fragment are joined without losing content',()=>{
 const pasted=`Mobile ACP\t${issue.replaceAll('\n',' ')}\tMain detail\tExtra details\tThank you!`;
 const {lesson,warnings}=parseExcelLessonFlexible({text:pasted});
 assert.equal(lesson.lessonLearned,mobileTitle);
 assert.equal(lesson.resolvedBy,'');
 assert.equal(lesson.detailsCorrectiveAction,'Main detail\nExtra details\nThank you!');
 assert.match(warnings.join(' '),/5 columns/);
});

test('five columns with explicit owner preserve a Resolved By value',()=>{
 const {lesson}=parseExcelLessonFlexible({text:'AMOS Servers\tDescription: Wrong timezone\tComments: Replication\tCorrective action: Fix servers\tShipboard IT'});
 assert.equal(lesson.lessonLearned,'AMOS Servers');
 assert.equal(lesson.detailsCorrectiveAction,'Comments: Replication\nCorrective action: Fix servers');
 assert.equal(lesson.resolvedBy,'Shipboard IT');
});

test('four-column Excel clipboard format remains supported',()=>{
 const {lesson,warnings}=parseExcelLessonFlexible({text:'AMOS\tDescription: Broken\tCorrective Action: Fixed\tProduct Team'});
 assert.deepEqual(lesson,{lessonLearned:'AMOS',issueProfile:'Description: Broken',detailsCorrectiveAction:'Corrective Action: Fixed',resolvedBy:'Product Team'});
 assert.equal(warnings.length,0);
});

test('strips top title/header rows from a three-column Excel selection',()=>{
 const pasted='LESSONS LEARNED - PREVIOUS PROJECT - LEGEND OF THE SEAS\nLesson Learned\tIssue Profile\tDetails / Corrective Action\nMobile ACP\tDESCRIPTION: Access issue\tCorrective Action: Contact vendor';
 const {lesson}=parseExcelLessonFlexible({text:pasted});
 assert.equal(lesson.lessonLearned,'Mobile ACP');
 assert.match(lesson.detailsCorrectiveAction,/Contact vendor/);
});

test('one narrative cell is safely kept as details, title is not invented',()=>{
 const {lesson,warnings}=parseExcelLessonFlexible({text:details});
 assert.equal(lesson.lessonLearned,'');
 assert.ok(lesson.detailsCorrectiveAction.includes('Generic Visitors'));
 assert.match(warnings.join(' '),/title/i);
});

test('explicitly labeled blocks are recognized even without Excel tabs',()=>{
 const pasted='Lesson Learned: Mobile ACP\nIssue Profile: DESCRIPTION: App not ready\nDetails / Corrective Action: COMMENTS: Still in development\nResolved By: Security Team';
 const {lesson}=parseExcelLessonFlexible({text:pasted});
 assert.equal(lesson.lessonLearned,'Mobile ACP');
 assert.equal(lesson.issueProfile,'DESCRIPTION: App not ready');
 assert.equal(lesson.detailsCorrectiveAction,'COMMENTS: Still in development');
 assert.equal(lesson.resolvedBy,'Security Team');
});

test('a trailing missing column is tolerated, preserving blank title for review',()=>{
 const {lesson}=parseExcelLessonFlexible({text:'\tDESCRIPTION: App not ready\tCOMMENTS: Investigating'});
 assert.equal(lesson.lessonLearned,'');
 assert.equal(lesson.issueProfile,'DESCRIPTION: App not ready');
 assert.equal(lesson.detailsCorrectiveAction,'COMMENTS: Investigating');
});

test('multiple separate lesson rows cannot be silently merged',()=>{
 assert.throws(()=>parseExcelLessonFlexible({text:'AMOS\tDescription: X\tAction: Y\nOther App\tDescription: A\tAction: B'}),/Multiple lessons/);
});

test('HTML clipboard three-column row is preferred over flattened TSV',()=>{
 const txt=t=>({nodeType:3,nodeValue:t});
 const br={nodeType:1,tagName:'BR',childNodes:[]};
 const td=(...children)=>({nodeType:1,tagName:'TD',childNodes:children});
 const row={children:[td(txt('Mobile ACP')),td(txt('DESCRIPTION'),br,txt('Problems to solve')),td(txt('A couple of things...'))]};
 class Parser{parseFromString(){return {querySelector(){return {querySelectorAll(){return [row];}};}};}}
 const {lesson,source}=parseExcelLessonFlexible({html:'<table></table>',text:'bad\tgarbled\tclipboard\ttext\t5',Parser});
 assert.equal(source,'html');
 assert.equal(lesson.lessonLearned,'Mobile ACP');
 assert.equal(lesson.issueProfile,'DESCRIPTION\nProblems to solve');
 assert.equal(lesson.resolvedBy,'');
});

test('clipboard preview is editable before save, without changing old lessons',()=>{
 const src=readFileSync(new URL('../src/lessons-learned-section.tsx',import.meta.url),'utf8');
 const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
 assert.match(src,/parseExcelLessonFlexible/);
 assert.match(src,/updateParsedField/);
 assert.match(src,/lastClipboard/);
 assert.match(src,/!parsed\.lessonLearned\?\.trim\(\)/);
 assert.match(src,/Review detected fields/);
 assert.match(src,/onImportSave\(record\)/);
 assert.match(app,/nbdt-lessons-v076\.css/);
});

test('fragmented Excel cells can still distinguish profile text from comments',()=>{
 const {lesson}=parseExcelLessonFlexible({text:'Mobile ACP\tDESCRIPTION\tMobile ACP under development\tCOMMENTS\tVisitors are not registering movements'});
 assert.equal(lesson.lessonLearned,'Mobile ACP');
 assert.equal(lesson.issueProfile,'DESCRIPTION\nMobile ACP under development');
 assert.equal(lesson.detailsCorrectiveAction,'COMMENTS\nVisitors are not registering movements');
});
