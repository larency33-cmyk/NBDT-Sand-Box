import {CYBER_STATUSES,normalizeCyberStatus} from './cyber-status.mjs';
/**
 * Applies report spreadsheets only to metadata of existing System Registry entries.
 * Device readiness and cyber approvals from accepted checklists cannot be imported
 * as aggregate counts; a spreadsheet is not deployment evidence.
 */
export function prepareReportMetadataImport(project, rows) {
  if (!Array.isArray(rows) || rows.length===0) throw Error('The report has no data rows');
  if (rows.length > 5000) throw Error('Report is too large (maximum 5,000 rows)');
  const systems = new Map((project.systems||[]).map(s=>[String(s.name).trim().toLowerCase(),s]));
  const members = new Map((project.members||[]).map(m=>[String(m.name).trim().toLowerCase(),m]));
  const seen = new Set();
  const prepared = [];
  for (const [index,row] of rows.entries()) {
    if (!row || typeof row !== 'object') throw Error(`Row ${index+2} has an invalid format`);
    const name = String(row.System??row.system??'').trim();
    if (!name) throw Error(`Row ${index+2} is missing System`);
    const key = name.toLowerCase();
    if (seen.has(key)) throw Error(`Duplicate system in import: ${name}`);
    seen.add(key);
    const system = systems.get(key);
    if (!system) throw Error(`Unknown system: ${name}. Only existing systems may be updated.`);
    const changes = {id:system.id};
    if (Object.hasOwn(row,'Owner') || Object.hasOwn(row,'owner')) {
      const owner = String(row.Owner??row.owner??'').trim();
      if (owner && owner.toLowerCase()!=='unassigned') {
        const member = members.get(owner.toLowerCase());
        if (!member) throw Error(`Row ${index+2}: unknown owner ${owner}`);
        if (member.id !== system.assigneeId) changes.assigneeId=member.id;
      } else if (system.assigneeId) changes.assigneeId='';
    }
    if (Object.hasOwn(row,'Cyber') || Object.hasOwn(row,'cyber')) {
      const rawValue = String(row.Cyber??row.cyber??'').trim();
      const value = normalizeCyberStatus(rawValue);
      if (!rawValue || !CYBER_STATUSES.includes(value)) throw Error(`Row ${index+2}: invalid Cyber status ${value}`);
      if (value !== normalizeCyberStatus(system.cyberStatus)) changes.cyberStatus=value;
    }
    if (Object.keys(changes).length>1) prepared.push(changes);
  }
  return prepared;
}
