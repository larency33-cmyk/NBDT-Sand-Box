import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path=>readFileSync(new URL(path,import.meta.url),'utf8');
const component=read('../src/assignment-page-v052.tsx');
const css=read('../nbdt-assignment-v052.css');
const block=css.split('/* v0.6.120 —')[1]||'';
test('every employee gets a real inset colored card inside a white table cell',()=>{
 assert.match(component,/className="nb120-header-card"/);
 assert.match(component,/nb119-page nb120-page/);
 assert.match(block,/background:#fff!important/);
 assert.match(block,/margin:0 4px/);
 assert.match(block,/border-radius:12px/);
});
test('all five pastel palettes are applied to the inner card, not only its cell',()=>{
 for(const color of ['#edf5ff','#f2efff','#ebfaf8','#fff7ed','#fff0f6'])assert.ok(block.includes(`background:${color}`));
});
test('headers keep existing name size, badge size and drag interactions',()=>{
 assert.match(css,/\.nb118-page \.nb52-person strong\{[^}]*font-size:13\.5px/);
 assert.match(css,/\.nb118-page \.nb52-person \.nb52-avatar\{[^}]*width:33\.6px/);
 assert.match(component,/ref=\{setPersonDrag\}/);
 assert.match(component,/ref=\{setItemTarget\}/);
 assert.match(component,/className="nb56-column-grip"/);
 assert.match(component,/navigateColumns\(1\)/);
});
