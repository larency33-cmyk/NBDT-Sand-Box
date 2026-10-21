/** Shared-task mutations for the local project store. The caller commits the returned project atomically. */
export const STATUS_VALUES=['Planned','In Progress','Completed','Blocked'];
export function quickSetTaskStatus(project,taskId,changes,now=new Date()){
 const previous=project.tasks.find(t=>t.id===taskId);
 if(!previous||previous.isMilestone)throw Error('Task no longer exists. Refresh the project.');
 if(!STATUS_VALUES.includes(changes.status))throw Error('Invalid status');
 const linked=(previous.blockerIds||[]).some(id=>project.issues.some(i=>i.id===id&&!['Resolved','Closed'].includes(i.status)));
 if(changes.status!=='Blocked'&&linked)throw Error('Resolve linked blocking issues before changing this task status.');
 const reason=String(changes.blockReason??previous.blockReason??'').trim();
 if(changes.status==='Blocked'&&!reason&&!linked)throw Error('Please record a short blocker reason.');
 if(reason.length>2000)throw Error('Blocker reason is too long.');
 return {...project,tasks:project.tasks.map(t=>t.id===taskId?{
  ...t,status:changes.status,blockReason:changes.status==='Blocked'?reason:'',
  completedAt:changes.status==='Completed'?now.toISOString():undefined,
  version:(t.version||0)+1
 }:t)};
}
export function quickCreateAssignment(project,data,id){
 const label=String(data.label||'').trim();
 if(!label||label.length>160)throw Error('Task title must be 1–160 characters.');
 if(!Number.isInteger(data.startWeek)||data.startWeek<0||data.startWeek>=520)throw Error('Invalid project week.');
 if(!project.members.some(m=>m.id===data.memberId))throw Error('Selected employee no longer exists.');
 if(project.tasks.some(t=>t.id===id))throw Error('Duplicate task ID.');
 return {...project,tasks:[...project.tasks,{id,label,memberId:data.memberId,startWeek:data.startWeek,duration:1,status:'Planned',description:'',helperIds:[],checklist:[],version:1}]};
}
