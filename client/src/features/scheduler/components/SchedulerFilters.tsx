import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useSchedulerStore } from '../stores/schedulerStore'
import { useUniversities } from '../hooks/useUniversities'

const YEAR_OPTIONS = [3, 4, 5, 6] as const

export function SchedulerFilters() {
  const { t } = useTranslation('scheduler')
  const {
    selectedUniversities,
    selectedShift,
    selectedYear,
    setUniversityFilter,
    setShiftFilter,
    setYearFilter,
  } = useSchedulerStore()
  const { data: universities } = useUniversities()

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* University filter */}
      <Select
        value={selectedUniversities.length === 1 ? selectedUniversities[0].toString() : 'all'}
        onValueChange={(value) => {
          if (value === 'all') {
            setUniversityFilter([])
          } else {
            setUniversityFilter([Number(value)])
          }
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t('filters.university')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filters.allUniversities')}</SelectItem>
          {universities?.map((uni) => (
            <SelectItem key={uni.id} value={uni.id.toString()}>
              {uni.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Shift filter */}
      <ToggleGroup
        type="single"
        variant="outline"
        value={selectedShift}
        onValueChange={(value) => {
          if (value) {
            setShiftFilter(value as 'all' | 'morning' | 'evening')
          }
        }}
      >
        <ToggleGroupItem value="all">{t('filters.allShifts')}</ToggleGroupItem>
        <ToggleGroupItem value="morning">{t('filters.morning')}</ToggleGroupItem>
        <ToggleGroupItem value="evening">{t('filters.evening')}</ToggleGroupItem>
      </ToggleGroup>

      {/* Year filter */}
      <Select
        value={selectedYear?.toString() ?? 'all'}
        onValueChange={(value) => {
          if (value === 'all') {
            setYearFilter(null)
          } else {
            setYearFilter(Number(value))
          }
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('filters.year')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filters.allYears')}</SelectItem>
          {YEAR_OPTIONS.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {t('filters.year')}: {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
