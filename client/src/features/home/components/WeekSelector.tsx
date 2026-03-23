import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Week } from '../types/home.types'

interface WeekSelectorProps {
  weeks: Week[]
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
              start: week.startDate,
              end: week.endDate,
            })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
