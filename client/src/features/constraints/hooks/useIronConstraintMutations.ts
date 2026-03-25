import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import {
  createIronConstraint,
  updateIronConstraint,
  deleteIronConstraint,
} from '../api/constraints.api'

export function useCreateIronConstraint() {
  const { t } = useTranslation('constraints')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; description: string }) => createIronConstraint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints', 'iron'] })
      toast.success(t('toast.created'))
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : t('toast.created')
      toast.error(message)
    },
  })
}

export function useUpdateIronConstraint() {
  const { t } = useTranslation('constraints')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { name?: string; description?: string; isActive?: boolean }
    }) => updateIronConstraint(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['constraints', 'iron'] })
      if (variables.data.isActive !== undefined) {
        toast.success(variables.data.isActive ? t('toast.toggledOn') : t('toast.toggledOff'))
      } else {
        toast.success(t('toast.updated'))
      }
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : t('toast.updated')
      toast.error(message)
    },
  })
}

export function useDeleteIronConstraint() {
  const { t } = useTranslation('constraints')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteIronConstraint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints', 'iron'] })
      toast.success(t('toast.deleted'))
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : t('toast.deleted')
      toast.error(message)
    },
  })
}
