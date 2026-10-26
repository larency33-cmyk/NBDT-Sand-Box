/** Shared read model for the System Registry: exactly the source displayed by
 * Guide > Technical essentials, without copying obsolete parallel form state.
 * A published guide has a versioned technicalSnapshot. If there is no snapshot,
 * the current primary endpoint fields remain the source of truth.
 */
export const DEVICE_TYPES = Object.freeze(['Phone','Tablet','PC','Laptop','Kiosk','POS','App only']);

export function guideTechnicalValues(system) {
  const snapshot = system?.publishedGuide?.technicalSnapshot;
  // Guide itself uses: publishedGuide?.technicalSnapshot || system.
  return snapshot && typeof snapshot === 'object' ? snapshot : (system || {});
}

export function registryCardFields(system) {
  const source = guideTechnicalValues(system);
  const text = value => typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
  const os = [text(source.os),text(source.osVersion)].filter(Boolean).join(' ');
  return {
    model: text(source.deviceType) || text(source.deviceCategory) || '—',
    os: os || '—',
    network: text(source.network) || '—',
    naming: text(source.namingConvention) || '—',
    category: text(source.deviceCategory) || text(system?.deviceCategory) || '',
    description: text(system?.description) || text(system?.documentation) || '',
  };
}

export function registryVisualType(system) {
  const fields = registryCardFields(system);
  const category = fields.category.toLowerCase();
  const model = fields.model.toLowerCase();
  const name = String(system?.name || '').toLowerCase();
  // Newly chosen categories are authoritative. The three legacy/demo entries
  // below had device categories that did not agree with their device model.
  if (category === 'app only' || category === 'app') return 'App only';
  if (category === 'pos') return 'POS';
  if ((/\bpoint of sale\b/.test(name) || /^pos[\s–-]*mobility\b/.test(name)) && !category.includes('phone')) {
    return name.includes('mobility') ? 'Phone' : 'POS';
  }
  if (/\b(tc22|xcover|iphone|smartphone)\b/.test(model) && category === 'tablet') return 'Phone';
  if (category === 'kiosk' || /\bkiosk\b/.test(name)) return 'Kiosk';
  const known = DEVICE_TYPES.find(type => type.toLowerCase() === category);
  if (known) return known;
  if (/\b(ipad|tablet)\b/.test(model)) return 'Tablet';
  if (/\b(laptop|notebook|macbook)\b/.test(model)) return 'Laptop';
  if (/\b(phone|xcover|tc22|iphone)\b/.test(model)) return 'Phone';
  if (/\bpos\b/.test(name)) return 'POS';
  return 'PC';
}
