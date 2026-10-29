/** Cyber status display and storage compatibility for existing browser-local reports.
 * The legacy Unknown value is displayed as Not Started without destroying stored data.
 */
export const CYBER_STATUSES = Object.freeze(['Not Started','Review','Approved','Blocked','N/A']);
export function normalizeCyberStatus(value) {
 const raw=String(value??'').trim();
 return raw===''||raw==='Unknown'?'Not Started':raw;
}
