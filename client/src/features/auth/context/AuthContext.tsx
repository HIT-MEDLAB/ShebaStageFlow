import { createContext, useState, useCallback, useEffect } from 'react'
import type { AuthUser } from '../types/auth.types'
import { getMe, logoutUser } from '../api/auth.api'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: AuthUser) => void
  clearAuth: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    console.log('[AuthProvider] effect fired, sending getMe')
    getMe(controller.signal)
      .then((user) => {
        console.log('[AuthProvider] getMe resolved, ignore=', ignore, 'user=', user)
        if (!ignore) setUserState(user)
      })
      .catch((err) => {
        console.log('[AuthProvider] getMe rejected, ignore=', ignore, 'error=', err)
        if (!ignore) setUserState(null)
      })
      .finally(() => {
        console.log('[AuthProvider] getMe finally, ignore=', ignore)
        if (!ignore) setIsLoading(false)
      })

    return () => {
      console.log('[AuthProvider] cleanup, setting ignore=true')
      ignore = true
      controller.abort()
    }
  }, [])

  const setUser = useCallback((newUser: AuthUser) => {
    setUserState(newUser)
  }, [])

  const clearAuth = useCallback(async () => {
    await logoutUser()
    setUserState(null)
  }, [])

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    setUser,
    clearAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
