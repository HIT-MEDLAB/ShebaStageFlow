import { useQuery } from '@tanstack/react-query'
import { fetchHomeData } from '../api/home.api'
import type { ViewMode } from '../types/home.types'

export function useHomeStats(week: number, viewMode: ViewMode) {
  return useQuery({
    queryKey: ['home', 'stats', week, viewMode],
    queryFn: () => fetchHomeData(week, viewMode),
  })
}
