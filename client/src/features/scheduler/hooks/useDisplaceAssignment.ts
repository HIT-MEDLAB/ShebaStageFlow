import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { displaceAssignment } from '../api/scheduler.api'
import type { DisplaceAssignmentDto } from '../types/scheduler.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { invalidateConstraintsOn422 } from '../utils/invalidateOnConstraintError'

export function useDisplaceAssignment() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DisplaceAssignmentDto }) =>
      displaceAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
      toast.success(t('toast.replacementSuccess'))
    },
    onError: (err) => {
      invalidateConstraintsOn422(queryClient, err)
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        const violations = err.response.data?.errors as { messageKey: string; params?: Record<string, string> }[] | undefined
        if (violations?.length) {
          violations.forEach((v) => toast.error(t(v.messageKey, v.params)))
          return
        }
      }
      toast.error(t('toast.moveFailed'))
    },
  })
}
