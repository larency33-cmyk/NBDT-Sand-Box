import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ui=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-registry-v082.css',import.meta.url),'utf8');
const page=ui.slice(ui.indexOf('<section className="nb-registry-page"'),ui.indexOf("{activeTab==='systems' && activeCheckSheetSys"));
const header=page.slice(0,page.indexOf('<div className="nb-registry-filters"'));
const filters=page.slice(page.indexOf('<div className="nb-registry-filters"'),page.indexOf('<div className="nb-registry-meta-row"'));

test('Registry Export disappears and Clear filters takes its place in the top-right actions',()=>{
 assert.ok(header.includes('nb-registry-actions'));
 assert.doesNotMatch(header,/> Export<\/button>/);
 assert.doesNotMatch(header,/NBDT-system-registry\.csv/);
 assert.match(header,/className="nb-button nb87-clear-filters"/);
 assert.match(header,/<FilterX size=\{17\} aria-hidden="true"\/> Clear filters/);
 assert.match(ui,/\bFilterX\b,[\s\S]*?from 'lucide-react'/);
});

test('Clear filters is conditional on search, device type, owner, platform, connection or completion status',()=>{
 assert.match(header,/\{\(activeFilters\.length>0\|\|systemOwnerFilter\|\|systemSearch\.trim\(\)\|\|deviceTypeFilter\|\|systemStatusFilter\)&&<button/);
 assert.equal((page.match(/nb87-clear-filters/g)||[]).length,1);
 assert.doesNotMatch(filters,/Clear filters|nb-clear-filters/);
});

test('Header Clear filters resets all Registry filter fields, including owner and completion status',()=>{
 const match=header.match(/className="nb-button nb87-clear-filters"[^]*?<\/button>/)?.[0];
 assert.ok(match);
 for(const command of ["setSystemSearch('')","setActiveFilters([])","setSystemOwnerFilter('')","setDeviceTypeFilter('')","setSystemStatusFilter('')"]) {
  assert.ok(match.includes(command),command);
 }
 assert.match(header,/<button type="button" className="nb-button nb87-clear-filters"/);
 assert.match(match,/aria-label="Clear system registry filters"/);
});

test('The action remains available to guests and does not change other page exports',()=>{
 const condStart=header.indexOf('{(activeFilters.length');
 const btnEnd=header.indexOf('Clear filters</button>');
 assert.ok(condStart>=0&&btnEnd>condStart);
 assert.doesNotMatch(header.slice(condStart,btnEnd),/isAdmin/);
 assert.match(ui,/Export data/);
});

test('Clear filters styling is scoped to the Registry and has focus and hover states',()=>{
 assert.match(css,/\.nb-registry-page \.nb-registry-actions \.nb87-clear-filters\{/);
 assert.match(css,/\.nb87-clear-filters:hover\{/);
 assert.match(css,/\.nb87-clear-filters:focus-visible\{/);
});
