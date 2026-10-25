import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const report=source.slice(source.indexOf('export function Report('),source.indexOf('export function Overview('));
const css=readFileSync(new URL('../configuration-report-reference-v029.css',import.meta.url),'utf8');
const entry=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');

test('Reference CSS is loaded last without touching sidebar or Weekly Tracker',()=>{
  assert.ok(entry.indexOf("import './configuration-report-reference-v029.css'")>entry.indexOf("import './weekly-tracker-viewport-v027.css'"));
  assert.match(css,/\.nb-report-shell \.nb-report/);
  assert.doesNotMatch(css,/\.nb-sidebar|\.nb-week-grid|\.nb-week-cell/);
});
test('Reference readiness panel wraps filters and a continuous table',()=>{
  assert.match(report,/nb-report-readiness-panel/);
  assert.ok(report.indexOf('nb-report-readiness-panel')<report.indexOf('nb-readiness-heading'));
  assert.ok(report.indexOf('nb-readiness-heading')<report.indexOf('nb-report-filters'));
  assert.ok(report.indexOf('nb-report-filters')<report.indexOf('nb-report-table'));
  assert.ok(report.indexOf('nb-report-continuous-footer')>report.indexOf('nb-report-table'));
  assert.doesNotMatch(report,/Math\.ceil\(systems\.length\/6\)/);
  assert.doesNotMatch(report,/Legacy report|configReportRows/);
});
test('Dashboard uses computed progress and identifies sample benchmark totals',()=>{
  assert.match(report,/reportCounts\(project,counts\)/);
  assert.match(report,/No registered device data/);
  assert.match(report,/Reference demo:/);
  assert.match(report,/--report-kpi-accent/);
});
test('Table includes grounded Venue and AW values, without six-row paging',()=>{
  assert.match(report,/Venue','Base','Ready','Deployed','AW','Cyber','Owner/);
  assert.match(report,/displayVenue/);
  assert.match(report,/displayAw/);
  assert.match(report,/const rows=systems/);
  assert.match(report,/Search systems or devices/);
});
test('Report aligns to the top instead of being vertically centered',()=>{
  assert.match(css,/margin:0 auto!important/);
  assert.match(css,/nb-report-readiness-panel/);
  assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/);
});
