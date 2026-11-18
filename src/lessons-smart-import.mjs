/** Flexible, loss-preserving import for heterogeneous Lessons Learned worksheets.
 * Never silently discard a clipboard cell or synthesize a lesson title.
 * Keeps the existing strict Excel parser available for older integrations.
 */
import {LESSON_COLUMNS,extractExcelHtmlRows,splitExcelText,isExcelHeader} from './lessons-learned.mjs';

const clean = value=>String(value??'').replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ').trim();
const emptyLesson=()=>Object.fromEntries(LESSON_COLUMNS.map(key=>[key,'']));
const shipHeading=/^\s*lessons?\s+learned\s*[-–—:]\s*(previous|project|legend|star|utopia|ship)/i;
const commonHeading=/^\s*(lesson learned|issue profile|details\s*\/\s*corrective action|resolved by)\s*$/i;
const labelHeading=/^\s*(description|application|app|area\s*\/?\s*venue|category|author|product team|owner|type)\s*(?::|\n|$)/i;
const detailHeading=/^\s*(comments?|tracking|ticket(?: date)?|corrective action|notes?)\s*(?::|\n|$)/i;
const ownerHeading=/^\s*resolved\s*by\s*[:：]?\s*/i;
const labelKey=s=>clean(s).toLowerCase().replace(/[\s:/_–—-]+/g,' ');
const join=(values)=>values.filter(value=>clean(value)).map(clean).join('\n');
const looksLikeTitle=s=>{
 const t=clean(s);return t.length>0&&t.length<=105&&!t.includes('\n')&&!labelHeading.test(t)&&!detailHeading.test(t)&&!shipHeading.test(t)&&!commonHeading.test(t)&&t.split(/\s+/).length<=12;
};
const looksLikeOwner=s=>{
 const t=clean(s);
 if(ownerHeading.test(t))return true;
 return !!t && t.length<=62 && !t.includes('\n') && !/[.!?;:]$/.test(t) &&
   /^(?:(?:shipboard|product|application|security|software|support|technical|operations|vendor|it|rcg|shore|newbuild|integration)\b.*|[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/i.test(t) &&
   !/^(?:application|description|category|tracking|comments|corrective action)\b/i.test(t);
};
const stripOwner=s=>clean(s).replace(ownerHeading,'').trim();
function isHeader(row){
 if(isExcelHeader(row))return true;
 const keys=row.map(labelKey);
 return keys.filter(v=>['lesson learned','issue profile','details corrective action','resolved by'].includes(v)).length>=2;
}
function isVesselCaption(row){return row.length===1&&shipHeading.test(row[0]);}
function classifyBlock(text){
 const value=clean(text);
 if(ownerHeading.test(value))return 'resolvedBy';
 if(labelHeading.test(value))return 'issueProfile';
 if(detailHeading.test(value))return 'detailsCorrectiveAction';
 return 'detailsCorrectiveAction';
}
/** Free-form paste: recognize explicit column headers or Excel profile/action labels.
 * When nothing identifies a reliable title, leave it blank for the user's review.
 */
function isNarrative(text){
 const value=clean(text);
 return value.length>150 || /^(?:a couple of things|if |when |please |we (?:have|are|want)|there (?:is|are)|the process|onboard |thank you|dear |for your information|another issue|[-•]\s*(?:incorrect|disabled|denied|messages?|no sound|missing|macp|mobile|swipe))/i.test(value);
}
const onlyProfileHeading=value=>/^(?:description|application|app|area\s*\/?\s*venue|category|author|product team|owner|type)\s*[:：]?$/i.test(clean(value));
const explicitOwner=value=>ownerHeading.test(value)||/^(?:shipboard\s+it|product\s+team|application\s+team|support\s+team|it\s+team|security\s+team|operations\s+team|vendor\s+team)$/i.test(clean(value));
/** A paste can arrive as just text without clipboard column information.
 * Detect headings where possible but never invent a lesson name or discard the body. */
function parseFreeText(value){
 const lesson=emptyLesson();
 const lines=clean(value).split('\n');
 const sections={lessonLearned:[],issueProfile:[],detailsCorrectiveAction:[],resolvedBy:[]};
 let headings=0;
 let target='detailsCorrectiveAction';
 let start=0;
 // A simple heading before DESCRIPTION is reliably the lesson title.
 if(lines.length>1&&looksLikeTitle(lines[0])&&labelHeading.test(clean(lines[1]))){
  lesson.lessonLearned=clean(lines[0]);start=1;target='issueProfile';
 }
 let lastProfileLabel='';
 for(let i=start;i<lines.length;i++){
  const raw=lines[i],line=clean(raw);
  const named=line.match(/^\s*(lesson learned|issue profile|details\s*\/\s*corrective action|resolved by)\s*[:：]\s*(.*)$/i);
  const standalone=commonHeading.test(line);
  if(named||standalone){
   const heading=labelKey(named?named[1]:line);
   target=heading==='lesson learned'?'lessonLearned':heading==='issue profile'?'issueProfile':heading==='resolved by'?'resolvedBy':'detailsCorrectiveAction';
   if(named?.[2])sections[target].push(named[2]);headings++;continue;
  }
  if(labelHeading.test(line)){
   target='issueProfile';lastProfileLabel=line;
  }else if(detailHeading.test(line)){
   target='detailsCorrectiveAction';lastProfileLabel='';
  }else if(target==='issueProfile'&&isNarrative(line)&&!onlyProfileHeading(lastProfileLabel)){
   // Narrative after the profile metadata belongs to corrective-action details.
   target='detailsCorrectiveAction';
  }
  sections[target].push(raw);
  if(target==='issueProfile'&&lastProfileLabel&&!onlyProfileHeading(line))lastProfileLabel='';
 }
 for(const key of LESSON_COLUMNS)if(!lesson[key])lesson[key]=clean(sections[key].join('\n'));
 if(!headings&&!lesson.lessonLearned&&looksLikeTitle(lines[0])&&lines.length>1&&
    (labelHeading.test(lines[1])||detailHeading.test(lines[1]))){
  lesson.lessonLearned=clean(lines[0]);
  lesson.detailsCorrectiveAction=clean(lesson.detailsCorrectiveAction.replace(new RegExp('^'+lines[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*\\n?'),''));
 }
 return lesson;
}
/** Normalize copied Excel ranges, including merged and blank separator cells.
 * Do NOT collapse a single blank in a standard four-column row: that could
 * indicate a genuinely missing Issue Profile or Resolved By value. */
function meaningfulCells(row){
 let cells=[...row].map(clean);
 while(cells.length>1&&!cells[0])cells.shift();
 while(cells.length>1&&!cells.at(-1))cells.pop();
 if(cells.length>4){
  // Many legacy worksheets use empty spacer columns between the visible three.
  cells=cells.filter(Boolean);
 }
 return cells;
}
function mapCells(row,warnings){
 const cells=meaningfulCells(row);
 if(cells.length===1){
  warnings.push('One text block detected. Review the fields and enter a title if needed.');
  return parseFreeText(cells[0]);
 }
 const result=emptyLesson();
 if(cells.length===2){
  if(looksLikeTitle(cells[0])){
   result.lessonLearned=cells[0];
   result[classifyBlock(cells[1])]=cells[1];
  }else{
   result[classifyBlock(cells[0])]=cells[0];
   result.detailsCorrectiveAction=join([result.detailsCorrectiveAction,cells[1]]);
  }
  warnings.push('Only two columns were detected. Check the extracted fields before saving.');
  return result;
 }
 if(cells.length===3){
  result.lessonLearned=cells[0];
  result.issueProfile=cells[1];
  result.detailsCorrectiveAction=cells[2];
  warnings.push('Three columns detected: Resolved By is optional.');
  return result;
 }
 if(cells.length===4){
  for(let i=0;i<4;i++)result[LESSON_COLUMNS[i]]=cells[i];
  // Four exported cells can actually be three data columns with Details split.
  // Treat a *long or explicitly labeled* fourth cell as details, not an owner.
  if((cells[3].includes('\n')||cells[3].length>120||detailHeading.test(cells[3]))&&!ownerHeading.test(cells[3])){
   result.detailsCorrectiveAction=join([cells[2],cells[3]]);
   result.resolvedBy='';
   warnings.push('The final column looks like continued details; it was not interpreted as Resolved By.');
  }
  return result;
 }
 // 5+ Excel cells may be merged/spacer columns or separate profile subfields.
 // Use labels as anchors; all unclassified text remains visible in Preview.
 result.lessonLearned=cells[0];
 const tail=cells.slice(1);
 const last=tail.at(-1);
 const hasOwner=explicitOwner(last);
 if(hasOwner)result.resolvedBy=stripOwner(last);
 const content=hasOwner?tail.slice(0,-1):tail;
 let mode='issueProfile';
 for(let i=0;i<content.length;i++){
  const part=content[i];
  if(detailHeading.test(part))mode='detailsCorrectiveAction';
  else if(labelHeading.test(part))mode='issueProfile';
  else if(mode==='issueProfile'&&i>0&&!onlyProfileHeading(content[i-1])&&
     (isNarrative(part)||!labelHeading.test(part)))mode='detailsCorrectiveAction';
  result[mode]=join([result[mode],part]);
 }
 if(!result.issueProfile&&content.length>1){
  result.issueProfile=content[0];
  result.detailsCorrectiveAction=join(content.slice(1));
 }
 warnings.push(`${row.length} columns detected in Excel. Grouped using labels and content; please review all fields before saving.`);
 return result;
}
function mapSingleRow(row,warnings){
 const original=row.map(clean);
 if(!original.some(Boolean))return emptyLesson();
 // On wide ranges use a semantic mapping: physical Excel columns need not
 // correspond to the visible three or four lesson columns.
 if(original.length>4)return mapCells(original,warnings);
 const cells=original;
 if(cells.length>=3&&!cells[0]){
  const result=emptyLesson();
  result.issueProfile=cells[1]||'';
  result.detailsCorrectiveAction=join(cells.slice(2));
  warnings.push('Lesson title is blank in the copied range. Enter it in Preview.');
  return result;
 }
 if(cells.length>=3&&cells[0]&&!cells[1]){
  const result=emptyLesson();result.lessonLearned=cells[0];
  result.detailsCorrectiveAction=join(cells.slice(2));
  warnings.push('Issue Profile is blank in the copied range.');
  return result;
 }
 return mapCells(cells,warnings);
}
/** Result: { lesson: four named fields, warnings: user-facing notes, source }.
 * Works with pasted 3/4/5+ columns and a single free-text cell.
 * Never invents missing factual information.
 */
export function parseExcelLessonFlexible({html='',text='',Parser}={}){
 let htmlRows=[];
 try{htmlRows=extractExcelHtmlRows(html,Parser);}catch{htmlRows=[];} // Some Excel clipboard HTML is incomplete.
 const plainRows=splitExcelText(text);
 const actualRows=rows=>rows.filter(row=>row.some(Boolean)&&!isHeader(row)&&!isVesselCaption(row));
 // HTML clipboard has true TD boundaries; more reliable than TSV with line breaks.
 // However, some Excel versions send only an HTML header fragment; then use TSV.
 const contentHtml=actualRows(htmlRows);
 const source=contentHtml.length?'html':'text';
 const rows=source==='html'?contentHtml:actualRows(plainRows);
 if(!rows.length)throw new Error('Nothing to import. Copy at least one cell from Excel.');
 const warnings=[];
 let row=rows[0];
 if(rows.length>1){
  // A copied single lesson can contain continuation rows from merged Excel cells.
  // If several real lesson titles are detected, do not silently blend two lessons.
  const distinct=rows.slice(1).filter(r=>r.length>=3&&looksLikeTitle(r[0])&&r[1]&&r[2]);
  if(distinct.length)throw new Error('Multiple lessons detected. Please copy one lesson at a time to avoid mixing records.');
  row=[...row];
  for(const continuation of rows.slice(1)){
   if(continuation.length===1) {
    const destination=row.length>=3?Math.max(2,row.length-1):row.length===2?1:0;
    row[destination]=join([row[destination],continuation[0]]);
   }else{
    for(let i=0;i<continuation.length;i++){
     const dest=i<row.length?i:row.length-1;
     row[dest]=join([row[dest],continuation[i]]);
    }
   }
  }
  warnings.push('The pasted data spans multiple Excel rows. Continuation text was combined into one lesson.');
 }
 const lesson=mapSingleRow(row,warnings);
 if(!lesson.lessonLearned)warnings.push('Lesson Learned title is not identifiable. Please enter it in Preview before saving.');
 if(!lesson.issueProfile)warnings.push('Issue Profile is empty or could not be identified.');
 if(!lesson.detailsCorrectiveAction)warnings.push('Details / Corrective Action is empty or could not be identified.');
 return {lesson,warnings,source};
}
