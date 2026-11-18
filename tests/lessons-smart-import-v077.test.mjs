import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseExcelLessonFlexible} from '../src/lessons-smart-import.mjs';

const mobileIssue='DESCRIPTION\nMobile ACP - certain things still under development\n\nAPPLICATION\nMobile ACP\n\nAREA / VENUE\n\nCATEGORY\n\nAUTHOR\nSachin';
const mobileDetails=`A couple of things I want to highlight so that your team knows that there are certain things still under development:
-Generic Visitors not registering movements with Mobile ACP
If Mobile ACP is not recognizing Generic Visitor movements, this issue needs to be taken up with IT to proceed with manual insertion of RFID serial numbers into RFID_ID table.
-Disabled Cards work on Mobile ACP
When card is disabled within OHC Security Module, Mobile ACP still reads the card.
-MACP Photo not syncing with Fidelio
If you fail to see a photo taken with MACP in Fidelio, please navigate to “More Info” tab (in Management/Crew Modules).
-Swipe “No” in Gangway Logs
When tapping card on MACP, the gangway logs still show Swipe as “No”. This is being worked on by the vendor.
If there are any other problems you encounter or have suggestions towards operational improvements, don't hesitate to reach out to @RCL Security Managers.

Thank you!
Anastasiya Ryklina
Marine Business Analyst`;

test('mobile ACP five physical columns with blank spacer columns map into 3 logical columns',()=>{
 const text=['Mobile ACP','','"'+mobileIssue.replaceAll('"','""')+'"','', '"'+mobileDetails.replaceAll('"','""')+'"'].join('\t');
 const {lesson}=parseExcelLessonFlexible({text});
 assert.equal(lesson.lessonLearned,'Mobile ACP');
 assert.equal(lesson.issueProfile,mobileIssue);
 assert.equal(lesson.detailsCorrectiveAction,mobileDetails);
 assert.equal(lesson.resolvedBy,'');
});

test('mobile ACP five actual content pieces are merged semantically and retain signature',()=>{
 const text=['Mobile ACP','DESCRIPTION','Mobile ACP - certain things still under development','APPLICATION\nMobile ACP\nAUTHOR\nSachin',mobileDetails].map(x=>'"'+x.replaceAll('"','""')+'"').join('\t');
 const {lesson,warnings}=parseExcelLessonFlexible({text});
 assert.equal(lesson.lessonLearned,'Mobile ACP');
 assert.match(lesson.issueProfile,/DESCRIPTION\nMobile ACP/);
 assert.match(lesson.issueProfile,/AUTHOR\nSachin/);
 assert.equal(lesson.detailsCorrectiveAction,mobileDetails);
 assert.equal(lesson.resolvedBy,'');
 assert.match(warnings.join(' '),/5 columns/);
});

test('standalone narrative pasted without title is preserved for editable Preview',()=>{
 const {lesson}=parseExcelLessonFlexible({text:mobileDetails});
 assert.equal(lesson.lessonLearned,'');
 assert.match(lesson.detailsCorrectiveAction,/Anastasiya Ryklina/);
 assert.match(lesson.detailsCorrectiveAction,/Marine Business Analyst/);
 assert.match(lesson.detailsCorrectiveAction,/Swipe “No”/);
});

test('four cells with split long Details never mistake continuation for resolved-by',()=>{
 const text=['Mobile ACP',mobileIssue,'Details start',mobileDetails].map(v=>'"'+v.replaceAll('"','""')+'"').join('\t');
 const {lesson,warnings}=parseExcelLessonFlexible({text});
 assert.equal(lesson.resolvedBy,'');
 assert.match(lesson.detailsCorrectiveAction,/Details start/);
 assert.match(lesson.detailsCorrectiveAction,/Marine Business Analyst/);
 assert.match(warnings.join(' '),/continued details/);
});

test('a five-column copied row still accepts real Resolved By owner',()=>{
 const text='AMOS Servers\tDescription: Incorrect OU\tCOMMENTS: Server mismatch\tCORRECTIVE ACTION: Fix timezone\tShipboard IT';
 const {lesson}=parseExcelLessonFlexible({text});
 assert.equal(lesson.lessonLearned,'AMOS Servers');
 assert.equal(lesson.resolvedBy,'Shipboard IT');
 assert.match(lesson.detailsCorrectiveAction,/Fix timezone/);
});

test('three-column pasted Excel HTML with extra empty spacer columns is interpreted',()=>{
 const txt=t=>({nodeType:3,nodeValue:t});
 const td=s=>({nodeType:1,tagName:'TD',childNodes:s?[txt(s)]:[]});
 const row={children:[td('Mobile ACP'),td(''),td(mobileIssue),td(''),td(mobileDetails)]};
 class Parser{parseFromString(){return {querySelector(){return {querySelectorAll(){return [row];}};}};}}
 const {lesson,source}=parseExcelLessonFlexible({html:'<table/>',text:'unstructured',Parser});
 assert.equal(source,'html');
 assert.equal(lesson.lessonLearned,'Mobile ACP');
 assert.equal(lesson.issueProfile,mobileIssue);
 assert.equal(lesson.detailsCorrectiveAction,mobileDetails);
});

test('new UI presents an editable rescue Preview and visible importer version',()=>{
 const ui=readFileSync(new URL('../src/lessons-learned-section.tsx',import.meta.url),'utf8');
 const index=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
 assert.match(ui,/v0\.6\.77/);
 assert.match(ui,/Automatic field mapping was uncertain/);
 assert.match(ui,/setParsed\(\{lessonLearned:'',issueProfile:'',detailsCorrectiveAction:pastedText,resolvedBy:''\}\)/);
 assert.match(ui,/Review detected fields/);
 assert.match(index,/nbdt-lessons-v077\.css/);
});
