import { useMemo } from 'react'
import type { Assignment, WeekDefinition, SchedulerFilters } from '../types/scheduler.types'

/**
 * Combines assignments + store filters into a 2D map for grid rendering.
 * Returns Map<departmentId, Map<weekNumber, Assignment[]>>
 */
export function useGridData(
  assignments: Assignment[] | undefined,
  weeks: WeekDefinition[],
  filters: SchedulerFilters,
): Map<number, Map<number, Assignment[]>> {
  return useMemo(() => {
    const grid = new Map<number, Map<number, Assignment[]>>()
    if (!assignments || !weeks.length) return grid

    // Filter assignments based on active filters
    const filtered = assignments.filter((a) => {
      if (
        filters.selectedUniversities.length > 0 &&
        !filters.selectedUniversities.includes(a.universityId)
      )
        return false
      if (
        filters.selectedShift !== 'all' &&
        a.shiftType.toLowerCase() !== filters.selectedShift
      )
        return false
      if (filters.selectedYear !== null && a.yearInProgram !== filters.selectedYear)
        return false
      return true
    })

    // Map each assignment to its week based on startDate
    for (const assignment of filtered) {
      const assignmentStart = new Date(assignment.startDate)
      // Find which week this assignment belongs to
      const week = weeks.find(
        (w) => assignmentStart >= w.startDate && assignmentStart <= w.endDate,
      )
      if (!week) continue

      if (!grid.has(assignment.departmentId)) {
        grid.set(assignment.departmentId, new Map())
      }
      const deptMap = grid.get(assignment.departmentId)!
      if (!deptMap.has(week.weekNumber)) {
        deptMap.set(week.weekNumber, [])
      }
      deptMap.get(week.weekNumber)!.push(assignment)
    }

    return grid
  }, [assignments, weeks, filters])
}
