import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GraduationCap, Sun, Moon, Building2 } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { useHomeStats } from '../hooks/useHomeStats'
import { StatsCard } from '../components/StatsCard'
import { WeekSelector } from '../components/WeekSelector'
import { UniversityTable } from '../components/UniversityTable'
import type { ViewMode } from '../types/home.types'

export function HomePage() {
  const { t } = useTranslation('home')
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

  const [selectedWeek, setSelectedWeek] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')

  const { data, isLoading } = useHomeStats(selectedWeek, viewMode)

  if (isLoading || !data) {
    return null
  }

  const cards = [
    {
      title: t('cards.activeStudents'),
      value: data.stats.activeStudents,
      icon: GraduationCap,
    },
    {
      title: t('cards.morningRotations'),
      value: data.stats.morningRotations,
      icon: Sun,
    },
    {
      title: t('cards.eveningRotations'),
      value: data.stats.eveningRotations,
      icon: Moon,
    },
    {
      title: t('cards.activeDepartments'),
      value: data.stats.activeDepartments,
      icon: Building2,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatsCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          {viewMode === 'weekly' ? t('table.title') : t('table.yearlyTitle')}
        </h2>

        <div className="flex items-center gap-4">
          {viewMode === 'weekly' && (
            <WeekSelector
              weeks={data.weeks}
              selectedWeek={selectedWeek}
              onChange={setSelectedWeek}
            />
          )}

          {isAdmin && (
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(val) => {
                if (val) setViewMode(val as ViewMode)
              }}
            >
              <ToggleGroupItem value="weekly" aria-label={t('viewToggle.weekly')}>
                {t('viewToggle.weekly')}
              </ToggleGroupItem>
              <ToggleGroupItem value="yearly" aria-label={t('viewToggle.yearly')}>
                {t('viewToggle.yearly')}
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>

        <UniversityTable rows={data.universityRows} />
      </div>
    </div>
  )
}
