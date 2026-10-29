import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const w=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../redesign.css',import.meta.url),'utf8');
test('NBDT report shows KPIs, controls and a continuous table without an obsolete Columns picker',()=>{
 const start=w.indexOf('export function Report');
 const substr=w.slice(start,w.indexOf('export function Overview',start));
 const selectors=['className="nb-kpis"','className="nb-readiness-heading"','className="nb-toolbar nb-report-filters"','className="nb-report-table nb-report-continuous"'];
 const positions=selectors.map(k=>substr.indexOf(k));
 assert.ok(positions.every(p=>p>=0));
 assert.deepEqual(positions,[...positions].sort((a,b)=>a-b));
 assert.doesNotMatch(substr,/className="nb-report-column-picker"/);
});
test('report avoids simulated production percentages and retains explicit no-device data',()=>{
 assert.ok(w.includes('No registered device data'));
 assert.ok(w.includes('No device inventory'));
 assert.ok(w.includes('counts(s)'));
});
test('weekly tracker emits ISO week number without duplicate W and supports direct jump to populated week',()=>{
 assert.ok(w.includes('weekIso(w)'));
 assert.ok(w.includes('Current week') || w.includes('nb-current-indicator'));
 assert.ok(w.includes('closestScheduledWeek'));
 assert.ok(w.includes('View scheduled assignments'));
});
test('weekly matrix annotates empty rows and offers appropriately labelled cells',()=>{
 assert.ok(w.includes('nb-no-assignments'));
 assert.ok(w.includes('nb-empty-week'));
 assert.ok(w.includes('aria-label={`${m.name}: ${list.length} assignments'));
 assert.ok(css.includes('tr.nb-no-assignments .nb-week-cell'));
});
test('weekly panel opens only from a selected person/week cell',()=>{
 assert.ok(w.includes('openQuickPanel(m.id,w)')); // drawer replaces the old in-flow selection handler
 assert.ok(w.includes('nb-quick-panel'));
 assert.ok(w.includes('onQuickTaskSave'));
});
test('registry cards show guide-sourced technical fields without legacy progress',()=>{
 assert.ok(app.includes('registryCardFields(sys)'));
 assert.ok(app.includes('nb-description-panel'));
 assert.ok(!app.includes('nb-card-legacy-tag'));
 assert.ok(app.includes('No documentation URL has been linked'));
});
test('brand and nav use unified NBDT labels without changing project records',()=>{
 assert.ok(app.includes('nbdt-brand-wordmark'));
 assert.ok(app.includes('>NBDT</span>'));
 assert.ok(app.includes('>Configuration Report</span>'));
 assert.ok(app.includes('>Issues</span>'));
 assert.ok(app.includes("name: 'Legend OTS'"));
});
test('responsive screen contracts preserve blue palette and grouped configuration',()=>{
 for(const token of ['--brand:#0066F5','.nb-guide-body','.nb-stage-tabs','.nb-registry-grid','.nb-report .nb-scope-tabs','@media(max-width:700px)','@media(max-width:900px)'])assert.ok(css.includes(token),token);
});
