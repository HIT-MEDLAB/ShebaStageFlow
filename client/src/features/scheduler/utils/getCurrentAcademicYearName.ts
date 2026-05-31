/**
 * Returns the current academic year name based on today's date.
 * Academic year runs August–July, so:
 *   Aug-Dec → "YYYY-(YYYY+1)"  (e.g. Aug 2025 → "2025-2026")
 *   Jan-Jul → "(YYYY-1)-YYYY"  (e.g. Apr 2026 → "2025-2026")
 */
export function getCurrentAcademicYearName(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-based

  if (month >= 8) {
    return `${year}-${year + 1}`
  }
  return `${year - 1}-${year}`
}
