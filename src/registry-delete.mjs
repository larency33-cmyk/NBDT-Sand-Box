/** Remove a System Registry record and all of its embedded guide / device
 * history, plus issue records that explicitly reference that system ID.
 *
 * Keep independent Weekly Tracker tasks and the separately managed Assignment
 * roster: neither is a child record of a System Registry card.
 */
export function deleteRegistrySystem(project,systemId){
 if(!systemId||!(project?.systems||[]).some(system=>system.id===systemId))
  throw Error('System no longer exists. Refresh System Registry.');
 return {
  ...project,
  systems:project.systems.filter(system=>system.id!==systemId),
  issues:(project.issues||[]).filter(issue=>issue.systemId!==systemId)
 };
}
