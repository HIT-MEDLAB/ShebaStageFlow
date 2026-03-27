import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { updateProfile } from '@/features/auth/api/auth.api'
import type { AuthUser } from '@/features/auth/types/auth.types'

const profileFormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  repeatPassword: z.string().optional(),
}).refine(
  (data) => !data.newPassword || (data.newPassword.length >= 6),
  { message: 'Password must be at least 6 characters', path: ['newPassword'] },
).refine(
  (data) => !data.newPassword || data.currentPassword,
  { message: 'Current password is required', path: ['currentPassword'] },
).refine(
  (data) => !data.newPassword || data.newPassword === data.repeatPassword,
  { message: 'Passwords do not match', path: ['repeatPassword'] },
)

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AuthUser
}

export function EditProfileDialog({ open, onOpenChange, user }: EditProfileDialogProps) {
  const { t } = useTranslation('settings')
  const { setUser } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      currentPassword: '',
      newPassword: '',
      repeatPassword: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      currentPassword: '',
      newPassword: '',
      repeatPassword: '',
    })
  }, [user, open, reset])

  async function handleFormSubmit(data: ProfileFormValues) {
    setIsPending(true)
    try {
      const payload: Record<string, string> = {}
      if (data.name !== user.name) payload['name'] = data.name
      if (data.email !== user.email) payload['email'] = data.email
      if (data.phone !== (user.phone ?? '')) payload['phone'] = data.phone ?? ''
      if (data.newPassword) {
        payload['currentPassword'] = data.currentPassword!
        payload['newPassword'] = data.newPassword
      }

      if (Object.keys(payload).length === 0) {
        onOpenChange(false)
        return
      }

      const updated = await updateProfile(payload)
      setUser(updated)
      toast.success(t('profile.success'))
      onOpenChange(false)
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ?? t('profile.errors.updateFailed')
        : t('profile.errors.updateFailed')
      toast.error(message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('profile.dialogTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('profile.name')}</Label>
            <Input {...register('name')} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('profile.email')}</Label>
            <Input type="email" {...register('email')} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('profile.phone')}</Label>
            <Input {...register('phone')} />
          </div>

          <Separator />

          <p className="text-sm font-medium text-muted-foreground">{t('profile.changePassword')}</p>

          <div className="flex flex-col gap-1.5">
            <Label>{t('profile.currentPassword')}</Label>
            <Input type="password" {...register('currentPassword')} />
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('profile.newPassword')}</Label>
            <Input type="password" {...register('newPassword')} />
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('profile.repeatPassword')}</Label>
            <Input type="password" {...register('repeatPassword')} />
            {errors.repeatPassword && (
              <p className="text-sm text-destructive">{errors.repeatPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('profile.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t('profile.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
