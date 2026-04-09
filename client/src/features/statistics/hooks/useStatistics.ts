import { useQuery } from '@tanstack/react-query'
import { fetchStatistics } from '../api/statistics.api'
import type { Timeframe } from '../types/statistics.types'

export function useStatistics(
  academicYearId: number | null,
  timeframe: Timeframe,
  weekStart?: string,
  weekEnd?: string,
) {
  return useQuery({
    queryKey: ['statistics', academicYearId, timeframe, weekStart, weekEnd],
    queryFn: () => fetchStatistics(academicYearId!, timeframe, weekStart, weekEnd),
    enabled: !!academicYearId && !!weekStart && !!weekEnd,
  })
}
