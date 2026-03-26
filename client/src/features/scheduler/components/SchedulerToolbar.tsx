import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSchedulerStore } from '../stores/schedulerStore'
import { useAcademicYears } from '../hooks/useAcademicYears'

export function SchedulerToolbar() {
  const { t } = useTranslation('scheduler')
  const { academicYearId, setAcademicYear, openDialog } = useSchedulerStore()
  const { data: academicYears } = useAcademicYears()

  // Auto-select first academic year when data loads and none is selected
  useEffect(() => {
    if (academicYears?.length && !academicYearId) {
      setAcademicYear(academicYears[0].id)
    }
  }, [academicYears, academicYearId, setAcademicYear])

  return (
    <div className="flex items-center gap-3 flex-wrap shrink-0">
      <Select
        value={academicYearId?.toString() ?? ''}
        onValueChange={(value) => setAcademicYear(Number(value))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('toolbar.academicYear')} />
        </SelectTrigger>
        <SelectContent>
          {academicYears?.map((year) => (
            <SelectItem key={year.id} value={year.id.toString()}>
              {year.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 ms-auto">
        <Button variant="outline" onClick={() => openDialog('import')}>
          <Upload />
          {t('toolbar.importExcel')}
        </Button>

        <Button onClick={() => openDialog('create')}>
          <Plus />
          {t('toolbar.manualAssignment')}
        </Button>
      </div>
    </div>
  )
}
