// Edit-mode project member management. All changes are immutable, so IndexedDB
// saves through the existing queued project commit mechanism.
export const UNASSIGNED_MEMBER_ID = '__unassigned__';
export const memberInitial = name => Array.from(String(name || '').trim())[0]?.toLocaleUpperCase() || '?';
export function cleanMemberName(value) {
 const name=String(value ?? '').trim().replace(/\s+/g,' ');
 if(!name || name.length>80) throw new Error('Name must contain 1–80 characters.');
 return name;
}
export function renameMember(project,id,value) {
 const name=cleanMemberName(value);
 if(!project.members.some(m=>m.id===id)) throw new Error('Team member no longer exists.');
 if(project.members.some(m=>m.id!==id && m.name.toLocaleLowerCase()===name.toLocaleLowerCase())) throw new Error('A team member with this name already exists.');
 return {...project,members:project.members.map(m=>m.id===id?{...m,name}:m)};
}
export function addMember(project,id,value) {
 const name=cleanMemberName(value);
 if(project.members.some(m=>m.id===id || m.name.toLocaleLowerCase()===name.toLocaleLowerCase())) throw new Error('A team member with this name already exists.');
 if(!id || id===UNASSIGNED_MEMBER_ID) throw new Error('Invalid member ID.');
 return {...project,members:[...project.members,{id,name}]};
}
export function removeMember(project,id) {
 if(!project.members.some(m=>m.id===id)) throw new Error('Team member no longer exists.');
 return {...project,
  members:project.members.filter(m=>m.id!==id),
  // Preserve history rather than deleting tasks. Former owners appear under Unassigned.
  tasks:project.tasks.map(t=>({...t,
   memberId:t.memberId===id?'':t.memberId,
   helperIds:(t.helperIds||[]).filter(helper=>helper!==id)
  })),
  // A removed member cannot continue owning a system.
  systems:(project.systems||[]).map(s=>s.assigneeId===id?{...s,assigneeId:''}:s)
 };
}
