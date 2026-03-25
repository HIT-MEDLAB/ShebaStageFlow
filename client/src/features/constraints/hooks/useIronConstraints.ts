import { useQuery } from '@tanstack/react-query'
import { fetchIronConstraints } from '../api/constraints.api'

export function useIronConstraints() {
  return useQuery({
    queryKey: ['constraints', 'iron'],
    queryFn: fetchIronConstraints,
  })
}
