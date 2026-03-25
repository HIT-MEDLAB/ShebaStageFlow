import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  useCreateDateConstraint,
  useUpdateDateConstraint,
} from '../hooks/useDateConstraintMutations'
import {
  createDateConstraintFormSchema,
  type DateConstraintFormData,
} from '../schemas/constraints.schema'
import type { DateConstraint } from '../types/constraints.types'

interface AddEditDateConstraintDialogProps {
  open: boolean
  onClose: () => void
  constraint?: DateConstraint | null
}

function toDateInputValue(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0] ?? ''
}

export function AddEditDateConstraintDialog({
  open,
  onClose,
  constraint,
}: AddEditDateConstraintDialogProps) {
  const { t } = useTranslation('constraints')
  const isEdit = !!constraint

  const schema = useMemo(() => createDateConstraintFormSchema(t), [t])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DateConstraintFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: constraint?.name ?? '',
      description: constraint?.description ?? '',
      startDate: constraint ? toDateInputValue(constraint.startDate) : '',
      endDate: constraint ? toDateInputValue(constraint.endDate) : '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: constraint?.name ?? '',
        description: constraint?.description ?? '',
        startDate: constraint ? toDateInputValue(constraint.startDate) : '',
        endDate: constraint ? toDateInputValue(constraint.endDate) : '',
      })
    }
  }, [open, constraint, reset])

  const createMutation = useCreateDateConstraint()
  const updateMutation = useUpdateDateConstraint()
  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: DateConstraintFormData) => {
    if (isEdit && constraint) {
      updateMutation.mutate(
        { id: constraint.id, data },
        { onSuccess: () => onClose() },
      )
    } else {
      createMutation.mutate(data, { onSuccess: () => onClose() })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('dialogs.editDateConstraint.title') : t('dialogs.addDateConstraint.title')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('dialogs.editDateConstraint.title') : t('dialogs.addDateConstraint.title')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('dialogs.addDateConstraint.nameLabel')}</Label>
            <Input
              id="name"
              placeholder={t('dialogs.addDateConstraint.namePlaceholder')}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('dialogs.addDateConstraint.descriptionLabel')}</Label>
            <Textarea
              id="description"
              placeholder={t('dialogs.addDateConstraint.descriptionPlaceholder')}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('dialogs.addDateConstraint.startDateLabel')}</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('dialogs.addDateConstraint.endDateLabel')}</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t('dialogs.addDateConstraint.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t('dialogs.addDateConstraint.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
