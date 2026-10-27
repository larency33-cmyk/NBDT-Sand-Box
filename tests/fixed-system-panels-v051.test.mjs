import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8');
const app=read('../index.tsx');
const report=read('../src/workspace.tsx');
const css=read('../nbdt-layout-v051.css');
test('v0.6.51 keeps filter/navigation controls outside the System Registry scroll region',()=>{
  const section=app.slice(app.indexOf('<section className="nb-registry-page"'),app.indexOf("{activeTab==='systems' && activeCheckSheetSys"));
  assert.ok(section.indexOf('nb-registry-heading')<section.indexOf('nb51-registry-scroll'));
  assert.ok(section.indexOf('nb-registry-filters')<section.indexOf('nb51-registry-scroll'));
  assert.ok(section.indexOf('nb-registry-meta-row')<section.indexOf('nb51-registry-scroll'));
  assert.ok(section.indexOf('nb-registry-grid')>section.indexOf('nb51-registry-scroll'));
  assert.match(section,/role="region" aria-label="Systems list" tabIndex=\{0\}/);
});
test('Report separates stationary title, KPI and filter panels from vertically scrolling rows',()=>{
  assert.ok(report.indexOf('nb-page-header nb45-primary-header')<report.indexOf('<div className="nb-kpis">'));
  assert.ok(report.indexOf('<div className="nb-readiness-heading">')<report.indexOf('nb-report-filters'));
  assert.ok(report.indexOf('nb-report-filters')<report.indexOf('nb-report-table nb-report-continuous'));
  assert.match(css,/nb-report-readiness-panel\s*>\s*\.nb-report-table\s*\{[^}]*overflow-y:auto!important/s);
  assert.match(css,/nb-report-readiness-panel\s*>\s*\.nb-report-table thead th\s*\{[^}]*position:sticky/s);
});
test('Layout prevents outer vertical scrolling for precisely the two requested routes',()=>{
  assert.match(css,/main:has\(> \.nb-registry-page\)/);
  assert.match(css,/main:has\(> \.nb-report-shell\)/);
  assert.match(css,/overflow-y:hidden!important/);
  assert.match(css,/nb51-registry-scroll\s*\{[^}]*overflow-y:auto!important/s);
  assert.match(css,/::-webkit-scrollbar/);
  assert.doesNotMatch(css,/\.nb-tracker|\.nb34-issues|\.nb-profile-guide/);
  assert.ok(app.indexOf("import './nbdt-layout-v051.css';")>app.indexOf("import './nbdt-layout-v050.css';"));
});
