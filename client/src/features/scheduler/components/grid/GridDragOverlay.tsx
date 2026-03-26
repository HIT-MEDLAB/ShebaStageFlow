import { useTranslation } from 'react-i18next'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Assignment } from '../../types/scheduler.types'

const UNIVERSITY_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#3b82f6',
  '#84cc16',
  '#f43f5e',
  '#a855f7',
  '#06b6d4',
] as const

interface GridDragOverlayProps {
  assignment: Assignment
}

export function GridDragOverlay({ assignment }: GridDragOverlayProps) {
  const { t } = useTranslation('scheduler')

  const universityColor =
    UNIVERSITY_COLORS[assignment.universityId % UNIVERSITY_COLORS.length]

  const isGroup = assignment.type === 'GROUP'
  const typeBadgeBg = isGroup ? '#BF3069' : '#44C2A4'

  return (
    <div
      style={{
        borderInlineStartColor: universityColor,
      }}
      className={cn(
        'w-[170px] rounded-lg border-s-4 border border-border bg-white p-2.5 text-sm',
        'shadow-xl scale-105 opacity-90 pointer-events-none',
      )}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="font-semibold text-[#1E2A5E] truncate">
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
