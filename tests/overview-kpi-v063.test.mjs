import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gaugeGeometry} from '../src/overview-gauge.mjs';

const tsx=readFileSync(new URL('../src/overview-v061.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-overview-kpi-v063.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');

test('KPI semicircle geometry supports 0, 7, 10, 22, 49, 78 and 100 percent accurately',()=>{
 for(const value of [0,7,10,22,49,78,100]){
  const geometry=gaugeGeometry(value);
  assert.equal(geometry.percent,value);
  assert.equal(geometry.segments.length,32);
  const filled=geometry.segments.filter(segment=>segment.active).length;
  assert.ok(Math.abs(filled/32*100-value)<4,`Gauge ${value}% has ${filled} / 32 active segments`);
  assert.equal(Boolean(geometry.marker),value>0);
  if(value===100) assert.ok(geometry.segments.every(segment=>segment.active===segment.track));
  if(value===0) assert.ok(geometry.segments.every(segment=>segment.active===null));
 }
});
test('KPI gauge never overflows beyond 0–100 and preserves fractional progress',()=>{
 assert.equal(gaugeGeometry(-1).percent,0);
 assert.equal(gaugeGeometry(110).percent,100);
 assert.equal(gaugeGeometry(null).percent,0);
 assert.notEqual(gaugeGeometry(7).segments[2].active,null);
 assert.equal(gaugeGeometry(7).segments[3].active,null);
});
test('Each KPI contains one segmented semicircle, no duplicate donut or progress bar',()=>{
 const section=tsx.slice(tsx.indexOf('<div className="nb61-kpis">'),tsx.indexOf('<div className="nb61-grid-top">'));
 assert.ok(section.includes('<SemiGauge value={k.percent} title={k.title}/>'));
 assert.ok(!section.includes('<StatBar'));
 assert.ok(!section.includes('nb61-kpi-ring'));
 assert.ok(!section.includes('conic-gradient'));
 assert.ok(section.includes('k.percent'));
 assert.ok(section.includes('formatter(k.value)'));
 assert.ok(tsx.includes('gaugeGeometry(value)'));
});
test('KPI styles are scoped to Overview; wave animations are slow and reduced-motion safe',()=>{
 assert.ok(app.includes("import './nbdt-overview-kpi-v063.css';"));
 assert.match(css,/nb63-wave-back 26s/);
 assert.match(css,/nb63-wave-front 31s/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/animation:none!important/);
 assert.match(css,/\.nb61-overview \.nb63-semi-gauge/);
 assert.match(css,/\.nb61-overview \.nb61-kpis \.nb61-kpi/);
 assert.ok(!css.includes('.nb-sidebar'));
});
test('Real KPI data and target links remain unchanged',()=>{
 assert.ok(tsx.includes('buildOverviewData(project,roster,clock)'));
 assert.ok(tsx.includes("onNavigate('config-report')"));
 assert.ok(tsx.includes('k.total'));
 for(const title of ['Systems requiring attention','This week','System readiness','Ownership coverage']) assert.ok(tsx.includes(title));
});
