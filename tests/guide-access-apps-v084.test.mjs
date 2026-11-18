import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isFalsePlaceholder,normalizeApplications,parseGuideExcel,applyGuideExcelImport} from '../src/guide-excel-import.mjs';
import {newGuide} from '../src/model.mjs';
import {registryCardFields,deviceModelValue} from '../src/registry-metadata.mjs';

test('Owner stays on external Registry card, imported User account appears in Guide Access & management',()=>{
 const guide=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
 const registry=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
 assert.match(guide,/\["User account",values\.userAccount,field\('userAccount','User account'\)\]/);
 assert.doesNotMatch(guide,/\["Owner",owner,ownerInput\]/);
 assert.match(guide,/!\['Documentation URL','Authentication'\]\.includes/);
 assert.match(registry,/Owner: <strong>\{sys\.assignmentOwnerLabel\}/);
});

test('Applications suppress checkbox booleans without deleting genuine application names',()=>{
 assert.equal(isFalsePlaceholder(false),true);
 assert.equal(isFalsePlaceholder(' FALSE '),true);
 assert.equal(isFalsePlaceholder('False Positive Analyzer'),false);
 assert.equal(normalizeApplications('MSCM\nfalse\nCrowd Strike false\nMicrosoft Word\tFALSE\nFalse Positive Analyzer'),
  'MSCM\nCrowd Strike\nMicrosoft Word\nFalse Positive Analyzer');
});

test('Excel paste strips false placeholders from Apps, Access and unmatched sections',()=>{
 const text=`System name: Print Shop
SERVICE ACCOUNT\tUSER ACCOUNT\tAUTH TYPE
svc-print\tprint-admin\tAD logon
Applications List
• MSCM
FALSE
• Crowd Strike false
• TeamViewer\tfalse
• Microsoft Word
Check list - base configuration
• Install latest updates
FALSE`;
 const result=parseGuideExcel({text});
 assert.equal(result.fields.userAccount,'print-admin');
 assert.equal(result.fields.appList,'MSCM\nCrowd Strike\nTeamViewer\nMicrosoft Word');
 assert.deepEqual(result.stages.configuration,['Install latest updates']);
 assert.ok(!Object.values(result.fields).some(value=>String(value).toLowerCase()==='false'));
 assert.ok(!result.unrecognized.some(value=>value.toLowerCase()==='false'));
});

test('Existing false values render as empty metadata and no false app is persisted on import',()=>{
 assert.deepEqual(registryCardFields({deviceModel:'false',network:false,namingConvention:'FALSE',os:'Windows'}),{
  model:'—',os:'Windows',network:'—',naming:'—',category:'',description:''
 });
 assert.equal(deviceModelValue({deviceModel:'false'}),'');
 const base=newGuide();
 const system={name:'Demo',guideDraft:base};
 const parsed={fields:{userAccount:'admin2',appList:'False\nMicrosoft Teams\nChrome false'},stages:{}};
 const next=applyGuideExcelImport(system,base,parsed,()=> 'new-item');
 assert.equal(next.userAccount,'admin2');
 assert.equal(next.appList,'Microsoft Teams\nChrome');
 assert.equal(next.guideDraft.technicalSnapshot.appList,'Microsoft Teams\nChrome');
});
