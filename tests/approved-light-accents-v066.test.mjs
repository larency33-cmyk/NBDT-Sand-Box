import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync(new URL('../redesign.css',import.meta.url),'utf8');
const tracker=fs.readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const source=fs.readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const section=css.slice(css.indexOf('v0.6.6 — APPROVED LIGHT ACCENT HIERARCHY'));

test('approved v0.6.6 visuals explicitly keep the light theme',()=>{
 assert.match(section,/--wk-neutral:\s*#fbfdff/i);
 assert.match(section,/--wk-current-bg:\s*#eaf4ff/i);
 assert.match(section,/background:\s*#f7fbff!important/i);
 assert.doesNotMatch(section,/background:\s*#0[0-9a-f]{5}\s*!important/i);
});

test('current project week is uniquely accented in the matrix and footer',()=>{
 assert.match(section,/\.nb-current-week-column\s*\{/);
 assert.match(section,/\.nb-current-week-cell\s*\{/);
 assert.match(section,/\.nb-week-wide-selected\s*\{/);
 assert.match(section,/inset 0 3px 0 var\(--wk-primary\)/);
});

test('alternating four columns remain calm and milestone banners are quiet',()=>{
 assert.match(section,/tbody td:nth-child\(3\)/);
 assert.match(section,/tbody td:nth-child\(4\)/);
 assert.match(section,/tbody td\.nb-current-week-cell/);
 assert.match(section,/\.nb-ms-standard/);
 assert.match(section,/\.nb-ms-complete/);
 assert.match(section,/\.nb-milestone-empty/);
});

test('semantic statuses remain recognizable without recoloring entire tasks',()=>{
 for(const name of ['planned','completed','blocked','in-progress'])
  assert.match(section,new RegExp('\\.nb-status-'+name+'\\s*\\{'));
 assert.match(section,/\.nb-week-grid \.nb-mini-task\s*\{/);
});

test('approved wide week cards align to real matrix columns and respect arrow space',()=>{
 assert.match(css,/\.nb-week-card-grid\s*\{[^}]*grid-template-columns:var\(--nb-employee-width,220px\) repeat\(4,minmax\(0,1fr\)\)/s);
 assert.match(section,/\.nb-week-wide-card:last-child\s*\{margin-right:94px\}/);
 assert.match(tracker,/nb-week-card-grid/);
 assert.match(tracker,/nb-week-wide-days/);
 assert.match(tracker,/nb-week-day-today/);
});

test('overlay assignment panel still uses portal and cannot compress the matrix',()=>{
 assert.match(tracker,/createPortal\(/);
 assert.match(tracker,/nb-quick-overlay-backdrop/);
 assert.match(tracker,/nb-overlay-panel/);
 assert.match(css,/\.nb-assignment-panel\.nb-quick-panel\.nb-overlay-panel\s*\{[^}]*position:fixed!important/s);
});

test('only Overview remains; project weeks and today are dynamic',()=>{
 assert.match(tracker,/nb-overview-only-tab/);
 assert.doesNotMatch(tracker,/\['Overview','List'\]/);
 assert.doesNotMatch(tracker,/Master Timeline/);
 assert.match(tracker,/projectWeekDays\(project.startDate,w\)/);
 assert.match(tracker,/day\.date===todayDate/);
 assert.match(source,/\.\/redesign\.css/);
});
