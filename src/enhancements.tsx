import React,{useState,useEffect,useRef} from 'react';
import {Guide,SystemEditor} from './workspace';
import {uid,counts} from './model.mjs';
import {profiles,profileView,mergeProfile,migrateRun,validateTask,effectiveStatus,validateImport,csv} from './extended-model.mjs';
import {importLegacyStorage,auditLog} from './demo-store.mjs';
import {projectWeekDate,weekIndexFromDate,validDate} from './schedule.mjs';
import {isoWeek} from './extended-model.mjs';
export const Button=({children,...props}:any)=><button type="button" className="nb-button" {...props}>{children}</button>;
export function download(name:string,content:string,type='application/json'){const u=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
export function useUnsaved(dirty:boolean){useEffect(()=>{if(dirty)document.documentElement.dataset.nbdtDirty='true';else delete document.documentElement.dataset.nbdtDirty;const f=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',f);return()=>{delete document.documentElement.dataset.nbdtDirty;window.removeEventListener('beforeunload',f);};},[dirty]);}
export function ProfileGuide(props:any){
 const {sys,initialRoute,onUpdateSystem,onNavigationChange}=props;
 // A deep link may still point to an existing endpoint profile. Do not erase
 // endpoint profiles or their runs when hiding the management toolbar.
 const profileId=profiles(sys).some((p:any)=>p.id===initialRoute?.profileId)?initialRoute.profileId:sys.id;
 const current=profileView(sys,profileId);
 return <section className="nb-profile-guide nb-profile-guide--focused">
  <Guide {...props} key={profileId} sys={current}
   initialDeviceId={profileId===initialRoute?.profileId?initialRoute?.deviceId:null}
   initialStage={profileId===initialRoute?.profileId?initialRoute?.stage:null}
   onNavigationChange={(selection:any)=>onNavigationChange?.({profileId,...selection})}
   onUpdateSystem={(next:any)=>onUpdateSystem(mergeProfile(sys,next))}/>
 </section>;
}
export function Migration({sys,run,onSave}:any){const [reason,setReason]=useState(''),[error,setError]=useState('');if(!run||!sys.publishedGuide||run.guideVersion===sys.publishedGuide.version||run.accepted?.deployment)return null;return <details className="nb-panel"><summary>New guide available · review migration</summary><p>v{run.guideVersion} → v{sys.publishedGuide.version}. All checks and acceptance in the new run start pending. The previous run is preserved as superseded.</p><label>Reason<input value={reason} onChange={e=>setReason(e.target.value)}/></label><Button onClick={async()=>{try{const next=migrateRun(run,sys.publishedGuide,reason);if(!confirm('Create a new run and require rechecking every stage?'))return;await onSave({...sys,deviceRuns:[...(sys.deviceRuns||[]).map((r:any)=>r.id===run.id?{...r,archived:true}:r),next]});}catch(e:any){setError(e.message);}}}>Migrate unfinished run</Button><p role="alert">{error}</p></details>;}
export function DataTools({project,isAdmin,onApply}:any){const [status,setStatus]=useState(''),[preview,setPreview]=useState<any>(null),[errors,setErrors]=useState<string[]>([]),[busy,setBusy]=useState(false);return <details className="nb-panel nb-data-tools"><summary>Demo data, backup & audit</summary><p>Single-browser IndexedDB demo. No corporate authentication or shared server is connected.</p><div className="nb-toolbar"><Button onClick={()=>download('NBDT-project-backup.json',JSON.stringify(project,null,2))}>Export project backup</Button><Button onClick={async()=>{try{download('NBDT-demo-audit.json',JSON.stringify(await auditLog(),null,2));}catch(e:any){setStatus(e.message);}}}>Export demo audit</Button>{isAdmin&&<><Button onClick={async()=>{if(!confirm('Import old local preview records into IndexedDB? Existing IndexedDB records are not replaced.'))return;try{const n=await importLegacyStorage();setStatus('Read '+n+' legacy records. Reload to open imported projects.');}catch(e:any){setStatus(e.message);}}}>Import previous local preview</Button><label>Import project JSON (dry run)<input type="file" accept=".json,application/json" onChange={async e=>{const f=e.target.files?.[0];setPreview(null);if(!f)return;if(f.size>10*1024*1024){setErrors(['Maximum file size is 10 MiB']);return;}try{const data=JSON.parse(await f.text());const errors=validateImport(project,data);setErrors(errors);if(!errors.length)setPreview(data);}catch{setErrors(['Invalid JSON file']);}e.target.value='';}}/></label></>}</div>{preview&&<div className="nb-notice"><p>Validated import: {preview.systems.length} systems, {preview.tasks.length} tasks, {preview.members.length} members. This replaces this project's data, not its ID. Export a backup first.</p><Button disabled={busy} onClick={async()=>{if(!confirm('Apply the validated replacement?'))return;setBusy(true);try{await onApply({...preview,id:project.id,name:project.name,version:project.version});setPreview(null);setStatus('Import applied');}catch(e:any){setStatus(e.message);}finally{setBusy(false);}}}>Apply validated import</Button><Button onClick={()=>setPreview(null)}>Cancel import</Button></div>}{errors.length>0&&<p role="alert">{errors.join('; ')}</p>}<p role="status">{status}</p></details>;}
// Storage is silent during normal operation; only actual persistence errors appear
// as an overlay so no global status strip takes up space on any workspace screen.
export function StoreStatus(){
 const [error,setError]=useState('');
 useEffect(()=>{
  const onStore=(event:any)=>{
   if(event.detail?.state==='error')setError(String(event.detail.message||'Unable to save changes'));
   else if(event.detail?.state==='saved')setError('');
  };
  window.addEventListener('nbdt-store',onStore);
  return()=>window.removeEventListener('nbdt-store',onStore);
 },[]);
 if(!error)return null;
 return <div className="nb-store-error-toast" role="alert">
  <strong>Storage error</strong>
  <span>{error}</span>
  <Button onClick={()=>setError('')}>Dismiss</Button>
  <Button onClick={()=>{if(confirm('Export any unsaved draft before reloading. Reload now?'))location.reload();}}>Reload latest</Button>
 </div>;
}
