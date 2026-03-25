import { useTranslation } from 'react-i18next'
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

  return (
    <div
      className="flex-1 min-h-0 w-full overflow-auto border border-border rounded-lg"
      dir={dir}
    >
      <div
        className="grid gap-px bg-border w-full min-w-fit"
        style={{
          gridTemplateColumns: `minmax(140px, 200px) repeat(${weeks.length}, minmax(200px, 1fr))`,
        }}
      >
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
