import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEVICE_TYPES,guideTechnicalValues,registryCardFields,registryVisualType} from '../src/registry-metadata.mjs';
const index = readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const editor = readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');

test('all seven reference types, including App only, are available',()=>{
 assert.deepEqual(DEVICE_TYPES,['Phone','Tablet','PC','Laptop','Kiosk','POS','App only']);
});
test('cards read the same technicalSnapshot as a published guide',()=>{
 const system={name:'Test',deviceType:'Old model',network:'Wired',os:'Windows',publishedGuide:{technicalSnapshot:{deviceType:'New model',os:'Android',osVersion:'16',network:'WiFi',namingConvention:'ABC',deviceCategory:'Phone'}}};
 assert.equal(guideTechnicalValues(system),system.publishedGuide.technicalSnapshot);
 assert.deepEqual(registryCardFields(system),{model:'New model',os:'Android 16',network:'WiFi',naming:'ABC',category:'Phone',description:''});
 assert.equal(registryVisualType(system),'Phone');
});
test('cards fall back to profile values when guide snapshot absent, not legacy states',()=>{
 const system={name:'Stateroom',deviceCategory:'Tablet',deviceType:'iPad',os:'iOS',network:'WiFi',valueStates:{deviceType:'to_confirm'}};
 assert.equal(registryCardFields(system).model,'iPad');
 assert.equal(registryVisualType(system),'Tablet');
});
test('POS and App only categories produce appropriate symbols',()=>{
 assert.equal(registryVisualType({name:'Main POS',deviceCategory:'POS'}),'POS');
 assert.equal(registryVisualType({name:'Web based',deviceCategory:'App only'}),'App only');
 assert.equal(registryVisualType({name:'Stateroom App',deviceCategory:'Tablet',deviceType:'Hardware Unit'}),'Tablet');
});
test('Device Type icons are in dropdown, not above cards',()=>{
 assert.match(index,/DeviceTypeFilter/);
 assert.match(index,/DEVICE_TYPES\.map/);
 assert.doesNotMatch(index,/<DeviceTypeLegend\s*\/>/);
 assert.match(index,/deviceTypeFilter/);
});
test('editor removes legacy quality state selectors without dropping underlying data',()=>{
 assert.doesNotMatch(editor,/aria-label=\{label\+' value state'\}/);
 assert.doesNotMatch(editor,/field\('valueState','Technical value state'/);
 assert.match(editor,/field\('deviceCategory','Device category'/);
});
