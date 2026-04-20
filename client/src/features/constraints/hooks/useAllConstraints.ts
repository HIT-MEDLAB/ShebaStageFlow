import { useQuery } from '@tanstack/react-query'
import { fetchAllConstraints } from '../api/constraints.api'

export function useAllConstraints(academicYearId?: number, year?: number) {
  return useQuery({
    queryKey: ['constraints', 'management', academicYearId, year],
    queryFn: () => fetchAllConstraints(academicYearId, year),
    enabled: !!academicYearId,
  })
}
