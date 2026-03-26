import { useQuery } from '@tanstack/react-query'
import { fetchAssignments } from '../api/scheduler.api'
import type { SchedulerFilters } from '../types/scheduler.types'

export function useAssignments(
  academicYearId: number | null,
  filters: Partial<SchedulerFilters>,
) {
  return useQuery({
    queryKey: ['scheduler', 'assignments', academicYearId, filters],
    queryFn: () => fetchAssignments(academicYearId!, filters),
    enabled: !!academicYearId,
  })
}
