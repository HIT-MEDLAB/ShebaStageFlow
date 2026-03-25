import { useMemo } from 'react'
import { eachWeekOfInterval, addDays } from 'date-fns'
import type { AcademicYear, WeekDefinition } from '../types/scheduler.types'

export function useAcademicYearWeeks(
  academicYear: AcademicYear | undefined,
): WeekDefinition[] {
  return useMemo(() => {
    if (!academicYear) return []
    const sundays = eachWeekOfInterval(
      {
        start: new Date(academicYear.startDate),
        end: new Date(academicYear.endDate),
      },
      { weekStartsOn: 0 }, // Sunday
    )
    return sundays.map((sunday, index) => ({
      weekNumber: index + 1,
      startDate: sunday,
      endDate: addDays(sunday, 4), // Thursday
    }))
  }, [academicYear])
}
