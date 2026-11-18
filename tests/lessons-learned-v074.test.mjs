import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeLesson,serializeLessons,groupLessons,splitExcelText,parseExcelLesson,sameLesson,extractExcelHtmlRows} from '../src/lessons-learned.mjs';

const guide=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const section=readFileSync(new URL('../src/lessons-learned-section.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-lessons-v074.css',import.meta.url),'utf8');

test('Excel TSV: four columns with embedded multiline issue and corrective action',()=>{
 const text='AMOS Servers\t"Description: Incorrect Time Zone\nApplication: AMOS\nAuthor: Tanesh"\t"COMMENTS: Time zone mismatch\nTRACKING: Via Email\nCORRECTIVE ACTION: Align the servers"\tShipboard IT\r\n';
 const lesson=parseExcelLesson({text});
 assert.equal(lesson.lessonLearned,'AMOS Servers');
 assert.equal(lesson.issueProfile,'Description: Incorrect Time Zone\nApplication: AMOS\nAuthor: Tanesh');
 assert.match(lesson.detailsCorrectiveAction,/CORRECTIVE ACTION: Align the servers/);
 assert.equal(lesson.resolvedBy,'Shipboard IT');
});
test('TSV supports quoted tabs, literal quotes and CRLF safely',()=>{
 const rows=splitExcelText('"Label\tprinter"\t"Description: Zebra ""ZD421"""\tNotes\tProduct Team\r\n');
 assert.equal(rows.length,1);
 assert.deepEqual(rows[0],['Label\tprinter','Description: Zebra "ZD421"','Notes','Product Team']);
});
test('copying header plus one lesson is supported',()=>{
 const row='Lesson Learned\tIssue Profile\tDetails / Corrective Action\tResolved By\nAMOS Servers\tIssue\tCorrection\tIT';
 assert.deepEqual(parseExcelLesson({text:row}),{lessonLearned:'AMOS Servers',issueProfile:'Issue',detailsCorrectiveAction:'Correction',resolvedBy:'IT'});
});
test('reject multiple lessons or a wrong column count',()=>{
 assert.throws(()=>parseExcelLesson({text:'A\tB\tC\tD\nE\tF\tG\tH'}),/only one lesson row/);
 assert.throws(()=>parseExcelLesson({text:'A\tB\tC'}),/four Excel columns/);
 assert.throws(()=>parseExcelLesson({text:'\tB\tC\tD'}),/must contain a title/);
});
test('html clipboard uses HTML table cells and retains break elements',()=>{
 const txt=text=>({nodeType:3,nodeValue:text});
 const br={nodeType:1,tagName:'BR',childNodes:[]};
 const td=(...children)=>({nodeType:1,tagName:'TD',childNodes:children});
 const row={children:[td(txt('AMOS Servers')),td(txt('Description: Incorrect Time Zone'),br,txt('Application: AMOS')),td(txt('COMMENTS: Incorrect OU')),td(txt('Shipboard IT'))]};
 class Parser {parseFromString(){return {querySelector(name){assert.equal(name,'table');return {querySelectorAll(tag){assert.equal(tag,'tr');return [row];}};}};}}
 const rows=extractExcelHtmlRows('<table>fake source</table>',Parser);
 assert.deepEqual(rows,[['AMOS Servers','Description: Incorrect Time Zone\nApplication: AMOS','COMMENTS: Incorrect OU','Shipboard IT']]);
 assert.equal(parseExcelLesson({html:'<table>fake</table>',text:'not tabular',Parser}).issueProfile,'Description: Incorrect Time Zone\nApplication: AMOS');
});
test('legacy lessons preserve full text and do not invent a vessel',()=>{
 const old={id:'x',text:'CrunchTime Account Deactivation\nUsers inactive after 90 days',checked:true};
 const normalized=normalizeLesson(old);
 assert.equal(normalized.vessel,'');assert.equal(normalized.lessonLearned,'CrunchTime Account Deactivation');
 assert.equal(normalized.detailsCorrectiveAction,'Users inactive after 90 days');
 assert.equal(groupLessons([old])[0].vessel,'Vessel not specified');
 assert.equal(serializeLessons([old]).lessonsLearnedItems[0].checked,true);
});
test('new lessons group by ship, round-trip all columns and can detect duplicates',()=>{
 const data=[{id:'a',vessel:'Legend of the Seas',lessonLearned:'AMOS',issueProfile:'App: AMOS',detailsCorrectiveAction:'Fix timezone',resolvedBy:'IT'},
  {id:'b',vessel:'Star of the Seas',lessonLearned:'CrunchTime',issueProfile:'Accounts',detailsCorrectiveAction:'Reset inactive accounts',resolvedBy:'Apple'},
  {id:'c',vessel:'Legend of the Seas',lessonLearned:'Label Ribbon',issueProfile:'Zebra',detailsCorrectiveAction:'Change label stock',resolvedBy:'Product Team'}];
 assert.deepEqual(groupLessons(data).map(g=>[g.vessel,g.lessons.length]),[['Legend of the Seas',2],['Star of the Seas',1]]);
 const saved=serializeLessons(data);
 assert.equal(saved.lessonsLearnedItems[1].detailsCorrectiveAction,'Reset inactive accounts');
 assert.ok(sameLesson(saved.lessonsLearnedItems[0],{...data[0],vessel:'LEGEND OF THE SEAS'}));
 assert.ok(!sameLesson(data[0],data[1]));
});
test('UI integrates with Guide pencil, four columns, import controls and save path',()=>{
 assert.match(guide,/LessonsLearnedBody/);
 assert.match(guide,/onImportSave=\{importLesson\}/);
 assert.match(guide,/serializeLessons\(lessonDraft\)/);
 assert.match(guide,/beginEdit\('lessons'\)/);
 assert.match(section,/Paste from Excel/);assert.match(section,/Save Lesson/);
 assert.match(section,/clipboardData\.getData\('text\/html'\)/);
 assert.match(section,/onDraftChange/);assert.match(section,/window\.confirm/);
 for(const title of ['Lesson Learned','Issue Profile','Details / Corrective Action','Resolved By'])assert.ok(section.includes(title));
 assert.match(index,/import '\.\/nbdt-lessons-v074\.css';/);
 assert.match(css,/\.nb74-ship-header/);
 assert.doesNotMatch(section,/Critical|Pending|Filter|Search\.\.\./);
});
