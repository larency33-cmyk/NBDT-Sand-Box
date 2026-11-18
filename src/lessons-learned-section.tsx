import React,{useState,useEffect} from 'react';
import {Ship,Plus,Trash2,ClipboardPaste} from 'lucide-react';
import {groupLessons,normalizeLesson,parseExcelLesson,isLessonPopulated,sameLesson,SUGGESTED_VESSELS,LESSON_COLUMNS,UNASSIGNED_VESSEL} from './lessons-learned.mjs';

const COLUMNS=[['lessonLearned','Lesson Learned'],['issueProfile','Issue Profile'],['detailsCorrectiveAction','Details / Corrective Action'],['resolvedBy','Resolved By']];
const FIELDS=['Description','Application','Area / Venue','Category','Author','Type','Owner','Product Team','Comments','Tracking','Ticket','Ticket Date','Corrective Action','Notes','Doc Needed'];
function FormattedCell({value}:{value:string}){
 const lines=String(value||'').split('\n');
 return <div className="nb74-cell-lines">{lines.map((line,index)=>{
  const match=line.match(/^\s*([\w /-]{2,35})\s*:\s*(.*)$/);
  const label=match?.[1]?.trim();
  const matched=label&&FIELDS.some(item=>item.toLowerCase()===label.toLowerCase());
  return <div key={index} className={line.trim()?'nb74-cell-line':'nb74-cell-gap'}>{matched?<><strong>{label}:</strong>{match[2]?' '+match[2]:''}</>:line||'\u00a0'}</div>;
 })}</div>;
}
function LessonsTable({vessel,lessons}:{vessel:string,lessons:any[]}){
 return <section className="nb74-ship-group" aria-label={`Lessons from ${vessel}`}>
  <div className="nb74-ship-header"><span className="nb74-ship-icon" aria-hidden="true"><Ship size={16}/></span><strong>{vessel}</strong><span className="nb74-ship-count">{lessons.length} {lessons.length===1?'lesson':'lessons'}</span></div>
  <div className="nb74-table-scroll"><table className="nb74-lesson-table"><colgroup><col className="nb74-title-col"/><col className="nb74-profile-col"/><col className="nb74-details-col"/><col className="nb74-resolved-col"/></colgroup>
   <thead><tr>{COLUMNS.map(([,label])=><th key={label} scope="col">{label}</th>)}</tr></thead>
   <tbody>{lessons.map((lesson,i)=><tr key={lesson.id||i}>
    <td className="nb74-title-cell"><strong>{lesson.lessonLearned||'—'}</strong></td>
    <td><FormattedCell value={lesson.issueProfile}/></td>
    <td><FormattedCell value={lesson.detailsCorrectiveAction}/></td>
    <td className="nb74-resolved-cell"><FormattedCell value={lesson.resolvedBy}/></td>
   </tr>)}</tbody>
  </table></div>
 </section>;
}
export function LessonsLearnedBody({items,editing,draft,onDraftChange,onImportSave,onSave,onCancel,saving}:{
 items:any[],editing:boolean,draft:any[],onDraftChange:(next:any[])=>void,onImportSave:(lesson:any)=>Promise<boolean>,onSave:()=>void,onCancel:()=>void,saving:boolean,
}){
 const [vessel,setVessel]=useState('');
 const [raw,setRaw]=useState('');
 const [parsed,setParsed]=useState<any|null>(null);
 const [error,setError]=useState('');
 const [importing,setImporting]=useState(false);
 useEffect(()=>{if(!editing){setRaw('');setParsed(null);setError('');}},[editing]);
 const displayed=groupLessons(items);
 const known=[...new Set([...SUGGESTED_VESSELS,...draft.map(l=>l.vessel),...items.map(l=>l.vessel)].filter(Boolean))];
 const setField=(id:string,key:string,value:string)=>onDraftChange(draft.map(item=>item.id===id?{...item,[key]:value}:item));
 const attemptPaste=(html:string,text:string)=>{
  setRaw(text);setParsed(null);setError('');
  try{setParsed(parseExcelLesson({html,text}));}catch(err:any){setError(err?.message||'Unable to parse Excel cells.');}
 };
 const importLesson=async()=>{
  if(!parsed||!vessel.trim()||importing||saving)return;
  const record={...parsed,vessel:vessel.trim()};
  if(draft.some(lesson=>sameLesson(lesson,record))){setError('This lesson already exists for this vessel.');return;}
  setImporting(true);setError('');
  try{const ok=await onImportSave(record);if(ok){setRaw('');setParsed(null);}else setError('Could not save the lesson. Please try again.');}
  catch(err:any){setError(err?.message||'Unable to save the lesson.');}
  finally{setImporting(false);}
 };
 return <div className="nb74-lessons-body">
  {editing?<>
   <div className="nb74-import-panel">
    <div className="nb74-import-heading"><ClipboardPaste size={18}/><strong>Paste from Excel</strong><span>Copy four cells from one lesson row</span></div>
    <div className="nb74-paste-layout">
     <label className="nb74-vessel-field">Vessel / project
      <input value={vessel} onChange={e=>{setVessel(e.target.value);setError('');}} list="nb74-vessels" placeholder="Select or enter ship name" aria-label="Vessel for imported lesson"/>
      <datalist id="nb74-vessels">{known.map(name=><option value={name} key={name}/>)}</datalist>
     </label>
     <label className="nb74-paste-field">Paste Excel cells here
      <textarea rows={3} value={raw} onChange={e=>{setRaw(e.target.value);setParsed(null);setError('');}} onPaste={e=>{
       const html=e.clipboardData.getData('text/html');const text=e.clipboardData.getData('text/plain');
       if(html||text){e.preventDefault();attemptPaste(html,text);}
      }} placeholder="Select four cells in Excel, copy and press Ctrl+V" aria-label="Paste Excel lesson cells"/>
     </label>
    </div>
    <div className="nb74-import-actions">
     <button type="button" className="nb74-secondary" disabled={!raw.trim()||saving||importing} onClick={()=>attemptPaste('',raw)}>Preview</button>
     <button type="button" className="nb74-primary" disabled={!parsed||!vessel.trim()||saving||importing} onClick={importLesson}>{importing?'Saving…':'Save Lesson'}</button>
    </div>
    {error&&<p className="nb74-import-error" role="alert">{error}</p>}
    {parsed&&<div className="nb74-import-preview"><div className="nb74-import-preview-heading">Preview · {vessel.trim()||'Choose vessel'}</div><LessonsTable vessel={vessel.trim()||'Selected vessel'} lessons={[{...parsed,id:'preview'}]}/></div>}
   </div>
   <div className="nb74-existing-heading">Existing lessons</div>
   {draft.length?draft.map((lesson:any,index:number)=><div className="nb74-edit-lesson" key={lesson.id}>
    <div className="nb74-edit-lesson-header"><strong>Lesson {index+1}</strong><button type="button" title="Delete lesson" aria-label={`Delete lesson ${index+1}`} onClick={()=>{if(window.confirm(`Delete lesson “${lesson.lessonLearned||`#${index+1}`}”?`))onDraftChange(draft.filter(item=>item.id!==lesson.id));}}><Trash2 size={16}/> Delete</button></div>
    <label className="nb74-edit-vessel">Vessel / project<input value={lesson.vessel||''} list="nb74-vessels" onChange={e=>setField(lesson.id,'vessel',e.target.value)} placeholder="Vessel not specified"/></label>
    <div className="nb74-edit-fields">{COLUMNS.map(([key,label])=><label key={key}>{label}<textarea rows={key==='lessonLearned'||key==='resolvedBy'?2:4} value={lesson[key]||''} onChange={e=>setField(lesson.id,key,e.target.value)}/></label>)}</div>
   </div>):<p className="nb74-empty-edit">No lessons recorded yet.</p>}
   <div className="nb74-editor-footer"><button className="nb74-secondary" type="button" disabled={saving} onClick={()=>onDraftChange([...draft,{id:`lesson-${Date.now()}-${Math.random().toString(36).slice(2)}`,vessel:vessel.trim(),lessonLearned:'',issueProfile:'',detailsCorrectiveAction:'',resolvedBy:'',text:''}])}><Plus size={15}/> Add manually</button><div><button type="button" className="nb74-secondary" disabled={saving} onClick={onCancel}>Cancel</button><button type="button" className="nb74-primary" disabled={saving||draft.some(l=>isLessonPopulated(l)&&!l.lessonLearned.trim())} onClick={onSave}>{saving?'Saving…':'Save changes'}</button></div></div>
  </>:displayed.length?displayed.map(group=><LessonsTable key={group.vessel} {...group}/>):<p className="nb74-empty">No lessons learned have been added.</p>}
 </div>;
}
