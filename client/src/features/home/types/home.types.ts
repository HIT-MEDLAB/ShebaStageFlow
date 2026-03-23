export interface HomeStats {
  activeStudents: number
  morningRotations: number
  eveningRotations: number
  activeDepartments: number
}

export interface UniversityRowRaw {
  id: number
  nameKey: string
  totalStudents: number
  morningRotations: number
  eveningRotations: number
}

export interface UniversityRow {
  id: number
  name: string
  totalStudents: number
  morningRotations: number
  eveningRotations: number
}

export interface Week {
  weekNumber: number
  startDate: string
  endDate: string
}

export type ViewMode = 'weekly' | 'yearly'

export interface HomeDataRaw {
  stats: HomeStats
  universityRows: UniversityRowRaw[]
  weeks: Week[]
}

export interface HomeData {
  stats: HomeStats
  universityRows: UniversityRow[]
  weeks: Week[]
}
