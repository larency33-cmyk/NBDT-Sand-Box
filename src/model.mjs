export const STAGES = ['configuration','readyForDeployment','deployment'];
export const LABELS = {configuration:'Base Configuration',readyForDeployment:'Ready for Deployment',deployment:'Deployment'};
export const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function localDate(value) { const [y,m,d]=String(value).split('-').map(Number); const date=new Date(y,m-1,d); return Number.isFinite(date.getTime()) ? date : new Date(2026,0,5); }
export function dateText(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function weekRange(start,w) { const a=localDate(start); a.setDate(a.getDate()+w*7); const b=new Date(a);b.setDate(b.getDate()+6);return `${a.toLocaleDateString('en-GB',{day:'numeric',month:'short'})} - ${b.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}`; }
export function dueDate(start,t) { if(t.dueDate)return t.dueDate;const d=localDate(start);d.setDate(d.getDate()+(t.startWeek+t.duration)*7-1);return dateText(d); }
export function safeUrl(value) { try { const u=new URL(value); return u.protocol==='https:'&&!u.username&&!u.password ? u.href : null; } catch { return null; } }
export function validateGuide(sys,guide) {
 const errors=[];if(!guide?.stages) return ['No guide stages'];
 const ids=new Set(); for(const stage of STAGES)for(const item of guide.stages[stage]||[]) {
  if(!item.label?.trim())errors.push('Every step needs a label'); if(item.platforms?.length&&!item.platforms.includes(sys.os))errors.push('Step is not applicable to selected platform');
  if(ids.has(item.id))errors.push('Duplicate step ID');ids.add(item.id);
  if(['iOS','iPadOS','Android'].includes(sys.os)&& /\b(BIOS|TPM|UEFI|Windows Domain Join|Domain Join|Windows Registry|Group Policy|GPO)\b/i.test(item.label))errors.push(`Incompatible platform step: ${item.label}`);
 }
 if(STAGES.some(s=>!(guide.stages[s]||[]).length))errors.push('Each stage needs at least one reviewed step');
 return errors;
}
export function newGuide() { return {version:1,platform:'',preparationEnabled:false,preparationItems:[],stages:Object.fromEntries(STAGES.map(s=>[s,[]]))}; }
export function runFor(sys,device) { if(!device)return undefined;return (sys.deviceRuns||[]).find(r=>r.deviceId===device.id&&r.profileId===(device.profileId||sys.id)&&!r.archived); }
export function stageComplete(run,stage) { const items=run?.snapshot?.stages?.[stage]||[];return items.length>0&&items.every(i=>i.required===false||((run.results?.[i.id]?.state==='not_applicable'&&i.allowNA===true&&!!run.results[i.id].reason?.trim())||(run.checks?.[i.id]===true&&run.results?.[i.id]?.state!=='stale'&&(!i.evidenceRequired||!!run.results?.[i.id]?.evidenceReference?.trim())))); }
export function canAccept(run,stage) { const index=STAGES.indexOf(stage);return index>=0&&stageComplete(run,stage)&&STAGES.slice(0,index).every(s=>!!run.accepted?.[s]&&stageComplete(run,s)); }
export function setCheck(run,stage,id,checked) { if(!STAGES.includes(stage)||!STAGES.slice(0,STAGES.indexOf(stage)).every(s=>!!run.accepted?.[s]&&stageComplete(run,s)))throw Error('Previous stages must be accepted'); if(!(run.snapshot.stages[stage]||[]).some(i=>i.id===id))throw Error('Unknown step'); const accepted={...run.accepted};for(const s of STAGES.slice(STAGES.indexOf(stage)))delete accepted[s];return {...run,checks:{...run.checks,[id]:!!checked},results:{...run.results,[id]:{...run.results?.[id],state:checked?'completed':'pending',updatedAt:new Date().toISOString()}},accepted}; }
export function acceptStage(run,stage) { if(!canAccept(run,stage))throw Error('Complete required steps and accept previous stages first');return {...run,accepted:{...run.accepted,[stage]:new Date().toISOString()}}; }
export function counts(sys) { const devices=[...new Map((sys.devices||[]).filter(d=>d.inScope!==false&&!d.archivedAt).map(d=>[d.id,d])).values()]; const valid=devices.map(d=>(sys.deviceRuns||[]).find(r=>r.deviceId===d.id&&r.profileId===(d.profileId||sys.id)&&!r.archived)); const accepted=(r,s)=>!!r&&STAGES.slice(0,STAGES.indexOf(s)+1).every(k=>!!r.accepted?.[k]&&stageComplete(r,k));return {total:devices.length,base:valid.filter(r=>accepted(r,'configuration')).length,ready:valid.filter(r=>accepted(r,'readyForDeployment')).length,deployed:valid.filter(r=>accepted(r,'deployment')).length}; }
export function assignments(task) { return [...new Set([task.memberId,...(task.helperIds||[])].filter(Boolean))]; }

export function setResult(run,stage,id,result){const item=(run.snapshot.stages[stage]||[]).find(i=>i.id===id);if(!item)throw Error('Unknown item');if(result.state==='not_applicable'&&(!item.allowNA||!result.reason?.trim()))throw Error('N/A requires permission and reason');const next=setCheck(run,stage,id,result.state==='completed');return {...next,results:{...next.results,[id]:{...result,updatedAt:new Date().toISOString()}}};}
