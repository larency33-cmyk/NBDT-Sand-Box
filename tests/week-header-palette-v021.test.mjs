import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {weekHeaderTone} from '../src/week-palette.mjs';

test('week hues follow absolute project week, never four-week viewport position',()=>{
  assert.deepEqual([2,3,4,5].map(weekHeaderTone),['blue','violet','orchid','mint']);
  for(let w=0;w<100;w++)assert.equal(weekHeaderTone(w),weekHeaderTone(w+4));
});
test('invalid project week indexes fail predictably',()=>{
 assert.throws(()=>weekHeaderTone(-1),RangeError);
 assert.throws(()=>weekHeaderTone(NaN),RangeError);
 assert.throws(()=>weekHeaderTone(0.5),RangeError);
});
test('tracker header uses week labels and decorative calendar icon, no date in heading',()=>{
 const src=fs.readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
 assert.match(src,/nb-week-tone-'\+tone/);
 assert.match(src,/className="nb-week-header-label"/);
 assert.match(src,/className="nb-week-range-hint" aria-hidden="true"/);
 const head=src.slice(src.indexOf('{weeks.map(w=>{const columnMilestones'),src.indexOf('</thead>'));
 assert.doesNotMatch(head,/nb-week-head-title[^\n]+\{weekRange/);
 assert.doesNotMatch(head,/nb-week-head-select/);
});
test('premium CSS only scopes overview; milestone statuses remain semantic',()=>{
 const css=fs.readFileSync(new URL('../weekly-tracker-premium-v021.css',import.meta.url),'utf8');
 assert.match(css,/nb-week-tone-violet/);
 assert.match(css,/nb-week-tone-orchid/);
 assert.match(css,/nb-week-tone-mint/);
 assert.match(css,/nb-ms-critical/);
 assert.match(css,/nb-ms-complete/);
 assert.match(css,/nb-ms-review/);
 assert.doesNotMatch(css,/\.nb-sidebar|\.nb-shell|\.nb-app-sidebar/);
 const imp=fs.readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
 assert(imp.indexOf('weekly-tracker-premium-v021.css')>imp.indexOf('weekly-tracker-approved-v016.css'));
});
