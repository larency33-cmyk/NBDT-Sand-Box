import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../redesign.css',import.meta.url),'utf8');
const tracker=source.slice(source.indexOf('export function Tracker('),source.indexOf('export function Report('));
const overlayCss=css.slice(css.indexOf('/* v0.6.4 - Layered quick assignment drawer.'));

test('assignment overlay is a React body portal, outside the matrix flex container',()=>{
 assert.match(source,/import\s*\{createPortal\}\s*from\s*'react-dom'/);
 assert.match(tracker,/<\/div>\s*<\/div>\s*\{selected&&createPortal\(<>/);
 assert.match(tracker,/document\.body\)\}/);
 assert.ok(tracker.includes('nb-quick-overlay-backdrop'));
 assert.ok(tracker.includes('nb-overlay-panel'));
 assert.ok(!tracker.includes('{selected&&<aside className="nb-assignment-panel'));
});
test('fixed overlay width is independent of table width, preserving full four-week matrix',()=>{
 assert.match(overlayCss,/\.nb-assignment-panel\.nb-quick-panel\.nb-overlay-panel\s*\{/);
 assert.match(overlayCss,/position:fixed!important/);
 assert.match(overlayCss,/width:min\(490px,calc\(100vw - 32px\)\)!important/);
 assert.match(overlayCss,/z-index:9999!important/);
 assert.match(overlayCss,/\.nb-quick-overlay-backdrop\s*\{[^}]*position:fixed/s);
 assert.match(tracker,/className="nb-tracker-content"/);
 assert.match(tracker,/className="nb-tracker-table-wrap"/);
});
test('overlay supports escape, close button, backdrop, restored focus, and keyboard containment',()=>{
 assert.match(tracker,/role="dialog" aria-modal="true"/);
 assert.match(tracker,/panelRef\.current\?\.focus\(\)/);
 assert.match(tracker,/target\?\.isConnected\)target\.focus\(\)/);
 assert.match(tracker,/event\.key==='Escape'/);
 assert.match(tracker,/event\.key!=='Tab'/);
 assert.match(tracker,/onClick=\{closeQuickPanel\}/);
 assert.match(tracker,/unsaved assignment\?/);
});
test('small screens present a full-screen, internally scrolling assignment panel',()=>{
 assert.match(overlayCss,/@media\(max-width:760px\)/);
 assert.match(overlayCss,/width:100vw!important;height:100dvh!important/);
 assert.match(overlayCss,/\.nb-overlay-panel \.nb-quick-list\{min-height:0;max-height:none;overflow-y:auto/);
 assert.match(overlayCss,/@media\(prefers-reduced-motion:reduce\)/);
});
test('fast task changes and inline assignment creation remain wired to the original save functions',()=>{
 assert.ok(tracker.includes('onQuickTaskSave={onQuickTaskSave}'));
 assert.ok(tracker.includes('onQuickTaskCreate({label,memberId:selected.id,startWeek:selected.week})'));
 assert.ok(tracker.includes('className="nb-quick-add-form"'));
});
