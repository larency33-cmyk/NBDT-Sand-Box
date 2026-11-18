/** A single read model for Guide > Technical essentials and System Registry.
 * Last saved guide draft wins; otherwise read the published version. Legacy
 * system fields are only a migration fallback for profiles not yet edited.
 */
export const DEVICE_TYPES = Object.freeze(['Phone','Tablet','PC','Laptop','Kiosk','POS','App only']);

export function guideTechnicalValues(system) {
  const draft = system?.guideDraft?.technicalSnapshot;
  if (draft && typeof draft === 'object') return draft;
  const published = system?.publishedGuide?.technicalSnapshot;
  return published && typeof published === 'object' ? published : (system || {});
}

/** Hardware model, never a broad category such as PC/Phone/Tablet. Supports old snapshots. */
export function deviceModelValue(values) {
  const clean=value=>String(value??'').trim();
  const candidate=clean(values?.deviceModel)||clean(values?.deviceType);
  return DEVICE_TYPES.some(type=>type.toLowerCase()===candidate.toLowerCase())?'':candidate;
}

export function registryCardFields(system) {
  const source = guideTechnicalValues(system);
  const text = value => typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
  const os = [text(source.os),text(source.osVersion)].filter(Boolean).join(' ');
  return {
    model: deviceModelValue(source) || '—',
    os: os || '—',
    network: text(source.network) || '—',
    naming: text(source.namingConvention) || '—',
    category: text(source.deviceCategory) || text(system?.deviceCategory) || '',
    description: text(system?.description) || '',
  };
}

export function registryVisualType(system) {
  const fields = registryCardFields(system);
  const category = fields.category.toLowerCase();
  const model = fields.model.toLowerCase();
  const name = String(system?.name || '').toLowerCase();
  // Explicit Device Type is authoritative for BOTH registry and guide icons.
  // Only use model/name heuristics when older profiles have no category saved.
  if (category === 'app') return 'App only';
  const known = DEVICE_TYPES.find(type => type.toLowerCase() === category);
  if (known) return known;
  if (/\bkiosk\b/.test(name)) return 'Kiosk';
  if (/\b(ipad|tablet)\b/.test(model)) return 'Tablet';
  if (/\b(laptop|notebook|macbook)\b/.test(model)) return 'Laptop';
  if (/\b(phone|xcover|tc22|iphone)\b/.test(model)) return 'Phone';
  if (/\bpos\b/.test(name)) return 'POS';
  return 'PC';
}
