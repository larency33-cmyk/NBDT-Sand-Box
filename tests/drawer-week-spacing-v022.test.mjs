import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const style=readFileSync(new URL('../weekly-tracker-drawer-v022.css',import.meta.url),'utf8');
const entry=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const drawer=source.slice(source.indexOf('function QuickAssignmentRow('),source.indexOf('export function Tracker('));
const panel=source.slice(source.indexOf('{selected&&createPortal('),source.indexOf('{memberPendingDeletion&&isAdmin'));

test('drawer is an overlay and a standalone CSS layer loaded after previous tracker styles',()=>{
 assert.match(panel,/nb-project-week-drawer/);
 assert.ok(entry.indexOf("weekly-tracker-drawer-v022.css") > entry.indexOf("weekly-tracker-premium-v021.css"));
 assert.match(style,/position:absolute!important/);
});
test('tasks use universal ordinal labels rather than per-category icons or redundant Owner text',()=>{
 assert.match(drawer,/String\(number\)\.padStart\(2,'0'\)/);
 assert.match(drawer,/nb-drawer-task-index/);
 assert.doesNotMatch(drawer,/nb-quick-role|nb-quick-task-meta|ownerName/);
 assert.match(panel,/number=\{index\+1\}/);
});
test('existing status save, blocked reason and advanced edit remain accessible',()=>{
 assert.match(drawer,/onQuickTaskSave\(task\.id/);
 assert.match(drawer,/value=\{showBlocker\?'Blocked':actualStatus\}/);
 assert.match(drawer,/Reason for blocking/);
 assert.match(drawer,/Move to next week/);
 assert.match(drawer,/onQuickTaskEdit\(task.id,\{label:draft.label\}\)/);
});
test('drawer includes four status cards, compact assignments, quick add and authentication-safe edit entry',()=>{
 assert.match(panel,/nb-drawer-stats/);
 assert.doesNotMatch(panel,/nb-drawer-milestone-section/);
 assert.match(panel,/nb-drawer-assignments-heading/);
 assert.match(panel,/nb-quick-add-form/);
 assert.match(panel,/closeQuickPanel\(\);onAuth\(\)/);
 assert.match(style,/grid-template-columns:35px minmax\(0,1fr\)!important/);
 assert.match(style,/min-height:32px!important/);
});
test('footer weekdays span seven equal tracks with legacy middle-card restriction overridden',()=>{
 assert.match(style,/grid-template-columns:repeat\(7,minmax\(0,1fr\)\)!important/);
 assert.match(style,/\.nb-week-wide-card:last-child \.nb-week-wide-days/);
 assert.match(style,/padding-right:0!important/);
});
test('header to assignments gap uses the same token as horizontal column spacing',()=>{
 assert.match(style,/tbody tr:first-child td/);
 assert.match(style,/padding-top:var\(--nb-week-space,6px\)!important/);
});
