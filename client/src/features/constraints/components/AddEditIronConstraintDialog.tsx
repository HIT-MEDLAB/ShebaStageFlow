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
  useCreateIronConstraint,
  useUpdateIronConstraint,
} from '../hooks/useIronConstraintMutations'
import {
  createIronConstraintFormSchema,
  type IronConstraintFormData,
} from '../schemas/constraints.schema'
import type { IronConstraint } from '../types/constraints.types'

interface AddEditIronConstraintDialogProps {
  open: boolean
  onClose: () => void
  constraint?: IronConstraint | null
}

export function AddEditIronConstraintDialog({
  open,
  onClose,
  constraint,
}: AddEditIronConstraintDialogProps) {
  const { t } = useTranslation('constraints')
  const isEdit = !!constraint

  const schema = useMemo(() => createIronConstraintFormSchema(t), [t])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IronConstraintFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: constraint?.name ?? '',
      description: constraint?.description ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: constraint?.name ?? '',
        description: constraint?.description ?? '',
      })
    }
  }, [open, constraint, reset])

  const createMutation = useCreateIronConstraint()
  const updateMutation = useUpdateIronConstraint()
  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: IronConstraintFormData) => {
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
            {isEdit ? t('dialogs.editIronConstraint.title') : t('dialogs.addIronConstraint.title')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('dialogs.editIronConstraint.title') : t('dialogs.addIronConstraint.title')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('dialogs.addIronConstraint.nameLabel')}</Label>
            <Input
              id="name"
              placeholder={t('dialogs.addIronConstraint.namePlaceholder')}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('dialogs.addIronConstraint.descriptionLabel')}</Label>
            <Textarea
              id="description"
              placeholder={t('dialogs.addIronConstraint.descriptionPlaceholder')}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t('dialogs.addIronConstraint.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t('dialogs.addIronConstraint.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
