import { apiClient } from '@/lib/apiClient'
import type { AuthUser } from '../types/auth.types'
import type { LoginFormData } from '../schemas/auth.schema'

export interface LoginResponse {
  user: AuthUser
}

export async function loginUser(data: LoginFormData): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', data)
  return response.data
}

export async function getMe(signal?: AbortSignal): Promise<AuthUser> {
  const response = await apiClient.get<{ user: AuthUser }>('/auth/me', { signal })
  return response.data.user
}

export async function logoutUser(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function forgotPassword(data: { email: string }): Promise<void> {
  await apiClient.post('/auth/forgot-password', data)
}
