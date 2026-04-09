import { useTranslation } from 'react-i18next'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Timeframe } from '../types/statistics.types'

interface TimeframeToggleProps {
  value: Timeframe
  onChange: (value: Timeframe) => void
}

export function TimeframeToggle({ value, onChange }: TimeframeToggleProps) {
  const { t } = useTranslation('statistics')

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => {
        if (val) onChange(val as Timeframe)
      }}
    >
      <ToggleGroupItem value="weekly" aria-label={t('timeframe.weekly')}>
        {t('timeframe.weekly')}
      </ToggleGroupItem>
      <ToggleGroupItem value="calendarYear" aria-label={t('timeframe.calendarYear')}>
        {t('timeframe.calendarYear')}
      </ToggleGroupItem>
      <ToggleGroupItem value="academicYear" aria-label={t('timeframe.academicYear')}>
        {t('timeframe.academicYear')}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
