import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGuide,STAGES,counts} from '../src/model.mjs';
import {guideReviewKey,loadGuideReview,changeGuideCheck,acceptGuideReviewStage} from '../src/guide-review.mjs';
import {mergeProfile,profileView} from '../src/extended-model.mjs';

const source=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const registry=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../guide-interactive-v041.css',import.meta.url),'utf8');
const guide=()=>({...newGuide(),stages:{configuration:[{id:'c1',label:'BIOS Password Set',required:true},{id:'c2',label:'Secure Boot',required:true}],readyForDeployment:[{id:'r1',label:'Software installed',required:true}],deployment:[{id:'d1',label:'Deployment done',required:true}]}});

test('guide-only checks can be saved and accepted sequentially',()=>{
 const config=guide();let progress=loadGuideReview(null,config);
 assert.deepEqual(progress.checks,{});
 progress=changeGuideCheck(progress,config,'configuration','c1',true);
 assert.equal(progress.checks.c1,true);
 assert.throws(()=>acceptGuideReviewStage(progress,config,'configuration'),/Complete required/);
 progress=changeGuideCheck(progress,config,'configuration','c2',true);
 progress=acceptGuideReviewStage(progress,config,'configuration');
 assert.ok(progress.accepted.configuration);
 progress=changeGuideCheck(progress,config,'readyForDeployment','r1',true);
 progress=acceptGuideReviewStage(progress,config,'readyForDeployment');
 progress=changeGuideCheck(progress,config,'deployment','d1',true);
 progress=acceptGuideReviewStage(progress,config,'deployment');
 assert.equal(Object.keys(progress.accepted).length,3);
 assert.equal(progress.checks.d1,true);
});
test('editing an accepted step reopens this and all following stages',()=>{
 const config=guide();let progress=loadGuideReview(null,config);
 for(const [stage,ids] of [['configuration',['c1','c2']],['readyForDeployment',['r1']],['deployment',['d1']]]){
  for(const id of ids)progress=changeGuideCheck(progress,config,stage,id,true);
  progress=acceptGuideReviewStage(progress,config,stage);
 }
 progress=changeGuideCheck(progress,config,'configuration','c2',false);
 assert.deepEqual(progress.accepted,{});
 assert.equal(progress.checks.c1,true);
 assert.equal(progress.checks.c2,false);
});
test('guide modifications invalidate stale guide-level verification only',()=>{
 const config=guide();let progress=loadGuideReview(null,config);
 progress=changeGuideCheck(progress,config,'configuration','c1',true);
 assert.equal(loadGuideReview(progress,config).checks.c1,true);
 const changed=structuredClone(config);changed.stages.configuration[0].label='New BIOS policy';
 assert.notEqual(guideReviewKey(config),guideReviewKey(changed));
 assert.deepEqual(loadGuideReview(progress,changed).checks,{});
});
test('Guide checklist progress does not fabricate registered deployment counts',()=>{
 const sys={id:'system-1',devices:[],deviceRuns:[],guideReview:{checks:{c1:true},accepted:{configuration:'2026-10-27'}}};
 assert.deepEqual(counts(sys),{total:0,base:0,ready:0,deployed:0});
});
test('Guide review and lessons persist for endpoint profile updates',()=>{
 const sys={id:'system-1',name:'Main',devices:[],deviceRuns:[],endpointProfiles:[{id:'p1',name:'Secondary',os:'Windows'}]};
 const profile=profileView(sys,'p1');
 const merged=mergeProfile(sys,{...profile,guideReview:{guideKey:'a',checks:{c1:true}},lessonsLearnedItems:[{id:'x',text:'Lesson',checked:true}]});
 assert.equal(merged.endpointProfiles[0].guideReview.checks.c1,true);
 assert.equal(merged.endpointProfiles[0].lessonsLearnedItems[0].checked,true);
});
test('card pencil changes description only, while section pencils edit Guide in place',()=>{
 assert.match(registry,/aria-label=\{`Edit description for \$\{sys.name\}`\}/);
 assert.match(registry,/onUpdateDescription=\{/);
 assert.match(registry,/system\.id===id\?\{\.\.\.system,description\}:system/);
 for(const part of ['device','network','access'])assert.ok(source.includes("onEdit('"+part+"')"),part);
 for(const part of ['applications','lessons','checklist'])assert.ok(source.includes("beginEdit('"+part+"')"),part);
 assert.ok(source.includes('Save checks'));
 assert.ok(source.includes('onClick={saveSection}'));
 assert.ok(source.includes('lessonsLearnedItems'));
});
test('three-chevron strip avoids old rotated diamond and has responsive layout',()=>{
 assert.match(css,/\.nb41-stage-arrows button/);
 assert.match(css,/clip-path:polygon/);
 assert.match(css,/button:not\(:last-child\)::after\{display:none!important/);
 assert.match(css,/@media\(max-width:610px\)/);
 assert.match(registry,/import '\.\/guide-interactive-v041.css'/);
});
