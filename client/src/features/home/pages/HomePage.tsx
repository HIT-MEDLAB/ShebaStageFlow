import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { GraduationCap, Sun, Moon, Building2 } from 'lucide-react'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useAcademicYears } from '@/features/scheduler/hooks/useAcademicYears'
import { useAcademicYearWeeks } from '@/features/scheduler/hooks/useAcademicYearWeeks'
import { useHomeStats } from '../hooks/useHomeStats'
import { StatsCard } from '../components/StatsCard'
import { WeekSelector } from '../components/WeekSelector'
import { UniversityTable } from '../components/UniversityTable'
import type { ViewMode } from '../types/home.types'

export function HomePage() {
  const { t } = useTranslation('home')
  const isAdmin = useIsAdmin()

  const [academicYearId, setAcademicYearId] = useState<number | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')

  const { data: academicYears } = useAcademicYears()

  useEffect(() => {
    if (academicYears?.length && !academicYearId) {
      setAcademicYearId(academicYears[0].id)
    }
  }, [academicYears, academicYearId])

  const academicYear = useMemo(
    () => academicYears?.find((y) => y.id === academicYearId),
    [academicYears, academicYearId],
  )

  const weeks = useAcademicYearWeeks(academicYear)

  const currentWeek = useMemo(() => {
    return weeks.find((w) => w.weekNumber === selectedWeek)
  }, [weeks, selectedWeek])

  const { startDate, endDate } = useMemo(() => {
    if (viewMode === 'weekly') {
      return {
        startDate: currentWeek ? format(currentWeek.startDate, 'yyyy-MM-dd') : undefined,
        endDate: currentWeek ? format(currentWeek.endDate, 'yyyy-MM-dd') : undefined,
      }
    }
    if (viewMode === 'calendarYear' && academicYear) {
      const year = new Date(academicYear.startDate).getFullYear()
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      }
    }
    if (viewMode === 'academicYear' && academicYear) {
      return {
        startDate: format(new Date(academicYear.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(academicYear.endDate), 'yyyy-MM-dd'),
      }
    }
    return { startDate: undefined, endDate: undefined }
  }, [viewMode, currentWeek, academicYear])

  const { data, isLoading } = useHomeStats(
    academicYear?.id,
    viewMode,
    startDate,
    endDate,
  )

  if (isLoading || !data) {
    return null
  }

  const cards = [
    {
      key: 'activeStudents',
      title: t('cards.activeStudents'),
      value: data.stats.activeStudents,
      icon: GraduationCap,
      iconClassName: 'text-blue-500',
    },
    {
      key: 'morningRotations',
      title: t('cards.morningRotations'),
      value: data.stats.morningRotations,
      icon: Sun,
      iconClassName: 'text-amber-500',
    },
    {
      key: 'eveningRotations',
      title: t('cards.eveningRotations'),
      value: data.stats.eveningRotations,
      icon: Moon,
      iconClassName: 'text-indigo-500',
    },
    {
      key: 'activeDepartments',
      title: t('cards.activeDepartments'),
      value: data.stats.activeDepartments,
      icon: Building2,
      iconClassName: 'text-emerald-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('pageTitle')}</h1>
        {academicYears && (
          <Select
            value={academicYearId?.toString() ?? ''}
            onValueChange={(val) => {
              setAcademicYearId(Number(val))
              setSelectedWeek(1)
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('academicYear')} />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={String(year.id)}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatsCard
            key={card.key}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconClassName={card.iconClassName}
          />
        ))}
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === 'weekly'
              ? t('table.title')
              : viewMode === 'calendarYear'
                ? t('table.calendarYearTitle')
                : t('table.academicYearTitle')}
          </CardTitle>
          {isAdmin && (
            <CardAction>
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
                <ToggleGroupItem value="calendarYear" aria-label={t('viewToggle.calendarYear')}>
                  {t('viewToggle.calendarYear')}
                </ToggleGroupItem>
                <ToggleGroupItem value="academicYear" aria-label={t('viewToggle.academicYear')}>
                  {t('viewToggle.academicYear')}
                </ToggleGroupItem>
              </ToggleGroup>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {viewMode === 'weekly' && (
            <WeekSelector
              weeks={weeks}
              selectedWeek={selectedWeek}
              onChange={setSelectedWeek}
            />
          )}
          <UniversityTable rows={data.universityRows} />
        </CardContent>
      </Card>
    </div>
  )
}
