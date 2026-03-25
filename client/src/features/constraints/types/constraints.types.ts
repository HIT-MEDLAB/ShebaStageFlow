export interface IronConstraint {
  id: number
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DateConstraint {
  id: number
  name: string
  description: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: number
  name: string
  hasMorningShift: boolean
  hasEveningShift: boolean
  isActive: boolean
}

export interface DepartmentConstraint {
  id: number
  departmentId: number
  morningCapacity: number
  eveningCapacity: number
  electiveCapacity: number
  blockedStartDate: string | null
  blockedEndDate: string | null
}

export interface UniversitySemester {
  id: number
  universityId: number
  semesterStart: string
  semesterEnd: string
  year: number
}

export interface University {
  id: number
  name: string
  priority: number
  isActive: boolean
}
