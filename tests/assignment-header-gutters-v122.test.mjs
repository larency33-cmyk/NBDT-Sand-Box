import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../nbdt-assignment-v052.css',import.meta.url),'utf8');
const tsx=readFileSync(new URL('../src/assignment-page-v052.tsx',import.meta.url),'utf8');
const patch=css.split('/* v0.6.122 —')[1]||'';
test('v122 applies equal 4px gaps above and below the colored headers',()=>{
 assert.match(tsx,/nb121-page nb122-page/);
 assert.match(patch,/margin-block:4px/);
 assert.match(patch,/height:123px/);
 assert.match(patch,/thead th\{height:131px/);
});
test('two-line name row and existing drag handle remain intact',()=>{
 assert.match(css,/grid-template-rows:34px 33px 12px 14px/);
 assert.match(tsx,/className="nb56-column-grip"/);
 assert.match(tsx,/navigateColumns\(1\)/);
});
