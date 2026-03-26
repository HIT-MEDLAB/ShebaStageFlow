export type AssignmentType = 'GROUP' | 'ELECTIVE'
export type ShiftType = 'MORNING' | 'EVENING'
export type AssignmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface PendingMoveData {
  originalDeptId: number
  originalStart: string
  originalEnd: string
  displacedId: number
  displacedOrigDeptId: number
  displacedOrigStart: string
  displacedOrigEnd: string
}

export interface Assignment {
  id: number
  departmentId: number
  universityId: number
  academicYearId: number
  startDate: string
  endDate: string
  type: AssignmentType
  shiftType: ShiftType
  status: AssignmentStatus
  rejectionReason?: string | null
  pendingMoveData?: PendingMoveData | null
  studentCount: number | null
  yearInProgram: number
  tutorName: string | null
  universityName: string
  departmentName: string
  createdByName?: string | null
}

export interface Department {
  id: number
  name: string
  hasMorningShift: boolean
  hasEveningShift: boolean
  departmentConstraints: DepartmentConstraintData[]
}

export interface AcademicYear {
  id: number
  name: string
  startDate: string
  endDate: string
}

export interface WeekDefinition {
  weekNumber: number
  startDate: Date
  endDate: Date
}

export interface BlockReason {
  type: 'holiday' | 'dateBlock' | 'capacityFull' | 'softConstraint'
  description: string
  constraintName?: string
}

export interface DepartmentConstraintData {
  id: number
  departmentId: number
  morningCapacity: number
  eveningCapacity: number
  electiveCapacity: number
  blockedStartDate?: string | null
  blockedEndDate?: string | null
}

export interface IronConstraintData {
  id: number
  name: string
  description: string
  isActive: boolean
}

export interface Holiday {
  id: number
  name: string
  date: string
  year: number
}

export interface Student {
  id: number
  firstName: string
  lastName: string
  nationalId: string
  phone: string | null
  email: string | null
}

export interface SoftConstraintData {
  id: number
  name: string
  description: string
  priority: number
  departmentId: number | null
  startDate: string
  endDate: string
}

export interface ConstraintsResponse {
  departmentConstraints: DepartmentConstraintData[]
  ironConstraints: IronConstraintData[]
  holidays: Holiday[]
  softConstraints: SoftConstraintData[]
}

export interface SchedulerFilters {
  selectedUniversities: number[]
  selectedShift: 'all' | 'morning' | 'evening'
  selectedYear: number | null
}

export interface University {
  id: number
  name: string
  priority: number
}

export interface CreateAssignmentDto {
  departmentId: number
  universityId: number
  academicYearId: number
  startDate: string
  endDate: string
  type: AssignmentType
  shiftType: ShiftType
  studentCount?: number | null
  yearInProgram: number
  tutorName?: string | null
}

export interface UpdateAssignmentDto {
  departmentId?: number
  universityId?: number
  startDate?: string
  endDate?: string
  type?: AssignmentType
  shiftType?: ShiftType
  status?: AssignmentStatus
  studentCount?: number | null
  yearInProgram?: number
  tutorName?: string | null
}

export interface MoveAssignmentDto {
  departmentId: number
  startDate: string
  endDate: string
}

export interface AssignmentStudent {
  id: number
  assignmentId: number
  studentId: number
  student: Student
}

export interface AssignmentDetail extends Assignment {
  students: AssignmentStudent[]
}

export interface RejectAssignmentDto {
  rejectionReason?: string
}

export interface DisplaceAssignmentDto {
  departmentId: number
  startDate: string
  endDate: string
  displacedAssignmentId: number
  displacedDepartmentId: number
  displacedStartDate: string
  displacedEndDate: string
}

export interface CreateStudentDto {
  firstName: string
  lastName: string
  nationalId: string
  phone?: string | null
  email?: string | null
}

// --- Validation Result Types ---

export type ValidationResult =
  | { type: 'valid' }
  | { type: 'blocked'; reasonKey: string; reasonParams?: Record<string, string> }
  | {
      type: 'conflict_replaceable'
      displacedAssignment: Assignment
      incomingPriority: number
      displacedPriority: number
    }
  | {
      type: 'conflict_same_priority'
      existingAssignment: Assignment
      reasonKey: string
    }
  | {
      type: 'conflict_admin_override'
      reasonKey: string
      reasonParams?: Record<string, string>
    }
