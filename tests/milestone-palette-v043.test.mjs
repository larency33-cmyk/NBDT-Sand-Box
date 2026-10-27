import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../weekly-tracker-milestone-harmony-v043.css',import.meta.url),'utf8');
const imports=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');

test('v0.6.43 palette styles load after the previous milestone interaction styles',()=>{
 assert.ok(imports.includes("import './weekly-tracker-milestone-harmony-v043.css';"));
 assert.ok(imports.indexOf("weekly-tracker-milestone-harmony-v043.css")>imports.indexOf("weekly-tracker-milestones-v042.css"));
});
test('current week uses the blue palette even when its recurring tone is different',()=>{
 assert.match(css,/th\.nb-current-week-column\s*\{[^}]*--week-bg-a:#d8ebff;[^}]*--week-accent:#1177ec;/s);
});
test('expanded milestones become part of one entire absolutely overlaid week header',()=>{
 assert.match(css,/\.nb-week-head:is\(:hover,:focus-within\):has\(\.nb-milestone-multiple\)/);
 assert.match(css,/position:absolute!important;[^}]*height:auto!important;/s);
 assert.match(css,/border-radius:12px!important;/);
 assert.match(css,/\.nb-milestone-stack\.nb-milestone-multiple\.nb-milestone-expanded/);
});
test('expanded stack does not paint another colored tray or border',()=>{
 assert.match(css,/\.nb-milestone-stack\.nb-milestone-multiple\.nb-milestone-expanded\s*\{[^}]*position:relative!important;[^}]*background:transparent!important;[^}]*border:0!important;/s);
});
test('milestone chips and edit/add controls follow the inherited week color',()=>{
 assert.match(css,/\.nb-milestone-chip:is\(\.nb-ms-complete,\.nb-ms-critical,\.nb-ms-review\)/);
 assert.match(css,/color:var\(--week-text\)!important;/);
 assert.match(css,/border-left:3px solid var\(--week-accent\)!important;/);
 assert.match(css,/\.nb-milestone-edit,\.nb-milestone-add,\.nb-milestone-more/);
});
