import { useQuery } from '@tanstack/react-query'
import { fetchAcademicYears } from '../api/scheduler.api'

export function useAcademicYears() {
  return useQuery({
    queryKey: ['scheduler', 'academic-years'],
    queryFn: fetchAcademicYears,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
