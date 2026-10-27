import {Migration,download,useUnsaved} from './enhancements';
import {ProjectStartPicker} from './project-start-picker';
import {UNASSIGNED_MEMBER_ID,memberInitial} from './members.mjs';
import {TECH_FIELDS,effectiveStatus,isoWeek,projectToday,csv} from './extended-model.mjs';
import {weekIndexFromIso} from './navigation.mjs';
import {projectWeekDate,projectWeekDays,weekIndexFromDate,currentWeekIndex,todayInTimezone,validDate} from './schedule.mjs';
import {clampWeekViewport,moveWeekViewport} from './week-navigation.mjs';
import {weekHeaderTone} from './week-palette.mjs';
import {setResult} from './model.mjs';
import {guideTechnicalValues,DEVICE_TYPES} from './registry-metadata.mjs';
import {guideReviewKey,loadGuideReview,changeGuideCheck,acceptGuideReviewStage} from './guide-review.mjs';
import {validateAggregateMetrics,reportCounts} from './reference-report.mjs';
import React,{useState,useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {Monitor,AppWindow,Plug,Network,Globe,LockKeyhole,UserRoundKey,Workflow,ShieldCheck,LayoutGrid,Tag,UserRound,MoreVertical,ClipboardCheck,BookOpen,ChevronLeft,ChevronRight,ChevronDown,Settings2,Rocket,Layers3,Flag,CalendarDays,Search,Users,AlertCircle,Pencil,Trash2,Plus,Check,X} from 'lucide-react';
import {STAGES,LABELS,uid,weekRange,safeUrl,validateGuide,newGuide,runFor,canAccept,setCheck,acceptStage,counts,assignments} from './model.mjs';
const B=({children,onClick,disabled=false,primary=false,className='',...rest}:any)=><button type="button" className={'nb-button '+(primary?'nb-primary ':'')+className} onClick={onClick} disabled={disabled} {...rest}>{children}</button>;
const Badge=({value}:any)=><span className={'nb-badge nb-status-'+String(value).toLowerCase().replaceAll(' ','-')}>{({'In Progress':'Active','Completed':'Done'} as any)[value]||value}</span>;
function useDirty(dirty:boolean){useEffect(()=>{const f=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',f);return()=>window.removeEventListener('beforeunload',f);},[dirty]);}
/** Technical details live in the same versioned Guide used by Registry cards. */
const beginGuideEdit = (sys:any) => {
 const base=sys.guideDraft||sys.publishedGuide||newGuide();
 const stages=base.stages&&Object.values(base.stages).some((steps:any)=>Array.isArray(steps)&&steps.length) ? base.stages : {...base.stages,...Object.fromEntries(STAGES.map(stage=>[stage,(sys.checkSheetData?.[stage]||[]).map((step:any,i:number)=>typeof step==='string'?{id:'legacy-'+stage+'-'+i,label:step,required:true}:{...step,id:step.id||'legacy-'+stage+'-'+i,label:step.label||step.title||String(step),required:step.required!==false})]))};
 const legacy=Object.fromEntries(TECH_FIELDS.map(k=>[k,sys[k]??'']));
 return {...base,stages,technicalSnapshot:{...legacy,...guideTechnicalValues(sys)}};
};
const guideIdentity = (sys:any) => ({
 name:sys.name||'',description:sys.description||'',assigneeId:sys.assigneeId||'',
 documentationUrl:sys.documentationUrl||'',lessonsLearned:sys.lessonsLearned||'',
});
/** Approved read-only Guide layout; all values come from the same Guide snapshot used by Registry. */
const GuideValue = ({value}: {value:any}) => {
 const text=String(value??'').trim();
 return <>{text && text!=='undefined' && text!=='null' ? text : 'Not specified'}</>;
};
/** The same three approved detail cards; individual fields turn into inputs in place. */
const GuideDetailGroup = ({title,icon:Icon,fields,editing,onEdit,onSave,onCancel,isAdmin,saving}:any) =>
 <section className={'nb40-detail-card'+(editing?' nb41-active-editor':'')} aria-label={title}>
  <div className="nb40-detail-title"><span className="nb40-detail-icon" aria-hidden="true"><Icon size={27} strokeWidth={1.9}/></span><h3>{title}</h3>
   {isAdmin&&!editing&&<button type="button" className="nb41-edit-pencil" aria-label={'Edit '+title} title={'Edit '+title} onClick={onEdit}><Pencil size={16}/></button>}
  </div>
  <dl>{fields.map(([label,value,editor]:any)=><React.Fragment key={label}><dt>{label}</dt><dd>{editing?editor:<GuideValue value={value}/>}</dd></React.Fragment>)}</dl>
  {editing&&<div className="nb41-inline-actions"><B primary disabled={saving} onClick={onSave}><Check size={15}/> Save</B><B disabled={saving} onClick={onCancel}>Cancel</B></div>}
 </section>;
const GuideTechnicalReadout = ({values,owner,editingSection,isAdmin,field,ownerInput,identityName,onNameChange,documentationUrl,onDocumentationChange,onEdit,onSave,onCancel,saving}:any) => {
 const os=[values.os,values.osVersion].filter(Boolean).join(' ');
 const common={isAdmin,onSave,onCancel,saving};
 return <div className="nb40-details-grid">
   <GuideDetailGroup {...common} title="Device" icon={Monitor} editing={editingSection==='device'} onEdit={()=>onEdit('device')} fields={[
    ["Endpoint",values.deviceType||values.deviceCategory,field('deviceType','Endpoint')],
    ["OS",os,<div className="nb41-os-inputs" key="os">{field('os','Operating system',['Windows','Linux','iOS','iPadOS','Android','macOS','Other'])}{field('osVersion','OS version')}</div>],
    ["Naming",values.namingConvention,field('namingConvention','Naming')],
    ["Device type",values.deviceCategory,field('deviceCategory','Device type',DEVICE_TYPES)],
    ["System name",'',<input aria-label="System name" value={identityName} onChange={e=>onNameChange(e.target.value)}/>]
   ].filter((row:any)=>editingSection==='device'||!['Device type','System name'].includes(row[0]))}/>
   <GuideDetailGroup {...common} title="Network" icon={Network} editing={editingSection==='network'} onEdit={()=>onEdit('network')} fields={[
    ["Connection",values.network,field('network','Connection',['Wired','WiFi','Offline'])],["VLAN",values.vlan,field('vlan','VLAN')],
    ["IP scope",values.ipScope,field('ipScope','IP scope')],["Reservation",values.ipReservation,field('ipReservation','Reservation')]]}/>
   <GuideDetailGroup {...common} title="Access & management" icon={ShieldCheck} editing={editingSection==='access'} onEdit={()=>onEdit('access')} fields={[
    ["Service account",values.serviceAccount,field('serviceAccount','Service account')],["Domain / OU",values.domainOU,field('domainOU','Domain / OU')],
    ["MDM / AirWatch",values.airWatchTags,field('airWatchTags','MDM / AirWatch')],["Owner",owner,ownerInput],
    ["Documentation URL",'',<input aria-label="Documentation URL" type="url" value={documentationUrl} onChange={e=>onDocumentationChange(e.target.value)}/>],
    ["User account",'',field('userAccount','User account')],["Authentication",'',field('logonType','Authentication')]]
    .filter((row:any)=>editingSection==='access'||!['Documentation URL','User account','Authentication'].includes(row[0]))}/>
  </div>;
};
const GuideApplications = ({value,isAdmin,editing,onEdit,onSave,onCancel,onChange,saving}:any) => {
 const apps=String(value||'').split(/[,;\n\r]+/g).map(v=>v.trim()).filter(Boolean);
 return <section className={'nb40-applications'+(editing?' nb41-active-editor':'')} aria-label="Applications">
   <div className="nb40-apps-heading"><span className="nb40-apps-icon" aria-hidden="true"><LayoutGrid size={26} strokeWidth={2}/></span><div><h2>Applications</h2><p>{apps.length?'Required software':'No applications specified'}</p></div></div>
   {editing?<div className="nb41-apps-edit"><label htmlFor="nb41-apps-text">Applications · one per line</label><textarea id="nb41-apps-text" aria-label="Required applications" rows={4} value={String(value||'')} onChange={e=>onChange(e.target.value)}/><div className="nb41-inline-actions"><B primary disabled={saving} onClick={onSave}><Check size={15}/> Save</B><B disabled={saving} onClick={onCancel}>Cancel</B></div></div>
   :apps.length>0&&<ul className="nb40-apps-list">{apps.map((name,i)=><li key={i}>{name}</li>)}</ul>}
   {isAdmin&&!editing&&<button type="button" className="nb41-edit-pencil nb41-apps-pencil" aria-label="Edit Applications" title="Edit applications" onClick={onEdit}><Pencil size={16}/></button>}
  </section>;
};
/** Section-scoped, spreadsheet-like editing with a separate Guide-verification checklist. */
export function Guide({sys,project,isAdmin,onClose,onUpdateSystem,initialDeviceId,initialStage,onNavigationChange,initialEdit=false,onDeleteSystem}:any){
 const [stage,setStage]=useState(initialStage||'configuration');
 const [deviceId]=useState(initialDeviceId||'');
 const [technical,setTechnical]=useState(true);
 const [message,setMessage]=useState('');
 const [editingSection,setEditingSection]=useState<string|null>(initialEdit?'device':null);
 const [draft,setDraft]=useState<any>(()=>beginGuideEdit(sys));
 const [identity,setIdentity]=useState<any>(()=>guideIdentity(sys));
 const legacyLessons=()=>Array.isArray(sys.lessonsLearnedItems)?sys.lessonsLearnedItems:(sys.lessonsLearned?[{id:'legacy-lesson-'+sys.id,text:String(sys.lessonsLearned),checked:false}]:[]);
 const [lessonDraft,setLessonDraft]=useState<any[]>(legacyLessons);
 const [saving,setSaving]=useState(false);
 const pending=useRef(false);
 const device=(sys.devices||[]).find((d:any)=>d.id===deviceId);
 const run=runFor(sys,device);
 const guide=editingSection==='checklist'?draft:(run?.snapshot||beginGuideEdit(sys));
 const guideKey=guideReviewKey(guide);
 const savedReview=loadGuideReview(sys.guideReview,guide);
 const [reviewDraft,setReviewDraft]=useState<any>(()=>savedReview);
 const reviewDirty=!run&&JSON.stringify(reviewDraft)!==JSON.stringify(savedReview);
 const sectionDirty=editingSection!==null&&(JSON.stringify(draft)!==JSON.stringify(beginGuideEdit(sys))||JSON.stringify(identity)!==JSON.stringify(guideIdentity(sys))||JSON.stringify(lessonDraft)!==JSON.stringify(legacyLessons()));
 const dirty=sectionDirty||reviewDirty;
 useDirty(dirty);useUnsaved(dirty);
 useEffect(()=>{if(!reviewDirty)setReviewDraft(loadGuideReview(sys.guideReview,guide));},[sys.guideReview,guideKey]);
 const close=()=>{if(!dirty||confirm('Discard unsaved guide changes and checklist progress?'))onClose();};
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(e.key==='Escape')close();};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[dirty,onClose]);
 const url=safeUrl(sys.documentationUrl);
 const technicalValues=editingSection&&editingSection!=='lessons'?draft.technicalSnapshot:guideTechnicalValues(sys);
 const owner=sys.assignmentOwnerLabel||project.members.find((m:any)=>m.id===(editingSection==='access'?identity.assigneeId:sys.assigneeId))?.name||'Unassigned';
 const items=guide?.stages?.[stage]||[];
 const previewItems=items.length?items:(sys.checkSheetData?.[stage]||[]);
 const reviewRun=run||{...reviewDraft,snapshot:guide};
 const marked=previewItems.filter((item:any)=>reviewRun.checks?.[item.id]).length;
 const update=async(next:any)=>{if(pending.current)return false;pending.current=true;setSaving(true);try{await onUpdateSystem(next);setMessage('Changes saved');return true;}catch(error:any){setMessage('Save failed: '+error.message);return false;}finally{pending.current=false;setSaving(false);}};
 const updateRun=(next:any)=>update({...sys,deviceRuns:[...(sys.deviceRuns||[]).filter((r:any)=>r.id!==next.id),next]});
 const setTech=(key:string,value:string)=>setDraft((prev:any)=>({...prev,technicalSnapshot:{...prev.technicalSnapshot,[key]:value}}));
 const setMeta=(key:string,value:string)=>setIdentity((prev:any)=>({...prev,[key]:value}));
 const inlineField=(key:string,label:string,options?:readonly string[])=>options?
  <select aria-label={label} value={String(technicalValues[key]??'')} onChange={e=>setTech(key,e.target.value)}><option value="">Not specified</option>{options.map(v=><option key={v} value={v}>{v}</option>)}</select>:
  <input aria-label={label} value={String(technicalValues[key]??'')} onChange={e=>setTech(key,e.target.value)}/>;
 const ownerInput=sys.assignmentOwnerLabel?<span className="nb52-managed-owner" title="Manage ownership in Assignment">{sys.assignmentOwnerLabel} · Managed in Assignment</span>:<select aria-label="Deployment owner" value={identity.assigneeId} onChange={e=>setMeta('assigneeId',e.target.value)}><option value="">Unassigned</option>{project.members.map((m:any)=><option key={m.id} value={m.id}>{m.name}</option>)}</select>;
 const beginEdit=(section:string)=>{if(!isAdmin||editingSection)return;if(reviewDirty&&!confirm('Discard unsaved checklist progress?'))return;
  setReviewDraft(savedReview);setDraft(beginGuideEdit(sys));setIdentity(guideIdentity(sys));setLessonDraft(legacyLessons());setMessage('');setEditingSection(section);if(section==='device'||section==='network'||section==='access')setTechnical(true);
 };
 const cancelEdit=()=>{if(sectionDirty&&!confirm('Discard unsaved section changes?'))return;setDraft(beginGuideEdit(sys));setIdentity(guideIdentity(sys));setLessonDraft(legacyLessons());setEditingSection(null);setMessage('');};
 const validateDetails=()=>{
  if(!identity.name.trim()){setMessage('System name is required.');return false;}
  if(identity.documentationUrl&&!safeUrl(identity.documentationUrl)){setMessage('Documentation URL must be a valid HTTPS link.');return false;}
  if(draft.technicalSnapshot.os!==guideTechnicalValues(sys).os&&(sys.deviceRuns||[]).some((r:any)=>!r.archived)){setMessage('Platform changes require a new endpoint profile when device runs exist.');return false;}
  return true;
 };
 const updatedSystem=(guideChanges:any)=>({...sys,...guideChanges.technicalSnapshot,...identity,name:identity.name.trim(),description:identity.description,guideDraft:guideChanges});
 const saveSection=async()=>{if(!validateDetails())return;
  if(editingSection==='checklist'){
   const errors=validateGuide({...sys,os:draft.technicalSnapshot.os},draft);
   if(errors.length){setMessage(errors.join('; '));return;}
  }
  const next=editingSection==='lessons'?{...sys,lessonsLearnedItems:lessonDraft.map(i=>({...i,text:i.text.trim()})).filter(i=>i.text),lessonsLearned:lessonDraft.map(i=>i.text.trim()).filter(Boolean).join('\n\n')}:updatedSystem(draft);
  if(await update(next))setEditingSection(null);
 };
 const publish=async()=>{
  if(!validateDetails())return;
  const errors=validateGuide({...sys,os:draft.technicalSnapshot.os},draft);
  if(errors.length){setMessage(errors.join('; '));return;}
  if(!confirm('Publish a reviewed guide version? Existing device runs keep their snapshots. Saved guide checklist verification will reset when steps change.'))return;
  const next={...draft,platform:draft.technicalSnapshot.os,version:(sys.publishedGuide?.version||0)+1,publishedAt:new Date().toISOString(),publishedBy:'local-demo',technicalSnapshot:{...draft.technicalSnapshot},valueStates:sys.valueStates||{}};
  if(await update({...updatedSystem(next),publishedGuide:next,guideDraft:null})){setDraft(next);setEditingSection(null);}
 };
 const persistReview=async(next=reviewDraft)=>{const normalized=loadGuideReview(next,guide);if(await update({...sys,guideReview:normalized})){setReviewDraft(normalized);return true;}return false;};
 const markCheck=async(item:any,value:boolean)=>{
  try{
   if(reviewRun.accepted?.[stage]&&!confirm('This stage was accepted. Reopen this and later stages?'))return;
   if(run){await updateRun(setCheck(run,stage,item.id,value));}
   else{setReviewDraft(changeGuideCheck(reviewDraft,guide,stage,item.id,value));setMessage('Unsaved checklist changes');}
  }catch(error:any){setMessage(error.message);}
 };
 const acceptCurrentStage=async()=>{try{
  if(run){const didSave=await updateRun(acceptStage(run,stage));if(!didSave)return;}
  else{const next=acceptGuideReviewStage(reviewDraft,guide,stage);if(!await persistReview(next))return;}
  const index=STAGES.indexOf(stage);if(index<STAGES.length-1){setStage(STAGES[index+1]);onNavigationChange?.({deviceId,stage:STAGES[index+1]});}
 }catch(error:any){setMessage(error.message);}};
 const displayedLessons=Array.isArray(sys.lessonsLearnedItems)?sys.lessonsLearnedItems:legacyLessons();
 const toggleLesson=async(id:string,checked:boolean)=>{const next=displayedLessons.map((item:any)=>item.id===id?{...item,checked}:item);await update({...sys,lessonsLearnedItems:next});};
 const editControls=(section:string)=>editingSection===section?<div className="nb41-inline-actions"><B primary disabled={saving} onClick={saveSection}><Check size={15}/> Save</B><B disabled={saving} onClick={cancelEdit}>Cancel</B></div>:null;
 const editing=!!editingSection;
 return <section className="nb-guide-page nb40-guide-page nb41-guide-page">
  <header className="nb-page-header"><div><h1>{editing?identity.name:sys.name}</h1><p>System configuration guide · {technicalValues.deviceType||technicalValues.deviceCategory||'Device'} · {[technicalValues.os,technicalValues.osVersion].filter(Boolean).join(' ')}</p></div><div className="nb-actions">{url&&<a className="nb-button" href={url} target="_blank" rel="noopener noreferrer">Documentation ↗</a>}<B onClick={close}><ChevronLeft size={18} aria-hidden="true"/>Back to systems</B></div></header>
  <div className="nb-guide-body">
   <section className="nb-technical">
    <button type="button" className="nb-section-toggle" onClick={()=>setTechnical(v=>!v)} aria-expanded={technical}><span>Technical essentials</span><span>{technical?'Collapse':'Expand'}</span></button>
    {technical&&<GuideTechnicalReadout values={technicalValues} owner={owner} editingSection={editingSection} isAdmin={isAdmin&&!editing} field={inlineField} ownerInput={ownerInput} identityName={identity.name} onNameChange={(v:string)=>setMeta('name',v)} documentationUrl={identity.documentationUrl} onDocumentationChange={(v:string)=>setMeta('documentationUrl',v)} onEdit={beginEdit} onSave={saveSection} onCancel={cancelEdit} saving={saving}/>}
   </section>
   <GuideApplications value={technicalValues.appList} isAdmin={isAdmin&&!editing} editing={editingSection==='applications'} onEdit={()=>beginEdit('applications')} onChange={(v:string)=>setTech('appList',v)} onSave={saveSection} onCancel={cancelEdit} saving={saving}/>
   <details className={'nb-lessons nb41-lessons '+(!displayedLessons.length?'nb-neutral':'')} open={editingSection==='lessons'?true:undefined}>
    <summary><BookOpen size={22} aria-hidden="true"/><strong>Lessons Learned</strong><span>· {displayedLessons.length?`${displayedLessons.length} lesson${displayedLessons.length===1?'':'s'}`:'No notes recorded'}</span><ChevronDown size={19} className="nb-lessons-chevron"/></summary>
    <div className="nb41-lessons-body">
    {editingSection==='lessons'?<>
     {lessonDraft.map((item:any,i:number)=><div key={item.id} className="nb41-lesson-edit-row"><label className="nb41-lesson-check"><input type="checkbox" checked={!!item.checked} onChange={e=>setLessonDraft(prev=>prev.map(v=>v.id===item.id?{...v,checked:e.target.checked}:v))}/><span>Completed</span></label><textarea aria-label={'Lesson '+(i+1)+' description'} placeholder="Describe the lesson, impact and recommended action..." rows={4} value={item.text} onChange={e=>setLessonDraft(prev=>prev.map(v=>v.id===item.id?{...v,text:e.target.value}:v))}/><button type="button" className="nb41-delete-step" aria-label={'Remove lesson '+(i+1)} onClick={()=>setLessonDraft(prev=>prev.filter(v=>v.id!==item.id))}><Trash2 size={17}/></button></div>)}
     <div className="nb41-lesson-bottom"><B onClick={()=>setLessonDraft(prev=>[...prev,{id:uid(),text:'',checked:false}])}><Plus size={15}/> Add lesson</B>{editControls('lessons')}</div>
    </>:displayedLessons.length?<ul className="nb41-lesson-list">{displayedLessons.map((item:any)=><li key={item.id}><label><input type="checkbox" aria-label={'Complete lesson '+item.id} disabled={!isAdmin||saving||!!editingSection} checked={!!item.checked} onChange={e=>toggleLesson(item.id,e.target.checked)}/><span className={item.checked?'nb41-lesson-done':''}>{item.text}</span></label></li>)}</ul>:<p className="nb-note">No lessons learned have been added.</p>}
    </div>
    {isAdmin&&!editing&&<button type="button" className="nb41-edit-pencil nb41-lesson-pencil" aria-label="Edit Lessons Learned" title="Edit lessons" onClick={()=>beginEdit('lessons')}><Pencil size={16}/></button>}
   </details>
   <section className="nb-config-workspace" aria-label="Configuration checklists">
    <div className="nb-config-header"><h2>Configuration checklist</h2><div className="nb41-config-tools"><span>{run?'Device verification': 'Guide verification'} · {marked} / {previewItems.length} checked</span>{isAdmin&&!editing&&<button type="button" className="nb41-edit-pencil" title="Edit checklist steps" aria-label="Edit Configuration Checklist" onClick={()=>beginEdit('checklist')}><Pencil size={16}/></button>}</div></div>
    <div className="nb-stage-tabs nb41-stage-arrows" role="group" aria-label="Configuration stages">{STAGES.map((s:string,i:number)=><button type="button" aria-pressed={stage===s} className={stage===s?'selected':''} key={s} onClick={()=>{setStage(s);onNavigationChange?.({deviceId,stage:s});}}><span>{i+1}</span>{LABELS[s]}{reviewRun?.accepted?.[s]?' ✓':''}</button>)}</div>
    {guide?.preparationEnabled&&<details className="nb-panel"><summary>0 Preparation · Optional</summary>{(guide.preparationItems||[]).map((item:any)=><label className="nb-check-row" key={item.id}><input type="checkbox" disabled={!isAdmin||!run||editing} checked={!!run?.checks?.[item.id]} onChange={e=>updateRun({...run,checks:{...run.checks,[item.id]:e.target.checked}})}/>{item.label}</label>)}</details>}
    {isAdmin&&<Migration sys={sys} run={run} onSave={update}/>}
    <section className="nb-checklist">
      <div className="nb-section-heading"><h2>{LABELS[stage]}</h2><span>{marked} / {previewItems.length} checked</span></div>
      {previewItems.length===0&&<p className="nb-empty">No reviewed steps in this stage. Use the pencil icon to add steps.</p>}
      {previewItems.map((item:any,i:number)=><div className={'nb-check-row'+(editingSection==='checklist'?' nb41-step-editor':'')} key={item.id}>
        {editingSection==='checklist'?<><input aria-label={'Step '+(i+1)} value={item.label} onChange={e=>setDraft({...draft,stages:{...draft.stages,[stage]:items.map((x:any)=>x.id===item.id?{...x,label:e.target.value}:x)}})}/><label><input type="checkbox" checked={item.required!==false} onChange={e=>setDraft({...draft,stages:{...draft.stages,[stage]:items.map((x:any)=>x.id===item.id?{...x,required:e.target.checked}:x)}})}/>Required</label><label><input type="checkbox" checked={!!item.allowNA} onChange={e=>setDraft({...draft,stages:{...draft.stages,[stage]:items.map((x:any)=>x.id===item.id?{...x,allowNA:e.target.checked}:x)}})}/>Allow N/A</label><label><input type="checkbox" checked={!!item.evidenceRequired} onChange={e=>setDraft({...draft,stages:{...draft.stages,[stage]:items.map((x:any)=>x.id===item.id?{...x,evidenceRequired:e.target.checked}:x)}})}/>Evidence</label><B disabled={i===0} onClick={()=>{const reordered=[...items];[reordered[i-1],reordered[i]]=[reordered[i],reordered[i-1]];setDraft({...draft,stages:{...draft.stages,[stage]:reordered}});}}>↑</B><B aria-label={'Remove step '+(i+1)} onClick={()=>setDraft({...draft,stages:{...draft.stages,[stage]:items.filter((x:any)=>x.id!==item.id)}})}><Trash2 size={15}/></B></>:
        <label className="nb41-check-label"><input type="checkbox" aria-label={item.label} checked={!!reviewRun.checks?.[item.id]} disabled={!isAdmin||saving||!!editingSection||!STAGES.slice(0,STAGES.indexOf(stage)).every(s=>!!reviewRun.accepted?.[s])} onChange={e=>markCheck(item,e.target.checked)}/><span>{item.label}<small>{item.required===false?'Optional':''}</small></span></label>}
        {editingSection!=='checklist'&&run&&<details className="nb-result-details"><summary>Result details</summary><p>{run.results?.[item.id]?.state||'pending'}{run.results?.[item.id]?.reason?' · '+run.results[item.id].reason:''}</p><p>{run.results?.[item.id]?.evidenceReference||'No evidence reference'}</p>{isAdmin&&<B onClick={()=>{const evidence=prompt('Evidence reference (text only, no upload)',run.results?.[item.id]?.evidenceReference||'');if(evidence===null)return;const reason=item.allowNA?prompt('N/A reason, or leave empty for completed',run.results?.[item.id]?.reason||''):'';if(reason===null)return;try{updateRun(setResult(run,stage,item.id,{state:reason?.trim()?'not_applicable':run.checks[item.id]?'completed':'pending',reason:reason||'',evidenceReference:evidence}));}catch(e:any){setMessage(e.message);}}}>Record evidence / N/A</B>}</details>}
       </div>)}
      {editingSection==='checklist'&&<>
       <div className="nb41-check-edit-footer"><B onClick={()=>setDraft({...draft,stages:{...draft.stages,[stage]:[...items,{id:uid(),label:'',required:true}]}})}><Plus size={15}/> Add step</B>{editControls('checklist')}<B disabled={saving} onClick={publish}>Publish reviewed guide</B></div>
       <details className="nb-panel"><summary>Preparation settings · optional</summary><label><input type="checkbox" checked={!!draft.preparationEnabled} onChange={e=>setDraft({...draft,preparationEnabled:e.target.checked})}/> Enable Preparation</label>{draft.preparationEnabled&&<textarea aria-label="Preparation items, one per line" value={(draft.preparationItems||[]).map((i:any)=>i.label).join('\n')} onChange={e=>setDraft({...draft,preparationItems:e.target.value.split('\n').map((label:string,i:number)=>({id:draft.preparationItems?.[i]?.id||uid(),label,required:false}))})}/>}</details>
       {onDeleteSystem&&<details className="nb41-destructive"><summary>Advanced</summary><B className="nb-guide-delete-btn" onClick={()=>{if(confirm('Delete this system AND its entire device and guide history? This cannot be undone. Export a backup first.'))onDeleteSystem(sys.id);}}>Delete system</B></details>}
      </>}
      {editingSection!=='checklist'&&<div className="nb-guide-footer"><B disabled={stage===STAGES[0]} onClick={()=>{const next=STAGES[STAGES.indexOf(stage)-1];setStage(next);onNavigationChange?.({deviceId,stage:next});}}><ChevronLeft size={16}/> Previous stage</B><div className="nb41-check-save-actions">{!run&&<B disabled={!isAdmin||!reviewDirty||saving||!!editingSection} onClick={()=>persistReview()}>Save checks</B>}<B primary disabled={!isAdmin||saving||!!editingSection||!canAccept(reviewRun,stage)} onClick={acceptCurrentStage}>Accept {LABELS[stage]}{stage!==STAGES[2]?' and continue':''} <ChevronRight size={16}/></B></div></div>}
    </section>
   </section>
   <p role="status" className="nb-save-state">{message}</p>
  </div>
 </section>;
}
/** The only non-guide form: minimal creation of a new system. All technical
 * information is subsequently maintained through Guide > Edit guide. */
export function SystemCreate({sys,project,isAdmin,onSave,onClose}:any){
 const [name,setName]=useState(sys.name||'');
 const [description,setDescription]=useState(sys.description||'');
 const [category,setCategory]=useState(sys.deviceCategory||'App only');
 const [assigneeId,setAssigneeId]=useState(sys.assigneeId||'');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const create=async()=>{if(!name.trim()){setError('Enter a system name.');return;}if(!isAdmin)return;
  const snapshot={...Object.fromEntries(TECH_FIELDS.map(k=>[k,sys[k]??''])),deviceCategory:category,deviceType:''};
  const next={...sys,name:name.trim(),description,deviceCategory:category,assigneeId,
   guideDraft:{...newGuide(),technicalSnapshot:snapshot}};
  setBusy(true);try{await onSave(next);}catch(e:any){setError(e.message)}finally{setBusy(false);}
 };
 return <section className="nb-editor-page nb-new-system-page"><div className="nb-breadcrumb">Systems / New system</div><header className="nb-page-header"><div><h1>Add system</h1><p>Create a system, then configure it directly in its guide.</p></div><B onClick={onClose}>Back to systems</B></header>
 <form className="nb-new-system-form" onSubmit={e=>{e.preventDefault();create();}}>
  <label>System name<input aria-label="System name" autoFocus value={name} onChange={e=>setName(e.target.value)} required/></label>
  <label>Device type<select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Device type">{DEVICE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
  <label>Deployment owner<select value={assigneeId} onChange={e=>setAssigneeId(e.target.value)}><option value="">Unassigned</option>{project.members.map((m:any)=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
  <label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3}/></label>
  {error&&<p role="alert">{error}</p>}
  <div className="nb-new-system-actions"><button className="nb-button nb-primary" disabled={!isAdmin||busy} type="submit">{busy?'Creating…':'Create and open guide'}</button><B onClick={onClose}>Cancel</B></div>
 </form></section>;
}

/** Fast status controls save the shared Task ID, not one local assignment copy. */
/** Actions stay in this drawer. No standalone Edit task screen. */
function QuickAssignmentRow({task,number,isAdmin,project,sourceWeek,onQuickTaskSave,onQuickTaskEdit,onQuickTaskDelete,onQuickTaskMove,onRequireEdit}:any){
 const [saving,setSaving]=useState(false),[error,setError]=useState(''),[showBlocker,setShowBlocker]=useState(false),[blockReason,setBlockReason]=useState(task.blockReason||'');
 const [menuOpen,setMenuOpen]=useState(false),[editing,setEditing]=useState(false);
 const [draft,setDraft]=useState({label:task.label});
 const menuRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{if(!menuOpen)return;const close=(event:MouseEvent)=>{if(menuRef.current&&!menuRef.current.contains(event.target as Node))setMenuOpen(false);};const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.stopPropagation();setMenuOpen(false);}};document.addEventListener('pointerdown',close as any);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',close as any);document.removeEventListener('keydown',key);};},[menuOpen]);
 const commit=async(callback:()=>Promise<any>)=>{if(saving)return;setSaving(true);setError('');try{await callback();setMenuOpen(false);setEditing(false);}catch(e:any){setError(e?.message||'Could not save changes.');}finally{setSaving(false);}};
 const save=async(status:string,reason='')=>{if(!isAdmin||saving)return;await commit(async()=>{await onQuickTaskSave(task.id,{status,...(status==='Blocked'?{blockReason:reason}:{})});setShowBlocker(false);});};
 const actualStatus=task.status||'Planned';
 return <article className={'nb-quick-task-card nb-drawer-task nb-drawer-task-'+String(actualStatus).toLowerCase().replace(' ','-')+(menuOpen?' nb-menu-open':'')}>
  <div className="nb-drawer-task-index" aria-hidden="true">{String(number).padStart(2,'0')}</div>
  <div className="nb-drawer-task-content">
   <div className="nb-quick-task-header">
    <strong title={task.assignmentOwnerLabel?`System Owner: ${task.assignmentOwnerLabel}`:undefined}>{task.label}</strong>
    {<div className="nb-task-action-anchor" ref={menuRef}>
     <button type="button" className="nb-quick-advanced nb-drawer-more" aria-label={'More options for '+task.label} title="Task actions" aria-haspopup="menu" aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}><MoreVertical size={20} aria-hidden="true"/></button>
     {menuOpen&&<div className="nb-task-action-menu" role="menu" aria-label={'Actions for '+task.label}>
      <button role="menuitem" type="button" onClick={()=>{if(!isAdmin){setMenuOpen(false);onRequireEdit();return;}setDraft({label:task.label});setEditing(true);setMenuOpen(false);}}><Pencil size={15}/> Edit</button>
      <button role="menuitem" type="button" disabled={saving||sourceWeek===0} onClick={()=>{setMenuOpen(false);if(!isAdmin){onRequireEdit();return;}void commit(()=>onQuickTaskMove(task.id,sourceWeek,'previous'));}}><ChevronLeft size={15}/> Move to previous week</button>
      <button role="menuitem" type="button" disabled={saving||sourceWeek>=519} onClick={()=>{setMenuOpen(false);if(!isAdmin){onRequireEdit();return;}void commit(()=>onQuickTaskMove(task.id,sourceWeek,'next'));}}><ChevronRight size={15}/> Move to next week</button>
      <button role="menuitem" type="button" className="nb-task-delete-action" disabled={saving} onClick={()=>{setMenuOpen(false);if(!isAdmin){onRequireEdit();return;}if(window.confirm(`Delete “${task.label}” permanently?\n\nThis removes this task and its history from all scheduled weeks. This cannot be undone.`))void commit(()=>onQuickTaskDelete(task.id));}}><Trash2 size={15}/> Delete</button>
     {!isAdmin&&<p className="nb-task-action-view-note">Sign in as Admin to make changes.</p>}
     </div>}
    </div>}
   </div>
   {editing&&isAdmin?<form className="nb-inline-task-editor" aria-label={'Edit '+task.label} onSubmit={e=>{e.preventDefault();void commit(()=>onQuickTaskEdit(task.id,{label:draft.label}));}}>
    <label>Task title<input required maxLength={160} autoFocus value={draft.label} disabled={saving} onChange={e=>setDraft({label:e.target.value})}/></label>
    <div className="nb-inline-task-buttons"><button type="submit" disabled={saving||!draft.label.trim()}>{saving?'Saving…':'Save changes'}</button><button type="button" disabled={saving} onClick={()=>setEditing(false)}>Cancel</button></div>
   </form>:<div className="nb-quick-task-toolbar"><label className="nb-quick-status-label">Status
    <select aria-label={'Status for '+task.label} value={showBlocker?'Blocked':actualStatus} disabled={!isAdmin||saving} onChange={e=>{const status=e.target.value;if(status==='Blocked'&&!(task.blockReason||'').trim()){setShowBlocker(true);return;}void save(status,task.blockReason||'');}}>
     <option value="Planned">Planned</option><option value="In Progress">Active</option><option value="Completed">Done</option><option value="Blocked">Blocked</option>
    </select>
   </label></div>}
   {showBlocker&&<form className="nb-quick-reason-form" onSubmit={e=>{e.preventDefault();if(blockReason.trim())void save('Blocked',blockReason.trim());}}><label>Reason for blocking<input autoFocus maxLength={2000} value={blockReason} disabled={saving} onChange={e=>setBlockReason(e.target.value)} placeholder="What is blocking this task?" required/></label><div><button type="submit" disabled={saving||!blockReason.trim()}>{saving?'Saving…':'Save blocker'}</button><button type="button" disabled={saving} onClick={()=>setShowBlocker(false)}>Cancel</button></div></form>}
   {task.assignmentOwnerLabel&&<p className="nb52-task-owner">System Owner: <strong>{task.assignmentOwnerLabel}</strong></p>}
   {actualStatus==='Blocked'&&task.blockReason&&<p className="nb-quick-block-reason">{task.blockReason}</p>}
   {saving&&<span role="status" className="nb-quick-saving">Saving…</span>}
   {error&&<p role="alert" className="nb-quick-error">{error}</p>}
  </div>
 </article>;
}

export function Tracker({project,isAdmin,canConfigureProject,onAuth,onQuickTaskEdit,onQuickTaskDelete,onQuickTaskMove,onMilestoneSave,onMilestoneDelete,onProjectStartChange,onQuickTaskSave,onQuickTaskCreate,onMemberRename,onMemberCreate,onMemberDelete,week,setWeek}:any){
 const [query,setQuery]=useState(''),[status,setStatus]=useState(''),[person,setPerson]=useState(''),[selected,setSelected]=useState<any>(null),[detail,setDetail]=useState<any>(null);
 // Legacy shared URLs with ?view=list now open the only supported Overview layout.
 useEffect(()=>{
  const url=new URL(location.href);
  if(!url.searchParams.has('view'))return;
  url.searchParams.delete('view');
  window.history.replaceState({nbdt:true},'',url.pathname+url.search+url.hash);
 },[]);
 // The left edge of the 4-week viewport is provided as `week` by the app.
 // Selection is independent. Selecting a week MUST NOT shift the viewport.
 const [selectedWeek,setSelectedWeek]=useState<number>(()=>{
  const requested=new URLSearchParams(location.search).get('selectedWeek');
  const parsed=weekIndexFromIso(project.startDate,requested);
  const legacyWeek=weekIndexFromIso(project.startDate,new URLSearchParams(location.search).get('week'));
  return parsed!==null?parsed:(legacyWeek!==null&&legacyWeek>clampWeekViewport(legacyWeek)?legacyWeek:week);
 });
 const selectWeek=(w:number)=>{
  const next=Math.max(0,Math.min(519,Math.trunc(w)));
  setSelectedWeek(next);
  const url=new URL(location.href);
  url.searchParams.set('selectedWeek',String(next+1));
  window.history.replaceState({nbdt:true},'',url.pathname+url.search);
 };
 // Restore selection from share URLs. Changing projects or the calendar anchor
 // intentionally reselects the actual current project week, without allowing an
 // old query parameter to pin a now-unrelated week.
 const anchorRef=useRef({projectId:project.id,startDate:project.startDate});
 useEffect(()=>{
  const anchorChanged=anchorRef.current.projectId!==project.id||anchorRef.current.startDate!==project.startDate;
  anchorRef.current={projectId:project.id,startDate:project.startDate};
  const requested=anchorChanged?null:new URLSearchParams(location.search).get('selectedWeek');
  const parsed=weekIndexFromIso(project.startDate,requested);
  const freshCurrent=currentWeekIndex(project.startDate,project.timezone||'Europe/Paris');
  const legacyWeek=weekIndexFromIso(project.startDate,new URLSearchParams(location.search).get('week'));
  const pinnedSelection=legacyWeek!==null&&legacyWeek>clampWeekViewport(legacyWeek)?legacyWeek:week;
  setSelectedWeek(parsed!==null?parsed:(anchorChanged?Math.max(0,Math.min(519,freshCurrent??0)):pinnedSelection));
 },[project.id,project.startDate]);
 const [editingMemberId,setEditingMemberId]=useState<string|null>(null);
 const [memberDraft,setMemberDraft]=useState('');
 const [addingMember,setAddingMember]=useState(false);
 const [newMemberName,setNewMemberName]=useState('');
 const [memberBusy,setMemberBusy]=useState(false);
 const [memberError,setMemberError]=useState('');
 const [memberToDelete,setMemberToDelete]=useState<string|null>(null);
 const memberDialogRef=useRef<HTMLElement|null>(null);
 // A milestone is an independent project record. The editor is deliberately
 // light-weight and does not alter the surrounding tracker or its scroll state.
 const [milestoneEditor,setMilestoneEditor]=useState<any>(null);
 const [milestoneDraft,setMilestoneDraft]=useState('');
 const [milestoneBusy,setMilestoneBusy]=useState(false);
 const [milestoneError,setMilestoneError]=useState('');
 const [expandedMilestoneWeek,setExpandedMilestoneWeek]=useState<number|null>(null);
 const [showMobileMatrix,setShowMobileMatrix]=useState(false);
 const [todayDate,setTodayDate]=useState(()=>todayInTimezone(project.timezone||'Europe/Paris'));
 const [dateSaving,setDateSaving]=useState(false);
 const [addingAssignment,setAddingAssignment]=useState(false),[newAssignment,setNewAssignment]=useState(''),[quickAdding,setQuickAdding]=useState(false),[quickError,setQuickError]=useState(''),[quickNotice,setQuickNotice]=useState('');
 const panelRef=useRef<HTMLElement|null>(null);
 const panelTriggerRef=useRef<HTMLElement|null>(null);
 const tableScrollRef=useRef<HTMLDivElement|null>(null);
 const weekFooterScrollRef=useRef<HTMLDivElement|null>(null);
 const weekFooterGridRef=useRef<HTMLDivElement|null>(null);
 // One-way scroll mirroring only: the footer is a display of the matrix columns,
 // never a second independent scroll control that can fight the week arrows.
 // The footer is deliberately NOT a scroll container: two nested native
 // scrollbars used to show extra system arrows over the Next/Today controls.
 // On narrow screens mirror the task grid via a visual transform only.
 const syncWeekScroll=()=>{
  const table=tableScrollRef.current,footer=weekFooterScrollRef.current;
  const cards=footer?.querySelector<HTMLElement>('.nb-week-card-grid');
  if(table&&cards)cards.style.transform=`translate3d(${-table.scrollLeft}px,0,0)`;
 };
 // Match footer tracks to the actual rendered table columns, not estimates.
 // Borders, resized sidebars and fractional browser pixels can otherwise produce
 // visible drift in later week cards. A single resize measurement is authoritative.
 useEffect(()=>{
  const table=tableScrollRef.current?.querySelector<HTMLTableElement>('.nb-week-grid');
  const footerGrid=weekFooterGridRef.current;
  if(!table||!footerGrid)return;
  const update=()=>{
   const headers=Array.from(table.querySelectorAll<HTMLTableCellElement>('thead tr > th'));
   if(headers.length!==5)return;
   const tracks=headers.map(cell=>cell.getBoundingClientRect().width);
   if(tracks.some(value=>value<1))return; // Hidden mobile matrix: keep the fallback grid.
   footerGrid.style.setProperty('grid-template-columns',tracks.map(value=>`${value}px`).join(' '),'important');
   footerGrid.style.setProperty('width',`${tracks.reduce((total,value)=>total+value,0)}px`,'important');
   // One scroll owner: the matrix. Footer follows without a native scrollbar.
   const left=tableScrollRef.current?.scrollLeft||0;
   footerGrid.style.transform=`translate3d(${-left}px,0,0)`;
  };
  update();
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(update);
  observer?.observe(table);
  const headers=table.querySelectorAll('thead th');
  headers.forEach(header=>observer?.observe(header));
  window.addEventListener('resize',update);
  return()=>{observer?.disconnect();window.removeEventListener('resize',update);};
 },[project.id,showMobileMatrix]);
 const resetWeekScroll=()=>{
  if(tableScrollRef.current)tableScrollRef.current.scrollLeft=0;
  if(weekFooterScrollRef.current)weekFooterScrollRef.current.scrollLeft=0;
  const cards=weekFooterScrollRef.current?.querySelector<HTMLElement>('.nb-week-card-grid');
  if(cards)cards.style.transform='translate3d(0px,0,0)';
 };
 const navigateWeek=(direction:number)=>{
  const next=moveWeekViewport(week,direction);
  if(next===week)return;
  // Move one project-week viewport; never request browser/scrollbar navigation.
  resetWeekScroll();
  setWeek(next);
 };
 const closeQuickPanel=()=>{
  if(quickAdding)return;
  if(addingAssignment&&newAssignment.trim()&&!window.confirm('Discard unsaved assignment?'))return;
  setSelected(null);setDetail(null);setAddingAssignment(false);setNewAssignment('');setQuickError('');setQuickNotice('');
 };
 const openQuickPanel=(personId:string,w:number,task:any=null)=>{
  if(!selected&&document.activeElement instanceof HTMLElement)panelTriggerRef.current=document.activeElement;
  setSelected({id:personId,week:w});setDetail(task);setAddingAssignment(false);setNewAssignment('');setQuickError('');setQuickNotice('');
 };
 // The overlay must not resize the matrix; preserve focus and keyboard access.
 useEffect(()=>{
  if(!selected){const target=panelTriggerRef.current;panelTriggerRef.current=null;if(target?.isConnected)target.focus();return;}
  panelRef.current?.focus();
 },[selected?.id,selected?.week]);
 useEffect(()=>{
  if(!selected)return;
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();closeQuickPanel();return;}
   if(event.key!=='Tab'||!panelRef.current)return;
   const controls=Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>el.getClientRects().length>0);
   if(!controls.length){event.preventDefault();panelRef.current.focus();return;}
   const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&(document.activeElement===first||document.activeElement===panelRef.current)){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  window.addEventListener('keydown',onKeyDown);
  return()=>window.removeEventListener('keydown',onKeyDown);
 },[selected?.id,selected?.week,addingAssignment,newAssignment,quickAdding]);

 useEffect(()=>{const tick=()=>setTodayDate(todayInTimezone(project.timezone||'Europe/Paris'));tick();const timer=window.setInterval(tick,60000);return()=>clearInterval(timer);},[project.timezone]);
 const actualCurrentWeek=weekIndexFromDate(project.startDate,todayDate);
 const currentWeek=actualCurrentWeek===null?-1:actualCurrentWeek;
 const milestoneTone=(ms:any)=>/freeze|block|critical/i.test(ms.label)?'critical':/qa|testing|review|inspection/i.test(ms.label)?'review':/handover|final|complete|launch/i.test(ms.label)?'complete':'standard';
 // Calendar month/year navigation is entirely local to the picker.
 // Only the explicit Apply date button reaches this persistence function; no browser confirm per navigation step.
 const updateStart=async(value:string)=>{if(dateSaving||value===project.startDate)return;if(!validDate(value))throw Error('Choose a valid date.');setDateSaving(true);try{await onProjectStartChange(value);}finally{setDateSaving(false);}};
 const tasks=project.tasks.filter((t:any)=>!t.isMilestone).map((t:any)=>({...t,status:effectiveStatus(t,project.issues)}));
 const milestones=project.tasks.filter((t:any)=>t.isMilestone).sort((a:any,b:any)=>a.startWeek-b.startWeek||String(a.label).localeCompare(String(b.label)));
 const matches=(t:any)=>(!status||t.status===status)&&(!person||assignments(t).includes(person))&&(!query||(t.label+' '+assignments(t).map((id:string)=>project.members.find((m:any)=>m.id===id)?.name||'').join(' ')).toLowerCase().includes(query.toLowerCase()));
 const at=(id:string,w:number)=>tasks.filter((t:any)=>(id===UNASSIGNED_MEMBER_ID?(!t.memberId||!project.members.some((m:any)=>m.id===t.memberId)):assignments(t).includes(id))&&t.startWeek<=w&&t.startWeek+t.duration>w&&matches(t));
 // Keep historic assignments visible after a member is removed.
 const orphaned=(t:any)=>!t.memberId||!project.members.some((m:any)=>m.id===t.memberId);
 const hasOrphans=tasks.some(orphaned);
 const unassignedPerson={id:UNASSIGNED_MEMBER_ID,name:'Unassigned'};
 const people=[...project.members.filter((m:any)=>!person||m.id===person),...(!person&&hasOrphans?[unassignedPerson]:[])];
 const weeks=Array.from({length:4},(_,i)=>clampWeekViewport(week)+i);
 const selectedPerson=people.find((m:any)=>m.id===selected?.id) || (selected?.id===UNASSIGNED_MEMBER_ID?unassignedPerson:undefined);
 const chosen=selected?at(selected.id,selected.week):[];
 const open=(t:any)=>setDetail(t);
 const selectedIsoWeek=`Week ${selectedWeek+1}`;
 const weekIso=(w:number)=>`Week ${w+1}`;
 const weekDate=(w:number)=>projectWeekDate(project.startDate,w);
 const milestonesAt=(w:number)=>milestones.filter((m:any)=>m.startWeek===w);
 const closestScheduledWeek=tasks.length?tasks.map((t:any)=>t.startWeek).sort((a:number,b:number)=>Math.abs(a-week)-Math.abs(b-week))[0]:null;
 const visibleWeeksHaveTasks=weeks.some(w=>tasks.some((t:any)=>t.startWeek<=w&&t.startWeek+t.duration>w&&matches(t)));
 const currentWeekTasks=tasks.filter((t:any)=>t.startWeek<=selectedWeek&&t.startWeek+t.duration>selectedWeek&&matches(t));
 const visibleRangeTasks=tasks.filter((t:any)=>t.startWeek<week+4&&t.startWeek+t.duration>week&&matches(t));
 const visibleRangeCount=new Set(visibleRangeTasks.map((t:any)=>t.id)).size;
 const currentWeekTaskCount=new Set(currentWeekTasks.map((t:any)=>t.id)).size;
 const blockedCount=new Set(currentWeekTasks.filter((t:any)=>t.status==='Blocked').map((t:any)=>t.id)).size;
 const totalAssignments=currentWeekTasks.length;
 const totalMilestones=weeks.reduce((n:number,w:number)=>n+milestonesAt(w).length,0);
 const editMilestone=(ms:any)=>{
  if(!isAdmin)return;
  setMilestoneEditor({...ms,creating:!project.tasks.some((task:any)=>task.id===ms.id)});
  setMilestoneDraft(ms.creating?'':String(ms.label||''));
  setMilestoneError('');setExpandedMilestoneWeek(null);
 };
 const createMilestone=(w:number)=>editMilestone({id:uid(),label:'',creating:true,startWeek:w,duration:1,status:'Planned',description:'',memberId:'milestones',isMilestone:true,date:weekDate(w)});
 const saveMilestone=async(event:React.FormEvent)=>{
  event.preventDefault();if(!milestoneEditor||milestoneBusy)return;
  const label=milestoneDraft.trim();if(!label||label.length>160){setMilestoneError('Milestone name must be 1–160 characters.');return;}
  setMilestoneBusy(true);setMilestoneError('');
  try{await onMilestoneSave(Object.fromEntries(Object.entries({...milestoneEditor,label}).filter(([key])=>key!=='creating')),milestoneEditor.id);setMilestoneEditor(null);}
  catch(error:any){setMilestoneError(error?.message||'Unable to save milestone.');}
  finally{setMilestoneBusy(false);}
 };
 const deleteMilestone=async()=>{
  if(!milestoneEditor||milestoneEditor.creating||milestoneBusy||!isAdmin)return;
  if(!window.confirm(`Delete milestone “${milestoneEditor.label}”? This cannot be undone.`))return;
  setMilestoneBusy(true);setMilestoneError('');
  try{await onMilestoneDelete(milestoneEditor.id);setMilestoneEditor(null);}
  catch(error:any){setMilestoneError(error?.message||'Unable to delete milestone.');}
  finally{setMilestoneBusy(false);}
 };
 useEffect(()=>{
  if(!milestoneEditor)return;
  const closeOnEscape=(event:KeyboardEvent)=>{
   if(event.key==='Escape'&&!milestoneBusy){event.preventDefault();setMilestoneEditor(null);}
  };
  document.addEventListener('keydown',closeOnEscape);
  return()=>document.removeEventListener('keydown',closeOnEscape);
 },[milestoneEditor,milestoneBusy]);
 const startMemberRename=(m:any)=>{setMemberError('');setAddingMember(false);setEditingMemberId(m.id);setMemberDraft(m.name);};
 const saveMemberRename=async(e:React.FormEvent)=>{e.preventDefault();if(memberBusy)return;setMemberError('');setMemberBusy(true);try{await onMemberRename(editingMemberId,memberDraft);setEditingMemberId(null);}catch(error:any){setMemberError(error?.message||'Could not rename team member.');}finally{setMemberBusy(false);}};
 const createMember=async(e:React.FormEvent)=>{e.preventDefault();if(memberBusy)return;setMemberError('');setMemberBusy(true);try{await onMemberCreate(newMemberName);setAddingMember(false);setNewMemberName('');}catch(error:any){setMemberError(error?.message||'Could not add team member.');}finally{setMemberBusy(false);}};
 // The trash icon only OPENS confirmation. No destructive write before approval.
 const deleteMember=(m:any)=>{
  if(memberBusy||!isAdmin||m.id===UNASSIGNED_MEMBER_ID)return;
  setMemberError('');setMemberToDelete(m.id);
 };
 const memberPendingDeletion=project.members.find((m:any)=>m.id===memberToDelete);
 const pendingOwnedTasks=memberPendingDeletion?project.tasks.filter((t:any)=>!t.isMilestone&&t.memberId===memberToDelete):[];
 const pendingHelperTasks=memberPendingDeletion?project.tasks.filter((t:any)=>!t.isMilestone&&t.memberId!==memberToDelete&&(t.helperIds||[]).includes(memberToDelete)):[];
 const pendingOwnedSystems=memberPendingDeletion?project.systems.filter((sys:any)=>sys.assigneeId===memberToDelete):[];
 const confirmMemberDelete=async()=>{
  const id=memberToDelete;
  if(memberBusy||!isAdmin||!id||!project.members.some((m:any)=>m.id===id))return;
  setMemberBusy(true);setMemberError('');
  try{
   await onMemberDelete(id);
   setMemberToDelete(null);
   if(person===id)setPerson('');
   if(selected?.id===id)closeQuickPanel();
   if(editingMemberId===id)setEditingMemberId(null);
  }catch(error:any){setMemberError(error?.message||'Could not delete this employee. Nothing was removed.');}
  finally{setMemberBusy(false);}
 };
 // Keep Escape available and focus on the safer Cancel button first.
 useEffect(()=>{
  if(!memberToDelete)return;
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.key==='Escape'&&!memberBusy){event.preventDefault();setMemberToDelete(null);return;}
   if(event.key==='Tab'&&memberDialogRef.current){
    const buttons=Array.from(memberDialogRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    if(!buttons.length)return;
    const first=buttons[0],last=buttons[buttons.length-1];
    if(event.shiftKey&&(document.activeElement===first||!memberDialogRef.current.contains(document.activeElement))){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||!memberDialogRef.current.contains(document.activeElement))){event.preventDefault();first.focus();}
   }
  };
  window.addEventListener('keydown',onKeyDown);
  return()=>window.removeEventListener('keydown',onKeyDown);
 },[memberToDelete,memberBusy]);

 useEffect(()=>{if(!isAdmin){setEditingMemberId(null);setAddingMember(false);setMemberToDelete(null);setMemberError('');}},[isAdmin]);

 useEffect(()=>{setSelected(null);setDetail(null);},[week,project.id]);
 // openQuickPanel/closeQuickPanel own the quick-add lifecycle; do not reset an add opened from the toolbar.

 return <section className="nb-tracker" data-view="overview">
  <header className="nb-page-header nb45-primary-header">
   <div>
    <h1>Weekly Tracker</h1>
   </div>
  </header>

  <div className="nb-toolbar">
   <div className="nb-segments nb-overview-only-segment"><span className="nb-button nb-overview-only-tab" aria-current="page">Overview</span></div>
   <div className="nb-project-start"><ProjectStartPicker value={project.startDate} today={todayDate} hasTasks={project.tasks.length>0} disabled={!canConfigureProject} busy={dateSaving} onConfirm={updateStart}/></div>
   <select aria-label="Person filter" value={person} onChange={e=>setPerson(e.target.value)}><option value="">All people</option>{project.members.map((m:any)=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
   <select aria-label="Status filter" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{['Planned','In Progress','Blocked','Completed'].map(v=><option key={v}>{v}</option>)}</select>
   <div className="nb-search-box"><Search size={18} aria-hidden="true"/><input aria-label="Search tasks or people" placeholder="Search tasks or people..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
  </div>

  <div className="nb-summary">
   <div className="nb-summary-metrics">
    <span className="nb-summary-pill"><Users size={17} aria-hidden="true"/>{people.length} people</span>
    <span className="nb-summary-pill nb-selected-summary" title="Selection does not move the visible four-week window"><ClipboardCheck size={17} aria-hidden="true"/>{selectedIsoWeek} selected · {currentWeekTaskCount} unique tasks</span>
    <span className="nb-summary-pill nb-summary-blockers"><AlertCircle size={17} aria-hidden="true"/>{blockedCount} blocked in selected week</span>
    <span className="nb-summary-pill nb-visible-summary">Viewing Weeks {week+1}–{Math.min(520,week+4)} · {visibleRangeCount} unique tasks</span>
    {totalMilestones>0&&<span className="nb-summary-pill"><Flag size={17} aria-hidden="true"/>{totalMilestones} milestones in view</span>}
    {currentWeek>=week&&currentWeek<week+4&&<span className="nb-current-indicator">Current: Week {currentWeek+1}</span>}
   </div>
   <div className="nb-summary-actions">
    {(selectedWeek<week||selectedWeek>=week+4)&&<B className="nb-show-selected-week" onClick={()=>setWeek(clampWeekViewport(selectedWeek))}>Show selected Week {selectedWeek+1} →</B>}
    {!query&&!person&&!status&&closestScheduledWeek!==null&&!visibleWeeksHaveTasks&&<B onClick={()=>setWeek(clampWeekViewport(closestScheduledWeek))}>View scheduled assignments →</B>}
    <button type="button" className="nb-mobile-matrix-toggle nb-button" onClick={()=>setShowMobileMatrix(!showMobileMatrix)}>{showMobileMatrix?'By person':'Show matrix'}</button>
   </div>
  </div>

  <div className="nb-tracker-content">
   <div className="nb-tracker-table-wrap" ref={tableScrollRef} onScroll={syncWeekScroll}>
    <>
     <div className={'nb-mobile-week-cards '+(showMobileMatrix?'matrix-open':'')} aria-label="Assignments by person">
      {people.map((m:any)=>{
       const mobileList=at(m.id,week);
       const mobileMilestones=milestonesAt(week);
       return <section key={m.id} className="nb-mobile-person-card">
        <header>
         <span className="nb-avatar">{memberInitial(m.name)}</span>
         <span><strong>{m.name}</strong><small>{m.title||'Team member'}</small></span>
         <span className="nb-mobile-person-count">{mobileList.length} assignments</span>
         {isAdmin&&m.id!==UNASSIGNED_MEMBER_ID&&<div className="nb-member-actions"><button type="button" aria-label={`Rename ${m.name}`} onClick={()=>startMemberRename(m)}><Pencil size={15}/></button><button type="button" aria-label={`Remove ${m.name}`} onClick={()=>deleteMember(m)}><Trash2 size={15}/></button></div>}
        </header>
        {isAdmin&&editingMemberId===m.id&&<form className="nb-member-rename-form" onSubmit={saveMemberRename}><input autoFocus required maxLength={80} value={memberDraft} aria-label={`New name for ${m.name}`} onChange={e=>setMemberDraft(e.target.value)}/><button type="submit">Save</button><button type="button" onClick={()=>setEditingMemberId(null)}>Cancel</button></form>}
        <div className="nb-mobile-week-title">{weekIso(week)} · {weekRange(project.startDate,week)}</div>
        {!!mobileMilestones.length&&<div className="nb-mobile-milestones">{mobileMilestones.map((ms:any)=><button type="button" key={ms.id} className="nb-milestone-chip" onClick={()=>{if(isAdmin)editMilestone(ms);}}><span>{ms.label}</span>{ms.date&&<small>{ms.date}</small>}</button>)}</div>}
        {mobileList.length?mobileList.map((t:any)=><button key={t.id} className="nb-mobile-mini-task" onClick={()=>{selectWeek(week);openQuickPanel(m.id,week,t);}}><span>{t.label}{t.memberId!==m.id&&<small>Helper</small>}</span><Badge value={t.status}/></button>):<p className="nb-empty">No tasks planned</p>}
        <button type="button" className="nb-mobile-open-assignments" onClick={()=>{selectWeek(week);openQuickPanel(m.id,week);}}>View assignments →</button>
       </section>;
      })}
      {isAdmin&&<div className="nb-member-create-row nb-member-create-mobile">
       {!addingMember?<button type="button" className="nb-member-create-trigger" onClick={()=>{setAddingMember(true);setEditingMemberId(null);setMemberError('');}}><Plus size={17}/> Add team member</button>:<form className="nb-member-create-form" onSubmit={createMember}><input required autoFocus maxLength={80} aria-label="New team member name" placeholder="Name" value={newMemberName} onChange={e=>setNewMemberName(e.target.value)}/><button type="submit" disabled={memberBusy||!newMemberName.trim()}>Create</button><button type="button" onClick={()=>{setAddingMember(false);setNewMemberName('');}}>Cancel</button></form>}
       {memberError&&<p role="alert" className="nb-member-error">{memberError}</p>}
      </div>}
     </div>
     <table className={'nb-week-grid '+(!showMobileMatrix?'mobile-cards-preferred':'')} aria-label="Weekly assignments matrix">
      <thead>
       <tr>
        <th className="nb-employee-head">Employee</th>
        {weeks.map(w=>{const columnMilestones=milestonesAt(w);const tone=weekHeaderTone(w);return <th key={w} className={(currentWeek===w?'nb-current-week-column':'')+' nb-week-tone-'+tone}>
         <div className="nb-week-head">
          <div className="nb-week-head-top">
           <div className="nb-week-head-title"><button type="button" className="nb-week-header-label" aria-label={`Select ${weekIso(w)}`} aria-pressed={selectedWeek===w} onClick={()=>selectWeek(w)} title={`Select ${weekIso(w)}`}>{weekIso(w)}</button></div>
           <span className="nb-week-range-hint" aria-hidden="true"><CalendarDays size={17}/></span>
          </div>
          <div className={'nb-week-milestones nb-milestone-stack '+(columnMilestones.length>1?'nb-milestone-multiple ':'')+(expandedMilestoneWeek===w?'nb-milestone-expanded':'')}
               onMouseLeave={()=>setExpandedMilestoneWeek(previous=>previous===w?null:previous)}>
           {columnMilestones.length?columnMilestones.map((ms:any)=><div className="nb-milestone-entry" key={ms.id}>
             <button type="button" title={isAdmin?'Edit milestone':'Project milestone'}
              className={'nb-milestone-chip nb-ms-'+milestoneTone(ms)+' '+(isAdmin?'editable':'')}
              onClick={()=>isAdmin?editMilestone(ms):void 0}>
              <Flag size={15} fill="currentColor" aria-hidden="true"/><span>{ms.label}</span>
             </button>
             {isAdmin&&<button type="button" className="nb-milestone-edit" title={'Edit '+ms.label}
              aria-label={'Edit milestone '+ms.label} onClick={()=>editMilestone(ms)}><Pencil size={13} aria-hidden="true"/></button>}
            </div>):<span className="nb-milestone-empty">No milestone</span>}
           {columnMilestones.length>1&&<button type="button" className="nb-milestone-more"
             aria-label={`Show all ${columnMilestones.length} milestones in ${weekIso(w)}`}
             aria-expanded={expandedMilestoneWeek===w}
             onClick={()=>setExpandedMilestoneWeek(expandedMilestoneWeek===w?null:w)}>+{columnMilestones.length-1} more</button>}
           {isAdmin&&<button type="button" className="nb-milestone-add" aria-label={'Add milestone to '+weekIso(w)} title={'Add milestone to '+weekIso(w)} onClick={()=>createMilestone(w)}>+</button>}
          </div>

         </div>
        </th>})}
       </tr>
      </thead>
      <tbody>
       {people.map((m:any)=>{
        const hasAssignments=weeks.some(w=>at(m.id,w).length);
        return <tr key={m.id} className={hasAssignments?'nb-has-assignments':'nb-no-assignments'}>
         <th>
          <div className="nb-person-cell">
           <span className="nb-avatar">{memberInitial(m.name)}</span>
           <div className="nb-person-meta">
           <div className="nb-person-copy">
            {editingMemberId===m.id&&isAdmin?
             <form className="nb-member-rename-form" onSubmit={saveMemberRename}>
              <input aria-label={`New name for ${m.name}`} autoFocus maxLength={80} required value={memberDraft} disabled={memberBusy} onChange={e=>setMemberDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setEditingMemberId(null);setMemberError('');}}}/>
              <button type="submit" aria-label={`Save ${m.name} name`} title="Save" disabled={memberBusy||!memberDraft.trim()}><Check size={16}/></button>
              <button type="button" aria-label="Cancel rename" title="Cancel" disabled={memberBusy} onClick={()=>{setEditingMemberId(null);setMemberError('');}}><X size={16}/></button>
             </form>:
             <><strong>{m.name}</strong>{m.title&&<small>{m.title}</small>}</>}
           </div>
           {isAdmin&&m.id!==UNASSIGNED_MEMBER_ID&&editingMemberId!==m.id&&<div className="nb-member-actions">
            <button type="button" title={`Rename ${m.name}`} aria-label={`Rename ${m.name}`} disabled={memberBusy} onClick={()=>startMemberRename(m)}><Pencil size={15}/></button>
            <button type="button" title={`Remove ${m.name}`} aria-label={`Remove ${m.name}`} disabled={memberBusy} onClick={()=>deleteMember(m)}><Trash2 size={15}/></button>
           </div>}
           </div>
          </div>
         </th>
         {weeks.map(w=>{
          const list=at(m.id,w);
          const blocked=list.filter((t:any)=>t.status==='Blocked').length;
          return <td key={w} className={(list.length?'nb-populated-week':'nb-empty-week')+(currentWeek===w?' nb-current-week-cell':'')}>
           <button aria-label={`${m.name}: ${list.length} assignments in ${weekIso(w)}`} className={'nb-week-cell '+(selected?.id===m.id&&selected?.week===w?'selected':'')} onClick={()=>{selectWeek(w);openQuickPanel(m.id,w);}}>
            <div className="nb-week-cell-head">
             <strong>{list.length?`${list.length} assignments`:'No tasks planned'}</strong>
             {blocked>0&&<span className="nb-week-blocked">{blocked} blocked</span>}
            </div>
            {list.slice(0,4).map((t:any)=><span className="nb-mini-task" key={t.id} title={t.assignmentOwnerLabel?`System Owner: ${t.assignmentOwnerLabel}`:undefined}><span>{t.label}</span><Badge value={t.status}/></span>)}
            {list.length>4&&<span className="nb-more">+{list.length-4} more · View all {list.length}</span>}
           </button>
          </td>;
         })}
        </tr>;
       })}
       {isAdmin&&<tr className="nb-member-create-table-row"><th>
        {!addingMember?<button type="button" className="nb-member-create-trigger" onClick={()=>{setAddingMember(true);setEditingMemberId(null);setMemberError('');}}><Plus size={17}/> Add team member</button>:
         <form className="nb-member-create-form nb-member-create-inline" onSubmit={createMember}>
          <input autoFocus required maxLength={80} aria-label="New team member name" placeholder="Name" value={newMemberName} disabled={memberBusy} onChange={e=>setNewMemberName(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setAddingMember(false);setNewMemberName('');setMemberError('');}}}/>
          <button type="submit" disabled={!newMemberName.trim()||memberBusy}>Create</button>
          <button type="button" disabled={memberBusy} onClick={()=>{setAddingMember(false);setNewMemberName('');setMemberError('');}}>✕</button>
         </form>}
        {memberError&&<p className="nb-member-error" role="alert">{memberError}</p>}
       </th><td colSpan={4} aria-hidden="true"/></tr>}
      </tbody>
     </table>
    </>
   </div>
  </div>

   {selected&&createPortal(<>
    <div className="nb-quick-overlay-backdrop" aria-hidden="true" onClick={closeQuickPanel}/>
    <aside ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Person assignments" className="nb-assignment-panel nb-quick-panel nb-overlay-panel nb-project-week-drawer">
    <header className={"nb-quick-panel-heading nb-week-tone-"+weekHeaderTone(selected.week)+(currentWeek===selected.week?" nb-drawer-current-week":"")}>
      <div className="nb-quick-person"><span className="nb-avatar">{memberInitial(selectedPerson?.name)}</span><div><h2>{selectedPerson?.name}</h2><p>{weekIso(selected.week)} · {weekRange(project.startDate,selected.week)}</p></div></div>
      <B aria-label="Close person panel" onClick={closeQuickPanel}><X size={22} aria-hidden="true"/></B>
    </header>
    <div className="nb-quick-metrics nb-drawer-stats" aria-label="Assignment status summary">
     <span className="nb-metric-active"><strong>{chosen.filter((t:any)=>t.status==='In Progress').length}</strong><small>Active</small></span>
     <span className="nb-metric-planned"><strong>{chosen.filter((t:any)=>t.status==='Planned').length}</strong><small>Planned</small></span>
     <span className="nb-metric-done"><strong>{chosen.filter((t:any)=>t.status==='Completed').length}</strong><small>Done</small></span>
     <span className="nb-metric-blocked"><strong>{chosen.filter((t:any)=>t.status==='Blocked').length}</strong><small>Blocked</small></span>
    </div>
    <div className="nb-drawer-section-heading nb-drawer-assignments-heading"><strong>Assignments</strong><span>{chosen.length}</span></div>
    {quickNotice&&<p className="nb-quick-success" role="status">{quickNotice}</p>}
    <div className="nb-quick-list" aria-label="Assignments for selected week">
     {chosen.length===0&&<p className="nb-quick-empty">No assignments for this person in {weekIso(selected.week)}.</p>}
     {chosen.map((t:any,index:number)=><QuickAssignmentRow key={t.id} number={index+1} task={t} project={project} sourceWeek={selected.week} isAdmin={isAdmin} onQuickTaskSave={onQuickTaskSave} onQuickTaskEdit={onQuickTaskEdit} onQuickTaskDelete={onQuickTaskDelete} onRequireEdit={onAuth} onQuickTaskMove={async(id:string,source:number,direction:'next'|'previous')=>{await onQuickTaskMove(id,source,direction);setQuickNotice(`Moved to Week ${source+(direction==='previous'?0:2)}`);}}/>)}
    </div>
    {isAdmin&&selected.id!==UNASSIGNED_MEMBER_ID?<div className="nb-quick-add-area">
     {!addingAssignment?<button type="button" className="nb-quick-add-button" onClick={()=>{setAddingAssignment(true);setQuickError('');}}><Plus size={19} aria-hidden="true"/> Add assignment</button>:<form className="nb-quick-add-form" onSubmit={async(e:any)=>{e.preventDefault();if(quickAdding)return;const label=newAssignment.trim();if(!label){setQuickError('Enter a task name.');return;}setQuickAdding(true);setQuickError('');try{await onQuickTaskCreate({label,memberId:selected.id,startWeek:selected.week});setNewAssignment('');setAddingAssignment(false);}catch(error:any){setQuickError(error?.message||'Could not save task.');}finally{setQuickAdding(false);}}}>
      <label htmlFor="nb-quick-new-task">New assignment for {selectedPerson?.name}</label>
      <input id="nb-quick-new-task" required maxLength={160} autoFocus placeholder="Type task name and press Enter…" value={newAssignment} disabled={quickAdding} onChange={e=>setNewAssignment(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setAddingAssignment(false);setNewAssignment('');setQuickError('');}}}/>
      <div className="nb-quick-add-buttons"><button type="submit" className="nb-button nb-primary" disabled={quickAdding||!newAssignment.trim()}>{quickAdding?'Saving…':'Add task'}</button><B disabled={quickAdding} onClick={()=>{setAddingAssignment(false);setNewAssignment('');setQuickError('');}}>Cancel</B></div>
     </form>}
     {quickError&&<p className="nb-quick-error" role="alert">{quickError}</p>}
    </div>:selected.id===UNASSIGNED_MEMBER_ID?<p className="nb-quick-view-note">Unassigned tasks are preserved. Sign in as Admin to reassign them.</p>:<div className="nb-drawer-view-footer"><span>Sign in as Admin to update tasks.</span><button type="button" className="nb-button nb-drawer-edit-button" onClick={()=>{closeQuickPanel();onAuth();}}><ShieldCheck size={17} aria-hidden="true"/> Sign in</button></div>}
    </aside>
   </>,document.body)}

  {memberPendingDeletion&&isAdmin&&createPortal(
   <div className="nb-member-delete-scrim" onMouseDown={e=>{if(e.target===e.currentTarget&&!memberBusy)setMemberToDelete(null);}}>
    <section ref={memberDialogRef} className="nb-member-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="nb-member-delete-title" aria-describedby="nb-member-delete-description">
     <div className="nb-member-delete-symbol" aria-hidden="true"><AlertCircle size={23}/></div>
     <h2 id="nb-member-delete-title">Permanently delete {memberPendingDeletion.name}?</h2>
     <p id="nb-member-delete-description"><strong>Warning: this action cannot be undone.</strong> Deleting this employee will permanently remove their task history from this project.</p>
     <ul className="nb-member-delete-impact">
      <li><strong>{pendingOwnedTasks.length}</strong> owned task(s) and their history will be deleted.</li>
      <li><strong>{pendingHelperTasks.length}</strong> helper assignment(s) on other tasks will be removed; those tasks will remain.</li>
      <li><strong>{pendingOwnedSystems.length}</strong> system ownership link(s) will be cleared; the systems will remain.</li>
     </ul>
     <p className="nb-member-delete-backup">Export a backup before continuing if you may need the deleted task history.</p>
     {memberError&&<p className="nb-member-delete-error" role="alert">{memberError}</p>}
     <div className="nb-member-delete-buttons">
      <button type="button" autoFocus className="nb-button nb-member-delete-cancel" disabled={memberBusy} onClick={()=>{setMemberToDelete(null);setMemberError('');}}>Cancel — keep employee</button>
      <button type="button" className="nb-button nb-member-delete-confirm" disabled={memberBusy} onClick={()=>{void confirmMemberDelete();}}>{memberBusy?'Deleting…':'Yes, permanently delete'}</button>
     </div>
    </section>
   </div>,document.body)}

  <footer className="nb-week-footer nb-aligned-week-footer nb-approved-week-footer" aria-label="Project weeks navigation">
   <div className="nb-week-card-scroller" ref={weekFooterScrollRef}>
    <div className="nb-week-card-grid" ref={weekFooterGridRef}>
     <div className="nb-week-navigation-label nb-week-navigation-home">
      <strong>Project weeks</strong>
      <B className="nb-go-today nb-today-action" onMouseDown={(event:React.MouseEvent)=>event.preventDefault()} onClick={()=>{
       if(currentWeek>=0&&currentWeek<520){resetWeekScroll();selectWeek(currentWeek);setWeek(clampWeekViewport(currentWeek));}
      }} aria-label="Jump to current project week" disabled={currentWeek<0||currentWeek>=520}>
       <CalendarDays size={17} aria-hidden="true"/> Today
      </B>
     </div>
     {weeks.map((w,index)=>{
      const days=projectWeekDays(project.startDate,w);
      const isCurrent=currentWeek===w;
      return <div key={w} className={'nb-week-nav-shell '+(index===0?'nb-week-nav-first ':'')+(index===3?'nb-week-nav-last ':'')}>
       <button type="button" className={'nb-week-wide-card '+(w===selectedWeek?'nb-week-wide-selected ':'')+(isCurrent?'nb-week-wide-current ':'')}
        aria-pressed={w===selectedWeek} aria-current={isCurrent?'date':undefined}
        aria-label={`${weekIso(w)}, ${weekRange(project.startDate,w)}${isCurrent?', current week':''}`}
        onClick={()=>selectWeek(w)}>
        <strong>{weekIso(w)}</strong>
        <span className="nb-week-wide-date">{weekRange(project.startDate,w)}</span>
        <span className="nb-week-wide-days" aria-label="Seven days of this project week">
         {days.map((day:any)=><span key={day.date} className={'nb-week-day '+(day.date===todayDate?'nb-week-day-today':'')}
          aria-current={day.date===todayDate?'date':undefined} title={`${day.weekday}, ${day.date}`}>
          {day.short}
         </span>)}
        </span>
       </button>
       {index===0&&<B disabled={week<=0} onMouseDown={(event:React.MouseEvent)=>event.preventDefault()}
        onClick={()=>navigateWeek(-1)} aria-label="Previous project week" className="nb-week-arrow nb-weeks-prev"><ChevronLeft size={21} aria-hidden="true"/></B>}
       {index===3&&<B disabled={week>=516} onMouseDown={(event:React.MouseEvent)=>event.preventDefault()}
        onClick={()=>navigateWeek(1)} aria-label="Next project week" className="nb-week-arrow nb-weeks-next"><ChevronRight size={21} aria-hidden="true"/></B>}
      </div>;
     })}
    </div>
   </div>
  </footer>
  {milestoneEditor&&createPortal(<div className="nb42-dialog-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!milestoneBusy)setMilestoneEditor(null);}}>
   <section role="dialog" aria-modal="true" aria-labelledby="nb42-milestone-title" className="nb42-milestone-dialog">
    <div className="nb42-dialog-header"><div><span className="nb42-dialog-eyebrow">{weekIso(milestoneEditor.startWeek)} · Project milestone</span><h2 id="nb42-milestone-title">{milestoneEditor.creating?'Add milestone':'Edit milestone'}</h2></div>
     <button type="button" className="nb42-dialog-close" aria-label="Close milestone editor" disabled={milestoneBusy} onClick={()=>setMilestoneEditor(null)}><X size={19}/></button>
    </div>
    <form onSubmit={saveMilestone}>
     <label className="nb42-milestone-name-label" htmlFor="nb42-milestone-name">Milestone name</label>
     <input autoFocus id="nb42-milestone-name" required maxLength={160} value={milestoneDraft} disabled={milestoneBusy} placeholder="Enter milestone title" onChange={event=>{setMilestoneDraft(event.target.value);setMilestoneError('');}}/>
     {milestoneError&&<p role="alert" className="nb42-milestone-error">{milestoneError}</p>}
     <div className="nb42-dialog-actions">
      {!milestoneEditor.creating&&<button type="button" className="nb42-delete-action" disabled={milestoneBusy} onClick={deleteMilestone}><Trash2 size={15}/> Delete</button>}
      <button type="button" className="nb42-dialog-cancel" disabled={milestoneBusy} onClick={()=>setMilestoneEditor(null)}>Cancel</button>
      <button type="submit" className="nb42-dialog-save" disabled={milestoneBusy||!milestoneDraft.trim()}><Check size={16}/>{milestoneBusy?'Saving…':'Save milestone'}</button>
     </div>
    </form>
   </section>
  </div>,document.body)}
 </section>;
}

export function Report({project,isAdmin,onSystemChange,onSystemCreate,onSystemDelete,onRequestAdmin,onDisableAdmin}:any){
 const [query,setQuery]=useState(''),[scope,setScope]=useState('All'),[owner,setOwner]=useState(''),[cyber,setCyber]=useState(''),[venue,setVenue]=useState('');
 const [hidden,setHidden]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('nbdt-report-hidden')||'[]');}catch{return [];}});
 const [sort,setSort]=useState('reference'),[sortDirection,setSortDirection]=useState<'asc'|'desc'>('asc');
 const [editor,setEditor]=useState<any>(null),[saving,setSaving]=useState(false),[saveMessage,setSaveMessage]=useState(''),[formError,setFormError]=useState('');
 const [confirmDeleteId,setConfirmDeleteId]=useState<string|null>(null);
 const [cyberReason,setCyberReason]=useState('');
 useEffect(()=>{localStorage.setItem('nbdt-report-hidden',JSON.stringify(hidden));},[hidden]);
 const reportSummary=reportCounts(project,counts);
 const allColumns=['System','Qty','Venue','Base','Ready','Deployed','AW','Cyber','Owner'];
 const memberName=(sys:any)=>sys.assignmentOwnerLabel||sys.reportOwnerName||project.members.find((m:any)=>m.id===sys.assigneeId)?.name||'Unassigned';
 const displayVenue=(sys:any)=>sys.reportVenue||[...new Set((sys.devices||[]).map((d:any)=>d.venue).filter(Boolean))].join(', ')||'—';
 const displayAw=(sys:any)=>{const v=sys.reportAW??sys.airWatchTags??sys.airWatch??sys.mdm;if(v===true)return 'Yes';if(v===false)return 'No';const s=String(v||'').trim();return ['Yes','No','Pending','N/A'].includes(s)?s:s?'Specified':'—';};
 const compare=(a:any,b:any)=>{const key=(sys:any)=>sort==='reference'?(sys.reportOrder??100000):sort==='name'?sys.name:sort==='qty'?counts(sys).total:sort==='venue'?displayVenue(sys):sort==='base'?counts(sys).base:sort==='ready'?counts(sys).ready:sort==='deployed'?counts(sys).deployed:sort==='aw'?displayAw(sys):sort==='cyber'?sys.cyberStatus||'Unknown':memberName(sys);const x=key(a),y=key(b);const n=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y));return sortDirection==='asc'?n:-n;};
 const changeSort=(key:string)=>{if(sort===key)setSortDirection(v=>v==='asc'?'desc':'asc');else{setSort(key);setSortDirection('asc');}};
 const normalizedQuery=query.trim().toLowerCase();
 const systems=[...project.systems].filter((s:any)=>{
  const total=counts(s);
  if(normalizedQuery&&![s.name,s.deviceType,s.os,displayVenue(s),memberName(s),...(s.devices||[]).flatMap((d:any)=>[d.identity,d.venue])].some(v=>String(v||'').toLowerCase().includes(normalizedQuery)))return false;
  if(venue&&displayVenue(s)!==venue)return false;
  if(owner&&memberName(s)!==owner)return false;
  if(cyber&&(s.cyberStatus||'Unknown')!==cyber)return false;
  return scope==='All'||(scope==='Not started'?total.base===0:total.base>0&&total.deployed<total.total);
 }).sort(compare);
 const rows=systems;
 const isCreating=!!editor&&!project.systems.some((s:any)=>s.id===editor.id);
 const visibleCount=allColumns.filter(c=>!hidden.includes(c)).length+1;
 const allVenues=[...new Set(project.systems.map((s:any)=>displayVenue(s)).filter((s:string)=>s!=='—'))].sort();
 const allOwners=[...new Set(project.systems.map(memberName))].sort();
 const kpis=[
  ['Base Configuration','base',reportSummary.base,reportSummary.total,Settings2],
  ['Ready for Deployment','ready',reportSummary.ready,reportSummary.total,Rocket],
  ['Deployed','deployed',reportSummary.deployed,reportSummary.total,Layers3],
  ['Cyber Approved','cyber',reportSummary.cyberApproved,reportSummary.cyberApplicable,ShieldCheck],
 ] as any[];
 const progress=(n:number,t:number)=> t>0?<span className="nb-report-progress"><span className="nb-progress-label"><small>{n.toLocaleString('en-US')}</small><strong>{Math.round(n/t*100)}%{n===t?' ✓':''}</strong></span><progress max={t} value={n} aria-label={`${n} out of ${t} completed`}/></span>:<span className="nb-muted">—<small>No device inventory</small></span>;
 const openEditor=(sys?:any)=>{if(!isAdmin){onRequestAdmin?.();return;}if(!sys){setQuery('');setScope('All');setOwner('');setCyber('');setVenue('');setSort('reference');setSortDirection('asc');}setFormError('');setSaveMessage('');setCyberReason('');setConfirmDeleteId(null);setEditor(sys?{...sys,reportMetrics:{...counts(sys)},reportVenue:displayVenue(sys)==='—'?'':displayVenue(sys),reportAW:displayAw(sys)==='—'?'':displayAw(sys),reportOwnerName:memberName(sys)==='Unassigned'?'':memberName(sys)}:{id:uid(),name:'',deviceType:'',deviceCategory:'PC',os:'Other',osVersion:'',network:'',vlan:'',serviceAccount:'',userAccount:'',logonType:'',ipScope:'',ipReservation:'',domainOU:'',airWatchTags:'',status:'Active',devices:[],deviceRuns:[],reportMode:'aggregate-sample',reportMetrics:{total:0,base:0,ready:0,deployed:0},reportVenue:'',reportAW:'Pending',reportOwnerName:'',cyberStatus:'Unknown'});};
 const saveEditor=async(e?:any)=>{e?.preventDefault?.();if(!editor||saving)return;setFormError('');
  try{
   if(!editor.name?.trim())throw Error('System name is required.');
   if(['total','base','ready','deployed'].some(key=>editor.reportMetrics?.[key]===''))throw Error('Enter quantity and completed counts for all stages.');
   if(project.systems.some((s:any)=>s.id!==editor.id&&s.name.trim().toLowerCase()===editor.name.trim().toLowerCase()))throw Error('This system name already exists.');
   const metrics=validateAggregateMetrics(editor.reportMetrics);
   const original=project.systems.find((s:any)=>s.id===editor.id);
   if(original?.devices?.length&&original.reportMode!=='aggregate-sample'){
    const actual=counts(original);if(['total','base','ready','deployed'].some(key=>metrics[key]!==actual[key]))throw Error('Registered device progress must be edited through its device checklists.');
   }
   const cyberChanged=(editor.cyberStatus||'Unknown')!==(original?.cyberStatus||'Unknown');
   if(cyberChanged&&!cyberReason.trim())throw Error('Provide a reason or evidence reference for changing Cyber status.');
   const next={...editor,name:editor.name.trim(),deviceType:editor.deviceType.trim(),reportVenue:editor.reportVenue.trim().toUpperCase(),reportOwnerName:editor.reportOwnerName.trim(),reportAW:editor.reportAW,airWatchTags:editor.reportAW,reportMetrics:metrics,reportMode:original?.devices?.length&&original.reportMode!=='aggregate-sample'?original.reportMode:'aggregate-sample',cyberHistory:cyberChanged?[...(original?.cyberHistory||[]),{status:editor.cyberStatus||'Unknown',reason:cyberReason.trim(),actor:'local-demo',at:new Date().toISOString()}]:original?.cyberHistory||[]};
   setSaving(true);
   if(original)await onSystemChange(next);else await onSystemCreate(next);
   if(!original){setQuery(next.name);setScope('All');setOwner('');setCyber('');setVenue('');}
   setEditor(null);setConfirmDeleteId(null);setSaveMessage(`System “${next.name}” saved.`);
  }catch(error:any){setFormError(error?.message||'Unable to save system.');}finally{setSaving(false);}
 };
 const deleteEditor=async(sys:any)=>{if(!isAdmin||saving||confirmDeleteId!==sys.id)return;
  try{setSaving(true);setFormError('');await onSystemDelete(sys.id);setConfirmDeleteId(null);setEditor(null);setSaveMessage(`System “${sys.name}” deleted.`);}catch(error:any){setFormError(error?.message||'Unable to delete system.');}finally{setSaving(false);}
 };
 const cancelEditor=()=>{setEditor(null);setFormError('');setCyberReason('');};
 const editableRegistered=(sys:any)=>!!(sys?.devices?.length&&sys.reportMode!=='aggregate-sample');
 const inlineNumber=(key:'total'|'base'|'ready'|'deployed',label:string)=>{
  const isLocked=!!editor&&editableRegistered(project.systems.find((s:any)=>s.id===editor.id));
  const value=editor?.reportMetrics?.[key]??0;
  return <input className="nb-report-inline-number" type="number" step="1" min="0" max={key==='total'?1000000:(editor?.reportMetrics?.total||0)} aria-label={label} value={value} disabled={saving||isLocked} title={isLocked?'Registered device progress is edited in its device checklist':label} onChange={e=>changeMetric(key,e.target.value)}/>;
 };
 const inlineProgress=(key:'base'|'ready'|'deployed',label:string)=>{
  const n=Number(editor?.reportMetrics?.[key]||0),total=Number(editor?.reportMetrics?.total||0);
  return <div className="nb-report-inline-progress">{inlineNumber(key,label)}<span className="nb-report-inline-percent">{total>0&&n>=0?`${Math.round(n/total*100)}%`:'—'}</span><progress value={Math.max(0,Math.min(total,n))} max={Math.max(1,total)} aria-label={label+' progress'}/></div>;
 };
 const inlineActions=<div className="nb-report-inline-actions"><button type="button" className="nb-report-inline-save" disabled={saving} onClick={()=>saveEditor()} aria-label="Save system"><Check size={15}/> Save</button><button type="button" disabled={saving} onClick={cancelEditor} aria-label="Cancel editing"><X size={14}/> Cancel</button></div>;
 const inlineRow=editor&&<tr key={'editing-'+editor.id} className="nb-report-editing-row" onKeyDown={e=>{if(e.key==='Escape')cancelEditor();if(e.key==='Enter'&&(e.target as HTMLElement).tagName==='INPUT'&&!saving){e.preventDefault();saveEditor();}}}>
   <td><div className="nb-report-name-editor"><input required autoFocus aria-label="System name" maxLength={140} placeholder="System name" value={editor.name} onChange={e=>changeField('name',e.target.value)}/><input aria-label="Device model" maxLength={180} placeholder="Device model" value={editor.deviceType||''} onChange={e=>changeField('deviceType',e.target.value)}/>{formError&&<span className="nb-report-row-error" role="alert">{formError}</span>}</div></td>
   <td hidden={hidden.includes('Qty')}>{inlineNumber('total','Quantity')}</td>
   <td hidden={hidden.includes('Venue')}><input aria-label="Venue" maxLength={30} value={editor.reportVenue||''} onChange={e=>changeField('reportVenue',e.target.value)}/></td>
   <td className="nb-stage-base" hidden={hidden.includes('Base')}>{inlineProgress('base','Base configuration completed')}</td>
   <td className="nb-stage-ready" hidden={hidden.includes('Ready')}>{inlineProgress('ready','Ready for deployment completed')}</td>
   <td className="nb-stage-deployed" hidden={hidden.includes('Deployed')}>{inlineProgress('deployed','Deployed devices')}</td>
   <td hidden={hidden.includes('AW')}><select aria-label="AW" value={editor.reportAW||''} onChange={e=>changeField('reportAW',e.target.value)}>{['Yes','No','Pending','N/A',''].map(v=><option key={v} value={v}>{v||'—'}</option>)}</select></td>
   <td hidden={hidden.includes('Cyber')}><select aria-label="Cyber status" value={editor.cyberStatus||'Unknown'} onChange={e=>changeField('cyberStatus',e.target.value)}>{['Unknown','Review','Approved','Blocked','N/A'].map(v=><option key={v} value={v}>{v}</option>)}</select>{(editor.cyberStatus||'Unknown')!==(project.systems.find((s:any)=>s.id===editor.id)?.cyberStatus||'Unknown')&&<input className="nb-report-cyber-reason-inline" required maxLength={500} aria-label="Cyber change reason" title="Cyber change reason / evidence" placeholder="Reason / evidence" value={cyberReason} onChange={e=>setCyberReason(e.target.value)}/>}</td>
   <td hidden={hidden.includes('Owner')}>{editor.assignmentOwnerLabel?<span title="Change this owner in Assignment">{editor.assignmentOwnerLabel}</span>:<input aria-label="Owner" maxLength={100} value={editor.reportOwnerName||''} onChange={e=>changeField('reportOwnerName',e.target.value)}/>}</td>
   <td className="nb-report-action-cell">{inlineActions}</td>
  </tr>;
 const changeField=(key:string,v:any)=>setEditor((old:any)=>({...old,[key]:v}));
 const changeMetric=(key:string,v:string)=>setEditor((old:any)=>({...old,reportMetrics:{...old.reportMetrics,[key]:v}}));
 return <section className="nb-report nb-report-reference-v032">
  <header className="nb-page-header nb45-primary-header"><div><h1>Configuration Report</h1><p>Legend of the Seas · Deployment overview</p></div><div className="nb-actions"/></header>
  <div className="nb-kpis">{kpis.map(([label,key,n,t,Icon]:any)=><article className="nb-kpi" key={key}><div><span className={'nb-kpi-icon nb-kpi-icon-'+key}><Icon size={24} strokeWidth={2}/></span><h3>{label}</h3><strong>{t?Math.round(n/t*100)+'%':'—'}</strong><div className={'nb-kpi-ring nb-kpi-ring-'+key} role="img" aria-label={`${label}: ${n} of ${t}`} style={{background:`conic-gradient(var(--report-kpi-accent) ${t?n/t*100:0}%, #e4edf8 0)`}}><span/></div><p>{t?`${n.toLocaleString('en-US')} / ${t.toLocaleString('en-US')} ${key==='cyber'?'applicable systems':'devices'}`:key==='deployed'?'No deployment records':'No registered device data'}</p></div></article>)}</div>
  <section className="nb-report-readiness-panel" aria-label="System readiness">
   <div className="nb-readiness-heading"><h2>System readiness <small>{systems.length} systems</small></h2><div className="nb-scope-tabs" role="group" aria-label="Readiness scope">{['All','In progress','Not started'].map(v=><B key={v} aria-pressed={scope===v} onClick={()=>setScope(v)}>{v}</B>)}</div><div className="nb-report-manage-actions">{isAdmin&&<B onClick={()=>openEditor()} className="nb-report-add-system"><Plus size={16}/> Add system</B>}</div></div>
   <div className="nb-toolbar nb-report-filters">
    <label className="nb-report-search"><Search size={19} aria-hidden="true"/><input aria-label="Search systems" placeholder="Search systems or devices..." value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <select aria-label="Venue scope" value={venue} onChange={e=>setVenue(e.target.value)}><option value="">All venues</option>{allVenues.map(v=><option key={v} value={v}>{v}</option>)}</select>
    <select aria-label="Owner scope" value={owner} onChange={e=>setOwner(e.target.value)}><option value="">All assignees</option>{allOwners.map(v=><option key={v} value={v}>{v}</option>)}</select>
    <select aria-label="Cyber scope" value={cyber} onChange={e=>setCyber(e.target.value)}><option value="">All cyber statuses</option>{['Unknown','Approved','Review','Blocked','N/A'].map(v=><option key={v}>{v}</option>)}</select>
    <details className="nb-report-column-picker"><summary>Columns</summary><div className="nb-report-column-menu">{allColumns.filter(v=>v!=='System').map(v=><label key={v}><input type="checkbox" checked={!hidden.includes(v)} onChange={e=>setHidden(e.target.checked?hidden.filter(x=>x!==v):[...hidden,v])}/>{v}</label>)}<div className="nb-report-sort-control"><label>Sort by<select value={sort} onChange={e=>{setSort(e.target.value);setSortDirection('asc');}}><option value="reference">Reference order</option><option value="name">System name</option><option value="qty">Device quantity</option><option value="base">Base configuration</option><option value="ready">Ready to deploy</option><option value="deployed">Deployed count</option></select></label></div></div></details>
   </div>
   <div className="nb-report-table nb-report-continuous"><table><thead><tr>{allColumns.map(v=>{const key=({System:'name',Qty:'qty',Venue:'venue',Base:'base',Ready:'ready',Deployed:'deployed',AW:'aw',Cyber:'cyber',Owner:'owner'} as any)[v];return <th key={v} hidden={hidden.includes(v)} aria-sort={sort===key?(sortDirection==='asc'?'ascending':'descending'):'none'}><button className="nb-report-th-sort" onClick={()=>changeSort(key)}>{({Base:'Base config.',Ready:'Ready to deploy'} as any)[v]||v}<span aria-hidden="true">{sort===key?(sortDirection==='asc'?'⌃':'⌄'):'↕'}</span></button></th>})}<th className="nb-report-actions-th">Actions</th></tr></thead>
    <tbody>
     {isCreating&&inlineRow}
     {rows.map((s:any)=>{const c=counts(s);if(editor?.id===s.id)return inlineRow;return <tr key={s.id} className="nb-report-data-row"><td><strong className="nb-report-system-name">{s.name}</strong><small>{s.deviceType||s.deviceCategory||'Device profile'}</small></td><td hidden={hidden.includes('Qty')}>{c.total||'—'}</td><td hidden={hidden.includes('Venue')}>{displayVenue(s)}</td><td className="nb-stage-base" hidden={hidden.includes('Base')}>{progress(c.base,c.total)}</td><td className="nb-stage-ready" hidden={hidden.includes('Ready')}>{progress(c.ready,c.total)}</td><td className="nb-stage-deployed" hidden={hidden.includes('Deployed')}>{progress(c.deployed,c.total)}</td><td hidden={hidden.includes('AW')}>{displayAw(s)}</td><td hidden={hidden.includes('Cyber')}><Badge value={s.cyberStatus||'Unknown'}/></td><td hidden={hidden.includes('Owner')}>{memberName(s)}</td><td className="nb-report-action-cell">{confirmDeleteId===s.id?<div className="nb-report-delete-confirm"><span>Delete this system and its history?</span><button disabled={saving} onClick={()=>deleteEditor(s)} className="nb-report-confirm-danger" aria-label={'Confirm delete '+s.name}>Delete</button><button onClick={()=>setConfirmDeleteId(null)}>Cancel</button></div>:<div className="nb-report-row-actions">{isAdmin&&<button type="button" aria-label={'Edit '+s.name} title="Edit system inline" onClick={()=>openEditor(s)}><Pencil size={15}/></button>}{isAdmin&&<button type="button" aria-label={'Delete '+s.name} title="Delete system" onClick={()=>{setEditor(null);setConfirmDeleteId(s.id);}}><Trash2 size={15}/></button>}</div>}</td></tr>})}
     {rows.length===0&&!isCreating&&<tr><td colSpan={visibleCount} className="nb-report-no-results">No systems match the current filters.</td></tr>}
    </tbody></table></div>
   <div className="nb-report-continuous-footer"><span>Showing all {systems.length} systems · Scroll to view the full list</span></div>
   {project.referenceDemoTotals&&<p className="nb-report-reference-note">Reference demo: six systems reproduced from the approved mockup. KPI totals also include an illustrative subtotal for 68 unseen systems. These totals are not verified device inventory. Editing a system updates its progress and the overall displayed totals.</p>}
   {formError&&!editor&&<p role="alert" className="nb-report-form-error nb-report-inline-error">{formError}</p>}
   {saveMessage&&<p role="status" className="nb-report-save-message">{saveMessage}</p>}
  </section>
 </section>;
}

export function Overview({project,onNavigate}:any){return <section className="nb-overview"><header className="nb-page-header"><div><h1>{project.name}</h1><p>NBDT · Deployment workspace</p></div></header><div className="nb-kpis">{[['Systems',project.systems.length,'systems'],['Tasks',project.tasks.filter((t:any)=>!t.isMilestone).length,'roadmap'],['Open issues',project.issues.filter((i:any)=>i.status!=='Resolved').length,'issues'],['Registered devices',project.systems.reduce((n:number,s:any)=>n+(s.devices||[]).length,0),'config-report']].map(([label,n,tab])=><button className="nb-kpi" key={label} onClick={()=>onNavigate(tab)}><div><h3>{label}</h3><strong>{n}</strong></div></button>)}</div><p className="nb-notice">Local preview. Existing seed records are retained from the supplied project; they are not a live deployment status.</p></section>;}
