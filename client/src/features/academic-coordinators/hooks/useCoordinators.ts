import { useQuery } from '@tanstack/react-query'
import { fetchCoordinators } from '../api/coordinators.api'

export function useCoordinators() {
  return useQuery({
    queryKey: ['coordinators'],
    queryFn: fetchCoordinators,
  })
}
