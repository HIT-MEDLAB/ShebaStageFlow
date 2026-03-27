import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCoordinator, updateCoordinator, deleteCoordinator } from '../api/coordinators.api'
import type { CoordinatorFormValues } from '../schemas/coordinator.schemas'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useCoordinatorMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('coordinators')

  const createMutation = useMutation({
    mutationFn: (data: CoordinatorFormValues) => createCoordinator(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinators'] })
      toast.success(t('toast.created'))
    },
    onError: () => {
      toast.error(t('toast.createFailed'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CoordinatorFormValues> }) =>
      updateCoordinator(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinators'] })
      toast.success(t('toast.updated'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCoordinator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinators'] })
      toast.success(t('toast.deleted'))
    },
    onError: () => {
      toast.error(t('toast.deleteFailed'))
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
