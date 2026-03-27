import { useQuery } from '@tanstack/react-query'
import { fetchHomeData } from '../api/home.api'
import type { ViewMode } from '../types/home.types'

export function useHomeStats(
  academicYearId: number | undefined,
  viewMode: ViewMode,
  weekStart?: string,
  weekEnd?: string,
) {
  return useQuery({
    queryKey: ['home', 'stats', academicYearId, viewMode, weekStart, weekEnd],
    queryFn: () => fetchHomeData(academicYearId!, viewMode, weekStart, weekEnd),
    enabled: !!academicYearId,
  })
}
