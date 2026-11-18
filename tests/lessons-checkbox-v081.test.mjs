import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../nbdt-lessons-v081.css',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/lessons-learned-section.tsx',import.meta.url),'utf8');
const entry=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const base=readFileSync(new URL('../redesign.css',import.meta.url),'utf8');

test('v0.6.81 loads after all older Lessons Learned CSS layers',()=>{
  const v79=entry.indexOf("import './nbdt-lessons-v079.css';");
  const v80=entry.indexOf("import './nbdt-lessons-v080.css';");
  const v81=entry.indexOf("import './nbdt-lessons-v081.css';");
  assert.ok(v79>=0 && v80>v79 && v81>v80);
});

test('actual accessibility checkbox remains functional, but only its presentation span is visible',()=>{
  assert.match(ui,/<label className=\{`nb81-review-checkbox/);
  assert.match(ui,/<input className="nb78-confirm-checkbox" type="checkbox" checked=\{review.status==='confirmed'\}/);
  assert.match(ui,/onChange=\{e=>startReview\(e.target.checked\?'confirmed':'pending'\)\}/);
  assert.match(ui,/className="nb81-review-checkbox-box" aria-hidden="true"/);
  assert.match(ui,/<Check size=\{17\} strokeWidth=\{3\}\/>/);
  assert.match(css,/\.nb81-review-checkbox > input\.nb78-confirm-checkbox\s*\{/);
  assert.match(css,/clip-path:inset\(50%\) !important/);
});

test('decorative status control has exactly square dimensions independent of global input padding',()=>{
  assert.match(base,/input,select,textarea\{[^}]*padding:9px 12px/);
  assert.match(base,/\.nbdt-redesign main input,[^}]*background:#fff!important/);
  assert.match(css,/\.nb81-review-checkbox-box\s*\{[^}]*width:26px;\s*height:26px/);
  assert.match(css,/\.nb81-review-checkbox > input\.nb78-confirm-checkbox\s*\{[^}]*padding:0 !important/);
  assert.match(css,/\.nb81-review-checkbox--in-progress \.nb81-review-checkbox-box/);
  assert.match(css,/\.nb81-review-checkbox--confirmed \.nb81-review-checkbox-box/);
});
