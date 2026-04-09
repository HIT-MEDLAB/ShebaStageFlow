import { apiClient } from '@/lib/apiClient'
import type { StatisticsData, Timeframe } from '../types/statistics.types'

export async function fetchStatistics(
  academicYearId: number,
  timeframe: Timeframe,
  weekStart?: string,
  weekEnd?: string,
): Promise<StatisticsData> {
  const params: Record<string, unknown> = { academicYearId, timeframe }
  if (weekStart && weekEnd) {
    params.weekStart = weekStart
    params.weekEnd = weekEnd
  }
  const { data } = await apiClient.get<StatisticsData>('/statistics', { params })
  return data
}
