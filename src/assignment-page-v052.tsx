import React,{useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {DndContext,PointerSensor,KeyboardSensor,useDraggable,useDroppable,useSensor,useSensors,DragOverlay} from '@dnd-kit/core';
import {Pencil,Plus,Check,X,Search,Users,ClipboardList,ArrowRightLeft,GripVertical,LockKeyhole,Download} from 'lucide-react';
import {assignmentRows,addAssignment,editAssignment,removeAssignment,moveAssignment,resolveAssignmentOwner} from './assignment-roster.mjs';

const PALETTE=['blue','violet','teal','orange','purple','blue','mint','amber','pink','lavender','sky','cyan','rose'];
const prettyDate=(date:string)=>new Date(date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});

function AssignmentCell({item,person,position,isAdmin,busy,onEdit,onAdd}:any){
 const targetId=`slot:${person.id}:${position}`;
 const {setNodeRef:isDropRef,isOver}=useDroppable({id:targetId,disabled:!isAdmin});
 const {attributes,listeners,setNodeRef:isDragRef,isDragging}=useDraggable({id:`item:${item?.id||targetId}`,disabled:!isAdmin||!item||busy});
 return <td className={'nb52-cell '+(isOver?'nb52-cell-drop':'')+(isDragging?' nb52-cell-dragging':'')} ref={isDropRef} data-owner={person.name}>
  {item?<div className="nb52-assignment-item" ref={isDragRef} title={`${item.name}\nOwner: ${person.name}`}>
   {isAdmin&&<button type="button" className="nb52-drag-handle" {...listeners} {...attributes} aria-label={`Move ${item.name} from ${person.name}`} title="Drag to another owner"><GripVertical size={12}/></button>}
   <span className="nb52-assignment-name">{item.name}</span>
   {isAdmin&&<button className="nb52-pencil" type="button" aria-label={`Edit ${item.name}`} title={`Edit assignment for ${person.name}`} disabled={busy} onClick={()=>onEdit(item)}><Pencil size={12}/></button>}
  </div>:isAdmin?<button className="nb52-add-in-cell" type="button" aria-label={`Add system to ${person.name}`} title={`Add system for ${person.name}`} onClick={()=>onAdd(person)}><Plus size={13}/></button>:<span className="nb52-empty">—</span>}
 </td>;
}

export function AssignmentPage({roster,isAdmin,onChange,onAuth}:any){
 const [query,setQuery]=useState('');
 const [position,setPosition]=useState('');
 const [editor,setEditor]=useState<any>(null);
 const [draft,setDraft]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [dragging,setDragging]=useState<any>(null);
 const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}),useSensor(KeyboardSensor));
 const people=useMemo(()=>roster.people.filter((person:any)=>!position||person.position===position).filter((person:any)=>{
  const search=query.trim().toLowerCase();return !search||person.name.toLowerCase().includes(search)||roster.items.some((item:any)=>item.personId===person.id&&item.name.toLowerCase().includes(search));
 }),[roster,query,position]);
 const itemsByPerson=useMemo(()=>Object.fromEntries(roster.people.map((p:any)=>[p.id,roster.items.filter((i:any)=>i.personId===p.id).sort((a:any,b:any)=>a.order-b.order)])),[roster]);
 const rowCount=Math.max(13,...people.map((p:any)=>itemsByPerson[p.id]?.length||0));
 const beginEdit=(item:any)=>{if(!isAdmin)return;setEditor({id:item.id,personId:item.personId,original:item.name});setDraft(item.name);setError('');};
 const beginAdd=(person:any)=>{if(!isAdmin)return;setEditor({personId:person.id,creating:true});setDraft('');setError('');};
 const save=async()=>{if(!isAdmin||busy)return;const clean=draft.trim();if(!clean){setError('Enter a system name. Use Remove to delete an existing assignment.');return;}setBusy(true);setError('');try{
  await onChange((current:any)=>editor.creating?addAssignment(current,editor.personId,clean):editAssignment(current,editor.id,clean));setEditor(null);
 }catch(e:any){setError(e?.message||'Could not save.');}finally{setBusy(false);}};
 const remove=async()=>{if(!isAdmin||!editor?.id||busy)return;if(!window.confirm(`Remove “${editor.original}” from Assignment?`))return;setBusy(true);try{await onChange((current:any)=>removeAssignment(current,editor.id));setEditor(null);}catch(e:any){setError(e?.message||'Could not remove.');}finally{setBusy(false);}};
 const move=async(evt:any)=>{const sourceId=String(evt.active.id||'');const destinationId=String(evt.over?.id||'');setDragging(null);
  if(!isAdmin||busy||!sourceId.startsWith('item:')||!destinationId.startsWith('slot:'))return;
  const [,personId,index]=destinationId.split(':');const id=sourceId.slice(5);const current=roster.items.find((i:any)=>i.id===id);
  if(!current||!roster.people.some((p:any)=>p.id===personId)||current.personId===personId&&current.order===Number(index))return;
  setBusy(true);try{await onChange((state:any)=>moveAssignment(state,id,personId,Number(index)));}catch(e:any){setError(e?.message||'Could not move assignment.');setEditor({moveError:true});}finally{setBusy(false);}
 };
 const exportRoster=()=>{
  const cells=(person:any)=>roster.items.filter((item:any)=>item.personId===person.id).sort((a:any,b:any)=>a.order-b.order);
  const rows=[['NAME',...roster.people.map((p:any)=>p.name)],['POSITION',...roster.people.map((p:any)=>p.position)],['START DATE',...roster.people.map((p:any)=>p.startDate)],
   ...Array.from({length:assignmentRows(roster)},(_,i)=>['Project '+i,...roster.people.map((p:any)=>cells(p)[i]?.name||'')])];
  const escapeCsv=(v:any)=>{let value=String(v??'');if(/^[=+@\-\t\r]/.test(value))value="'"+value;return '"'+value.replaceAll('"','""')+'"';};
  const blob=new Blob(['\ufeff'+rows.map(row=>row.map(escapeCsv).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='NBDT_Assignments.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const dragged=dragging?roster.items.find((i:any)=>i.id===dragging):null;
 const seen=new Set<string>();const sharedNames=new Set<string>();roster.items.forEach((i:any)=>{const key=i.name.trim().toLowerCase();if(seen.has(key))sharedNames.add(key);seen.add(key);});
 return <section className="nb52-page" aria-label="Assignment">
  <header className="nb52-header nb45-primary-header"><div><h1>Assignment</h1><p>System ownership · Team responsibilities</p></div><div className="nb52-kpis"><span><Users size={17}/>{roster.people.length} people</span><span><ClipboardList size={17}/>{roster.items.length} assignments</span></div></header>
  <div className="nb52-toolbar"><label className="nb52-search"><Search size={17}/><input type="search" placeholder="Search people or assigned systems..." value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search assignments"/></label><label className="nb52-select">Position<select aria-label="Position filter" value={position} onChange={e=>setPosition(e.target.value)}><option value="">All positions</option><option value="ITO">ITO</option><option value="ITSS">ITSS</option></select></label><button type="button" className="nb52-export" onClick={exportRoster}><Download size={15}/> Export CSV</button><span className="nb52-toolbar-tip"><ArrowRightLeft size={15}/>{isAdmin?'Drag a system to change its owner':'System owners are managed here'}</span></div>
  <div className="nb52-matrix-frame">
   <div className="nb52-grid-scroll" role="region" aria-label="Assignment matrix — scroll to explore all team members" tabIndex={0}>
    <DndContext sensors={sensors} onDragStart={event=>setDragging(String(event.active.id).slice(5))} onDragCancel={()=>setDragging(null)} onDragEnd={move}>
     <table className="nb52-table"><thead><tr><th className="nb52-project-th" scope="col"><div className="nb52-project-heading">Project <small>Assigned systems</small></div></th>{people.map((p:any)=>{const idx=roster.people.findIndex((x:any)=>x.id===p.id);return <th key={p.id} scope="col" className={'nb52-person nb52-person-'+PALETTE[idx%PALETTE.length]}><div className="nb52-avatar">{p.name[0]}</div><strong title={p.name}>{p.name}</strong><span className="nb52-position">{p.position}</span><small>{prettyDate(p.startDate)}</small>{isAdmin&&<button type="button" className="nb52-column-plus" aria-label={`Add system to ${p.name}`} title={`Add system to ${p.name}`} onClick={()=>beginAdd(p)}><Plus size={12}/></button>}</th>;})}</tr></thead><tbody>{Array.from({length:rowCount},(_,row)=><tr key={row}><th scope="row" className="nb52-project-row">Project {row}</th>{people.map((p:any)=><AssignmentCell key={p.id+':'+row} person={p} item={itemsByPerson[p.id]?.[row]} isAdmin={isAdmin} busy={busy} position={row} onEdit={beginEdit} onAdd={beginAdd}/>)}</tr>)}</tbody></table>
     {createPortal(<DragOverlay>{dragged?<div className="nb52-drag-preview">{dragged.name}</div>:null}</DragOverlay>,document.body)}
    </DndContext>
   </div>
  </div>
  <div className="nb52-footer"><span>Exact system-name match controls Owner across NBDT. No partial matching.</span><span>{sharedNames.size?`${sharedNames.size} repeated titles may have shared ownership`:''}</span>{!isAdmin&&<button type="button" onClick={onAuth}><LockKeyhole size={14}/> Sign in to edit</button>}</div>
  {editor&&<div className="nb52-modal-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setEditor(null);}}><form className="nb52-editor" role="dialog" aria-modal="true" aria-label="Assignment editor" onSubmit={e=>{e.preventDefault();void save();}}><header><span className="nb52-editor-icon"><Pencil size={18}/></span><button type="button" aria-label="Close editor" onClick={()=>setEditor(null)} disabled={busy}><X size={17}/></button></header><h2>{editor.creating?'Add assigned system':'Edit assigned system'}</h2><p>Owner: <strong>{roster.people.find((p:any)=>p.id===editor.personId)?.name}</strong></p><label>System name<input aria-label="Assigned system name" autoFocus maxLength={180} value={draft} onChange={e=>setDraft(e.target.value)} required/></label>{error&&<p role="alert" className="nb52-error">{error}</p>}<div className="nb52-editor-actions">{!editor.creating&&<button type="button" className="nb52-remove" disabled={busy} onClick={remove}>Remove</button>}<button type="button" disabled={busy} onClick={()=>setEditor(null)}>Cancel</button><button type="submit" disabled={busy||!draft.trim()} className="nb52-save"><Check size={15}/>{busy?'Saving…':'Save'}</button></div></form></div>}
 </section>;
}
