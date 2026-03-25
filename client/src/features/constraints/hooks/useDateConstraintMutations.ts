import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import {
  createDateConstraint,
  updateDateConstraint,
  deleteDateConstraint,
} from '../api/constraints.api'

export function useCreateDateConstraint() {
  const { t } = useTranslation('constraints')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; description: string; startDate: string; endDate: string }) =>
      createDateConstraint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints', 'date'] })
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

export function useUpdateDateConstraint() {
  const { t } = useTranslation('constraints')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: {
        name?: string
        description?: string
        startDate?: string
        endDate?: string
        isActive?: boolean
      }
    }) => updateDateConstraint(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['constraints', 'date'] })
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

export function useDeleteDateConstraint() {
  const { t } = useTranslation('constraints')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteDateConstraint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints', 'date'] })
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
