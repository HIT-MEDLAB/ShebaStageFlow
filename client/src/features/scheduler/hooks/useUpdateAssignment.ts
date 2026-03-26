import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateAssignment } from '../api/scheduler.api'
import type { UpdateAssignmentDto } from '../types/scheduler.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useUpdateAssignment() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAssignmentDto }) =>
      updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
      toast.success(t('toast.assignmentUpdated'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })
}
