import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
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
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useAcademicYears } from '@/features/scheduler/hooks/useAcademicYears'
import { useAcademicYearWeeks } from '@/features/scheduler/hooks/useAcademicYearWeeks'
import { useStatistics } from '../hooks/useStatistics'
import { TimeframeToggle } from '../components/TimeframeToggle'
import { StatisticsWeekSelector } from '../components/StatisticsWeekSelector'
import { ChartExportButton } from '../components/ChartExportButton'
import { DepartmentScheduledWeeksChart } from '../components/DepartmentScheduledWeeksChart'
import { DepartmentStudentCountChart } from '../components/DepartmentStudentCountChart'
import { DepartmentCapacityPercentageChart } from '../components/DepartmentCapacityPercentageChart'
import { UniversityWeekCountChart } from '../components/UniversityWeekCountChart'
import { StatisticsPageSkeleton } from '../components/StatisticsPageSkeleton'
import type { Timeframe } from '../types/statistics.types'

export function StatisticsPage() {
  const { t } = useTranslation('statistics')
  const isAdmin = useIsAdmin()

  const [academicYearId, setAcademicYearId] = useState<number | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly')
  const [selectedWeek, setSelectedWeek] = useState(1)

  const { data: academicYears } = useAcademicYears()

  useEffect(() => {
    if (academicYears?.length && !academicYearId) {
      setAcademicYearId(academicYears[0].id)
    }
  }, [academicYears, academicYearId])

  useEffect(() => {
    if (!isAdmin) setTimeframe('weekly')
  }, [isAdmin])

  const currentYear = useMemo(
    () => academicYears?.find((y) => y.id === academicYearId),
    [academicYears, academicYearId],
  )

  const weeks = useAcademicYearWeeks(currentYear)

  const currentWeek = weeks[selectedWeek - 1]

  const { startDate, endDate } = useMemo(() => {
    if (timeframe === 'weekly') {
      return {
        startDate: currentWeek ? format(currentWeek.startDate, 'yyyy-MM-dd') : undefined,
        endDate: currentWeek ? format(currentWeek.endDate, 'yyyy-MM-dd') : undefined,
      }
    }
    if (timeframe === 'calendarYear' && currentYear) {
      const year = new Date(currentYear.startDate).getFullYear()
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      }
    }
    if (timeframe === 'academicYear' && currentYear) {
      return {
        startDate: format(new Date(currentYear.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(currentYear.endDate), 'yyyy-MM-dd'),
      }
    }
    return { startDate: undefined, endDate: undefined }
  }, [timeframe, currentWeek, currentYear])

  const { data, isLoading } = useStatistics(
    academicYearId,
    timeframe,
    startDate,
    endDate,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('pageTitle')}</h1>
        <div className="flex items-center gap-4">
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
                    {timeframe === 'calendarYear'
                      ? new Date(year.startDate).getFullYear()
                      : year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isAdmin && (
            <TimeframeToggle value={timeframe} onChange={setTimeframe} />
          )}
        </div>
      </div>

      {/* Week Selector */}
      {timeframe === 'weekly' && weeks.length > 0 && (
        <StatisticsWeekSelector
          weeks={weeks}
          selectedWeek={selectedWeek}
          onChange={setSelectedWeek}
        />
      )}

      {/* Charts */}
      {isLoading ? (
        <StatisticsPageSkeleton />
      ) : data ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Department Scheduled Weeks */}
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.departmentScheduledWeeks')}</CardTitle>
              <CardAction>
                <ChartExportButton
                  data={data.departmentScheduledWeeks}
                  filename="department-scheduled-weeks"
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              <DepartmentScheduledWeeksChart data={data.departmentScheduledWeeks} />
            </CardContent>
          </Card>

          {/* Department Student Count */}
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.departmentStudentCount')}</CardTitle>
              <CardAction>
                <ChartExportButton
                  data={data.departmentStudentCount}
                  filename="department-student-count"
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              <DepartmentStudentCountChart data={data.departmentStudentCount} />
            </CardContent>
          </Card>

          {/* Department Capacity Percentage */}
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.departmentCapacityPercentage')}</CardTitle>
              <CardAction>
                <ChartExportButton
                  data={data.departmentCapacityPercentage}
                  filename="department-capacity-percentage"
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              <DepartmentCapacityPercentageChart data={data.departmentCapacityPercentage} />
            </CardContent>
          </Card>

          {/* University Week Count */}
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.universityWeekCount')}</CardTitle>
              <CardAction>
                <ChartExportButton
                  data={data.universityWeekCount}
                  filename="university-week-count"
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              <UniversityWeekCountChart data={data.universityWeekCount} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          {t('noData')}
        </div>
      )}
    </div>
  )
}
