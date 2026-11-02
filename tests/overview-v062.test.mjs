import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const code=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-overview-v062.css',import.meta.url),'utf8');
const overview=code.slice(code.indexOf('export function Overview('));

test('Overview retains all four KPI cards with a dedicated on-top reflection layer',()=>{
 assert.match(overview,/Base Configuration/);
 assert.match(overview,/Ready for Deployment/);
 assert.match(overview,/Deployed/);
 assert.match(overview,/Cyber Approved/);
 assert.match(overview,/nb-overview-kpi-card__reflection/);
 assert.match(css,/\.nb-overview-premium \.nb-overview-kpi-card::after/);
 assert.match(css,/\.nb-overview-premium \.nb-overview-kpi-card__reflection/);
 assert.match(css,/z-index:7/);
 assert.match(index,/import '\.\/nbdt-overview-v062\.css'/);
});

test('Desktop Overview has five blocks in exactly two CSS grid rows',()=>{
 const names=['nb-overview-attention','nb-overview-week','nb-overview-readiness','nb-overview-activity','nb-overview-ownership'];
 const positions=names.map(n=>overview.indexOf(`<section className="nb-overview-card ${n}`));
 assert.ok(positions.every(i=>i>=0),'All five panels must remain present');
 assert.deepEqual([...positions].sort((a,b)=>a-b),positions,'DOM order follows visual reading order');
 assert.doesNotMatch(overview,/nb-overview-side-stack/);
 for(const [name,row] of [['attention',1],['week',1],['readiness',2],['activity',2],['ownership',2]]){
  assert.ok(css.includes(`.nb-overview-${name}{grid-column:`) && css.includes(`;grid-row:${row}`),`Missing row placement for ${name}`);
 }
 assert.match(css,/grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/);
});

test('Overview links use the existing route identifiers',()=>{
 for(const route of ["'issues'","'roadmap'","'config-report'","'assignment'"]){
  assert.ok(overview.includes(`onNavigate(${route})`),`Missing route ${route}`);
 }
});
