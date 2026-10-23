import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {clampWeekViewport, moveWeekViewport} from '../src/week-navigation.mjs';

const tracker = fs.readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const css = fs.readFileSync(new URL('../redesign.css',import.meta.url),'utf8');
const section = css.slice(css.indexOf('v0.6.7 — WEEK NAVIGATION REGRESSION FIX'));

test('right arrow moves one project week forward each click',()=>{
 assert.equal(moveWeekViewport(0,1),1);
 assert.equal(moveWeekViewport(1,1),2);
 assert.equal(moveWeekViewport(10,1),11);
});
test('left arrow moves one week backward without leaving the project',()=>{
 assert.equal(moveWeekViewport(7,-1),6);
 assert.equal(moveWeekViewport(0,-1),0);
});
test('four consecutive weeks remain visible, even at the end of a 520-week project',()=>{
 assert.equal(moveWeekViewport(515,1),516);
 assert.equal(moveWeekViewport(516,1),516);
 assert.equal(clampWeekViewport(519),516);
 assert.deepEqual(Array.from({length:4},(_,i)=>clampWeekViewport(519)+i),[516,517,518,519]);
});
test('navigation is tied to project weeks, not the internal scroller',()=>{
 assert.match(tracker,/const navigateWeek=\(direction:number\)=>\{/);
 assert.match(tracker,/const next=moveWeekViewport\(week,direction\)/);
 assert.match(tracker,/setWeek\(next\);/);
 assert.match(tracker,/onClick=\{\(\)=>navigateWeek\(1\)\}/);
 assert.match(tracker,/onClick=\{\(\)=>navigateWeek\(-1\)\}/);
 assert.match(tracker,/aria-label="Next project week"/);
});
test('footer is a single-direction mirror and cannot start competing scroll interactions',()=>{
 assert.match(tracker,/ref=\{tableScrollRef\} onScroll=\{syncWeekScroll\}/);
 assert.match(tracker,/ref=\{weekFooterScrollRef\}/);
 assert.doesNotMatch(tracker,/ref=\{weekFooterScrollRef\} onScroll=/);
 assert.match(section,/\.nb-week-card-scroller\s*\{[^}]*overflow-x:hidden!important/s);
 assert.match(section,/\.nb-week-card-scroller::-webkit-scrollbar\s*\{[^}]*display:none!important/s);
 assert.match(section,/::-webkit-scrollbar-button\s*\{[^}]*display:none!important/s);
});
test('today button remains usable with navigation arrows and current date logic',()=>{
 assert.match(tracker,/className="nb-go-today"/);
 assert.match(tracker,/currentWeekIndex\(project.startDate/);
 assert.match(tracker,/weekFooterScrollRef\.current\.scrollLeft=0/);
});
