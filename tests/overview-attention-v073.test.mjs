import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectAttentionStage,getAttentionRows} from '../src/overview-attention.mjs';

const css=readFileSync(new URL('../nbdt-overview-v073.css',import.meta.url),'utf8');
const overview=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const kpi={total:100,base:0,ready:0,deployed:0};

test('v073 white empty KPI chamber 70% opacity; animated waves retained',()=>{
  assert.match(index,/import '\.\/nbdt-overview-v071\.css'/);
  assert.match(index,/import '\.\/nbdt-overview-v072\.css'/);
  assert.match(index,/import '\.\/nbdt-overview-v073\.css'/);
  assert.match(css,/\.nb69-water-background\s*\{[^}]*fill:rgba\(255,255,255,\.70\)/);
  assert.match(overview,/nb70-water-wave--shade5/);
});
test('Base is first, with its own percentage and count',()=>{
  const stage=selectAttentionStage({...kpi,base:62,ready:6,deployed:0});
  assert.equal(stage.key,'base');assert.equal(stage.percent,62);assert.equal(stage.pending,38);
  assert.match(stage.description,/38 devices need base configuration/);
});
test('Ready uses ready percentage, never stale base percent',()=>{
  const stage=selectAttentionStage({...kpi,base:100,ready:6,deployed:0});
  assert.equal(stage.key,'ready');assert.equal(stage.percent,6);assert.equal(stage.pending,94);
  assert.match(stage.description,/94 devices pending ready for deployment/);
});
test('Deployed is shown only after readiness is done/nearly done',()=>{
  const stage=selectAttentionStage({...kpi,base:100,ready:100,deployed:12});
  assert.equal(stage.key,'deployed');assert.equal(stage.percent,12);assert.equal(stage.pending,88);
  assert.match(stage.description,/pending deployment/);
});
test('Near-finished Base yields to Ready when Ready is seriously behind',()=>{
  assert.equal(selectAttentionStage({...kpi,base:97,ready:38,deployed:5}).key,'ready');
  assert.equal(selectAttentionStage({...kpi,base:94,ready:38,deployed:5}).key,'base');
  assert.equal(selectAttentionStage({...kpi,base:97,ready:100,deployed:2}).key,'base');
});
test('Nearly finished Ready yields to Deployment',()=>{
  const stage=selectAttentionStage({...kpi,base:100,ready:98,deployed:40});
  assert.equal(stage.key,'deployed');assert.equal(stage.percent,40);
});
test('Fully deployed / no inventory are excluded',()=>{
  assert.equal(selectAttentionStage({...kpi,base:100,ready:100,deployed:100}),null);
  assert.equal(selectAttentionStage({total:0,base:0,ready:0,deployed:0}),null);
});
test('Imported sample exceeding totals is safely clamped',()=>{
  const stage=selectAttentionStage({total:100,base:110,ready:105,deployed:30});
  assert.equal(stage.key,'deployed');assert.equal(stage.percent,30);assert.equal(stage.total,100);
});
test('A pending device cannot mistakenly render as 100%',()=>{
  const stage=selectAttentionStage({total:1000,base:999,ready:1000,deployed:1000});
  assert.equal(stage.key,'base');assert.ok(stage.percent<100);assert.equal(stage.pending,1);
});
test('Top attention count includes deployment-only remaining work',()=>{
  const systems=[{id:'1',name:'A',values:{total:100,base:100,ready:100,deployed:20}},
    {id:'2',name:'B',values:{total:100,base:80,ready:20,deployed:1}},
    {id:'3',name:'C',values:{total:100,base:100,ready:100,deployed:100}}];
  const rows=getAttentionRows(systems,s=>s.values);
  assert.deepEqual(rows.map(x=>x.sys.id),['2','1']);
  assert.match(overview,/allSetupRows\.length/);
  assert.match(overview,/stage\.percent/);
  assert.match(overview,/stage\.description/);
  assert.match(overview,/stage\.label/);
  assert.doesNotMatch(overview,/Math\.round\(c\.base\/c\.total\*100\)/);
});
