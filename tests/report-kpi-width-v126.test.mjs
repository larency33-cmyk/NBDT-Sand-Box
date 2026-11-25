import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css=readFileSync(new URL('../nbdt-report-kpi-v125.css',import.meta.url),'utf8');
const report=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const patch=css.split('/* v0.6.126 —')[1]??'';
test('Report KPI wrapper bleeds equally to both System readiness edges',()=>{
 assert.match(patch,/--nb126-edge-extension:24px/);
 assert.ok(patch.includes('width:calc(100% + var(--nb126-edge-extension) + var(--nb126-edge-extension))!important'));
 assert.ok(patch.includes('margin:13px calc(0px - var(--nb126-edge-extension)) 21px!important'));
 assert.match(patch,/padding:0!important/);
});
test('small screens avoid horizontal overflow due to KPI edge compensation',()=>{
 assert.match(patch,/@media\(max-width:780px\)/);
 assert.match(patch,/--nb126-edge-extension:0px/);
});
test('Report still renders four animated liquid KPI cards before System readiness',()=>{
 const start=report.indexOf('export function Report('),end=report.indexOf('export function Overview(');
 assert.ok(start>=0&&end>start);
 const view=report.slice(start,end);
 assert.ok(view.indexOf('nb125-report-kpi-scope')<view.indexOf('nb-report-readiness-panel'));
 assert.match(view,/nb70-water-wave--shade5/);
 for(const name of ['Base Configuration','Ready for Deployment','Deployed','Cyber Approved'])assert.ok(view.includes(name),name);
});
