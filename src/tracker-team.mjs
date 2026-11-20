/** Weekly Tracker team is synchronized with the canonical Assignment roster.
 * Never delete or rewrite historic tasks during roster reconciliation.
 * Old tasks whose owners cannot be matched remain visible in the Unassigned lane.
 */
const key=value=>String(value??'').trim().replace(/\s+/g,' ').toLocaleUpperCase('en-US');
const canonicalId=personId=>'tracker-'+personId;
const isLead=member=>member?.isTeamLead||key(member?.name)==='TEAM LEAD';

export function syncTrackerTeam(project,roster){
 const previous=Array.isArray(project.trackerMembers)?project.trackerMembers:(Array.isArray(project.members)?project.members:[]);
 const rosterPeople=Array.isArray(roster?.people)?roster.people:[];
 const teamLead=previous.find(isLead)||{id:'m0',name:'TEAM LEAD',isLead:true,isTeamLead:true};
 const used=new Set([teamLead.id]);
 const members=[{...teamLead,isTeamLead:true}];
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
  const id=match?.id||canonicalId(person.id);
  // Never let roster collisions create duplicate React keys.
  if(used.has(id))continue;
  used.add(id);
  members.push({...match,id,name:person.name,position:person.position||'',startDate:person.startDate||'',
   title:person.position||'',assignmentPersonId:person.id,isTeamLead:false});
 }
 // First import follows Assignment order. Thereafter respect manual drag order.
 const previouslySynced=project.trackerTeamSynced===true;
 if(previouslySynced){
  const order=new Map(previous.map((member,index)=>[member.id,index]));
  members.sort((a,b)=>(order.get(a.id)??Number.MAX_SAFE_INTEGER)-(order.get(b.id)??Number.MAX_SAFE_INTEGER));
 }
 if(previouslySynced&&JSON.stringify(previous)===JSON.stringify(members))return project;
 return {...project,trackerMembers:members,trackerTeamSynced:true};
}
export function reorderTrackerMember(project,movingId,targetId){
 const members=project.trackerMembers||project.members||[];
 const source=members.findIndex(m=>m.id===movingId),target=members.findIndex(m=>m.id===targetId);
 if(source<0||target<0||source===target) return project;
 const ordered=[...members];
 const [item]=ordered.splice(source,1);
 ordered.splice(target,0,item);
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
