import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CalendarIcon, ChevronDown, ChevronUp, Sun, Moon, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
import { Separator } from '@/components/ui/separator'

import { createAssignmentSchema, type AssignmentFormData } from '../../schemas/assignmentSchema'
import { fetchAssignmentById } from '../../api/scheduler.api'
import { useUpdateAssignment } from '../../hooks/useUpdateAssignment'
import { useDeleteAssignment } from '../../hooks/useDeleteAssignment'
import { useDepartments } from '../../hooks/useDepartments'
import { useUniversities } from '../../hooks/useUniversities'
import { useSchedulerStore } from '../../stores/schedulerStore'
import { StudentListSection } from './StudentListSection'
import type { Student } from '../../types/scheduler.types'

export function EditAssignmentDialog() {
  const { t } = useTranslation('scheduler')
  const { activeDialog, editingAssignmentId, closeDialog } = useSchedulerStore()
  const isOpen = activeDialog === 'edit'

  const { data: assignment } = useQuery({
    queryKey: ['scheduler', 'assignment', editingAssignmentId],
    queryFn: () => fetchAssignmentById(editingAssignmentId!),
    enabled: !!editingAssignmentId,
  })

  const { data: departments } = useDepartments()
  const { data: universities } = useUniversities()
  const updateAssignment = useUpdateAssignment()
  const deleteAssignment = useDeleteAssignment()

  const [showEditForm, setShowEditForm] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const schema = useMemo(() => createAssignmentSchema(t), [t])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(schema),
  })

  // Reset form with assignment data when assignment loads or changes
  useEffect(() => {
    if (assignment) {
      reset({
        departmentId: assignment.departmentId,
        startDate: new Date(assignment.startDate),
        endDate: new Date(assignment.endDate),
        universityId: assignment.universityId,
        type: assignment.type,
        shiftType: assignment.shiftType,
        studentCount: assignment.studentCount ?? undefined,
        yearInProgram: assignment.yearInProgram,
        tutorName: assignment.tutorName ?? undefined,
      })
    }
  }, [assignment, reset])

  function handleClose() {
    closeDialog()
    setShowEditForm(false)
    reset()
  }

  async function onSubmit(data: AssignmentFormData) {
    if (!editingAssignmentId) return

    updateAssignment.mutate(
      {
        id: editingAssignmentId,
        data: {
          departmentId: data.departmentId,
          universityId: data.universityId,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          type: data.type,
          shiftType: data.shiftType,
          studentCount: data.studentCount ?? null,
          yearInProgram: data.yearInProgram,
          tutorName: data.tutorName ?? null,
        },
      },
      {
        onSuccess: () => {
          setShowEditForm(false)
        },
        onError: () => {
          toast.error(t('toast.importFailed'))
        },
      },
    )
  }

  function handleDelete() {
    if (!editingAssignmentId) return

    deleteAssignment.mutate(editingAssignmentId, {
      onSuccess: () => {
        handleClose()
      },
    })
  }

  // Map students from the nested structure
  const students: Student[] = useMemo(() => {
    if (!assignment?.students) return []
    return assignment.students.map((as) => as.student)
  }, [assignment])

  if (!assignment) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent dir="rtl" className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('dialogs.edit.title')}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const isGroup = assignment.type === 'GROUP'
  const typeBadgeBg = isGroup ? '#BF3069' : '#44C2A4'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent dir="rtl" className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialogs.edit.title')}</DialogTitle>
        </DialogHeader>

        {/* Summary header */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-base">{assignment.universityName}</span>
          <span className="text-sm text-muted-foreground">
            {t('filters.year')}: {assignment.yearInProgram}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: typeBadgeBg }}
          >
            {isGroup ? t('card.group') : t('card.elective')}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
            {assignment.shiftType === 'MORNING' ? (
              <Sun className="size-3" />
            ) : (
              <Moon className="size-3" />
            )}
            {assignment.shiftType === 'MORNING'
              ? t('filters.morning')
              : t('filters.evening')}
          </span>
          <span className="text-sm text-muted-foreground">
            {students.length}/{assignment.studentCount ?? 0}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ms-auto"
            onClick={() => setShowEditForm((prev) => !prev)}
          >
            {showEditForm ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {t('dialogs.edit.editDetails')}
          </Button>
        </div>

        {/* Collapsible edit form */}
        {showEditForm && (
          <>
            <Separator />
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
                          >
                            <CalendarIcon className="size-4" />
                            {field.value
                              ? format(field.value, 'dd/MM/yyyy')
                              : t('dialogs.manual.startDate')}
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
                            {field.value
                              ? format(field.value, 'dd/MM/yyyy')
                              : t('dialogs.manual.endDate')}
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

              {/* Student Count & Year */}
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

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditForm(false)}
                >
                  {t('dialogs.manual.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || updateAssignment.isPending}
                >
                  {t('dialogs.edit.saveChanges')}
                </Button>
              </div>
            </form>
          </>
        )}

        <Separator />

        {/* Student list section */}
        <StudentListSection
          assignmentId={assignment.id}
          studentCount={assignment.studentCount}
          students={students}
        />

        <Separator />

        {/* Delete assignment */}
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" size="sm">
                <Trash2 className="size-4" />
                {t('dialogs.edit.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>{t('dialogs.edit.delete')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('dialogs.edit.deleteConfirm')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('dialogs.manual.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('dialogs.edit.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  )
}
