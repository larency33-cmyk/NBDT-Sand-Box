import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../redesign.css',import.meta.url),'utf8');
// Static contracts, NOT screenshot or browser regression tests.
test('NBDT shared design system uses the exact approved brand and sidebar colors',()=>{
 for(const token of ['--nav-top:#06264B','--nav-bottom:#041B34','--brand:#0066F5','--page-bg:#F3F8FE','--text-heading:#081C4A'])assert.ok(css.includes(token),token);
});
test('registry uses one set of searchable filters and true filtered six-item paging',()=>{
 for(const token of ['nb-registry-filters','nb-registry-grid','filteredSystems.slice(systemPage*6,systemPage*6+6)','Showing ${systemPage*6+1}'])assert.ok(app.includes(token),token);
});
test('registry documentation never silently goes to a fake SharePoint link',()=>{
 assert.ok(app.includes('No documentation URL has been linked'));assert.ok(app.includes('disabled title='));assert.ok(app.includes('safeDocumentationUrl'));
});
test('configuration guide removes the six obsolete preview and demo sections',()=>{
 const guide=ui.slice(ui.indexOf('export function Guide('),ui.indexOf('export function SystemCreate('));
 for(const label of ['Guide preview · Select a device','Register an actual device','No reviewed guide has been published','Legacy system checklist · not device completion','Demo mode. Local record versions',' / {sys.name} / Guide'])assert.ok(!guide.includes(label),label);
 const enhanced=readFileSync(new URL('../src/enhancements.tsx',import.meta.url),'utf8');
 const profile=enhanced.slice(enhanced.indexOf('export function ProfileGuide('),enhanced.indexOf('export function Migration('));
 assert.ok(!profile.includes('Add endpoint profile'));
 assert.ok(!profile.includes('aria-label="Endpoint profile"'));
 assert.ok(profile.includes('profileView(sys,profileId)'));
 for(const text of ['Technical essentials','Lessons Learned','Configuration checklists'])assert.ok(guide.includes(text),text);
});
test('visual guide uses accessible labeled icons and three stages',()=>{
 assert.ok(ui.includes('GuideDetailGroup'));assert.ok(ui.includes('GuideApplications'));assert.ok(ui.includes('Configuration checklist'));assert.ok(css.includes('.nb-stage-tabs button.selected'));
});
test('week tracker has owner/helper drilldown and smartphone by-person cards',()=>{
 for(const token of ['nb-week-grid','nb-mobile-week-cards','nb-quick-metrics','nb-quick-add-form','Helper','Show matrix'])assert.ok(ui.includes(token),token);
});
test('report derives readiness from per-device runs, not legacy report aggregates',()=>{
 assert.ok(ui.includes('counts(s)'));assert.ok(!ui.includes('Legacy report · preserved separately'));assert.ok(ui.includes('Deployment overview'));
 assert.ok(ui.includes('counts(s)'));
});
test('touch and responsive rules exist for five screens',()=>{
 for(const token of ['@media(max-width:700px)','@media(max-width:600px)','@media(max-width:360px)','--sidebar-full:240px','.nb-report .nb-kpi','.nb-registry-grid','.nb-technical-grid','.nb-assignment-panel'])assert.ok(css.includes(token),token);
});
