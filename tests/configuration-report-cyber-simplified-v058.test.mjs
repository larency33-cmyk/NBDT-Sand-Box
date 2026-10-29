import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeCyberStatus,CYBER_STATUSES} from '../src/cyber-status.mjs';
import {prepareReportMetadataImport} from '../src/report-import.mjs';
import {reportCounts} from '../src/reference-report.mjs';
import {counts} from '../src/model.mjs';
const workspace=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const report=workspace.slice(workspace.indexOf('export function Report('),workspace.indexOf('export function Overview('));
const exportSource=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');

test('Not Started replaces Unknown in every user-facing Cyber action',()=>{
 assert.deepEqual(CYBER_STATUSES,['Not Started','Review','Approved','Blocked','N/A']);
 assert.equal(normalizeCyberStatus('Unknown'),'Not Started');
 assert.equal(normalizeCyberStatus(undefined),'Not Started');
 assert.equal(normalizeCyberStatus('Approved'),'Approved');
 assert.match(report,/CYBER_STATUSES\.map\(v=>/);
 assert.match(report,/normalizeCyberStatus\(s\.cyberStatus\)/);
 assert.match(exportSource,/Cyber: normalizeCyberStatus\(system\.cyberStatus\)/);
 assert.doesNotMatch(report,/\['Unknown'/);
});

test('Cyber status no longer requests a reason or justification to save',()=>{
 assert.match(report,/onChange=\{e=>changeField\('cyberStatus',e\.target\.value\)\}/);
 assert.match(report,/cyberHistory:cyberChanged/);
 assert.doesNotMatch(report,/cyberReason|setCyberReason|Cyber change reason|Reason \/ evidence|Provide a reason/);
 assert.doesNotMatch(report,/required[^>]*Cyber status/);
});

test('Legacy Unknown and new Not Started remain compatible in imported CSV and KPI',()=>{
 const project={members:[],systems:[{id:'a',name:'System A',cyberStatus:'Unknown'}, {id:'b',name:'System B',cyberStatus:'Review'}]};
 assert.deepEqual(prepareReportMetadataImport(project,[{System:'System A',Cyber:'Not Started'}]),[]);
 assert.deepEqual(prepareReportMetadataImport(project,[{System:'System A',Cyber:'Unknown'}]),[]);
 assert.deepEqual(prepareReportMetadataImport(project,[{System:'System A',Cyber:'Approved'}]),[{id:'a',cyberStatus:'Approved'}]);
 assert.deepEqual(prepareReportMetadataImport(project,[{System:'System B',Cyber:'Not Started'}]),[{id:'b',cyberStatus:'Not Started'}]);
 assert.deepEqual(reportCounts({...project,referenceDemoTotals:false},counts).cyberApplicable,1);
 assert.deepEqual(reportCounts({...project,systems:[{id:'a',name:'System A',cyberStatus:'Not Started'}],referenceDemoTotals:false},counts).cyberApplicable,0);
});

test('Demo disclaimer removed while all live report metrics stay rendered',()=>{
 assert.doesNotMatch(report,/Reference demo:|nb-report-reference-note/);
 assert.match(report,/reportCounts\(project,counts\)/);
 assert.match(report,/System readiness/);
});
