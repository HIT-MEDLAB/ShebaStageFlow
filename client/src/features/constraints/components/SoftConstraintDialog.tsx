import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { softConstraintFormSchema, type SoftConstraintFormValues } from '../schemas/constraints.schemas'
import type { SoftConstraint, DepartmentWithConstraint, UniversityWithSemester } from '../types/constraints.types'

interface SoftConstraintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  constraint: SoftConstraint | null
  departments: DepartmentWithConstraint[]
  universities: UniversityWithSemester[]
  onSubmit: (data: SoftConstraintFormValues) => void
  isPending: boolean
}

export function SoftConstraintDialog({
  open,
  onOpenChange,
  constraint,
  departments,
  universities,
  onSubmit,
  isPending,
}: SoftConstraintDialogProps) {
  const { t } = useTranslation('constraints')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SoftConstraintFormValues>({
    resolver: zodResolver(softConstraintFormSchema),
    defaultValues: {
      name: '',
      description: '',
      priority: 0,
      departmentId: null,
      universityId: null,
      startDate: null,
      endDate: null,
    },
  })

  useEffect(() => {
    if (constraint) {
      reset({
        name: constraint.name,
        description: constraint.description,
        priority: constraint.priority,
        departmentId: constraint.departmentId,
        universityId: constraint.universityId,
        startDate: constraint.startDate ? constraint.startDate.split('T')[0] : null,
        endDate: constraint.endDate ? constraint.endDate.split('T')[0] : null,
      })
    } else {
      reset({
        name: '',
        description: '',
        priority: 0,
        departmentId: null,
        universityId: null,
        startDate: null,
        endDate: null,
      })
    }
  }, [constraint, reset])

  const departmentId = watch('departmentId')
  const universityId = watch('universityId')

  function handleFormSubmit(data: SoftConstraintFormValues) {
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {constraint ? t('dialog.editTitle') : t('dialog.addTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('form.name')}</Label>
            <Input {...register('name')} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('form.description')}</Label>
            <Textarea {...register('description')} rows={3} />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('form.priority')}</Label>
            <Input type="number" min={0} {...register('priority')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('form.department')}</Label>
              <Select
                value={departmentId?.toString() ?? 'all'}
                onValueChange={(val) => setValue('departmentId', val === 'all' ? null : Number(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('form.allDepartments')}</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t('form.university')}</Label>
              <Select
                value={universityId?.toString() ?? 'all'}
                onValueChange={(val) => setValue('universityId', val === 'all' ? null : Number(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('form.allUniversities')}</SelectItem>
                  {universities.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('form.startDate')}</Label>
              <Input
                type="date"
                {...register('startDate')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('form.endDate')}</Label>
              <Input
                type="date"
                {...register('endDate')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('form.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {constraint ? t('form.save') : t('form.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
