export type Timeframe = 'weekly' | 'calendarYear' | 'academicYear'

export interface DepartmentScheduledWeeks {
  departmentId: number
  departmentName: string
  scheduledWeeks: number
}

export interface DepartmentStudentCount {
  departmentId: number
  departmentName: string
  studentCount: number
}

export interface DepartmentCapacityPercentage {
  departmentId: number
  departmentName: string
  percentage: number
  scheduledWeeks: number
  totalCapacity: number
}

export interface UniversityWeekCount {
  universityId: number
  universityName: string
  weekCount: number
}

export interface StatisticsData {
  departmentScheduledWeeks: DepartmentScheduledWeeks[]
  departmentStudentCount: DepartmentStudentCount[]
  departmentCapacityPercentage: DepartmentCapacityPercentage[]
  universityWeekCount: UniversityWeekCount[]
}
