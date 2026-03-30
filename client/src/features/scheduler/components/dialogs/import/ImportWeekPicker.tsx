import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface ImportWeekPickerProps {
  suggestedWeeks: Array<{ startDate: string; endDate: string }>
  onSelect: (startDate: string, endDate: string) => void
}

export function ImportWeekPicker({ suggestedWeeks, onSelect }: ImportWeekPickerProps) {
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
    // Compute Thursday from Sunday
    const endDate = new Date(manualDate)
    endDate.setDate(endDate.getDate() + 4)
    onSelect(manualDate.toISOString(), endDate.toISOString())
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
                onClick={() => onSelect(week.startDate, week.endDate)}
                className={cn(
                  'rounded-md border px-2 py-1 text-xs',
                  'hover:border-primary hover:bg-accent transition-colors',
                )}
              >
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
          disabled={!manualDate}
          onClick={handleManualConfirm}
        >
          {t('dialogs.smartImport.confirm')}
        </Button>
      </div>
    </div>
  )
}
