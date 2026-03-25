import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import { upsertDepartmentConstraint } from '../api/constraints.api'

export function useUpsertDepartmentConstraint() {
  const { t } = useTranslation('constraints')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      departmentId,
      data,
    }: {
      departmentId: number
      data: {
        morningCapacity: number
        eveningCapacity: number
        electiveCapacity: number
        blockedStartDate?: string | null
        blockedEndDate?: string | null
      }
    }) => upsertDepartmentConstraint(departmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints', 'departments'] })
      toast.success(t('toast.departmentSaved'))
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : t('toast.departmentSaved')
      toast.error(message)
    },
  })
}
