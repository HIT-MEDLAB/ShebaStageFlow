import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAdmin, updateAdmin, deleteAdmin } from '../api/admins.api'
import type { AdminFormValues } from '../schemas/admin.schemas'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useAdminMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('admins')

  const createMutation = useMutation({
    mutationFn: (data: AdminFormValues) => createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      toast.success(t('toast.created'))
    },
    onError: () => {
      toast.error(t('toast.createFailed'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminFormValues> }) =>
      updateAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      toast.success(t('toast.updated'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      toast.success(t('toast.deleted'))
    },
    onError: () => {
      toast.error(t('toast.deleteFailed'))
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
