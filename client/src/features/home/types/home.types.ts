export interface HomeStats {
  activeStudents: number
  morningRotations: number
  eveningRotations: number
  activeDepartments: number
}

export interface UniversityRow {
  universityId: number
  universityName: string
  totalStudents: number
  morningRotations: number
  eveningRotations: number
}

export type ViewMode = 'weekly' | 'yearly'

export interface HomeData {
  stats: HomeStats
  universityRows: UniversityRow[]
}
