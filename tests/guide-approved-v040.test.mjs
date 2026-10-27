import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const guide=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../guide-approved-v040.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
test('v0.6.40 approved guide styles loaded only by application',()=>{assert.ok(app.includes("import './guide-approved-v040.css'")); assert.ok(guide.includes('nb40-guide-page'));});
test('Three guide detail groups use the guide technical data rather than mock hardcoded values',()=>{
 for(const name of ['Device','Network','Access & management']) assert.ok(guide.includes('title="'+name+'"'),name);
 for(const field of ['values.deviceType','values.os','values.vlan','values.ipScope','values.ipReservation','values.domainOU','values.airWatchTags','values.namingConvention']) assert.ok(guide.includes(field),field);
 assert.ok(guide.includes('guideTechnicalValues(sys)'));
});
test('Required applications are displayed in their own purple section with actual appList',()=>{
 assert.ok(guide.includes('<GuideApplications value={technicalValues.appList}/>'));
 assert.ok(guide.includes("String(value||'').split"));
 assert.ok(css.includes('.nb40-applications'));
});
test('Kiosk hero icon, heading icons and Values to confirm are absent while checklists remain',()=>{
 const page=guide.slice(guide.indexOf('return <section className="nb-guide-page nb40-guide-page"'),guide.indexOf('export function SystemCreate'));
 assert.ok(!page.includes('Values to confirm'));
 assert.ok(!page.includes('fieldIcons[k]||Monitor'));
 assert.ok(page.includes('<h1>{editing?identity.name:sys.name}</h1>'));
 assert.ok(page.includes('<span>Technical essentials</span>'));
 assert.ok(page.includes('<h2>Configuration checklist</h2>'));
 assert.ok(page.includes('nb-stage-tabs'));
});
test('Section headings, card titles and technical labels align left and responsive layout is defined',()=>{
 for(const sel of ['.nb40-detail-title h3','.nb40-apps-heading h2','.nb40-guide-page .nb-config-header h2','.nb40-detail-card dt']) assert.ok(css.includes(sel),sel);
 assert.ok(css.includes('text-align:left!important'));
 assert.ok(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
 assert.ok(css.includes('@media(max-width:760px)'));
});
