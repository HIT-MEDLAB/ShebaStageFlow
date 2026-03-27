import { apiClient } from '@/lib/apiClient'
import type { HomeData, ViewMode } from '../types/home.types'

export async function fetchHomeData(
  academicYearId: number,
  timeframe: ViewMode,
  weekStart?: string,
  weekEnd?: string,
): Promise<HomeData> {
  const params: Record<string, unknown> = { academicYearId, timeframe }
  if (timeframe === 'weekly' && weekStart && weekEnd) {
    params.weekStart = weekStart
    params.weekEnd = weekEnd
  }
  const { data } = await apiClient.get<HomeData>('/home/summary', { params })
  return data
}
