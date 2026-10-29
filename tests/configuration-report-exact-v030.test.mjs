import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareReportMetadataImport} from '../src/report-import.mjs';
const ui=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const reportSource=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const report=reportSource.slice(reportSource.indexOf('export function Report('),reportSource.indexOf('export function Overview('));
const css=readFileSync(new URL('../configuration-report-exact-v030.css',import.meta.url),'utf8');
const project={systems:[{id:'pos',name:'POS Mobility',assigneeId:'m1',cyberStatus:'Unknown'},{id:'crew',name:'Crew Debit',assigneeId:''}],members:[{id:'m1',name:'Homesh'},{id:'m2',name:'Jorge'}]};

test('Legacy report UI, aggregate seed and legacy importer are gone',()=>{
 assert.doesNotMatch(ui, /INITIAL_CONFIG_REPORT_ROWS|<ConfigurationReport|Export Legacy Data|Legacy aggregate editor|\bconfigReportRows\s*:\s*INITIAL/);
 assert.doesNotMatch(report, /Legacy report|configReportRows/);
 assert.match(ui, /const \{configReportRows: obsoleteAggregateRows, \.\.\.currentData\} = data/);
});
test('Main report actions export live system readiness, not legacy aggregates',()=>{
 assert.match(ui, /System_Readiness\.xlsx/);
 assert.match(ui, /reportDeviceCounts\(system\)/);
 assert.match(ui, /Import Report/);
 assert.match(ui, /Export data/);
 assert.match(ui, /prepareReportMetadataImport\(project,incoming\)/);
 assert.match(ui, /Device completion figures will NOT be imported/);
});
test('Dashboard matches reference information hierarchy',()=>{
 assert.match(report, /Deployment overview/);
 assert.ok(report.indexOf('nb-kpis')<report.indexOf('nb-readiness-heading'));
 assert.ok(report.indexOf('nb-readiness-heading')<report.indexOf('nb-report-filters'));
 assert.doesNotMatch(report,/className="nb-report-column-picker"/);
 assert.ok(report.indexOf('nb-report-table')<report.indexOf('nb-report-continuous-footer'));
 assert.match(css,/grid-template-columns:minmax\(195px,2\.3fr\)/);
 assert.match(css,/\.nb-report \.nb-report-column-picker/);
});
test('Four KPI cards use dynamic report aggregation and retain verified device counts',()=>{
 assert.match(report,/reportCounts\(project,counts\)/);
 assert.match(report,/progress\(c\.base,c\.total\)/);
 assert.match(report,/No registered device data/);
 assert.doesNotMatch(report,/1,809 devices|\b88%\b/);
});
test('Imported owner and cyber are matched against existing names only',()=>{
 const changes=prepareReportMetadataImport(project,[{System:'pos mobility',Cyber:'Approved',Owner:'Jorge'},{System:'Crew Debit',Cyber:'Review',Owner:'Unassigned'}]);
 assert.deepEqual(changes,[{id:'pos',cyberStatus:'Approved',assigneeId:'m2'},{id:'crew',cyberStatus:'Review'}]);
});
test('Import rejects fake or duplicated systems and invalid cyber status',()=>{
 assert.throws(()=>prepareReportMetadataImport(project,[{System:'Missing',Cyber:'Approved'}]),/Unknown system/);
 assert.throws(()=>prepareReportMetadataImport(project,[{System:'POS Mobility',Cyber:'Complete'}]),/invalid Cyber/);
 assert.throws(()=>prepareReportMetadataImport(project,[{System:'POS Mobility',Cyber:'Review'},{System:'pos mobility',Cyber:'Review'}]),/Duplicate/);
 assert.throws(()=>prepareReportMetadataImport(project,[{System:'POS Mobility',Owner:'Other'}]),/unknown owner/);
 assert.deepEqual(prepareReportMetadataImport(project,[{System:'Crew Debit',Cyber:'Unknown',Owner:'Unassigned'}]),[]);
});
test('CSS uses separate report-only rules, numeric pagination, mobile reflow',()=>{
 assert.doesNotMatch(css,/\.nb-sidebar|\.nb-week-grid|\.nb-week-cell/);
 for(const name of ['nb-report-top-actions','nb-report-readiness-panel','nb-report-filters','nb-report-column-menu','nb-report-pagination']) assert.ok(css.includes(name),name);
 assert.match(css,/@media \(max-width:710px\)/);
});
