import { apiClient } from '@/lib/apiClient'
import type {
  Assignment,
  AssignmentDetail,
  Department,
  AcademicYear,
  University,
  ConstraintsResponse,
  SchedulerFilters,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  MoveAssignmentDto,
  CreateStudentDto,
} from '../types/scheduler.types'

// ── Queries ──────────────────────────────────────────────────────────

export async function fetchAssignments(
  academicYearId: number,
  filters?: Partial<SchedulerFilters>,
) {
  const params: Record<string, unknown> = { academicYearId }
  if (filters?.selectedUniversities?.length)
    params.universityId = filters.selectedUniversities
  if (filters?.selectedShift && filters.selectedShift !== 'all')
    params.shiftType = filters.selectedShift.toUpperCase()
  if (filters?.selectedYear) params.yearInProgram = filters.selectedYear
  const { data } = await apiClient.get<Assignment[]>('/assignments', { params })
  return data
}

export async function fetchAssignmentById(id: number) {
  const { data } = await apiClient.get<AssignmentDetail>(`/assignments/${id}`)
  return data
}

export async function fetchDepartments() {
  const { data } = await apiClient.get<Department[]>('/departments')
  return data
}

export async function fetchUniversities() {
  const { data } = await apiClient.get<University[]>('/universities')
  return data
}

export async function fetchConstraints(years: number[]) {
  const { data } = await apiClient.get<ConstraintsResponse>('/constraints', {
    params: { year: years.join(',') },
  })
  return data
}

export async function fetchAcademicYears() {
  const { data } = await apiClient.get<AcademicYear[]>('/academic-years')
  return data
}

// ── Mutations ────────────────────────────────────────────────────────

export async function createAssignment(dto: CreateAssignmentDto) {
  const { data } = await apiClient.post<Assignment>('/assignments', dto)
  return data
}

export async function updateAssignment(id: number, dto: UpdateAssignmentDto) {
  const { data } = await apiClient.patch<Assignment>(`/assignments/${id}`, dto)
  return data
}

export async function moveAssignment(id: number, dto: MoveAssignmentDto) {
  const { data } = await apiClient.patch<Assignment>(
    `/assignments/${id}/move`,
    dto,
  )
  return data
}

export async function deleteAssignment(id: number) {
  await apiClient.delete(`/assignments/${id}`)
}

export async function importAssignments(assignments: CreateAssignmentDto[]) {
  const { data } = await apiClient.post('/assignments/import', { assignments })
  return data
}

export async function addStudent(
  assignmentId: number,
  dto: CreateStudentDto,
) {
  const { data } = await apiClient.post(
    `/assignments/${assignmentId}/students`,
    dto,
  )
  return data
}

export async function removeStudent(
  assignmentId: number,
  studentId: number,
) {
  await apiClient.delete(
    `/assignments/${assignmentId}/students/${studentId}`,
  )
}

export async function importStudents(
  assignmentId: number,
  students: CreateStudentDto[],
) {
  const { data } = await apiClient.post(
    `/assignments/${assignmentId}/students/import`,
    { students },
  )
  return data
}
