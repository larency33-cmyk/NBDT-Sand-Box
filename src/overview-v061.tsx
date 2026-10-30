import React,{useEffect,useMemo,useState} from 'react';
import {Layers3,Rocket,Boxes,ShieldCheck,AlertTriangle,CalendarDays,CheckCircle2,Clock3,Users,ArrowUpRight,ChevronRight,Activity,Ship,ClipboardList,Info,AlertCircle} from 'lucide-react';
import {buildOverviewData,pct} from './overview-metrics.mjs';
import {auditLog} from './demo-store.mjs';

const formatter=(n:number)=>Number(n||0).toLocaleString('en-US');
const shortDate=(d:string)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(d||'')))return '—';return new Date(d+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short'});};
const formatAudit=(date:string)=>{const v=new Date(date);return Number.isNaN(+v)?'—':v.toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});};
const KPI_ICONS=[Layers3,Rocket,Boxes,ShieldCheck];
const LABELS=[{theme:'base'},{theme:'ready'},{theme:'deployed'},{theme:'cyber'}];
const StatBar=({value,tone='base'}:{value:number|null,tone?:string})=><span className={'nb61-statbar nb61-statbar--'+tone} role="img" aria-label={value===null?'No inventory':`${value}%`}><span style={{width:`${Math.max(0,Math.min(100,value||0))}%`}}/></span>;
const NavButton=({onClick,children}:any)=><button type="button" className="nb61-link" onClick={onClick}>{children}<ArrowUpRight size={15}/></button>;

/** Main dashboard only reads live project, roster and local audit. No demo metrics are embedded. */
export function OverviewDashboard({project,roster,onNavigate,onInspectSystem,onOpenIssue}:any){
 const [clock,setClock]=useState(()=>new Date());
 const [activity,setActivity]=useState<any[]>([]);
 // Refresh project week at the next visit and at one-minute intervals while open.
 useEffect(()=>{const id=window.setInterval(()=>setClock(new Date()),60000);return()=>window.clearInterval(id);},[]);
 const data=useMemo(()=>buildOverviewData(project,roster,clock),[project,roster,clock]);
 useEffect(()=>{let alive=true;auditLog().then((rows:any[])=>{
  if(!alive)return;
  const keys=new Set([`nbdt_project_${project.id}`,'nbdt_assignment_roster_v052']);
  setActivity(rows.filter(r=>keys.has(r.key)).sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,4));
 }).catch(()=>{if(alive)setActivity([]);});return()=>{alive=false;};},[project.id,project.version,roster]);
 const kpiTarget=(key:string)=>onNavigate('config-report');
 return <section className="nb61-overview" aria-label="Project overview">
  <header className="nb61-hero"><div><h1>Overview</h1><p>Project status at a glance · Actual data from NBDT</p></div>
   <div className="nb61-hero-meta"><span className="nb61-start"><CalendarDays size={17}/> Project start <strong>{shortDate(project.startDate)} {String(project.startDate||'').slice(0,4)}</strong></span>
    <button className="nb61-week-pill" type="button" onClick={()=>onNavigate('roadmap')} title="Open Weekly Tracker"><Ship size={24} strokeWidth={1.55}/><span><strong>{data.week.label}</strong><small>{shortDate(data.week.start)} – {shortDate(data.week.end)}</small></span><ChevronRight size={17}/></button>
   </div>
  </header>
  <div className="nb61-kpis">{data.kpis.map((k:any,i:number)=>{const Icon=KPI_ICONS[i];const color=LABELS[i].theme;return <button type="button" key={k.key} onClick={()=>kpiTarget(k.key)} className={'nb61-kpi nb61-tone-'+color}>
   <span className="nb61-kpi-head"><span className="nb61-kpi-icon"><Icon size={23} strokeWidth={1.8}/></span><span className="nb61-kpi-name">{k.title}</span><ChevronRight size={15} className="nb61-kpi-chevron"/></span>
   <span className="nb61-kpi-numbers"><strong>{k.percent===null?'—':k.percent+'%'}</strong><span className="nb61-kpi-ring" style={{background:`conic-gradient(var(--nb61-accent) ${(k.percent||0)}%, #e3edf8 0)`}}><i/></span></span>
   <span className="nb61-kpi-description">{k.total?`${formatter(k.value)} / ${formatter(k.total)} ${k.unit}`:'No applicable records'}</span><StatBar value={k.percent} tone={color}/>
  </button>;})}</div>
  <div className="nb61-grid-top">
   <section className="nb61-panel nb61-attention"><header className="nb61-panel-heading"><span className="nb61-panel-symbol nb61-warn"><AlertTriangle size={19}/></span><div><h2>Systems requiring attention</h2><p>Prioritized from open issues, blocked tasks and incomplete device progress</p></div><span className="nb61-count-alert">{data.attentionCount} systems</span><NavButton onClick={()=>onNavigate('config-report')}>Report</NavButton></header>
    <div className="nb61-table-scroller"><table className="nb61-attention-table"><thead><tr><th>System</th><th>What needs attention</th><th>Base config.</th><th>System owner</th><th aria-label="Open details"/></tr></thead><tbody>
     {data.attention.slice(0,5).map((item:any)=><tr key={item.id}><td><strong>{item.name}</strong><small>{item.model}</small></td><td><span className={'nb61-issue-text '+(item.severity==='Critical'?'nb61-critical':item.severity==='High'?'nb61-high':'')}>
      {item.important?<AlertCircle size={13}/>:<Clock3 size={13}/>} {item.reason}</span></td><td><span className="nb61-mini-progress"><span>{item.progress===null?'—':item.progress+'%'}</span><StatBar value={item.progress}/></span></td><td className="nb61-owner">{item.owner}</td><td><button type="button" className="nb61-open" title={'Open '+item.name} aria-label={'Open '+item.name} onClick={()=>item.issueId?onOpenIssue(item.issueId):onInspectSystem(item.name)}><ArrowUpRight size={16}/></button></td></tr>)}
     {!data.attention.length&&<tr><td colSpan={5} className="nb61-empty">No outstanding issues, blocked tasks or incomplete device records in the registered systems.</td></tr>}
    </tbody></table></div>
    <footer className="nb61-attention-footer"><span>{data.issueCounts.total} open issues · {data.issueCounts.critical} critical · {data.issueCounts.high} high</span><NavButton onClick={()=>onNavigate('issues')}>Issue Tracker</NavButton></footer>
   </section>
   <section className="nb61-panel nb61-week"><header className="nb61-panel-heading"><span className="nb61-panel-symbol"><CalendarDays size={19}/></span><div><h2>This week</h2><p>{data.week.label} · {shortDate(data.week.start)} – {shortDate(data.week.end)}</p></div><NavButton onClick={()=>onNavigate('roadmap')}>Tracker</NavButton></header>
    <div className="nb61-week-stats">{[['Planned','planned'],['In Progress','active'],['Blocked','blocked'],['Completed','done']].map(([title,tone])=><button type="button" key={title} className={'nb61-week-stat nb61-week-stat--'+tone} onClick={()=>onNavigate('roadmap')}><strong>{data.week.counts[title]}</strong><span>{title==='In Progress'?'Active':title==='Completed'?'Done':title}</span></button>)}</div>
    <div className="nb61-week-subhead"><h3>Milestones · this & next week</h3><span>{data.week.milestones.length} scheduled</span></div>
    <div className="nb61-milestones">{data.week.milestones.slice(0,5).map((m:any)=><button key={m.id} onClick={()=>onNavigate('roadmap')}><span className="nb61-milestone-dot"/><span>{m.title}</span><time>{shortDate(m.date)}</time></button>)}
     {!data.week.milestones.length&&<div className="nb61-empty nb61-empty-milestones">No milestones scheduled for these two weeks.</div>}
    </div>
   </section>
  </div>
  <div className="nb61-grid-bottom">
   <section className="nb61-panel nb61-readiness"><header className="nb61-panel-heading"><span className="nb61-panel-symbol"><Layers3 size={19}/></span><div><h2>System readiness</h2><p>Largest inventoried systems · figures from Configuration Report</p></div><NavButton onClick={()=>onNavigate('config-report')}>All systems</NavButton></header>
    <div className="nb61-table-scroller"><table className="nb61-readiness-table"><thead><tr><th>System · Venue</th><th>Qty</th><th>Base</th><th>Ready</th><th>Deployed</th></tr></thead><tbody>{data.readiness.slice(0,5).map((s:any)=><tr key={s.id}><td><button type="button" className="nb61-system-link" onClick={()=>onInspectSystem(s.name)}>{s.name}</button><small>{s.venue}</small></td><td>{formatter(s.total)}</td>{[['basePct','base'],['readyPct','ready'],['deployedPct','deployed']].map(([key,tone])=><td key={key}><div className="nb61-readiness-progress"><span>{s[key]===null?'—':s[key]+'%'}</span><StatBar value={s[key]} tone={tone}/></div></td>)}</tr>)}
    {!data.readiness.length&&<tr><td colSpan={5} className="nb61-empty">No inventoried systems to show.</td></tr>}</tbody></table></div>
   </section>
   <section className="nb61-panel nb61-recent"><header className="nb61-panel-heading"><span className="nb61-panel-symbol"><Activity size={19}/></span><div><h2>Recorded activity</h2><p>Verified saves in this browser</p></div></header><div className="nb61-activity-list">{activity.map((entry:any,i:number)=><div className="nb61-activity" key={entry.id||i}><span className="nb61-activity-dot"/><div><strong>{entry.key==='nbdt_assignment_roster_v052'?'Assignment directory saved':'Project data saved'}</strong><small>{entry.action||'record.update'} · Local POC</small></div><time>{formatAudit(entry.at)}</time></div>)}
    {!activity.length&&<p className="nb61-empty">No recorded changes yet. Entries appear after a project or Assignment update is saved.</p>}</div></section>
   <section className="nb61-panel nb61-coverage"><header className="nb61-panel-heading"><span className="nb61-panel-symbol"><Users size={19}/></span><div><h2>Ownership coverage</h2><p>Exact name match with Assignment</p></div><NavButton onClick={()=>onNavigate('assignment')}>Assignment</NavButton></header>
    <div className="nb61-coverage-visual"><div className="nb61-coverage-ring" style={{background:data.coverage.total?`conic-gradient(#1675f5 ${100*data.coverage.unique/data.coverage.total}%, #f4b34d 0 ${100*(data.coverage.unique+data.coverage.shared)/data.coverage.total}%, #dfe8f4 0)`:'#e3edf8'}}><span><strong>{data.coverage.total}</strong><small>systems</small></span></div><div className="nb61-coverage-legend"><p><i className="nb61-l-unique"/>Assigned uniquely <strong>{data.coverage.unique}</strong></p><p><i className="nb61-l-shared"/>Multiple owners <strong>{data.coverage.shared}</strong></p><p><i className="nb61-l-none"/>No exact match <strong>{data.coverage.none}</strong></p></div></div>
    <p className="nb61-coverage-note"><Info size={14}/> {data.coverage.assignments} Assignment entries across {data.coverage.people} people; coverage counts only registered systems.</p>
   </section>
  </div>
  {data.referenceDemo&&<p className="nb61-reference-note"><Info size={14}/> Configuration totals include the existing illustrative, unlisted reference subtotal. They are not verified physical-device inventory.</p>}
 </section>;
}
