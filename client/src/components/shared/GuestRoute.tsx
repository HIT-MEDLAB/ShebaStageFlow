import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth'

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null

  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />
}
