import { apiClient } from '@/lib/apiClient'
import type { Admin } from '../types/admin.types'
import type { AdminFormValues } from '../schemas/admin.schemas'

export async function fetchAdmins(): Promise<Admin[]> {
  const { data } = await apiClient.get<Admin[]>('/admins')
  return data
}

export async function createAdmin(payload: AdminFormValues): Promise<Admin> {
  const { data } = await apiClient.post<Admin>('/admins', payload)
  return data
}

export async function updateAdmin(id: number, payload: Partial<AdminFormValues>): Promise<Admin> {
  const { data } = await apiClient.patch<Admin>(`/admins/${id}`, payload)
  return data
}

export async function deleteAdmin(id: number): Promise<void> {
  await apiClient.delete(`/admins/${id}`)
}
