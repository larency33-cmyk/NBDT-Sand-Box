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


/** Inline task actions — task identity is stable for edits; moving creates a new week-bound record. */
export function quickEditTask(project,taskId,changes){
 const task=project.tasks.find(t=>t.id===taskId&&!t.isMilestone);
 if(!task)throw Error('Task no longer exists.');
 const label=String(changes.label??task.label).trim();
 if(!label||label.length>160)throw Error('Task title must be 1–160 characters.');
 const description=String(changes.description??task.description??'');
 if(description.length>10000)throw Error('Description is too long.');
 const memberId=changes.memberId??task.memberId;
 if(!project.members.some(m=>m.id===memberId))throw Error('Choose a valid owner.');
 const systemId=changes.systemId??task.systemId??'';
 if(systemId&&!project.systems.some(s=>s.id===systemId))throw Error('Selected system does not exist.');
 const startWeek=changes.startWeek===undefined?task.startWeek:Number(changes.startWeek);
 const duration=changes.duration===undefined?task.duration:Number(changes.duration);
 if(!Number.isInteger(startWeek)||startWeek<0||startWeek>=520||!Number.isInteger(duration)||duration<1||startWeek+duration>520)throw Error('Invalid project-week schedule.');
 const dueDate=changes.dueDate??task.dueDate??'';
 if(dueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))throw Error('Invalid due date.');
 const next={...task,label,description,memberId,systemId,startWeek,duration,dueDate,helperIds:(task.helperIds||[]).filter(id=>id!==memberId),version:(task.version||0)+1};
 return {...project,tasks:project.tasks.map(t=>t.id===taskId?next:t)};
}
export function quickDeleteTask(project,taskId){
 if(!project.tasks.some(t=>t.id===taskId&&!t.isMilestone))throw Error('Task no longer exists.');
 return {...project,tasks:project.tasks.filter(t=>t.id!==taskId)};
}
/** Move the assignment in the selected week to the immediately following project week.
 * For an old multi-week record, preserve unaffected historical weeks, replace
 * its next-week occurrence instead of duplicating it, and retain later weeks.
 */
export function quickMoveTaskToNextWeek(project,taskId,selectedWeek,newId,continuationId){
 const task=project.tasks.find(t=>t.id===taskId&&!t.isMilestone);
 if(!task)throw Error('Task no longer exists.');
 if(!Number.isInteger(selectedWeek)||selectedWeek<task.startWeek||selectedWeek>=task.startWeek+task.duration)throw Error('Task is not scheduled for this week.');
 if(selectedWeek>=519)throw Error('This is the last supported project week.');
 if(!newId||!continuationId||newId===continuationId||project.tasks.some(t=>t.id===newId||t.id===continuationId))throw Error('New task IDs must be unique.');
 const priorLength=selectedWeek-task.startWeek;
 const afterStart=selectedWeek+2;
 const afterLength=Math.max(0,task.startWeek+task.duration-afterStart);
 const history={sourceTaskId:task.id,sourceWeek:selectedWeek+1,movedAt:new Date().toISOString()};
 const moved={...task,id:newId,startWeek:selectedWeek+1,duration:1,dueDate:'',status:task.status==='Completed'?'Planned':task.status,blockReason:task.status==='Completed'?'':(task.blockReason||''),completedAt:undefined,blockerIds:task.status==='Completed'?[]:(task.blockerIds||[]),checklist:(task.checklist||[]).map(item=>({...item,completed:false})),moveHistory:[...(task.moveHistory||[]),history],version:1};
 const preserved=[];
 if(priorLength>0)preserved.push({...task,duration:priorLength,version:(task.version||0)+1});
 if(afterLength>0)preserved.push({...task,id:continuationId,startWeek:afterStart,duration:afterLength,version:1});
 return {...project,tasks:[...project.tasks.filter(t=>t.id!==taskId),...preserved,moved]};
}
export function quickSaveMilestone(project,values,id){
 const label=String(values.label||'').trim();
 if(!label||label.length>160)throw Error('Milestone name must be 1–160 characters.');
 if(!Number.isInteger(values.startWeek)||values.startWeek<0||values.startWeek>=520)throw Error('Invalid milestone week.');
 const previous=project.tasks.find(t=>t.id===id);
 if(previous&&!previous.isMilestone)throw Error('This ID is reserved for an assignment.');
 const next={...previous,...values,id,label,isMilestone:true,memberId:'milestones',duration:1,status:'Planned',version:(previous?.version||0)+1};
 return {...project,tasks:previous?project.tasks.map(t=>t.id===id?next:t):[...project.tasks,next]};
}
