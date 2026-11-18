import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGuide} from '../src/model.mjs';
import {parseGuideExcel, applyGuideExcelImport, findGuideField, GUIDE_FIELD_GROUPS} from '../src/guide-excel-import.mjs';
import {registryCardFields, registryVisualType, deviceModelValue, DEVICE_TYPES} from '../src/registry-metadata.mjs';

const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const guide=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const icons=readFileSync(new URL('../src/device-type-icon.tsx',import.meta.url),'utf8');

const OHC=`OHC - On the Go\tDOCS
Hardware deployment and configuration required
Deployment Training
Endpoint
Lenovo ThinkPad T14 GEN 5
PLATFORM\tNETWORK TYPE\tVLAN\tIP SCOPE\tRESERVATION
Windows\tWired/WiFi\t10\t10.xxx.75.xx\t10.185.75.207 - 209
SERVICE ACCOUNT\tUSER ACCOUNT\tAUTH TYPE\tDOMAIN/OU\tAIRWATCH TAGS
N/A\tAll GSOs (241 to 260)\tUser AD Logon\tWorkstation > Tablets > Oracle Hospitality Cruise\tN/A
Naming Convention
xxFRTMOBILF01
Applications List
• MSCM
• Crowd Strike
Check list - base configuration
• Install latest approved Windows
• Setup BIOS - Secure Boot is ON`;

test('Device Type and Device Model are distinct semantic fields',()=>{
 assert.equal(findGuideField('Device type'),'deviceCategory');
 assert.equal(findGuideField('Device model'),'deviceModel');
 assert.equal(findGuideField('Endpoint'),'deviceModel');
 assert.equal(GUIDE_FIELD_GROUPS[1][1][0][0],'deviceModel');
 assert.ok(DEVICE_TYPES.includes('PC'));
});

test('OHC screenshot template: ignore hardware banner and import short description separately from Lenovo model',()=>{
 const {fields,stages}=parseGuideExcel({text:OHC});
 assert.equal(fields.name,'OHC - On the Go');
 assert.equal(fields.description,'Deployment Training');
 assert.equal(fields.deviceModel,'Lenovo ThinkPad T14 GEN 5');
 assert.equal(fields.deviceType,'Lenovo ThinkPad T14 GEN 5'); // legacy model storage compatibility
 assert.equal(fields.os,'Windows');
 assert.equal(fields.network,'Wired/WiFi');
 assert.equal(fields.vlan,'10');
 assert.match(fields.appList,/MSCM\nCrowd Strike/);
 assert.deepEqual(stages.configuration,['Install latest approved Windows','Setup BIOS - Secure Boot is ON']);
 assert.ok(!JSON.stringify(fields).includes('Hardware deployment and configuration required'));
});

test('Reimport repairs previously corrupted Description and model without losing selected PC category',()=>{
 const old={name:'OHC - On the Go', description:'Lenovo ThinkPad T14 GEN 5',deviceType:'PC',deviceCategory:'PC',guideDraft:{...newGuide(),technicalSnapshot:{deviceType:'PC',deviceCategory:'PC',os:'Windows'},stages:{configuration:[],readyForDeployment:[],deployment:[]}},lessonsLearnedItems:[{id:'one',lessonLearned:'Legacy'}]};
 const next=applyGuideExcelImport(old,old.guideDraft,parseGuideExcel({text:OHC}),()=> 'new-step');
 assert.equal(next.description,'Deployment Training');
 assert.equal(next.guideDraft.technicalSnapshot.deviceCategory,'PC');
 assert.equal(next.guideDraft.technicalSnapshot.deviceModel,'Lenovo ThinkPad T14 GEN 5');
 assert.equal(next.guideDraft.technicalSnapshot.deviceType,'Lenovo ThinkPad T14 GEN 5');
 assert.equal(registryCardFields(next).model,'Lenovo ThinkPad T14 GEN 5');
 assert.equal(registryCardFields(next).description,'Deployment Training');
 assert.equal(registryVisualType(next),'PC');
 assert.deepEqual(next.lessonsLearnedItems,old.lessonsLearnedItems);
});

test('Device Type remains authoritative even if name or hardware model suggests another icon',()=>{
 for(const category of DEVICE_TYPES){
  const sys={name:'POS Mobility Kiosk',deviceCategory:category,deviceModel:'iPad Tablet TC22'};
  assert.equal(registryVisualType(sys),category);
 }
});

test('A newly created PC without an actual hardware model never displays PC as Device Model',()=>{
 const system={name:'New',deviceType:'PC',deviceCategory:'PC'};
 assert.equal(deviceModelValue(system),'');
 assert.equal(registryCardFields(system).model,'—');
 assert.equal(registryVisualType(system),'PC');
});

test('Importing an explicit Device Type does not overwrite Device Model',()=>{
 const initial={deviceCategory:'Phone',deviceModel:'Samsung Galaxy XCover 7',deviceType:'Samsung Galaxy XCover 7'};
 const base={...newGuide(),technicalSnapshot:initial};
 const parsed=parseGuideExcel({text:'Device type: Tablet\nEndpoint: Lenovo ThinkPad T14 GEN 5\nDescription: Testing devices'});
 const after=applyGuideExcelImport({name:'Example',...initial},base,parsed,()=> 'id');
 assert.equal(after.guideDraft.technicalSnapshot.deviceCategory,'Tablet');
 assert.equal(after.guideDraft.technicalSnapshot.deviceModel,'Lenovo ThinkPad T14 GEN 5');
 assert.equal(after.description,'Testing devices');
 assert.equal(registryVisualType(after),'Tablet');
});

test('No inferred description from a hardware model when there was no descriptive line',()=>{
 const parsed=parseGuideExcel({text:'OHC - On the Go\nHardware deployment and configuration required\nEndpoint\nLenovo ThinkPad T14 GEN 5\nPLATFORM\nWindows'});
 assert.equal(parsed.fields.name,'OHC - On the Go');
 assert.equal(parsed.fields.description,undefined);
 assert.equal(parsed.fields.deviceModel,'Lenovo ThinkPad T14 GEN 5');
});

test('Both Registry and Guide consume the same SVG component and the Guide uses actual model',()=>{
 assert.match(app,/import \{DeviceTypeIcon\} from '\.\/src\/device-type-icon'/);
 assert.match(app,/<DeviceTypeIcon type=\{type\} className=\{className\} \/>/);
 assert.match(guide,/import \{DeviceTypeIcon\} from '\.\/device-type-icon'/);
 assert.match(guide,/registryVisualType\(\{\.\.\.sys,guideDraft:/);
 assert.match(guide,/deviceModelValue\(\{deviceModel:values\.deviceModel,deviceType:values\.deviceType\}\)/);
 for(const type of DEVICE_TYPES)assert.ok(icons.includes(`case '${type}'`));
 assert.match(guide,/field\('deviceCategory','Device type',DEVICE_TYPES\)/);
 assert.match(guide,/field\('deviceModel','Device model'\)/);
 assert.match(app,/\['Device model',fields\.model\]/);
});

test('Excel HTML clipboard: merged first title row and short intro description are recognized',()=>{
 const textNode=value=>({nodeType:3,nodeValue:value});
 const td=value=>({nodeType:1,tagName:'TD',childNodes:[textNode(value)]});
 const lines=[
  ['OHC - On the Go','DOCS'],
  ['Hardware deployment and configuration required'],
  ['Deployment venue'],
  ['Endpoint'],
  ['Lenovo ThinkPad T14 GEN 5'],
  ['PLATFORM','NETWORK TYPE','VLAN'],
  ['Windows','Wired/WiFi','10']
 ];
 const rows=lines.map(line=>({children:line.map(td)}));
 class Parser{parseFromString(){return {querySelector(){return {querySelectorAll(){return rows;}};}};}}
 const parsed=parseGuideExcel({html:'<table>sample</table>',text:'not useful',Parser});
 assert.equal(parsed.fields.name,'OHC - On the Go');
 assert.equal(parsed.fields.description,'Deployment venue');
 assert.equal(parsed.fields.deviceModel,'Lenovo ThinkPad T14 GEN 5');
 assert.equal(parsed.fields.os,'Windows');
 assert.equal(parsed.fields.network,'Wired/WiFi');
 assert.equal(parsed.fields.vlan,'10');
});
