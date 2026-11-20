/** Only the Assignment roster determines who appears in Weekly Tracker.
 * Preserve historic task records, including tasks owned by now-absent employees.
 */
const key=value=>String(value??'').trim().replace(/\s+/g,' ').toLocaleUpperCase('en-US');
const canonicalId=personId=>'tracker-'+personId;

export function syncTrackerTeam(project,roster){
 const previous=Array.isArray(project.trackerMembers)?project.trackerMembers:(Array.isArray(project.members)?project.members:[]);
 const rosterPeople=Array.isArray(roster?.people)?roster.people:[];
 const used=new Set();
 const members=[];
 for(const person of rosterPeople){
  // Persistent Assignment IDs win over legacy names; ambiguous aliases are NOT guessed.
  let match=previous.find(member=>!used.has(member.id)&&member.assignmentPersonId===person.id);
  if(!match)match=previous.find(member=>!used.has(member.id)&&!member.assignmentPersonId&&key(member.name)===key(person.name));
  if(!match){
   const first=key(person.name).split(' ')[0];
   const candidates=previous.filter(member=>{
    if(used.has(member.id)||member.assignmentPersonId)return false;
    const alias=key(member.name);
    return alias.length>=3&&!/\s|\//.test(alias)&&first.startsWith(alias);
   });
   if(candidates.length===1)match=candidates[0];
  }
  let id=match?.id||canonicalId(person.id);
  // Every Assignment person must have a distinct Tracker ID; collisions never omit people.
  if(used.has(id)){
   id=canonicalId(person.id);
   let index=2;
   while(used.has(id))id=canonicalId(person.id)+'-'+index++;
  }
  used.add(id);
  members.push({...match,id,name:person.name,position:person.position||'',startDate:person.startDate||'',
   title:person.position||'',assignmentPersonId:person.id,isTeamLead:false,isLead:false});
 }
 // First import follows Assignment order. Thereafter respect manual drag order.
 const previouslySynced=project.trackerTeamSynced===true;
 if(previouslySynced){
  const order=new Map(previous.map((member,index)=>[member.id,index]));
  members.sort((a,b)=>(order.get(a.id)??Number.MAX_SAFE_INTEGER)-(order.get(b.id)??Number.MAX_SAFE_INTEGER));
 }
 const legacyOwners={...(project.trackerLegacyOwnerNames||{})};
 for(const member of previous){
  if(!used.has(member.id)&&member.name)legacyOwners[member.id]=member.name;
 }
 if(previouslySynced&&JSON.stringify(previous)===JSON.stringify(members)&&
    JSON.stringify(project.trackerLegacyOwnerNames||{})===JSON.stringify(legacyOwners))return project;
 return {...project,trackerMembers:members,trackerLegacyOwnerNames:legacyOwners,trackerTeamSynced:true};
}
/** Historical tasks with a primary owner no longer listed in Assignment.
 * Kept in storage, but never rendered as a synthetic Weekly Tracker person row.
 */
export function unlinkedTrackerTasks(project){
 const active=new Set((project.trackerMembers||[]).map(member=>member.id));
 return (project.tasks||[]).filter(task=>!task.isMilestone&&!active.has(task.memberId));
}
/** Safely reassign an orphaned historical task to an active Assignment person.
 * Other task fields, schedule, status and historical metadata remain intact.
 */
export function reassignUnlinkedTrackerTask(project,taskId,personId){
 const members=project.trackerMembers||[];
 if(!members.some(member=>member.id===personId))throw Error('Choose a current Assignment person.');
 const task=(project.tasks||[]).find(task=>task.id===taskId&&!task.isMilestone);
 if(!task)throw Error('Task not found.');
 if(members.some(member=>member.id===task.memberId))throw Error('Task already belongs to an active team member.');
 return {...project,tasks:project.tasks.map(item=>item.id===taskId?{
  ...item,memberId:personId,helperIds:(item.helperIds||[]).filter(id=>id!==personId),
  version:(item.version||0)+1
 }:item)};
}
/** A pointer above the hovered row midpoint means before; below means after. */
export function trackerDropPlacement(pointerY,top,height){
 return pointerY<top+height/2?'before':'after';
}
/** Drop position is relative to the hovered row, not its pre-removal index.
 * Preserve every employee ID, every task and the manually chosen row order.
 */
export function reorderTrackerMember(project,movingId,targetId,placement='before'){
 const members=project.trackerMembers||project.members||[];
 if(placement!=='before'&&placement!=='after')throw Error('Invalid drop placement.');
 const source=members.findIndex(m=>m.id===movingId);
 if(source<0||source===members.findIndex(m=>m.id===targetId))return project;
 const ordered=[...members];
 const [item]=ordered.splice(source,1);
 const destination=ordered.findIndex(m=>m.id===targetId);
 if(destination<0)return project;
 ordered.splice(destination+(placement==='after'?1:0),0,item);
 if(ordered.every((m,i)=>m.id===members[i].id))return project;
 return {...project,trackerMembers:ordered,trackerTeamSynced:true};
}
export function trackerWeekKey(personId,week){return personId+':'+week;}
export function isTrackerNotOnSite(project,personId,week){
 return project.trackerNotOnSite?.[trackerWeekKey(personId,week)]===true;
}
export function setTrackerNotOnSite(project,personId,week,value){
 if(!(project.trackerMembers||project.members)?.some(member=>member.id===personId))throw Error('Choose a valid team member.');
 if(!Number.isInteger(week)||week<0||week>=520)throw Error('Choose a valid project week.');
 const key=trackerWeekKey(personId,week);
 const prev=project.trackerNotOnSite||{};
 if(Boolean(prev[key])===Boolean(value))return project;
 const next={...prev};
 if(value)next[key]=true;else delete next[key];
 return {...project,trackerNotOnSite:next};
}
