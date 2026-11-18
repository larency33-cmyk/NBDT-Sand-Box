import test from 'node:test';
import assert from 'node:assert/strict';
import {parseGuideExcel,applyGuideExcelImport} from '../src/guide-excel-import.mjs';
import {newGuide} from '../src/model.mjs';
import {registryCardFields} from '../src/registry-metadata.mjs';

// Real user example. The Excel copy has text before Endpoint, a hardware model,
// 5 simultaneous hardware headers, the standalone Naming Convention label,
// and FALSE values after each checklist item.
const PRINT_SHOP=`OHC – Print Shop
DOCS
Hardware deployment and configuration required 🖥
Deployment venue
Endpoint
LENOVO - DESKTOP TC M75Q WIN11
PLATFORM\tNETWORK TYPE\tVLAN\tIP SCOPE\tRESERVATION
Windows\tWired\t10\tVlan 10\tN/A
SERVICE ACCOUNT\tUSER ACCOUNT\tAUTH TYPE\tDOMAIN OU\tAIRWATCH TAGS
N/A\t235, 236, 237\tUser AD Logon\tWorkstation > Front Desk\tN/A
Naming Convention
xxBATCHP01
Applications List
• MSCM
• Crowd Strike
• Fidelio
• TimeZone Service
• Lenovo System Update
• Evolis Quantum2 Set up Driver
• HID Omnikey RFID reader driver
• Visionline
• OMNIKEY Workbench Tool
• FortinacAgent (DOUBLE CHECK IF NEEDED)
• ZScaller (ONLY DURING DEPLOYEMENT AFTER ZScaller tunneling is enabled)
Check list - base configuration
• Install latest approved Windows (Shoud be LTSC version, double check with Lead and Product Owner)
FALSE
• Setup BIOS - Secure Boot is ON
FALSE
• Setup BIOS password - Coordinate password with Shipboard ITM and Team Lead
FALSE
• Run Windows updates
FALSE
Check list - ready for deployment
• Label the PC and Quantum printer
FALSE
• Sign in to each PC with each user to setup profiles.
FALSE
• Configure Quantum printer - Refer to “How to install and configure Evolis Quantum Card Printer with RFID”
FALSE
• Review lessons learned and make sure corrective action applied for this ship
FALSE
Check list - deployment
• Validate few devices with Shipboard IT
FALSE
• Support QAT and UAT if applicable
FALSE
• Complete the Deployment Sign-Off Sheet
FALSE`;

function expectedCore(fields){
 assert.equal(fields.name,'OHC – Print Shop');
 assert.equal(fields.description,'Deployment venue');
 assert.equal(fields.deviceModel,'LENOVO - DESKTOP TC M75Q WIN11');
 assert.equal(fields.namingConvention,'xxBATCHP01');
 assert.equal(fields.os,'Windows');
 assert.equal(fields.network,'Wired');
 assert.equal(fields.vlan,'10');
 assert.equal(fields.serviceAccount,'N/A');
 assert.equal(fields.userAccount,'235, 236, 237');
 assert.equal(fields.domainOU,'Workstation > Front Desk');
}

test('OHC – Print Shop: text clipboard maps description, endpoint and naming independently',()=>{
 const parsed=parseGuideExcel({text:PRINT_SHOP});
 expectedCore(parsed.fields);
 assert.deepEqual(parsed.unrecognized,[]);
 assert.equal(parsed.stages.configuration.length,4);
 assert.equal(parsed.stages.readyForDeployment.length,4);
 assert.equal(parsed.stages.deployment.length,3);
 assert.ok(parsed.stages.readyForDeployment.at(-1).includes('Review lessons learned'));
});

test('Imported user example fixes previously incorrect registry data without deleting checklists or lessons',()=>{
 const original={
  id:'system-ohc',name:'OHC – Print Shop',description:'Deployment venue\nLENOVO - DESKTOP TC M75Q WIN11',deviceCategory:'PC',
  guideDraft:{...newGuide(),technicalSnapshot:{deviceCategory:'PC',os:'Windows',deviceModel:'',deviceType:'',namingConvention:''},stages:{configuration:[],readyForDeployment:[],deployment:[]}},
  lessonsLearnedItems:[{id:'lesson-1',lessonLearned:'Example'}],
 };
 const parsed=parseGuideExcel({text:PRINT_SHOP});
 const result=applyGuideExcelImport(original,original.guideDraft,parsed,()=>`step-new`);
 const values=registryCardFields(result);
 assert.equal(values.model,'LENOVO - DESKTOP TC M75Q WIN11');
 assert.equal(values.description,'Deployment venue');
 assert.equal(values.naming,'xxBATCHP01');
 assert.equal(values.category,'PC');
 assert.equal(result.guideDraft.stages.readyForDeployment.length,4);
 assert.deepEqual(result.lessonsLearnedItems,original.lessonsLearnedItems);
});

function fakeParserFor(rows){
 const td=text=>({tagName:'TD',nodeType:1,childNodes:[{nodeType:3,nodeValue:text}]});
 return class FakeDOMParser{
  parseFromString(){return {querySelector(){return {querySelectorAll(){return rows.map(row=>({children:row.map(td)}));}};}};}
 };
}

test('Merged Excel HTML loses Endpoint & Naming: plain text recovers both without losing HTML checklists',()=>{
 const htmlRows=[
  ['OHC – Print Shop','DOCS'],
  ['Hardware deployment and configuration required'],
  ['Deployment venue\nLENOVO - DESKTOP TC M75Q WIN11'],
  ['PLATFORM','NETWORK TYPE','VLAN','IP SCOPE','RESERVATION'],
  ['Windows','Wired','10','Vlan 10','N/A'],
  ['SERVICE ACCOUNT','USER ACCOUNT','AUTH TYPE','DOMAIN OU','AIRWATCH TAGS'],
  ['N/A','235, 236, 237','User AD Logon','Workstation > Front Desk','N/A'],
  ['Applications List'],['• MSCM'],['• Crowd Strike'],
  ['Check list - base configuration'],
  ...Array.from({length:15},(_,i)=>[`• Test setup step ${i+1}`]),
  ['Check list - ready for deployment'],
  ...Array.from({length:12},(_,i)=>[`• Test readiness step ${i+1}`]),
  ['Check list - deployment'],
  ...Array.from({length:12},(_,i)=>[`• Test deployment step ${i+1}`]),
 ];
 const parsed=parseGuideExcel({text:PRINT_SHOP,html:'<table></table>',Parser:fakeParserFor(htmlRows)});
 expectedCore(parsed.fields);
 assert.equal(parsed.stages.configuration.length,15);
 assert.equal(parsed.stages.readyForDeployment.length,12);
 assert.equal(parsed.stages.deployment.length,12);
 assert.doesNotMatch(parsed.fields.description,/LENOVO/);
 assert.ok(!parsed.unrecognized.includes('xxBATCHP01'));
});

test('HTML-only collapsed introduction identifies model instead of appending it to description',()=>{
 const rows=[
  ['OHC – Print Shop'],['Hardware deployment and configuration required'],
  ['Deployment venue LENOVO - DESKTOP TC M75Q WIN11'],
  ['PLATFORM','NETWORK TYPE'],['Windows','Wired'],
  ['Naming Convention xxBATCHP01'],
 ];
 const parsed=parseGuideExcel({html:'<table></table>',Parser:fakeParserFor(rows)});
 expectedCore({...parsed.fields,vlan:'10',serviceAccount:'N/A',userAccount:'235, 236, 237',domainOU:'Workstation > Front Desk'});
 assert.equal(parsed.fields.description,'Deployment venue');
 assert.equal(parsed.fields.deviceModel,'LENOVO - DESKTOP TC M75Q WIN11');
 assert.equal(parsed.fields.namingConvention,'xxBATCHP01');
});

test('Do not guess a device model out of a normal human-readable description',()=>{
 const parsed=parseGuideExcel({text:'OHC – Print Shop\nHardware deployment and configuration required\nDeploy Lenovo laptops to the venue\nPLATFORM\nWindows'});
 assert.equal(parsed.fields.description,'Deploy Lenovo laptops to the venue');
 assert.equal(parsed.fields.deviceModel,undefined);
});

test('Partial imports still cannot rewrite a correctly stored model, description or naming',()=>{
 const old={name:'OHC – Print Shop',description:'Deployment venue',guideDraft:{...newGuide(),technicalSnapshot:{deviceModel:'LENOVO - DESKTOP TC M75Q WIN11',namingConvention:'xxBATCHP01'},stages:{configuration:[],readyForDeployment:[],deployment:[]}}};
 const partial=parseGuideExcel({text:'PLATFORM\nWindows\nNETWORK TYPE\nWired'});
 const result=applyGuideExcelImport(old,old.guideDraft,partial,()=> 'x');
 assert.equal(result.description,'Deployment venue');
 assert.equal(result.guideDraft.technicalSnapshot.deviceModel,'LENOVO - DESKTOP TC M75Q WIN11');
 assert.equal(result.guideDraft.technicalSnapshot.namingConvention,'xxBATCHP01');
});

test('REAL bug: an Endpoint or Naming Convention heading with empty trailing Excel columns must consume the value on the next row',()=>{
 const text=`OHC – Print Shop\t\t\tDOCS
Hardware deployment and configuration required
Deployment venue
Endpoint\t\t\t
LENOVO - DESKTOP TC M75Q WIN11\t\t\t
PLATFORM\tNETWORK TYPE\tVLAN\tIP SCOPE\tRESERVATION
Windows\tWired\t10\tVlan 10\tN/A
Naming Convention\t\t\t
xxBATCHP01\t\t\t
Applications List
• MSCM`;
 const result=parseGuideExcel({text});
 assert.equal(result.fields.name,'OHC – Print Shop');
 assert.equal(result.fields.description,'Deployment venue');
 assert.equal(result.fields.deviceModel,'LENOVO - DESKTOP TC M75Q WIN11');
 assert.equal(result.fields.namingConvention,'xxBATCHP01');
 assert.deepEqual(result.unrecognized,[]);
});

test('HTML heading cells with trailing blank cells must also consume value on subsequent Excel row',()=>{
 const rows=[
  ['OHC – Print Shop','DOCS'],
  ['Hardware deployment and configuration required'],
  ['Deployment venue'],
  ['Endpoint','','','',''],
  ['LENOVO - DESKTOP TC M75Q WIN11','','','',''],
  ['PLATFORM','NETWORK TYPE','VLAN','IP SCOPE','RESERVATION'],
  ['Windows','Wired','10','Vlan 10','N/A'],
  ['Naming Convention','',''],
  ['xxBATCHP01','',''],
 ];
 const result=parseGuideExcel({html:'<table></table>',Parser:fakeParserFor(rows)});
 assert.equal(result.fields.description,'Deployment venue');
 assert.equal(result.fields.deviceModel,'LENOVO - DESKTOP TC M75Q WIN11');
 assert.equal(result.fields.namingConvention,'xxBATCHP01');
 assert.deepEqual(result.unrecognized,[]);
});
