import {STAGES,stageComplete,uid} from './model.mjs';
export const TECH_FIELDS=['deviceType','deviceCategory','os','osVersion','network','vlan','ipScope','ipReservation','serviceAccount','domainOU','airWatchTags','appList','namingConvention'];
export function profiles(system){return [{id:system.id,name:'Primary profile',...Object.fromEntries(TECH_FIELDS.map(k=>[k,system[k]])),publishedGuide:system.publishedGuide,guideDraft:system.guideDraft,valueStates:system.valueStates},...(system.endpointProfiles||[])];}
export function profileView(system,id){const p=profiles(system).find(p=>p.id===id);if(!p)throw Error('Profile not found');return {...system,...p,...Object.fromEntries(TECH_FIELDS.map(k=>[k,p[k]||''])),publishedGuide:p.publishedGuide||null,guideDraft:p.guideDraft||null,valueStates:p.valueStates||{},name:system.name,profileName:p.name,systemId:system.id,devices:(system.devices||[]).filter(d=>(d.profileId||system.id)===id),deviceRuns:(system.deviceRuns||[]).filter(r=>r.profileId===id)};}
export function mergeProfile(system,next){
 const otherDevices=(system.devices||[]).filter(d=>(d.profileId||system.id)!==next.id);
 const otherRuns=(system.deviceRuns||[]).filter(r=>r.profileId!==next.id);
 const inventory={devices:[...otherDevices,...(next.devices||[])],deviceRuns:[...otherRuns,...(next.deviceRuns||[])]};
 if(next.id===system.id)return {...system,...next,id:system.id,name:system.name,...inventory};
 const keys=[...TECH_FIELDS,'publishedGuide','guideDraft','valueStates','description','documentationUrl'];
 const changed=Object.fromEntries(keys.filter(k=>k in next).map(k=>[k,next[k]]));
 return {...system,endpointProfiles:(system.endpointProfiles||[]).map(p=>p.id===next.id?{...p,...changed,name:next.profileName||p.name}:p),...inventory};
}
export function migrateRun(run,guide,reason){if(!reason?.trim())throw Error('Migration reason required');if(run.accepted?.deployment)throw Error('Deployed runs require a separate reviewed rollback');return {id:uid(),deviceId:run.deviceId,profileId:run.profileId,guideVersion:guide.version,snapshot:structuredClone(guide),checks:{},results:{},accepted:{},migratedFrom:run.id,migrationReason:reason,createdAt:new Date().toISOString()};}
export function resultComplete(item,result,checked){if(result?.state==='not_applicable')return item.allowNA===true&&!!result.reason?.trim();if(item.evidenceRequired&&!result?.evidenceReference?.trim())return false;return checked===true&&result?.state!=='stale';}
export function preparationComplete(run){return !run?.snapshot?.preparationEnabled||(run.snapshot.preparationItems||[]).filter(i=>i.required!==false).every(i=>resultComplete(i,run.results?.[i.id],run.checks?.[i.id]));}
export function effectiveStatus(task,issues=[]){if((task.blockerIds||[]).some(id=>issues.some(i=>i.id===id&&!['Resolved','Closed'].includes(i.status))))return 'Blocked';return task.status;}
export function validateTask(t,members){const errors=[];if(!t.label?.trim())errors.push('Task title is required');if(!members.some(m=>m.id===t.memberId))errors.push('Choose an active Owner');const helpers=t.helperIds||[];if(helpers.includes(t.memberId)||new Set(helpers).size!==helpers.length)errors.push('Owner and Helpers must be distinct');if(helpers.some(id=>!members.some(m=>m.id===id)))errors.push('Helper is not a project member');if(!Number.isInteger(t.startWeek)||t.startWeek<0||t.startWeek>519)errors.push('Start week must be within 520 weeks');if(!Number.isInteger(t.duration)||t.duration<1||t.startWeek+t.duration>520)errors.push('Duration exceeds the 520-week planning range');if(t.dueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate))errors.push('Due date is invalid');return errors;}
export function isoWeek(value){const d=new Date(value+'T12:00:00Z');if(!Number.isFinite(d.getTime()))throw Error('Invalid date');const day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-day);const year=d.getUTCFullYear();const first=new Date(Date.UTC(year,0,1));return `${year}-W${String(Math.ceil((((d-first)/86400000)+1)/7)).padStart(2,'0')}`;}
export function projectToday(timezone='Europe/Paris',now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function csv(rows){return rows.map(row=>row.map(v=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
export function validateImport(project,incoming){const errors=[];if(!incoming||!Array.isArray(incoming.tasks)||!Array.isArray(incoming.systems)||!Array.isArray(incoming.members))return ['Expected project JSON with members, systems and tasks'];for(const key of ['tasks','systems','members']){const ids=incoming[key].map(x=>x.id);if(ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)errors.push('Missing or duplicate IDs in '+key);}for(const t of incoming.tasks)errors.push(...validateTask(t,incoming.members).map(e=>t.id+': '+e));const identities=incoming.systems.flatMap(s=>(s.devices||[]).map(d=>String(d.identity||'').trim().toLowerCase()));if(identities.some(x=>!x)||new Set(identities).size!==identities.length)errors.push('Missing or duplicate device identity');
 const allDevices=new Set(incoming.systems.flatMap(s=>(s.devices||[]).map(d=>d.id)));
 for(const s of incoming.systems){
  const profileIds=new Set([s.id,...(s.endpointProfiles||[]).map(p=>p.id)]);
  const systemDeviceIds=new Set((s.devices||[]).map(d=>d.id));
  for(const d of (s.devices||[]))if(!profileIds.has(d.profileId||s.id))errors.push(`Device ${d.id} references unknown profile`);
  const runs=new Set();for(const r of (s.deviceRuns||[])){
   if(!systemDeviceIds.has(r.deviceId))errors.push(`Run ${r.id} references a device outside its system`);
   if(!profileIds.has(r.profileId))errors.push(`Run ${r.id} references unknown profile`);
   if(!r.archived){const key=r.deviceId+'|'+r.profileId;if(runs.has(key))errors.push('Multiple active runs for device '+r.deviceId);runs.add(key);}
  }
 }
 return errors;}
