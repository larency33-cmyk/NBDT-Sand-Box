/** NBDT v0.6.52 — single source of truth for system ownership. */
const PEOPLE = [
 ['HOMESHWAR HALKORI','ITO','2027-01-30'],
 ['SERGIU BURIU','ITO','2027-01-30'],
 ['DODY WAHYUDI','ITO','2027-01-30'],
 ['APPLE ESQUIVEL','ITO','2027-02-13'],
 ['ELVAN PRESTIN','ITO','2027-02-13'],
 ['RONNY TAPERA','ITO','2027-02-13'],
 ['ROB ISIP','ITO','2027-02-13'],
 ['CLAUDIO MONTEIRO','ITSS','2027-02-27'],
 ['DARON FRANKLYN','ITSS','2027-02-27'],
 ['ODDI A FERREIRA','ITO','2027-02-27'],
 ['NILSON PIANAR CALONA','ITSS','2027-02-27'],
 ['NADEEM ESSOP','ITSS','2027-03-13'],
 ['NISHANT TONDWALKAR','ITSS','2027-03-13']
];
// Each list is one person's column, in original Project 0…Project 12 order.
// Blank rows remain unassigned: positions are not tasks or status values.
const COLUMNS = [
 ['NextGen / General - Support'],
 ['NextGen TV / Genaral - Support','OHC - GPS (Embarkation & CIW)','OHC – Print Shop','OHC - On the Go','OHC - Concierges','OHC - Guest Services (Front Desk / Back Office)','OHC - Shipboard Financial Operations','Pre-Paid Gratuities','CashPro','OHC - APIS','OHC - SPMS'],
 ['NextGen TV / Genaral - Support','Frictionless Embarkation','OHC - Security (ACP)','OHC - SPMS','Royal Genies','OHC - Guest Services (Front Desk / Back Office)','OHC - Safety','OHC – Crew / Crew Office','Mobile Gangway','OHC - Fleet Management System'],
 ['NextGen TV / Genaral - Support','AffairWhere','GHS','POS - Lead','POS - Mobility - Lead','Guest Sense','Crew Manager'],
 ['NextGen TV / Genaral - Support','Room Service','Bingo','CrunchTime','XDining','POS - support','POS - Mobility - Support','Project Lighthouse','Virtual Queue'],
 ['NextGen TV / Genaral - Support','Nex Playground','Digital Gaming Tables','Jukebox','Storybook','Check-in / Check-out App','Registration App','IssuTrax','ShowTickets','Smart Services','MGSO','WOW Band (Encoding) App'],
 ['NextGen TV / Genaral - Support','Photo','Photo - Video capture','Behind the Pearl','Shore Excursions','Next Cruise','Stateroom Attendant App','Housekeeping Tablets','Housekeeping Robots','Housekeeping Inventory Management','Towel Managment'],
 ['NextGen TV / Genaral - Support','Digital Signage','Crew Debit','OnVoy','Room Automation','Spa (OneApp)','SeaTime (Time & Attendance)'],
 ['NextGen TV / Genaral - Support','Lifeguard / Starguard Elite','Riskonnect','eWaiver','NextGen SQM','AMOS','Mobile TeleHealth','Visionline (Door Locks)','Digital Manager','Butterfly','SeaCare & Piccolo','SeaEvent','Up to date'],
 ['NextGen TV / Genaral - Support','Casino – Bravo (Tables)','Casino – Currency Counter','Casino - Everi CashClub','Casino – Everi TITO Kiosk','Casino – Key Watcher','Casino – Oasis 360 (Slots)','Casino - Sovos Tax System','Arcade','SeaPay','eMustering'],
 ['General Support','NextGen TV - Core team','SimpleK','Bank of America Tablets','FPMS/QControl','Safe Return to Port'],
 ['General Support','NexGen TV - Lead','NextGen TV - Virtual Balcony','NextGen TV - Streaming'],
 ['General Support','NextGen TV - Core team','TimePlay','Catena','Safety Culture','Icafe']
];
export const ASSIGNMENT_STORAGE_KEY='nbdt_assignment_roster_v052';
export const initialAssignmentRoster = () => ({
 schemaVersion:1,
 people:PEOPLE.map(([name,position,startDate],i)=>({id:`assignment-person-${i+1}`,name,position,startDate})),
 items:COLUMNS.flatMap((systems,i)=>systems.map((name,order)=>({id:`assignment-item-${i+1}-${order}`,personId:`assignment-person-${i+1}`,name,order})))
});
/** Exact full-name matching. Only casing and surplus whitespace are ignored. */
export const assignmentKey = name => String(name||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US');
export function resolveAssignmentOwner(roster,systemName){
 const key=assignmentKey(systemName);
 if(!key)return {status:'none',names:[],personIds:[],label:null};
 const people=new Map((roster?.people||[]).map(p=>[p.id,p]));
 const names=[],ids=[];
 for(const item of roster?.items||[]){
  if(assignmentKey(item.name)!==key)continue;
  const person=people.get(item.personId);
  if(person&&!ids.includes(person.id)){ids.push(person.id);names.push(person.name);}
 }
 return names.length===0?{status:'none',names:[],personIds:[],label:null}:
  {status:names.length>1?'shared':'unique',names,personIds:ids,label:names.join(' · ')};
}
export function assignmentRows(roster){
 const counts=(roster?.people||[]).map(p=>(roster?.items||[]).filter(i=>i.personId===p.id).length);
 return Math.max(13,0,...counts);
}
export function addAssignment(roster,personId,name){
 if(!roster.people.some(p=>p.id===personId))throw Error('Unknown assignment owner');
 const clean=String(name||'').trim();if(!clean||clean.length>180)throw Error('Enter a system name (1–180 characters)');
 const items=roster.items.filter(i=>i.personId===personId),order=items.length;
 const id=globalThis.crypto?.randomUUID?.()||`assignment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
 return {...roster,items:[...roster.items,{id,personId,name:clean,order}]};
}
export function editAssignment(roster,id,name){
 if(!roster.items.some(i=>i.id===id))throw Error('Assignment not found');
 const clean=String(name||'').trim();if(clean.length>180)throw Error('Maximum 180 characters');
 if(!clean)return removeAssignment(roster,id);
 return {...roster,items:roster.items.map(i=>i.id===id?{...i,name:clean}:i)};
}
export function removeAssignment(roster,id){
 if(!roster.items.some(i=>i.id===id))throw Error('Assignment not found');
 return {...roster,items:reorder(roster.items.filter(i=>i.id!==id))};
}
function reorder(items){
 const ordinals=new Map();
 return items.map(i=>{const order=ordinals.get(i.personId)||0;ordinals.set(i.personId,order+1);return {...i,order};});
}
export function moveAssignment(roster,id,toPersonId,toIndex=Infinity){
 if(!roster.people.some(p=>p.id===toPersonId))throw Error('Unknown destination owner');
 const item=roster.items.find(i=>i.id===id);if(!item)throw Error('Assignment not found');
 const remaining=roster.items.filter(i=>i.id!==id),destination=remaining.filter(i=>i.personId===toPersonId).sort((a,b)=>a.order-b.order);
 const offset=Math.max(0,Math.min(destination.length,Number.isFinite(toIndex)?Math.trunc(toIndex):destination.length));
 destination.splice(offset,0,{...item,personId:toPersonId});
 const result=[];
 for(const person of roster.people){
  const entries=person.id===toPersonId?destination:remaining.filter(i=>i.personId===person.id).sort((a,b)=>a.order-b.order);
  entries.forEach((entry,order)=>result.push({...entry,order}));
 }
 return {...roster,items:result};
}
export function projectWithAssignmentOwners(project,roster){
 return {...project,assignmentRoster:roster,
  systems:project.systems.map(system=>{
   const resolved=resolveAssignmentOwner(roster,system.name);
   return resolved.status==='none'?system:{...system,assignmentOwnerStatus:resolved.status,assignmentOwnerNames:resolved.names,
    assignmentOwnerLabel:resolved.label};
  }),
  tasks:project.tasks.map(task=>{
   const linkedSystem=project.systems.find(system=>system.id===task.systemId);
   const resolved=resolveAssignmentOwner(roster,linkedSystem?.name||task.label);
   return resolved.status==='none'?task:{...task,assignmentOwnerStatus:resolved.status,assignmentOwnerLabel:resolved.label};
  })};
}
