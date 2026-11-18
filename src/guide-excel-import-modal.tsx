import React,{useEffect,useState} from 'react';
import {ClipboardPaste,X,Check,FileSpreadsheet} from 'lucide-react';
import {parseGuideExcel,GUIDE_FIELD_GROUPS,GUIDE_STAGE_LABELS} from './guide-excel-import.mjs';

/** POC import for one system. Read-only preview; applying is one existing system save. */
export function GuideExcelImportModal({onClose,onApply,busy}:{
 onClose:()=>void,onApply:(data:any)=>Promise<boolean>,busy:boolean,
}){
 const [raw,setRaw]=useState('');
 const [data,setData]=useState<any>(null);
 const [error,setError]=useState('');
 const [working,setWorking]=useState(false);
 useEffect(()=>{
  const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!working&&!busy)onClose();};
  document.addEventListener('keydown',onKey);
  return ()=>document.removeEventListener('keydown',onKey);
 },[onClose,working,busy]);
 const preview=(text:string,html='')=>{
  setRaw(text);setError('');setData(null);
  try{setData(parseGuideExcel({text,html}));}
  catch(err:any){setError(err.message||'Could not read the copied fields.');}
 };
 const save=async()=>{
  if(!data||working||busy)return;
  setWorking(true);setError('');
  try{const ok=await onApply(data);if(!ok)setError('Could not save the imported configuration. Please check the error on the Guide page.');}
  catch(err:any){setError(err.message||'Import failed.');}
  finally{setWorking(false);}
 };
 const groups=GUIDE_FIELD_GROUPS.map(([group,fields]:any)=>({
  group,fields:fields.filter(([key]:any)=>data?.fields?.[key]!=null),
 })).filter(group=>group.fields.length);
 const steps=Object.entries(data?.stages||{});
 return <div className="nb75-overlay" role="presentation">
  <section className="nb75-modal" role="dialog" aria-modal="true" aria-labelledby="nb75-title">
   <header className="nb75-modal-header">
    <span className="nb75-modal-icon" aria-hidden="true"><FileSpreadsheet size={19}/></span>
    <div><h2 id="nb75-title">Import configuration from Excel</h2><p>Paste configuration fields and checklist steps for this system. Lessons Learned are imported separately.</p></div>
    <button type="button" className="nb75-close" aria-label="Close configuration import" disabled={busy||working} onClick={onClose}><X size={18}/></button>
   </header>
   <div className="nb75-modal-content">
    <label className="nb75-paste-label" htmlFor="nb75-excel-paste"><ClipboardPaste size={17}/> Paste copied Excel cells</label>
    <textarea id="nb75-excel-paste" value={raw} rows={6} autoFocus spellCheck={false}
     placeholder="Select the system configuration area in Excel, copy (Ctrl+C), then paste here (Ctrl+V)."
     onPaste={e=>{const clipboard=e.clipboardData;const html=clipboard?.getData('text/html')||'';const text=clipboard?.getData('text/plain')||'';
      if(text||html){e.preventDefault();preview(text,html);}}}
     onChange={e=>{setRaw(e.target.value);setData(null);setError('');}}/>
    <div className="nb75-paste-tools"><span>System, Device, Network, Access, Applications and the three checklist stages.</span><button type="button" disabled={!raw.trim()} onClick={()=>preview(raw)}>Preview import</button></div>
    {error&&<p role="alert" className="nb75-error">{error}</p>}
    {data&&<div className="nb75-preview" aria-label="Excel import preview">
     <div className="nb75-preview-title"><Check size={16}/><strong>Recognized data</strong><span>{groups.reduce((n,g)=>n+g.fields.length,0)} fields · {steps.reduce((n,[,v]:any)=>n+v.length,0)} checklist steps</span></div>
     <div className="nb75-preview-groups">{groups.map(({group,fields})=><section key={group} className="nb75-preview-group"><h3>{group}</h3><dl>{fields.map(([key,label]:any)=><React.Fragment key={key}><dt>{label}</dt><dd>{data.fields[key]}</dd></React.Fragment>)}</dl></section>)}</div>
     {steps.length>0&&<div className="nb75-preview-checklists">{steps.map(([stage,items]:any)=><section key={stage}><h3>{GUIDE_STAGE_LABELS[stage]||stage} <small>({items.length})</small></h3><ul>{items.map((label:string,i:number)=><li key={i}>{label}</li>)}</ul></section>)}</div>}
     {data.unrecognized?.length>0&&<details className="nb75-unmatched"><summary>{data.unrecognized.length} unrecognized line(s) — not imported</summary><ul>{data.unrecognized.map((line:string,index:number)=><li key={index}>{line}</li>)}</ul></details>}
     <p className="nb75-preview-hint">Only recognized fields will be updated. Imported checklist sections replace the corresponding step lists. Existing completion checks are not marked automatically; lessons and other data stay unchanged.</p>
    </div>}
   </div>
   <footer className="nb75-modal-footer">
    <button type="button" className="nb75-cancel" onClick={onClose} disabled={busy||working}>Cancel</button>
    <button type="button" className="nb75-apply" disabled={!data||busy||working} onClick={save}>{busy||working?'Saving…':'Apply import'}</button>
   </footer>
  </section>
 </div>;
}
