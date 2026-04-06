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

interface StatisticsWeekSelectorProps {
  weeks: WeekDefinition[]
  selectedWeek: number
  onChange: (week: number) => void
}

export function StatisticsWeekSelector({
  weeks,
  selectedWeek,
  onChange,
}: StatisticsWeekSelectorProps) {
  const { t } = useTranslation('statistics')

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
          <SelectItem
            key={week.weekNumber}
            value={String(week.weekNumber)}
          >
            {t('weekSelector.weekRange', {
              start: format(week.startDate, 'dd/MM/yy'),
              end: format(week.endDate, 'dd/MM/yy'),
            })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
