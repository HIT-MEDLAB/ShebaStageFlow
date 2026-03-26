import { useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'

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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useIsAdmin } from '@/hooks/useIsAdmin'

import { createAssignmentSchema, type AssignmentFormData } from '../../schemas/assignmentSchema'
import { useCreateAssignment } from '../../hooks/useCreateAssignment'
import { useDepartments } from '../../hooks/useDepartments'
import { useUniversities } from '../../hooks/useUniversities'
import { useAssignments } from '../../hooks/useAssignments'
import { useConstraints } from '../../hooks/useConstraints'
import { useAcademicYears } from '../../hooks/useAcademicYears'
import { useAcademicYearWeeks } from '../../hooks/useAcademicYearWeeks'
import { useBlockedCells } from '../../hooks/useBlockedCells'
import { useSchedulerStore } from '../../stores/schedulerStore'
import { validateDrop } from '../../validators/assignmentValidator'
import { findAvailableWeeks } from '../../validators/findAvailableWeeks'
import type { Assignment } from '../../types/scheduler.types'

export function ManualAssignmentDialog() {
  const { t } = useTranslation('scheduler')
  const {
    activeDialog,
    closeDialog,
    academicYearId,
    selectedUniversities,
    selectedShift,
    selectedYear,
    openReplacementDialog,
    openAdminOverrideDialog,
  } = useSchedulerStore()
  const isOpen = activeDialog === 'create'
  const isAdmin = useIsAdmin()

  const { data: departments } = useDepartments()
  const { data: universities } = useUniversities()
  const createAssignment = useCreateAssignment()

  const { data: academicYears } = useAcademicYears()
  const currentYear = academicYears?.find((y) => y.id === academicYearId)
  const { data: assignments } = useAssignments(academicYearId, {
    selectedUniversities,
    selectedShift,
    selectedYear,
  })
  const constraintYears = currentYear
    ? [...new Set([
        new Date(currentYear.startDate).getFullYear(),
        new Date(currentYear.endDate).getFullYear(),
      ])]
    : null
  const { data: constraints } = useConstraints(constraintYears)
  const weeks = useAcademicYearWeeks(currentYear)
  const blockedCells = useBlockedCells(constraints, weeks)

  const universityPriorities = useMemo(
    () => new Map((universities ?? []).map((u) => [u.id, u.priority])),
    [universities],
  )

  const schema = useMemo(() => createAssignmentSchema(t), [t])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'GROUP',
      shiftType: 'MORNING',
    },
  })

  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  function handleClose() {
    closeDialog()
    reset()
  }

  async function onSubmit(data: AssignmentFormData) {
    if (!academicYearId) {
      toast.error(t('dialogs.validation.academicYearRequired'))
      return
    }

    // Pre-creation validation
    if (assignments && constraints) {
      const week = weeks.find((w) => data.startDate >= w.startDate && data.startDate <= w.endDate)
      if (week) {
        const universityName = universities?.find((u) => u.id === data.universityId)?.name ?? ''
        const departmentName = departments?.find((d) => d.id === data.departmentId)?.name ?? ''

        const tempAssignment: Assignment = {
          id: 0,
          departmentId: data.departmentId,
          universityId: data.universityId,
          academicYearId,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          type: data.type,
          shiftType: data.shiftType,
          status: 'PENDING',
          studentCount: data.studentCount ?? null,
          yearInProgram: data.yearInProgram,
          tutorName: data.tutorName ?? null,
          universityName,
          departmentName,
        }

        const validationContext = {
          blockedCells,
          existingAssignments: assignments,
          departmentConstraints: constraints.departmentConstraints,
          ironConstraints: constraints.ironConstraints,
          weeks,
          universityPriorities,
          isAdmin,
        }

        const result = validateDrop(tempAssignment, data.departmentId, week.weekNumber, validationContext)

        switch (result.type) {
          case 'valid':
            break // proceed to create
          case 'blocked':
            toast.error(t(result.reasonKey, result.reasonParams))
            return
          case 'conflict_replaceable': {
            const suggestedWeeks = findAvailableWeeks(
              result.displacedAssignment,
              week.weekNumber,
              validationContext,
            )
            // Close manual dialog and open replacement
            handleClose()
            openReplacementDialog(
              { assignment: tempAssignment, targetDeptId: data.departmentId, targetWeekNum: week.weekNumber },
              result.displacedAssignment,
              suggestedWeeks,
            )
            return
          }
          case 'conflict_same_priority':
            if (isAdmin) {
              handleClose()
              openAdminOverrideDialog(
                { assignment: tempAssignment, targetDeptId: data.departmentId, targetWeekNum: week.weekNumber },
                result.reasonKey,
              )
            } else {
              toast.error(t(result.reasonKey))
            }
            return
          case 'conflict_admin_override':
            if (isAdmin) {
              handleClose()
              openAdminOverrideDialog(
                { assignment: tempAssignment, targetDeptId: data.departmentId, targetWeekNum: week.weekNumber },
                result.reasonKey,
                result.reasonParams,
              )
            } else {
              toast.error(t(result.reasonKey, result.reasonParams))
            }
            return
        }
      }
    }

    createAssignment.mutate(
      {
        departmentId: data.departmentId,
        universityId: data.universityId,
        academicYearId,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        type: data.type,
        shiftType: data.shiftType,
        studentCount: data.studentCount ?? null,
        yearInProgram: data.yearInProgram,
        tutorName: data.tutorName ?? null,
      },
      {
        onSuccess: () => {
          handleClose()
        },
        onError: () => {
          toast.error(t('toast.importFailed'))
        },
      },
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent dir="rtl" className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialogs.manual.title')}</DialogTitle>
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

          {/* Start Date & End Date - grid pair */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date (Sunday) */}
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
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </fieldset>

            {/* End Date (Thursday) */}
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

          {/* Type & Shift - grid pair */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assignment Type */}
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

            {/* Shift */}
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

          {/* Student Count & Year in Program - grid pair */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Count */}
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
                  />
                )}
              />
              {errors.studentCount && (
                <p className="text-sm text-destructive">{errors.studentCount.message}</p>
              )}
            </fieldset>

            {/* Year in Program */}
            <fieldset className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('dialogs.manual.yearInProgram')}</label>
              <Controller
                name="yearInProgram"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() ?? ''}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('dialogs.manual.yearInProgram')} />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 4, 5, 6].map((year) => (
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
                />
              )}
            />
          </fieldset>

          {/* Footer buttons */}
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('dialogs.manual.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || createAssignment.isPending}>
              {t('dialogs.manual.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
