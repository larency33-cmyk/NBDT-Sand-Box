import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const app=file('../index.tsx');
const tracker=file('../src/workspace.tsx');
const issue=file('../src/issue-tracker-v034.tsx');
const css=file('../nbdt-layout-v045.css');

test('four workspace titles share the v0.6.45 typography contract',()=>{
 assert.match(tracker,/className="nb-page-header nb45-primary-header"[^]*?<h1>Weekly Tracker<\/h1>/);
 assert.match(app,/className="nb-registry-heading nb45-primary-header"[^]*?<h1>System Registry<\/h1>/);
 assert.match(issue,/className="nb34-heading-row nb45-primary-header"[^]*?<h1>Issue Tracker<\/h1>/);
 assert.match(tracker,/className="nb-page-header nb45-primary-header"[^]*?<h1>Configuration Report<\/h1>/);
 for(const token of ['--nb45-heading-size:32px','--nb45-heading-weight:770','--nb45-heading-inset:15px','font-size:var(--nb45-heading-size)!important'])assert.ok(css.includes(token),token);
 assert.match(app,/import '\.\/nbdt-layout-v045\.css'/);
});
test('no duplicated breadcrumbs above Weekly Tracker or Issue Tracker',()=>{
 assert.doesNotMatch(tracker,/className="nb-tracker-breadcrumb"/);
 assert.doesNotMatch(issue,/className="nb34-breadcrumb"/);
});
test('system registry maps the complete filtered list, without navigation controls or page state',()=>{
 assert.match(app, /filteredSystems\.map\(sys=>/);
 assert.match(app,/Showing all \{filteredSystems\.length\} systems/);
 for(const s of ['systemPage','setSystemPage','nb-registry-pagination','nb-page-number'])assert.doesNotMatch(app,new RegExp(s));
 assert.match(app,/filteredSystems\.map\(s=>\[/); // CSV export retains all systems
});
test('sidebar is fixed-width independent of Weekly Tracker route',()=>{
 assert.match(css,/\.nbdt-redesign\.nb-app-root:has\(\.nb-tracker\)>aside\[data-expanded="true"\]/);
 assert.match(css,/width:232px!important; flex:0 0 232px!important; min-width:232px!important/);
 assert.match(css,/width:72px!important;flex:0 0 72px!important;min-width:72px!important/);
});
test('all scrollbar chrome hidden but registry document scroll and matrix scrolling preserved',()=>{
 assert.match(css,/\.nbdt-redesign\.nb-app-root \*\{scrollbar-width:none!important/);
 assert.match(css,/\*::-webkit-scrollbar\{[^}]*display:none!important/s);
 assert.match(css,/main:has\(> \.nb-registry-page\)\{[^}]*overflow-y:auto!important/s);
 assert.match(tracker,/onScroll=\{syncWeekScroll\}/);
});
