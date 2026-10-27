import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const css=read('../nbdt-layout-v046.css');
const app=read('../index.tsx');
const previous=read('../nbdt-layout-v045.css');

test('alignment layer follows approved v0.6.45 typography after all previous CSS',()=>{
 const before=app.indexOf("import './nbdt-layout-v045.css';");
 const after=app.indexOf("import './nbdt-layout-v046.css';");
 assert.ok(before>0&&after>before,'v046 must be the final CSS import');
 assert.match(previous,/--nb45-heading-inset:15px/);
 assert.match(css,/--nb46-workspace-inset:\s*15px/);
});
test('Registry heading and the filters/cards use the same root horizontal inset',()=>{
 assert.match(css,/\.nb-registry-page\s*\{\s*padding-inline:var\(--nb46-workspace-inset\)!important/s);
 assert.match(css,/\.nb-registry-page>\.nb-registry-heading\.nb45-primary-header\s*\{\s*margin-inline:0!important/s);
});
test('Issue Tracker heading is not shifted separately from the issue board',()=>{
 assert.match(css,/\.nb34-issues\s*\{\s*padding-inline:var\(--nb46-workspace-inset\)!important/s);
 assert.match(css,/\.nb34-issues>\.nb34-hero\s*\{\s*margin-inline:0!important/s);
});
test('Configuration Report KPIs, title and action alignment share the new inset',()=>{
 assert.match(css,/\.nb-report-shell>\.nb-report\s*\{\s*padding-left:var\(--nb46-workspace-inset\)!important;\s*padding-right:var\(--nb46-workspace-inset\)!important/s);
 assert.match(css,/\.nb-report-shell>\.nb-report>\.nb45-primary-header\s*\{\s*margin-inline:0!important/s);
 assert.match(css,/\.nb-report-shell>\.nb-report-top-actions\s*\{\s*right:var\(--nb46-workspace-inset\)!important/s);
});
test('existing Weekly Tracker geometry and backend behavior are not changed',()=>{
 assert.doesNotMatch(css,/\.nb-tracker(?:\[|\s|\{|>)/);
 assert.match(app,/filteredSystems\.map\(sys=>/);
 assert.match(app,/onProjectStartChange=\{async\(value:string\)=>/);
});
