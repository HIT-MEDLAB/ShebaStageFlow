import { apiClient } from '@/lib/apiClient'
import type {
  IronConstraint,
  DateConstraint,
  Department,
  DepartmentConstraint,
  UniversitySemester,
  University,
} from '../types/constraints.types'

// ─── Iron Constraints ────────────────────────────────────

export async function fetchIronConstraints(): Promise<IronConstraint[]> {
  const { data } = await apiClient.get<IronConstraint[]>('/constraints/iron')
  return data
}

export async function createIronConstraint(body: {
  name: string
  description: string
}): Promise<IronConstraint> {
  const { data } = await apiClient.post<IronConstraint>('/constraints/iron', body)
  return data
}

export async function updateIronConstraint(
  id: number,
  body: { name?: string; description?: string; isActive?: boolean },
): Promise<IronConstraint> {
  const { data } = await apiClient.patch<IronConstraint>(`/constraints/iron/${id}`, body)
  return data
}

export async function deleteIronConstraint(id: number): Promise<void> {
  await apiClient.delete(`/constraints/iron/${id}`)
}

// ─── Date Constraints ────────────────────────────────────

export async function fetchDateConstraints(): Promise<DateConstraint[]> {
  const { data } = await apiClient.get<DateConstraint[]>('/constraints/date')
  return data
}

export async function createDateConstraint(body: {
  name: string
  description: string
  startDate: string
  endDate: string
}): Promise<DateConstraint> {
  const { data } = await apiClient.post<DateConstraint>('/constraints/date', body)
  return data
}

export async function updateDateConstraint(
  id: number,
  body: { name?: string; description?: string; startDate?: string; endDate?: string; isActive?: boolean },
): Promise<DateConstraint> {
  const { data } = await apiClient.patch<DateConstraint>(`/constraints/date/${id}`, body)
  return data
}

export async function deleteDateConstraint(id: number): Promise<void> {
  await apiClient.delete(`/constraints/date/${id}`)
}

// ─── Departments ─────────────────────────────────────────

export async function fetchDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<Department[]>('/constraints/departments')
  return data
}

export async function fetchDepartmentConstraint(
  departmentId: number,
): Promise<DepartmentConstraint | null> {
  const { data } = await apiClient.get<DepartmentConstraint | null>(
    `/constraints/departments/${departmentId}`,
  )
  return data
}

export async function upsertDepartmentConstraint(
  departmentId: number,
  body: {
    morningCapacity: number
    eveningCapacity: number
    electiveCapacity: number
    blockedStartDate?: string | null
    blockedEndDate?: string | null
  },
): Promise<DepartmentConstraint> {
  const { data } = await apiClient.put<DepartmentConstraint>(
    `/constraints/departments/${departmentId}`,
    body,
  )
  return data
}

// ─── University Semesters ────────────────────────────────

export async function fetchUniversities(): Promise<University[]> {
  const { data } = await apiClient.get<University[]>('/universities')
  return data
}

export async function fetchUniversitySemesters(
  universityId: number,
): Promise<UniversitySemester[]> {
  const { data } = await apiClient.get<UniversitySemester[]>(
    `/constraints/semesters/${universityId}`,
  )
  return data
}

export async function createSemester(body: {
  universityId: number
  semesterStart: string
  semesterEnd: string
}): Promise<UniversitySemester> {
  const { data } = await apiClient.post<UniversitySemester>('/constraints/semesters', body)
  return data
}

export async function updateSemester(
  id: number,
  body: { semesterStart?: string; semesterEnd?: string },
): Promise<UniversitySemester> {
  const { data } = await apiClient.patch<UniversitySemester>(
    `/constraints/semesters/${id}`,
    body,
  )
  return data
}
