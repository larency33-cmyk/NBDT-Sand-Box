import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../configuration-report-approved-v031.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const workspace=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const report=workspace.slice(workspace.indexOf('export function Report('), workspace.indexOf('export function Overview('));
test('Approved visual stylesheet loads last and is scoped only to Configuration Report',()=>{
  assert.ok(app.indexOf("import './configuration-report-approved-v031.css'")>app.indexOf("import './configuration-report-exact-v030.css'"));
  assert.doesNotMatch(css,/\.nb-sidebar|\.nb-week-grid|\.nb-project-week-drawer/);
  assert.match(css,/\.nb-report-shell/);
});
test('Reference sizing: 4 KPI cards, large heading, integrated readiness card and 65px rows',()=>{
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/);
 assert.match(css,/height:141px!important/);
 assert.match(css,/font-size:39px!important/);
 assert.match(css,/\.nb-report-readiness-panel/);
 assert.match(css,/height:65px!important/);
 assert.match(css,/nb-stage-ready progress::-webkit-progress-value/);
});
test('Reference search and sorting remain usable after removing page controls',()=>{
 assert.match(report,/className="nb-report-search"/);
 assert.match(report,/aria-sort=/);
 assert.match(report,/changeSort\(key\)/);
 assert.match(report,/nb-report-continuous/);
 assert.doesNotMatch(report,/aria-label="Report pages"/);
});
test('Top actions match mockup: export/import; report supports explicitly gated system management',()=>{
 const top=app.slice(app.indexOf('activeTab === \'config-report\' && ('),app.indexOf('draftIssue && ('));
 assert.match(top,/Export data/);
 assert.match(top,/Import Report/);
 assert.doesNotMatch(top,/View Mode|Admin Mode/);
 assert.match(report,/onRequestAdmin/);
 assert.match(report,/Add system/);
 assert.doesNotMatch(report,/>Edit systems<|>Done editing</); // role-based access superseded the old edit-mode switch
 assert.match(report,/isAdmin&&<B onClick/);
});
test('The six reference systems use live aggregation, with an explicitly labelled illustrative baseline',()=>{
 assert.match(report,/reportCounts\(project,counts\)/);
 assert.match(report,/const rows=systems/);
 assert.match(report,/counts\(s\)/);
 assert.doesNotMatch(report,/Reference demo:/);
});
