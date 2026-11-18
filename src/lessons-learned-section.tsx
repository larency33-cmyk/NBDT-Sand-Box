import React,{useState,useEffect,useRef} from 'react';
import {Ship,Plus,Trash2,ClipboardPaste} from 'lucide-react';
import {groupLessons,normalizeLesson,isLessonPopulated,sameLesson,SUGGESTED_VESSELS,LESSON_COLUMNS,UNASSIGNED_VESSEL,extractExcelHtmlRows} from './lessons-learned.mjs';
import {parseExcelLessonFlexible} from './lessons-smart-import.mjs';
import {formatLessonBlocks} from './lessons-formatting.mjs';

const COLUMNS=[['lessonLearned','Lesson Learned'],['issueProfile','Issue Profile'],['detailsCorrectiveAction','Details / Corrective Action'],['resolvedBy','Resolved By']];
function FormattedCell({value}:{value:string}){
 const blocks=formatLessonBlocks(value);
 return <div className="nb74-cell-lines nb75-cell-lines">{blocks.map((block:any,index:number)=>{
  if(block.kind==='spacer')return <div key={index} className="nb74-cell-gap"/>;
  if(block.kind==='field')return <div key={index} className={`nb74-cell-line nb75-cell-field nb75-cell-field--${block.layout}`}>
   <strong>{block.label}{block.layout==='inline'?':':''}</strong>{block.value&&<span>{block.layout==='inline'?' ':''}{block.value}</span>}
  </div>;
  return <div key={index} className="nb74-cell-line">{block.value}</div>;
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
 const [parseNotes,setParseNotes]=useState<string[]>([]);
 const lastClipboard=useRef({html:'',text:''});
 const [error,setError]=useState('');
 const [importing,setImporting]=useState(false);
 useEffect(()=>{if(!editing){setRaw('');setParsed(null);setParseNotes([]);setError('');lastClipboard.current={html:'',text:''};}},[editing]);
 const displayed=groupLessons(items);
 const known=[...new Set([...SUGGESTED_VESSELS,...draft.map(l=>l.vessel),...items.map(l=>l.vessel)].filter(Boolean))];
 const setField=(id:string,key:string,value:string)=>onDraftChange(draft.map(item=>item.id===id?{...item,[key]:value}:item));
 const attemptPaste=(html:string,text:string)=>{
  // Retain the real HTML clipboard table: it preserves Excel cell boundaries even
  // when a copied cell contains embedded tabs, quotes or multiple paragraphs.
  lastClipboard.current={html,text};
  const pastedText=text||extractExcelHtmlRows(html).map(row=>row.join('\t')).join('\n');
  setRaw(pastedText);setParsed(null);setParseNotes([]);setError('');
  try{
   const result=parseExcelLessonFlexible({html,text:pastedText});
   setParsed(result.lesson);setParseNotes(result.warnings);
  }catch(err:any){setError(err?.message||'Unable to parse Excel cells.');}
 };
 const updateParsedField=(key:string,value:string)=>{
  setParsed((previous:any)=>previous?{...previous,[key]:value}:previous);
  setError('');
 };
 const importLesson=async()=>{
  if(!parsed||!parsed.lessonLearned?.trim()||!vessel.trim()||importing||saving)return;
  const record={...parsed,vessel:vessel.trim()};
  if(draft.some(lesson=>sameLesson(lesson,record))){setError('This lesson already exists for this vessel.');return;}
  setImporting(true);setError('');
  try{const ok=await onImportSave(record);if(ok){setRaw('');setParsed(null);setParseNotes([]);lastClipboard.current={html:'',text:''};}else setError('Could not save the lesson. Please try again.');}
  catch(err:any){setError(err?.message||'Unable to save the lesson.');}
  finally{setImporting(false);}
 };
 return <div className="nb74-lessons-body">
  {editing?<>
   <div className="nb74-import-panel">
    <div className="nb74-import-heading"><ClipboardPaste size={18}/><strong>Paste from Excel</strong><span>Copy a lesson from Excel (3 or 4 columns, or mixed formatting)</span></div>
    <div className="nb74-paste-layout">
     <label className="nb74-vessel-field">Vessel / project
      <input value={vessel} onChange={e=>{setVessel(e.target.value);setError('');}} list="nb74-vessels" placeholder="Select or enter ship name" aria-label="Vessel for imported lesson"/>
      <datalist id="nb74-vessels">{known.map(name=><option value={name} key={name}/>)}</datalist>
     </label>
     <label className="nb74-paste-field">Paste Excel cells here
      <textarea rows={3} value={raw} onChange={e=>{setRaw(e.target.value);setParsed(null);setParseNotes([]);setError('');lastClipboard.current={html:'',text:''};}} onPaste={e=>{
       const html=e.clipboardData.getData('text/html');const text=e.clipboardData.getData('text/plain');
       if(html||text){e.preventDefault();attemptPaste(html,text);}
      }} placeholder="Copy a lesson from Excel and press Ctrl+V. A missing Resolved By column is OK." aria-label="Paste Excel lesson cells"/>
     </label>
    </div>
    <div className="nb74-import-actions">
     <button type="button" className="nb74-secondary" disabled={!raw.trim()||saving||importing} onClick={()=>{if(!parsed)attemptPaste(lastClipboard.current.text===raw?lastClipboard.current.html:'',raw);}}>Preview</button>
     <button type="button" className="nb74-primary" disabled={!parsed||!parsed.lessonLearned?.trim()||!vessel.trim()||saving||importing} onClick={importLesson}>{importing?'Saving…':'Save Lesson'}</button>
    </div>
    {error&&<p className="nb74-import-error" role="alert">{error}</p>}
    {parsed&&<div className="nb74-import-preview">
     <div className="nb74-import-preview-heading">Review detected fields · {vessel.trim()||'Choose vessel'}</div>
     {parseNotes.length>0&&<div className="nb76-import-notes" aria-label="Excel import notes">{parseNotes.map((note,i)=><p key={i}>{note}</p>)}</div>}
     <div className="nb76-import-review-fields">{COLUMNS.map(([key,label])=><label key={key}>{label}{key==='lessonLearned'&&<span className="nb76-required"> · required</span>}
      {key==='lessonLearned'||key==='resolvedBy'?<input value={parsed[key]||''} onChange={e=>updateParsedField(key,e.target.value)} placeholder={key==='lessonLearned'?'Enter lesson name if missing':'Optional'}/>:<textarea rows={key==='detailsCorrectiveAction'?5:4} value={parsed[key]||''} onChange={e=>updateParsedField(key,e.target.value)}/>}
     </label>)}</div>
     {!parsed.lessonLearned?.trim()&&<p className="nb76-import-title-hint">Enter the lesson title above to enable Save Lesson.</p>}
     <LessonsTable vessel={vessel.trim()||'Selected vessel'} lessons={[{...parsed,id:'preview'}]}/>
    </div>}
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
