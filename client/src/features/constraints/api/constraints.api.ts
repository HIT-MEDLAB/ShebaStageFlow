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

export async function fetchAllConstraints(academicYearId?: number, year?: number): Promise<AllConstraintsResponse> {
  const params: Record<string, unknown> = {}
  if (academicYearId) params.academicYearId = academicYearId
  if (year) params.year = year
  const { data } = await apiClient.get<AllConstraintsResponse>('/constraints/management', { params })
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

export async function updateUniversityWithSemester(id: number, payload: UpdateUniversityData, calendarYear?: number) {
  const params: Record<string, unknown> = {}
  if (calendarYear) params.calendarYear = calendarYear
  const { data } = await apiClient.patch(`/constraints/universities/${id}`, payload, { params })
  return data
}

export async function deleteDepartment(id: number) {
  await apiClient.delete(`/constraints/departments/${id}`)
}

export async function deleteUniversity(id: number) {
  await apiClient.delete(`/constraints/universities/${id}`)
}

export async function setDepartmentActive(id: number, isActive: boolean, academicYearId: number) {
  const { data } = await apiClient.patch(`/constraints/departments/${id}/active`, { isActive, academicYearId })
  return data
}

export async function setUniversityActive(id: number, isActive: boolean, year: number) {
  const { data } = await apiClient.patch(`/constraints/universities/${id}/active`, { isActive, year })
  return data
}

export async function copyConstraintsToYear(targetAcademicYearId: number, sourceAcademicYearId: number) {
  const { data } = await apiClient.post('/constraints/copy-year', { targetAcademicYearId, sourceAcademicYearId })
  return data
}
