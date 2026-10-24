import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moveWeekViewport} from '../src/week-navigation.mjs';
const css=readFileSync(new URL('../redesign.css',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const block=css.slice(css.indexOf('v0.6.11 — Native-scrollbar'));

test('no conflicting scrollbar-width auto in final native-scrollbar fix',()=>{
 assert.ok(block.length>500);
 assert.doesNotMatch(block,/scrollbar-width:\s*auto\s*!important/);
 assert.match(block,/\.nb-tracker-table-wrap\{[^}]*overflow-x:auto!important;[^}]*overflow-y:auto!important;[^}]*scrollbar-width:none!important/s);
 assert.match(block,/\.nb-week-card-scroller\{[^}]*overflow:clip!important/s);
});

test('desktop document and app-shell scrollbars cannot overlay week navigation',()=>{
 assert.match(block,/html:has\(\.nb-tracker\), body:has\(\.nb-tracker\)/);
 assert.match(block,/\.nbdt-redesign:has\(\.nb-tracker\) main\{[^}]*overflow-x:clip!important;/s);
 assert.match(block,/\.nb-week-navigation-right\{[^}]*z-index:30!important/s);
});

test('previous and next pointer clicks do not trigger scroll-into-view side effects',()=>{
 assert.match(ui,/onClick=\{\(\)=>navigateWeek\(-1\)\}/);
 assert.match(ui,/onClick=\{\(\)=>navigateWeek\(1\)\}/);
 assert.equal(moveWeekViewport(0,1),1);
 assert.equal(moveWeekViewport(1,1),2);
 assert.equal(moveWeekViewport(1,-1),0);
});
