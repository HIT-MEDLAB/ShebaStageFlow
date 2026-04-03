import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface ImportWeekPickerProps {
  suggestedWeeks: Array<{ startDate: string; endDate: string }>
  onSelect: (startDate: string, endDate: string) => Promise<void>
  isValidating?: boolean
  validationError?: string
}

export function ImportWeekPicker({ suggestedWeeks, onSelect, isValidating, validationError }: ImportWeekPickerProps) {
  const { t } = useTranslation('scheduler')
  const [manualDate, setManualDate] = useState<Date | undefined>()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [clickedIndex, setClickedIndex] = useState<number | null>(null)

  function handleManualSelect(date: Date | undefined) {
    if (!date) return
    setManualDate(date)
    setCalendarOpen(false)
  }

  async function handleManualConfirm() {
    if (!manualDate) return
    // Compute Thursday from Sunday
    const endDate = new Date(manualDate)
    endDate.setDate(endDate.getDate() + 4)
    setClickedIndex(-1)
    await onSelect(manualDate.toISOString(), endDate.toISOString())
  }

  async function handleSuggestedClick(week: { startDate: string; endDate: string }, index: number) {
    setClickedIndex(index)
    await onSelect(week.startDate, week.endDate)
  }

  return (
    <div className="flex flex-col gap-2">
      {suggestedWeeks.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t('dialogs.smartImport.suggestedWeeks')}
          </p>
          <div className="flex flex-wrap gap-1">
            {suggestedWeeks.map((week, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestedClick(week, i)}
                disabled={isValidating}
                className={cn(
                  'rounded-md border px-2 py-1 text-xs',
                  'hover:border-primary hover:bg-accent transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'inline-flex items-center gap-1',
                )}
              >
                {isValidating && clickedIndex === i && (
                  <Loader2 className="size-3 animate-spin" />
                )}
                {format(new Date(week.startDate), 'dd/MM')} –{' '}
                {format(new Date(week.endDate), 'dd/MM')}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs flex-1 justify-start"
              disabled={isValidating}
            >
              <CalendarIcon className="size-3" />
              {manualDate
                ? format(manualDate, 'dd/MM/yyyy')
                : t('dialogs.smartImport.pickManually')}
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
          size="sm"
          className="h-7 text-xs"
          disabled={!manualDate || isValidating}
          onClick={handleManualConfirm}
        >
          {isValidating && clickedIndex === -1 && (
            <Loader2 className="size-3 animate-spin me-1" />
          )}
          {t('dialogs.smartImport.confirm')}
        </Button>
      </div>

      {validationError && (
        <p className="text-xs text-destructive">{validationError}</p>
      )}
    </div>
  )
}
