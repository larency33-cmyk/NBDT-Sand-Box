import React, {useEffect,useRef,useState} from 'react';
import {DndContext,DragOverlay,closestCenter,useDroppable} from '@dnd-kit/core';
import {SortableContext,useSortable,verticalListSortingStrategy} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {Search,Plus,Eye,ChevronDown,SlidersHorizontal,UserRound,ClipboardList,Package,CheckCircle2,Clock3,Box,MoreVertical,Inbox,CircleCheck,X} from 'lucide-react';

const STATUSES=['Open','Investigating','Waiting for Parts','Resolved'] as const;
const STYLES:any={Open:{label:'Open',Icon:ClipboardList},Investigating:{label:'Investigating',Icon:Search},'Waiting for Parts':{label:'Waiting for parts',Icon:Package},Resolved:{label:'Resolved',Icon:CheckCircle2}};
type FilterChoice = {value:string;label:string};
type FilterDropdownProps = {
 icon:React.ReactNode;
 label:string;
 allLabel:string;
 value:string;
 onChange:(value:string)=>void;
 options:FilterChoice[];
};
/** Project-scoped accessible dropdown. Unlike native select, the popup shares the Issue Tracker theme. */
function FilterDropdown({icon,label,allLabel,value,onChange,options}:FilterDropdownProps){
 const [open,setOpen]=useState(false);
 const rootRef=useRef<HTMLDivElement>(null);
 const triggerRef=useRef<HTMLButtonElement>(null);
 const choiceList:FilterChoice[]=[{value:'',label:allLabel},...options];
 const selected=choiceList.find(option=>option.value===value);
 useEffect(()=>{
  if(!open)return;
  const closeOnOutside=(event:PointerEvent)=>{
   if(!rootRef.current?.contains(event.target as Node))setOpen(false);
  };
  const closeOnEscape=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){
    event.preventDefault();setOpen(false);triggerRef.current?.focus();
   }
  };
  document.addEventListener('pointerdown',closeOnOutside);
  document.addEventListener('keydown',closeOnEscape);
  return ()=>{
   document.removeEventListener('pointerdown',closeOnOutside);
   document.removeEventListener('keydown',closeOnEscape);
  };
 },[open]);
 const select=(choice:FilterChoice)=>{onChange(choice.value);setOpen(false);triggerRef.current?.focus();};
 const keyOnTrigger=(event:React.KeyboardEvent<HTMLButtonElement>)=>{
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();setOpen(true);
   requestAnimationFrame(()=>{
    const choices=Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('.nb34-dropdown-option')||[]);
    const selectedIndex=choiceList.findIndex(item=>item.value===value);
    choices[Math.max(0,selectedIndex)]?.focus();
   });
  }
 };
 const keyOnMenu=(event:React.KeyboardEvent<HTMLDivElement>)=>{
  if(!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
  const choices=Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('.nb34-dropdown-option')||[]);
  if(!choices.length)return;
  event.preventDefault();
  const current=choices.indexOf(document.activeElement as HTMLButtonElement);
  const next=event.key==='Home'?0:event.key==='End'?choices.length-1:
   event.key==='ArrowDown'?(current+1)%choices.length:(current+choices.length-1)%choices.length;
  choices[next]?.focus();
 };
 return <div ref={rootRef} className={'nb34-filter'+(open?' nb34-filter--open':'')+(value?' nb34-filter--active':'')}>
  <button ref={triggerRef} type="button" className="nb34-filter-trigger" aria-label={label+' filter'}
   aria-haspopup="listbox" aria-expanded={open} onKeyDown={keyOnTrigger} onClick={()=>setOpen(wasOpen=>!wasOpen)}>
   <span className="nb34-filter-icon" aria-hidden="true">{icon}</span>
   <span className="nb34-filter-label" title={selected?.label||allLabel}>{label}: <strong>{selected?.label||allLabel}</strong></span>
   <ChevronDown size={17} className="nb34-filter-chevron" aria-hidden="true"/>
  </button>
  {open&&<div className="nb34-dropdown" role="listbox" aria-label={label+' options'} onKeyDown={keyOnMenu}>
   {choiceList.map(choice=><button type="button" role="option" aria-selected={choice.value===value}
    key={choice.value} className={'nb34-dropdown-option'+(choice.value===value?' nb34-dropdown-option--selected':'')}
    onClick={()=>select(choice)}><span className="nb34-dropdown-text">{choice.label}</span>
    {choice.value===value&&<CheckCircle2 size={16} aria-hidden="true"/>}</button>)}
  </div>}
 </div>;
}

function IssueCard({issue,project,onOpen,overlay=false}:any){
 const system=project.systems.find((s:any)=>s.id===issue.systemId);
 const assignee=project.members.find((m:any)=>m.id===issue.assigneeId);
 const sev=(issue.severity||'Medium').toLowerCase();
 const label=issue.id.startsWith('issue-')?issue.id.slice(6).slice(-4):issue.id.slice(-4);
 const date=new Date(issue.updatedAt||issue.createdAt);
 const updated=Number.isNaN(date.getTime())?'—':date.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
 return <article className={'nb34-card'+(overlay?' nb34-card--dragging':'')} onClick={onOpen}>
 <div className="nb34-card-primary"><div className="nb34-card-text"><h3 title={issue.title}>{issue.title}</h3><p>{issue.description?.trim()||'No description provided.'}</p></div>
 <button className="nb34-card-more" type="button" aria-label="Open issue details" onClick={(e)=>{e.stopPropagation();onOpen();}}><MoreVertical size={19}/></button></div>
 <div className="nb34-card-meta"><div className="nb34-card-meta-first"><span className="nb34-card-system"><Box size={16}/><span>{system?.name||'Unknown system'}</span></span>
 <span className={'nb34-severity nb34-severity--'+sev}><i/>{issue.severity}</span></div>
 <div className="nb34-card-meta-second"><span>#{label} · {assignee?.name||'Unassigned'}</span><span className="nb34-card-date"><Clock3 size={15}/>{updated}</span></div></div>
 </article>;
}
function IssueColumn({status,issues,project,setDraftIssue}:any){
 const {setNodeRef}=useDroppable({id:status});const {label,Icon}=STYLES[status];
 return <section ref={setNodeRef} className={'nb34-column nb34-column--'+status.toLowerCase().replace(/\s+/g,'-')}><header className="nb34-column-head"><div className="nb34-column-name"><span className="nb34-column-icon"><Icon size={21}/></span><h2>{label}</h2></div><span className="nb34-column-count">{issues.length}</span></header><SortableContext items={issues.map((i:any)=>i.id)} strategy={verticalListSortingStrategy}><div className="nb34-column-content">{issues.map((issue:any)=><SortableCard key={issue.id} issue={issue} project={project} onOpen={()=>setDraftIssue(issue)}/>)}{!issues.length&&<div className="nb34-empty"><span>{status==='Resolved'?<CircleCheck size={31}/>:<Inbox size={30}/>}</span><p>{status==='Resolved'?'No resolved issues':status==='Waiting for Parts'?'No issues waiting':status==='Investigating'?'No issues being investigated':'No open issues'}</p></div>}</div></SortableContext></section>;
}
function SortableCard({issue,project,onOpen}:any){
 const {attributes,listeners,setNodeRef,transform,transition,isDragging}=useSortable({id:issue.id});
 return <div ref={setNodeRef} style={{transform:CSS.Translate.toString(transform),transition,opacity:isDragging?.35:1}} className="nb34-sortable" {...attributes} {...listeners}><IssueCard issue={issue} project={project} onOpen={onOpen}/></div>;
}
export function IssueTrackerBoard(props:any){
 const {project,isAdmin,setShowAdminAuthModal,setAdminPassInput,setDraftIssue,issueSearch,setIssueSearch,issueSeverityFilter,setIssueSeverityFilter,assigneeFilter,setAssigneeFilter,filteredIssues,sensors,handleIssueDragStart,handleIssueDragEnd,activeIssueId}=props;
 const active=filteredIssues.filter((i:any)=>i.status!=='Resolved');
 const critical=active.filter((i:any)=>i.severity==='Critical').length,high=active.filter((i:any)=>i.severity==='High').length;
 const last=Math.max(0,...project.issues.map((i:any)=>i.updatedAt||i.createdAt||0));
 const updated=last?new Date(last).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—';
 function createIssue(){if(!isAdmin){setShowAdminAuthModal(true);setAdminPassInput('');return;}const now=Date.now();setDraftIssue({id:'issue-'+now,systemId:project.systems[0]?.id||'',title:'',description:'',severity:'Medium',status:'Open',assigneeId:'',createdAt:now,updatedAt:now});}
 return <main className="nb34-issues">
 <header className="nb34-hero">
 <div className="nb34-heading-row nb45-primary-header"><div><h1>Issue Tracker</h1><p>Track system issues from report to resolution</p></div><div className="nb34-heading-actions">
 
 {isAdmin&&<button className="nb34-add-btn" onClick={createIssue}><Plus size={22}/> New issue</button>}</div></div></header>
 <section className="nb34-toolbar" aria-label="Issue filters">
  <div className="nb34-search">
   <Search size={21} className="nb34-search-icon" aria-hidden="true"/>
   <input type="search" aria-label="Search issues or systems" placeholder="Search issues or systems..."
    value={issueSearch} onChange={event=>setIssueSearch(event.target.value)}/>
   {(issueSearch||issueSeverityFilter||assigneeFilter)&&<button type="button" className="nb34-reset"
    onClick={()=>{setIssueSearch('');setIssueSeverityFilter('');setAssigneeFilter('');}}
    aria-label="Clear all issue filters"><X size={14}/> Clear</button>}
  </div>
  <FilterDropdown icon={<SlidersHorizontal size={19}/>} label="Severity" allLabel="All"
   value={issueSeverityFilter} onChange={setIssueSeverityFilter}
   options={['Critical','High','Medium','Low'].map(severity=>({value:severity,label:severity}))}/>
  <FilterDropdown icon={<UserRound size={20}/>} label="Assignee" allLabel="All"
   value={assigneeFilter} onChange={setAssigneeFilter}
   options={project.members.map((member:any)=>({value:member.id,label:member.name}))}/>
 </section>
 <div className="nb34-summary"><div className="nb34-summary-group"><strong>{active.length} active {active.length===1?'issue':'issues'}</strong>{critical>0&&<span className="nb34-count nb34-count--critical"><i/>{critical} Critical</span>}{high>0&&<span className="nb34-count nb34-count--high"><i/>{high} High</span>}</div><span className="nb34-last-updated">Updated {updated}</span></div>
 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleIssueDragStart} onDragEnd={handleIssueDragEnd}>
 <div className="nb34-board">{STATUSES.map(status=><IssueColumn key={status} status={status} issues={filteredIssues.filter((i:any)=>i.status===status)} project={project} setDraftIssue={setDraftIssue}/>)}</div>
 <DragOverlay adjustScale={false} dropAnimation={null}>{activeIssueId?(()=>{const issue=project.issues.find((i:any)=>i.id===activeIssueId);return issue?<div className="nb34-drag-overlay"><IssueCard issue={issue} project={project} overlay onOpen={()=>{}}/></div>:null;})():null}</DragOverlay>
 </DndContext>
 </main>;
}
