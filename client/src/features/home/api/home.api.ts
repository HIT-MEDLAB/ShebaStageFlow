import { apiClient } from '@/lib/apiClient'
import type { HomeData, UniversityRow, ViewMode } from '../types/home.types'

interface UniversityResponse {
  id: number
  name: string
  priority: number
  isActive: boolean
}

async function fetchUniversities(): Promise<UniversityRow[]> {
  const { data } = await apiClient.get<UniversityResponse[]>('/universities')
  return data.map((u) => ({
    id: u.id,
    name: u.name,
    totalStudents: 0,
    morningRotations: 0,
    eveningRotations: 0,
  }))
}

export async function fetchHomeData(
  _week: number,
  viewMode: ViewMode
): Promise<HomeData> {
  const isYearly = viewMode === 'yearly'
  const universityRows = await fetchUniversities()

  return {
    stats: {
      activeStudents: isYearly ? 1430 : 230,
      morningRotations: isYearly ? 39 : 8,
      eveningRotations: isYearly ? 23 : 4,
      activeDepartments: isYearly ? 12 : 12,
    },
    universityRows,
    weeks: [
      { weekNumber: 1, startDate: '2026-03-01', endDate: '2026-03-05' },
      { weekNumber: 2, startDate: '2026-03-08', endDate: '2026-03-12' },
      { weekNumber: 3, startDate: '2026-03-15', endDate: '2026-03-19' },
      { weekNumber: 4, startDate: '2026-03-22', endDate: '2026-03-26' },
      { weekNumber: 5, startDate: '2026-03-29', endDate: '2026-04-02' },
    ],
  }
}
