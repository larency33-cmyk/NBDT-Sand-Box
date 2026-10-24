/** Navigation steps for a four-column project-week viewport.
 * Week indexes are zero-based and never depend on calendar ISO week numbers.
 */
export const PROJECT_WEEK_LIMIT = 520;
export const VISIBLE_WEEK_COLUMNS = 4;

export function clampWeekViewport(firstWeek, totalWeeks = PROJECT_WEEK_LIMIT, visibleColumns = VISIBLE_WEEK_COLUMNS) {
  const available = Math.max(0, Math.trunc(totalWeeks) - Math.max(1, Math.trunc(visibleColumns)));
  const numeric = Number(firstWeek);
  return Math.min(available, Math.max(0, Number.isFinite(numeric) ? Math.trunc(numeric) : 0));
}

export function moveWeekViewport(firstWeek, direction, totalWeeks = PROJECT_WEEK_LIMIT, visibleColumns = VISIBLE_WEEK_COLUMNS) {
  return clampWeekViewport(clampWeekViewport(firstWeek, totalWeeks, visibleColumns) + (direction > 0 ? 1 : direction < 0 ? -1 : 0), totalWeeks, visibleColumns);
}
