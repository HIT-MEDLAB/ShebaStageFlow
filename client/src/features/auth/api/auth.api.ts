import { apiClient } from '@/lib/apiClient'
import type { AuthUser } from '../types/auth.types'
import type { LoginFormData } from '../schemas/auth.schema'

export interface LoginResponse {
  token: string
  user: AuthUser
}

export async function loginUser(data: LoginFormData): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', data)
  return response.data
}

export async function forgotPassword(data: { email: string }): Promise<void> {
  await apiClient.post('/auth/forgot-password', data)
}
