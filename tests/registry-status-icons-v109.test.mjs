import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-registry-v108.css',import.meta.url),'utf8');
const source=readFileSync(new URL('../src/registry-progress.mjs',import.meta.url),'utf8');
test('approved green completed icon is solid for stages and dropdown, outlined for overall badges',()=>{
  assert.match(app,/const RegistryStatusGlyph = /);
  assert.match(app,/fill=\{outlinedComplete\?'none':'currentColor'\}/);
  assert.match(app,/stroke=\{outlinedComplete\?'currentColor':'#fff'\}/);
  assert.match(app,/<RegistryStatusGlyph status=\{progress.status\} size=\{15\} variant="badge"\/>/);
  assert.match(app,/<RegistryStatusGlyph status=\{detail.status\} size=\{15\} variant="stage"\/>/);
});
test('in progress icon renders traced ring, not a center dot',()=>{
  assert.match(app,/status==='in-progress'/);
  assert.match(app,/a8\.6 8\.6 0 1 1-8\.6 8\.6/);
  assert.doesNotMatch(app,/<CircleDot/);
  assert.match(css,/\.nb108-stage-in-progress \.nb109-status-glyph/);
});
test('dropdown options use identical custom status glyphs',()=>{
  assert.match(app,/label==='Completion status'&&value\?<RegistryStatusGlyph/);
  assert.match(app,/<RegistryStatusGlyph status=\{item.value as RegistryStatusKey\} size=\{18\} variant="filter"/);
  assert.match(app,/value:'completed',label:'Completed'/);
  assert.match(app,/value:'in-progress',label:'In progress'/);
  assert.match(app,/value:'not-started',label:'Not started'/);
});
test('registry progress computation and stored data semantics remain untouched',()=>{
  assert.match(source,/registrySystemProgress\(system,projectId\)/);
  assert.match(source,/getLessonReview\(item,projectId\)/);
  assert.match(source,/loadGuideReview\(system\?\.guideReview,guide\)/);
});
