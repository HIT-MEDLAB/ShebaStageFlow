export interface IronConstraint {
  id: number
  name: string
  description: string
  isActive: boolean
}

export interface DateConstraint {
  id: number
  name: string
  description: string
  startDate: string
  endDate: string
  isActive: boolean
}

export interface SoftConstraint {
  id: number
  name: string
  description: string
  priority: number
  isActive: boolean
  departmentId: number | null
  universityId: number | null
  startDate: string | null
  endDate: string | null
  department: { id: number; name: string } | null
  university: { id: number; name: string } | null
}

export interface Holiday {
  id: number
  name: string
  date: string
  isFullDay: boolean
  year: number
  isActive: boolean
}

export interface DepartmentConstraintData {
  id: number
  departmentId: number
  morningCapacity: number
  eveningCapacity: number
  electiveCapacity: number
  blockedStartDate: string | null
  blockedEndDate: string | null
}

export interface DepartmentWithConstraint {
  id: number
  name: string
  hasMorningShift: boolean
  hasEveningShift: boolean
  isActive: boolean
  departmentConstraints: DepartmentConstraintData[]
}

export interface UniversitySemesterData {
  id: number
  universityId: number
  semesterStart: string
  semesterEnd: string
  year: number
}

export interface UniversityWithSemester {
  id: number
  name: string
  priority: number
  isActive: boolean
  semesters: UniversitySemesterData[]
}

export interface AllConstraintsResponse {
  ironConstraints: IronConstraint[]
  dateConstraints: DateConstraint[]
  softConstraints: SoftConstraint[]
  holidays: Holiday[]
  departments: DepartmentWithConstraint[]
  universities: UniversityWithSemester[]
}

export interface CreateSoftConstraintData {
  name: string
  description: string
  priority?: number
  departmentId?: number | null
  universityId?: number | null
  startDate?: string | null
  endDate?: string | null
}

export interface UpdateSoftConstraintData {
  name?: string
  description?: string
  priority?: number
  departmentId?: number | null
  universityId?: number | null
  startDate?: string | null
  endDate?: string | null
}

export interface CreateDepartmentData {
  name: string
  hasMorningShift?: boolean
  hasEveningShift?: boolean
  morningCapacity: number
  eveningCapacity?: number
  electiveCapacity?: number
}

export interface UpdateDepartmentData {
  name?: string
  hasMorningShift?: boolean
  hasEveningShift?: boolean
  morningCapacity?: number
  eveningCapacity?: number
  electiveCapacity?: number
}

export interface CreateUniversityData {
  name: string
  priority?: number
  semesterStart: string
  semesterEnd: string
  year: number
}

export interface UpdateUniversityData {
  name?: string
  priority?: number
  semesterStart?: string
  semesterEnd?: string
  year?: number
}
