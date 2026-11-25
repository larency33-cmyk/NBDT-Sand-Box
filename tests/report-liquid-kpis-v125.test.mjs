import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-report-kpi-v125.css',import.meta.url),'utf8');
const entry=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const report=source.slice(source.indexOf('export function Report('),source.indexOf('export function Overview('));
const overview=source.slice(source.indexOf('export function Overview('));
test('Report uses the exact Overview KPI surface and five-shade waves',()=>{
 assert.match(report,/nb125-report-kpi-scope/);
 for(const token of ['nb-overview-kpi-card__content','nb64-kpi-figures','nb70-water-wave--shade1','nb70-water-wave--shade2','nb70-water-wave--shade3','nb70-water-wave--shade4','nb70-water-wave--shade5','nb70-water-bubble','nb69-water-outline','nb66-liquid-svg']){
  assert.ok(report.includes(token),token); assert.ok(overview.includes(token),token);
 }
 assert.match(report,/item\.colors\.shades\.map/);
 assert.match(report,/item\.colors\.primary/);
 assert.match(report,/waterline\.toFixed\(3\)/);
});
test('all four Report KPI measurements remain linked to reportCounts',()=>{
 assert.match(report,/reportSummary=reportCounts\(project,counts\)/);
 for(const expr of ['reportSummary.base','reportSummary.ready','reportSummary.deployed','reportSummary.cyberApproved','reportSummary.cyberApplicable']) assert.ok(report.includes(expr),expr);
 for(const theme of ['base','ready','deployed','cyber']) assert.match(report,new RegExp("accent:'"+theme+"'"));
});
test('Report retains its live readiness table and filters',()=>{
 assert.match(report,/nb-report-readiness-panel/); assert.match(report,/nb-report-table/);
 assert.match(report,/All cyber statuses/); assert.match(report,/Search systems or devices/);
});
test('separate stylesheet is loaded after Overview and is responsive',()=>{
 assert.ok(entry.indexOf('nbdt-overview-v124.css')<entry.indexOf('nbdt-report-kpi-v125.css'));
 assert.match(css,/max-width:1120px/);assert.match(css,/max-width:640px/);
 assert.match(css,/prefers-reduced-motion/);
});
