import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../nbdt-assignment-v052.css',import.meta.url),'utf8');
const tsx=readFileSync(new URL('../src/assignment-page-v052.tsx',import.meta.url),'utf8');
const update=css.split('/* v0.6.121 —')[1]||'';
test('Assignment includes v121 scope without changing drag and drop or navigation',()=>{
 assert.match(tsx,/nb120-page nb121-page/);
 assert.match(tsx,/ref=\{setPersonDrag\}/);
 assert.match(tsx,/className="nb56-column-grip"/);
 assert.match(tsx,/navigateColumns\(1\)/);
});
test('every adjacent pair of employee headers has same 4px gap as first Project edge',()=>{
 assert.match(update,/\.nb121-page \.nb120-header-card\{\s*margin-inline:2px/);
 assert.match(update,/\.nb121-page \.nb52-project-th \+ \.nb52-person \.nb120-header-card\{\s*margin-left:4px/);
 assert.match(css,/\.nb120-page \.nb52-person,[\s\S]*background:#fff!important/);
});
test('two-line names cannot push dates on top of the move handle',()=>{
 assert.match(update,/grid-template-rows:34px 33px 12px 14px/);
 assert.match(update,/\.nb56-header-inner > strong\{[\s\S]*max-height:33px/);
 assert.match(update,/\.nb56-header-inner > small\{[\s\S]*margin:0/);
 assert.match(css,/\.nb118-page \.nb52-person strong\{\s*font-size:13\.5px/);
 assert.match(css,/\.nb118-page \.nb52-person \.nb52-avatar\{\s*width:33\.6px/);
});
