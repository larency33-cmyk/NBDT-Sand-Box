import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url);
const css=readFileSync(new URL('weekly-tracker-approved-v016.css',base),'utf8');
const redesign=readFileSync(new URL('redesign.css',base),'utf8');
const index=readFileSync(new URL('index.tsx',base),'utf8');
const tracker=readFileSync(new URL('src/workspace.tsx',base),'utf8');

test('approved tracker does not force sidebar to icon-only mode',()=>{
 assert.doesNotMatch(css,/\.nbdt-redesign:has\(\.nb-tracker\)\s*>\s*aside/);
 assert.doesNotMatch(css,/82px!important/);
 assert.match(redesign,/\.nbdt-redesign>aside\s*\{[^}]*width:218px/s);
 assert.match(index,/useState\(true\)/);
 assert.match(index,/isSidebarExpanded\s*\?\s*'w-72'\s*:\s*'w-20'/);
 assert.match(index,/setIsSidebarExpanded\(!isSidebarExpanded\)/);
 assert.match(index,/Configuration Report/);
});

test('footer remains a measured mirror of four actual week headers',()=>{
 const section=tracker.slice(tracker.indexOf('export function Tracker('),tracker.indexOf('export function Report('));
 assert.match(section,/querySelectorAll<HTMLTableCellElement>\('thead tr > th'\)/);
 assert.match(section,/getBoundingClientRect\(\)\.width/);
 assert.match(section,/grid-template-columns/);
 assert.match(section,/new ResizeObserver\(update\)/);
 assert.match(section,/index===0&&<B disabled=\{week<=0\}/);
 assert.match(section,/index===3&&<B disabled=\{week>=516\}/);
 assert.match(css,/--nb-week-space: 6px/);
 assert.match(css,/border-radius:12px 12px 0 0!important/);
});

test('Today remains under Project weeks with a calendar icon',()=>{
 const section=tracker.slice(tracker.indexOf('export function Tracker('),tracker.indexOf('export function Report('));
 assert.match(section,/<strong>Project weeks<\/strong>/);
 assert.match(section,/<CalendarDays size=\{17\} aria-hidden="true"\/> Today/);
});
