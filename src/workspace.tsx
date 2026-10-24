import {Migration,download,useUnsaved} from './enhancements';
import {TECH_FIELDS,effectiveStatus,isoWeek,projectToday,csv} from './extended-model.mjs';
import {weekIndexFromIso} from './navigation.mjs';
import {projectWeekDate,projectWeekDays,weekIndexFromDate,currentWeekIndex,todayInTimezone,validDate} from './schedule.mjs';
import {clampWeekViewport,moveWeekViewport} from './week-navigation.mjs';
import {setResult} from './model.mjs';
import React,{useState,useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {Monitor,AppWindow,Plug,Network,Globe,LockKeyhole,UserRoundKey,Workflow,ShieldCheck,LayoutGrid,Tag,UserRound,ClipboardCheck,BookOpen,ChevronLeft,ChevronRight,ChevronDown,Settings2,Rocket,Layers3,Flag,CalendarDays,Search,Users,AlertCircle} from 'lucide-react';
const fieldIcons:any={'Endpoint':Monitor,'Operating system':AppWindow,'Connection':Plug,'VLAN':Network,'IP scope':Globe,'Reservation':LockKeyhole,'Service account reference':UserRoundKey,'Domain / OU':Workflow,'MDM / AirWatch':ShieldCheck,'Applications':LayoutGrid,'Naming convention':Tag,'Owner':UserRound};
import {STAGES,LABELS,uid,weekRange,dueDate,safeUrl,validateGuide,newGuide,runFor,canAccept,setCheck,acceptStage,counts,assignments} from './model.mjs';
const B=({children,onClick,disabled=false,primary=false,className='',...rest}:any)=><button type="button" className={'nb-button '+(primary?'nb-primary ':'')+className} onClick={onClick} disabled={disabled} {...rest}>{children}</button>;
const Badge=({value}:any)=><span className={'nb-badge nb-status-'+String(value).toLowerCase().replaceAll(' ','-')}>{({'In Progress':'Active','Completed':'Done'} as any)[value]||value}</span>;
function useDirty(dirty:boolean){useEffect(()=>{const f=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',f);return()=>window.removeEventListener('beforeunload',f);},[dirty]);}
export function Guide({sys,project,isAdmin,onClose,onEdit,onUpdateSystem,initialDeviceId,initialStage,onNavigationChange}:any){
 const [stage,setStage]=useState(initialStage||'configuration'),[deviceId,setDeviceId]=useState(initialDeviceId||''),[technical,setTechnical]=useState(true),[message,setMessage]=useState('');const pending=useRef(false);
 const [identity,setIdentity]=useState(''),[venue,setVenue]=useState(''),[editing,setEditing]=useState(false),[draft,setDraft]=useState<any>(sys.guideDraft||newGuide());
 const dirty=editing&&JSON.stringify(draft)!==JSON.stringify(sys.guideDraft||sys.publishedGuide||newGuide());useDirty(dirty);useUnsaved(dirty);
 const close=()=>{if(!dirty||confirm('Discard unsaved guide changes?'))onClose();};
 useEffect(()=>{const f=(e:KeyboardEvent)=>{if(e.key==='Escape')close();};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f);},[dirty,onClose]);
 const device=(sys.devices||[]).find((d:any)=>d.id===deviceId),run=runFor(sys,device),guide=editing?draft:(run?.snapshot||sys.publishedGuide);
 const items=guide?.stages?.[stage]||[];const previewItems=guide?items:(sys.checkSheetData?.[stage]||[]);const technicalValues=guide?.technicalSnapshot||sys;const url=safeUrl(sys.documentationUrl);
 const update=async(next:any)=>{if(pending.current)return false;pending.current=true;try{await onUpdateSystem(next);setMessage('Saved in demo storage');return true;}catch(e:any){setMessage('Save failed: '+e.message);return false;}finally{pending.current=false;}};
 const updateRun=(next:any)=>update({...sys,deviceRuns:[...(sys.deviceRuns||[]).filter((r:any)=>r.id!==next.id),next]});
 const owner=project.members.find((m:any)=>m.id===sys.assigneeId)?.name||'Unassigned';
 const startRun=async()=>{if(!device||!sys.publishedGuide)return;await updateRun({id:uid(),deviceId:device.id,profileId:sys.id,guideVersion:sys.publishedGuide.version,snapshot:structuredClone(sys.publishedGuide),checks:{},accepted:{}});};
 const saveDraft=async()=>{if(await update({...sys,guideDraft:draft}))setEditing(false);};
 const publish=async()=>{const errors=validateGuide(sys,draft);if(errors.length){setMessage(errors.join('; '));return;}if(!confirm('Publish a new local guide version? Existing device runs keep their original guide snapshot and completion.'))return;const next={...draft,platform:sys.os,version:(sys.publishedGuide?.version||0)+1,publishedAt:new Date().toISOString(),publishedBy:'local-demo',technicalSnapshot:Object.fromEntries(TECH_FIELDS.map(k=>[k,sys[k]])),valueStates:sys.valueStates||{}};if(await update({...sys,publishedGuide:next,guideDraft:null})){setDraft(next);setEditing(false);}};
 return <section className="nb-guide-page"><div className="nb-breadcrumb"><B onClick={close}>Systems</B> / {sys.name} / Guide</div><header className="nb-page-header"><div><h1>{sys.name}</h1><p>{sys.description||'System configuration guide'} · Profile: {sys.deviceType||sys.deviceCategory} · {sys.os} {sys.osVersion}</p></div><div className="nb-actions">{url&&<a className="nb-button" href={url} target="_blank" rel="noopener noreferrer">Documentation ↗</a>}{isAdmin&&<><B onClick={()=>{if(!dirty||confirm('Discard unsaved guide changes?'))onEdit();}}>Edit profile</B><B onClick={()=>{setDraft(sys.guideDraft||sys.publishedGuide||newGuide());setEditing(true);}}>Edit guide</B></>}<B onClick={close}>Back to systems</B></div></header>
 <div className="nb-guide-body"><div className="nb-context"><strong>{device?'Device: '+device.identity:'Guide preview · Select a device to record completion'}</strong><select aria-label="Device" value={deviceId} onChange={e=>{setDeviceId(e.target.value);onNavigationChange?.({deviceId:e.target.value,stage});setMessage('');}}><option value="">No device selected</option>{(sys.devices||[]).map((d:any)=><option key={d.id} value={d.id}>{d.identity} · {d.venue||'No venue'}</option>)}</select><span>Guide {guide?'v'+guide.version:'not published'} · {run?'Run '+run.id.slice(0,8):'No active run'}</span>{isAdmin&&device&&!run&&sys.publishedGuide&&<B primary onClick={startRun}>Start device run</B>}</div>
 {isAdmin&&<details className="nb-panel"><summary>Register an actual device</summary><form className="nb-toolbar" onSubmit={async e=>{e.preventDefault();if(!identity.trim())return;if(project.systems.some((system:any)=>(system.devices||[]).some((d:any)=>d.identity.toLowerCase()===identity.trim().toLowerCase()))){setMessage('Device identity already exists');return;}const id=uid();if(await update({...sys,devices:[...(sys.devices||[]),{id,identity:identity.trim(),venue:venue.trim(),profileId:sys.id}]})){setDeviceId(id);setIdentity('');setVenue('');}}}><label>Hostname / Asset ID<input required value={identity} onChange={e=>setIdentity(e.target.value)}/></label><label>Venue<input value={venue} onChange={e=>setVenue(e.target.value)}/></label><button className="nb-button" type="submit">Register device</button></form></details>}
 <section className="nb-technical"><button className="nb-section-toggle" onClick={()=>setTechnical(!technical)} aria-expanded={technical}><span>Technical essentials</span> <span>{technical?'Collapse':'Expand'}</span></button>{technical&&<dl className="nb-technical-grid">{[['Endpoint',technicalValues.deviceType],['Operating system',technicalValues.os+' '+technicalValues.osVersion],['Connection',technicalValues.network],['VLAN',technicalValues.vlan],['IP scope',technicalValues.ipScope],['Reservation',technicalValues.ipReservation],['Service account reference',technicalValues.serviceAccount],['Domain / OU',technicalValues.domainOU],['MDM / AirWatch',technicalValues.airWatchTags],['Naming convention',technicalValues.namingConvention],['Applications',technicalValues.appList],['Owner',owner]].map(([k,v])=><div key={k}><span className="nb-tech-icon">{React.createElement(fieldIcons[k]||Monitor,{size:22,strokeWidth:1.85,'aria-hidden':true})}</span><div><dt>{k}</dt><dd>{v||'Not specified'}{v&&(guide?.valueStates?.[({'Endpoint':'deviceType','Operating system':'os','Connection':'network','VLAN':'vlan','IP scope':'ipScope','Reservation':'ipReservation','Service account reference':'serviceAccount','Domain / OU':'domainOU','MDM / AirWatch':'airWatchTags','Applications':'appList','Naming convention':'namingConvention'} as any)[k]]||sys.valueStates?.[({'Endpoint':'deviceType','Operating system':'os','Connection':'network','VLAN':'vlan','IP scope':'ipScope','Reservation':'ipReservation','Service account reference':'serviceAccount','Domain / OU':'domainOU','MDM / AirWatch':'airWatchTags','Applications':'appList','Naming convention':'namingConvention'} as any)[k]]||sys.valueState)!=='confirmed'&&<small>To confirm · legacy source</small>}</dd></div></div>)}</dl>}</section>
 <details className={'nb-lessons '+(!sys.lessonsLearned?'nb-neutral':'')}><summary><BookOpen size={22} aria-hidden="true"/><strong>Lessons Learned</strong><span>· {sys.lessonsLearned?'Notes available':'No notes recorded'}</span><ChevronDown size={19} className="nb-lessons-chevron"/></summary><p className="nb-note">{sys.lessonsLearned||'No lessons learned have been added.'}</p></details>
 {!guide&&<p className="nb-notice">No reviewed guide has been published for this profile. The checklist below is a read-only preview of preserved legacy steps; no device completion is recorded.</p>}
 {editing&&<p className="nb-notice">Draft only. Review platform applicability before publishing. This is local workflow validation, not corporate approval.</p>}
 <section className="nb-config-workspace" aria-label="Configuration checklists"><div className="nb-config-header"><h2>Configuration checklists</h2><span>{run?Object.values(run.checks||{}).filter(Boolean).length+' steps completed':'Device completion not recorded'}</span></div>
 <div className="nb-stage-tabs" role="group" aria-label="Configuration stages">{STAGES.map((s:string,i:number)=><button type="button" aria-pressed={stage===s} className={stage===s?'selected':''} key={s} onClick={()=>{setStage(s);onNavigationChange?.({deviceId,stage:s});}}><span>{i+1}</span>{LABELS[s]}{run?.accepted?.[s]?' ✓':''}</button>)}</div>
 {guide?.preparationEnabled&&<details className="nb-panel"><summary>0 Preparation · Optional</summary>{(guide.preparationItems||[]).map((item:any)=><label className="nb-check-row" key={item.id}><input type="checkbox" disabled={!isAdmin||!run||editing} checked={!!run?.checks?.[item.id]} onChange={e=>updateRun({...run,checks:{...run.checks,[item.id]:e.target.checked}})}/>{item.label}</label>)}</details>}
 {isAdmin&&<Migration sys={sys} run={run} onSave={update}/>}
 <section className="nb-checklist"><div className="nb-section-heading"><h2>{LABELS[stage]}</h2><span>{run?items.filter((i:any)=>run.checks[i.id]).length+' / '+items.length+' completed':'Preview · no completion recorded'}</span></div>{previewItems.length===0&&<p className="nb-empty">No reviewed steps in this stage.</p>}{previewItems.map((item:any,i:number)=><div className="nb-check-row" key={item.id}>{editing?<><input aria-label={'Step '+(i+1)} value={item.label} onChange={e=>setDraft({...draft,stages:{...draft.stages,[stage]:items.map((x:any)=>x.id===item.id?{...x,label:e.target.value}:x)}})}/><label><input type="checkbox" checked={item.required!==false} onChange={e=>setDraft({...draft,stages:{...draft.stages,[stage]:items.map((x:any)=>x.id===item.id?{...x,required:e.target.checked}:x)}})}/>Required</label><label><input type="checkbox" checked={!!item.allowNA} onChange={e=>setDraft({...draft,stages:{...draft.stages,[stage]:items.map((x:any)=>x.id===item.id?{...x,allowNA:e.target.checked}:x)}})}/>Allow N/A</label><label><input type="checkbox" checked={!!item.evidenceRequired} onChange={e=>setDraft({...draft,stages:{...draft.stages,[stage]:items.map((x:any)=>x.id===item.id?{...x,evidenceRequired:e.target.checked}:x)}})}/>Evidence required</label><B disabled={i===0} onClick={()=>{const reordered=[...items];[reordered[i-1],reordered[i]]=[reordered[i],reordered[i-1]];setDraft({...draft,stages:{...draft.stages,[stage]:reordered}});}}>Move up</B><B onClick={()=>setDraft({...draft,stages:{...draft.stages,[stage]:items.filter((x:any)=>x.id!==item.id)}})}>Remove</B></>:<label><input type="checkbox" checked={!!run?.checks?.[item.id]} disabled={!isAdmin||!run||!STAGES.slice(0,STAGES.indexOf(stage)).every(s=>!!run.accepted?.[s])} onChange={e=>{if(run.accepted?.[stage]&&!confirm('Changing this accepted stage reopens it and all later stages. Continue?'))return;updateRun(setCheck(run,stage,item.id,e.target.checked));}}/><span>{item.label}<small>{!guide?'Legacy preview · Not recorded':item.required===false?'Optional':'Required'}</small></span></label>}{!editing&&run&&<details className="nb-result-details"><summary>Result details</summary><p>{run.results?.[item.id]?.state||'pending'}{run.results?.[item.id]?.reason?' · '+run.results[item.id].reason:''}</p><p>{run.results?.[item.id]?.evidenceReference||'No evidence reference'}</p>{isAdmin&&<B onClick={()=>{const evidence=prompt('Evidence reference (text only, no upload)',run.results?.[item.id]?.evidenceReference||'');if(evidence===null)return;const reason=item.allowNA?prompt('N/A reason, or leave empty for completed',run.results?.[item.id]?.reason||''):'';if(reason===null)return;try{updateRun(setResult(run,stage,item.id,{state:reason?.trim()?'not_applicable':run.checks[item.id]?'completed':'pending',reason:reason||'',evidenceReference:evidence}));}catch(e:any){setMessage(e.message);}}}>Record evidence / N/A</B>}</details>}</div>)}
 {editing&&<details className="nb-panel"><summary>Preparation settings · optional</summary><label><input type="checkbox" checked={!!draft.preparationEnabled} onChange={e=>setDraft({...draft,preparationEnabled:e.target.checked})}/> Enable Preparation</label>{draft.preparationEnabled&&<><textarea aria-label="Preparation items, one per line" value={(draft.preparationItems||[]).map((i:any)=>i.label).join('\n')} onChange={e=>setDraft({...draft,preparationItems:e.target.value.split('\n').map((label:string,i:number)=>({id:draft.preparationItems?.[i]?.id||uid(),label,required:false}))})}/><p>Optional preparation never blocks Base acceptance.</p></>}</details>}
 {editing?<div className="nb-toolbar"><B onClick={()=>setDraft({...draft,stages:{...draft.stages,[stage]:[...items,{id:uid(),label:'',required:true}]}})}>Add step</B><B onClick={saveDraft}>Save draft</B><B primary onClick={publish}>Publish reviewed version</B><B onClick={()=>{if(!dirty||confirm('Discard unsaved changes?'))setEditing(false);}}>Cancel</B></div>:<div className="nb-guide-footer"><B disabled={stage===STAGES[0]} onClick={()=>{const next=STAGES[STAGES.indexOf(stage)-1];setStage(next);onNavigationChange?.({deviceId,stage:next});}}>Previous stage</B><B primary disabled={!isAdmin||!run||!canAccept(run,stage)} onClick={async()=>{const saved=await updateRun(acceptStage(run,stage));if(saved){const n=STAGES.indexOf(stage);if(n<2){setStage(STAGES[n+1]);onNavigationChange?.({deviceId,stage:STAGES[n+1]});}}}}>Accept {LABELS[stage]}{stage!==STAGES[2]?' and continue':''}</B></div>}</section>
 </section>
 <details className="nb-panel nb-legacy-checklist"><summary>Legacy system checklist · not device completion</summary>{Object.entries(sys.checkSheetData||{}).map(([s,rows]:any)=><section key={s}><h3>{LABELS[s]||s}</h3>{rows.map((r:any)=><p key={r.id}>{r.completed?'✓':'○'} {r.label}</p>)}</section>)}</details><p role="status" className="nb-save-state">{message}</p><p className="nb-muted">Demo mode. Local record versions and audit are not corporate server authorization.</p></div></section>;
}
export function SystemEditor({sys,project,isAdmin,onSave,onClose,onDelete}:any){
 const [draft,setDraft]=useState<any>(structuredClone(sys)),[error,setError]=useState(''),[busy,setBusy]=useState(false);const dirty=JSON.stringify(draft)!==JSON.stringify(sys);useDirty(dirty);useUnsaved(dirty);
 const cancel=()=>{if(!dirty||confirm('Discard unsaved profile changes?'))onClose();};
 const field=(key:string,label:string,options?:string[])=> <label key={key}>{label}{options?<select disabled={!isAdmin} value={draft[key]||''} onChange={e=>setDraft({...draft,[key]:e.target.value})}>{options.map(v=><option key={v}>{v}</option>)}</select>:<input aria-label={label} readOnly={!isAdmin} value={draft[key]||''} onChange={e=>setDraft({...draft,[key]:e.target.value})}/>} {TECH_FIELDS.includes(key)&&<select aria-label={label+' value state'} disabled={!isAdmin} value={draft.valueStates?.[key]||'to_confirm'} onChange={e=>setDraft({...draft,valueStates:{...draft.valueStates,[key]:e.target.value}})}>{['to_confirm','confirmed','example','N/A'].map(v=><option key={v}>{v}</option>)}</select>}</label>;
 return <section className="nb-editor-page"><div className="nb-breadcrumb">Systems / {sys.name} / Edit profile</div><header className="nb-page-header"><div><h1>{isAdmin?'Edit system / profile':'System details'}</h1><p>Changes remain a draft until Save changes.</p></div><B onClick={cancel}>Back to systems</B></header><form className="nb-profile-form" onSubmit={async e=>{e.preventDefault();if(!draft.name.trim()){setError('System name is required');return;}if(draft.documentationUrl&&!safeUrl(draft.documentationUrl)){setError('Documentation must be an HTTPS URL without credentials');return;}if(draft.os!==sys.os&&(sys.deviceRuns||[]).length){setError('Platform changes require a new profile. Existing runs must not be reassigned.');return;}setBusy(true);try{await onSave(draft);}catch(e:any){setError(e.message);}finally{setBusy(false);}}}><div className="nb-form-grid"><fieldset><legend>System identity</legend>{field('name','System name')}<label>Deployment owner<select disabled={!isAdmin} value={draft.assigneeId||''} onChange={e=>setDraft({...draft,assigneeId:e.target.value})}><option value="">Unassigned</option>{project.members.map((m:any)=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>{field('description','Short description')}</fieldset><fieldset><legend>Endpoint profile</legend>{field('deviceType','Hardware / model')}{field('deviceCategory','Device category',['PC','Laptop','Tablet','Phone','Kiosk'])}{field('os','Platform family',['Windows','Linux','iOS','iPadOS','Android','macOS','Other'])}{field('osVersion','Approved OS version')}</fieldset><fieldset><legend>Network</legend>{field('network','Connection',['Wired','WiFi','Offline'])}{field('vlan','VLAN')}{field('ipScope','IP scope')}{field('ipReservation','Reservation policy')}{field('valueState','Technical value state',['to_confirm','confirmed','example','N/A'])}</fieldset><fieldset><legend>Identity & management</legend>{field('serviceAccount','Service account name / reference (no passwords)')}{field('userAccount','User account reference')}{field('logonType','Authentication type')}{field('domainOU','Domain / OU (if applicable)')}{field('airWatchTags','MDM / AirWatch tags')}{field('namingConvention','Naming convention')}</fieldset><fieldset><legend>Documentation & applications</legend>{field('documentationUrl','Documentation URL (HTTPS)')}<label>Required applications<textarea readOnly={!isAdmin} value={draft.appList||''} onChange={e=>setDraft({...draft,appList:e.target.value})}/></label><label>Engineering notes<textarea readOnly={!isAdmin} value={draft.documentation||''} onChange={e=>setDraft({...draft,documentation:e.target.value})}/></label></fieldset><fieldset><legend>Lessons Learned</legend><label>Notes<textarea readOnly={!isAdmin} value={draft.lessonsLearned||''} onChange={e=>setDraft({...draft,lessonsLearned:e.target.value})}/></label><p className="nb-muted">Profile changes do not silently publish a new guide version.</p></fieldset></div><p role="alert">{error}</p><div className="nb-toolbar">{isAdmin&&<button disabled={busy} type="submit" className="nb-button nb-primary">{busy?'Saving…':'Save changes'}</button>}<B onClick={cancel}>{isAdmin?'Cancel':'Close'}</B>{isAdmin&&onDelete&&<B onClick={()=>{if(confirm('Delete this system and its device runs? Export a backup first.'))onDelete();}}>Delete system</B>}<span>{dirty?'Unsaved changes':'No unsaved changes'}</span></div></form></section>;
}

/** Fast status controls save the shared Task ID, not one local assignment copy. */
function QuickAssignmentRow({task,role,ownerName,personId,isAdmin,onQuickTaskSave,onEdit}:any){
 const [saving,setSaving]=useState(false),[error,setError]=useState(''),[showBlocker,setShowBlocker]=useState(false),[blockReason,setBlockReason]=useState(task.blockReason||'');
 const save=async(status:string,reason='')=>{
  if(!isAdmin||saving)return;
  setSaving(true);setError('');
  try{await onQuickTaskSave(task.id,{status,...(status==='Blocked'?{blockReason:reason}:{} )});setShowBlocker(false);}
  catch(e:any){setError(e?.message||'Save failed. No changes were applied.');}
  finally{setSaving(false);}
 };
 const actualStatus=task.status||'Planned';
 return <article className={'nb-quick-task-card '+(actualStatus==='Blocked'?'nb-quick-task-blocked':'')}>
  <div className="nb-quick-task-header"><strong>{task.label}</strong><span className="nb-quick-role">{role}</span></div>
  <div className="nb-quick-task-toolbar"><label className="nb-quick-status-label">Status <select aria-label={'Status for '+task.label} value={showBlocker?'Blocked':actualStatus} disabled={!isAdmin||saving} onChange={e=>{const status=e.target.value;if(status==='Blocked'&&!(task.blockReason||'').trim()){setShowBlocker(true);return;}void save(status,task.blockReason||'');}}>
   <option value="Planned">Planned</option><option value="In Progress">Active</option><option value="Completed">Done</option><option value="Blocked">Blocked</option>
  </select></label><span className="nb-quick-task-meta">{role==='Helper'?'Owner: '+ownerName:'Owner'}</span>{isAdmin&&<button type="button" className="nb-quick-advanced" onClick={onEdit}>More</button>}</div>
  {showBlocker&&<form className="nb-quick-reason-form" onSubmit={e=>{e.preventDefault();if(blockReason.trim())void save('Blocked',blockReason.trim());}}><label>Reason for blocking<input autoFocus maxLength={2000} value={blockReason} disabled={saving} onChange={e=>setBlockReason(e.target.value)} placeholder="What is blocking this task?" required/></label><div><button type="submit" disabled={saving||!blockReason.trim()}>{saving?'Saving…':'Save blocker'}</button><button type="button" disabled={saving} onClick={()=>setShowBlocker(false)}>Cancel</button></div></form>}
  {actualStatus==='Blocked'&&task.blockReason&&<p className="nb-quick-block-reason">{task.blockReason}</p>}
  {saving&&<span role="status" className="nb-quick-saving">Saving…</span>}
  {error&&<p role="alert" className="nb-quick-error">{error}</p>}
 </article>;
}

export function Tracker({project,isAdmin,onAuth,onEdit,onProjectStartChange,onQuickTaskSave,onQuickTaskCreate,week,setWeek}:any){
 const [view,setView]=useState(()=>({overview:'Overview',list:'List'} as any)[new URLSearchParams(location.search).get('view')||'overview']||'Overview'),[query,setQuery]=useState(''),[status,setStatus]=useState(''),[person,setPerson]=useState(''),[selected,setSelected]=useState<any>(null),[collapsed,setCollapsed]=useState<string[]>([]),[detail,setDetail]=useState<any>(null);
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
 const [showMobileMatrix,setShowMobileMatrix]=useState(false);
 const [todayDate,setTodayDate]=useState(()=>todayInTimezone(project.timezone||'Europe/Paris'));
 const [dateSaving,setDateSaving]=useState(false),[dateError,setDateError]=useState('');
 const [addingAssignment,setAddingAssignment]=useState(false),[newAssignment,setNewAssignment]=useState(''),[quickAdding,setQuickAdding]=useState(false),[quickError,setQuickError]=useState('');
 const panelRef=useRef<HTMLElement|null>(null);
 const panelTriggerRef=useRef<HTMLElement|null>(null);
 const tableScrollRef=useRef<HTMLDivElement|null>(null);
 const weekFooterScrollRef=useRef<HTMLDivElement|null>(null);
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
  setSelected(null);setDetail(null);setAddingAssignment(false);setNewAssignment('');setQuickError('');
 };
 const openQuickPanel=(personId:string,w:number,task:any=null)=>{
  if(!selected&&document.activeElement instanceof HTMLElement)panelTriggerRef.current=document.activeElement;
  setSelected({id:personId,week:w});setDetail(task);setAddingAssignment(false);setNewAssignment('');setQuickError('');
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
 const updateStart=async(value:string)=>{if(dateSaving||value===project.startDate)return;if(!validDate(value)){setDateError('Choose a valid date.');return;}if(project.tasks.length&&!window.confirm('Move project planning calendar to '+value+'? The week positions of tasks are preserved, and milestone dates shift with the new week anchor. Explicit task due dates are not changed.'))return;setDateSaving(true);setDateError('');try{await onProjectStartChange(value);}catch(error:any){setDateError(error?.message||'Unable to save project start date.');}finally{setDateSaving(false);}};
 const tasks=project.tasks.filter((t:any)=>!t.isMilestone).map((t:any)=>({...t,status:effectiveStatus(t,project.issues)}));
 const milestones=project.tasks.filter((t:any)=>t.isMilestone).sort((a:any,b:any)=>a.startWeek-b.startWeek||String(a.label).localeCompare(String(b.label)));
 const matches=(t:any)=>(!status||t.status===status)&&(!person||assignments(t).includes(person))&&(!query||(t.label+' '+assignments(t).map((id:string)=>project.members.find((m:any)=>m.id===id)?.name||'').join(' ')).toLowerCase().includes(query.toLowerCase()));
 const at=(id:string,w:number)=>tasks.filter((t:any)=>assignments(t).includes(id)&&t.startWeek<=w&&t.startWeek+t.duration>w&&matches(t));
 const people=project.members.filter((m:any)=>!person||m.id===person);
 const weeks=Array.from({length:4},(_,i)=>clampWeekViewport(week)+i);
 const selectedPerson=project.members.find((m:any)=>m.id===selected?.id);
 const chosen=selected?at(selected.id,selected.week):[];
 const open=(t:any)=>setDetail(t);
 const role=(t:any,id:string)=>t.memberId===id?'Owner':'Helper';
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
 const createMilestone=(w:number)=>onEdit({id:uid(),label:'New milestone',startWeek:w,duration:1,status:'Planned',description:'',memberId:'milestones',isMilestone:true,date:weekDate(w)});

 useEffect(()=>{setSelected(null);setDetail(null);},[week,view,project.id]);
 useEffect(()=>{setAddingAssignment(false);setNewAssignment('');setQuickError('');},[selected?.id,selected?.week]);

 return <section className="nb-tracker" data-view={view.toLowerCase()}>
  <header className="nb-page-header">
   <div>
    <div className="nb-tracker-breadcrumb">NBDT · {project.name} · Weekly Tracker</div>
    <h1>Weekly Tracker</h1>
    <p>{`${weekRange(project.startDate,week)} — ${weekRange(project.startDate,week+3)}`} · {project.name}</p>
   </div>
   <div className="nb-actions">
    <B onClick={async()=>{try{const url=new URL(location.href);url.searchParams.set('week',String(week+1));url.searchParams.set('view',view.toLowerCase());url.searchParams.set('selectedWeek',String(selectedWeek+1));await navigator.clipboard.writeText(url.href);alert('Private local link copied. No message was sent.');}catch{alert('Clipboard unavailable. Copy the address from your browser.');}}}>Share view</B>
    <B onClick={onAuth}>{isAdmin?'Exit edit mode':'Edit mode'}</B>
    {isAdmin&&<B primary onClick={()=>onEdit({id:uid(),label:'New task',memberId:person||project.members[0]?.id||'',startWeek:week,duration:1,status:'Planned',description:''})}>Add task</B>}
   </div>
  </header>

  <div className="nb-toolbar">
   <div className="nb-segments">{['Overview','List'].map(v=><B key={v} onClick={()=>{setView(v);const url=new URL(location.href);url.searchParams.set('view',v.toLowerCase());window.history.replaceState({nbdt:true},'',url.pathname+url.search);}} aria-pressed={view===v}>{v}</B>)}</div>
   <label className="nb-project-start"><CalendarDays size={17} aria-hidden="true"/><span>Project start</span>{isAdmin?<input type="date" aria-label="Project start date" disabled={dateSaving} value={project.startDate} onChange={e=>{void updateStart(e.target.value);}}/>:<strong>{project.startDate}</strong>}</label>
   <select aria-label="Person filter" value={person} onChange={e=>setPerson(e.target.value)}><option value="">All people</option>{project.members.map((m:any)=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
   <select aria-label="Status filter" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{['Planned','In Progress','Blocked','Completed'].map(v=><option key={v}>{v}</option>)}</select>
   <div className="nb-search-box"><Search size={18} aria-hidden="true"/><input aria-label="Search tasks or people" placeholder="Search tasks or people..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
   {dateError&&<span className="nb-start-error" role="alert">{dateError}</span>}
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
    {view==='Overview'?<>
     <div className={'nb-mobile-week-cards '+(showMobileMatrix?'matrix-open':'')} aria-label="Assignments by person">
      {people.map((m:any)=>{
       const mobileList=at(m.id,week);
       const mobileMilestones=milestonesAt(week);
       return <section key={m.id} className="nb-mobile-person-card">
        <header>
         <span className="nb-avatar">{m.name.charAt(0)}</span>
         <span><strong>{m.name}</strong><small>{m.title||'Team member'}</small></span>
         <span className="nb-mobile-person-count">{mobileList.length} assignments</span>
        </header>
        <div className="nb-mobile-week-title">{weekIso(week)} · {weekRange(project.startDate,week)}</div>
        {!!mobileMilestones.length&&<div className="nb-mobile-milestones">{mobileMilestones.map((ms:any)=><button type="button" key={ms.id} className="nb-milestone-chip" onClick={()=>{if(isAdmin){closeQuickPanel();onEdit(ms);}}}><span>{ms.label}</span>{ms.date&&<small>{ms.date}</small>}</button>)}</div>}
        {mobileList.length?mobileList.map((t:any)=><button key={t.id} className="nb-mobile-mini-task" onClick={()=>{selectWeek(week);openQuickPanel(m.id,week,t);}}><span>{t.label}{t.memberId!==m.id&&<small>Helper</small>}</span><Badge value={t.status}/></button>):<p className="nb-empty">No tasks planned</p>}
        <button type="button" className="nb-mobile-open-assignments" onClick={()=>{selectWeek(week);openQuickPanel(m.id,week);}}>View assignments →</button>
       </section>;
      })}
     </div>
     <table className={'nb-week-grid '+(!showMobileMatrix?'mobile-cards-preferred':'')} aria-label="Weekly assignments matrix">
      <thead>
       <tr>
        <th className="nb-employee-head">Employee</th>
        {weeks.map(w=>{const columnMilestones=milestonesAt(w);return <th key={w} className={currentWeek===w?'nb-current-week-column':''}>
         <div className="nb-week-head">
          <div className="nb-week-milestones">
           {columnMilestones.length?columnMilestones.map((ms:any)=><button type="button" key={ms.id} title={isAdmin?'Edit milestone':'Project milestone'} className={'nb-milestone-chip nb-ms-'+milestoneTone(ms)+' '+(isAdmin?'editable':'')} onClick={()=>isAdmin?onEdit(ms):void 0}><Flag size={15} fill="currentColor" aria-hidden="true"/><span>{ms.label}</span></button>):<span className="nb-milestone-empty">No milestone</span>}
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
           <span className="nb-avatar">{m.name.charAt(0)}</span>
           <div className="nb-person-copy"><strong>{m.name}</strong>{m.title&&<small>{m.title}</small>}</div>
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
            {list.slice(0,4).map((t:any)=><span className="nb-mini-task" key={t.id}><span>{t.label}</span><Badge value={t.status}/></span>)}
            {list.length>4&&<span className="nb-more">+{list.length-4} more · View all {list.length}</span>}
           </button>
          </td>;
         })}
        </tr>;
       })}
      </tbody>
     </table>
    </>:<div className="nb-task-list">
      <div className="nb-list-heading"><span>Task</span><span>Role</span><span>Status</span><span>Due</span></div>
      {people.map((m:any)=>{const list=tasks.filter((t:any)=>assignments(t).includes(m.id)&&t.startWeek<week+4&&t.startWeek+Math.max(1,t.duration)>week&&matches(t));return <section key={m.id}><div className="nb-person-heading"><B aria-label={'Toggle '+m.name} aria-expanded={!collapsed.includes(m.id)} onClick={()=>setCollapsed(collapsed.includes(m.id)?collapsed.filter(id=>id!==m.id):[...collapsed,m.id])}>{collapsed.includes(m.id)?'›':'⌄'}</B><B onClick={()=>{selectWeek(week);openQuickPanel(m.id,week);}}><span className="nb-avatar">{m.name.charAt(0)}</span><span>{m.name}</span></B><small>{list.length} assignments · {list.filter((t:any)=>t.status==='Blocked').length} blocked</small></div>{!collapsed.includes(m.id)&&list.map((t:any)=><button className="nb-task-row" key={t.id} onClick={()=>{const taskWeek=Math.max(week,t.startWeek);selectWeek(taskWeek);openQuickPanel(m.id,taskWeek,t);}}><span>{t.label}<small>{t.category||'Assignment'}{t.status==='Blocked'?' · Open blocker':''}</small></span><span>{role(t,m.id)}</span><Badge value={t.status}/><span>{dueDate(project.startDate,t)}{dueDate(project.startDate,t)<projectToday(project.timezone||'Europe/Paris')&&t.status!=='Completed'&&<small className="nb-overdue">Overdue</small>}</span></button>)}</section>})}
     </div>}
   </div>
  </div>

   {selected&&createPortal(<>
    <div className="nb-quick-overlay-backdrop" aria-hidden="true" onClick={closeQuickPanel}/>
    <aside ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Person assignments" className="nb-assignment-panel nb-quick-panel nb-overlay-panel">
    <header className="nb-quick-panel-heading">
      <div className="nb-quick-person"><span className="nb-avatar">{selectedPerson?.name?.charAt(0)}</span><div><h2>{selectedPerson?.name}</h2><p>{weekIso(selected.week)} · {weekRange(project.startDate,selected.week)}</p></div></div>
      <B aria-label="Close person panel" onClick={closeQuickPanel}>✕</B>
    </header>
    <div className="nb-quick-metrics">
     <span className="nb-metric-active">{chosen.filter((t:any)=>t.status==='In Progress').length} Active</span>
     <span>{chosen.filter((t:any)=>t.status==='Planned').length} Planned</span>
     <span className="nb-metric-done">{chosen.filter((t:any)=>t.status==='Completed').length} Done</span>
     <span className="nb-metric-blocked">{chosen.filter((t:any)=>t.status==='Blocked').length} Blocked</span>
    </div>
    {!!milestonesAt(selected.week).length&&<div className="nb-quick-milestones"><strong>Milestones</strong>{milestonesAt(selected.week).map((ms:any)=><button type="button" key={ms.id} className="nb-milestone-chip" onClick={()=>{if(isAdmin){closeQuickPanel();onEdit(ms);}}}><Flag size={14}/><span>{ms.label}</span></button>)}</div>}
    <div className="nb-quick-list" aria-label="Assignments for selected week">
     {chosen.length===0&&<p className="nb-quick-empty">No assignments for this person in {weekIso(selected.week)}.</p>}
     {chosen.map((t:any)=><QuickAssignmentRow key={t.id} task={t} ownerName={project.members.find((m:any)=>m.id===t.memberId)?.name||'Unassigned'} personId={selected.id} role={role(t,selected.id)} isAdmin={isAdmin} onQuickTaskSave={onQuickTaskSave} onEdit={()=>{closeQuickPanel();onEdit(project.tasks.find((item:any)=>item.id===t.id)||t);}} />)}
    </div>
    {isAdmin?<div className="nb-quick-add-area">
     {!addingAssignment?<button type="button" className="nb-quick-add-button" onClick={()=>{setAddingAssignment(true);setQuickError('');}}>+ Add assignment</button>:<form className="nb-quick-add-form" onSubmit={async(e:any)=>{e.preventDefault();if(quickAdding)return;const label=newAssignment.trim();if(!label){setQuickError('Enter a task name.');return;}setQuickAdding(true);setQuickError('');try{await onQuickTaskCreate({label,memberId:selected.id,startWeek:selected.week});setNewAssignment('');setAddingAssignment(false);}catch(error:any){setQuickError(error?.message||'Could not save task.');}finally{setQuickAdding(false);}}}>
      <label htmlFor="nb-quick-new-task">New assignment for {selectedPerson?.name}</label>
      <input id="nb-quick-new-task" required maxLength={160} autoFocus placeholder="Type task name and press Enter…" value={newAssignment} disabled={quickAdding} onChange={e=>setNewAssignment(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setAddingAssignment(false);setNewAssignment('');setQuickError('');}}}/>
      <div className="nb-quick-add-buttons"><button type="submit" className="nb-button nb-primary" disabled={quickAdding||!newAssignment.trim()}>{quickAdding?'Saving…':'Add task'}</button><B disabled={quickAdding} onClick={()=>{setAddingAssignment(false);setNewAssignment('');setQuickError('');}}>Cancel</B></div>
     </form>}
     {quickError&&<p className="nb-quick-error" role="alert">{quickError}</p>}
    </div>:<p className="nb-quick-view-note">Enable Edit mode to change statuses or add assignments.</p>}
    </aside>
   </>,document.body)}

  <footer className="nb-week-footer nb-aligned-week-footer" aria-label="Project weeks navigation">
   <div className="nb-week-card-scroller" ref={weekFooterScrollRef}>
    <div className="nb-week-card-grid">
     <div className="nb-week-navigation-label"><strong>Project weeks</strong><B disabled={week<=0} onClick={()=>navigateWeek(-1)} aria-label="Previous project week" className="nb-weeks-prev"><ChevronLeft size={18} aria-hidden="true"/></B></div>
     {weeks.map(w=>{
      const days=projectWeekDays(project.startDate,w);
      const isCurrent=currentWeek===w;
      return <button type="button" key={w} className={'nb-week-wide-card '+(w===selectedWeek?'nb-week-wide-selected ':'')+(isCurrent?'nb-week-wide-current ':'')}
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
      </button>;
     })}
    </div>
   </div>
   <div className="nb-week-navigation-right">
    <B disabled={week>=516} onClick={()=>navigateWeek(1)} aria-label="Next project week" className="nb-weeks-next"><ChevronRight size={18} aria-hidden="true"/></B>
    <B disabled={currentWeek<0||currentWeek>=520||(clampWeekViewport(currentWeek)===week&&selectedWeek===currentWeek)} onClick={()=>{resetWeekScroll();selectWeek(currentWeek);setWeek(clampWeekViewport(currentWeek));}} className="nb-go-today">Today</B>
   </div>
  </footer>
 </section>;
}

export function Report({project,isAdmin,onSystemChange}:any){
 const [editCyber,setEditCyber]=useState(false),[saveMessage,setSaveMessage]=useState(''),[cyberSaving,setCyberSaving]=useState(false);
 const [query,setQuery]=useState(''),[scope,setScope]=useState('All'),[owner,setOwner]=useState(''),[cyber,setCyber]=useState(''),[venue,setVenue]=useState('');const [hidden,setHidden]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('nbdt-report-hidden')||'[]');}catch{return [];}}),[sort,setSort]=useState('name'),[page,setPage]=useState(0);useEffect(()=>{localStorage.setItem('nbdt-report-hidden',JSON.stringify(hidden));},[hidden]);useEffect(()=>setPage(0),[query,scope,owner,cyber,venue,sort]);
 const systems=project.systems.map((s:any)=>venue?{...s,devices:(s.devices||[]).filter((d:any)=>d.venue===venue)}:s).filter((s:any)=>(!query||s.name.toLowerCase().includes(query.toLowerCase()))&&(!owner||s.assigneeId===owner)&&(!cyber||(s.cyberStatus||'Unknown')===cyber)&&(!venue||(s.devices||[]).some((d:any)=>d.venue===venue))).filter((s:any)=>{const c=counts(s);return scope==='All'||(scope==='Not started'?c.base===0:c.base>0&&c.deployed<c.total);}).sort((a:any,b:any)=>sort==='name'?a.name.localeCompare(b.name):counts(b).deployed-counts(a).deployed);
 const total=systems.reduce((n:number,s:any)=>n+counts(s).total,0), applicable=systems.filter((s:any)=>s.cyberStatus&&s.cyberStatus!=='N/A'&&s.cyberStatus!=='Unknown'),approved=applicable.filter((s:any)=>s.cyberStatus==='Approved').length;
 const progress=(n:number,t:number)=>t?<span className="nb-report-progress"><span className="nb-progress-label"><small>{n} / {t}</small><strong>{Math.round(n/t*100)}%</strong></span><progress value={n} max={t}/></span>:<span className="nb-muted">—<small>No device inventory</small></span>;
 const allColumns=['System','Qty','Base','Ready','Deployed','Cyber','Owner'];const visibleColumns=allColumns.filter(c=>!hidden.includes(c));const maxPage=Math.max(0,Math.ceil(systems.length/12)-1);const visibleRows=systems.slice(Math.min(page,maxPage)*12,(Math.min(page,maxPage)+1)*12);
 return <section className="nb-report"><header className="nb-page-header"><div><h1>Configuration Report</h1><p>{project.name} · Device readiness from accepted, version-pinned checklists</p></div><div className="nb-actions">{isAdmin&&<B disabled={cyberSaving} onClick={()=>setEditCyber(!editCyber)}>{editCyber?'Finish Cyber editing':'Edit Cyber status'}</B>}</div></header><p className="nb-muted" role="status">{saveMessage||'Read-only report. Enter Edit Cyber status to update separately recorded approvals.'}</p><div className="nb-kpis">{[['Base Configuration','base'],['Ready for Deployment','ready'],['Deployed','deployed'],['Cyber Approved','cyber']].map(([label,key])=>{const n=key==='cyber'?approved:systems.reduce((a:number,s:any)=>a+counts(s)[key],0),t=key==='cyber'?applicable.length:total;return <article className="nb-kpi" key={key}><div><span className={'nb-kpi-icon nb-kpi-icon-'+key}>{React.createElement((({base:Settings2,ready:Rocket,deployed:Layers3,cyber:ShieldCheck} as any)[key]||Settings2),{size:24,strokeWidth:2,'aria-hidden':true})}</span><h3>{label}</h3><strong>{t?Math.round(n/t*100)+'%':'—'}</strong><div className={'nb-kpi-ring nb-kpi-ring-'+key} role="img" aria-label={t?`${label}: ${Math.round(n/t*100)} percent`:'No data'} style={{background:`conic-gradient(var(--brand) ${t?n/t*100:0}%, #e4edf8 0)`}}><span/></div><p>{t?`${n} / ${t} ${key==='cyber'?'applicable systems':'devices'}`:key==='deployed'?'No deployment records':'No registered device data'}</p></div></article>})}</div><div className="nb-readiness-heading"><h2>System readiness <small>{systems.length} systems</small></h2><div className="nb-scope-tabs" role="group" aria-label="Readiness scope">{['All','In progress','Not started'].map(v=><B key={v} aria-pressed={scope===v} onClick={()=>setScope(v)}>{v}</B>)}</div></div><div className="nb-toolbar nb-report-filters"><input aria-label="Search systems"  placeholder="Search systems" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Owner scope" value={owner} onChange={e=>setOwner(e.target.value)}><option value="">All owners</option>{project.members.map((m:any)=><option key={m.id} value={m.id}>{m.name}</option>)}</select><select aria-label="Venue scope" value={venue} onChange={e=>setVenue(e.target.value)}><option value="">All venues</option>{Array.from(new Set(project.systems.flatMap((s:any)=>(s.devices||[]).map((d:any)=>d.venue)).filter(Boolean))).map((v:any)=><option key={v}>{v}</option>)}</select><select aria-label="Cyber scope" value={cyber} onChange={e=>setCyber(e.target.value)}><option value="">All Cyber statuses</option>{['Unknown','Approved','Review','Blocked','N/A'].map(v=><option key={v}>{v}</option>)}</select></div><div className="nb-toolbar nb-report-primary-tools"><B onClick={()=>download('NBDT-filtered-readiness.csv',csv([visibleColumns,...systems.map((s:any)=>{const c=counts(s);const row:any={System:s.name,Qty:c.total,Base:c.base,Ready:c.ready,Deployed:c.deployed,Cyber:s.cyberStatus||'Unknown',Owner:project.members.find((m:any)=>m.id===s.assigneeId)?.name||'Unassigned'};return visibleColumns.map(k=>row[k]);})]),'text/csv;charset=utf-8')}>Export filtered report</B><details><summary>Columns</summary>{allColumns.filter(c=>c!=='System').map(c=><label key={c}><input type="checkbox" checked={!hidden.includes(c)} onChange={e=>setHidden(e.target.checked?hidden.filter(x=>x!==c):[...hidden,c])}/>{c}</label>)}</details><label>Sort<select value={sort} onChange={e=>setSort(e.target.value)}><option value="name">System name</option><option value="deployed">Deployed count</option></select></label></div><p className="nb-muted">One row per system. Counts use each device run and its pinned guide version. Cyber is manually recorded, not a live integration.</p><div className="nb-report-table"><table><thead><tr>{allColumns.map(v=><th hidden={hidden.includes(v)} key={v}>{v}</th>)}</tr></thead><tbody>{visibleRows.map((s:any)=>{const c=counts(s);return <tr key={s.id}><td><span className="nb-system-name">{s.name}</span><small>{[s.deviceType||s.deviceCategory,s.os].filter(Boolean).join(' · ')||'Device profile to confirm'}</small></td><td hidden={hidden.includes('Qty')}>{c.total||'—'}</td><td hidden={hidden.includes('Base')}>{progress(c.base,c.total)}</td><td hidden={hidden.includes('Ready')}>{progress(c.ready,c.total)}</td><td hidden={hidden.includes('Deployed')}>{progress(c.deployed,c.total)}</td><td hidden={hidden.includes('Cyber')}>{isAdmin&&editCyber?<select disabled={cyberSaving} aria-label={'Cyber status for '+s.name} value={s.cyberStatus||'Unknown'} onChange={async e=>{const value=e.target.value;const reason=prompt('Reason / evidence reference for this local Cyber record');if(!reason?.trim())return;setCyberSaving(true);setSaveMessage('Saving Cyber status…');try{await onSystemChange({...project.systems.find((original:any)=>original.id===s.id),cyberStatus:value,cyberHistory:[...(s.cyberHistory||[]),{status:value,reason,actor:'local-demo',at:new Date().toISOString()}]});setSaveMessage('Cyber record saved locally. Not a corporate approval.');}catch(error:any){setSaveMessage('Save failed: '+error.message);}finally{setCyberSaving(false);}}}>{['Unknown','Approved','Review','Blocked','N/A'].map(v=><option key={v}>{v}</option>)}</select>:<Badge value={s.cyberStatus||'Unknown'}/>}</td><td hidden={hidden.includes('Owner')}>{project.members.find((m:any)=>m.id===s.assigneeId)?.name||'Unassigned'}</td></tr>})}</tbody></table></div><div className="nb-toolbar"><B disabled={page===0} onClick={()=>setPage(page-1)}>Previous</B><span>{Math.min(page,maxPage)+1} / {maxPage+1} · {systems.length} systems</span><B disabled={page>=maxPage} onClick={()=>setPage(page+1)}>Next</B></div><details className="nb-panel"><summary>Legacy report · preserved separately · {project.configReportRows?.length||0} rows</summary><p>These source aggregates are not mapped to device IDs and are excluded from readiness KPIs.</p><div className="nb-report-table"><table><thead><tr>{['System','Venue','Device','Legacy quantity','Legacy Base','Legacy Ready','Cyber'].map(v=><th key={v}>{v}</th>)}</tr></thead><tbody>{(project.configReportRows||[]).map((r:any)=><tr key={r.id}><td>{r.system}</td><td>{r.venue}</td><td>{r.device}</td><td>{r.qti}</td><td>{r.bcDone}</td><td>{r.rdDone}</td><td>{r.cyber}</td></tr>)}</tbody></table></div></details></section>;
}
export function Overview({project,onNavigate}:any){return <section className="nb-overview"><header className="nb-page-header"><div><h1>{project.name}</h1><p>NBDT · Deployment workspace</p></div></header><div className="nb-kpis">{[['Systems',project.systems.length,'systems'],['Tasks',project.tasks.filter((t:any)=>!t.isMilestone).length,'roadmap'],['Open issues',project.issues.filter((i:any)=>i.status!=='Resolved').length,'issues'],['Registered devices',project.systems.reduce((n:number,s:any)=>n+(s.devices||[]).length,0),'config-report']].map(([label,n,tab])=><button className="nb-kpi" key={label} onClick={()=>onNavigate(tab)}><div><h3>{label}</h3><strong>{n}</strong></div></button>)}</div><p className="nb-notice">Local preview. Existing seed records are retained from the supplied project; they are not a live deployment status.</p></section>;}
