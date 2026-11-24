import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {DndContext,PointerSensor,KeyboardSensor,useDraggable,useDroppable,useSensor,useSensors,DragOverlay,pointerWithin,rectIntersection} from '@dnd-kit/core';
import {Pencil,Plus,Check,X,Search,Users,ClipboardList,ArrowRightLeft,GripVertical,LockKeyhole,UserRoundPlus,MoveRight,ChevronLeft,ChevronRight,Folder,Layers3} from 'lucide-react';
import {assignmentRows,addAssignment,editAssignment,removeAssignment,moveAssignment,addAssignmentPerson,editAssignmentPerson,moveAssignmentPerson} from './assignment-roster.mjs';

const PALETTE=['blue','violet','teal','orange','purple','blue','mint','amber','pink','lavender','sky','cyan','rose'];
const prettyDate=(date:string)=>new Date(date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
const createEmptyPerson=()=>({name:'',position:'ITO',startDate:''});

// Assignment v0.6.115: seven visible owner columns, one-column navigation steps.
// The table is deliberately kept intact, rather than slicing the roster,
// so system and whole-column drag/drop still work across the navigation pages.
const NB114_MAX_COLUMNS=7;
const NB114_PROJECT_WIDTH=106;
const NB114_MIN_OWNER_WIDTH=158;
export const assignmentOwnerWidth=(viewportWidth:number)=>
 Math.max(NB114_MIN_OWNER_WIDTH,(Math.max(0,viewportWidth)-NB114_PROJECT_WIDTH)/NB114_MAX_COLUMNS+0.15);
export const assignmentVisibleColumns=(viewportWidth:number,ownerWidth:number)=>
 Math.max(1,Math.min(NB114_MAX_COLUMNS,Math.floor((Math.max(0,viewportWidth)-NB114_PROJECT_WIDTH+3)/ownerWidth)));
export const assignmentPageStarts=(ownerCount:number,includeNewPerson:boolean,visibleCount:number)=>{
 const windowSize=Math.max(1,Math.min(NB114_MAX_COLUMNS,Math.floor(visibleCount)||1));
 const count=Math.max(0,ownerCount)+(includeNewPerson?1:0);
 const lastStart=Math.max(0,count-windowSize);
 return Array.from({length:lastStart+1},(_,index)=>index);
};

/** Describe the EXACT destination of moveAssignment without modifying the roster.
 * When moving down within the same owner, moveAssignment removes the dragged
 * item before inserting by index. The visual line must therefore be BELOW
 * the hovered card, not above it. Empty distant rows clamp to the end. */
export const assignmentInsertionMarker=(roster:any,draggedItemId:string|null,hoveredSlot:string|null)=>{
 const match=String(hoveredSlot||'').match(/^slot:([^:]+):(head|\d+)$/);
 const active=roster.items.find((item:any)=>item.id===draggedItemId);
 if(!match||!active)return null;
 const personId=match[1];
 if(!roster.people.some((person:any)=>person.id===personId))return null;
 const targetIndex=match[2]==='head'?0:Number(match[2]);
 const assignments=roster.items.filter((item:any)=>item.personId===personId).sort((a:any,b:any)=>a.order-b.order);
 const sourceIndex=assignments.findIndex((item:any)=>item.id===draggedItemId);
 const sameOwner=active.personId===personId;
 if(sameOwner&&active.order===targetIndex)return null;
 const remainingCount=assignments.length-(sameOwner?1:0);
 const insertionIndex=Math.max(0,Math.min(remainingCount,targetIndex));
 return sameOwner&&sourceIndex<insertionIndex
  ?{personId,row:Math.min(insertionIndex,assignments.length-1),edge:'after' as const}
  :{personId,row:insertionIndex,edge:'before' as const};
};

function AssignmentCell({item,person,position,isAdmin,busy,onEdit,onAdd,dropOwner,insertionMarker,justMoved,draggingPersonId,columnTarget,justReorderedColumns}:any){
 const targetId=`slot:${person.id}:${position}`;
 const {setNodeRef:isDropRef,isOver}=useDroppable({id:targetId,disabled:!isAdmin});
 const {attributes,listeners,setNodeRef:isDragRef,isDragging}=useDraggable({id:`item:${item?.id||targetId}`,disabled:!isAdmin||!item||busy});
 const insertionEdge=insertionMarker?.personId===person.id&&insertionMarker.row===position?insertionMarker.edge:null;
 return <td className={'nb52-cell '+(isOver?'nb52-cell-drop ':'')+(insertionEdge==='before'?'nb117-insertion-before ':'')+(insertionEdge==='after'?'nb117-insertion-after ':'')+(isDragging?'nb52-cell-dragging ':'')+(dropOwner===person.id?'nb54-target-column ':'')+(justMoved===item?.id?'nb54-landed ':'')+(draggingPersonId===person.id?'nb56-column-source ':'')+(columnTarget?.personId===person.id?'nb56-column-destination ':'')+(columnTarget?.personId===person.id&&columnTarget.placement==='before'?'nb57-insert-before ':'')+(columnTarget?.personId===person.id&&columnTarget.placement==='after'?'nb57-insert-after ':'')+(justReorderedColumns?.includes(person.id)?'nb56-column-landed ':'')} ref={isDropRef} data-owner={person.name}>
  {item?<div className="nb52-assignment-item" ref={isDragRef} title={`${item.name}\nOwner: ${person.name}`}>
   {isAdmin&&<button type="button" className="nb52-drag-handle" {...listeners} {...attributes} aria-label={`Move ${item.name} from ${person.name}`} title="Drag to another owner"><GripVertical size={14}/></button>}
   <span className="nb52-assignment-name">{item.name}</span>
   {isAdmin&&<button className="nb52-pencil" type="button" aria-label={`Edit ${item.name}`} title={`Edit assignment for ${person.name}`} disabled={busy} onClick={()=>onEdit(item)}><Pencil size={12}/></button>}
  </div>:isAdmin?<button className="nb52-add-in-cell" type="button" aria-label={`Add system to ${person.name}`} title={`Add system for ${person.name}`} onClick={()=>onAdd(person)}><Plus size={13}/></button>:<span className="nb52-empty">—</span>}
 </td>;
}
function PersonColumnHeader({person,index,isAdmin,busy,onAdd,onEdit,dropOwner,draggingPersonId,columnTarget,justReorderedColumns}:any){
 const {setNodeRef:setItemTarget,isOver:itemIsOver}=useDroppable({id:`slot:${person.id}:head`,disabled:!isAdmin});
 const {setNodeRef:setBeforeTarget}=useDroppable({id:`person-insert:${person.id}:before`,disabled:!isAdmin||busy});
 const {setNodeRef:setAfterTarget}=useDroppable({id:`person-insert:${person.id}:after`,disabled:!isAdmin||busy});
 const {attributes,listeners,setNodeRef:setPersonDrag,isDragging}=useDraggable({id:`person:${person.id}`,disabled:!isAdmin||busy});
 const source=isDragging||draggingPersonId===person.id;
 const destination=columnTarget?.personId===person.id&&!!draggingPersonId&&!source;
 const insertionSide=destination?columnTarget.placement:null;
 return <th ref={setPersonDrag} scope="col" data-person-id={person.id} className={`nb52-person nb52-person-${PALETTE[index%PALETTE.length]} ${(dropOwner===person.id||itemIsOver)?'nb54-person-target':''} ${source?'nb56-column-source':''} ${destination?'nb56-column-destination':''} ${insertionSide==='before'?'nb57-insert-before':''} ${insertionSide==='after'?'nb57-insert-after':''} ${justReorderedColumns?.includes(person.id)?'nb56-column-landed':''}`}>
  {isAdmin&&<><div ref={setBeforeTarget} className="nb57-insertion-zone nb57-insertion-before" aria-hidden="true"/><div ref={setAfterTarget} className="nb57-insertion-zone nb57-insertion-after" aria-hidden="true"/></>}
  <div className="nb120-header-card">
  <div ref={setItemTarget} className="nb56-header-inner">
   <div className="nb52-avatar" aria-hidden="true">{person.name[0]}</div>
   <strong title={person.name}>{person.name}</strong><span className="nb52-position">{person.position}</span><small>{prettyDate(person.startDate)}</small>
  </div>
  {isAdmin&&<div className="nb54-person-actions">
   <button type="button" className="nb54-person-edit" aria-label={`Edit team member ${person.name}`} title={`Edit name, position and date for ${person.name}`} onClick={()=>onEdit(person)}><Pencil size={12}/></button>
   <button type="button" className="nb52-column-plus" aria-label={`Add system to ${person.name}`} title={`Add system to ${person.name}`} onClick={()=>onAdd(person)}><Plus size={12}/></button>
  </div>}
  {isAdmin&&<button type="button" className="nb56-column-grip" {...attributes} {...listeners} disabled={busy} aria-label={`Move entire column for ${person.name}`} title={`Drag ${person.name} and drop on the left or right half of another employee header`}><GripVertical size={15}/><span>Move column</span></button>}
  </div>
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
 const [dropSlot,setDropSlot]=useState<string|null>(null);
 const [justMoved,setJustMoved]=useState<any>(null);
 const [draggingPersonId,setDraggingPersonId]=useState<string|null>(null);
 const [columnTarget,setColumnTarget]=useState<{personId:string,placement:'before'|'after'}|null>(null);
 const [justReorderedColumns,setJustReorderedColumns]=useState<string[]>([]);
 const gridRef=useRef<HTMLDivElement>(null);
 const scrollTargetRef=useRef<number|null>(null);
 const navigationIndexRef=useRef(0);
 const [viewport,setViewport]=useState({ownerWidth:167,visibleColumns:7});
 const [pageIndex,setPageIndex]=useState(0);
 const people=useMemo(()=>roster.people.filter((person:any)=>{
  const search=query.trim().toLowerCase();return !search||person.name.toLowerCase().includes(search)||roster.items.some((item:any)=>item.personId===person.id&&item.name.toLowerCase().includes(search));
 }),[roster,query]);
 const itemsByPerson=useMemo(()=>Object.fromEntries(roster.people.map((p:any)=>[p.id,roster.items.filter((i:any)=>i.personId===p.id).sort((a:any,b:any)=>a.order-b.order)])),[roster]);
 const rowCount=Math.max(13,...people.map((p:any)=>itemsByPerson[p.id]?.length||0));
 const pageStarts=assignmentPageStarts(people.length,isAdmin,viewport.visibleColumns);
 const currentPage=Math.min(pageIndex,pageStarts.length-1);
 const firstVisible=people.length?Math.min(pageStarts[currentPage]+1,people.length):0;
 const lastVisible=Math.min(people.length,pageStarts[currentPage]+viewport.visibleColumns);
 // Recalculate column size without changing fonts, row heights, or project column width.
 useEffect(()=>{
  const grid=gridRef.current;if(!grid)return;
  const measure=()=>{
   const width=assignmentOwnerWidth(grid.clientWidth);
   const count=assignmentVisibleColumns(grid.clientWidth,width);
   setViewport(previous=>previous.ownerWidth===width&&previous.visibleColumns===count?previous:{ownerWidth:width,visibleColumns:count});
  };
  measure();
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;
  observer?.observe(grid);
  window.addEventListener('resize',measure);
  return ()=>{observer?.disconnect();window.removeEventListener('resize',measure);};
 },[]);
 // A roster/filter/viewport change keeps the selected window valid.
 useEffect(()=>{
  const nextIndex=Math.min(navigationIndexRef.current,pageStarts.length-1);
  navigationIndexRef.current=nextIndex;
  if(nextIndex!==pageIndex)setPageIndex(nextIndex);
  const grid=gridRef.current;
  scrollTargetRef.current=null;
  if(grid)grid.scrollLeft=pageStarts[nextIndex]*viewport.ownerWidth;
 },[people.length,query,isAdmin,viewport.ownerWidth,viewport.visibleColumns]);
 const onMatrixScroll=()=>{
  const grid=gridRef.current;if(!grid||pageStarts.length<2)return;
  const left=grid.scrollLeft;
  if(scrollTargetRef.current!==null){
   // Intermediate smooth-scroll positions must not override a newer arrow click.
   if(Math.abs(left-scrollTargetRef.current)>1)return;
   scrollTargetRef.current=null;
  }
  const nearest=Math.max(0,Math.min(pageStarts.length-1,Math.round(left/viewport.ownerWidth)));
  navigationIndexRef.current=nearest;
  setPageIndex(previous=>previous===nearest?previous:nearest);
 };
 const navigateColumns=(direction:-1|1)=>{
  const previous=navigationIndexRef.current;
  const next=Math.min(pageStarts.length-1,Math.max(0,previous+direction));
  if(next===previous)return;
  navigationIndexRef.current=next;
  setPageIndex(next);
  const grid=gridRef.current;
  if(grid){
   const destination=pageStarts[next]*viewport.ownerWidth;
   scrollTargetRef.current=destination;
   grid.scrollTo({left:destination,behavior:'smooth'});
  }
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
  const sourceId=String(evt.active.id||'');const destinationId=String(evt.over?.id||'');setDragging(null);setDropTarget(null);setDropSlot(null);
  if(!isAdmin||busy||!sourceId.startsWith('item:')||!destinationId.startsWith('slot:'))return;
  const [,personId,index]=destinationId.split(':');const id=sourceId.slice(5);const current=roster.items.find((i:any)=>i.id===id);
  if(!current||!roster.people.some((p:any)=>p.id===personId)||current.personId===personId&&current.order===(index==='head'?0:Number(index)))return;
  setBusy(true);try{
   await onChange((state:any)=>moveAssignment(state,id,personId,index==='head'?0:Number(index)));setJustMoved(id);
   window.setTimeout(()=>setJustMoved((previous:any)=>previous===id?null:previous),850);
  }catch(e:any){setError(e?.message||'Could not move assignment.');setEditor({moveError:true});}finally{setBusy(false);}
 };
 const reorderColumn=async(event:any)=>{
  const source=String(event.active?.id||'').slice('person:'.length);
  const targetMatch=String(event.over?.id||'').match(/^person-insert:(.+):(before|after)$/);
  if(!isAdmin||busy||!String(event.active?.id||'').startsWith('person:')||!targetMatch)return;
  const [,target,placement]=targetMatch;
  if(source===target||!roster.people.some((person:any)=>person.id===source)||!roster.people.some((person:any)=>person.id===target))return;
  if(moveAssignmentPerson(roster,source,target,placement)===roster)return;
  setBusy(true);setError('');
  try{
   await onChange((current:any)=>moveAssignmentPerson(current,source,target,placement));
   setJustReorderedColumns([source,target]);
   window.setTimeout(()=>setJustReorderedColumns([]),900);
  }catch(e:any){setError(e?.message||'Could not reorder columns.');setEditor({moveError:true});}
  finally{setBusy(false);}
 };
 const onDragFinished=(event:any)=>{
  const isPerson=String(event.active?.id||'').startsWith('person:');
  setDragging(null);setDropTarget(null);setDropSlot(null);setDraggingPersonId(null);setColumnTarget(null);
  if(isPerson){void reorderColumn(event);return;}
  void move(event);
 };
 const onDraggingStarted=(event:any)=>{
  const id=String(event.active?.id||'');
  if(id.startsWith('person:')){setDraggingPersonId(id.slice(7));setColumnTarget(null);setDragging(null);setDropTarget(null);setDropSlot(null);}
  else if(id.startsWith('item:')){setDragging(id.slice(5));setDropTarget(null);setDropSlot(null);setDraggingPersonId(null);setColumnTarget(null);}
 };
 const onDraggingOver=(event:any)=>{
  const id=String(event.over?.id||'');
  if(String(event.active?.id||'').startsWith('person:')){
   const target=id.match(/^person-insert:(.+):(before|after)$/);
   setColumnTarget(target?{personId:target[1],placement:target[2] as 'before'|'after'}:null);
   setDropSlot(null);
  }
  else {setDropSlot(id.startsWith('slot:')?id:null);setDropTarget(id.startsWith('slot:')?id.split(':')[1]:null);}
 };
 const assignmentCollision=(args:any)=>{
  const prefix=String(args.active?.id||'').startsWith('person:')?'person-insert:':'slot:';
  const eligible=args.droppableContainers.filter((container:any)=>String(container.id).startsWith(prefix));
  const scope={...args,droppableContainers:eligible};
  const direct=pointerWithin(scope);
  return direct.length?direct:rectIntersection(scope);
 };
 const dragged=dragging?roster.items.find((i:any)=>i.id===dragging):null;
 const sourcePerson=dragged?roster.people.find((p:any)=>p.id===dragged.personId):null;
 const insertionMarker=assignmentInsertionMarker(roster,dragging,dropSlot);
 const dropPerson=dropTarget?roster.people.find((p:any)=>p.id===dropTarget):null;
 const columnPerson=draggingPersonId?roster.people.find((p:any)=>p.id===draggingPersonId):null;
 const columnDestination=columnTarget?roster.people.find((p:any)=>p.id===columnTarget.personId):null;
 const seen=new Set<string>();const sharedNames=new Set<string>();roster.items.forEach((i:any)=>{const key=i.name.trim().toLowerCase();if(seen.has(key))sharedNames.add(key);seen.add(key);});
 return <section className="nb52-page nb54-page nb114-page nb116-page nb117-page nb118-page nb119-page nb120-page nb121-page" aria-label="Assignment">
  <header className="nb52-header nb45-primary-header"><div><h1>Assignment</h1><p>System ownership · Team responsibilities</p></div><div className="nb52-kpis"><span><Users size={17}/>{roster.people.length} people</span><span><ClipboardList size={17}/>{roster.items.length} assignments</span></div></header>
  <div className="nb52-toolbar"><label className="nb52-search"><Search size={17}/><input type="search" placeholder="Search people or assigned systems..." value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search assignments"/></label><span className="nb52-toolbar-tip"><ArrowRightLeft size={15}/>{isAdmin?'Drag systems between owners · Drag employee headers between columns':'System owners are managed here'}</span><nav className="nb114-navigation" aria-label="Assignment column navigation"><button type="button" className="nb114-nav-arrow" aria-label="Previous owner columns" title="Previous employee column" disabled={currentPage===0} onClick={()=>navigateColumns(-1)}><ChevronLeft size={17}/></button><span className="nb114-nav-counter" aria-live="polite">Showing {firstVisible}–{lastVisible} of {people.length}</span><button type="button" className="nb114-nav-arrow nb114-next" aria-label="Next owner columns" title="Next employee column" disabled={currentPage===pageStarts.length-1} onClick={()=>navigateColumns(1)}><ChevronRight size={17}/></button></nav></div>
  <div className="nb52-matrix-frame">
   <div ref={gridRef} className="nb52-grid-scroll" role="region" aria-label="Assignment matrix — use navigation arrows to browse owner columns" tabIndex={0} onScroll={onMatrixScroll} onWheel={()=>{scrollTargetRef.current=null}} onTouchStart={()=>{scrollTargetRef.current=null}} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End','PageUp','PageDown'].includes(e.key))scrollTargetRef.current=null}} style={{'--nb114-owner-width':`${viewport.ownerWidth}px`} as React.CSSProperties}>
    <DndContext sensors={sensors} collisionDetection={assignmentCollision} onDragStart={onDraggingStarted} onDragOver={onDraggingOver} onDragCancel={()=>{setDragging(null);setDropTarget(null);setDropSlot(null);setDraggingPersonId(null);setColumnTarget(null);}} onDragEnd={onDragFinished}>
     <table className="nb52-table" style={{'--nb54-rows':rowCount} as React.CSSProperties}><thead><tr><th className="nb52-project-th" scope="col"><div className="nb52-project-heading"><span className="nb116-project-label"><Layers3 size={13} aria-hidden="true"/>Project</span><small>Assigned systems</small></div></th>{people.map((p:any)=><PersonColumnHeader key={p.id} person={p} index={roster.people.findIndex((x:any)=>x.id===p.id)} isAdmin={isAdmin} busy={busy} onEdit={beginPersonEdit} onAdd={beginAdd} dropOwner={dropTarget} draggingPersonId={draggingPersonId} columnTarget={columnTarget} justReorderedColumns={justReorderedColumns}/>)}{isAdmin&&<th scope="col" className="nb54-new-person"><button type="button" onClick={beginPersonAdd} aria-label="Add new team member"><span className="nb54-new-avatar"><UserRoundPlus size={19}/></span><strong>Add person</strong><small>Name · Position · Start date</small><span className="nb54-new-plus"><Plus size={14}/> New team member</span></button></th>}</tr></thead><tbody>{Array.from({length:rowCount},(_,row)=><tr key={row}><th scope="row" className="nb52-project-row"><span className="nb116-project-row-label"><Folder size={12} aria-hidden="true"/>Project {row}</span></th>{people.map((p:any)=><AssignmentCell key={p.id+':'+row} person={p} item={itemsByPerson[p.id]?.[row]} isAdmin={isAdmin} busy={busy} position={row} onEdit={beginEdit} onAdd={beginAdd} dropOwner={dropTarget} insertionMarker={insertionMarker} justMoved={justMoved} draggingPersonId={draggingPersonId} columnTarget={columnTarget} justReorderedColumns={justReorderedColumns}/>)}{isAdmin&&<td className="nb54-new-empty"/>}</tr>)}</tbody></table>
     {createPortal(<DragOverlay dropAnimation={{duration:240,easing:'cubic-bezier(.2,.9,.2,1)'}}>{dragged?<div className="nb52-drag-preview"><GripVertical size={15}/><div><strong>{dragged.name}</strong><span>{sourcePerson?.name||'Current owner'} <MoveRight size={12}/> {dropPerson?.name||'Choose new owner'}</span></div></div>:null}{columnPerson?<div className="nb56-column-preview"><span className="nb56-column-preview-avatar">{columnPerson.name[0]}</span><div><strong>{columnPerson.name}</strong><small>{roster.items.filter((item:any)=>item.personId===columnPerson.id).length} systems · Entire column</small><span><ArrowRightLeft size={13}/> {columnDestination&&columnDestination.id!==columnPerson.id?`Insert ${columnTarget?.placement} ${columnDestination.name}`:'Drop at a column edge'}</span></div></div>:null}</DragOverlay>,document.body)}
    </DndContext>
   </div>

  </div>
  <div className="nb52-footer"><span>Exact system-name match controls Owner across NBDT. No partial matching.</span><span>{sharedNames.size?`${sharedNames.size} repeated titles may have shared ownership`:''}</span>{!isAdmin&&<button type="button" onClick={onAuth}><LockKeyhole size={14}/> Sign in to edit</button>}</div>
  {editor&&!editor.moveError&&<div className="nb52-modal-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setEditor(null);}}><form className="nb52-editor" role="dialog" aria-modal="true" aria-label="Assignment editor" onSubmit={e=>{e.preventDefault();void save();}}><header><span className="nb52-editor-icon"><Pencil size={18}/></span><button type="button" aria-label="Close editor" onClick={()=>setEditor(null)} disabled={busy}><X size={17}/></button></header><h2>{editor.creating?'Add assigned system':'Edit assigned system'}</h2><p>Owner: <strong>{roster.people.find((p:any)=>p.id===editor.personId)?.name}</strong></p><label>System name<input aria-label="Assigned system name" autoFocus maxLength={180} value={draft} onChange={e=>setDraft(e.target.value)} required/></label>{error&&<p role="alert" className="nb52-error">{error}</p>}<div className="nb52-editor-actions">{!editor.creating&&<button type="button" className="nb52-remove" disabled={busy} onClick={remove}>Remove</button>}<button type="button" disabled={busy} onClick={()=>setEditor(null)}>Cancel</button><button type="submit" disabled={busy||!draft.trim()} className="nb52-save"><Check size={15}/>{busy?'Saving…':'Save'}</button></div></form></div>}
  {personEditor&&<div className="nb52-modal-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setPersonEditor(null);}}><form className="nb52-editor nb54-person-editor" role="dialog" aria-modal="true" aria-label="Team member editor" onSubmit={e=>{e.preventDefault();void savePerson();}}><header><span className="nb52-editor-icon"><Users size={18}/></span><button type="button" aria-label="Close team member editor" onClick={()=>setPersonEditor(null)} disabled={busy}><X size={17}/></button></header><h2>{personEditor.creating?'Add team member':'Edit team member'}</h2><p>{personEditor.creating?'Create a new owner column.':'Updates the name displayed as Owner across NBDT.'}</p><label>Full name<input aria-label="Team member full name" autoFocus maxLength={100} value={personDraft.name} onChange={e=>setPersonDraft((p:any)=>({...p,name:e.target.value}))} required placeholder="Full name"/></label><label>Position<input aria-label="Team member position" maxLength={40} value={personDraft.position} onChange={e=>setPersonDraft((p:any)=>({...p,position:e.target.value}))} required placeholder="ITO or ITSS"/></label><label>Start date<input aria-label="Team member start date" type="date" value={personDraft.startDate} onChange={e=>setPersonDraft((p:any)=>({...p,startDate:e.target.value}))} required/></label>{error&&<p role="alert" className="nb52-error">{error}</p>}<div className="nb52-editor-actions"><button type="button" disabled={busy} onClick={()=>setPersonEditor(null)}>Cancel</button><button type="submit" disabled={busy||!personDraft.name.trim()||!personDraft.position.trim()||!personDraft.startDate} className="nb52-save"><Check size={15}/>{busy?'Saving…':personEditor.creating?'Add person':'Save changes'}</button></div></form></div>}
  {editor?.moveError&&<div className="nb52-modal-overlay"><div className="nb52-editor" role="alertdialog" aria-modal="true"><h2>Unable to move system</h2><p className="nb52-error">{error}</p><div className="nb52-editor-actions"><button className="nb52-save" onClick={()=>setEditor(null)}>Close</button></div></div></div>}
 </section>;
}
