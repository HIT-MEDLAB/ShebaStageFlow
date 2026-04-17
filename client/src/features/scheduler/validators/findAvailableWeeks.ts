import type { Assignment, WeekDefinition } from '../types/scheduler.types'
import { validateDrop, getAssignmentWeekNumber, type ValidationContext } from './assignmentValidator'

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

/**
 * Finds contiguous N-week windows where a displaced block can be moved.
 * Each block member is validated at its respective position within the window.
 * Returns arrays of WeekDefinition[] (each array is a valid window starting week).
 */
export function findAvailableBlockWeeks(
  blockAssignments: Assignment[],
  originWeekNum: number,
  context: ValidationContext,
  maxResults = 3,
): WeekDefinition[] {
  const blockSize = blockAssignments.length
  const weeks = context.weeks
  // Sort block by groupIndex
  const sorted = [...blockAssignments].sort((a, b) => (a.groupIndex ?? 0) - (b.groupIndex ?? 0))

  // Build a set of week numbers occupied by the current block (to skip)
  const currentBlockWeekNums = new Set(
    sorted.map((a) => getAssignmentWeekNumber(a, weeks)).filter((n): n is number => n != null),
  )

  // Create a validation context that excludes all block members
  const contextWithoutBlock: ValidationContext = {
    ...context,
    existingAssignments: context.existingAssignments.filter(
      (a) => a.groupId !== sorted[0].groupId,
    ),
  }

  const available: WeekDefinition[] = []

  // Try all possible starting positions, sorted by distance from origin
  const startPositions = weeks
    .filter((_, i) => i + blockSize <= weeks.length)
    .sort(
      (a, b) =>
        Math.abs(a.weekNumber - originWeekNum) -
        Math.abs(b.weekNumber - originWeekNum),
    )

  for (const startWeek of startPositions) {
    const startIdx = weeks.findIndex((w) => w.weekNumber === startWeek.weekNumber)
    if (startIdx === -1) continue

    const window = weeks.slice(startIdx, startIdx + blockSize)
    if (window.length < blockSize) continue

    // Check consecutive (week numbers must be sequential)
    let consecutive = true
    for (let i = 1; i < window.length; i++) {
      if (window[i].weekNumber !== window[i - 1].weekNumber + 1) {
        consecutive = false
        break
      }
    }
    if (!consecutive) continue

    // Skip if this window overlaps with the current block position
    if (window.some((w) => currentBlockWeekNums.has(w.weekNumber))) continue

    // Validate each week in the window using the respective block member's shift
    let allValid = true
    for (let i = 0; i < blockSize; i++) {
      const result = validateDrop(
        sorted[i],
        sorted[i].departmentId,
        window[i].weekNumber,
        contextWithoutBlock,
      )
      if (result.type !== 'valid' && result.type !== 'warning') {
        allValid = false
        break
      }
    }

    if (allValid) {
      // Return the first week of the window as the suggestion
      available.push(window[0])
      if (available.length >= maxResults) break
    }
  }

  return available
}
