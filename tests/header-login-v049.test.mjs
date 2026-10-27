import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const app=read('../index.tsx');
const tracker=read('../src/workspace.tsx');
const css=read('../nbdt-layout-v049.css');
const old=read('../nbdt-layout-v046.css');
const view=tracker.slice(tracker.indexOf('return <section className="nb-tracker" data-view="overview">'));

test('Issue Tracker title inherits the same 15px origin as the other page titles',()=>{
 assert.match(old,/--nb46-workspace-inset:\s*15px/);
 assert.match(css,/\.nb34-issues\s*\{[^}]*padding-left:var\(--nb46-workspace-inset, 15px\)!important/s);
 assert.match(css,/\.nb34-issues>\.nb34-hero\s*\{[^}]*margin-inline:0!important/s);
 assert.match(css,/\.nb34-hero \.nb34-heading-row\.nb45-primary-header/);
 assert.match(css,/padding-top:33px!important/);
});
test('Sign in is portaled to document body, not clipped by application layout',()=>{
 assert.match(app,/import \{ createPortal \} from 'react-dom';/);
 assert.match(app,/showAdminAuthModal&&createPortal\(<LoginModal[^;]*document\.body\)/);
 assert.match(css,/body>\.nb47-modal-scrim\s*\{[^}]*inset:0!important;/s);
 assert.match(css,/body>\.nb47-modal-scrim\s*\{[^}]*height:100dvh!important;/s);
 assert.match(css,/z-index:10000!important/);
});
test('Weekly Tracker title has no Share view or Add task action buttons',()=>{
 const header=view.slice(0,view.indexOf('</header>'));
 assert.match(header,/<h1>Weekly Tracker<\/h1>/);
 assert.doesNotMatch(header,/Share view|Add task|className="nb-actions"/);
 // The task creation form inside the assignment panel remains available.
 assert.match(tracker,/className="nb-quick-add-buttons"/);
});
test('new v0.6.49 style layer loads after older styles',()=>{
 assert.ok(app.indexOf("import './nbdt-layout-v049.css';")>app.indexOf("import './nbdt-access-v048.css';"));
});
