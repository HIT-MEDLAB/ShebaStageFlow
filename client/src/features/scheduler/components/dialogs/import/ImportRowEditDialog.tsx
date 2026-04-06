import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarDropdown } from '@/components/ui/calendar-dropdown'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import { createAssignmentSchema, type AssignmentFormData } from '../../../schemas/assignmentSchema'
import { useAcademicYears } from '../../../hooks/useAcademicYears'
import { useDepartments } from '../../../hooks/useDepartments'
import { useUniversities } from '../../../hooks/useUniversities'
import { useSchedulerStore } from '../../../stores/schedulerStore'
import type { SmartImportRow } from '../../../types/scheduler.types'

interface ImportRowEditDialogProps {
  open: boolean
  initialData: SmartImportRow
  onSave: (editedRow: SmartImportRow) => void
  onCancel: () => void
  isLoading?: boolean
}

/** Map Hebrew placement type to enum */
function placementTypeToEnum(placementType: string): 'GROUP' | 'ELECTIVE' {
  if (placementType === 'אלקטיב') return 'ELECTIVE'
  return 'GROUP'
}

/** Map enum back to Hebrew placement type */
function enumToPlacementType(type: 'GROUP' | 'ELECTIVE'): string {
  return type === 'ELECTIVE' ? 'אלקטיב' : 'רגיל'
}

/** Map Hebrew shift to enum */
function shiftToEnum(shift: string): 'MORNING' | 'EVENING' {
  if (shift === 'בוקר') return 'MORNING'
  return 'EVENING'
}

/** Map enum back to Hebrew shift */
function enumToShift(shiftType: 'MORNING' | 'EVENING'): string {
  return shiftType === 'MORNING' ? 'בוקר' : 'אחה"צ'
}

/** Parse an ISO date string to a Date, returning undefined on failure */
function parseDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? undefined : d
}

export function ImportRowEditDialog({
  open,
  initialData,
  onSave,
  onCancel,
  isLoading,
}: ImportRowEditDialogProps) {
  const { t } = useTranslation('scheduler')
  const { academicYearId } = useSchedulerStore()
  const { data: academicYears } = useAcademicYears()
  const currentYear = academicYears?.find((y) => y.id === academicYearId)
  const { data: departments } = useDepartments()
  const { data: universities } = useUniversities()

  const schema = useMemo(() => createAssignmentSchema(t), [t])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(schema),
  })

  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  // Convert SmartImportRow → AssignmentFormData on open
  useEffect(() => {
    if (!open) return

    const matchedDept = departments?.find(
      (d) => d.name === initialData.departmentName,
    )
    const matchedUni = universities?.find(
      (u) => u.name === initialData.universityName,
    )

    reset({
      departmentId: matchedDept?.id ?? (undefined as unknown as number),
      universityId: matchedUni?.id ?? (undefined as unknown as number),
      startDate: parseDate(initialData.startDate),
      endDate: parseDate(initialData.endDate),
      type: placementTypeToEnum(initialData.placementType),
      shiftType: shiftToEnum(initialData.shiftType),
      studentCount: initialData.studentCount ?? undefined,
      yearInProgram: initialData.yearInProgram,
      tutorName: initialData.tutorName ?? undefined,
    })
  }, [open, initialData, departments, universities, reset])

  function onSubmit(data: AssignmentFormData) {
    const deptName =
      departments?.find((d) => d.id === data.departmentId)?.name ??
      initialData.departmentName
    const uniName =
      universities?.find((u) => u.id === data.universityId)?.name ??
      initialData.universityName

    const editedRow: SmartImportRow = {
      departmentName: deptName,
      universityName: uniName,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      endDate: format(data.endDate, 'yyyy-MM-dd'),
      placementType: enumToPlacementType(data.type),
      shiftType: enumToShift(data.shiftType),
      studentCount: data.studentCount ?? null,
      yearInProgram: data.yearInProgram,
      tutorName: data.tutorName ?? null,
    }

    onSave(editedRow)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent dir="rtl" className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialogs.smartImport.edit')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Department */}
          <fieldset className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{t('dialogs.manual.department')}</label>
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value?.toString() ?? ''}
                  onValueChange={(val) => field.onChange(Number(val))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('dialogs.manual.department')} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.departmentId && (
              <p className="text-sm text-destructive">{errors.departmentId.message}</p>
            )}
          </fieldset>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <fieldset className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('dialogs.manual.startDate')}</label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-start font-normal"
                        disabled={isLoading}
                      >
                        <CalendarIcon className="size-4" />
                        {field.value ? format(field.value, 'dd/MM/yyyy') : t('dialogs.manual.startDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          setStartDateOpen(false)
                        }}
                        disabled={(date) => date.getDay() !== 0}
                        captionLayout="dropdown"
                        startMonth={currentYear ? new Date(currentYear.startDate) : undefined}
                        endMonth={currentYear ? new Date(currentYear.endDate) : undefined}
                        components={{ Dropdown: CalendarDropdown }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('dialogs.manual.endDate')}</label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-start font-normal"
                        disabled={isLoading}
                      >
                        <CalendarIcon className="size-4" />
                        {field.value ? format(field.value, 'dd/MM/yyyy') : t('dialogs.manual.endDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          setEndDateOpen(false)
                        }}
                        disabled={(date) => date.getDay() !== 4}
                        captionLayout="dropdown"
                        startMonth={currentYear ? new Date(currentYear.startDate) : undefined}
                        endMonth={currentYear ? new Date(currentYear.endDate) : undefined}
                        components={{ Dropdown: CalendarDropdown }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </fieldset>
          </div>

          {/* University */}
          <fieldset className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{t('dialogs.manual.university')}</label>
            <Controller
              name="universityId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value?.toString() ?? ''}
                  onValueChange={(val) => field.onChange(Number(val))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('dialogs.manual.university')} />
                  </SelectTrigger>
                  <SelectContent>
                    {universities?.map((uni) => (
                      <SelectItem key={uni.id} value={uni.id.toString()}>
                        {uni.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.universityId && (
              <p className="text-sm text-destructive">{errors.universityId.message}</p>
            )}
          </fieldset>

          {/* Type & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <fieldset className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('dialogs.manual.type')}</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={field.value}
                    onValueChange={(val) => { if (val) field.onChange(val) }}
                    className="w-full"
                    disabled={isLoading}
                  >
                    <ToggleGroupItem value="GROUP" className="flex-1">
                      {t('card.group')}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="ELECTIVE" className="flex-1">
                      {t('card.elective')}
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}
              />
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('dialogs.manual.shift')}</label>
              <Controller
                name="shiftType"
                control={control}
                render={({ field }) => (
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={field.value}
                    onValueChange={(val) => { if (val) field.onChange(val) }}
                    className="w-full"
                    disabled={isLoading}
                  >
                    <ToggleGroupItem value="MORNING" className="flex-1">
                      {t('filters.morning')}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="EVENING" className="flex-1">
                      {t('filters.evening')}
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}
              />
              {errors.shiftType && (
                <p className="text-sm text-destructive">{errors.shiftType.message}</p>
              )}
            </fieldset>
          </div>

          {/* Student Count & Year in Program */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <fieldset className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('dialogs.manual.studentCount')}</label>
              <Controller
                name="studentCount"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    min={1}
                    placeholder={t('dialogs.manual.studentCount')}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      field.onChange(val === '' ? undefined : Number(val))
                    }}
                    disabled={isLoading}
                  />
                )}
              />
              {errors.studentCount && (
                <p className="text-sm text-destructive">{errors.studentCount.message}</p>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('dialogs.manual.yearInProgram')}</label>
              <Controller
                name="yearInProgram"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() ?? ''}
                    onValueChange={(val) => field.onChange(Number(val))}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('dialogs.manual.yearInProgram')} />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.yearInProgram && (
                <p className="text-sm text-destructive">{errors.yearInProgram.message}</p>
              )}
            </fieldset>
          </div>

          {/* Tutor Name */}
          <fieldset className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{t('dialogs.manual.tutorName')}</label>
            <Controller
              name="tutorName"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder={t('dialogs.manual.tutorName')}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
          </fieldset>

          {/* Footer */}
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {t('dialogs.manual.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {t('dialogs.smartImport.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
