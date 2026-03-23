import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchHomeData } from '../api/home.api'
import type { HomeData, ViewMode } from '../types/home.types'

export function useHomeStats(week: number, viewMode: ViewMode) {
  const { t } = useTranslation('home')

  return useQuery({
    queryKey: ['home', 'stats', week, viewMode],
    queryFn: () => fetchHomeData(week, viewMode),
    select: (raw): HomeData => ({
      ...raw,
      universityRows: raw.universityRows.map((row) => ({
        id: row.id,
        name: t(row.nameKey),
        totalStudents: row.totalStudents,
        morningRotations: row.morningRotations,
        eveningRotations: row.eveningRotations,
      })),
    }),
  })
}
