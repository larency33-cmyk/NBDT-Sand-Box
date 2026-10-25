import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateAggregateMetrics,reportCounts,seedReferenceReport} from '../src/reference-report.mjs';
import {counts} from '../src/model.mjs';
const source=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const report=source.slice(source.indexOf('export function Report('),source.indexOf('export function Overview('));
const css=readFileSync(new URL('../configuration-report-inline-v033.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');

test('all filtered systems render in one continuous table with no pagination or page state',()=>{
 assert.match(report,/const rows=systems;/);
 assert.match(report,/nb-report-continuous/);
 assert.match(report,/Showing all \{systems\.length\} systems/);
 assert.doesNotMatch(report,/\.slice\(actualPage|setPage\(|Math\.ceil\(systems\.length\/6\)|aria-label="Report pages"/);
});
test('add and edit use an actual inline table row rather than a modal dialog',()=>{
 assert.ok(report.indexOf('{isCreating&&inlineRow}') < report.indexOf('{rows.map('));
 assert.match(report,/if\(editor\?\.id===s\.id\)return inlineRow/);
 assert.match(report,/className="nb-report-editing-row"/);
 assert.match(report,/aria-label="System name"/);
 assert.match(report,/aria-label="Device model"/);
 assert.match(report,/inlineNumber\('total','Quantity'\)/);
 assert.match(report,/aria-label="Save system"/);
 assert.match(report,/aria-label="Cancel editing"/);
 assert.doesNotMatch(report,/createPortal|nb-report-editor-dialog|nb-report-editor-backdrop/);
});
test('progress appears as the number completed plus a percentage of warehouse quantity',()=>{
 assert.match(report,/n\.toLocaleString\('en-US'\)/);
 assert.match(report,/Math\.round\(n\/t\*100\)/);
 assert.doesNotMatch(report,/\{n\} \/ \{t\}/);
 assert.match(report,/inlineNumber\(key,label\)/);
 assert.match(report,/Math\.round\(n\/total\*100\)/);
 assert.deepEqual(validateAggregateMetrics({total:194,base:187,ready:194,deployed:80}),{total:194,base:187,ready:194,deployed:80});
 assert.throws(()=>validateAggregateMetrics({total:100,base:101,ready:1,deployed:0}),/between 0 and quantity/);
});
test('inline deletion requires confirm and protects linked device history',()=>{
 assert.match(report,/confirmDeleteId===s\.id/);
 assert.match(report,/Delete this system and its history/);
 assert.match(report,/confirmDeleteId!==sys\.id/);
 assert.match(report,/onSystemDelete\(sys\.id\)/);
 assert.match(report,/editableRegistered/);
 assert.match(report,/Registered device progress must be edited through its device checklists/);
 assert.doesNotMatch(report,/window\.confirm|window\.alert/);
});
test('KPI totals remain live after changing row metrics',()=>{
 const project=seedReferenceReport({id:'legend-ots',systems:[]});
 const a=reportCounts(project,counts);
 const edited={...project,systems:project.systems.map(s=>s.id==='reference-pos-mobility'?{...s,reportMetrics:{...s.reportMetrics,total:200,base:195}}:s)};
 const b=reportCounts(edited,counts);
 assert.equal(b.total-a.total,6);
 assert.equal(b.base-a.base,8);
 assert.match(report,/reportCounts\(project,counts\)/);
});
test('report-only CSS is imported last, supports horizontal overflow and sticky-free vertical continuous scroll',()=>{
 assert.ok(app.indexOf("import './configuration-report-inline-v033.css'")>app.indexOf("import './configuration-report-editable-v032.css'"));
 assert.match(css,/max-height:none!important/);
 assert.match(css,/overflow-y:visible!important/);
 assert.match(css,/nb-report-inline-progress/);
 assert.match(css,/nb-report-editing-row/);
 assert.doesNotMatch(css,/\.nb-sidebar|\.nb-week-grid|\.nb-week-cell/);
});
