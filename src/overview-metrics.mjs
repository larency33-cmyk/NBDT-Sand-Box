/** Overview v0.6.61: all values are derived from the same project and roster
 * currently used by Weekly Tracker, Issue Tracker and Configuration Report.
 * No placeholder deltas, invented milestones or composite completion score.
 */
import {counts} from './model.mjs';
import {reportCounts} from './reference-report.mjs';
import {resolveAssignmentOwner} from './assignment-roster.mjs';
import {currentWeekIndex,projectWeekDate,shiftISODate,validDate} from './schedule.mjs';

const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
export const pct = (n,total) => total > 0 ? Math.round(100 * n / total) : null;
const severityWeight = {Critical:4,High:3,Medium:2,Low:1};
const STATUSES = ['Planned','In Progress','Blocked','Completed'];

export function buildOverviewData(project,roster,now=new Date()){
 const systems=project?.systems||[],tasks=project?.tasks||[],issues=project?.issues||[];
 const summary=reportCounts(project,counts);
 const kpis=[
  {key:'base',title:'Base Configuration',value:summary.base,total:summary.total,unit:'devices'},
  {key:'ready',title:'Ready for Deployment',value:summary.ready,total:summary.total,unit:'devices'},
  {key:'deployed',title:'Deployed',value:summary.deployed,total:summary.total,unit:'devices'},
  {key:'cyber',title:'Cyber Approved',value:summary.cyberApproved,total:summary.cyberApplicable,unit:'applicable systems'},
 ].map(item=>({...item,percent:pct(item.value,item.total)}));
 const activeIssues=issues.filter(i=>i.status!=='Resolved');
 const issueBySystem=new Map();for(const issue of activeIssues){const arr=issueBySystem.get(issue.systemId)||[];arr.push(issue);issueBySystem.set(issue.systemId,arr);}
 const pendingTasks=tasks.filter(t=>!t.isMilestone&&t.status==='Blocked');
 const attention=systems.map(sys=>{
  const c=counts(sys),sysIssues=(issueBySystem.get(sys.id)||[]).sort((a,b)=>(severityWeight[b.severity]||0)-(severityWeight[a.severity]||0));
  const blocked=pendingTasks.filter(t=>t.systemId===sys.id || (!t.systemId&&t.label===sys.name));
  const owner=resolveAssignmentOwner(roster,sys.name);
  const unconfigured=Math.max(0,finite(c.total)-finite(c.base));
  const notDeployed=Math.max(0,finite(c.total)-finite(c.deployed));
  const relevant=sysIssues.length>0||blocked.length>0||(c.total>0&&(unconfigured>0||notDeployed>0));
  const main=sysIssues[0];
  const reason=main?main.title:blocked.length?`${blocked.length} blocked task${blocked.length===1?'':'s'}`:unconfigured>0?`${unconfigured.toLocaleString('en-US')} not base configured`:notDeployed>0?`${notDeployed.toLocaleString('en-US')} not deployed`:'';
  return {id:sys.id,name:sys.name,model:sys.deviceType||sys.deviceCategory||'',owner:owner.status==='unique'?owner.names[0]:owner.status==='shared'?'Multiple owners':'Not matched',ownerStatus:owner.status,reason,severity:main?.severity|| (blocked.length?'Blocked':null),issueId:main?.id||null,progress:pct(c.base,c.total),unconfigured,notDeployed,issueCount:sysIssues.length,blockedCount:blocked.length,important:!!main||blocked.length>0,weight:main?severityWeight[main.severity]||0:blocked.length?2:0,quantity:c.total,relevant};
 }).filter(row=>row.relevant).sort((a,b)=>b.weight-a.weight||b.blockedCount-a.blockedCount||b.unconfigured-a.unconfigured||b.notDeployed-a.notDeployed||a.name.localeCompare(b.name));
 const timezone=project.timezone||'Europe/Paris';
 const hasStart=validDate(project?.startDate);
 const rawWeek=hasStart?currentWeekIndex(project.startDate,timezone,now):null;
 const weekIndex=rawWeek===null?0:Math.max(0,rawWeek);
 const today=now instanceof Date?now:new Date(now);
 const currentTasks=tasks.filter(t=>hasStart&&!t.isMilestone&&t.startWeek<=weekIndex&&t.startWeek+Math.max(1,finite(t.duration))>weekIndex);
 const weekCounts=Object.fromEntries(STATUSES.map(status=>[status,currentTasks.filter(t=>t.status===status).length]));
 const weekStart=hasStart?projectWeekDate(project.startDate,weekIndex):'',weekEnd=hasStart?shiftISODate(weekStart,6):'';
 const milestoneRows=tasks.filter(t=>hasStart&&t.isMilestone).map(t=>({id:t.id,title:t.label,date:t.date||projectWeekDate(project.startDate,t.startWeek)}))
  .filter(m=>m.date>=weekStart&&m.date<=shiftISODate(weekEnd,7)).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title));
 const issueCounts={total:activeIssues.length,critical:activeIssues.filter(i=>i.severity==='Critical').length,high:activeIssues.filter(i=>i.severity==='High').length};
 const coverage={unique:0,shared:0,none:0};for(const s of systems){coverage[resolveAssignmentOwner(roster,s.name).status]++;}
 const readiness=systems.map(sys=>{const c=counts(sys);return {id:sys.id,name:sys.name,venue:sys.reportVenue||'—',...c,basePct:pct(c.base,c.total),readyPct:pct(c.ready,c.total),deployedPct:pct(c.deployed,c.total),owner:resolveAssignmentOwner(roster,sys.name)};})
  .filter(s=>s.total>0).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name));
 return {kpis,summary,attention,attentionCount:attention.length,activeIssues,issueCounts,
  week:{index:weekIndex,label:hasStart?`Week ${weekIndex+1}`:'Week not set',start:weekStart,end:weekEnd,counts:weekCounts,total:currentTasks.length,milestones:milestoneRows,blocked:currentTasks.filter(t=>t.status==='Blocked')},
  coverage:{...coverage,total:systems.length,people:roster?.people?.length||0,assignments:roster?.items?.length||0},readiness,
  referenceDemo:!!project.referenceDemoTotals,asOf:today.toISOString()};
}
