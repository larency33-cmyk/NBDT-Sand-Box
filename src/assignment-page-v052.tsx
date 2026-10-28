import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {DndContext,PointerSensor,KeyboardSensor,useDraggable,useDroppable,useSensor,useSensors,DragOverlay,pointerWithin,rectIntersection} from '@dnd-kit/core';
import {Pencil,Plus,Check,X,Search,Users,ClipboardList,ArrowRightLeft,GripVertical,LockKeyhole,Download,UserRoundPlus,MoveRight} from 'lucide-react';
import {assignmentRows,addAssignment,editAssignment,removeAssignment,moveAssignment,addAssignmentPerson,editAssignmentPerson,swapAssignmentPeople} from './assignment-roster.mjs';

const PALETTE=['blue','violet','teal','orange','purple','blue','mint','amber','pink','lavender','sky','cyan','rose'];
const prettyDate=(date:string)=>new Date(date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
const createEmptyPerson=()=>({name:'',position:'ITO',startDate:''});

function AssignmentCell({item,person,position,isAdmin,busy,onEdit,onAdd,dropOwner,justMoved,draggingPersonId,columnTarget,justSwappedColumns}:any){
 const targetId=`slot:${person.id}:${position}`;
 const {setNodeRef:isDropRef,isOver}=useDroppable({id:targetId,disabled:!isAdmin});
 const {attributes,listeners,setNodeRef:isDragRef,isDragging}=useDraggable({id:`item:${item?.id||targetId}`,disabled:!isAdmin||!item||busy});
 return <td className={'nb52-cell '+(isOver?'nb52-cell-drop ':'')+(isDragging?'nb52-cell-dragging ':'')+(dropOwner===person.id?'nb54-target-column ':'')+(justMoved===item?.id?'nb54-landed ':'')+(draggingPersonId===person.id?'nb56-column-source ':'')+(columnTarget===person.id?'nb56-column-destination ':'')+(justSwappedColumns?.includes(person.id)?'nb56-column-landed ':'')} ref={isDropRef} data-owner={person.name}>
  {item?<div className="nb52-assignment-item" ref={isDragRef} title={`${item.name}\nOwner: ${person.name}`}>
   {isAdmin&&<button type="button" className="nb52-drag-handle" {...listeners} {...attributes} aria-label={`Move ${item.name} from ${person.name}`} title="Drag to another owner"><GripVertical size={14}/></button>}
   <span className="nb52-assignment-name">{item.name}</span>
   {isAdmin&&<button className="nb52-pencil" type="button" aria-label={`Edit ${item.name}`} title={`Edit assignment for ${person.name}`} disabled={busy} onClick={()=>onEdit(item)}><Pencil size={12}/></button>}
  </div>:isAdmin?<button className="nb52-add-in-cell" type="button" aria-label={`Add system to ${person.name}`} title={`Add system for ${person.name}`} onClick={()=>onAdd(person)}><Plus size={13}/></button>:<span className="nb52-empty">—</span>}
 </td>;
}
function PersonColumnHeader({person,index,isAdmin,busy,onAdd,onEdit,dropOwner,draggingPersonId,columnTarget,justSwappedColumns}:any){
 const {setNodeRef:setItemTarget,isOver:itemIsOver}=useDroppable({id:`slot:${person.id}:head`,disabled:!isAdmin});
 const {setNodeRef:setPersonTarget,isOver:personIsOver}=useDroppable({id:`person-target:${person.id}`,disabled:!isAdmin||busy});
 const {attributes,listeners,setNodeRef:setPersonDrag,isDragging}=useDraggable({id:`person:${person.id}`,disabled:!isAdmin||busy});
 const attachColumn=(element:HTMLElement|null)=>{setPersonTarget(element);setPersonDrag(element);};
 const source=isDragging||draggingPersonId===person.id;
 const destination=(personIsOver||columnTarget===person.id)&&!!draggingPersonId&&!source;
 return <th ref={attachColumn} scope="col" data-person-id={person.id} className={`nb52-person nb52-person-${PALETTE[index%PALETTE.length]} ${(dropOwner===person.id||itemIsOver)?'nb54-person-target':''} ${source?'nb56-column-source':''} ${destination?'nb56-column-destination':''} ${justSwappedColumns?.includes(person.id)?'nb56-column-landed':''}`}>
  <div ref={setItemTarget} className="nb56-header-inner">
   <div className="nb52-avatar" aria-hidden="true">{person.name[0]}</div>
   <strong title={person.name}>{person.name}</strong><span className="nb52-position">{person.position}</span><small>{prettyDate(person.startDate)}</small>
  </div>
  {isAdmin&&<div className="nb54-person-actions">
   <button type="button" className="nb54-person-edit" aria-label={`Edit team member ${person.name}`} title={`Edit name, position and date for ${person.name}`} onClick={()=>onEdit(person)}><Pencil size={12}/></button>
   <button type="button" className="nb52-column-plus" aria-label={`Add system to ${person.name}`} title={`Add system to ${person.name}`} onClick={()=>onAdd(person)}><Plus size={12}/></button>
  </div>}
  {isAdmin&&<button type="button" className="nb56-column-grip" {...attributes} {...listeners} disabled={busy} aria-label={`Move entire column for ${person.name}`} title={`Drag ${person.name}'s column onto another employee to swap columns`}><GripVertical size={15}/><span>Move column</span></button>}
 </th>;
}

export function AssignmentPage({roster,isAdmin,onChange,onAuth}:any){
 const [query,setQuery]=useState('');
 const [editor,setEditor]=useState<any>(null);
 const [personEditor,setPersonEditor]=useState<any>(null);
 const [personDraft,setPersonDraft]=useState(createEmptyPerson);
 const [draft,setDraft]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [dragging,setDragging]=useState<any>(null);
 const [dropTarget,setDropTarget]=useState<any>(null);
 const [justMoved,setJustMoved]=useState<any>(null);
 const [draggingPersonId,setDraggingPersonId]=useState<string|null>(null);
 const [columnTarget,setColumnTarget]=useState<string|null>(null);
 const [justSwappedColumns,setJustSwappedColumns]=useState<string[]>([]);
 const gridRef=useRef<HTMLDivElement>(null);
 const railRef=useRef<HTMLDivElement>(null);
 const [scrollbar,setScrollbar]=useState({visible:false,width:100,left:0,value:0});
 const people=useMemo(()=>roster.people.filter((person:any)=>{
  const search=query.trim().toLowerCase();return !search||person.name.toLowerCase().includes(search)||roster.items.some((item:any)=>item.personId===person.id&&item.name.toLowerCase().includes(search));
 }),[roster,query]);
 const itemsByPerson=useMemo(()=>Object.fromEntries(roster.people.map((p:any)=>[p.id,roster.items.filter((i:any)=>i.personId===p.id).sort((a:any,b:any)=>a.order-b.order)])),[roster]);
 const rowCount=Math.max(13,...people.map((p:any)=>itemsByPerson[p.id]?.length||0));
 const syncScrollbar=()=>{
  const el=gridRef.current;if(!el)return;
  const total=el.scrollWidth,viewport=el.clientWidth,max=Math.max(0,total-viewport);
  const width=max?Math.max(7,viewport/total*100):100;
  const value=max?el.scrollLeft/max:0;
  setScrollbar({visible:max>2,width,left:value*(100-width),value:Math.round(value*100)});
 };
 useEffect(()=>{
  const el=gridRef.current;if(!el)return;
  const sync=()=>syncScrollbar();sync();
  el.addEventListener('scroll',sync,{passive:true});
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(sync):null;
  observer?.observe(el);if(el.firstElementChild)observer?.observe(el.firstElementChild);
  window.addEventListener('resize',sync);
  return ()=>{el.removeEventListener('scroll',sync);window.removeEventListener('resize',sync);observer?.disconnect();};
 },[roster.people.length,people.length,rowCount]);
 const scrollToPointer=(clientX:number)=>{
  const rail=railRef.current,grid=gridRef.current;if(!rail||!grid)return;
  const rect=rail.getBoundingClientRect();if(!rect.width)return;
  const thumbWidth=rect.width*(scrollbar.width/100);
  const proportion=Math.max(0,Math.min(1,(clientX-rect.left-thumbWidth/2)/Math.max(1,rect.width-thumbWidth)));
  grid.scrollLeft=proportion*Math.max(0,grid.scrollWidth-grid.clientWidth);
 };
 const onRailPointerDown=(e:React.PointerEvent<HTMLDivElement>)=>{
  if(!scrollbar.visible)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);scrollToPointer(e.clientX);
 };
 const onRailKeyDown=(e:React.KeyboardEvent<HTMLDivElement>)=>{
  const el=gridRef.current;if(!el)return;
  const steps:Record<string,number>={ArrowLeft:-120,ArrowRight:120,PageUp:-el.clientWidth*.8,PageDown:el.clientWidth*.8};
  if(e.key==='Home'||e.key==='End'){e.preventDefault();el.scrollLeft=e.key==='Home'?0:el.scrollWidth;}
  else if(steps[e.key]!==undefined){e.preventDefault();el.scrollLeft+=steps[e.key];}
 };
 const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:7}}),useSensor(KeyboardSensor));
 const beginEdit=(item:any)=>{if(!isAdmin)return;setEditor({id:item.id,personId:item.personId,original:item.name});setDraft(item.name);setError('');};
 const beginAdd=(person:any)=>{if(!isAdmin)return;setEditor({personId:person.id,creating:true});setDraft('');setError('');};
 const beginPersonEdit=(person:any)=>{if(!isAdmin)return;setPersonEditor({id:person.id});setPersonDraft({name:person.name,position:person.position,startDate:person.startDate});setError('');};
 const beginPersonAdd=()=>{if(!isAdmin)return;setPersonEditor({creating:true});setPersonDraft(createEmptyPerson());setError('');};
 const savePerson=async()=>{if(!isAdmin||busy||!personEditor)return;setBusy(true);setError('');try{
  await onChange((current:any)=>personEditor.creating?addAssignmentPerson(current,personDraft):editAssignmentPerson(current,personEditor.id,personDraft));
  setPersonEditor(null);setQuery('');
 }catch(e:any){setError(e?.message||'Could not save team member.');}finally{setBusy(false);}};
 const save=async()=>{if(!isAdmin||busy)return;const clean=draft.trim();if(!clean){setError('Enter a system name. Use Remove to delete an existing assignment.');return;}setBusy(true);setError('');try{
  await onChange((current:any)=>editor.creating?addAssignment(current,editor.personId,clean):editAssignment(current,editor.id,clean));setEditor(null);
 }catch(e:any){setError(e?.message||'Could not save.');}finally{setBusy(false);}};
 const remove=async()=>{if(!isAdmin||!editor?.id||busy)return;if(!window.confirm(`Remove “${editor.original}” from Assignment?`))return;setBusy(true);try{await onChange((current:any)=>removeAssignment(current,editor.id));setEditor(null);}catch(e:any){setError(e?.message||'Could not remove.');}finally{setBusy(false);}};
 const move=async(evt:any)=>{
  const sourceId=String(evt.active.id||'');const destinationId=String(evt.over?.id||'');setDragging(null);setDropTarget(null);
  if(!isAdmin||busy||!sourceId.startsWith('item:')||!destinationId.startsWith('slot:'))return;
  const [,personId,index]=destinationId.split(':');const id=sourceId.slice(5);const current=roster.items.find((i:any)=>i.id===id);
  if(!current||!roster.people.some((p:any)=>p.id===personId)||current.personId===personId&&current.order===(index==='head'?0:Number(index)))return;
  setBusy(true);try{
   await onChange((state:any)=>moveAssignment(state,id,personId,index==='head'?0:Number(index)));setJustMoved(id);
   window.setTimeout(()=>setJustMoved((previous:any)=>previous===id?null:previous),850);
  }catch(e:any){setError(e?.message||'Could not move assignment.');setEditor({moveError:true});}finally{setBusy(false);}
 };
 const swapColumns=async(event:any)=>{
  const source=String(event.active?.id||'').slice('person:'.length);
  const target=String(event.over?.id||'').slice('person-target:'.length);
  if(!isAdmin||busy||!String(event.active?.id||'').startsWith('person:')||!String(event.over?.id||'').startsWith('person-target:')||source===target)return;
  if(!roster.people.some((person:any)=>person.id===source)||!roster.people.some((person:any)=>person.id===target))return;
  setBusy(true);setError('');
  try{
   await onChange((current:any)=>swapAssignmentPeople(current,source,target));
   setJustSwappedColumns([source,target]);
   window.setTimeout(()=>setJustSwappedColumns([]),900);
  }catch(e:any){setError(e?.message||'Could not reorder columns.');setEditor({moveError:true});}
  finally{setBusy(false);}
 };
 const onDragFinished=(event:any)=>{
  const isPerson=String(event.active?.id||'').startsWith('person:');
  setDragging(null);setDropTarget(null);setDraggingPersonId(null);setColumnTarget(null);
  if(isPerson){void swapColumns(event);return;}
  void move(event);
 };
 const onDraggingStarted=(event:any)=>{
  const id=String(event.active?.id||'');
  if(id.startsWith('person:')){setDraggingPersonId(id.slice(7));setColumnTarget(null);setDragging(null);setDropTarget(null);}
  else if(id.startsWith('item:')){setDragging(id.slice(5));setDropTarget(null);setDraggingPersonId(null);setColumnTarget(null);}
 };
 const onDraggingOver=(event:any)=>{
  const id=String(event.over?.id||'');
  if(String(event.active?.id||'').startsWith('person:'))setColumnTarget(id.startsWith('person-target:')?id.slice(14):null);
  else setDropTarget(id.startsWith('slot:')?id.split(':')[1]:null);
 };
 const assignmentCollision=(args:any)=>{
  const prefix=String(args.active?.id||'').startsWith('person:')?'person-target:':'slot:';
  const eligible=args.droppableContainers.filter((container:any)=>String(container.id).startsWith(prefix));
  const scope={...args,droppableContainers:eligible};
  const direct=pointerWithin(scope);
  return direct.length?direct:rectIntersection(scope);
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
 const sourcePerson=dragged?roster.people.find((p:any)=>p.id===dragged.personId):null;
 const dropPerson=dropTarget?roster.people.find((p:any)=>p.id===dropTarget):null;
 const columnPerson=draggingPersonId?roster.people.find((p:any)=>p.id===draggingPersonId):null;
 const columnDestination=columnTarget?roster.people.find((p:any)=>p.id===columnTarget):null;
 const seen=new Set<string>();const sharedNames=new Set<string>();roster.items.forEach((i:any)=>{const key=i.name.trim().toLowerCase();if(seen.has(key))sharedNames.add(key);seen.add(key);});
 return <section className="nb52-page nb54-page" aria-label="Assignment">
  <header className="nb52-header nb45-primary-header"><div><h1>Assignment</h1><p>System ownership · Team responsibilities</p></div><div className="nb52-kpis"><span><Users size={17}/>{roster.people.length} people</span><span><ClipboardList size={17}/>{roster.items.length} assignments</span></div></header>
  <div className="nb52-toolbar"><label className="nb52-search"><Search size={17}/><input type="search" placeholder="Search people or assigned systems..." value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search assignments"/></label><button type="button" className="nb52-export" onClick={exportRoster}><Download size={15}/> Export CSV</button><span className="nb52-toolbar-tip"><ArrowRightLeft size={15}/>{isAdmin?'Drag systems between owners · Drag employee headers to swap columns':'System owners are managed here'}</span></div>
  <div className="nb52-matrix-frame">
   <div ref={gridRef} className="nb52-grid-scroll" role="region" aria-label="Assignment matrix — scroll horizontally to explore all team members" tabIndex={0}>
    <DndContext sensors={sensors} collisionDetection={assignmentCollision} onDragStart={onDraggingStarted} onDragOver={onDraggingOver} onDragCancel={()=>{setDragging(null);setDropTarget(null);setDraggingPersonId(null);setColumnTarget(null);}} onDragEnd={onDragFinished}>
     <table className="nb52-table" style={{'--nb54-rows':rowCount} as React.CSSProperties}><thead><tr><th className="nb52-project-th" scope="col"><div className="nb52-project-heading">Project <small>Assigned systems</small></div></th>{people.map((p:any)=><PersonColumnHeader key={p.id} person={p} index={roster.people.findIndex((x:any)=>x.id===p.id)} isAdmin={isAdmin} busy={busy} onEdit={beginPersonEdit} onAdd={beginAdd} dropOwner={dropTarget} draggingPersonId={draggingPersonId} columnTarget={columnTarget} justSwappedColumns={justSwappedColumns}/>)}{isAdmin&&<th scope="col" className="nb54-new-person"><button type="button" onClick={beginPersonAdd} aria-label="Add new team member"><span className="nb54-new-avatar"><UserRoundPlus size={19}/></span><strong>Add person</strong><small>Name · Position · Start date</small><span className="nb54-new-plus"><Plus size={14}/> New team member</span></button></th>}</tr></thead><tbody>{Array.from({length:rowCount},(_,row)=><tr key={row}><th scope="row" className="nb52-project-row">Project {row}</th>{people.map((p:any)=><AssignmentCell key={p.id+':'+row} person={p} item={itemsByPerson[p.id]?.[row]} isAdmin={isAdmin} busy={busy} position={row} onEdit={beginEdit} onAdd={beginAdd} dropOwner={dropTarget} justMoved={justMoved} draggingPersonId={draggingPersonId} columnTarget={columnTarget} justSwappedColumns={justSwappedColumns}/>)}{isAdmin&&<td className="nb54-new-empty"/>}</tr>)}</tbody></table>
     {createPortal(<DragOverlay dropAnimation={{duration:240,easing:'cubic-bezier(.2,.9,.2,1)'}}>{dragged?<div className="nb52-drag-preview"><GripVertical size={15}/><div><strong>{dragged.name}</strong><span>{sourcePerson?.name||'Current owner'} <MoveRight size={12}/> {dropPerson?.name||'Choose new owner'}</span></div></div>:null}{columnPerson?<div className="nb56-column-preview"><span className="nb56-column-preview-avatar">{columnPerson.name[0]}</span><div><strong>{columnPerson.name}</strong><small>{roster.items.filter((item:any)=>item.personId===columnPerson.id).length} systems · Entire column</small><span><ArrowRightLeft size={13}/> {columnDestination&&columnDestination.id!==columnPerson.id?`Swap with ${columnDestination.name}`:'Drop onto another employee'}</span></div></div>:null}</DragOverlay>,document.body)}
    </DndContext>
   </div>
   <div ref={railRef} className={'nb54-horizontal-rail '+(scrollbar.visible?'is-active':'')} role="scrollbar" tabIndex={scrollbar.visible?0:-1} aria-label="Scroll Assignment columns horizontally" aria-orientation="horizontal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={scrollbar.value} onPointerDown={onRailPointerDown} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))scrollToPointer(e.clientX);}} onKeyDown={onRailKeyDown}>
    <span className="nb54-horizontal-thumb" style={{width:`${scrollbar.width}%`,left:`${scrollbar.left}%`}}/>
   </div>
  </div>
  <div className="nb52-footer"><span>Exact system-name match controls Owner across NBDT. No partial matching.</span><span>{sharedNames.size?`${sharedNames.size} repeated titles may have shared ownership`:''}</span>{!isAdmin&&<button type="button" onClick={onAuth}><LockKeyhole size={14}/> Sign in to edit</button>}</div>
  {editor&&!editor.moveError&&<div className="nb52-modal-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setEditor(null);}}><form className="nb52-editor" role="dialog" aria-modal="true" aria-label="Assignment editor" onSubmit={e=>{e.preventDefault();void save();}}><header><span className="nb52-editor-icon"><Pencil size={18}/></span><button type="button" aria-label="Close editor" onClick={()=>setEditor(null)} disabled={busy}><X size={17}/></button></header><h2>{editor.creating?'Add assigned system':'Edit assigned system'}</h2><p>Owner: <strong>{roster.people.find((p:any)=>p.id===editor.personId)?.name}</strong></p><label>System name<input aria-label="Assigned system name" autoFocus maxLength={180} value={draft} onChange={e=>setDraft(e.target.value)} required/></label>{error&&<p role="alert" className="nb52-error">{error}</p>}<div className="nb52-editor-actions">{!editor.creating&&<button type="button" className="nb52-remove" disabled={busy} onClick={remove}>Remove</button>}<button type="button" disabled={busy} onClick={()=>setEditor(null)}>Cancel</button><button type="submit" disabled={busy||!draft.trim()} className="nb52-save"><Check size={15}/>{busy?'Saving…':'Save'}</button></div></form></div>}
  {personEditor&&<div className="nb52-modal-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setPersonEditor(null);}}><form className="nb52-editor nb54-person-editor" role="dialog" aria-modal="true" aria-label="Team member editor" onSubmit={e=>{e.preventDefault();void savePerson();}}><header><span className="nb52-editor-icon"><Users size={18}/></span><button type="button" aria-label="Close team member editor" onClick={()=>setPersonEditor(null)} disabled={busy}><X size={17}/></button></header><h2>{personEditor.creating?'Add team member':'Edit team member'}</h2><p>{personEditor.creating?'Create a new owner column.':'Updates the name displayed as Owner across NBDT.'}</p><label>Full name<input aria-label="Team member full name" autoFocus maxLength={100} value={personDraft.name} onChange={e=>setPersonDraft((p:any)=>({...p,name:e.target.value}))} required placeholder="Full name"/></label><label>Position<input aria-label="Team member position" maxLength={40} value={personDraft.position} onChange={e=>setPersonDraft((p:any)=>({...p,position:e.target.value}))} required placeholder="ITO or ITSS"/></label><label>Start date<input aria-label="Team member start date" type="date" value={personDraft.startDate} onChange={e=>setPersonDraft((p:any)=>({...p,startDate:e.target.value}))} required/></label>{error&&<p role="alert" className="nb52-error">{error}</p>}<div className="nb52-editor-actions"><button type="button" disabled={busy} onClick={()=>setPersonEditor(null)}>Cancel</button><button type="submit" disabled={busy||!personDraft.name.trim()||!personDraft.position.trim()||!personDraft.startDate} className="nb52-save"><Check size={15}/>{busy?'Saving…':personEditor.creating?'Add person':'Save changes'}</button></div></form></div>}
  {editor?.moveError&&<div className="nb52-modal-overlay"><div className="nb52-editor" role="alertdialog" aria-modal="true"><h2>Unable to move system</h2><p className="nb52-error">{error}</p><div className="nb52-editor-actions"><button className="nb52-save" onClick={()=>setEditor(null)}>Close</button></div></div></div>}
 </section>;
}
