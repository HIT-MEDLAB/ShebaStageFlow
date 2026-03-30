import { useQuery } from '@tanstack/react-query'
import { fetchConstraints } from '../api/scheduler.api'

export function useConstraints(years: number[] | null) {
  return useQuery({
    queryKey: ['scheduler', 'constraints', years],
    queryFn: () => fetchConstraints(years!),
    enabled: !!years && years.length > 0,
    staleTime: 60 * 1000, // 1 minute
  })
}
