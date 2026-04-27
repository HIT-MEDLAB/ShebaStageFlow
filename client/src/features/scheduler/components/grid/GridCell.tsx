import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { AssignmentCard } from './AssignmentCard'
import { BlockedOverlay } from './BlockedOverlay'
import { WarningOverlay } from './WarningOverlay'
import { HolidayNoticeOverlay } from './HolidayNoticeOverlay'
import type { Assignment, BlockReason } from '../../types/scheduler.types'

interface GridCellProps {
  departmentId: number
  weekNumber: number
  assignments: Assignment[]
  blockReason?: BlockReason
  notice?: BlockReason
  blockGroups?: Map<string, Assignment[]>
}

export function GridCell({
  departmentId,
  weekNumber,
  assignments,
  blockReason,
  notice,
  blockGroups,
}: GridCellProps) {
  const isWarning = blockReason?.type === 'warning'
  const isHardBlock = blockReason && !isWarning

  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${departmentId}-${weekNumber}`,
    data: { departmentId, weekNumber },
    disabled: !!isHardBlock,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative min-h-[120px] h-full bg-white p-2.5 transition-colors',
        isWarning && 'bg-amber-50/50',
        isOver && !isHardBlock && 'bg-green-50 ring-2 ring-green-400 ring-inset',
        isOver && isHardBlock && 'bg-red-50 ring-2 ring-red-400 ring-inset',
      )}
    >
      {isHardBlock ? (
        <BlockedOverlay reason={blockReason} />
      ) : (
        <>
          {isWarning && <WarningOverlay reason={blockReason} />}
          {notice && <HolidayNoticeOverlay reason={notice} />}
          <div className={cn('flex flex-col gap-1', notice && 'pt-5')}>
            {assignments.map((assignment) => {
              const blockInfo = assignment.groupId && blockGroups
                ? (() => {
                    const group = blockGroups.get(assignment.groupId!)
                    if (!group || group.length <= 1) return null
                    return { position: (assignment.groupIndex ?? 0) + 1, total: group.length }
                  })()
                : null
              return (
                <AssignmentCard key={assignment.id} assignment={assignment} blockInfo={blockInfo} />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
