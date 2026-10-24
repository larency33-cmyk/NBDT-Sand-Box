import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const base=new URL('../',import.meta.url);
const source=readFileSync(new URL('src/workspace.tsx',base),'utf8');
const ui=source.slice(source.indexOf('export function Tracker('),source.indexOf('export function Report('));
const css=readFileSync(new URL('weekly-tracker-approved-v016.css',base),'utf8');
const index=readFileSync(new URL('index.tsx',base),'utf8');

test('final approved mockup image is included for visual review',()=>{
 assert.ok(existsSync(new URL('design_references/approved_weekly_tracker_2026-10-24_final.png',base)));
});
test('latest approved CSS loads AFTER legacy redesign stylesheet',()=>{
 assert.ok(index.indexOf("import './redesign.css'")>=0);
 assert.ok(index.indexOf("import './weekly-tracker-approved-v016.css'")>index.indexOf("import './redesign.css'"));
});
test('footer uses measured DOM header widths, including fractional pixels, not independent guesses',()=>{
 assert.match(ui,/const tracks=headers\.map\(cell=>cell\.getBoundingClientRect\(\)\.width\)/);
 assert.match(ui,/setProperty\('grid-template-columns',tracks\.map\(value=>/);
 assert.match(ui,/setProperty\('width',`\$\{tracks\.reduce/);
 assert.match(ui,/new ResizeObserver\(update\)/);
 assert.match(ui,/onScroll=\{syncWeekScroll\}/);
});
test('navigation arrows physically live INSIDE first and last week shells',()=>{
 assert.match(ui,/className=\{'nb-week-nav-shell '/);
 assert.match(ui,/index===0&&<B disabled=\{week<=0\}/);
 assert.match(ui,/index===3&&<B disabled=\{week>=516\}/);
 assert.match(ui,/nb-week-nav-first/);
 assert.match(ui,/nb-week-nav-last/);
 assert.match(css,/\.nb-week-nav-first \.nb-weeks-prev \{left:/);
 assert.match(css,/\.nb-week-nav-last \.nb-weeks-next \{right:/);
 assert.doesNotMatch(ui,/<div className="nb-week-navigation-right"/);
});
test('Today remains a real, prominent shortcut under Project weeks',()=>{
 assert.match(ui,/<strong>Project weeks<\/strong>/);
 assert.match(ui,/className="nb-go-today nb-today-action"/);
 assert.match(ui,/<CalendarDays size=\{17\} aria-hidden="true"\/> Today/);
 assert.match(ui,/selectWeek\(currentWeek\);setWeek\(clampWeekViewport\(currentWeek\)\)/);
 assert.match(css,/background:#0876f3!important;color:#fff!important/);
});
test('the full-grid enclosing border is removed; each weekly header is rounded exactly once',()=>{
 assert.match(css,/\.nb-tracker-table-wrap\s*\{[^}]*border:0!important/);
 assert.match(css,/\.nb-week-head\s*\{[^}]*border-radius:12px 12px 0 0!important/s);
 assert.match(css,/thead th:not\(:first-child\)\s*\{[^}]*border-radius:0!important/s);
 assert.match(css,/--nb-week-space: 6px/);
});
test('current-week visual state is distinct from selected week',()=>{
 assert.match(ui,/currentWeek===w/);
 assert.match(ui,/w===selectedWeek/);
 assert.match(css,/\.nb-week-wide-card\.nb-week-wide-current/);
 assert.match(css,/\.nb-week-wide-card\.nb-week-wide-selected/);
});
