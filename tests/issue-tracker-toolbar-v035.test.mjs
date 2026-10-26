import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const component = readFileSync(new URL('../src/issue-tracker-v034.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../issue-tracker-v034.css', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('Issue Tracker toolbar v0.6.35 contains three aligned controls and no conflicting native select', () => {
  const toolbar = component.split('<section className="nb34-toolbar"')[1].split('</section>')[0];
  assert.equal((toolbar.match(/<FilterDropdown\b/g) || []).length, 2);
  assert.equal((toolbar.match(/className="nb34-search"/g) || []).length, 1);
  assert.ok(!toolbar.includes('<select'));
  assert.ok(css.includes('grid-template-columns:minmax(0,1fr) minmax(185px,242px) minmax(185px,242px)'));
});

test('nested input cannot mask the single search border', () => {
  assert.ok(css.includes('.nbdt-redesign main.nb34-issues .nb34-search input'));
  assert.ok(css.includes('background:transparent!important'));
  assert.ok(css.includes('border:0!important'));
  assert.ok(css.includes('height:100%!important'));
  assert.ok(css.includes('.nb34-search:focus-within'));
});

test('assignee and severity filters retain selection, keyboard and outside-click semantics', () => {
  for(const name of ['issueSeverityFilter','setIssueSeverityFilter','assigneeFilter','setAssigneeFilter','project.members']) {
    assert.ok(component.includes(name), name);
  }
  for(const text of ['aria-haspopup="listbox"','aria-expanded={open}','aria-selected={choice.value===value}',
    "event.key==='Escape'", 'ArrowDown','ArrowUp','document.addEventListener(\'pointerdown\'','onClick={()=>select(choice)}']) {
    assert.ok(component.includes(text), text);
  }
  assert.ok(component.includes("setIssueSearch('');setIssueSeverityFilter('');setAssigneeFilter('');"));
});

test('dropdowns use restrained colors, fixed borders and responsive grids', () => {
  assert.ok(css.includes('.nb34-dropdown-option--selected'));
  assert.ok(css.includes('border:1px solid #c9dcf2'));
  assert.ok(css.includes('@media(max-width:950px)'));
  assert.ok(css.includes('@media(max-width:560px)'));
  assert.ok(Number(pkg.version.split('.').at(-1))>=35, 'Issue Tracker toolbar introduced in v0.6.35');
});
