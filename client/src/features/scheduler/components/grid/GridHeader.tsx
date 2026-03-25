import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import type { WeekDefinition } from '../../types/scheduler.types'

interface GridHeaderProps {
  weeks: WeekDefinition[]
}

export function GridHeader({ weeks }: GridHeaderProps) {
  const { t, i18n } = useTranslation('scheduler')

  const isHebrew = i18n.language === 'he'
  const locale = isHebrew ? he : undefined

  const formatDate = (date: Date) =>
    format(date, 'dd/MM', { locale })

  return (
    <>
      {/* Corner cell: sticky top + sticky inline-end (RTL right) */}
      <div
        className="sticky top-0 z-20 bg-[#1E2A5E] text-white font-semibold text-sm flex items-center justify-center p-2"
        style={{ insetInlineStart: 0 }}
      >
        {t('grid.departments')}
      </div>

      {/* Week header cells */}
      {weeks.map((week) => (
        <div
          key={week.weekNumber}
          className="sticky top-0 z-10 bg-[#1E2A5E] text-white text-center p-2"
        >
          <div className="text-sm font-semibold">
            {t('grid.week')} {week.weekNumber}
          </div>
          <div className="text-xs opacity-80">
            {formatDate(week.startDate)} - {formatDate(week.endDate)}
          </div>
        </div>
      ))}
    </>
  )
}
