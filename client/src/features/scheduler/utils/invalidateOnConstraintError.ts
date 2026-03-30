import type { QueryClient } from '@tanstack/react-query'
import axios from 'axios'

export function invalidateConstraintsOn422(queryClient: QueryClient, error: unknown): void {
  if (axios.isAxiosError(error) && error.response?.status === 422) {
    queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
  }
}
