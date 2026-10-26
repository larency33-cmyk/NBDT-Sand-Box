import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const component=readFileSync(new URL('../src/issue-tracker-v034.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../issue-tracker-v034.css',import.meta.url),'utf8');
const main=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
test('Issue Tracker v0.6.34 replaces only the Issues view',()=>{
 assert.ok(main.includes("import {IssueTrackerBoard} from './src/issue-tracker-v034'"));
 assert.ok(main.includes("<IssueTrackerBoard"));
 assert.ok(main.includes("{activeTab === 'config-report' && ("));
 assert.ok(main.includes("import './configuration-report-inline-v033.css'"));
});
test('approved board keeps four issue statuses and prominent content',()=>{
 for(const label of ['Open','Investigating','Waiting for Parts','Resolved'])assert.ok(component.includes(label));
 assert.ok(component.includes('nb34-card-text'));
 assert.ok(component.includes('issue.description'));
 assert.ok(component.includes('nb34-card-meta'));
 assert.ok(!component.includes('<ShieldAlert'));
 assert.ok(component.includes('<h1>Issue Tracker</h1>'));
});
test('search filters and creation reuse project state',()=>{
 for(const p of ['issueSearch','issueSeverityFilter','assigneeFilter','setDraftIssue','setShowAdminAuthModal'])assert.ok(component.includes(p));
 assert.ok(component.includes('setNodeRef'));
 assert.ok(component.includes('useDroppable'));
});
test('light board is responsive and uses restrained status colors',()=>{
 for(const sel of ['.nb34-board','.nb34-column','.nb34-card','.nb34-empty','.nb34-heading-row'])assert.ok(css.includes(sel));
 assert.ok(css.includes('grid-template-columns:repeat(4'));
 assert.ok(css.includes('@media(max-width:560px)'));
});
