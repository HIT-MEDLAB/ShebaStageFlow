import { GridCell } from './GridCell'
import type {
  Assignment,
  BlockReason,
  Department,
  WeekDefinition,
} from '../../types/scheduler.types'

interface GridRowProps {
  department: Department
  weeks: WeekDefinition[]
  gridData: Map<number, Map<number, Assignment[]>>
  blockedCells: Map<string, BlockReason>
}

export function GridRow({
  department,
  weeks,
  gridData,
  blockedCells,
}: GridRowProps) {
  return (
    <>
      {/* Department name cell: sticky inline-end (RTL right) */}
      <div
        className="sticky z-[5] bg-white border-b border-border flex items-center p-2 text-sm font-medium text-[#1E2A5E]"
        style={{ insetInlineEnd: 0 }}
      >
        {department.name}
      </div>

      {/* Week cells */}
      {weeks.map((week) => {
        const assignments =
          gridData.get(department.id)?.get(week.weekNumber) ?? []
        const blockKey = `${department.id}-${week.weekNumber}`
        const blockReason = blockedCells.get(blockKey)

        return (
          <GridCell
            key={week.weekNumber}
            departmentId={department.id}
            weekNumber={week.weekNumber}
            assignments={assignments}
            blockReason={blockReason}
          />
        )
      })}
    </>
  )
}
