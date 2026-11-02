/** NBDT v0.6.63 — user-visible change feed, not a security audit trail.
 * Diff actual, successfully saved project data. Never log credentials, internal IDs or secrets.
 * Works on legacy records that have no activityLog. No automatic seed/migration events.
 */
export const MAX_ACTIVITY_ENTRIES = 200;
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const readable=v=>String(v??'—').slice(0,64);
const compact=s=>String(s||'').replace(/\s+/g,' ').trim().slice(0,130);
export const mergeActivity=(prior,newEntries,at=new Date().toISOString())=>[
  ...newEntries.map((entry,i)=>({...entry,at,id:`activity-${Date.now()}-${i}-${Math.random().toString(36).slice(2,8)}`})),
  ...(Array.isArray(prior)?prior:[])
].slice(0,MAX_ACTIVITY_ENTRIES);
function diffCollection(before=[],after=[],group,details){
 const result=[],oldMap=new Map(before.map(v=>[v.id,v]));
 const newMap=new Map(after.map(v=>[v.id,v]));
 for(const item of after){
  const prev=oldMap.get(item.id);
  if(!prev){result.push({title:`${group} added`,detail:compact(item.name||item.label||item.title||'New entry'),section:group});continue;}
  if(!equal(prev,item))result.push(details(prev,item));
 }
 for(const item of before)if(!newMap.has(item.id))result.push({title:`${group} deleted`,detail:compact(item.name||item.label||item.title||'Removed entry'),section:group});
 return result;
}
const changed=(a,b,k)=>!equal(a?.[k],b?.[k]);
const diffSystem=(a,b)=>{
 const system=compact(b.name||a.name||'System');
 const fields=[];
 const entry=(title,detail)=>({title,detail:compact(`${system} · ${detail}`),section:'Systems'});
 if(changed(a,b,'name'))fields.push(`Name: ${readable(a.name)} → ${readable(b.name)}`);
 if(changed(a,b,'cyberStatus'))fields.push(`Cyber: ${readable(a.cyberStatus)} → ${readable(b.cyberStatus)}`);
 if(changed(a,b,'reportMetrics')){
  for(const [key,label] of [['total','Quantity'],['base','Base'],['ready','Ready'],['deployed','Deployed']])
   if(changed(a.reportMetrics,b.reportMetrics,key))fields.push(`${label}: ${readable(a.reportMetrics?.[key])} → ${readable(b.reportMetrics?.[key])}`);
 }
 for(const [key,label] of [['reportVenue','Venue'],['reportAW','AW'],['reportOwnerName','Owner'],['assigneeId','Assigned member'],['description','Description'],['deviceType','Device'],['os','OS'],['network','Network'],['namingConvention','Naming'],['appList','Applications'],['documentationUrl','Documentation']])
  if(changed(a,b,key))fields.push(label+' changed');
 const oldLessons=a.lessonsLearnedItems||[];
 const newLessons=b.lessonsLearnedItems||[];
 if(!equal(oldLessons,newLessons)||changed(a,b,'lessonsLearned')){
  if(newLessons.length>oldLessons.length)fields.push(`${newLessons.length-oldLessons.length} lesson(s) added`);
  else if(newLessons.length<oldLessons.length)fields.push(`${oldLessons.length-newLessons.length} lesson(s) removed`);
  else fields.push('Lessons learned updated');
 }
 for(const [key,label] of [['publishedGuide','Configuration guide'],['guideDraft','Guide draft'],['guideReview','Guide verification'],['checkSheetData','Checklist'],['devices','Device inventory'],['deviceRuns','Device configuration']])
  if(changed(a,b,key))fields.push(`${label} updated`);
 if(fields.length===0)fields.push('System details updated');
 return entry('System updated',fields.slice(0,3).join('; ')+(fields.length>3?` (+${fields.length-3} more)`:''));
};
const diffTask=(a,b)=>{
 const name=compact(b.label||a.label||'Task');
 const changes=[];
 if(changed(a,b,'status'))changes.push(`Status: ${readable(a.status)} → ${readable(b.status)}`);
 if(changed(a,b,'label'))changes.push(`Name: ${readable(a.label)} → ${readable(b.label)}`);
 if(changed(a,b,'startWeek'))changes.push(`Week: ${Number(a.startWeek)+1} → ${Number(b.startWeek)+1}`);
 if(changed(a,b,'memberId'))changes.push('Assignee changed');
 if(changed(a,b,'description'))changes.push('Description edited');
 if(changed(a,b,'blockReason'))changes.push('Blocker updated');
 if(changed(a,b,'checklist'))changes.push('Checklist updated');
 if(!changes.length)changes.push('Details updated');
 return {title:b.isMilestone?'Milestone updated':'Task updated',detail:compact(`${name} · ${changes.slice(0,2).join('; ')}`),section:b.isMilestone?'Milestones':'Weekly Tracker'};
};
const diffIssue=(a,b)=>{
 const changes=[];
 for(const [key,label] of [['status','Status'],['severity','Severity'],['assigneeId','Assignee']])
  if(changed(a,b,key))changes.push(`${label}: ${readable(a[key])} → ${readable(b[key])}`);
 if(changed(a,b,'title'))changes.push('Title updated');
 if(changed(a,b,'description'))changes.push('Description updated');
 if(!changes.length)changes.push('Details updated');
 return {title:'Issue updated',detail:compact(`${b.title||a.title} · ${changes.slice(0,2).join('; ')}`),section:'Issues'};
};
const diffMember=(a,b)=>({title:'Team member updated',detail:compact(`${b.name||a.name} · ${changed(a,b,'name')?'Name changed':'Profile updated'}`),section:'Weekly Tracker'});
/** Returns only meaningful user-facing mutations. `version` / `updatedAt` changes are ignored. */
export function deriveProjectActivity(before,after){
 const entries=[];
 if(before.name!==after.name)entries.push({title:'Project renamed',detail:compact(`${before.name} → ${after.name}`),section:'Overview'});
 if(before.startDate!==after.startDate)entries.push({title:'Project start changed',detail:`${readable(before.startDate)} → ${readable(after.startDate)}`,section:'Weekly Tracker'});
 entries.push(...diffCollection(before.systems||[],after.systems||[],'System',diffSystem));
 entries.push(...diffCollection(before.issues||[],after.issues||[],'Issue',diffIssue));
 entries.push(...diffCollection(before.tasks||[],after.tasks||[],'Task',diffTask));
 entries.push(...diffCollection(before.members||[],after.members||[],'Team member',diffMember));
 // Avoid a single large spreadsheet import starving recent activity.
 if(entries.length>30)return [{title:'Bulk project update',detail:`${entries.length} records changed across the project`,section:'Overview'},...entries.slice(0,29)];
 return entries;
}
/** Changes to the separately persisted Assignment source of truth. */
export function deriveAssignmentActivity(before,after){
 const entries=[];
 const peopleBefore=new Map((before?.people||[]).map(p=>[p.id,p]));
 const peopleAfter=new Map((after?.people||[]).map(p=>[p.id,p]));
 const owner=id=>peopleAfter.get(id)?.name||peopleBefore.get(id)?.name||'Unassigned';
 for(const person of after?.people||[]){
  const old=peopleBefore.get(person.id);
  if(!old)entries.push({title:'Team member added',detail:compact(`${person.name} · ${person.position}`),section:'Assignment'});
  else if(!equal([old.name,old.position,old.startDate],[person.name,person.position,person.startDate]))
    entries.push({title:'Team member edited',detail:compact(person.name+' · profile changed'),section:'Assignment'});
 }
 for(const person of before?.people||[])if(!peopleAfter.has(person.id))entries.push({title:'Team member removed',detail:compact(person.name),section:'Assignment'});
 const prior=new Map((before?.items||[]).map(i=>[i.id,i]));
 const next=new Map((after?.items||[]).map(i=>[i.id,i]));
 for(const item of after?.items||[]){
  const old=prior.get(item.id);
  if(!old)entries.push({title:'System assigned',detail:compact(`${item.name} → ${owner(item.personId)}`),section:'Assignment'});
  else if(old.personId!==item.personId)entries.push({title:'System owner changed',detail:compact(`${item.name}: ${owner(old.personId)} → ${owner(item.personId)}`),section:'Assignment'});
  else if(old.name!==item.name)entries.push({title:'Assignment renamed',detail:compact(`${old.name} → ${item.name}`),section:'Assignment'});
 }
 for(const item of before?.items||[])if(!next.has(item.id))entries.push({title:'System unassigned',detail:compact(`${item.name} · ${owner(item.personId)}`),section:'Assignment'});
 if(!entries.length&& !equal((before?.people||[]).map(p=>p.id),(after?.people||[]).map(p=>p.id)))
   entries.push({title:'Employee columns reordered',detail:'Assignment column order updated',section:'Assignment'});
 if(entries.length>30)return [{title:'Assignment bulk update',detail:`${entries.length} changes saved`,section:'Assignment'},...entries.slice(0,29)];
 return entries;
}
