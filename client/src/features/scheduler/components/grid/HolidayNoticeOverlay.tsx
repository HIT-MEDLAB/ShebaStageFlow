import { useTranslation } from 'react-i18next'
import { CalendarDays } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { BlockReason } from '../../types/scheduler.types'

interface HolidayNoticeOverlayProps {
  reason: BlockReason
}

export function HolidayNoticeOverlay({ reason }: HolidayNoticeOverlayProps) {
  const { t } = useTranslation('scheduler')

  const label = reason.description
  const tooltipText = t('grid.notice.shortenedWeek', { name: reason.description })

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute inset-x-0 top-0 z-[1] flex items-center gap-1 rounded-t-lg bg-amber-50 border-b border-amber-200 px-2 py-0.5 pointer-events-auto">
            <CalendarDays className="size-3 text-amber-600 shrink-0" />
            <span className="text-[9px] text-amber-700 leading-tight truncate">
              {label}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
