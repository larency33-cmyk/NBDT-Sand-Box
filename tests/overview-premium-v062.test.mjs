import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../nbdt-overview-v061.css',import.meta.url),'utf8');
const overview=readFileSync(new URL('../src/overview-v061.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const fine=css.slice(css.indexOf('/* v0.6.62 — Overview visual refinement.'));

test('Overview refinement stays scoped and cannot restyle the sidebar or global navigation',()=>{
 assert.ok(fine.startsWith('/* v0.6.62'));
 for(const chunk of fine.split('}')){
  const trimmed=chunk.trim();
  if(!trimmed || trimmed.startsWith('/*') && !trimmed.includes('{'))continue;
  const start=trimmed.lastIndexOf('{');
  if(start===-1)continue;
  const pre=trimmed.slice(0,start).replace(/\/\*[\s\S]*?\*\//g,'').trim();
  if(pre.startsWith('@'))continue;
  assert.ok(pre.includes('.nb61-overview'),`Unscoped style selector: ${pre}`);
 }
 assert.match(app,/import '\.\/nbdt-overview-v061\.css';/);
});

test('Overview has intentional visual hierarchy with accessible focus and reduced motion',()=>{
 for(const selector of ['.nb61-hero','.nb61-kpi','.nb61-attention','.nb61-week','.nb61-readiness','.nb61-recent','.nb61-coverage'])assert.ok(fine.includes(selector));
 assert.ok(fine.includes(':focus-visible'));
 assert.ok(fine.includes('prefers-reduced-motion:reduce'));
 assert.ok(fine.includes('.nb61-attention:before'));
});

test('Compact and mobile layouts explicitly reflow Overview without changing data',()=>{
 assert.match(fine,/@media\(max-width:1320px\)/);
 assert.match(fine,/@media\(max-width:1150px\)/);
 assert.match(fine,/@media\(max-width:760px\)/);
 assert.match(fine,/@media\(max-width:460px\)/);
 assert.match(fine,/\.nb61-attention-table\{min-width:640px\}/);
});

test('Design changes preserve real-source command-center section labels and interactions',()=>{
 for(const label of ['Systems requiring attention','This week','System readiness','Recorded activity','Ownership coverage'])assert.ok(overview.includes(label));
 for(const cb of ['onInspectSystem(item.name)','onNavigate(\'roadmap\')','onNavigate(\'assignment\')'])assert.ok(overview.includes(cb));
 assert.ok(overview.includes('buildOverviewData(project,roster,clock)'));
});
