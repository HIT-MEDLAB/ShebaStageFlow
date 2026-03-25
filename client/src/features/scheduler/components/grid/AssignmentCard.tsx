import { useTranslation } from 'react-i18next'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSchedulerStore } from '../../stores/schedulerStore'
import type { Assignment } from '../../types/scheduler.types'

const UNIVERSITY_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#84cc16', // lime
  '#f43f5e', // rose
  '#a855f7', // purple
  '#06b6d4', // cyan
] as const

interface AssignmentCardProps {
  assignment: Assignment
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const { t } = useTranslation('scheduler')

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: assignment.id,
    data: { assignment },
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const universityColor =
    UNIVERSITY_COLORS[assignment.universityId % UNIVERSITY_COLORS.length]

  const isGroup = assignment.type === 'GROUP'
  const typeBadgeBg = isGroup ? '#BF3069' : '#44C2A4'

  const handleClick = (e: React.MouseEvent) => {
    // Don't open dialog if we're dragging
    if (transform) return
    console.log('Card clicked:', assignment.id, assignment.universityName)
    e.stopPropagation()
    useSchedulerStore.getState().openDialog('edit', assignment.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderInlineStartColor: universityColor,
      }}
      className={cn(
        'rounded-lg border-s-4 p-2.5 text-sm cursor-pointer select-none',
        'transition-shadow hover:shadow-md',
        assignment.status === 'APPROVED' && 'bg-white opacity-100 border border-s-4 border-border',
        assignment.status === 'PENDING' && 'bg-white/90 opacity-85 border border-dashed border-s-4 border-border',
        assignment.status === 'REJECTED' && 'bg-white/70 opacity-50 border border-s-4 border-border',
      )}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span
          className={cn(
            'font-semibold text-[#1E2A5E] truncate',
            assignment.status === 'REJECTED' && 'line-through',
          )}
        >
          {assignment.universityName}
        </span>
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: typeBadgeBg }}
        >
          {isGroup ? t('card.group') : t('card.elective')}
        </span>
      </div>

      <div className="flex items-center justify-between text-[#1E2A5E]/70">
        <span className="flex items-center gap-1">
          {assignment.shiftType === 'MORNING' ? (
            <Sun className="size-3" />
          ) : (
            <Moon className="size-3" />
          )}
          <span>
            {assignment.shiftType === 'MORNING'
              ? t('filters.morning')
              : t('filters.evening')}
          </span>
        </span>

        <span className="flex items-center gap-1">
          <span>{t('filters.year')}: {assignment.yearInProgram}</span>
        </span>
      </div>

      <div className="mt-1 text-[#1E2A5E]/60 text-xs">
        {assignment.studentCount
          ? `${assignment.studentCount}`
          : t('card.noStudents')}
      </div>
    </div>
  )
}
