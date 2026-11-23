import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-registry-v096.css',import.meta.url),'utf8');
const global=readFileSync(new URL('../nbdt-layout-v045.css',import.meta.url),'utf8');

// This global rule originally hid the owners scroll indicator even when the list was scrollable.
test('app-wide scrollbar hiding is kept intact for unrelated regions',()=>{
  assert.match(global,/\.nbdt-redesign\.nb-app-root \*\{scrollbar-width:none!important/);
  assert.match(global,/\.nbdt-redesign\.nb-app-root \*::-webkit-scrollbar/);
});

test('only Deployment owner receives the scrollbar-scoped hook',()=>{
  assert.match(app,/label==='Deployment owner'\?' nb113-owner-filter':''/);
  assert.match(app,/const RegistryDropdownFilter/);
  assert.match(app,/<RegistryDropdownFilter label="Deployment owner" placeholder="All owners" icon=\{User\}/);
  assert.match(app,/assignmentRoster\.people\.map\(\(person:any\)=>\(\{value:person\.id,label:person\.name\}\)\)/);
  assert.match(app,/className="nb-type-filter-menu" role="listbox" aria-label=\{label\}/);
});

test('owners menu has a visible thin vertical thumb despite the global important hide rule',()=>{
  assert.match(css,/\.nb113-owner-filter \.nb-type-filter-menu\s*\{[\s\S]*?scrollbar-width:thin!important/);
  assert.match(css,/\.nb113-owner-filter \.nb-type-filter-menu\s*\{[\s\S]*?scrollbar-color:#9bb7d9 #eef4fb!important/);
  assert.match(css,/\.nb113-owner-filter \.nb-type-filter-menu::-webkit-scrollbar\s*\{[\s\S]*?display:block!important;[\s\S]*?width:7px!important/);
  assert.match(css,/\.nb113-owner-filter \.nb-type-filter-menu::-webkit-scrollbar-thumb/);
  assert.match(css,/\.nb113-owner-filter \.nb-type-filter-menu::-webkit-scrollbar-thumb:hover/);
});

test('native vertical scrolling and the existing max-height remain in place',()=>{
  assert.match(css,/\.nb96-dropdown-filter \.nb-type-filter-menu\s*\{[\s\S]*?max-height:min\(360px,65vh\)/);
  assert.match(css,/\.nb113-owner-filter \.nb-type-filter-menu\s*\{[\s\S]*?overflow-y:auto;/);
  assert.match(css,/scrollbar-gutter:stable/);
  assert.match(app,/onClick=\{\(\)=>choose\(item\.value\)\}/);
  assert.match(app,/event\.key==='Escape'/);
});
