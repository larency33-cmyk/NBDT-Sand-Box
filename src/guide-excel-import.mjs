/** NBDT 0.6.75: Excel clipboard import for one system's Guide.
 * No external services; no clipboard HTML is inserted into the document.
 * Input may be pasted from worksheet cells (TSV / HTML) or a text template.
 */
import {STAGES} from './model.mjs';
import {splitExcelText,extractExcelHtmlRows} from './lessons-learned.mjs';

export const GUIDE_FIELD_GROUPS = [
 ['System', [['name','System name'],['description','Description']]],
 ['Device', [['deviceType','Endpoint'],['os','Platform'],['osVersion','OS version'],['deviceCategory','Device type'],['namingConvention','Naming convention']]],
 ['Network', [['network','Network type'],['vlan','VLAN'],['ipScope','IP scope'],['ipReservation','Reservation']]],
 ['Access & management', [['serviceAccount','Service account'],['userAccount','User account'],['logonType','Auth type'],['domainOU','Domain / OU'],['airWatchTags','AirWatch tags']]],
 ['Applications', [['appList','Applications list']]],
];
export const GUIDE_STAGE_LABELS={configuration:'Base configuration',readyForDeployment:'Ready for deployment',deployment:'Deployment'};
const fold = value=>String(value??'').normalize('NFKC').toLowerCase().replace(/\u00a0/g,' ').replace(/&/g,' and ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const lineText=value=>String(value??'').replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ').replace(/\uFEFF/g,'').trim();
const FIELD_ALIASES={
 name:['system name','system title','system','name','application name'],
 description:['description','system description','overview','system overview'],
 deviceType:['endpoint','endpoint model','device model','hardware','hardware endpoint'],
 deviceCategory:['device type','device category','endpoint type'],
 os:['platform','operating system','os','os platform'],
 osVersion:['os version','operating system version','platform version'],
 network:['network type','network','connection','connection type'],
 vlan:['vlan','vlan id'],
 ipScope:['ip scope','ip range','ip address range','subnet','network scope'],
 ipReservation:['reservation','ip reservation','reserved addresses','ip reservations'],
 serviceAccount:['service account','serviceaccount'],
 userAccount:['user account','useraccount'],
 logonType:['auth type','authentication','authentication type','logon type','login type','auth method'],
 domainOU:['domain ou','domain organizational unit','domain and ou','domain'],
 airWatchTags:['airwatch tags','airwatch tag','mdm airwatch','mdm airwatch tags','aw tags'],
 namingConvention:['naming convention','naming conventions','computer naming','device naming'],
 appList:['applications list','application list','applications','apps list','app list','required applications','software list'],
};
const FIELD_LOOKUP=new Map(Object.entries(FIELD_ALIASES).flatMap(([key,labels])=>labels.map(label=>[fold(label),key])));
const STAGE_LOOKUP=new Map([
 ['base configuration','configuration'],['best configuration','configuration'],['base config','configuration'],
 ['ready for deployment','readyForDeployment'],['ready to deploy','readyForDeployment'],
 ['deployment','deployment'],['deploy','deployment'],
].map(([a,b])=>[fold(a),b]));
const META_HEADINGS=new Set(['docs','documentation','technical essentials','device','network','access and management','hardware deployment and configuration required','configuration checklist','checklist']);

export function findGuideStage(label){
 const normalized=fold(label).replace(/^(check\s*list|checklist|checks|stage|steps)\s+/,'').replace(/\s+(check\s*list|checklist|checks|steps)$/,'');
 return STAGE_LOOKUP.get(normalized)||null;
}
export function findGuideField(label){return FIELD_LOOKUP.get(fold(label))||null;}
export function stripChecklistMarker(text){
 return String(text??'').replace(/^\s*(?:[•●▪◦‣*-]\s*|(?:\d+[.)]|\[[xX ✓✔☑]?\])\s*)+/u,'')
  .replace(/\s*(?:☑|☐|✅|✔|✓|\[x\]|\[ \])\s*$/iu,'').trim();
}
function prepareRows(text,html='',Parser){
 const htmlRows=html?extractExcelHtmlRows(html,Parser):[];
 const txtRows=splitExcelText(lineText(text));
 return [htmlRows,txtRows].filter(rows=>rows.length);
}
function readRows(rows){
 const fields={};const stages={};let section=null,activeField=null,consumed=0;let introOpen=true;
 const leftovers=[];
 const addField=(key,value)=>{
  const clean=key==='appList'?lineText(value).replace(/^[•●▪◦‣*-]\s*/u,''):lineText(value);
  if(!clean)return;
  if(key!=='name' && key!=='description')introOpen=false;
  if(key==='appList')fields[key]=fields[key]?[fields[key],clean].join('\n'):clean;
  else if(key==='description' && fields[key] && fields[key]!==clean)fields[key]+='\n'+clean;
  else fields[key]=clean;
  consumed++;
 };
 const addStep=value=>{
  const step=stripChecklistMarker(value);
  if(!step||/^check\s*(?:box|list)$/i.test(step)||/^(?:yes|no|true|false)$/i.test(step))return;
  const target=stages[section]||(stages[section]=[]);
  if(!target.some(existing=>fold(existing)===fold(step)))target.push(step);
  consumed++;
 };
 const handleText=(value,allowTitle=false)=>{
  const lines=String(value??'').replace(/\r\n?/g,'\n').split('\n');
  for(const raw of lines){
   const line=lineText(raw);
   if(!line)continue;
   const heading=findGuideStage(line);
   if(heading){section=heading;activeField=null;consumed++;continue;}
   const colon=line.match(/^([^:：]{2,36})\s*[:：]\s*(.+)$/);
   const field=findGuideField(colon?.[1]||line);
   if(field){
    section=field==='appList'?'appList':null;activeField=field==='appList'?null:field;consumed++;
    if(colon)addField(field,colon[2]);
    continue;
   }
   if(META_HEADINGS.has(fold(line))){section=null;activeField=null;continue;}
   if(section && STAGES.includes(section)){addStep(line);continue;}
   if(section==='appList'){addField('appList',line);continue;}
   if(activeField){addField(activeField,line);activeField=null;continue;}
   // The title and description in this worksheet have no explicit labels.
   if(allowTitle && !fields.name && !findGuideField(line) && line.length<90 && !/[.!?]$/.test(line)){
    addField('name',line);continue;
   }
   if(fields.name && introOpen && line.length>18){addField('description',line);continue;}
   leftovers.push(line);
  }
 };
 // Apply spreadsheet header/value pairs in their real document order.
 // Pre-scanning them would prematurely terminate the unlabeled introduction.
 const skip=new Set();
 let sawHeading=false;
 const hasTemplateLabels=rows.some(row=>row.some(cell=>findGuideField(cell)||findGuideStage(cell)||META_HEADINGS.has(fold(cell))));
 rows.forEach((row,index)=>{
  if(skip.has(index))return;
  const cells=row.map(lineText);
  const values=rows[index+1];
  const keys=cells.map(findGuideField);
  if(values && keys.filter(Boolean).length>=2 && values.length>=cells.length &&
     !values.some(value=>findGuideField(value)||findGuideStage(value))){
   keys.forEach((key,j)=>{if(key)addField(key,values[j]);});
   skip.add(index+1);section=null;activeField=null;sawHeading=true;return;
  }
  if(cells.length>=2 && findGuideField(cells[0]) && !findGuideField(cells[1]) && !findGuideStage(cells[1])){
   const key=findGuideField(cells[0]);addField(key,cells.slice(1).filter(Boolean).join('\n'));section=null;activeField=null;
   return;
  }
  for(const cell of cells){
   if(!cell)continue;
   const mayInferTitle=hasTemplateLabels&&!sawHeading;
   if(findGuideStage(cell)||findGuideField(cell)||META_HEADINGS.has(fold(cell)))sawHeading=true;
   handleText(cell,mayInferTitle);
  }
 });
 // Special case: a copied table can have a label/value pair separated by tabs
 // and a split software/checklist cell. `readRows` only fills recognized fields.
 return {fields,stages,unrecognized:leftovers,score:Object.keys(fields).length*3+Object.values(stages).reduce((n,a)=>n+a.length+1,0),consumed};
}
export function parseGuideExcel({text='',html='',Parser}={}){
 const candidates=prepareRows(text,html,Parser).map(readRows);
 const result=candidates.sort((a,b)=>b.score-a.score)[0];
 if(!result || !result.score)throw Error('No recognizable configuration fields found. Copy the System / Endpoint / Platform / Applications / Checklist area from Excel.');
 return {fields:result.fields,stages:result.stages,unrecognized:result.unrecognized};
}
export function applyGuideExcelImport(system,baseGuide,parsed,makeId){
 const tech={...(baseGuide.technicalSnapshot||{})};
 const identity={};
 for(const [key,value] of Object.entries(parsed.fields||{})){
  if(key==='name'||key==='description')identity[key]=value;
  else tech[key]=value;
 }
 const stages={...baseGuide.stages};
 for(const stage of STAGES){
  if(!Object.hasOwn(parsed.stages||{},stage))continue;
  const old=Array.isArray(stages[stage])?stages[stage]:[];
  stages[stage]=parsed.stages[stage].map(label=>{
   const match=old.find(step=>fold(step.label)===fold(label));
   return match?{...match,label}:{id:makeId(),label,required:true};
  });
 }
 const draft={...baseGuide,technicalSnapshot:tech,stages,platform:tech.os||baseGuide.platform};
 return {...system,...identity,...tech,guideDraft:draft};
}
