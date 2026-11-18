/** Lessons Learned from Excel — text-only, lossless, browser-local import. */
export const LESSON_COLUMNS = ['lessonLearned','issueProfile','detailsCorrectiveAction','resolvedBy'];
export const UNASSIGNED_VESSEL = 'Vessel not specified';
export const SUGGESTED_VESSELS = ['Legend of the Seas','Star of the Seas','Utopia of the Seas'];

const clean = value => String(value ?? '').replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ').trim();

/** Keep all legacy notes instead of assigning an invented ship or losing data. */
export function normalizeLesson(item, index=0){
 const raw = item && typeof item==='object'?item:{text:String(item??'')};
 const legacyText = clean(raw.text);
 const structured = LESSON_COLUMNS.some(key=>Object.prototype.hasOwnProperty.call(raw,key));
 const parts = structured?null:legacyText.split('\n');
 return {
  ...raw,
  id:raw.id||`legacy-lesson-${index}`,
  vessel:clean(raw.vessel),
  lessonLearned:structured?clean(raw.lessonLearned):clean(parts?.[0]||''),
  issueProfile:structured?clean(raw.issueProfile):'',
  detailsCorrectiveAction:structured?clean(raw.detailsCorrectiveAction):clean(parts?.slice(1).join('\n')||''),
  resolvedBy:structured?clean(raw.resolvedBy):'',
  text:legacyText,
 };
}
export function isLessonPopulated(item){return LESSON_COLUMNS.some(key=>clean(item[key]));}
export function serializeLessons(items){
 const normalized=items.map(normalizeLesson).filter(isLessonPopulated);
 return {
  lessonsLearnedItems: normalized.map(item=>({
   ...item,
   vessel:clean(item.vessel),
   lessonLearned:clean(item.lessonLearned),
   issueProfile:clean(item.issueProfile),
   detailsCorrectiveAction:clean(item.detailsCorrectiveAction),
   resolvedBy:clean(item.resolvedBy),
   // Preserve existing free-text exports but do not overwrite structured fields.
   text:clean([item.lessonLearned,item.issueProfile,item.detailsCorrectiveAction,item.resolvedBy].filter(Boolean).join('\n\n')),
  })),
  lessonsLearned:normalized.map(item=>clean([item.lessonLearned,item.issueProfile,item.detailsCorrectiveAction,item.resolvedBy].filter(Boolean).join('\n\n'))).join('\n\n'),
 };
}
export function groupLessons(items){
 const groups=new Map();
 items.map(normalizeLesson).filter(isLessonPopulated).forEach(item=>{
  const vessel=item.vessel||UNASSIGNED_VESSEL;
  if(!groups.has(vessel))groups.set(vessel,[]);
  groups.get(vessel).push(item);
 });
 return [...groups.entries()].map(([vessel,lessons])=>({vessel,lessons}));
}
export function sameLesson(a,b){
 return [a.vessel,...LESSON_COLUMNS.map(k=>a[k])].every((part,i)=>clean(part).toLocaleLowerCase()===clean(i===0?b.vessel:b[LESSON_COLUMNS[i-1]]).toLocaleLowerCase());
}
export function splitExcelText(input){
 const text=String(input||'').replace(/\uFEFF/g,'').replace(/\r\n?/g,'\n');
 const rows=[],row=[];let cell='',quoted=false;
 for(let i=0;i<text.length;i++){
  const char=text[i];
  if(char==='"'){
   if(quoted && text[i+1]==='"'){cell+='"';i++;}
   else if(quoted || !cell.trim())quoted=!quoted;
   else cell+='"';
  }else if(char==='\t'&&!quoted){row.push(clean(cell));cell='';}
  else if(char==='\n'&&!quoted){row.push(clean(cell));if(row.some(Boolean))rows.push([...row]);row.length=0;cell='';}
  else cell+=char;
 }
 row.push(clean(cell));if(row.some(Boolean))rows.push(row);
 return rows;
}
export function isExcelHeader(row){
 const values=row.map(cell=>clean(cell).replace(/\s+/g,' ').toLowerCase());
 return values.length===4 && values[0]==='lesson learned' && values[1]==='issue profile' && /details.*corrective action/.test(values[2]) && values[3]==='resolved by';
}
// Read HTML only through DOMParser (no unsafe HTML insertion into the app).
// Excel supplies an HTML table containing real rows/cells; that is preferred to
// TSV because tabs and line breaks inside rich text cells remain unambiguous.
export function extractExcelHtmlRows(html,Parser=typeof DOMParser!=='undefined'?DOMParser:null){
 if(!html||!Parser)return [];
 const doc=new Parser().parseFromString(html,'text/html');
 const table=doc.querySelector('table');if(!table)return [];
 const cellText=element=>{
  const parts=[];
  const walk=node=>{
   if(node.nodeType===3){parts.push(node.nodeValue||'');return;}
   if(node.nodeType!==1)return;
   const tag=node.tagName.toLowerCase();
   if(['script','style','head'].includes(tag))return;
   if(tag==='br'){parts.push('\n');return;}
   const block=['p','div','li','tr'].includes(tag);
   if(block&&parts.length&&!parts.at(-1).endsWith('\n'))parts.push('\n');
   for(const child of node.childNodes)walk(child);
   if(block)parts.push('\n');
  };
  for(const child of element.childNodes)walk(child);
  return clean(parts.join('').replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n'));
 };
 const rows=[];
 for(const row of table.querySelectorAll('tr')){
  const cells=[...row.children].filter(el=>['TD','TH'].includes(el.tagName)).map(el=>cellText(el));
  if(cells.some(Boolean))rows.push(cells);
 }
 return rows;
}
export function parseExcelLesson({html='',text='',Parser}={}){
 const htmlRows=extractExcelHtmlRows(html,Parser);
 const rows=(htmlRows.some(row=>row.length===4)?htmlRows:splitExcelText(text))
  .filter(row=>row.some(Boolean)&&!isExcelHeader(row));
 if(rows.length!==1)throw new Error(rows.length?'Select only one lesson row in Excel and paste again.':'Copy one lesson row (four cells) from Excel.');
 if(rows[0].length!==4)throw new Error(`Expected four Excel columns, but received ${rows[0].length}. Select Lesson Learned, Issue Profile, Details / Corrective Action and Resolved By.`);
 const result=Object.fromEntries(LESSON_COLUMNS.map((key,index)=>[key,clean(rows[0][index])]));
 if(!result.lessonLearned)throw new Error('The Lesson Learned cell must contain a title.');
 return result;
}
