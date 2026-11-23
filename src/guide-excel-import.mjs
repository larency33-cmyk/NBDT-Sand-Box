/** NBDT 0.6.111: Excel clipboard import for one system's Guide.
 * No external services; no clipboard HTML is inserted into the document.
 * Input may be pasted from worksheet cells (TSV / HTML) or a text template.
 */
import {STAGES} from './model.mjs';
import {splitExcelText,extractExcelHtmlRows} from './lessons-learned.mjs';

export const GUIDE_FIELD_GROUPS = [
 ['System', [['name','System name'],['description','Description']]],
 ['Device', [['deviceModel','Endpoint / Device model'],['os','Platform'],['osVersion','OS version'],['deviceCategory','Device type'],['namingConvention','Naming convention']]],
 ['Network', [['network','Network type'],['vlan','VLAN'],['ipScope','IP scope'],['ipReservation','Reservation']]],
 ['Access & management', [['serviceAccount','Service account'],['userAccount','User Account'],['logonType','Auth type'],['domainOU','Domain / OU'],['airWatchTags','AirWatch tags']]],
 ['Applications', [['appList','Applications list']]],
];
export const GUIDE_STAGE_LABELS={configuration:'Base configuration',readyForDeployment:'Ready for deployment',deployment:'Deployment'};
const fold = value=>String(value??'').normalize('NFKC').toLowerCase().replace(/\u00a0/g,' ').replace(/&/g,' and ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const lineText=value=>String(value??'').replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ').replace(/\uFEFF/g,'').trim();
/** Spreadsheet checkbox columns sometimes paste a literal 'false' beside application names. */
export const isFalsePlaceholder=value=>value===false||String(value??'').trim().toLowerCase()==='false';
export function normalizeApplications(value){
 return String(value??'').split(/[,;\n\r\t]+/g)
  .map(part=>part.trim().replace(/\s+false\s*$/i,'').trim())
  .filter(part=>part&&!isFalsePlaceholder(part))
  .join('\n');
}
const FIELD_ALIASES={
 name:['system name','system title','system','name','application name'],
 description:['description','system description','overview','system overview'],
 deviceModel:['endpoint','endpoint model','device model','hardware endpoint'],
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
/** The third Excel template line is a section banner, NOT the system description.
 * Excel Online may place a formatting glyph, extra text or the actual overview
 * in the same merged cell, so matching the complete cell exactly is unsafe. */
const INTRO_BANNER=/^hardware\s+deployment\s+(?:(?:and|&)\s+)?configuration\s+required/iu;
function introBannerRemainder(value){
 const line=lineText(value);
 const match=line.match(INTRO_BANNER);
 if(!match)return null;
 // Remove only the banner and its decorative symbols, not the paragraph below.
 const rest=line.slice(match[0].length).replace(/^[\s\p{P}\p{S}\uFE0F\u200D]+/gu,'').trim();
 // A 'DOCS' button often occupies the same banner row; it is not a description.
 return ['docs','documentation'].includes(fold(rest))?'':rest;
}
const isMetaHeading=value=>META_HEADINGS.has(fold(value))||introBannerRemainder(value)!==null;

export function findGuideStage(label){
 const normalized=fold(label).replace(/^(check\s*list|checklist|checks|stage|steps)\s+/,'').replace(/\s+(check\s*list|checklist|checks|steps)$/,'');
 return STAGE_LOOKUP.get(normalized)||null;
}
export function findGuideField(label){return FIELD_LOOKUP.get(fold(label))||null;}
export function stripChecklistMarker(text){
 return String(text??'').replace(/^\s*(?:[•●▪◦‣*-]\s*|(?:\d+[.)]|\[[xX ✓✔☑]?\])\s*)+/u,'')
  .replace(/\s*(?:☑|☐|✅|✔|✓|\[x\]|\[ \])\s*$/iu,'').trim();
}
// Source worksheets often mix merged HTML cells and plain-text clipboard rows.
// Recognize hardware model lines by model-like manufacturer/product tokens only
// when repairing an unlabelled introduction, never in normal descriptions.
const HARDWARE_MODEL_LINE=/^(?:lenovo|dell|hp|hewlett.packard|acer|asus|samsung|apple|zebra|panasonic|nino|ares|honeywell|getac|microsoft)\b[\s\S]*\b(?:desktop|thinkpad|thinkcentre|laptop|tablet|galaxy|ipad|iphone|xcover|elitebook|latitude|optiplex|tc\d+|gen\s*\d+|nino|model|surface)\b/i;
function cleanFieldText(text){return lineText(text).replace(/^[*]{2}|[*]{2}$/g,'').trim();}
function repairIntroFields(fields){
 const value=fields.description;
 if(!value)return;
 const repaired=[];
 for(const raw of value.split('\n')){
  const line=raw.trim();
  const afterBanner=introBannerRemainder(line);
  if(afterBanner!==null){if(afterBanner)repaired.push(afterBanner);continue;}
  // If the Excel HTML collapses an Endpoint cell into the description,
  // recover the hardware model instead of copying it to the registry summary.
  const collapsed=line.match(/^(.*?)(?:\s{2,}|\s+)(?=((?:LENOVO|DELL|HP|SAMSUNG|ZEBRA|ACER|ASUS)\s*[-–]\s*(?:DESKTOP|LAPTOP|TABLET|THINKPAD|TC\d+|GALAXY))\b)/i);
  const intro=collapsed?.[1]?.trim();
  const model=collapsed?line.slice(intro.length).trim():line;
  const duplicate=fields.deviceModel&&fold(model)===fold(fields.deviceModel);
  if(duplicate){if(intro)repaired.push(intro);continue;}
  if(!fields.deviceModel && HARDWARE_MODEL_LINE.test(model)){
   fields.deviceModel=model;
   fields.deviceType=model; // legacy hardware-model alias (not Device Type category)
   if(intro)repaired.push(intro);
   continue;
  }
  repaired.push(line);
 }
 if(repaired.length)fields.description=repaired.join('\n');
 else delete fields.description;
}
function isKnownValue(value,fields){
 return Object.values(fields).some(field=>String(field).split('\n').some(part=>fold(part)===fold(value)));
}
function candidateWeight(candidate){
 return candidate.score + ['deviceModel','namingConvention','description'].reduce((n,key)=>n+(candidate.fields[key]?5:0),0);
}
function prepareRows(text,html='',Parser){
 const htmlRows=html?extractExcelHtmlRows(html,Parser):[];
 const txtRows=splitExcelText(lineText(text));
 return [htmlRows,txtRows].filter(rows=>rows.length);
}
function readRows(rows){
 const fields={};const stages={};let section=null,activeField=null,consumed=0;let introOpen=true;let inIntroDescription=false;
 const leftovers=[];
 const addField=(key,value)=>{
  let clean=key==='appList'?cleanFieldText(value).replace(/^[•●▪◦‣*-]\s*/u,''):cleanFieldText(value);
  if(!clean||isFalsePlaceholder(clean))return;
  if(key==='description'){
   const afterBanner=introBannerRemainder(clean);
   // A merged Excel header is never valid system-specific description text.
   if(afterBanner!==null){if(!afterBanner)return;clean=afterBanner;}
  }
  if(key!=='name' && key!=='description')introOpen=false;
  if(key==='appList'){
   const list=normalizeApplications(clean);
   if(!list)return;
   fields[key]=normalizeApplications([fields[key],list].filter(Boolean).join('\n'));
  }
  else if(key==='description' && fields[key] && fields[key]!==clean)fields[key]+='\n'+clean;
  else fields[key]=clean;
  if(key==='deviceModel')fields.deviceType=clean; // v0.6.75 backward-compatible model alias
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
   if(heading){section=heading;activeField=null;inIntroDescription=false;consumed++;continue;}
   const colon=line.match(/^([^:：]{2,36})\s*[:：]\s*(.+)$/);
   // Some merged Excel cells flatten `Endpoint` and its value, or
   // `Naming Convention` and the pattern, into a single text line.
   const modelInline=line.match(/^(?:endpoint|device model)\s+(.+)$/i);
   if(modelInline && HARDWARE_MODEL_LINE.test(modelInline[1])){
    section=null;activeField=null;inIntroDescription=false;
    addField('deviceModel',modelInline[1]);continue;
   }
   const namingInline=line.match(/^naming\s+conventions?\s+([A-Za-z0-9][\w.\-\[\]]{3,})$/i);
   if(namingInline){section=null;activeField=null;inIntroDescription=false;addField('namingConvention',namingInline[1]);continue;}
   const field=findGuideField(colon?.[1]||line);
   if(field){
    section=field==='appList'?'appList':null;activeField=field==='appList'?null:field;inIntroDescription=false;consumed++;
    if(colon)addField(field,colon[2]);
    continue;
   }
   const introRemainder=introBannerRemainder(line);
   if(introRemainder!==null){
    section=null;activeField=null;inIntroDescription=Boolean(fields.name);consumed++;
    // Excel sometimes joins the banner and paragraph into one merged cell.
    if(introRemainder && fields.name){addField('description',introRemainder);}
    continue;
   }
   if(META_HEADINGS.has(fold(line))){section=null;activeField=null;inIntroDescription=false;continue;}
   if(section && STAGES.includes(section)){addStep(line);continue;}
   if(section==='appList'){addField('appList',line);continue;}
   if(activeField){addField(activeField,line);activeField=null;continue;}
   if(inIntroDescription && fields.name){addField('description',line);continue;}
   // The title and description in this worksheet have no explicit labels.
   if(allowTitle && !fields.name && !findGuideField(line) && line.length<90 && !/[.!?]$/.test(line)){
    addField('name',line);continue;
   }
   if(fields.name && introOpen && !fields.description && !HARDWARE_MODEL_LINE.test(line) && !/[\t]/.test(line)){
    addField('description',line);introOpen=false;continue;
   }
   leftovers.push(line);
  }
 };
 // Apply spreadsheet header/value pairs in their real document order.
 // Pre-scanning them would prematurely terminate the unlabeled introduction.
 const skip=new Set();
 let sawHeading=false;
 const hasTemplateLabels=rows.some(row=>row.some(cell=>findGuideField(cell)||findGuideStage(cell)||isMetaHeading(cell)));
 rows.forEach((row,index)=>{
  if(skip.has(index))return;
  const cells=row.map(lineText);
  const values=rows[index+1];
  const keys=cells.map(findGuideField);
  if(values && keys.filter(Boolean).length>=2 && values.length>=cells.length &&
     !values.some(value=>findGuideField(value)||findGuideStage(value))){
   keys.forEach((key,j)=>{if(key)addField(key,values[j]);});
   skip.add(index+1);section=null;activeField=null;inIntroDescription=false;sawHeading=true;return;
  }
  // A merged Excel heading may have several empty cells to its right.
  // In that case process it as a standalone heading so the NEXT row becomes
  // its value. Previously this branch discarded the heading entirely.
  if(cells.length>=2 && findGuideField(cells[0]) &&
     cells.slice(1).some(Boolean) &&
     !cells.slice(1).some(cell=>findGuideField(cell)||findGuideStage(cell)||isMetaHeading(cell))){
   const key=findGuideField(cells[0]);addField(key,cells.slice(1).filter(Boolean).join('\n'));section=null;activeField=null;inIntroDescription=false;
   return;
  }
  for(const cell of cells){
   if(!cell)continue;
   const mayInferTitle=hasTemplateLabels&&!sawHeading;
   if(findGuideStage(cell)||findGuideField(cell)||isMetaHeading(cell))sawHeading=true;
   handleText(cell,mayInferTitle);
  }
 });
 // Special case: a copied table can have a label/value pair separated by tabs
 // and a split software/checklist cell. `readRows` only fills recognized fields.
 repairIntroFields(fields);
 return {fields,stages,unrecognized:leftovers,score:Object.keys(fields).length*3+Object.values(stages).reduce((n,a)=>n+a.length+1,0),consumed};
}
export function parseGuideExcel({text='',html='',Parser}={}){
 const rowVariants=prepareRows(text,html,Parser);
 const candidates=rowVariants.map(readRows);
 const primary=[...candidates].sort((a,b)=>candidateWeight(b)-candidateWeight(a))[0];
 if(!primary || !primary.score)throw Error('No recognizable configuration fields found. Copy the System / Endpoint / Platform / Applications / Checklist area from Excel.');
 // Excel HTML may lose merged headings while plain text keeps them, and vice
 // versa. Combine complementary fields instead of discarding an entire view.
 const fields={...primary.fields};
 const plain=candidates.length===2?candidates[1]:null;
 const htmlCandidate=candidates.length===2?candidates[0]:null;
 for(const candidate of candidates){
  for(const [key,value] of Object.entries(candidate.fields)){
   if(!fields[key])fields[key]=value;
  }
 }
 // The natural-order text clipboard is authoritative for these specifically
 // labelled/unlabelled intro fields when its model/naming boundaries are clear.
 if(plain?.fields.deviceModel && plain.fields.namingConvention){
  fields.deviceModel=plain.fields.deviceModel;
  fields.deviceType=plain.fields.deviceModel;
  fields.namingConvention=plain.fields.namingConvention;
  if(plain.fields.description)fields.description=plain.fields.description;
 } else {
  for(const key of ['deviceModel','namingConvention']){
   if(plain?.fields[key])fields[key]=plain.fields[key];
  }
  if(plain?.fields.description && (!fields.description ||
      (fields.deviceModel && fields.description.includes(fields.deviceModel)))){
   fields.description=plain.fields.description;
  }
 }
 // If the HTML candidate is the only one with a well-formed hardware value,
 // retain it, even when the text was flattened to a single paragraph.
 if(!fields.deviceModel && htmlCandidate?.fields.deviceModel)fields.deviceModel=htmlCandidate.fields.deviceModel;
 if(fields.deviceModel)fields.deviceType=fields.deviceModel;
 repairIntroFields(fields);
 const stages={...primary.stages};
 for(const candidate of candidates){
  for(const stage of STAGES){
   if(candidate.stages[stage]?.length > (stages[stage]?.length||0))stages[stage]=candidate.stages[stage];
  }
 }
 const unrecognized=[...new Set(primary.unrecognized.filter(line=>!isFalsePlaceholder(line)&&!isKnownValue(line,fields)))];
 return {fields,stages,unrecognized};
}
export function applyGuideExcelImport(system,baseGuide,parsed,makeId){
 const tech={...(baseGuide.technicalSnapshot||{})};
 const identity={};
 for(const [key,value] of Object.entries(parsed.fields||{})){
  if(key==='name'||key==='description')identity[key]=value;
  else if(key==='deviceModel'||key==='deviceType'){tech.deviceModel=value;tech.deviceType=value;}
  else if(key==='appList')tech.appList=normalizeApplications(value);
  else if(!isFalsePlaceholder(value))tech[key]=value;
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
