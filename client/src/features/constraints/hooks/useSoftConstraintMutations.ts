import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createSoftConstraint,
  updateSoftConstraint,
  deleteSoftConstraint,
} from '../api/constraints.api'
import type { CreateSoftConstraintData, UpdateSoftConstraintData } from '../types/constraints.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useSoftConstraintMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('constraints')

  const createMutation = useMutation({
    mutationFn: (data: CreateSoftConstraintData) => createSoftConstraint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.constraintCreated'))
    },
    onError: () => {
      toast.error(t('toast.createFailed'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSoftConstraintData }) =>
      updateSoftConstraint(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.constraintUpdated'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSoftConstraint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.constraintDeleted'))
    },
    onError: () => {
      toast.error(t('toast.deleteFailed'))
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
