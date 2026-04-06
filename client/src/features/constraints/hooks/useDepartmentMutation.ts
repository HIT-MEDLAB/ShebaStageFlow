import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  createDepartmentWithConstraint,
  updateDepartmentWithConstraint,
  deleteDepartment,
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
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
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
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.departmentUpdated'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.departmentDeleted'))
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error(t('toast.departmentHasAssignments'))
      } else {
        toast.error(t('toast.deleteFailed'))
      }
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
