import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../weekly-tracker-corporate-v026.css', import.meta.url), 'utf8');
const entry = fs.readFileSync(new URL('../index.tsx', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../src/workspace.tsx', import.meta.url), 'utf8');

test('corporate week colors are applied after existing visual styles', () => {
  assert.ok(entry.includes("import './weekly-tracker-corporate-v026.css';"));
  assert.ok(entry.indexOf("import './weekly-tracker-task-actions-v024.css';") < entry.indexOf("import './weekly-tracker-corporate-v026.css';"));
  for (const tone of ['blue','violet','orchid','mint']) {
    assert.match(css, new RegExp(`thead th\\.nb-week-tone-${tone}`));
    assert.match(css, new RegExp(`\\.nb-quick-panel-heading\\.nb-week-tone-${tone}`));
  }
});

test('corporate palette is visual only and leaves model / navigation untouched', () => {
  const rulesOnly = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(rulesOnly, /(?:sidebar|nb-side|nb-navigation|nb-system-registry|nb-report)/i);
  assert.doesNotMatch(rulesOnly, /(?:grid-template-columns|width:|min-width:|max-width:|margin-left|margin-right|position:\s*absolute)/);
  assert.match(src, /nb-week-grid/);
  assert.match(src, /nb-week-wide-card/);
});

test('current week is clear and assignment cards remain readable', () => {
  assert.match(css, /th\.nb-current-week-column \.nb-week-head/);
  assert.match(css, /border:2px solid #1177ec!important/);
  assert.match(css, /td\.nb-current-week-cell \.nb-week-cell/);
  assert.match(css, /linear-gradient\(180deg,#fff 0%,#fbfdff 100%\)/);
});

test('status semantics remain distinct from the four-week palette', () => {
  assert.doesNotMatch(css, /\.nb-mini-task \.[^{]*badge|\.nb-metric-(active|done|blocked|planned)/);
  assert.match(css, /nb-ms-complete/);
  assert.match(css, /nb-ms-critical/);
});
