import { useMutation, useQueryClient } from '@tanstack/react-query'
import { displaceAssignment } from '../api/scheduler.api'
import type { DisplaceAssignmentDto } from '../types/scheduler.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

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
    onError: () => {
      toast.error(t('toast.moveFailed'))
    },
  })
}
