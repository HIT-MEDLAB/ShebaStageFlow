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
  return (
    <div
      className="overflow-auto max-h-[calc(100vh-280px)] border border-border rounded-lg"
      dir="rtl"
    >
      <div
        className="grid gap-px bg-border"
        style={{
          gridTemplateColumns: `200px repeat(${weeks.length}, 160px)`,
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
