import { useTranslation } from 'react-i18next'
import { CalendarOff, Lock, AlertTriangle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { BlockReason } from '../../types/scheduler.types'

interface BlockedOverlayProps {
  reason: BlockReason
}

const blockConfig = {
  holiday: {
    icon: CalendarOff,
    bgClass: 'bg-[#f1f5f9] border-dashed border-slate-300',
    textKey: 'grid.blocked.holiday' as const,
  },
  dateBlock: {
    icon: Lock,
    bgClass: 'bg-[#fef2f2] border-dashed border-red-200',
    textKey: 'grid.blocked.dateBlock' as const,
  },
  capacityFull: {
    icon: AlertTriangle,
    bgClass: 'bg-white border-[#fcd34d] border-solid',
    textKey: 'grid.blocked.capacityFull' as const,
  },
} as const

export function BlockedOverlay({ reason }: BlockedOverlayProps) {
  const { t } = useTranslation('scheduler')

  const config = blockConfig[reason.type]
  const Icon = config.icon
  const label = t(config.textKey)
  const tooltipText = reason.description || label

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'absolute inset-0 z-[1] flex flex-col items-center justify-center gap-1 rounded-lg border',
              config.bgClass,
            )}
          >
            <Icon className="size-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground text-center px-1 leading-tight">
              {reason.type === 'holiday' && reason.constraintName
                ? reason.constraintName
                : label}
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
