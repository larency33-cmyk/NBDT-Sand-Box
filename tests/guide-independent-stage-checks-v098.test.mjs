import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STAGES,setCheck,canAccept} from '../src/model.mjs';
import {changeGuideCheck} from '../src/guide-review.mjs';

const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const sample=()=>({guideKey:'sample',checks:{},results:{},accepted:{}});
const guide={stages:Object.fromEntries(STAGES.map((stage,index)=>[stage,[{id:String(index),label:stage,required:true}]]))};

test('Configuration Guide checkboxes are never disabled by prior stage status',()=>{
 const checkbox=ui.match(/<input type="checkbox" aria-label=\{item\.label\} checked=\{!!reviewRun\.checks\?\.\[item\.id\]\} disabled=\{[^}]+\}/)?.[0];
 assert.ok(checkbox,'The checklist checkbox must exist');
 assert.match(checkbox,/disabled=\{!isAdmin\|\|saving\|\|!!editingSection\}/);
 assert.doesNotMatch(checkbox,/STAGES|accepted/);
});
test('guide verification accepts out-of-order checkmarks but not out-of-order stage acceptance',()=>{
 const marked=changeGuideCheck(sample(),guide,'deployment','2',true);
 assert.equal(marked.checks['2'],true);
 assert.equal(canAccept({...marked,snapshot:guide},'deployment'),false);
 const withReady=changeGuideCheck(marked,guide,'readyForDeployment','1',true);
 assert.equal(withReady.checks['1'],true);
 assert.equal(withReady.checks['2'],true);
});
