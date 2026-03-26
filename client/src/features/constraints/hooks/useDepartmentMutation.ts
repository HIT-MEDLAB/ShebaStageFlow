import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createDepartmentWithConstraint,
  updateDepartmentWithConstraint,
} from '../api/constraints.api'
import type { CreateDepartmentData, UpdateDepartmentData } from '../types/constraints.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useDepartmentMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('constraints')

  const createMutation = useMutation({
    mutationFn: (data: CreateDepartmentData) => createDepartmentWithConstraint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      toast.success(t('toast.departmentCreated'))
    },
    onError: () => {
      toast.error(t('toast.createFailed'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDepartmentData }) =>
      updateDepartmentWithConstraint(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      toast.success(t('toast.departmentUpdated'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })

  return { createMutation, updateMutation }
}
