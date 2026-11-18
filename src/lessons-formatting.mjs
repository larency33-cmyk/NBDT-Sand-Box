/** Reusable Excel-like lesson formatting (no HTML injection).
 * Recognizes label/value, uppercase headings without colons, mixed case,
 * and wrapped text copied from separate Excel lines or cells.
 */
const FIELD_LABELS=new Map(Object.entries({
 'description':'Description','application':'Application','app':'Application',
 'area venue':'Area / Venue','area':'Area / Venue','venue':'Area / Venue',
 'category':'Category','author':'Author','product team':'Product Team',
 'type':'Type','owner':'Owner','comments':'Comments','comment':'Comments',
 'tracking':'Tracking','ticket':'Ticket','ticket date':'Ticket Date',
 'corrective action':'Corrective Action','corrective actions':'Corrective Action',
 'notes':'Notes','doc needed':'Doc Needed','document needed':'Doc Needed',
 }).map(([key,value])=>[key,value]));
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[_/:-]+/g,' ').replace(/\s+/g,' ').trim();
const sectionLabels=new Set(['Comments','Tracking','Corrective Action','Notes']);
function getLabel(line){
 const inline=String(line).match(/^\s*([^:：]{2,38})\s*[:：]\s*(.*)$/);
 if(inline){const key=FIELD_LABELS.get(norm(inline[1]));if(key)return {label:key,value:inline[2].trim()};}
 const key=FIELD_LABELS.get(norm(String(line).trim()));
 return key?{label:key,value:''}:null;
}
export function formatLessonBlocks(value){
 const lines=String(value||'').replace(/\r\n?/g,'\n').split('\n');
 const blocks=[];
 for(const raw of lines){
  const line=raw.trim();
  if(!line){if(blocks.length && blocks.at(-1)?.kind!=='spacer')blocks.push({kind:'spacer'});continue;}
  const parsed=getLabel(line);
  if(parsed){
   blocks.push({kind:'field',label:parsed.label,value:parsed.value,layout:sectionLabels.has(parsed.label)?'stack':'inline'});
  }else if(blocks.at(-1)?.kind==='field' && !blocks.at(-1).value){
   // Uppercase Excel headings often put the value on the following line.
   blocks.at(-1).value=line;
  }else if(blocks.at(-1)?.kind==='field' && blocks.at(-1).value && blocks.at(-1).layout==='stack'){
   blocks.at(-1).value += '\n'+line;
  }else{
   blocks.push({kind:'text',value:line});
  }
 }
 while(blocks.at(-1)?.kind==='spacer')blocks.pop();
 return blocks;
}
