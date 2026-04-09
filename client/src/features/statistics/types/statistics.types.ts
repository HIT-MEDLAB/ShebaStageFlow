export type Timeframe = 'weekly' | 'calendarYear' | 'academicYear'

export interface DepartmentCapacity {
  departmentId: number
  departmentName: string
  morningCapacity: number
  eveningCapacity: number
  electiveCapacity: number
  totalCapacity: number
}

export interface DepartmentUtilization {
  departmentId: number
  departmentName: string
  morningActual: number
  eveningActual: number
  morningCapacity: number
  eveningCapacity: number
}

export interface StudentEnrollment {
  universityId: number
  universityName: string
  studentCount: number
}

export interface UtilizationGauge {
  departmentId: number
  departmentName: string
  percentage: number
  actual: number
  capacity: number
}

export interface StatisticsData {
  departmentCapacities: DepartmentCapacity[]
  departmentUtilization: DepartmentUtilization[]
  studentEnrollment: StudentEnrollment[]
  utilizationGauges: UtilizationGauge[]
}
