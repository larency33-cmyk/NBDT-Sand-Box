import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../nbdt-registry-v108.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const progress=readFileSync(new URL('../src/registry-progress.mjs',import.meta.url),'utf8');

test('Search systems keeps a complete blue outline around transparent input',()=>{
  assert.match(css,/v0\.6\.110 — Search systems complete border/);
  assert.match(css,/\.nb-registry-filters \.nb-search-field\{[\s\S]*?border:1px solid #c9dbef;/);
  assert.match(css,/\.nb-registry-filters \.nb-search-field input\{[\s\S]*?background:transparent!important;/);
  assert.match(css,/\.nb-registry-filters \.nb-search-field input\{[\s\S]*?min-height:0!important;/);
  assert.match(app,/<label className="nb-search-field"><Search size=\{19\}/);
});
test('Status filter owns a separate unboxed icon slot; other filters unchanged',()=>{
  assert.match(app,/nb-type-filter-option-icon nb110-status-icon-wrap/);
  assert.match(app,/nb-type-filter-option-icon nb-tone-blue/);
  assert.match(css,/\.nb108-status-filter \.nb-type-filter-option-icon\.nb110-status-icon-wrap\{[\s\S]*?background:transparent!important;/);
  assert.match(css,/\.nb108-filter-option-completed \.nb110-status-icon-wrap>\.nb109-status-glyph\{color:#13a05a;/);
  assert.match(css,/\.nb108-filter-option-in-progress \.nb110-status-icon-wrap>\.nb109-status-glyph\{color:#0874f6;/);
  assert.match(css,/\.nb108-filter-option-not-started \.nb110-status-icon-wrap>\.nb109-status-glyph\{color:#879bb6;/);
});
test('dropdown status shapes reuse exact existing glyph component',()=>{
  assert.match(app,/<RegistryStatusGlyph status=\{item.value as RegistryStatusKey\} size=\{18\} variant="filter"\/>/);
  assert.match(app,/fill=\{outlinedComplete\?'none':'currentColor'\}/);
  assert.match(app,/a8\.6 8\.6 0 1 1-8\.6 8\.6/);
  assert.match(app,/status==='in-progress'/);
  assert.match(app,/r="8.6" stroke="currentColor" strokeWidth="2.05"/);
});
test('filter and progress semantics remain unchanged',()=>{
  assert.match(app,/value=\{systemStatusFilter\} onChange=\{setSystemStatusFilter\}/);
  assert.match(progress,/registrySystemProgress/);
  assert.match(app,/filteredSystems\.map\(sys=>/);
});
