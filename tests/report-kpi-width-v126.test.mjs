import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css=readFileSync(new URL('../nbdt-report-kpi-v125.css',import.meta.url),'utf8');
const report=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const patch=css.split('/* v0.6.127 —')[1]??'';
test('KPI wrapper now shares the exact content edges of System readiness',()=>{
 assert.match(patch,/width:100%!important/);
 assert.match(patch,/padding:0!important/);
 assert.match(patch,/margin:13px 0 21px!important/);
 assert.doesNotMatch(patch,/edge-extension|calc\(100% \+/);
});
test('new alignment has no viewport-specific negative offsets',()=>{
 assert.doesNotMatch(patch,/margin-inline:[^;]*-/);
 assert.doesNotMatch(patch,/@media\(max-width:780px\)/);
});
test('Report still renders four animated liquid KPI cards before System readiness',()=>{
 const start=report.indexOf('export function Report('),end=report.indexOf('export function Overview(');
 assert.ok(start>=0&&end>start);
 const view=report.slice(start,end);
 assert.ok(view.indexOf('nb125-report-kpi-scope')<view.indexOf('nb-report-readiness-panel'));
 assert.match(view,/nb70-water-wave--shade5/);
 for(const name of ['Base Configuration','Ready for Deployment','Deployed','Cyber Approved'])assert.ok(view.includes(name),name);
});
