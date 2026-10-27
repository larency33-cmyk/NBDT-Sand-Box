import React,{useEffect,useMemo,useRef,useState} from 'react';
import {CalendarDays,Check,ChevronDown,ChevronLeft,ChevronRight,ChevronsLeft,ChevronsRight,X} from 'lucide-react';
import {validDate} from './schedule.mjs';
import {CALENDAR_MONTHS,CALENDAR_WEEKDAYS,calendarMonthFromISO,calendarMoveMonth,calendarMoveYear,calendarDays,calendarDisplayDate,calendarYearOptions} from './project-calendar.mjs';

type PickerProps={value:string,today:string,hasTasks:boolean,disabled?:boolean,busy?:boolean,onConfirm:(value:string)=>Promise<void>};

/** Two-phase interaction: browsing and drafting never call onConfirm. */
export function ProjectStartPicker({value,today,hasTasks,disabled=false,busy=false,onConfirm}:PickerProps){
 const [open,setOpen]=useState(false);
 const [draft,setDraft]=useState(value);
 const [view,setView]=useState(()=>calendarMonthFromISO(value));
 const [error,setError]=useState('');
 const rootRef=useRef<HTMLDivElement>(null);
 const triggerRef=useRef<HTMLButtonElement>(null);
 const dialogRef=useRef<HTMLDivElement>(null);
 const days=useMemo(()=>calendarDays(view),[view.year,view.month]);
 const years=useMemo(()=>calendarYearOptions(view.year),[view.year]);
 const changed=draft!==value;

 const dismiss=(restoreFocus=false)=>{if(busy)return;setOpen(false);setError('');if(restoreFocus)requestAnimationFrame(()=>triggerRef.current?.focus());};
 const show=()=>{
  if(disabled||busy)return;
  setDraft(value);setView(calendarMonthFromISO(value));setError('');setOpen(true);
 };
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!rootRef.current?.contains(event.target as Node))dismiss();};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dismiss(true);}};
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape,true);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true);};
 },[open,busy]);
 useEffect(()=>{if(open)dialogRef.current?.focus();},[open]);
 // If the project changes elsewhere, a closed picker always reflects the persisted value.
 useEffect(()=>{if(!open){setDraft(value);setView(calendarMonthFromISO(value));}},[value,open]);
 const pick=(iso:string)=>{if(!validDate(iso))return;setDraft(iso);setError('');};
 const chooseToday=()=>{if(!validDate(today))return;pick(today);setView(calendarMonthFromISO(today));};
 const apply=async()=>{
  if(!changed){dismiss(true);return;}
  if(!validDate(draft)){setError('Please select a valid calendar date.');return;}
  try{setError('');await onConfirm(draft);setOpen(false);requestAnimationFrame(()=>triggerRef.current?.focus());}
  catch(reason:any){setError(reason?.message||'Unable to save project start date.');}
 };
 return <div ref={rootRef} className={'nb44-project-start'+(open?' nb44-picker-open':'')}>
  <CalendarDays size={17} aria-hidden="true" className="nb44-project-start-icon"/>
  <span className="nb44-project-start-label">Project start</span>
  {disabled?<strong className="nb44-readonly-date">{calendarDisplayDate(value)}</strong>:
   <button ref={triggerRef} className="nb44-date-trigger" type="button" aria-label="Choose project start date" aria-haspopup="dialog" aria-expanded={open} disabled={busy} onClick={()=>open?dismiss():show()}>
    <span>{calendarDisplayDate(value)}</span><ChevronDown size={15} aria-hidden="true"/>
   </button>}
  {open&&!disabled&&<div ref={dialogRef} role="dialog" aria-modal="false" aria-label="Choose project start date" tabIndex={-1} className="nb44-calendar-panel">
   <div className="nb44-calendar-heading"><div><span className="nb44-eyebrow">PROJECT PLANNING</span><h2>Choose start date</h2></div><button type="button" aria-label="Close calendar" className="nb44-close" onClick={()=>dismiss(true)} disabled={busy}><X size={17}/></button></div>
   <div className="nb44-calendar-navigation" aria-label="Calendar navigation">
    <button type="button" aria-label="Previous year" title="Previous year" onClick={()=>setView(v=>calendarMoveYear(v,-1))} disabled={busy}><ChevronsLeft size={17}/></button>
    <button type="button" aria-label="Previous month" title="Previous month" onClick={()=>setView(v=>calendarMoveMonth(v,-1))} disabled={busy}><ChevronLeft size={17}/></button>
    <select aria-label="Calendar month" value={view.month} disabled={busy} onChange={e=>setView(v=>({...v,month:Number(e.target.value)}))}>{CALENDAR_MONTHS.map((month,index)=><option value={index} key={month}>{month}</option>)}</select>
    <select aria-label="Calendar year" value={view.year} disabled={busy} onChange={e=>setView(v=>({...v,year:Number(e.target.value)}))}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
    <button type="button" aria-label="Next month" title="Next month" onClick={()=>setView(v=>calendarMoveMonth(v,1))} disabled={busy}><ChevronRight size={17}/></button>
    <button type="button" aria-label="Next year" title="Next year" onClick={()=>setView(v=>calendarMoveYear(v,1))} disabled={busy}><ChevronsRight size={17}/></button>
   </div>
   <div className="nb44-weekday-grid" aria-hidden="true">{CALENDAR_WEEKDAYS.map(day=><span key={day}>{day}</span>)}</div>
   <div className="nb44-days-grid" aria-label={`${CALENDAR_MONTHS[view.month]} ${view.year}`}>
    {days.map(day=><button type="button" key={day.iso} aria-label={day.iso} aria-pressed={draft===day.iso} aria-current={day.iso===today?'date':undefined} disabled={busy} className={['nb44-day',day.inside?'':'nb44-outside',draft===day.iso?'nb44-picked':'',day.iso===today?'nb44-today':''].join(' ')} onClick={()=>{pick(day.iso);if(!day.inside)setView(calendarMonthFromISO(day.iso));}}>{day.date}</button>)}
   </div>
   <div className="nb44-calendar-shortcuts"><button type="button" disabled={busy} onClick={chooseToday}>Today</button><button type="button" disabled={busy} onClick={()=>{pick(value);setView(calendarMonthFromISO(value));}}>Saved date</button></div>
   <div className="nb44-calendar-selection"><span>Selected date</span><strong>{calendarDisplayDate(draft)}</strong></div>
   {changed&&hasTasks&&<p className="nb44-calendar-impact">Applying a new start date keeps tasks in their project weeks and shifts milestone dates. Explicit task due dates remain unchanged.</p>}
   {error&&<p role="alert" className="nb44-calendar-error">{error}</p>}
   <div className="nb44-calendar-actions"><button type="button" className="nb44-calendar-cancel" onClick={()=>dismiss(true)} disabled={busy}>Cancel</button><button type="button" className="nb44-calendar-apply" disabled={busy||!changed||!validDate(draft)} onClick={()=>void apply()}><Check size={16}/>{busy?'Saving…':'Apply date'}</button></div>
  </div>}
 </div>;
}
