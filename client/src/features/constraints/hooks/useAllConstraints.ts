import { useQuery } from '@tanstack/react-query'
import { fetchAllConstraints } from '../api/constraints.api'

export function useAllConstraints() {
  return useQuery({
    queryKey: ['constraints', 'management'],
    queryFn: fetchAllConstraints,
  })
}
