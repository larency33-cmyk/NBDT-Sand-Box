import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const css=read('../nbdt-assignment-v052.css');
const jsx=read('../src/assignment-page-v052.tsx');
const pkg=JSON.parse(read('../package.json'));
const section=css.split('/* v0.6.118 —')[1]??'';
test('version 118 is scoped to Assignment and retains existing header markup',()=>{
 assert.equal(pkg.version,'0.6.118');
 assert.match(jsx,/nb52-page nb54-page nb114-page nb116-page nb117-page nb118-page/);
 assert.match(jsx,/className="nb52-avatar" aria-hidden="true"/);
 assert.match(jsx,/className="nb56-column-grip"/);
});
test('employee names grow exactly 35% from original 10px to 13.5px',()=>{
 assert.match(css,/\.nb52-person strong\{[^}]*font-size:10px/);
 assert.match(section,/\.nb118-page \.nb52-person strong\{[^}]*font-size:13\.5px/);
});
test('avatar circles and letters increase exactly 20% while staying circular',()=>{
 assert.match(css,/\.nb52-avatar\{[^}]*width:28px;height:28px;border-radius:100%/);
 assert.match(section,/\.nb118-page \.nb52-person \.nb52-avatar\{[^}]*width:33\.6px;[^}]*height:33\.6px;[^}]*font-size:15\.6px/);
});
test('border matches each header palette without gray inset border or shadow',()=>{
 assert.match(section,/\.nb118-page \.nb52-person\{[^}]*background-clip:border-box;[^}]*box-shadow:none/);
 for(const hex of ['#edf5ff','#f2efff','#ebfaf8','#fff7ed','#fff0f6']){
  assert.ok(section.includes(`border-right-color:${hex};`));
  assert.ok(section.includes(`border-bottom-color:${hex};`));
 }
 assert.match(css,/\.nb117-page \.nb52-person\{[^}]*border-radius:12px 12px 10px 10px/);
});
test('task typography, drag feedback, grid navigation and row heights preserved',()=>{
 assert.match(css,/\.nb117-page \.nb52-assignment-name\{[^}]*font-size:12\.5px;[^}]*font-weight:400/);
 assert.match(css,/\.nb52-project-row\{[^}]*height:49px/);
 assert.match(jsx,/navigateColumns\(-1\)/);
 assert.match(jsx,/navigateColumns\(1\)/);
 assert.match(jsx,/nb117-insertion-before/);
 assert.match(jsx,/nb117-insertion-after/);
 assert.doesNotMatch(section,/\.nb52-assignment-name/);
});
