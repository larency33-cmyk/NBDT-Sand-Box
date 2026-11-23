import test from 'node:test';
import assert from 'node:assert/strict';
import {newGuide} from '../src/model.mjs';
import {parseGuideExcel, applyGuideExcelImport} from '../src/guide-excel-import.mjs';

const description='Mobile Telehealth is a shipboard medical platform that enables healthcare providers onboard Royal Caribbean vessels to access clinical applications, perform remote medical consultations, conduct diagnostic assessments, and support patient care using mobile devices. The solution consolidates medical applications onto Samsung tablets and integrates telemedicine, electronic medical records, ultrasound imaging, and specialist consultation capabilities to improve the delivery of onboard healthcare services.';
const header='Hardware deployment and configuration required';
const suffix='Endpoint\nSamsung Galaxy Tab Active5\nPLATFORM\tNETWORK TYPE\tVLAN\tIP SCOPE\tRESERVATION\nAndroid\tWiFi\t360\t10.184.82.0\t10.184.82.80 - 85';
function copy(banner=header,body=description){return `Mobile Telehealth\tDOCS\n${banner}\n${body}\n${suffix}`;}
function check(parsed){
 assert.equal(parsed.fields.name,'Mobile Telehealth');
 assert.equal(parsed.fields.description,description);
 assert.equal(parsed.fields.deviceModel,'Samsung Galaxy Tab Active5');
 assert.equal(parsed.fields.os,'Android');
 assert.equal(parsed.fields.network,'WiFi');
 assert.equal(parsed.fields.vlan,'360');
 assert.doesNotMatch(JSON.stringify(parsed.fields),/Hardware deployment and configuration required/i);
}

test('Mobile Telehealth: full paragraph immediately after third-row banner from plain-text Excel',()=>{
 check(parseGuideExcel({text:copy()}));
});

test('Styled Excel header with a decorative computer icon does not become Description',()=>{
 for(const decorated of [
  `${header} ▣`, `${header} 🖥️`, `${header} 💻`, `${header}  • DOCS`, `Hardware deployment configuration required`, `Hardware deployment & configuration required`,
  `  ${header} \u00a0 ▪ `,`${header}\t\t`,
 ]){
  check(parseGuideExcel({text:copy(decorated)}));
 }
});

test('Excel merged cell joining banner and description does not include banner',()=>{
 check(parseGuideExcel({text:`Mobile Telehealth\tDOCS\n${header} 🖥️\n${description}\n${suffix}`}));
 check(parseGuideExcel({text:`Mobile Telehealth\tDOCS\n${header} ▪ ${description}\n${suffix}`}));
 check(parseGuideExcel({text:`Mobile Telehealth\tDOCS\n${header}\n${description}\n${suffix}`}));
});

function fakeDomParser(rows){
 const textNode=value=>({nodeType:3,nodeValue:value});
 const cell=value=>({nodeType:1,tagName:'TD',childNodes:[textNode(value)]});
 return class {parseFromString(){return {querySelector(){return {querySelectorAll(){return rows.map(row=>({children:row.map(cell)}));}};}};}};
}

test('HTML copied from styled Excel Online cells resolves the full description instead of its banner',()=>{
 const rows=[['Mobile Telehealth','DOCS'],[`${header} ▪`],[description],['Endpoint'],['Samsung Galaxy Tab Active5'],['PLATFORM','NETWORK TYPE','VLAN','IP SCOPE','RESERVATION'],['Android','WiFi','360','10.184.82.0','10.184.82.80 - 85']];
 check(parseGuideExcel({html:'<table></table>',text:copy(),Parser:fakeDomParser(rows)}));
 check(parseGuideExcel({html:'<table></table>',Parser:fakeDomParser(rows)}));
});

test('HTML merged introduction can contain header and description in the same cell',()=>{
 const rows=[['Mobile Telehealth','DOCS'],[`${header}\n${description}`],['Endpoint'],['Samsung Galaxy Tab Active5'],['PLATFORM','NETWORK TYPE','VLAN'],['Android','WiFi','360']];
 const parsed=parseGuideExcel({html:'<table></table>',Parser:fakeDomParser(rows)});
 assert.equal(parsed.fields.description,description);
 assert.ok(!parsed.fields.description.includes(header));
});

test('No description: heading must never be inferred as a replacement description',()=>{
 const parsed=parseGuideExcel({text:`Mobile Telehealth\tDOCS\n${header} 🖥️\nEndpoint\nSamsung Galaxy Tab Active5\nPLATFORM\nAndroid`});
 assert.equal(parsed.fields.description,undefined);
 assert.equal(parsed.fields.deviceModel,'Samsung Galaxy Tab Active5');
});

test('Re-import overwrites a legacy erroneous banner with the actual system-specific description',()=>{
 const old={id:'mobile',name:'Mobile Telehealth',description:`${header} 🖥️`,guideDraft:newGuide(),lessonsLearnedItems:[{id:'l',lessonLearned:'Keep original notes'}]};
 const after=applyGuideExcelImport(old,old.guideDraft,parseGuideExcel({text:copy()}),()=>'new-step');
 assert.equal(after.description,description);
 assert.equal(after.guideDraft.technicalSnapshot.deviceModel,'Samsung Galaxy Tab Active5');
 assert.deepEqual(after.lessonsLearnedItems,old.lessonsLearnedItems);
});

test('Explicitly labelled description stays supported, unchanged',()=>{
 const parsed=parseGuideExcel({text:`System: Mobile Telehealth\nDescription: ${description}\nEndpoint: Samsung Galaxy Tab Active5`});
 assert.equal(parsed.fields.description,description);
});
