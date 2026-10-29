import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ws=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const assignment=readFileSync(new URL('../src/assignment-page-v052.tsx',import.meta.url),'utf8');
const report=ws.slice(ws.indexOf('export function Report('),ws.indexOf('export function Overview('));
const css=readFileSync(new URL('../nbdt-report-v059.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');

test('Assignment contains search and owner controls but no CSV export button',()=>{
 assert.match(assignment,/Search assignments/);
 assert.doesNotMatch(assignment,/Export CSV|exportRoster|nb52-export/);
});
test('Columns picker is gone, all columns are visible, and header sorting remains intact',()=>{
 assert.doesNotMatch(report,/nb-report-column-picker|setHidden\(/);
 assert.match(report,/const hidden:string\[\]=\[\]/);
 assert.match(report,/onClick=\{\(\)=>changeSort\(key\)\}/);
 assert.match(report,/aria-sort=/);
 assert.match(css,/repeat\(3,minmax\(140px,1fr\)\)/);
});
test('New system creation does not mutate search, filters or current sort',()=>{
 const open=report.slice(report.indexOf('const openEditor='),report.indexOf('const saveEditor='));
 const save=report.slice(report.indexOf('const saveEditor='),report.indexOf('const deleteEditor='));
 for(const x of ['setQuery(','setScope(','setOwner(','setCyber(','setVenue(','setSort(','setSortDirection(']){
  assert.ok(!open.includes(x),`openEditor must not call ${x}`);
  assert.ok(!save.includes(x),`saveEditor must not call ${x}`);
 }
 assert.match(save,/if\(!original\)setRecentlyCreatedId\(next.id\)/);
 assert.match(report,/\}\)\.sort\(compare\)/);
});
test('New row is identified by ID, smoothly revealed and softly pulses exactly three times',()=>{
 assert.match(report,/newlyCreatedIsVisible/);
 assert.match(report,/requestAnimationFrame\(/);
 assert.match(report,/scrollIntoView\(\{block:'nearest',inline:'nearest',behavior:'smooth'\}\)/);
 assert.match(report,/nb59-new-system-highlight/);
 assert.match(css,/animation:nb59-new-system-pulse 1s ease-in-out 3 both/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('Report action-button gap is transparent to the surrounding page',()=>{
 assert.match(css,/\.nb-report-shell \.nb-report-top-actions > div:last-child/);
 assert.match(css,/background-color: transparent !important/);
 assert.match(app,/nbdt-report-v059.css/);
});
