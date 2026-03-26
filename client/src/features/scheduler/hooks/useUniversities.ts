import { useQuery } from '@tanstack/react-query'
import { fetchUniversities } from '../api/scheduler.api'

export function useUniversities() {
  return useQuery({
    queryKey: ['scheduler', 'universities'],
    queryFn: fetchUniversities,
    staleTime: 5 * 60 * 1000, // 5 minutes – universities rarely change
  })
}
