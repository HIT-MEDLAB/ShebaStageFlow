import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

import type { Assignment, WeekDefinition } from '../../types/scheduler.types'

interface ReplacementDialogProps {
  open: boolean
  displacedAssignment: Assignment
  suggestedWeeks: WeekDefinition[]
  allWeeks: WeekDefinition[]
  onReplace: (week: WeekDefinition) => void
  onCancel: () => void
}

export function ReplacementDialog({
  open,
  displacedAssignment,
  suggestedWeeks,
  allWeeks,
  onReplace,
  onCancel,
}: ReplacementDialogProps) {
  const { t } = useTranslation('scheduler')
  const [manualDate, setManualDate] = useState<Date | undefined>()
  const [calendarOpen, setCalendarOpen] = useState(false)

  function handleManualSelect(date: Date | undefined) {
    if (!date) return
    setManualDate(date)
    setCalendarOpen(false)
  }

  function handleManualConfirm() {
    if (!manualDate) return
    const week = allWeeks.find(
      (w) => manualDate >= w.startDate && manualDate <= w.endDate,
    )
    if (week) onReplace(week)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent dir="rtl" className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('dialogs.replacement.title')}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {t('dialogs.replacement.description', {
            university: displacedAssignment.universityName,
            year: displacedAssignment.yearInProgram,
            shift:
              displacedAssignment.shiftType === 'MORNING'
                ? t('filters.morning')
                : t('filters.evening'),
          })}
        </p>

        {/* Suggested weeks */}
        {suggestedWeeks.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              {t('dialogs.replacement.suggestedWeeks')}
            </p>
            <div className="flex flex-col gap-2">
              {suggestedWeeks.map((week) => (
                <button
                  key={week.weekNumber}
                  type="button"
                  onClick={() => onReplace(week)}
                  className={cn(
                    'flex items-center justify-between rounded-md border p-3 text-sm',
                    'hover:border-primary hover:bg-accent transition-colors text-start',
                  )}
                >
                  <span className="font-medium">
                    {t('dialogs.replacement.week', {
                      number: week.weekNumber,
                    })}
                  </span>
                  <span className="text-muted-foreground">
                    {format(week.startDate, 'dd/MM')} –{' '}
                    {format(week.endDate, 'dd/MM')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual week picker */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            {t('dialogs.replacement.chooseManually')}
          </p>
          <div className="flex items-center gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 justify-start text-start font-normal"
                >
                  <CalendarIcon className="size-4" />
                  {manualDate
                    ? format(manualDate, 'dd/MM/yyyy')
                    : t('dialogs.replacement.chooseManually')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={manualDate}
                  onSelect={handleManualSelect}
                  disabled={(date) => date.getDay() !== 0}
                />
              </PopoverContent>
            </Popover>
            <Button
              type="button"
              disabled={!manualDate}
              onClick={handleManualConfirm}
            >
              {t('dialogs.replacement.confirm')}
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('dialogs.replacement.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
