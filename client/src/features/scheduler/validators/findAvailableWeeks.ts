import type { Assignment, WeekDefinition } from '../types/scheduler.types'
import { validateDrop, type ValidationContext } from './assignmentValidator'

/**
 * Finds the closest available weeks where a displaced assignment can be moved.
 * Sorts all weeks by distance from originWeekNum and returns the first 3 that pass validation.
 */
export function findAvailableWeeks(
  displacedAssignment: Assignment,
  originWeekNum: number,
  context: ValidationContext,
  maxResults = 3,
): WeekDefinition[] {
  // Sort weeks by distance from origin (closest first)
  const sortedWeeks = [...context.weeks].sort(
    (a, b) =>
      Math.abs(a.weekNumber - originWeekNum) -
      Math.abs(b.weekNumber - originWeekNum),
  )

  const available: WeekDefinition[] = []

  for (const week of sortedWeeks) {
    // Skip the origin week itself
    if (week.weekNumber === originWeekNum) continue

    const result = validateDrop(
      displacedAssignment,
      displacedAssignment.departmentId,
      week.weekNumber,
      context,
    )

    if (result.type === 'valid') {
      available.push(week)
      if (available.length >= maxResults) break
    }
  }

  return available
}
