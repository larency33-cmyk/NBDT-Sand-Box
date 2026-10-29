import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app = readFileSync(new URL('../index.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../nbdt-report-v059.css', import.meta.url), 'utf8');
const reportHeader = app.match(/<header className="([^"]*nb-report-top-actions[^"]*)"/);

test('Export / Import toolbar does not receive the dark-theme class that global CSS paints white', () => {
  assert.ok(reportHeader, 'Report toolbar header must exist');
  assert.match(reportHeader[1], /bg-transparent/);
  assert.doesNotMatch(reportHeader[1], /bg-\[\#020617\]|bg-\[\#0a0f1d\]|bg-slate-950|bg-slate-900/);
});

test('Higher-specificity scoped rule overrides global backgrounds for toolbar and buttons gap', () => {
  assert.match(css, /\.nbdt-redesign\.nb-app-root main \.nb-report-shell > \.nb-report-top-actions \{/);
  assert.match(css, /\.nb-report-top-actions > div:last-child \{/);
  assert.match(css, /background-color: transparent !important/);
  assert.match(css, /background-image: none !important/);
});
