import { apiClient } from '@/lib/apiClient'
import type { AuthUser } from '../types/auth.types'
import type { LoginFormData } from '../schemas/auth.schema'

export interface LoginOtpResponse {
  requiresOtp: true
  otpToken: string
  email: string
}

export interface VerifyOtpResponse {
  user: AuthUser
}

export async function loginUser(data: LoginFormData): Promise<LoginOtpResponse> {
  const response = await apiClient.post<LoginOtpResponse>('/auth/login', data)
  return response.data
}

export async function verifyOtp(otpToken: string, code: string): Promise<VerifyOtpResponse> {
  const response = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', { otpToken, code })
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
