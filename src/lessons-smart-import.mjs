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
function parseFreeText(value){
 const lesson=emptyLesson();let target='detailsCorrectiveAction';
 const pieces=clean(value).split('\n');
 const sections={lessonLearned:[],issueProfile:[],detailsCorrectiveAction:[],resolvedBy:[]};
 let headings=0;
 for(const raw of pieces){
  const line=clean(raw);
  const named=line.match(/^\s*(lesson learned|issue profile|details\s*\/\s*corrective action|resolved by)\s*[:：]\s*(.*)$/i);
  const standalone=commonHeading.test(line);
  if(named||standalone){
   const heading=labelKey(named?named[1]:line);
   target=heading==='lesson learned'?'lessonLearned':heading==='issue profile'?'issueProfile':heading==='resolved by'?'resolvedBy':'detailsCorrectiveAction';
   if(named?.[2])sections[target].push(named[2]);headings++;continue;
  }
  if(labelHeading.test(line))target='issueProfile';
  else if(detailHeading.test(line))target='detailsCorrectiveAction';
  sections[target].push(raw);
 }
 for(const key of LESSON_COLUMNS)lesson[key]=clean(sections[key].join('\n'));
 if(!headings&&looksLikeTitle(pieces[0])&&pieces.length>1&&
    (labelHeading.test(pieces[1])||detailHeading.test(pieces[1]))){
  // Common plaintext copy: first line is the title, following lines are field labels.
  lesson.lessonLearned=clean(pieces[0]);
  lesson.detailsCorrectiveAction=clean(lesson.detailsCorrectiveAction.replace(new RegExp('^'+pieces[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*\\n?'),''));
 }
 return lesson;
}
function mapCells(row,warnings){
 const cells=[...row].map(clean);
 // Extra empty columns are common after copying a merged Excel range.
 while(cells.length>4&&!cells.at(-1))cells.pop();
 while(cells.length>4&&!cells[0])cells.shift();
 if(cells.length>4){
  for(let i=cells.length-2;i>0&&cells.length>4;i--)if(!cells[i])cells.splice(i,1);
 }
 if(cells.length===1){
  const lesson=parseFreeText(cells[0]);
  warnings.push('The paste has one text block. Check the detected fields and enter a title if needed.');
  return lesson;
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
  warnings.push('Only two columns were detected. Review the fields before saving.');
  return result;
 }
 if(cells.length===3){
  // The user's Mobile ACP template has no Resolved By column.
  result.lessonLearned=cells[0];
  result.issueProfile=cells[1];
  result.detailsCorrectiveAction=cells[2];
  warnings.push('Three columns detected: Resolved By was left blank because it is missing in Excel.');
  return result;
 }
 if(cells.length===4){
  for(let i=0;i<4;i++)result[LESSON_COLUMNS[i]]=cells[i];
  return result;
 }
 // Unusual 5+ columns: preserve EVERY fragment instead of rejecting the row.
 result.lessonLearned=cells[0];
 const trailingOwner=looksLikeOwner(cells.at(-1));
 const contentEnd=trailingOwner?cells.length-1:cells.length;
 // Some exports split DESCRIPTION / APPLICATION / AUTHOR onto separate cells,
 // with COMMENTS or CORRECTIVE ACTION appearing several cells later.
 const explicitDetailStart=cells.findIndex((value,index)=>index>=2&&index<contentEnd&&detailHeading.test(value));
 let detailStart=explicitDetailStart>=2?explicitDetailStart:2;
 if(explicitDetailStart<0&&cells.length>4){
  for(let i=2;i<contentEnd-1;i++){
   if(labelHeading.test(cells[i]) || (cells[i].length<75 && labelHeading.test(cells[i-1]) && (cells[i+1].length>100||detailHeading.test(cells[i+1]))))detailStart=i+1;
   else break;
  }
 }
 result.issueProfile=join(cells.slice(1,detailStart));
 result.detailsCorrectiveAction=join(cells.slice(detailStart,contentEnd));
 if(trailingOwner)result.resolvedBy=stripOwner(cells.at(-1));
 warnings.push(`Excel supplied ${row.length} columns. Additional text was grouped using the detected section labels; please review the mapping.`);
 return result;
}
function mapSingleRow(row,warnings){
 const cells=row.map(clean);
 const nonEmpty=cells.filter(Boolean);
 if(!nonEmpty.length)return emptyLesson();
 if(cells.length>=3&&cells[0]&&cells[1]&&cells[2])return mapCells(cells,warnings);
 if(cells.length>=3&&!cells[0]){
  const result=emptyLesson();
  result.issueProfile=cells[1]||'';
  result.detailsCorrectiveAction=join(cells.slice(2));
  warnings.push('The title cell is empty. Enter the lesson title in Preview.');
  return result;
 }
 if(cells.length>=3&&cells[0]&&!cells[1]){
  const result=emptyLesson();result.lessonLearned=cells[0];
  result.detailsCorrectiveAction=join(cells.slice(2));
  warnings.push('Issue Profile is empty in Excel.');
  return result;
 }
 return mapCells(cells,warnings);
}
/** Result: { lesson: four named fields, warnings: user-facing notes, source }.
 * Works with pasted 3/4/5+ columns and a single free-text cell.
 * Never invents missing factual information.
 */
export function parseExcelLessonFlexible({html='',text='',Parser}={}){
 const htmlRows=extractExcelHtmlRows(html,Parser);
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
  if(distinct.length)throw new Error('Multiple lessons detected. Please copy one lesson at a time.');
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
