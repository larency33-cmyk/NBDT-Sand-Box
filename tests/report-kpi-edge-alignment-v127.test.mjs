import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css = readFileSync(new URL('../nbdt-report-kpi-v125.css',import.meta.url),'utf8');
const source = readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const patch = css.slice(css.indexOf('/* v0.6.127 —'));
const report = source.slice(source.indexOf('export function Report('),source.indexOf('export function Overview('));
test('Report KPI and readiness panel share the same flex parent',()=>{
 assert.match(report,/<div className="nb-overview-premium nb124-overview nb125-report-kpi-scope">/);
 assert.match(report,/<section className="nb-report-readiness-panel"/);
 assert.match(patch,/\.nb-report-shell \.nb-report > \.nb125-report-kpi-scope/);
});
test('KPI CSS clears inherited Overview padding and never expands outside parent',()=>{
 assert.match(patch,/width:100%!important/);
 assert.match(patch,/padding:0!important/);
 assert.match(patch,/margin:13px 0 21px!important/);
 assert.doesNotMatch(patch,/--nb126-edge-extension/);
 assert.doesNotMatch(patch,/width:calc\(/);
 assert.doesNotMatch(patch,/margin:[^;]*calc\(/);
});
test('four KPI liquid SVG animations and report data remain untouched',()=>{
 assert.match(report,/nb125-report-kpi-grid/);
 assert.match(report,/nb70-water-wave--shade5/);
 assert.match(report,/nb70-water-bubble/);
 assert.match(report,/reportSummary=reportCounts\(project,counts\)/);
 assert.match(report,/nb-report-readiness-panel/);
});
