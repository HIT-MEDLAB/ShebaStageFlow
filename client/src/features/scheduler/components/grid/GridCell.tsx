import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { AssignmentCard } from './AssignmentCard'
import { BlockedOverlay } from './BlockedOverlay'
import type { Assignment, BlockReason } from '../../types/scheduler.types'

interface GridCellProps {
  departmentId: number
  weekNumber: number
  assignments: Assignment[]
  blockReason?: BlockReason
}

export function GridCell({
  departmentId,
  weekNumber,
  assignments,
  blockReason,
}: GridCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${departmentId}-${weekNumber}`,
    data: { departmentId, weekNumber },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative min-h-[120px] bg-white p-2.5 transition-colors',
        isOver && !blockReason && 'bg-green-50 ring-2 ring-green-400 ring-inset',
        isOver && blockReason && 'bg-red-50 ring-2 ring-red-400 ring-inset',
      )}
    >
      {blockReason ? (
        <BlockedOverlay reason={blockReason} />
      ) : (
        <div className="flex flex-col gap-1">
          {assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}
    </div>
  )
}
