import { useQuery } from '@tanstack/react-query'
import { fetchDateConstraints } from '../api/constraints.api'

export function useDateConstraints() {
  return useQuery({
    queryKey: ['constraints', 'date'],
    queryFn: fetchDateConstraints,
  })
}
