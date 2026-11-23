/**
 * Order System Registry matches without changing their membership.
 * Any case-insensitive substring match in the system NAME has priority over
 * description, device model, OS, network or naming-convention matches.
 * The original registry order is preserved within both groups.
 *
 * Filtering by owners, platform, type, connection and progress happens before
 * this function; those restrictions must never be lost when ordering matches.
 * @template {{name?: string}} T
 * @param {T[]} filteredSystems - Systems that already passed all active filters.
 * @param {string} query - Current Search systems input.
 * @returns {T[]}
 */
export function prioritizeRegistrySearchResults(filteredSystems, query) {
  const term = String(query ?? '').trim().toLowerCase();
  if (!term || filteredSystems.length < 2) return filteredSystems;
  // Stable two-bucket partition: a system's first match wins only by field,
  // not by its original location in the list or by partial text length.
  const nameMatches = [];
  const otherMatches = [];
  for (const system of filteredSystems) {
    if (String(system.name ?? '').toLowerCase().includes(term)) {
      nameMatches.push(system);
    } else {
      otherMatches.push(system);
    }
  }
  return [...nameMatches, ...otherMatches];
}
