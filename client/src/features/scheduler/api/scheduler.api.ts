import { apiClient } from '@/lib/apiClient'
import type {
  Assignment,
  AssignmentDetail,
  AssignmentStatus,
  Department,
  AcademicYear,
  University,
  ConstraintsResponse,
  SchedulerFilters,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  MoveAssignmentDto,
  CreateStudentDto,
  RejectAssignmentDto,
  DisplaceAssignmentDto,
  SmartImportRow,
  ImportValidationResult,
  ImportAction,
  ExportAssignment,
} from '../types/scheduler.types'

// Raw shape from the API (Prisma includes nested relations)
interface RawAssignment extends Omit<Assignment, 'universityName' | 'departmentName' | 'createdByName'> {
  university: { name: string }
  department: { name: string }
  createdBy?: { name: string | null; email: string }
}

function mapAssignment(raw: RawAssignment): Assignment {
  const { university, department, createdBy, ...rest } = raw
  return {
    ...rest,
    universityName: university.name,
    departmentName: department.name,
    createdByName: createdBy?.name ?? createdBy?.email ?? null,
  }
}

// ── Queries ──────────────────────────────────────────────────────────

export async function fetchAssignments(
  academicYearId: number,
  filters?: Partial<SchedulerFilters>,
  status?: AssignmentStatus | AssignmentStatus[],
) {
  const params: Record<string, unknown> = { academicYearId }
  if (filters?.selectedUniversities?.length)
    params.universityId = filters.selectedUniversities
  if (filters?.selectedShift && filters.selectedShift !== 'all')
    params.shiftType = filters.selectedShift.toUpperCase()
  if (filters?.selectedYear) params.yearInProgram = filters.selectedYear
  if (status) params.status = status
  const { data } = await apiClient.get<RawAssignment[]>('/assignments', { params })
  return data.map(mapAssignment)
}

export async function fetchAssignmentsForExport(
  academicYearId: number,
  filters?: Partial<SchedulerFilters>,
) {
  const params: Record<string, unknown> = { academicYearId }
  if (filters?.selectedUniversities?.length)
    params.universityId = filters.selectedUniversities
  if (filters?.selectedShift && filters.selectedShift !== 'all')
    params.shiftType = filters.selectedShift.toUpperCase()
  if (filters?.selectedYear) params.yearInProgram = filters.selectedYear
  const { data } = await apiClient.get<ExportAssignment[]>('/assignments/export', { params })
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
  const { data } = await apiClient.post<RawAssignment>('/assignments', dto)
  return mapAssignment(data)
}

export async function updateAssignment(id: number, dto: UpdateAssignmentDto) {
  const { data } = await apiClient.patch<RawAssignment>(`/assignments/${id}`, dto)
  return mapAssignment(data)
}

export async function moveAssignment(id: number, dto: MoveAssignmentDto) {
  const { data } = await apiClient.patch<RawAssignment>(
    `/assignments/${id}/move`,
    dto,
  )
  return mapAssignment(data)
}

export async function deleteAssignment(id: number) {
  await apiClient.delete(`/assignments/${id}`)
}

export async function approveAssignment(id: number) {
  const { data } = await apiClient.patch<RawAssignment>(`/assignments/${id}/approve`, {})
  return mapAssignment(data)
}

export async function rejectAssignment(id: number, dto?: RejectAssignmentDto) {
  await apiClient.patch(`/assignments/${id}/reject`, dto ?? {})
}

export async function displaceAssignment(id: number, dto: DisplaceAssignmentDto) {
  const { data } = await apiClient.patch<RawAssignment>(`/assignments/${id}/displace`, dto)
  return mapAssignment(data)
}

export async function smartImportValidate(
  academicYearId: number,
  rows: SmartImportRow[],
): Promise<ImportValidationResult> {
  const { data } = await apiClient.post<ImportValidationResult>(
    '/assignments/import/validate',
    { academicYearId, rows },
  )
  return data
}

export async function validateDisplacementWeek(params: {
  departmentId: number
  universityId: number
  startDate: string
  endDate: string
  shiftType: 'MORNING' | 'EVENING'
  type: 'GROUP' | 'ELECTIVE'
  studentCount?: number | null
  yearInProgram: number
  excludeAssignmentIds: number[]
}): Promise<{ valid: boolean; failureReason?: string; failureParams?: Record<string, string | number> }> {
  const { data } = await apiClient.post<{ valid: boolean; failureReason?: string; failureParams?: Record<string, string | number> }>(
    '/assignments/import/validate-displacement-week',
    params,
  )
  return data
}

export async function smartImportExecute(
  academicYearId: number,
  actions: ImportAction[],
): Promise<{ created: number; displaced: number }> {
  const { data } = await apiClient.post<{ created: number; displaced: number }>(
    '/assignments/import/execute',
    { academicYearId, actions },
  )
  return data
}

export async function importAssignments(assignments: CreateAssignmentDto[]) {
  const { data } = await apiClient.post('/assignments/import', { assignments })
  return data
}

export async function addStudent(
  assignmentId: number,
  dto: CreateStudentDto,
  forceOverride?: boolean,
) {
  const { data } = await apiClient.post(
    `/assignments/${assignmentId}/students`,
    { ...dto, forceOverride },
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
  forceOverride?: boolean,
) {
  const { data } = await apiClient.post(
    `/assignments/${assignmentId}/students/import`,
    { students, forceOverride },
  )
  return data
}
