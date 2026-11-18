import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseGuideExcel,applyGuideExcelImport,findGuideField,findGuideStage} from '../src/guide-excel-import.mjs';
import {formatLessonBlocks} from '../src/lessons-formatting.mjs';
import {newGuide} from '../src/model.mjs';

const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const modal=readFileSync(new URL('../src/guide-excel-import-modal.tsx',import.meta.url),'utf8');
const lessonsUI=readFileSync(new URL('../src/lessons-learned-section.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-guide-excel-v075.css',import.meta.url),'utf8');
const screenshotTemplate=`AMOS X
Hardware deployment and configuration required
The AMOS X application is a web server integrated with the AMOS Business Suite.
Endpoint
Samsung Galaxy Tab Active5 Ent
PLATFORM\tNETWORK TYPE\tVLAN\tIP SCOPE\tRESERVATION
Android\tWiFi\t370\t10.185.82.0 - 255\t10.185.82.181-200
SERVICE ACCOUNT\tUSER ACCOUNT\tAUTH TYPE\tDOMAIN/OU\tAIRWATCH TAGS
svccmosmobile\tN/A\tPin code\tN/A\tN/A
Naming Convention
HEAMOSXXX - HEAMOSX01
Applications List
• AMOS X app
• NextGen SOM (Service now)
Check list - base configuration
• Enroll devices in AirWatch ☑
• Push assigned AirWatch profiles ☑
Check list - ready for deployment
• Connect devices to production WiFi ☐
Check list - deployment
• Validate few devices ☐`;

test('Recognizes screenshot-style full guide template with 3 stages and does not import completion marks',()=>{
 const {fields,stages,unrecognized}=parseGuideExcel({text:screenshotTemplate});
 assert.equal(fields.name,'AMOS X');
 assert.match(fields.description,/web server integrated/);
 assert.equal(fields.deviceType,'Samsung Galaxy Tab Active5 Ent');
 assert.equal(fields.os,'Android');
 assert.equal(fields.network,'WiFi');
 assert.equal(fields.vlan,'370');
 assert.equal(fields.ipScope,'10.185.82.0 - 255');
 assert.equal(fields.ipReservation,'10.185.82.181-200');
 assert.equal(fields.serviceAccount,'svccmosmobile');
 assert.equal(fields.userAccount,'N/A');
 assert.equal(fields.logonType,'Pin code');
 assert.equal(fields.domainOU,'N/A');
 assert.equal(fields.airWatchTags,'N/A');
 assert.equal(fields.namingConvention,'HEAMOSXXX - HEAMOSX01');
 assert.equal(fields.appList,'AMOS X app\nNextGen SOM (Service now)');
 assert.deepEqual(stages.configuration,['Enroll devices in AirWatch','Push assigned AirWatch profiles']);
 assert.deepEqual(stages.readyForDeployment,['Connect devices to production WiFi']);
 assert.deepEqual(stages.deployment,['Validate few devices']);
 assert.deepEqual(unrecognized,[]);
});

test('Standalone key/value lines and uppercase labels work without exact Excel formatting',()=>{
 const result=parseGuideExcel({text:'System name: KIOSK X\nDescription: Terminal for service\nPlatform: Windows\nNetwork Type: Wired\nAirWatch Tags: tagged\nApplication List\n• MS Office\n• TeamViewer\nChecklist - Best Configuration\n1. Join domain\n2. Install agent\nCheck list - Ready for Deployment\n• Deliver device'});
 assert.equal(result.fields.name,'KIOSK X');
 assert.equal(result.fields.os,'Windows');
 assert.equal(result.fields.airWatchTags,'tagged');
 assert.equal(result.fields.appList,'MS Office\nTeamViewer');
 assert.deepEqual(result.stages.configuration,['Join domain','Install agent']);
 assert.deepEqual(result.stages.readyForDeployment,['Deliver device']);
});

test('Generic HTML Excel multi-cell rows work; only text is mapped',()=>{
 const textNode=v=>({nodeType:3,nodeValue:v});
 const td=v=>({nodeType:1,tagName:'TD',childNodes:[textNode(v)]});
 const rows=[{children:['PLATFORM','NETWORK TYPE','VLAN'].map(td)},{children:['Android','WiFi','370'].map(td)},{children:['AIRWATCH TAGS','AA-BB'].map(td)},{children:[td('Checklist - deployment')]},{children:[td('• Hand over equipment ☑')]}];
 class Parser{parseFromString(){return {querySelector(){return {querySelectorAll(){return rows;}};}};}}
 const result=parseGuideExcel({html:'<table>ignored</table>',text:'junk',Parser});
 assert.equal(result.fields.os,'Android');assert.equal(result.fields.network,'WiFi');
 assert.equal(result.fields.vlan,'370');assert.equal(result.fields.airWatchTags,'AA-BB');
 assert.deepEqual(result.stages.deployment,['Hand over equipment']);
});

test('Unknown text does not silently overwrite existing data',()=>{
 assert.throws(()=>parseGuideExcel({text:'arbitrary unstructured text'}),/No recognizable/);
 assert.equal(findGuideField('AirWatch tags'),'airWatchTags');
 assert.equal(findGuideField('MDM / AirWatch'),'airWatchTags');
 assert.equal(findGuideStage('Check-list: ready for deployment'),'readyForDeployment');
});

test('Import changes only recognized fields and stages, preserves IDs, other stage, published guide, runs and lessons',()=>{
 const oldGuide={...newGuide(),technicalSnapshot:{os:'Windows',deviceType:'Legacy device',serviceAccount:'existing',namingConvention:'OLD'},stages:{configuration:[{id:'retain-id',label:'Join domain',required:true},{id:'drop-id',label:'Old step',required:true}],readyForDeployment:[{id:'stable',label:'Keep readiness',required:true}],deployment:[]}};
 const sys={name:'Old system',description:'Old description',guideDraft:oldGuide,publishedGuide:{version:4},deviceRuns:[{id:'run-1'}],lessonsLearnedItems:[{id:'lesson-1'}],unrelated:'preserved'};
 let n=0;
 const parsed=parseGuideExcel({text:'Endpoint: New model\nService account: new-acct\nCheck list - base configuration\n• Join domain\n• Install agent'});
 const next=applyGuideExcelImport(sys,oldGuide,parsed,()=>`new-${++n}`);
 assert.equal(next.name,'Old system');assert.equal(next.description,'Old description');
 assert.equal(next.guideDraft.technicalSnapshot.deviceType,'New model');
 assert.equal(next.guideDraft.technicalSnapshot.serviceAccount,'new-acct');
 assert.equal(next.guideDraft.technicalSnapshot.namingConvention,'OLD');
 assert.deepEqual(next.guideDraft.stages.configuration.map(step=>step.id),['retain-id','new-1']);
 assert.deepEqual(next.guideDraft.stages.readyForDeployment,oldGuide.stages.readyForDeployment);
 assert.deepEqual(next.publishedGuide,sys.publishedGuide);
 assert.deepEqual(next.lessonsLearnedItems,sys.lessonsLearnedItems);
 assert.deepEqual(next.deviceRuns,sys.deviceRuns);
 assert.equal(next.unrelated,'preserved');
 assert.equal(next.guideDraft.stages.configuration[1].required,true);
 assert.equal(next.guideDraft.stages.configuration[1].checked,undefined);
});

test('Empty spreadsheet checklist section is ignored rather than deleting saved steps',()=>{
 const parsed=parseGuideExcel({text:'Endpoint: Tablet\nCheck list - deployment'});
 assert.deepEqual(parsed.stages,{});
 const base={...newGuide(),technicalSnapshot:{deviceType:'Old'},stages:{configuration:[],readyForDeployment:[],deployment:[{id:'kept',label:'Existing deployment step',required:true}]}};
 const next=applyGuideExcelImport({name:'Demo'},base,parsed,()=> 'new');
 assert.deepEqual(next.guideDraft.stages.deployment,base.stages.deployment);
});

test('Lesson profile: bare uppercase labels become bold inline fields (Ribbon use case)',()=>{
 const blocks=formatLessonBlocks('DESCRIPTION\nWrong paper was ordered for the Zebra label printer.\nAPPLICATION\nAMOS\nAREA / VENUE\nAMOS\nPRODUCT TEAM\nJoshua Nunez & Lowella Canzana\nAUTHOR\nDaron Franklyn');
 assert.deepEqual(blocks.filter(b=>b.kind==='field').map(b=>[b.label,b.value]),[
  ['Description','Wrong paper was ordered for the Zebra label printer.'],['Application','AMOS'],['Area / Venue','AMOS'],['Product Team','Joshua Nunez & Lowella Canzana'],['Author','Daron Franklyn']]);
 assert.ok(blocks.filter(b=>b.kind==='field').every(b=>b.layout==='inline'));
});

test('Lesson details: headings, nested ticket labels, multiline corrective action all preserved',()=>{
 const blocks=formatLessonBlocks('COMMENTS\nWrong paper was ordered for the Zebra ZD421 label printer.\nTRACKING\nTicket: Via Email\nTicket Date: N/A\nCORRECTIVE ACTION\nOwner will supply correct stock.\nFuture builds should reorder it.');
 const fields=blocks.filter(b=>b.kind==='field');
 assert.deepEqual(fields.map(b=>b.label),['Comments','Tracking','Ticket','Ticket Date','Corrective Action']);
 assert.equal(fields.at(-1).value,'Owner will supply correct stock.\nFuture builds should reorder it.');
 assert.equal(fields.at(-1).layout,'stack');
 assert.equal(formatLessonBlocks('Description: Incorrect Time Zone')[0].value,'Incorrect Time Zone');
});

test('Guide UI adds one import button without removing individual editors, and renames AirWatch field',()=>{
 assert.match(ui,/Import from Excel/);
 assert.match(ui,/GuideExcelImportModal/);
 assert.match(ui,/applyGuideExcelImport\(sys,beginGuideEdit\(sys\),parsed,uid\)/);
 assert.match(ui,/AirWatch tags/);
 assert.doesNotMatch(ui,/\["MDM \/ AirWatch"/);
 assert.match(ui,/GuideTechnicalReadout/);
 assert.match(ui,/GuideApplications/);
 assert.match(ui,/beginEdit\('checklist'\)/);
 assert.match(modal,/clipboardData/);
 assert.match(modal,/text\/html/);
 assert.match(modal,/Preview import/);
 assert.match(modal,/Apply import/);
 assert.match(lessonsUI,/formatLessonBlocks/);
 assert.match(app,/nbdt-guide-excel-v075\.css/);
 assert.match(css,/nb75-modal/);
});
