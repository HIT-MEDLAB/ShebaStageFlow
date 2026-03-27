import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WeekDefinition } from '@/features/scheduler/types/scheduler.types'

interface WeekSelectorProps {
  weeks: WeekDefinition[]
  selectedWeek: number
  onChange: (week: number) => void
}

export function WeekSelector({
  weeks,
  selectedWeek,
  onChange,
}: WeekSelectorProps) {
  const { t } = useTranslation('home')

  return (
    <Select
      value={String(selectedWeek)}
      onValueChange={(val) => onChange(Number(val))}
    >
      <SelectTrigger className="w-64">
        <SelectValue placeholder={t('weekSelector.label')} />
      </SelectTrigger>
      <SelectContent>
        {weeks.map((week) => (
          <SelectItem key={week.weekNumber} value={String(week.weekNumber)}>
            {t('weekSelector.weekRange', {
              number: week.weekNumber,
              start: format(week.startDate, 'yyyy-MM-dd'),
              end: format(week.endDate, 'yyyy-MM-dd'),
            })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
