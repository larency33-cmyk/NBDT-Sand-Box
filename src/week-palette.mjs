/** Stable, low-saturation milestone header hues.
 *  Week colors are tied to absolute project week (0-based), not viewport order.
 *  Current week and selected week remain distinct UI states.
 */
export const WEEK_HEADER_TONES=Object.freeze(['blue','violet','orchid','mint']);
export function weekHeaderTone(weekIndex){
  if(!Number.isInteger(weekIndex)||weekIndex<0)throw new RangeError('Project week index must be a nonnegative integer');
  return WEEK_HEADER_TONES[((weekIndex-2)%WEEK_HEADER_TONES.length+WEEK_HEADER_TONES.length)%WEEK_HEADER_TONES.length];
}
