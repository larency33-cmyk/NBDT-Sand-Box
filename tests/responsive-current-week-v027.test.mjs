import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../weekly-tracker-viewport-v027.css', import.meta.url),'utf8');
const entry=readFileSync(new URL('../index.tsx', import.meta.url),'utf8');

test('desktop compact view adapts heights to screen without global browser zoom',()=>{
  assert.match(css,/@media\s*\(min-width:\s*1050px\)\s*and\s*\(max-height:\s*900px\)/);
  assert.match(css,/--nb-uniform-task-height:\s*clamp\(130px,\s*calc\(\(100dvh\s*-\s*383px\)\s*\/\s*3\),\s*174px\)/);
  assert.doesNotMatch(css,/(^|[\s;{])zoom\s*:/m);
});
test('thick blue border appears on task cards of actual current week only',()=>{
  assert.match(css,/td\.nb-current-week-cell\.nb-populated-week\s+\.nb-week-cell/);
  assert.match(css,/border-left:\s*5px solid #1680ee\s*!important/);
  assert.doesNotMatch(css,/\.nbdt-redesign>aside|\.nb-sidebar/);
});
test('laptop density preserves readable tasks and overflow link',()=>{
  assert.match(css,/@media\s*\(min-width:\s*1050px\)\s*and\s*\(max-height:\s*790px\)/);
  assert.match(css,/\.nb-week-grid\s+\.nb-more\s*\{[^}]*line-height:\s*16px/s);
  assert.match(css,/\.nb-week-grid\s+\.nb-mini-task\s*\{[^}]*min-height:\s*17px/s);
});
test('new CSS loads after the approved and corporate style layers',()=>{
  const oldIndex=entry.indexOf("import './weekly-tracker-corporate-v026.css'");
  const newIndex=entry.indexOf("import './weekly-tracker-viewport-v027.css'");
  assert.ok(oldIndex>0&&newIndex>oldIndex);
});
test('responsive rules leave footer geometry and navigation controls untouched',()=>{
  assert.doesNotMatch(css,/grid-template-columns\s*:/);
  assert.doesNotMatch(css,/translate3d\s*\(/);
  assert.doesNotMatch(css,/\.nb-weeks-next|\.nb-weeks-prev/);
});
