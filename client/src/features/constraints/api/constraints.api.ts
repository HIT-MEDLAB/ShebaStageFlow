import { apiClient } from '@/lib/apiClient'
import type {
  AllConstraintsResponse,
  CreateSoftConstraintData,
  UpdateSoftConstraintData,
  CreateDepartmentData,
  UpdateDepartmentData,
  CreateUniversityData,
  UpdateUniversityData,
} from '../types/constraints.types'

export async function fetchAllConstraints(): Promise<AllConstraintsResponse> {
  const { data } = await apiClient.get<AllConstraintsResponse>('/constraints/management')
  return data
}

export async function toggleIronConstraint(id: number, isActive: boolean) {
  const { data } = await apiClient.patch(`/constraints/iron/${id}/toggle`, { isActive })
  return data
}

export async function toggleDateConstraint(id: number, isActive: boolean) {
  const { data } = await apiClient.patch(`/constraints/date/${id}/toggle`, { isActive })
  return data
}

export async function toggleSoftConstraint(id: number, isActive: boolean) {
  const { data } = await apiClient.patch(`/constraints/soft/${id}/toggle`, { isActive })
  return data
}

export async function toggleHoliday(id: number, isActive: boolean) {
  const { data } = await apiClient.patch(`/constraints/holidays/${id}/toggle`, { isActive })
  return data
}

export async function createSoftConstraint(payload: CreateSoftConstraintData) {
  const { data } = await apiClient.post('/constraints/soft', payload)
  return data
}

export async function updateSoftConstraint(id: number, payload: UpdateSoftConstraintData) {
  const { data } = await apiClient.patch(`/constraints/soft/${id}`, payload)
  return data
}

export async function deleteSoftConstraint(id: number) {
  await apiClient.delete(`/constraints/soft/${id}`)
}

export async function createDepartmentWithConstraint(payload: CreateDepartmentData) {
  const { data } = await apiClient.post('/constraints/departments', payload)
  return data
}

export async function updateDepartmentWithConstraint(id: number, payload: UpdateDepartmentData) {
  const { data } = await apiClient.patch(`/constraints/departments/${id}`, payload)
  return data
}

export async function createUniversityWithSemester(payload: CreateUniversityData) {
  const { data } = await apiClient.post('/constraints/universities', payload)
  return data
}

export async function updateUniversityWithSemester(id: number, payload: UpdateUniversityData) {
  const { data } = await apiClient.patch(`/constraints/universities/${id}`, payload)
  return data
}
