import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const tracker=readFileSync(new URL('src/workspace.tsx',root),'utf8');
const css=readFileSync(new URL('weekly-tracker-overview-v023.css',root),'utf8');
const app=readFileSync(new URL('index.tsx',root),'utf8');

test('Weekly Tracker contains no List view, legacy state, List toggle or extra header date',()=>{
 assert.match(tracker,/data-view="overview"/);
 assert.match(tracker,/nb-overview-only-tab/);
 assert.doesNotMatch(tracker,/nb-task-list|nb-list-heading|setView\(|\['Overview','List'\]/);
 assert.doesNotMatch(tracker,/\{`\$\{weekRange\(project\.startDate,week\)\}/);
 assert.match(tracker,/url\.searchParams\.delete\('view'\)/);
 assert.match(tracker,/className="nb-tracker-breadcrumb"/);
 assert.match(tracker,/\{weekRange\(project\.startDate,w\)\}/);
});
test('Overview-only styling aligns top week titles left without changing sidebar',()=>{
 assert.match(css,/\.nb-week-head-top/);
 assert.match(css,/justify-content:flex-start!important/);
 assert.match(css,/\.nb-week-header-label/);
 assert.match(css,/text-align:left!important/);
 assert.match(css,/\.nb-overview-only-tab/);
 assert.doesNotMatch(css,/nb-sidebar|nb-side-nav/);
 assert.match(app,/import '\.\/weekly-tracker-overview-v023\.css'/);
});
