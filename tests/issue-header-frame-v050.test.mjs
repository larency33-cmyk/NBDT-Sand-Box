import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const layer = read('../nbdt-layout-v050.css');
const app = read('../index.tsx');
const issue = read('../src/issue-tracker-v034.tsx');
const base = read('../redesign.css');
test('Issue heading uses the same centered and capped content frame as its search, summary, and board', () => {
  assert.match(base, /main>section,\.nbdt-redesign main>div:not\(\[class\*="fixed"\]\)\{width:100%;max-width:var\(--content-max\);margin-inline:auto\}/);
  assert.match(issue, /<main className="nb34-issues">\s*<header className="nb34-hero">/);
  assert.match(layer, /\.nb34-issues\s*>\s*\.nb34-hero\s*\{[^}]*width:\s*100%\s*!important;[^}]*max-width:\s*var\(--content-max\)\s*!important;[^}]*margin-inline:\s*auto\s*!important/s);
});
test('Issue heading correction is the final layout layer after previous overrides', () => {
  assert.ok(app.indexOf("import './nbdt-layout-v050.css';") > app.indexOf("import './nbdt-layout-v049.css';"));
});
test('No other workspace, issue filters, statuses, or app behavior is affected', () => {
  assert.doesNotMatch(layer, /nb-registry-page|nb-tracker|nb-report|nb34-board|nb34-toolbar|nb34-card/);
});
