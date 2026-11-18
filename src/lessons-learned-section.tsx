import React,{useState,useEffect,useRef} from 'react';
import {Ship,Plus,Trash2,ClipboardPaste,Check,Square,CheckSquare} from 'lucide-react';
import {getLessonReview,LESSON_REVIEW_LABELS} from './lesson-review.mjs';
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
/** A new-ship review is separate from historical issue / corrective action text. */
function LessonReviewCell({lesson,projectId,canReview,saving,onReviewSave}:any){
 const review=getLessonReview(lesson,projectId);
 const [editingReview,setEditingReview]=useState(false);
 const [reviewStatus,setReviewStatus]=useState('pending');
 const [reviewedBy,setReviewedBy]=useState('');
 const [reviewNote,setReviewNote]=useState('');
 const [reviewError,setReviewError]=useState('');
 const [busy,setBusy]=useState(false);
 const startReview=(nextStatus=review.status)=>{
  if(!canReview||saving||busy)return;
  setReviewStatus(nextStatus);setReviewedBy(review.reviewedBy);setReviewNote(review.note);
  setReviewError('');setEditingReview(true);
 };
 const cancelReview=()=>{setEditingReview(false);setReviewError('');};
 const saveReview=async()=>{
  if(!canReview||busy||saving)return;
  if(reviewStatus!=='pending'&&!reviewedBy.trim()){
   setReviewError('Enter the person who checked this lesson before updating its status.');return;
  }
  setBusy(true);setReviewError('');
  try{
   if(await onReviewSave(lesson.id,{status:reviewStatus,reviewedBy,note:reviewNote}))setEditingReview(false);
   else setReviewError('Could not save this review. Please try again.');
  }catch(error:any){setReviewError(error?.message||'Could not save this review.');}
  finally{setBusy(false);}
 };
 const stamp=review.status==='confirmed'?review.confirmedAt:review.updatedAt;
 const date=stamp?new Date(stamp):null;
 const dateLabel=date&&!Number.isNaN(date.getTime())?date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
 return <td className="nb78-review-cell nb79-review-cell">
  <div className="nb78-review-display nb79-review-display">
   <div className="nb78-review-leading nb79-review-leading">
    {canReview?<input className="nb78-confirm-checkbox" type="checkbox" checked={review.status==='confirmed'} disabled={saving||busy||editingReview} onChange={e=>startReview(e.target.checked?'confirmed':'pending')} aria-label={`Confirm ${lesson.lessonLearned||'lesson'} for current ship`}/>
     :<span className={`nb78-review-check-icon nb79-review-check-icon ${review.status==='confirmed'?'nb79-review-check-icon--confirmed':''}`} aria-hidden="true">{review.status==='confirmed'?<CheckSquare size={22}/>:<Square size={22}/>}</span>}
    {canReview?<button type="button" className={`nb78-review-status nb78-review-status--${review.status} nb79-review-status-button`} disabled={saving||busy||editingReview} onClick={()=>startReview()} aria-label={`Edit ${LESSON_REVIEW_LABELS[review.status]} status for ${lesson.lessonLearned||'lesson'}`}>{LESSON_REVIEW_LABELS[review.status]}</button>
     :<span className={`nb78-review-status nb78-review-status--${review.status}`}>{LESSON_REVIEW_LABELS[review.status]}</span>}
   </div>
   {review.reviewedBy&&<div className="nb78-review-meta"><strong>{review.status==='confirmed'?'Reviewed by':review.status==='in-progress'?'Reviewed by':'Updated by'} {review.reviewedBy}</strong>{dateLabel&&<> · {dateLabel}</>}</div>}
   {review.note?<p className="nb78-review-note">{review.note}</p>:review.status==='pending'?<p className="nb78-review-note nb79-review-placeholder">Not yet reviewed for this ship.</p>:review.status==='in-progress'?<p className="nb78-review-note nb79-review-placeholder">Review in progress for this ship.</p>:null}
  </div>
  {editingReview&&<div className="nb78-review-editor">
   <label>Current ship review
    <select aria-label={`Review status for ${lesson.lessonLearned||'lesson'}`} value={reviewStatus} disabled={busy} onChange={e=>{setReviewStatus(e.target.value);setReviewError('');}}>
     <option value="pending">{LESSON_REVIEW_LABELS.pending}</option>
     <option value="in-progress">{LESSON_REVIEW_LABELS['in-progress']}</option>
     <option value="confirmed">{LESSON_REVIEW_LABELS.confirmed}</option>
    </select>
   </label>
   <label className="nb78-review-checklabel"><input type="checkbox" checked={reviewStatus==='confirmed'} disabled={busy} onChange={e=>{setReviewStatus(e.target.checked?'confirmed':'in-progress');setReviewError('');}}/> Addressed on this ship</label>
   <label>Reviewed by {reviewStatus!=='pending'?'*':''}<input value={reviewedBy} disabled={busy} onChange={e=>setReviewedBy(e.target.value)} placeholder="Person who checked this lesson"/></label>
   <label>Notes (optional)<textarea rows={3} value={reviewNote} disabled={busy} onChange={e=>setReviewNote(e.target.value)} placeholder="How this was addressed or what remains"/></label>
   {reviewError&&<p className="nb78-review-error" role="alert">{reviewError}</p>}
   <div className="nb78-review-actions"><button type="button" onClick={cancelReview} disabled={busy}>Cancel</button><button type="button" className="nb78-review-save" disabled={busy||saving} onClick={saveReview}><Check size={12}/> {busy?'Saving…':'Save review'}</button></div>
  </div>}
 </td>;
}
function LessonsTable({vessel,lessons,projectId='',canReview=false,saving=false,onReviewSave=async()=>false}:any){
 return <section className="nb74-ship-group nb79-ship-group" aria-label={`Lessons from ${vessel}`}>
  <div className="nb74-ship-header nb79-ship-header"><span className="nb74-ship-icon" aria-hidden="true"><Ship size={16}/></span><strong>{vessel}</strong><span className="nb74-ship-count">{lessons.length} {lessons.length===1?'lesson':'lessons'}</span></div>
  <div className="nb74-table-scroll"><table className="nb74-lesson-table nb78-lesson-table nb79-lesson-table"><colgroup><col className="nb74-title-col"/><col className="nb74-profile-col"/><col className="nb74-details-col"/><col className="nb74-resolved-col"/><col className="nb78-review-col"/></colgroup>
   <thead><tr>{COLUMNS.map(([,label])=><th key={label} scope="col">{label}</th>)}<th scope="col">Current Ship Review</th></tr></thead>
   <tbody>{lessons.map((lesson:any,i:number)=><tr key={lesson.id||i}>
    <td className="nb74-title-cell"><strong>{lesson.lessonLearned||'—'}</strong></td>
    <td><FormattedCell value={lesson.issueProfile}/></td>
    <td><FormattedCell value={lesson.detailsCorrectiveAction}/></td>
    <td className="nb74-resolved-cell"><FormattedCell value={lesson.resolvedBy}/></td>
    <LessonReviewCell lesson={lesson} projectId={projectId} canReview={canReview} saving={saving} onReviewSave={onReviewSave}/>
   </tr>)}</tbody>
  </table></div>
 </section>;
}
export function LessonsLearnedBody({items,editing,draft,onDraftChange,onImportSave,onSave,onCancel,saving,projectId,canReview,onReviewSave}:{
 items:any[],editing:boolean,draft:any[],onDraftChange:(next:any[])=>void,onImportSave:(lesson:any)=>Promise<boolean>,onSave:()=>void,onCancel:()=>void,saving:boolean,
 projectId:string,canReview:boolean,onReviewSave:(id:string,review:any)=>Promise<boolean>,
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
  let pastedText=text;
  if(!pastedText){try{pastedText=extractExcelHtmlRows(html).map(row=>row.join('\t')).join('\n');}catch{pastedText='';}}
  setRaw(pastedText);setParsed(null);setParseNotes([]);setError('');
  try{
   const result=parseExcelLessonFlexible({html,text:pastedText});
   setParsed(result.lesson);setParseNotes(result.warnings);
  }catch(err:any){
   // A nonstandard/merged Excel selection should NEVER permanently block Preview.
   // Keep the complete original data in a field so the user can move it without
   // copying again. Do not guess an unknown title or silently lose text.
   if(pastedText.trim()){
    setParsed({lessonLearned:'',issueProfile:'',detailsCorrectiveAction:pastedText,resolvedBy:''});
    setParseNotes([`Automatic field mapping was uncertain (${err?.message||'unknown Excel layout'}). All pasted text is preserved below. Enter a lesson title and adjust the fields before saving.`]);
   }else setError('No readable Excel text was found. Copy the cells again.');
  }
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
    <div className="nb74-import-heading"><ClipboardPaste size={18}/><strong>Paste from Excel</strong><span>Copy one lesson from Excel — any column layout</span><small className="nb77-import-version">v0.6.77</small></div>
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
  </>:displayed.length?displayed.map(group=><LessonsTable key={group.vessel} {...group} projectId={projectId} canReview={canReview} saving={saving} onReviewSave={onReviewSave}/>):<p className="nb74-empty">No lessons learned have been added.</p>}
 </div>;
}
