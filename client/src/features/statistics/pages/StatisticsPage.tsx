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
import { DepartmentCapacityChart } from '../components/DepartmentCapacityChart'
import { DepartmentUtilizationChart } from '../components/DepartmentUtilizationChart'
import { StudentEnrollmentChart } from '../components/StudentEnrollmentChart'
import { UtilizationGaugeChart } from '../components/UtilizationGaugeChart'
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

  const weekStart = currentWeek ? format(currentWeek.startDate, 'yyyy-MM-dd') : undefined
  const weekEnd = currentWeek ? format(currentWeek.endDate, 'yyyy-MM-dd') : undefined

  const { data, isLoading } = useStatistics(
    academicYearId,
    timeframe,
    weekStart,
    weekEnd,
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
                    {year.name}
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
          {/* Department Capacities */}
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.departmentCapacity')}</CardTitle>
              <CardAction>
                <ChartExportButton
                  data={data.departmentCapacities}
                  filename="department-capacities"
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              <DepartmentCapacityChart data={data.departmentCapacities} />
            </CardContent>
          </Card>

          {/* Department Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.departmentUtilization')}</CardTitle>
              <CardAction>
                <ChartExportButton
                  data={data.departmentUtilization}
                  filename="department-utilization"
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              <DepartmentUtilizationChart data={data.departmentUtilization} />
            </CardContent>
          </Card>

          {/* Student Enrollment */}
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.studentEnrollment')}</CardTitle>
              <CardAction>
                <ChartExportButton
                  data={data.studentEnrollment}
                  filename="student-enrollment"
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              <StudentEnrollmentChart data={data.studentEnrollment} />
            </CardContent>
          </Card>

          {/* Utilization Gauges */}
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.utilizationGauges')}</CardTitle>
              <CardAction>
                <ChartExportButton
                  data={data.utilizationGauges}
                  filename="utilization-rates"
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              <UtilizationGaugeChart data={data.utilizationGauges} />
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
