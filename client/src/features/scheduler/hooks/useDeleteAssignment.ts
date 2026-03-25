import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteAssignment } from '../api/scheduler.api'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: (id: number) => deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
      toast.success(t('toast.assignmentDeleted'))
    },
    onError: () => {
      toast.error(t('toast.deleteFailed'))
    },
  })
}
