import { useTranslation } from 'react-i18next'
import { Sun, Moon } from 'lucide-react'
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
  const { t } = useTranslation('scheduler')
  const constraint = department.departmentConstraints?.[0]

  return (
    <div className="flex gap-px min-w-fit bg-border">
      {/* Department name cell - sticky horizontally */}
      <div
        className="sticky z-[5] bg-white flex flex-col justify-center p-2 text-sm font-medium text-[#1E2A5E] w-[200px] shrink-0"
        style={{ insetInlineStart: 0 }}
      >
        <span>{department.name}</span>
        {constraint && (
          <div className="flex items-center gap-3 mt-1">
            {department.hasMorningShift && (
              <span
                className="flex items-center gap-1 text-xs text-amber-600"
                title={t('grid.morning')}
              >
                <Sun className="h-3.5 w-3.5" />
                {constraint.morningCapacity}
              </span>
            )}
            {department.hasEveningShift && (
              <span
                className="flex items-center gap-1 text-xs text-indigo-600"
                title={t('grid.evening')}
              >
                <Moon className="h-3.5 w-3.5" />
                {constraint.eveningCapacity}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Week cells */}
      {weeks.map((week) => {
        const assignments =
          gridData.get(department.id)?.get(week.weekNumber) ?? []
        // Check department-specific blocks first, then hospital-wide holiday blocks
        const deptBlockKey = `dept:${department.id}:week:${week.weekNumber}`
        const holidayBlockKey = `holiday:week:${week.weekNumber}`
        const softDeptKey = `soft:dept:${department.id}:week:${week.weekNumber}`
        const softGlobalKey = `soft:week:${week.weekNumber}`
        const blockReason =
          blockedCells.get(deptBlockKey) ??
          blockedCells.get(holidayBlockKey) ??
          blockedCells.get(softDeptKey) ??
          blockedCells.get(softGlobalKey)

        return (
          <div key={week.weekNumber} className="min-w-[200px] flex-1">
            <GridCell
              departmentId={department.id}
              weekNumber={week.weekNumber}
              assignments={assignments}
              blockReason={blockReason}
            />
          </div>
        )
      })}
    </div>
  )
}
