import { useAuth } from '@/features/auth'

export function useIsAdmin() {
  const { user } = useAuth()
  return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
}
