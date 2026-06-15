import { useQuery } from '@tanstack/react-query'
import { fetchDepartments } from '../api/scheduler.api'

export function useDepartments(academicYearId?: number | null) {
  return useQuery({
    queryKey: ['scheduler', 'departments', academicYearId ?? null],
    queryFn: () => fetchDepartments(academicYearId ?? undefined),
    enabled: !!academicYearId,
    staleTime: 5 * 60 * 1000, // 5 minutes – departments rarely change
    select: (data) => [...data].sort((a, b) => a.name.localeCompare(b.name, 'he')),
  })
}
