import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../nbdt-overview-v066.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');

test('v0.6.66 Overview overrides load after v0.6.65 and stay scoped',()=>{
  const prev=app.indexOf("import './nbdt-overview-v065.css';");
  const current=app.indexOf("import './nbdt-overview-v066.css';");
  assert.ok(prev>=0 && current>prev,'v0.6.66 overrides must load after v0.6.65');
  assert.doesNotMatch(css,/\.nb-sidebar|\.nb-side-menu|:root\s*\{/,'Overview override must not target shell/sidebar');
  for(const block of css.split('}')){
    const start=block.lastIndexOf('{');
    if(start<0) continue;
    const selector=block.slice(0,start).trim().split('\n').at(-1).trim();
    if(!selector || selector.startsWith('@') || selector.includes('/*')) continue;
    assert.ok(block.includes('.nb61-overview'),`Unexpected global selector ${selector}`);
  }
});

test('v0.6.66 adds stronger glass KPI treatment and reorganized lower analytics',()=>{
  assert.match(css,/backdrop-filter:\s*blur\(20px\)\s*saturate\(150%\)/);
  assert.match(css,/\.nb61-overview \.nb61-kpis \.nb61-kpi::before/);
  assert.match(css,/grid-template-areas:\s*"readiness recent"\s*"readiness coverage"/);
  assert.match(css,/\.nb61-overview \.nb61-recent \.nb61-activity::after/);
  assert.match(css,/\.nb61-overview \.nb61-empty-milestones/);
});
