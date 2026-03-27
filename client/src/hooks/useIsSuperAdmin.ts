import { useAuth } from '@/features/auth'

export function useIsSuperAdmin() {
  const { user } = useAuth()
  return user?.role === 'SUPER_ADMIN'
}
