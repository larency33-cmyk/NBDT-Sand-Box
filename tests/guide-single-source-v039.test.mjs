import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {guideTechnicalValues,registryCardFields,registryVisualType} from '../src/registry-metadata.mjs';
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const guide=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const profiles=readFileSync(new URL('../src/extended-model.mjs',import.meta.url),'utf8');
const enhancements=readFileSync(new URL('../src/enhancements.tsx',import.meta.url),'utf8');
const rootWorkspace=readFileSync(new URL('../workspace.tsx',import.meta.url),'utf8');

test('saved guide draft is authoritative, even if a published snapshot and legacy profile disagree',()=>{
 const sys={name:'STateroom app',description:'Managed in Guide',deviceCategory:'PC',deviceType:'Old model',os:'Windows',network:'Wired',
   publishedGuide:{technicalSnapshot:{deviceCategory:'Tablet',deviceType:'iPad',os:'iPadOS',network:'Wired',namingConvention:'OLD'}},
   guideDraft:{technicalSnapshot:{deviceCategory:'Phone',deviceType:'Samsung XCover',os:'Android',osVersion:'16',network:'WiFi',namingConvention:'CABIN-{NN}'}}};
 assert.equal(guideTechnicalValues(sys),sys.guideDraft.technicalSnapshot);
 assert.deepEqual(registryCardFields(sys),{model:'Samsung XCover',os:'Android 16',network:'WiFi',naming:'CABIN-{NN}',category:'Phone',description:'Managed in Guide'});
 assert.equal(registryVisualType(sys),'Phone');
});
test('published guide remains the source when no draft is saved',()=>{
 const sys={deviceType:'Legacy device',publishedGuide:{technicalSnapshot:{deviceType:'New model',os:'Android'}}};
 assert.equal(guideTechnicalValues(sys),sys.publishedGuide.technicalSnapshot);
});
test('legacy technical fields are only used as migration fallback before first guide save',()=>{
 const sys={deviceType:'Nino III',deviceCategory:'Kiosk',os:'Windows',osVersion:'10',network:'Wired'};
 assert.equal(guideTechnicalValues(sys),sys);
 assert.equal(registryCardFields(sys).model,'Nino III');
});
test('existing pencil opens inline Guide editing; old SystemEditor is removed',()=>{
 assert.match(app,/onClick=\{\(\)=>openGuideForEdit\(sys\)\}/);
 assert.match(app,/initialEdit=\{guideOpenEdit\}/);
 assert.doesNotMatch(app,/<SystemEditor\b/);
 assert.doesNotMatch(app,/Edit system \/ profile/);
 assert.doesNotMatch(guide,/export function SystemEditor/);
 assert.doesNotMatch(guide,/Edit profile/);
 assert.match(guide,/export function SystemCreate/);
 assert.match(rootWorkspace,/export \* from '\.\/src\/workspace'/);
 assert.doesNotMatch(enhancements,/\bSystemEditor\b/);
});
test('Technical essentials edits the guide snapshot and persists without a parallel form',()=>{
 assert.match(guide,/guideTechnicalValues\(sys\)/);
 assert.match(guide,/technicalSnapshot:\{\.\.\.prev.technicalSnapshot,\[key\]:value\}/);
 assert.match(guide,/guideDraft:guideChanges/);
 assert.match(guide,/publishedGuide:next,guideDraft:null/);
 assert.match(guide,/onDeleteSystem/);
 assert.match(profiles,/name:next.name\?\.trim\(\)\|\|system.name/);
});
