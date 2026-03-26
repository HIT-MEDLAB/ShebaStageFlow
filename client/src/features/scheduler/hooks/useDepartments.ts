import { useQuery } from '@tanstack/react-query'
import { fetchDepartments } from '../api/scheduler.api'

export function useDepartments() {
  return useQuery({
    queryKey: ['scheduler', 'departments'],
    queryFn: fetchDepartments,
    staleTime: 5 * 60 * 1000, // 5 minutes – departments rarely change
  })
}
