import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moveWeekViewport} from '../src/week-navigation.mjs';

const css=readFileSync(new URL('../redesign.css',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const fix=css.slice(css.indexOf('v0.6.10 — Navigation and search-focus stability'));

test('footer is clipped, not an independent native scrolling region',()=>{
 assert.match(fix,/\.nb-week-card-scroller\s*\{[^}]*overflow:clip!important/s);
 assert.match(fix,/overflow-x:clip!important/);
 assert.match(fix,/overflow-y:clip!important/);
 assert.match(ui,/const cards=footer\?\.querySelector<HTMLElement>\('\.nb-week-card-grid'\)/);
 assert.match(ui,/cards\.style\.transform=`translate3d\(\$\{-table\.scrollLeft\}px,0,0\)`/);
});

test('navigation arrows change weeks, with no scroll-wheel or native scroll action',()=>{
 const body=ui.slice(ui.indexOf('const navigateWeek='),ui.indexOf('const closeQuickPanel='));
 assert.match(body,/const next=moveWeekViewport\(week,direction\)/);
 assert.match(body,/resetWeekScroll\(\)/);
 assert.match(body,/setWeek\(next\)/);
 assert.match(ui,/onClick=\{\(\)=>navigateWeek\(1\)\} aria-label="Next project week"/);
 assert.equal(moveWeekViewport(0,1),1);
 assert.equal(moveWeekViewport(1,1),2);
 assert.equal(moveWeekViewport(0,-1),0);
});

test('reset also clears visual translation after arrow click and Today',()=>{
 assert.match(ui,/const resetWeekScroll=\(\)=>/);
 assert.match(ui,/cards\.style\.transform='translate3d\(0px,0,0\)'/);
 assert.match(ui,/resetWeekScroll\(\);selectWeek\(currentWeek\);setWeek\(clampWeekViewport\(currentWeek\)\)/);
});

test('search input has no inner focus outline; only the outer box gets a subtle ring',()=>{
 assert.match(fix,/\.nb-search-box:focus-within\s*\{[^}]*outline:none!important/s);
 assert.match(fix,/box-shadow:0 0 0 2px rgba\(34,118,214,\.12\)!important/);
 assert.match(fix,/\.nb-search-box input:focus-visible\s*\{[^}]*outline:none!important/s);
 assert.match(fix,/box-shadow:none!important;border:0!important/);
 assert.match(ui,/className="nb-search-box"/);
});

test('only visual controls change; local data and task editing remain wired',()=>{
 assert.match(ui,/onQuickTaskSave=\{onQuickTaskSave\}/);
 assert.match(ui,/onQuickTaskCreate\(\{label,memberId:selected.id,startWeek:selected.week\}\)/);
 assert.match(ui,/ref=\{tableScrollRef\} onScroll=\{syncWeekScroll\}/);
});

test('Chromium and Firefox hide the native week-grid scrollbar UI without disabling scrolling',()=>{
 const finalFix=css.slice(css.indexOf('v0.6.11 — Native-scrollbar'));
 assert.doesNotMatch(finalFix,/scrollbar-width:auto!important/);
 assert.match(finalFix,/\.nb-tracker-table-wrap\{[^}]*overflow-x:auto!important;[^}]*overflow-y:auto!important;[^}]*scrollbar-width:none!important/s);
 assert.match(finalFix,/\.nb-tracker-table-wrap::-webkit-scrollbar,[\s\S]*?display:none!important;[\s\S]*?width:0!important;/);
 assert.match(finalFix,/main\{[^}]*overflow-x:clip!important;[^}]*overflow-y:auto!important;[^}]*scrollbar-width:none!important;/s);
 assert.match(finalFix,/\.nb-week-navigation-right\{[^}]*z-index:30!important/s);
});
