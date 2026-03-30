import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { BlockReason } from '../../types/scheduler.types'

interface WarningOverlayProps {
  reason: BlockReason
}

export function WarningOverlay({ reason }: WarningOverlayProps) {
  const { t } = useTranslation('scheduler')

  const label = reason.constraintName ?? t('grid.warning.softConstraint')
  const tooltipText = reason.description || label

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute inset-0 z-[1] flex items-start justify-end p-1 pointer-events-none">
            <div className="flex items-center gap-0.5 rounded bg-amber-100/80 px-1 py-0.5 pointer-events-auto">
              <AlertTriangle className="size-3 text-amber-600" />
              <span className="text-[9px] text-amber-700 leading-tight truncate max-w-[60px]">
                {label}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
