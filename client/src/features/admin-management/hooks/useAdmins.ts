import { useQuery } from '@tanstack/react-query'
import { fetchAdmins } from '../api/admins.api'

export function useAdmins() {
  return useQuery({
    queryKey: ['admins'],
    queryFn: fetchAdmins,
  })
}
