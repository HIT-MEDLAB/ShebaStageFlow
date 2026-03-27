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
import { Label } from '@/components/ui/label'
import { coordinatorFormSchema, type CoordinatorFormValues } from '../schemas/coordinator.schemas'
import type { Coordinator } from '../types/coordinator.types'

interface CoordinatorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coordinator: Coordinator | null
  onSubmit: (data: CoordinatorFormValues) => void
  isPending: boolean
}

export function CoordinatorDialog({
  open,
  onOpenChange,
  coordinator,
  onSubmit,
  isPending,
}: CoordinatorDialogProps) {
  const { t } = useTranslation('coordinators')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CoordinatorFormValues>({
    resolver: zodResolver(coordinatorFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (!open) return
    if (coordinator) {
      reset({
        firstName: coordinator.firstName,
        lastName: coordinator.lastName,
        email: coordinator.email,
        phone: coordinator.phone ?? '',
      })
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      })
    }
  }, [coordinator, open, reset])

  function handleFormSubmit(data: CoordinatorFormValues) {
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {coordinator ? t('dialog.editTitle') : t('dialog.addTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('form.firstName')}</Label>
              <Input {...register('firstName')} />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t('form.lastName')}</Label>
              <Input {...register('lastName')} />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('form.email')}</Label>
            <Input type="email" {...register('email')} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('form.phone')}</Label>
            <Input {...register('phone')} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('form.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {coordinator ? t('form.save') : t('form.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
