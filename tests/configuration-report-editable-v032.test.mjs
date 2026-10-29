import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {REFERENCE_SYSTEMS,REFERENCE_IDS,seedReferenceReport,validateAggregateMetrics,reportCounts} from '../src/reference-report.mjs';
import {counts} from '../src/model.mjs';
const workspace=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const component=workspace.slice(workspace.indexOf('export function Report('),workspace.indexOf('export function Overview('));
const css=readFileSync(new URL('../configuration-report-editable-v032.css',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');

test('six approved systems have exactly the mockup quantities, stages, venues, cyber and owners',()=>{
 assert.deepEqual(REFERENCE_SYSTEMS.map(s=>s.name),['POS – Mobility','Point of Sale','QControl','Stateroom Attendant App','Digital Signage','Emustering']);
 assert.deepEqual(REFERENCE_SYSTEMS.map(s=>[s.total,s.base,s.ready,s.deployed]),[[194,187,194,80],[231,231,13,0],[193,120,0,0],[211,211,0,0],[162,162,32,20],[109,55,55,109]]);
 assert.deepEqual(REFERENCE_SYSTEMS.map(s=>s.venue),['MOB','POS','QCO','SAA','DIG','EMU']);
 assert.deepEqual(REFERENCE_SYSTEMS.map(s=>s.cyberStatus),['Review','Approved','N/A','N/A','Approved','N/A']);
 assert.deepEqual(REFERENCE_SYSTEMS.map(s=>s.owner),['Apple','Apple','Daron','Elvan','Matthew','Junin']);
});
test('only Legend OTS gets idempotent six-system seed without replacing existing records',()=>{
 const base={id:'legend-ots',systems:[{id:'existing',name:'CREW DEBIT KIOSK'}]};
 const first=seedReferenceReport(base);
 assert.equal(first.systems.length,7);
 assert.equal(first.systems[0].id,'existing');
 assert.equal(first.reportDemoTotals ?? first.referenceDemoTotals, true);
 assert.equal(seedReferenceReport(first).systems.length,7);
 assert.equal(seedReferenceReport({...first,systems:first.systems.filter(s=>s.id!=='reference-qcontrol')}).systems.length,6,'Deleted seed must not return');
 assert.equal(seedReferenceReport({id:'other',systems:[]}).systems.length,0);
});
test('sample KPI totals reproduce screenshot benchmark and change after editing',()=>{
 const project=seedReferenceReport({id:'legend-ots',systems:[]});
 const kpi=reportCounts(project,counts);
 assert.deepEqual(kpi,{total:1809,base:1585,ready:462,deployed:209,cyberApproved:19,cyberApplicable:40});
 assert.deepEqual([Math.round(kpi.base/kpi.total*100),Math.round(kpi.ready/kpi.total*100),Math.round(kpi.deployed/kpi.total*100),Math.round(kpi.cyberApproved/kpi.cyberApplicable*100)],[88,26,12,48]);
 const next={...project,systems:project.systems.map(s=>s.id==='reference-qcontrol'?{...s,reportMetrics:{...s.reportMetrics,ready:25}}:s)};
 assert.equal(reportCounts(next,counts).ready,487);
 const deleted={...next,systems:next.systems.filter(s=>s.id!=='reference-qcontrol')};
 assert.equal(reportCounts(deleted,counts).total,1616);
 const added={...deleted,systems:[...deleted.systems,{id:'extra',reportMode:'aggregate-sample',reportMetrics:{total:10,base:5,ready:3,deployed:1},cyberStatus:'Approved'}]};
 assert.equal(reportCounts(added,counts).total,1626);
 assert.equal(reportCounts(added,counts).cyberApproved,20);
});
test('individual screenshot progress is computed from sample metrics, not 1100 fake device runs',()=>{
 const project=seedReferenceReport({id:'legend-ots',systems:[]});
 assert.equal(counts(project.systems[0]).base,187);
 assert.equal(counts(project.systems[5]).deployed,109);
 assert.equal(project.systems[0].devices.length,0);
});
test('aggregate edit validates realistic integer bounds and permits the screenshot Emustering row',()=>{
 assert.deepEqual(validateAggregateMetrics({total:109,base:55,ready:55,deployed:109}),{total:109,base:55,ready:55,deployed:109});
 assert.throws(()=>validateAggregateMetrics({total:9,base:10,ready:1,deployed:1}),/between 0 and quantity/);
 assert.throws(()=>validateAggregateMetrics({total:9.2,base:1,ready:1,deployed:1}),/integer/);
});
test('report supports inline add edit delete, confirmation and backing persistence',()=>{
 assert.match(component,/onSystemCreate\(next\)/);
 assert.match(component,/onSystemChange\(next\)/);
 assert.match(component,/confirmDeleteId/);
 assert.match(component,/onSystemDelete\(sys\.id\)/);
 assert.match(component,/validateAggregateMetrics/);
 assert.match(index,/onSystemCreate=/);
 assert.match(index,/onSystemDelete=/);
 assert.match(index,/commitRecord/);
 assert.doesNotMatch(component,/Reference demo:/);
 assert.doesNotMatch(component,/nb-report-editor-backdrop/);
 assert.match(index,/configuration-report-editable-v032\.css/);
 assert.doesNotMatch(css,/\.nb-sidebar|\.nb-week-grid/);
});
