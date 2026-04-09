import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { startOfDay } from 'date-fns'
import { GridHeader } from './GridHeader'
import { GridRow } from './GridRow'
import type {
  Assignment,
  BlockReason,
  Department,
  WeekDefinition,
} from '../../types/scheduler.types'

interface SchedulerGridProps {
  departments: Department[]
  weeks: WeekDefinition[]
  gridData: Map<number, Map<number, Assignment[]>>
  blockedCells: Map<string, BlockReason>
}

export function SchedulerGrid({
  departments,
  weeks,
  gridData,
  blockedCells,
}: SchedulerGridProps) {
  const { i18n } = useTranslation()
  const dir = i18n.dir()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!weeks.length || !containerRef.current) return
    const today = startOfDay(new Date())
    const currentWeek = weeks.find(
      (w) => startOfDay(w.startDate) <= today && today <= startOfDay(w.endDate)
    )
    if (!currentWeek) return
    const weekEl = containerRef.current.querySelector(
      `[data-week-number="${currentWeek.weekNumber}"]`
    )
    weekEl?.scrollIntoView({ inline: 'start', block: 'nearest' })
  }, [weeks])

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 w-full overflow-auto border border-border rounded-lg"
      dir={dir}
    >
      <div className="flex flex-col gap-px bg-border w-full min-w-fit">
        <GridHeader weeks={weeks} />
        {departments.map((dept) => (
          <GridRow
            key={dept.id}
            department={dept}
            weeks={weeks}
            gridData={gridData}
            blockedCells={blockedCells}
          />
        ))}
      </div>
    </div>
  )
}
