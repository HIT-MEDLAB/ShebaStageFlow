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
import { adminFormSchema, type AdminFormValues } from '../schemas/admin.schemas'
import type { Admin } from '../types/admin.types'

interface AdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  admin: Admin | null
  onSubmit: (data: AdminFormValues) => void
  isPending: boolean
}

export function AdminDialog({
  open,
  onOpenChange,
  admin,
  onSubmit,
  isPending,
}: AdminDialogProps) {
  const { t } = useTranslation('admins')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (!open) return
    if (admin) {
      reset({
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone ?? '',
      })
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      })
    }
  }, [admin, open, reset])

  function handleFormSubmit(data: AdminFormValues) {
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {admin ? t('dialog.editTitle') : t('dialog.addTitle')}
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
              {admin ? t('form.save') : t('form.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
