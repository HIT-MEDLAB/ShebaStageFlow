import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Upload, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSchedulerStore } from '../stores/schedulerStore'
import { useAcademicYears } from '../hooks/useAcademicYears'
import { fetchAssignmentsForExport, clearAllAssignments } from '../api/scheduler.api'
import { exportSchedulerToExcel } from '../utils/exportSchedulerToExcel'
import { getCurrentAcademicYearName } from '../utils/getCurrentAcademicYearName'

export function SchedulerToolbar() {
  const { t } = useTranslation('scheduler')
  const {
    academicYearId,
    setAcademicYear,
    openDialog,
    selectedUniversities,
    selectedShift,
    selectedYear,
  } = useSchedulerStore()
  const { data: academicYears } = useAcademicYears()
  const [exporting, setExporting] = useState(false)
  const queryClient = useQueryClient()

  const clearAllMutation = useMutation({
    mutationFn: clearAllAssignments,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
      toast.success(t('toast.allAssignmentsCleared', { count: data.deleted }))
    },
    onError: () => {
      toast.error(t('toast.clearAllFailed'))
    },
  })

  const handleClearAll = () => {
    if (window.confirm(t('toolbar.clearAllConfirm'))) {
      clearAllMutation.mutate()
    }
  }

  const handleExport = async () => {
    if (!academicYearId) return
    setExporting(true)
    try {
      const data = await fetchAssignmentsForExport(academicYearId, {
        selectedUniversities,
        selectedShift,
        selectedYear,
      })
      exportSchedulerToExcel(data)
    } finally {
      setExporting(false)
    }
  }

  // Auto-select current academic year when data loads and none is selected
  useEffect(() => {
    if (academicYears?.length && !academicYearId) {
      const currentName = getCurrentAcademicYearName()
      const current = academicYears.find((y) => y.name === currentName)
      setAcademicYear(current?.id ?? academicYears[0].id)
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
        <Button
          variant="destructive"
          onClick={handleClearAll}
          disabled={clearAllMutation.isPending}
        >
          <Trash2 />
          {t('toolbar.clearAll')}
        </Button>

        <Button
          variant="outline"
          onClick={handleExport}
          disabled={!academicYearId || exporting}
        >
          <Download />
          {t('toolbar.exportExcel')}
        </Button>

        <Button variant="outline" onClick={() => openDialog('smartImport')}>
          <Upload />
          {t('toolbar.smartImport')}
        </Button>

        <Button onClick={() => openDialog('create')}>
          <Plus />
          {t('toolbar.manualAssignment')}
        </Button>
      </div>
    </div>
  )
}
